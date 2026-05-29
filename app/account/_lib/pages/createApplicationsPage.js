/**
 * @file Factory for the membership applications page. Shared by the admin
 *   and executive panels; differs only in the allowed roles (for the
 *   in-page guard) and the `role` used for navigation links / copy.
 *
 * @module account/_lib/pages/createApplicationsPage
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getAllJoinRequests,
  getPendingGuestApplications,
} from '@/app/_lib/data-service';
import ApplicationsClient from '@/app/account/_components/applications/ApplicationsClient';

/**
 * Build the applications page component.
 * @param {object}   opts
 * @param {string}   opts.role         panel role (used for links + copy)
 * @param {string|string[]} opts.allowedRoles roles permitted to view the page
 */
export function createApplicationsPage({ role, allowedRoles }) {
  return async function ApplicationsPage() {
    const [{ user }, requests, guestApps] = await Promise.all([
      requireRole(allowedRoles),
      getAllJoinRequests().catch(() => []),
      getPendingGuestApplications().catch(() => []),
    ]);

    return (
      <ApplicationsClient
        initialRequests={requests}
        initialGuestApps={guestApps}
        userId={user.id}
        role={role}
      />
    );
  };
}
