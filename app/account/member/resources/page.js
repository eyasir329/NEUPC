/**
 * @file Member resources library — surfaces learning materials, guides,
 *   and shared documents available to active club members.
 * @module MemberResourcesPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getAllResources } from '@/app/_lib/data-service';
import MemberResourcesClient from './_components/MemberResourcesClient';

export const metadata = { title: 'Resources | Member | NEUPC' };

export default async function MemberResourcesPage() {
  const [{ user }, resources] = await Promise.all([
    requireRole('member'),
    getAllResources().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberResourcesClient resources={resources} userId={user.id} />
    </div>
  );
}
