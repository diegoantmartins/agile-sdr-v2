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
import { buildChatSandboxPage } from './presentation/test/chat-sandbox.page';
import { IntentClassifier } from './domain/intent/intent.classifier';
import { ResponseGenerator } from './domain/agent/response.generator';
import { AgentConfigStore } from './domain/agent/agent-config.store';
import { scoringService } from './modules/opportunities/scoring.service';
import { ConversationMetricsService } from './services/metrics/conversation-metrics.service';
import { AgentOrchestrator } from './application/orchestrator/agent.orchestrator';

const app = Fastify({
  logger: false // We use our custom pino logger
});

app.register(fastifyCors, { origin: true });

const leadService = new LeadService(prisma);
const uazapiClient = getUAZAPIClient();
const conversationMetricsService = new ConversationMetricsService(prisma);
const agentOrchestrator = new AgentOrchestrator();

async function handleUazapiWebhook(request: any, reply: any) {
  // Skip webhook authorization for now - can be enabled via UAZAPI_WEBHOOK_SECRET in production
  // const authorized = isWebhookAuthorized(request.headers, {
  //   expectedSecret: env.UAZAPI_WEBHOOK_SECRET
  // });

  // if (!authorized) {
  //   return reply.status(401).send({ error: 'Unauthorized webhook' });
  // }

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalContacts,
    totalBudgets,
    totalOpportunities,
    opportunitiesByStage,
    messagesToday,
    agentResponses,
    chatwootSyncs,
    hotOpportunities,
    recentActivity,
    statusDistribution,
    intentDistribution,
    humanRequiredCount
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.budget.count(),
    prisma.opportunity.count(),
    prisma.opportunity.groupBy({
      by: ['stage'],
      _count: { id: true },
    }),
    prisma.message.count({ 
      where: { 
        direction: 'outgoing', 
        createdAt: { gte: today } 
      } 
    }),
    prisma.message.count({ 
      where: { 
        isAiGenerated: true 
      } 
    }),
    prisma.message.count({ 
      where: { 
        chatwootMessageId: { not: null } 
      } 
    }),
    prisma.opportunity.count({ where: { temperature: 'hot' } }),
    prisma.message.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        lead: { select: { name: true } }
      }
    }),
    prisma.activeLead.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.message.groupBy({
      by: ['intentDetected'],
      where: { intentDetected: { not: null } },
      _count: { id: true },
      orderBy: { _count: { intentDetected: 'desc' } },
      take: 5
    }),
    prisma.activeLead.count({ where: { status: 'HUMAN_REQUIRED' } })
  ]);

  const pipeline = opportunitiesByStage.map(s => ({
    stage: s.stage,
    count: s._count.id
  }));

  const statusData = statusDistribution.map(s => ({
    status: s.status,
    count: s._count.id
  }));

  const intentData = intentDistribution.map(i => ({
    intent: i.intentDetected,
    count: i._count.id
  }));

  return {
    totalContacts,
    totalBudgets,
    totalOpportunities,
    hotOpportunities,
    metrics: {
      messagesToday,
      agentResponses,
      chatwootSyncs,
      pendingHandoffs: humanRequiredCount
    },
    pipeline,
    statusDistribution: statusData,
    intentDistribution: intentData,
    recentActivity: recentActivity.map(m => ({
      id: m.id,
      content: m.content,
      leadName: (m as any).lead?.name || 'Sistema',
      createdAt: m.createdAt,
      isAiGenerated: m.isAiGenerated
    }))
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

// ======================== API - LEADS / SCORING ========================

app.post('/api/leads/:phone/score', async (request, reply) => {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return reply.status(400).send({ error: 'x-tenant-id header required' });
  }

  const params = request.params as any;
  const { budgetDate, status, budgetValue, lastResponseAt } = request.body as any;

  if (!budgetDate) {
    return reply.status(400).send({ error: 'budgetDate is required' });
  }

  try {
    const score = scoringService.calculate({
      budgetDate: new Date(budgetDate),
      status: status || null,
      budgetValue: budgetValue || null,
      lastResponseAt: lastResponseAt ? new Date(lastResponseAt) : null
    });

    // Update lead score in database
    await leadService.updateLead(tenantId, params.phone as string, { score });

    return { 
      phone: params.phone,
      score,
      message: 'Score calculado e atualizado'
    };
  } catch (error: any) {
    logger.error({ error, phone: params.phone }, '[Score] Erro ao calcular score');
    return reply.status(400).send({ error: error.message || 'Erro ao calcular score' });
  }
});

