
import CreateUserClient from './CreateUserClient';
import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/app/_lib/data-service';
import RoleSync from '../../../_components/RoleSync';
import Link from 'next/link';

export default async function CreateUserPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('admin')) {
    redirect('/account');
  }

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="admin" />
      {/* Header */}
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
