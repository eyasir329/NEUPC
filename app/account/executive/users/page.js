/**
 * @file Executive user management page (server component).
 * Fetches all users with stats, formats dates for display,
 * and renders the user management table.
 *
 * @module ExecutiveUsersPage
 * @access executive | admin
 */

import { getAllUsers, getUserStats } from '@/app/_lib/data-service';
import UserManagementClient from './_components/UserManagementClient';

export const metadata = { title: 'Users | Executive | NEUPC' };

// Revalidate every 0 seconds (on-demand via revalidatePath from actions)
export const revalidate = 0;

// ── Page ────────────────────────────────────────────────────────────────────

export default async function ExecutiveUsersPage({ searchParams }) {
  const params = await searchParams;
  const [users, stats] = await Promise.all([
    getAllUsers().catch(() => []),
    getUserStats().catch(() => ({})),
  ]);

  // Normalise URL params so the client can pre-apply filters.
  // ?role=guest  → 'Guest'   ?status=active → 'Active'   ?search=foo → 'foo'
  const rawRole = params?.role ?? '';
  const rawStatus = params?.status ?? '';
  const rawSearch = params?.search ?? '';
  const VALID_ROLES = [
    'guest',
    'member',
    'mentor',
    'executive',
    'advisor',
    'admin',
  ];
  const VALID_STATUSES = [
    'active',
    'inactive',
    'suspended',
    'banned',
    'blocked',
    'locked',
    'pending',
    'rejected',
  ];
  const initialFilterRole = VALID_ROLES.includes(rawRole.toLowerCase())
    ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
    : 'All';
  const initialFilterStatus = VALID_STATUSES.includes(rawStatus.toLowerCase())
    ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase()
    : 'All';
  const initialSearch = rawSearch.slice(0, 100); // basic length guard

  return (
    <UserManagementClient
      initialUsers={users}
      stats={stats}
      initialFilterRole={initialFilterRole}
      initialFilterStatus={initialFilterStatus}
      initialSearch={initialSearch}
    />
  );
}
