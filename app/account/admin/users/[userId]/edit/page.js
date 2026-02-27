import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserById, getUserRoles } from '@/app/_lib/data-service';
import RoleSync from '../../../../_components/RoleSync';
import Link from 'next/link';
import EditUserClient from './EditUserClient';

export default async function EditUserPage({ params }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('admin')) {
    redirect('/account');
  }

  const user = await getUserById(params.userId);

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
      <RoleSync role="admin" />
      {/* Header */}
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