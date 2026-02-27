import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getAllResources,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import MemberResourcesClient from './_components/MemberResourcesClient';

export const metadata = { title: 'Resources | Member' };

export default async function MemberResourcesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('member')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || user?.is_active === false)
    redirect('/account');

  const resources = await getAllResources().catch(() => []);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="member" />
      <MemberResourcesClient resources={resources} userId={user.id} />
    </div>
  );
}
