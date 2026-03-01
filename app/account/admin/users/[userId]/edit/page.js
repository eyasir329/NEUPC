/**
 * @file Admin edit user page (server component).
 * Fetches a user by ID and renders the edit form.
 *
 * @module AdminEditUserPage
 * @access admin
 * @param {{ params: { userId: string } }} props — Next.js dynamic route params
 */

import { getUserById } from '@/app/_lib/data-service';
import Link from 'next/link';
import EditUserClient from './EditUserClient';

export const metadata = { title: 'Edit User | Admin | NEUPC' };

export default async function EditUserPage({ params }) {
  const { userId } = await params;
  const user = await getUserById(userId);

  if (!user) {
    return (
      <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
        <h1 className="text-3xl font-bold text-white">User not found</h1>
        <Link href="/account/admin/users">&larr; Back to User Management</Link>
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
        <Link
          href="/account/admin/users"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 px-4 py-2.5 font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
        >
          &larr; Back to User Management
        </Link>
      </div>
      <EditUserClient user={user} />
    </div>
  );
}
