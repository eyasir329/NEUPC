/**
 * @file Member daily activity — connected to local Supabase DB.
 * @module MemberDailyActivityPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import MemberDailyActivityClient from '@/app/account/_components/daily-activity/MemberDailyActivityClient';

export const metadata = { title: 'Daily Activity | Member | NEUPC' };

export default async function MemberDailyActivityPage() {
  const { user } = await requireRole('member');

  return <MemberDailyActivityClient userId={user.id} />;
}