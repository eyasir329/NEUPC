import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getAllUsers,
  getUserStats,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import UserManagementClient from './_components/UserManagementClient';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');

  const userEmail = session.user?.email;
  if (!userEmail) redirect('/login');

  const userRoles = await getUserRoles(userEmail);
  if (!Array.isArray(userRoles) || !userRoles.includes('admin')) {
    redirect('/account');
  }

  const [users, stats] = await Promise.all([getAllUsers(), getUserStats()]);

  // Format user dates for display in the UI
  const formattedUsers = users.map((user) => {
    // ── Joined date ──────────────────────────────────────────────────────────
    const joinedDate = user.joined ? new Date(user.joined) : null;
    const joined = joinedDate
      ? joinedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Unknown';

    // ── Last active (relative time) ───────────────────────────────────────────
    const lastActiveDate = user.lastActive ? new Date(user.lastActive) : null;
    let lastActive = 'Never';

    if (lastActiveDate) {
      const diffMs = Date.now() - lastActiveDate.getTime();
      const diffMins = Math.floor(diffMs / 60_000);
      const diffHours = Math.floor(diffMs / 3_600_000);
      const diffDays = Math.floor(diffMs / 86_400_000);

      if (diffMins < 1) lastActive = 'Just now';
      else if (diffMins < 60)
        lastActive = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      else if (diffHours < 24)
        lastActive = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else if (diffDays < 7)
        lastActive = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        lastActive = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        lastActive = lastActiveDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    }

    return {
      ...user,
      joined,
      lastActive,
    };
  });

  console.log('AdminUsersPage - formattedUsers:', formattedUsers);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="admin" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">👥 User Management</h1>
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