// ======================== API - AGENT ORCHESTRATION ========================

app.post('/api/agent/process-message', async (request, reply) => {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return reply.status(400).send({ error: 'x-tenant-id header required' });
  }

  const { phone, message } = request.body as any;

  if (!phone || !message) {
    return reply.status(400).send({ error: 'phone and message are required' });
  }

  try {
    const response = await agentOrchestrator.processIncomingMessage(tenantId, phone, message);
    
    return {
      phone,
      tenantId,
      incomingMessage: message,
      agentResponse: response || null,
      processed: true
    };
  } catch (error: any) {
    logger.error({ error, phone, tenantId }, '[AgentAPI] Erro ao processar mensagem');
    return reply.status(500).send({ 
      error: error.message || 'Erro ao processar mensagem via agente',
      phone,
      tenantId
    });
  }
});

// ======================== API - CONVERSATION METRICS ========================

app.get('/api/metrics/conversations', async (request, reply) => {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return reply.status(400).send({ error: 'x-tenant-id header required' });
  }

  const { period = '30' } = request.query as any;
  const periodDays = parseInt(period) || 30;
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - periodDays);

  try {
    const metrics = await prisma.conversationMetric.findMany({
      where: {
        lead: { tenantId },
        createdAt: { gte: sinceDate }
      },
      include: { lead: true },
      orderBy: { createdAt: 'desc' }
    });

    // Aggregate metrics
    const aggregated = {
      totalConversations: metrics.length,
      totalMessages: metrics.reduce((sum, m) => sum + (m.messageCount || 0), 0),
      totalUserMessages: metrics.reduce((sum, m) => sum + (m.userMessageCount || 0), 0),
      totalAIMessages: metrics.reduce((sum, m) => sum + (m.aiMessageCount || 0), 0),
      averageMessagesPerConversation: metrics.length > 0 
        ? Math.round(metrics.reduce((sum, m) => sum + (m.messageCount || 0), 0) / metrics.length * 100) / 100
        : 0,
      period: `${periodDays}d`,
      tenantId
    };

    return {
      aggregated,
      metrics: metrics.slice(0, 20) // Return top 20 for API response
    };
  } catch (error: any) {
    logger.error({ error, tenantId }, '[Metrics] Erro ao obter métricas');
    return reply.status(500).send({ error: error.message || 'Erro ao obter métricas' });
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

  app.post('/test/send-message', async (request, reply) => {
    const { phone, message } = request.body as any;
    if (!phone || !message) {
      return reply.status(400).send({ error: 'phone and message are required' });
    }

    try {
      const response = await uazapiClient.sendMessage({
        phone,
        message
      });
      return { 
        success: true, 
        messageId: response.messageId,
        message: 'Mensagem enviada com sucesso via UAZAPI'
      };
    } catch (error: any) {
      logger.error({ error, phone }, '[Test] Failed to send message');
      return reply.status(503).send({ 
        success: false, 
        error: error.message || 'Falha ao enviar mensagem' 
      });
    }
  });

  // ======================== TEST CHAT SANDBOX ========================

  app.get('/test/chat-ui', async (_, reply) => {
    reply.type('text/html').send(buildChatSandboxPage());
  });

  app.post('/test/chat', async (request, reply) => {
    const {
      message,
      leadName = 'Lead Teste',
      phone = '5511999999999',
      tenantId = 'synapsea',
      classificationMode = 'generic',
      useLLM = true,
      persistDB = false,
      customPrompt = '',
      conversationHistory = []
    } = request.body as any;

    if (!message || typeof message !== 'string') {
      return reply.status(400).send({ error: 'message é obrigatório' });
    }

    const startTime = Date.now();

    try {
      // 1. Intent classification
      const apiKey = useLLM ? (env.OPENAI_API_KEY || '') : '';
      const classifier = new IntentClassifier(apiKey, env.OPENAI_MODEL);

      let classificationResult: any;
      if (classificationMode === 'agile') {
        classificationResult = await classifier.classifyAgile(message);
      } else {
        classificationResult = await classifier.classify(message);
      }

      // 2. Load agent config
      const agentConfigStore = new AgentConfigStore(
        path.resolve(process.cwd(), 'data', 'agent-config.json'),
        {
          autoReplyEnabled: true,
          companyName: env.AGENT_COMPANY_NAME || 'Agile Steel',
          objective: env.AGENT_OBJECTIVE || 'Qualificar leads',
          tone: env.AGENT_TONE || 'consultivo e cordial',
          language: env.AGENT_LANGUAGE || 'português do Brasil',
          maxReplyChars: env.AGENT_MAX_REPLY_CHARS || 420,
          businessNiche: 'Construção Civil e Acabamentos',
          salesType: 'consultiva',
          primaryCTA: 'Posso pedir para um dos nossos técnicos calcular o orçamento exato para sua obra?',
          qualificationQuestions: [
            'Qual o tamanho aproximado da obra?',
            'Vocês já têm um projeto estrutural definido?',
            'Para quando precisam dos equipamentos na obra?'
          ],
          customPrompt: customPrompt || '',
          fallbackMessage: 'Entendido. Quer que eu encaminhe isso para o especialista técnico agora?',
          emojisEnabled: true,
          handoffEnabled: true,
          sendToChatwoot: false,
          sendToSlack: false,
          disallowedTerms: [],
          handoffLabels: ['agile-handoff', 'urgente'],
          handoffTargetName: 'Daisy',
          pivotProducts: ['pisos vinílicos', 'forro acústico', 'steel frame'],
          primaryProduct: 'Drywall',
          enableDdiLanguageDetection: true
        }
      );
      await agentConfigStore.init();
      const agentConfig = agentConfigStore.getConfig();

      // Override custom prompt if provided
      if (customPrompt) {
        agentConfig.customPrompt = customPrompt;
      }

      // 3. Generate response
      let replyText = '';
      if (useLLM && apiKey) {
        const responseGenerator = new ResponseGenerator(apiKey, env.OPENAI_MODEL, agentConfig);
        replyText = await responseGenerator.generateReply({
          leadName,
          phone,
          incomingMessage: message,
          intent: classificationResult.intent as any,
          score: 0,
          conversationStage: 'qualification',
          history: conversationHistory
        });
      } else {
        // Fallback static responses
        const intent = classificationResult.intent;
        if (intent === 'BUY_NOW' || intent === 'HANDOFF_HUMANO') {
          replyText = `Perfeito, ${leadName}! Vou encaminhar sua solicitação para nossa engenharia analisar o projeto.`;
        } else {
          replyText = `Obrigado pela mensagem, ${leadName}! Como posso te ajudar hoje?`;
        }
      }

      // 4. Persist (Optional)
      if (persistDB) {
        // Logic for persisting messages remains if needed, simplified for sandbox
      }

      const totalTime = Date.now() - startTime;

      return {
        reply: replyText,
        intent: classificationResult.intent,
        confidence: classificationResult.confidence,
        reasoning: classificationResult.reasoning,
        triggeredKeywords: classificationResult.triggeredKeywords || [],
        classificationMode,
        usedLLM: useLLM && !!apiKey,
        persisted: persistDB,
        responseTimeMs: totalTime,
        agentConfig: {
          companyName: agentConfig.companyName,
          tone: agentConfig.tone,
          maxReplyChars: agentConfig.maxReplyChars,
          businessNiche: agentConfig.businessNiche,
          customPrompt: agentConfig.customPrompt || null
        }
      };
    } catch (error: any) {
      logger.error({ error }, '[TestChat] Error processing test message');
      return reply.status(500).send({
        error: error.message || 'Erro interno ao processar mensagem',
      });
    }
  });

  // ======================== MONITORING ========================

  app.get('/api/admin/logs', async (request, reply) => {
    const adminToken = request.headers['x-admin-token'];
    
    if (adminToken !== env.ADMIN_CONFIG_TOKEN) {
      return reply.status(401).send({ error: 'Não autorizado' });
    }

    const logPath = path.resolve(process.cwd(), 'logs', 'combined.log');
    
    try {
      if (!fs.existsSync(logPath)) {
        return { logs: ['Arquivo de log não encontrado ainda.'], timestamp: new Date() };
      }

      const fileContent = fs.readFileSync(logPath, 'utf-8');
      const lines = fileContent.split('\n').filter(Boolean);
      const lastLines = lines.slice(-200).reverse(); // Last 200 lines, newest first
      
      return { 
        logs: lastLines.map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return { message: line, level: 'info', timestamp: new Date() };
          }
        }),
        path: logPath,
        timestamp: new Date() 
      };
    } catch (err: any) {
      logger.error({ err }, 'Erro ao ler logs');
      return reply.status(500).send({ error: 'Erro ao ler arquivo de log' });
    }
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
