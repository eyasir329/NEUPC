/**
 * @file Admin user management page (server component).
 * Fetches all users with stats, formats dates for display,
 * and renders the user management table.
 *
 * @module AdminUsersPage
 * @access admin
 */

import { getAllUsers, getUserStats } from '@/app/_lib/data-service';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import UserManagementClient from './_components/UserManagementClient';

export const metadata = { title: 'Users | Admin | NEUPC' };

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Format a join date as "MMM DD, YYYY". */
function formatJoinDate(dateStr) {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Convert a last-active timestamp to a human-friendly relative string. */
function formatLastActive(dateStr) {
  if (!dateStr) return 'Never';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hrs = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function AdminUsersPage() {
  const [users, stats] = await Promise.all([
    getAllUsers().catch(() => []),
    getUserStats().catch(() => ({})),
  ]);

  const formattedUsers = users.map((user) => ({
    ...user,
    joined: formatJoinDate(user.joined),
    lastActive: formatLastActive(user.lastActive),
  }));

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Link
          href="/account/admin/users/create"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 px-4 py-2.5 font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
        >
          <UserPlus className="h-5 w-5" />
          Add User
        </Link>
      </div>
      <UserManagementClient initialUsers={formattedUsers} stats={stats} />
    </div>
  );
}
