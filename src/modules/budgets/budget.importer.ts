import { prisma } from '../../shared/db';
import { logger } from '../../shared/logger';

export interface RawBudget {
  externalId: string;
  contactName: string;
  phone: string;
  productName: string;
  budgetValue: number;
  budgetDate: string;
  projectName?: string;
}

export class BudgetImporter {
  async importArray(budgets: RawBudget[]) {
    logger.info(`[Importer] Starting import of ${budgets.length} budgets`);

    for (const b of budgets) {
      try {
        // Upsert contact
        const contact = await prisma.contact.upsert({
          where: { phone: b.phone },
          update: { name: b.contactName },
          create: { phone: b.phone, name: b.contactName }
        });

        // Create budget
        await prisma.budget.create({
          data: {
            externalId: b.externalId,
            contactId: contact.id,
            productName: b.productName,
            budgetValue: b.budgetValue,
            budgetDate: new Date(b.budgetDate),
            projectName: b.projectName,
            source: 'manual_import'
          }
        });
      } catch (error) {
        logger.error({ error, externalId: b.externalId }, '[Importer] Error importing budget');
      }
    }

    logger.info('[Importer] Import completed.');
  }
}

export const budgetImporter = new BudgetImporter();
