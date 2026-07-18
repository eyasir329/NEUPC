/**
 * @file Executive daily activity page.
 * @module ExecutiveDailyActivityPage
 * @access executive
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import MemberDailyActivityClient from '@/app/account/_components/daily-activity/MemberDailyActivityClient';

export const metadata = { title: 'Daily Activity | Executive | NEUPC' };

export default async function ExecutiveDailyActivityPage() {
  const { user } = await requireRole(['executive', 'admin']);

  return <MemberDailyActivityClient userId={user.id} />;
}
