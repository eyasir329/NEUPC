/**
 * @file Advisor daily activity page.
 * @module AdvisorDailyActivityPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import MemberDailyActivityClient from '@/app/account/_components/daily-activity/MemberDailyActivityClient';

export const metadata = { title: 'Daily Activity | Advisor | NEUPC' };

export default async function AdvisorDailyActivityPage() {
  const { user } = await requireRole('advisor');

  return <MemberDailyActivityClient userId={user.id} />;
}
