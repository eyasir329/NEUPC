/**
 * @file Admin membership applications page (server component).
 * Fetches all join requests for admin review and approval.
 *
 * @module AdminApplicationsPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getAllJoinRequests,
  getPendingGuestApplications,
} from '@/app/_lib/data-service';
import ApplicationsClient from './_components/ApplicationsClient';

export const metadata = { title: 'Applications | Admin | NEUPC' };

export default async function AdminApplicationsPage() {
  const [{ user }, requests, guestApps] = await Promise.all([
    requireRole('admin'),
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
