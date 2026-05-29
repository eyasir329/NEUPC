/**
 * @file Executive membership applications page (server component).
 * Fetches all join requests for executive review and approval.
 *
 * @module ExecutiveApplicationsPage
 * @access executive
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getAllJoinRequests,
  getPendingGuestApplications,
} from '@/app/_lib/data-service';
import ApplicationsClient from './_components/ApplicationsClient';

export const metadata = { title: 'Applications | Executive | NEUPC' };

export default async function ExecutiveApplicationsPage() {
  const [{ user }, requests, guestApps] = await Promise.all([
    requireRole(['executive', 'admin']),
    getAllJoinRequests().catch(() => []),
    getPendingGuestApplications().catch(() => []),
  ]);

  return (
    <ApplicationsClient
      initialRequests={requests}
      initialGuestApps={guestApps}
      adminId={user.id}
    />
  );
}
