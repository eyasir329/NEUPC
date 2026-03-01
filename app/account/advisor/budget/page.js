/**
 * @file Advisor budget tracker — displays all income / expense entries
 *   alongside a summary (total income, total expenses, balance) for
 *   financial oversight of the club.
 * @module AdvisorBudgetPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getAllBudgetEntries, getBudgetSummary } from '@/app/_lib/data-service';
import AdvisorBudgetClient from './_components/AdvisorBudgetClient';

export const metadata = { title: 'Budget | Advisor | NEUPC' };

export default async function AdvisorBudgetPage() {
  const { user } = await requireRole('advisor');

  const [budgetEntries, summary] = await Promise.all([
    getAllBudgetEntries().catch(() => []),
    getBudgetSummary().catch(() => ({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    })),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AdvisorBudgetClient
        budgetEntries={budgetEntries}
        summary={summary}
        advisorId={user.id}
      />
    </div>
  );
}
