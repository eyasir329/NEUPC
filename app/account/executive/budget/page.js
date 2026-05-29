/**
 * @file Executive budget management page server-side entry.
 *   Fetches dynamic budget logs, summary statistics, events list, and bootcamps list in parallel.
 * @module ExecutiveBudgetPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getBudgetSummary,
  getAllBudgetEntries,
  getAllEvents,
  getAllBootcamps,
} from '@/app/_lib/services/data-service';
import ExecutiveBudgetClient from './_components/ExecutiveBudgetClient';

export const metadata = { title: 'Budget Management | Executive | NEUPC' };

export default async function ExecutiveBudgetPage() {
  await requireRole(['executive', 'admin']);

  const [budgetSummary, budgetEntries, events, bootcamps] = await Promise.all([
    getBudgetSummary().catch(() => ({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    })),
    getAllBudgetEntries().catch(() => []),
    getAllEvents().catch(() => []),
    getAllBootcamps().catch(() => []),
  ]);

  return (
    <ExecutiveBudgetClient
      initialSummary={budgetSummary}
      initialEntries={budgetEntries}
      events={events}
      bootcamps={bootcamps}
    />
  );
}
