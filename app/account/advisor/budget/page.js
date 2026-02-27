import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getAllBudgetEntries,
  getBudgetSummary,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import AdvisorBudgetClient from './_components/AdvisorBudgetClient';

export const metadata = { title: 'Budget | Advisor' };

export default async function AdvisorBudgetPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

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
      <RoleSync role="advisor" />
      <AdvisorBudgetClient
        budgetEntries={budgetEntries}
        summary={summary}
        advisorId={user.id}
      />
    </div>
  );
}
