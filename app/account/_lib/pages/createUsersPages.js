/**
 * @file Factories for the user-management pages (list, create, edit).
 *   Shared by the admin and executive panels; per-role differences are
 *   limited to navigation hrefs, supplied via `role`.
 *
 * @module account/_lib/pages/createUsersPages
 */

import Link from 'next/link';
import { getAllUsers, getUserStats, getUserById } from '@/app/_lib/data-service';
import UserManagementClient from '@/app/account/_components/users/UserManagementClient';
import CreateUserClient from '@/app/account/_components/users/CreateUserClient';
import EditUserClient from '@/app/account/_components/users/EditUserClient';

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

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** User-management list page. */
export function createUsersPage(role) {
  return async function UsersPage({ searchParams }) {
    const params = await searchParams;
    const [users, stats] = await Promise.all([
      getAllUsers().catch(() => []),
      getUserStats().catch(() => ({})),
    ]);

    // Normalise URL params so the client can pre-apply filters.
    const rawRole = params?.role ?? '';
    const rawStatus = params?.status ?? '';
    const rawSearch = params?.search ?? '';
    const initialFilterRole = VALID_ROLES.includes(rawRole.toLowerCase())
      ? titleCase(rawRole)
      : 'All';
    const initialFilterStatus = VALID_STATUSES.includes(rawStatus.toLowerCase())
      ? titleCase(rawStatus)
      : 'All';
    const initialSearch = rawSearch.slice(0, 100); // basic length guard

    return (
      <UserManagementClient
        initialUsers={users}
        stats={stats}
        initialFilterRole={initialFilterRole}
        initialFilterStatus={initialFilterStatus}
        initialSearch={initialSearch}
        role={role}
      />
    );
  };
}

/** Back-to-user-management link shared by the create/edit pages. */
function BackToUsersLink({ role }) {
  return (
    <Link
      href={`/account/${role}/users`}
      className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 px-4 py-2.5 font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
    >
      &larr; Back to User Management
    </Link>
  );
}

/** Create-user page. */
export function createCreateUserPage(role) {
  return async function CreateUserPage() {
    return (
      <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Create New User</h1>
            <p className="mt-2 text-sm text-gray-400">
              Add a new user to the system and assign them a role.
            </p>
          </div>
          <BackToUsersLink role={role} />
        </div>
        <CreateUserClient panelRole={role} />
      </div>
    );
  };
}

/** Edit-user page. */
export function createEditUserPage(role) {
  return async function EditUserPage({ params }) {
    const { userId } = await params;
    const user = await getUserById(userId);

    if (!user) {
      return (
        <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
          <h1 className="text-3xl font-bold text-white">User not found</h1>
          <Link href={`/account/${role}/users`}>
            &larr; Back to User Management
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Edit User</h1>
            <p className="mt-2 text-sm text-gray-400">
              Update user details and role.
            </p>
          </div>
          <BackToUsersLink role={role} />
        </div>
        <EditUserClient user={user} panelRole={role} />
      </div>
    );
  };
}
