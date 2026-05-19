import { opportunityRepository } from './opportunity.repository';
import { ResponseGenerator } from '../../domain/agent/response.generator';
import { AgentConfigStore } from '../../domain/agent/agent-config.store';
import { config as envConfig } from '../../config/env';
import { prisma as dbPrisma } from '../../shared/db';
import { logger } from '../../shared/logger';
import { scoringService } from './scoring.service';
import { whatsappProvider } from '../messaging/whatsapp.provider';

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

      // 🤖 GERAÇÃO DE MENSAGEM VIA IA
      const configStore = new AgentConfigStore(envConfig.AGENT_CONFIG_PATH, {} as any);
      await configStore.init();
      const agentConfig = configStore.getConfig();
      
      const generator = new ResponseGenerator(
        envConfig.OPENAI_API_KEY || '',
        envConfig.OPENAI_MODEL,
        agentConfig as any
      );

      // Busca contexto para a IA
      const lastMessages = await dbPrisma.message.findMany({
        where: { lead: { phone: candidate.contact.phone } },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      const history = lastMessages.reverse().map(m => ({
        role: (m.direction === 'incoming' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content
      }));

      const message = await generator.generateReply({
        leadName: candidate.contact.name || 'cliente',
        phone: candidate.contact.phone,
        incomingMessage: "[SISTEMA: GERE UMA MENSAGEM DE REATIVAÇÃO AMIGÁVEL BASEADA NO HISTÓRICO ACIMA. NÃO DIGA OLÁ SE JÁ CONVERSAMOS. PERGUNTE SOBRE O PROJETO OU OBRA ESPECÍFICA.]",
        intent: 'TRIAGE',
        score: score,
        history: history as any
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
