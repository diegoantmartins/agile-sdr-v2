import { Agenda } from '@hokify/agenda';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { uazapi } from '@/infra/uazapi/client';

interface DailyDispatchConfig {
  batchSize: number;      // Leads per batch
  maxBatches: number;     // Max total batches
  delayBetweenBatches: number;  // ms
  debugMode: boolean;
}

export async function setupDailyDispatchJob(
  agenda: Agenda,
  prisma: PrismaClient,
  logger: Logger,
  config: DailyDispatchConfig = {
    batchSize: 500,
    maxBatches: 100,
    delayBetweenBatches: 1000,
    debugMode: false
  }
) {
  agenda.define('daily-dispatch-batches', async (job) => {
    const jobStartTime = Date.now();
    let totalDispatched = 0;
    let failures = 0;

    try {
      logger.info(`[DISPATCH] Starting daily batch dispatch`, {
        batchSize: config.batchSize,
        maxBatches: config.maxBatches
      });

      for (let batchIndex = 0; batchIndex < config.maxBatches; batchIndex++) {
        const leads = await prisma.lead.findMany({
          where: {
            status: 'HOT',
            lastDispatch: {
              lt: new Date(Date.now() - 24 * 3600 * 1000)
            }
          },
          take: config.batchSize,
          skip: batchIndex * config.batchSize,
          select: {
            id: true,
            phone: true,
            name: true,
            company: true,
            score: true,
            source: true
          }
        });

        if (leads.length === 0) {
          logger.info(`[DISPATCH] No more leads to dispatch at batch ${batchIndex}`);
          break;
        }

        // Process batch
        const dispatchResults = await Promise.allSettled(
          leads.map(lead => dispatchToLead(lead, prisma, logger, config.debugMode))
        );

        // Count successes and failures
        const batchDispatched = dispatchResults.filter(
          r => r.status === 'fulfilled' && r.value
        ).length;

        const batchFailed = dispatchResults.filter(
          r => r.status === 'rejected'
        ).length;

        totalDispatched += batchDispatched;
        failures += batchFailed;

        logger.info(`[DISPATCH] Batch ${batchIndex + 1} complete`, {
          leads_in_batch: leads.length,
          success: batchDispatched,
          failed: batchFailed,
          runtime_ms: Date.now() - jobStartTime
        });

        // Delay between batches to avoid overwhelming UAZAPI
        if (batchIndex < config.maxBatches - 1 && leads.length === config.batchSize) {
          await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
        }
      }

      const totalTime = Date.now() - jobStartTime;
      logger.info(`[DISPATCH] Daily dispatch complete`, {
        total_dispatched: totalDispatched,
        total_failures: failures,
        total_time_ms: totalTime,
        avg_per_lead_ms: (totalTime / (totalDispatched + failures)).toFixed(2)
      });

    } catch (error) {
      logger.error(`[DISPATCH] Critical error during batch dispatch`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error; // Re-throw so Agenda handles retry
    }
  });

  // Schedule for daily execution at 9 AM
  await agenda.every('0 9 * * *', 'daily-dispatch-batches');

  logger.info('[DISPATCH] Daily dispatch job scheduled for 09:00 UTC');
}

async function dispatchToLead(
  lead: { id: string; phone: string; name: string; company: string; score: number; source: string },
  prisma: PrismaClient,
  logger: Logger,
  debugMode: boolean
): Promise<boolean> {
  try {
    const message = generateDispatchMessage(lead);

    if (debugMode) {
      logger.debug(`[DISPATCH] Would send to ${lead.phone}: ${message}`);
      return true;
    }

    // Call UAZAPI
    const response = await uazapi.send({
      to: lead.phone,
      message: message,
      // Optional: Include buttons/quick replies
      context: {
        lead_id: lead.id,
        company: lead.company
      }
    });

    // Update lead with dispatch timestamp
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        lastDispatch: new Date(),
        status: 'FOLLOW_UP'  // Mark as follow-up sent
      }
    });

    logger.debug(`[DISPATCH] Successfully sent to ${lead.phone}`, {
      lead_id: lead.id,
      message_id: response?.message_id
    });

    return true;

  } catch (error) {
    logger.warn(`[DISPATCH] Failed to dispatch to ${lead.phone}`, {
      error: error instanceof Error ? error.message : String(error),
      lead_id: lead.id
    });
    throw error;
  }
}

function generateDispatchMessage(lead: { name: string; company: string; score: number }): string {
  // Customize based on lead score
  const greeting = lead.score > 80 ? 'Olá' : 'Oi';
  const baseMessage = `${greeting} ${lead.name}, tudo bem?`;

  if (lead.score > 80) {
    return `${baseMessage} Continuando nossa conversa sobre soluções para ${lead.company}... 🚀`;
  } else if (lead.score > 60) {
    return `${baseMessage} Gostaria de compartilhar como podemos ajudar ${lead.company}. Você tem 5 min? ⏰`;
  } else {
    return `${baseMessage} Voltando com uma update especial para ${lead.company}. Quer saber? 👀`;
  }
}

// Export for manual testing
export async function manualDispatchTrigger(
  prisma: PrismaClient,
  logger: Logger,
  limit: number = 10
) {
  logger.info(`[DISPATCH] Manual trigger - dispatching to ${limit} leads`);

  const leads = await prisma.lead.findMany({
    where: { status: 'HOT' },
    take: limit,
    orderBy: { score: 'desc' }
  });

  for (const lead of leads) {
    await dispatchToLead(lead, prisma, logger, false);
  }

  logger.info(`[DISPATCH] Manual dispatch complete`);
}
