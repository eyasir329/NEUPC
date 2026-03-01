/**
 * @file Advisor profile page — displays the authenticated advisor’s own
 *   profile details and allows them to update personal information.
 * @module AdvisorProfilePage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import AdvisorProfileClient from './_components/AdvisorProfileClient';

export const metadata = { title: 'Profile | Advisor | NEUPC' };

export default async function AdvisorProfilePage() {
  const { user } = await requireRole('advisor');

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AdvisorProfileClient user={user} />
    </div>
  );
}
