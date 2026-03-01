/**
 * @file Admin create user page (server component).
 * Renders the user creation form with a back-navigation link.
 *
 * @module AdminCreateUserPage
 * @access admin
 */

import CreateUserClient from './CreateUserClient';
import Link from 'next/link';

export const metadata = { title: 'Create User | Admin | NEUPC' };

export default async function CreateUserPage() {
  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Create New User</h1>
          <p className="mt-2 text-sm text-gray-400">
            Add a new user to the system and assign them a role.
          </p>
        </div>
        <Link
          href="/account/admin/users"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 px-4 py-2.5 font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
        >
          &larr; Back to User Management
        </Link>
      </div>
      <CreateUserClient />
    </div>
  );
}
