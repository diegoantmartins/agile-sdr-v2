import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { env } from './config/env';
import { logger } from './shared/logger';
import { webhookHandler } from './modules/messaging/webhook.handler';
import { reactivationJob } from './modules/jobs/reactivation.job';
import { prisma } from './shared/db';

const app = Fastify({
  logger: false // We use our custom pino logger
});

app.register(fastifyCors, { origin: true });

// ======================== WEBHOOKS ========================

app.post('/webhooks/uazapi', async (request, reply) => {
  await (webhookHandler as any).handleUazapi(request, reply);
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

// ======================== ADMIN / JOBS ========================

app.post('/jobs/reactivation/trigger', async (request, reply) => {
  if (request.headers.authorization !== `Bearer ${env.UAZAPI_KEY}`) {
    return reply.status(401).send();
  }
  
  reactivationJob.execute().catch(err => logger.error({ err }, '[App] Job trigger failed'));
  
  return { message: 'Reactivation job triggered' };
});

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
