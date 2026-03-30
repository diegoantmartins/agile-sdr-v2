export interface ScoringInput {
  budgetDate: Date;
  status?: string | null;
  budgetValue?: number | null;
  lastResponseAt?: Date | null;
}

export class ScoringService {
  calculate(input: ScoringInput): number {
    let score = 0;

    const daysSinceBudget = Math.floor(
      (Date.now() - new Date(input.budgetDate).getTime()) / 86400000
    );

    // Score based on recency
    if (daysSinceBudget >= 7 && daysSinceBudget <= 30) score += 30;
    else if (daysSinceBudget > 30 && daysSinceBudget <= 90) score += 20;
    else if (daysSinceBudget > 90) score += 10;

    // Score based on engagement
    if (!input.lastResponseAt) score += 20;

    // Score based on status
    if (input.status === "sent" || input.status === "pending") score += 25;

    // Score based on value (Construction niche - budgets > 10k are high value)
    if ((input.budgetValue ?? 0) > 10000) score += 15;

    return score;
  }
}

export const scoringService = new ScoringService();
