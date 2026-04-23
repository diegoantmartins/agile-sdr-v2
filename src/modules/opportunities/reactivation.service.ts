import { logger } from '../../shared/logger';
import { scoringService } from './scoring.service';
import { messageBuilder } from '../messaging/message.builder';
import { whatsappProvider } from '../messaging/whatsapp.provider';
import { opportunityRepository } from './opportunity.repository';

export interface ReactivationCandidate {
  id: string; // Budget ID
  contact: {
    id: string;
    name: string | null;
    phone: string;
  };
  productName: string | null;
  projectName: string | null;
  budgetDate: Date;
  status: string | null;
  budgetValue: any; // Decimal from Prisma
}

export class ReactivationService {
  async processCandidate(candidate: ReactivationCandidate): Promise<void> {
    const logTag = `[Reactivation] Budget:${candidate.id}`;

    try {
      const score = scoringService.calculate({
        budgetDate: candidate.budgetDate,
        status: candidate.status,
        budgetValue: candidate.budgetValue ? Number(candidate.budgetValue) : null,
      });

      logger.info({ budgetId: candidate.id, score }, `${logTag} Scoring candidate`);

      if (score < 40) {
        logger.debug(`${logTag} Score too low (${score}), skipping.`);
        return;
      }

      // Create opportunity tracking
      const opportunity = await opportunityRepository.createOpportunity({
        budgetId: candidate.id,
        contactId: candidate.contact.id,
        priorityScore: score,
        reactivationReason: `Auto-reactivation for ${candidate.productName}`,
      });

      const message = messageBuilder.buildFirstTouch({
        name: candidate.contact.name,
        projectName: candidate.projectName,
      });

      // Send via WhatsApp
      await whatsappProvider.sendText(candidate.contact.phone, message);

      // Log success
      await opportunityRepository.markOutreachSent(opportunity.id, message);
      
      logger.info(`${logTag} Reactivation outreach sent successfully.`);
    } catch (error) {
      logger.error({ error, budgetId: candidate.id }, `${logTag} Failed to process candidate`);
    }
  }

  async runReactivationCycle(): Promise<void> {
    logger.info('[Reactivation] Starting reactivation cycle...');
    
    const candidates = await opportunityRepository.findEligibleBudgets();
    
    logger.info(`[Reactivation] Found ${candidates.length} eligible budgets`);

    for (const budget of candidates) {
      await this.processCandidate({
        id: budget.id,
        contact: {
          id: budget.contact.id,
          name: budget.contact.name,
          phone: budget.contact.phone
        },
        productName: budget.productName,
        projectName: budget.projectName,
        budgetDate: budget.budgetDate,
        status: budget.status,
        budgetValue: budget.budgetValue
      });
    }

    logger.info('[Reactivation] Cycle completed.');
  }
}

export const reactivationService = new ReactivationService();
