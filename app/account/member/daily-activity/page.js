/**
 * @file Member daily activity — personal to-do list and a monthly
 *   calendar overlaying events, contests, bootcamp lessons, and
 *   personal tasks. State is in-memory only (no DB) for now.
 *
 * @module MemberDailyActivityPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import DailyActivityClient from './_components/DailyActivityClient';

export const metadata = { title: 'Daily Activity | Member | NEUPC' };

export default async function MemberDailyActivityPage() {
  await requireRole('member');
  return <DailyActivityClient />;
}
