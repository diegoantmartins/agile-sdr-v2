import { prisma } from '../../shared/db';
import { Opportunity, Budget, Contact } from '@prisma/client';

export class OpportunityRepository {
  async findEligibleBudgets() {
    // In a real scenario, this would apply the filters from CampaignRules
    // For now, we fetch budgets created > 7 days ago with no active opportunity or non-closed stage
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return prisma.budget.findMany({
      where: {
        budgetDate: { lte: sevenDaysAgo },
        opportunities: {
          none: {
            stage: { in: ['contacted', 'replied', 'human_handoff'] }
          }
        }
      },
      include: {
        contact: true,
        opportunities: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  }

  async createOpportunity(data: {
    budgetId: string;
    contactId: string;
    priorityScore: number;
    reactivationReason: string;
  }) {
    return prisma.opportunity.create({
      data: {
        budgetId: data.budgetId,
        contactId: data.contactId,
        priorityScore: data.priorityScore,
        reactivationReason: data.reactivationReason,
        stage: 'reactivation_pending'
      }
    });
  }

  async markOutreachSent(opportunityId: string, content: string) {
    return prisma.$transaction([
      prisma.opportunity.update({
        where: { id: opportunityId },
        data: {
          stage: 'contacted',
          lastOutreachAt: new Date()
        }
      }),
      prisma.message.create({
        data: {
          opportunityId,
          direction: 'outgoing',
          content,
          sentAt: new Date()
        }
      })
    ]);
  }
}

export const opportunityRepository = new OpportunityRepository();
