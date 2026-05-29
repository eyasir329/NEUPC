/**
 * @file Advisor profile page — displays the authenticated advisor’s own
 *   profile details and allows them to update personal information.
 * @module AdvisorProfilePage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import AdvisorProfileClient from './_components/AdvisorProfileClient';

export const metadata = { title: 'Profile | Advisor | NEUPC' };

export default async function AdvisorProfilePage() {
  const { user } = await requireRole('advisor');

  return <AdvisorProfileClient user={user} />;
}
