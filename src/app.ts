import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fs from 'fs';
import path from 'path';
import { env } from './config/env';
import { logger } from './shared/logger';
import { webhookHandler } from './modules/messaging/webhook.handler';
import { reactivationJob } from './modules/jobs/reactivation.job';
import { prisma } from './shared/db';
import { isWebhookAuthorized } from './application/webhooks/webhook-auth';
import { buildAgentConfigPage } from './presentation/admin/agent-config.page';
import { LeadService } from './domain/lead/lead.service';
import { integrationHubService } from './services/integrations/integration-hub.service';
import { commercialEngineService } from './services/commercial/commercial-engine.service';
import { IntegrationProvider, PROVIDER_CAPABILITIES } from './domain/integrations/integration.types';
import { getUAZAPIClient } from './infra/uazapi/uazapi.client';
import { chatService } from './services/chatwootService';

const app = Fastify({
  logger: false // We use our custom pino logger
});

app.register(fastifyCors, { origin: true });

const leadService = new LeadService(prisma);
const uazapiClient = getUAZAPIClient();

async function handleUazapiWebhook(request: any, reply: any) {
  const authorized = isWebhookAuthorized(request.headers, {
    expectedSecret: env.UAZAPI_WEBHOOK_SECRET
  });

  if (!authorized) {
    return reply.status(401).send({ error: 'Unauthorized webhook' });
  }

  await (webhookHandler as any).handleUazapi(request, reply);
}

function resolveTenantId(request: any): string | null {
  const tenantId = (request.headers['x-tenant-id'] as string | undefined)?.trim();
  return tenantId ? tenantId : null;
}

// ======================== WEBHOOKS ========================

app.post('/webhooks/uazapi', handleUazapiWebhook);
app.post('/webhooks/uazapi/message', handleUazapiWebhook);

app.post('/webhooks/chatwoot/message-created', async (request, reply) => {
  const authorized = isWebhookAuthorized(request.headers, {
    expectedSecret: env.CHATWOOT_WEBHOOK_SECRET
  });

  if (!authorized) {
    return reply.status(401).send({ error: 'Unauthorized webhook' });
  }

  await (webhookHandler as any).handleChatwoot(request, reply);
});

// ======================== API - DASHBOARD ========================

app.get('/api/dashboard/stats', async () => {
  const [
    totalContacts,
    totalBudgets,
    totalOpportunities,
    opportunitiesByStage,
    recentMessages,
    hotOpportunities
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.budget.count(),
    prisma.opportunity.count(),
    prisma.opportunity.groupBy({
      by: ['stage'],
      _count: { id: true },
    }),
    prisma.message.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    prisma.opportunity.count({ where: { temperature: 'hot' } }),
  ]);

  const pipeline = opportunitiesByStage.map(s => ({
    stage: s.stage,
    count: s._count.id
  }));

  return {
    totalContacts,
    totalBudgets,
    totalOpportunities,
    hotOpportunities,
    recentMessages,
    pipeline,
  };
});

app.get('/api/opportunities', async (request) => {
  const { stage, limit } = request.query as any;
  
  const opportunities = await prisma.opportunity.findMany({
    where: stage ? { stage } : undefined,
    include: {
      contact: true,
      budget: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 3 }
    },
    orderBy: { priorityScore: 'desc' },
    take: parseInt(limit) || 50,
  });

  return opportunities;
});

app.get('/api/budgets', async (request) => {
  const { limit } = request.query as any;

  const budgets = await prisma.budget.findMany({
    include: { contact: true },
    orderBy: { budgetDate: 'desc' },
    take: parseInt(limit) || 50,
  });

  return budgets;
});

app.post('/api/budgets/import', async (request, reply) => {
  const { budgets } = request.body as any;
  
  if (!Array.isArray(budgets)) {
    return reply.code(400).send({ error: 'Body must contain { budgets: [...] }' });
  }

  const { budgetImporter } = await import('./modules/budgets/budget.importer');
  await budgetImporter.importArray(budgets);

  return { message: `${budgets.length} budgets imported` };
});

app.get('/api/contacts', async () => {
  return prisma.contact.findMany({
    include: {
      budgets: { orderBy: { budgetDate: 'desc' }, take: 3 },
      opportunities: { orderBy: { createdAt: 'desc' }, take: 3 }
    },
    orderBy: { createdAt: 'desc' },
  });
});

app.get('/api/messages/recent', async () => {
  return prisma.message.findMany({
    include: {
      opportunity: {
        include: { contact: true, budget: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
});

// ======================== API - LEADS ========================
app.get('/api/leads', async (request, reply) => {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return reply.status(400).send({ error: 'x-tenant-id header required' });
  }

  return prisma.activeLead.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' }
  });
});

app.post('/api/leads', async (request, reply) => {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return reply.status(400).send({ error: 'x-tenant-id header required' });
  }

  const { phone, name, email, company, source, campaignId, metadata } = request.body as any;
  if (!phone || !name) {
    return reply.status(400).send({ error: 'phone and name are required' });
  }

  const lead = await leadService.createLead({
    tenantId,
    phone,
    name,
    email,
    company,
    source,
    campaignId,
    metadata
  });

  return reply.status(201).send(lead);
});

app.get('/api/leads/hot', async (request, reply) => {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return reply.status(400).send({ error: 'x-tenant-id header required' });
  }

  return leadService.getHotLeads(tenantId);
});

