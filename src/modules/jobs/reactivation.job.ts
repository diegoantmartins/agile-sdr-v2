import { reactivationService } from '../opportunities/reactivation.service';
import { logger } from '../../shared/logger';
import { prisma } from '../../shared/db';

export class ReactivationJob {
  async execute() {
    const startTime = Date.now();
    logger.info('[Job] Starting Daily Reactivation Job');

    const log = await prisma.jobLog.create({
      data: {
        jobType: 'DAILY_REACTIVATION',
        status: 'RUNNING'
      }
    });

    try {
      await reactivationService.runReactivationCycle();
      
      await prisma.jobLog.update({
        where: { id: log.id },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
          duration: Date.now() - startTime
        }
      });
      
      logger.info('[Job] Reactivation Job finished successfully');
    } catch (error: any) {
      logger.error({ error }, '[Job] Reactivation Job failed');
      
      await prisma.jobLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          error: error.message,
          completedAt: new Date(),
          duration: Date.now() - startTime
        }
      });
    }
  }
}

export const reactivationJob = new ReactivationJob();
