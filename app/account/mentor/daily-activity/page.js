/**
 * @file Mentor daily activity page.
 * @module MentorDailyActivityPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import MemberDailyActivityClient from '@/app/account/_components/daily-activity/MemberDailyActivityClient';

export const metadata = { title: 'Daily Activity | Mentor | NEUPC' };

export default async function MentorDailyActivityPage() {
  const { user } = await requireRole('mentor');

  return <MemberDailyActivityClient userId={user.id} />;
}