app.get('/api/leads/:phone', async (request, reply) => {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return reply.status(400).send({ error: 'x-tenant-id header required' });
  }

  const params = request.params as any;
  const lead = await leadService.getLead(tenantId, params.phone as string);
  if (!lead) {
    return reply.status(404).send({ error: 'Lead not found' });
  }

  return lead;
});

app.put('/api/leads/:phone', async (request, reply) => {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return reply.status(400).send({ error: 'x-tenant-id header required' });
  }

  const params = request.params as any;
  const data = request.body as any;
  try {
    const updatedLead = await leadService.updateLead(tenantId, params.phone as string, data);
    return updatedLead;
  } catch (error: any) {
    return reply.status(404).send({ error: error.message || 'Lead not found' });
  }
});

// ======================== API - INTEGRATIONS ========================
app.get('/api/integrations/providers', async () => {
  return Object.entries(PROVIDER_CAPABILITIES).map(([provider, actions]) => ({ provider, actions }));
});

app.post('/api/integrations/:provider/actions', async (request, reply) => {
  const params = request.params as any;
  const provider = params.provider as IntegrationProvider;
  const integrationKey = (request.headers['x-integration-key'] as string | undefined) ?? '';
  if (env.INTEGRATION_KEY && integrationKey !== env.INTEGRATION_KEY) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const { action, payload } = request.body as any;
  if (!action || payload === undefined) {
    return reply.status(400).send({ error: 'Body must contain { action, payload }' });
  }

  return integrationHubService.execute({ provider, action, payload });
});

// ======================== API - COMMERCIAL ENGINE ========================
app.get('/api/commercial/templates', async () => {
  return commercialEngineService.getTemplates();
});

app.get('/api/commercial/templates/:niche', async (request, reply) => {
  try {
    const params = request.params as any;
    return commercialEngineService.getTemplateByNiche(params.niche as string);
  } catch (error: any) {
    return reply.status(404).send({ error: error.message || 'Template not found' });
  }
});

app.post('/api/commercial/next-action', async (request, reply) => {
  const { niche, leadStage, intent, score } = request.body as any;
  if (!niche) {
    return reply.status(400).send({ error: 'niche is required' });
  }

  try {
    return commercialEngineService.getNextBestAction({ niche, leadStage, intent, score });
  } catch (error: any) {
    return reply.status(400).send({ error: error.message || 'Unable to determine next action' });
  }
});

// ======================== ADMIN / JOBS ========================

app.post('/jobs/reactivation/trigger', async (request, reply) => {
  if (request.headers.authorization !== `Bearer ${env.UAZAPI_KEY}`) {
    return reply.status(401).send();
  }
  
  reactivationJob.execute().catch(err => logger.error({ err }, '[App] Job trigger failed'));
  
  return { message: 'Reactivation job triggered' };
});

// ======================== ADMIN / CONSOLE WEB ========================

const AGENT_CONFIG_PATH = path.resolve(process.cwd(), 'data', 'agent-config.json');

function readAgentConfig(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(AGENT_CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

app.get('/admin', async (_, reply) => {
  reply.type('text/html').send(buildAgentConfigPage());
});

app.get('/api/admin/agent-config', async (request, reply) => {
  const token = (request.headers['x-admin-token'] as string | undefined) ?? '';
  if (env.ADMIN_CONFIG_TOKEN && token !== env.ADMIN_CONFIG_TOKEN) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  return readAgentConfig();
});

app.put('/api/admin/agent-config', async (request, reply) => {
  const token = (request.headers['x-admin-token'] as string | undefined) ?? '';
  if (env.ADMIN_CONFIG_TOKEN && token !== env.ADMIN_CONFIG_TOKEN) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const incoming = request.body as Record<string, unknown>;
  const merged = { ...readAgentConfig(), ...incoming };
  fs.mkdirSync(path.dirname(AGENT_CONFIG_PATH), { recursive: true });
  fs.writeFileSync(AGENT_CONFIG_PATH, JSON.stringify(merged, null, 2));
  logger.info('[Admin] agent-config.json updated');
  return merged;
});

// ======================== TEST ENDPOINTS ========================

if (env.NODE_ENV !== 'production' || env.ENABLE_TEST_ENDPOINTS) {
  app.get('/test/database', async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true };
  });

  app.get('/test/uazapi', async () => {
    const success = await uazapiClient.healthCheck();
    return { success };
  });

  app.get('/test/chatwoot', async () => {
    const success = await chatService.testConnection();
    return { success };
  });

  app.get('/test/all', async () => {
    const [database, uazapi, chatwoot] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      uazapiClient.healthCheck(),
      chatService.testConnection(),
    ]);

    return { database, uazapi, chatwoot };
  });
}

// ======================== HEALTH ========================

app.get('/health', async () => {
  return { 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: env.REDIS_URL ? 'configured' : 'not configured',
      whatsapp: env.UAZAPI_URL !== 'http://localhost:9999' ? 'configured' : 'dev-mode',
    }
  };
});

export default app;
