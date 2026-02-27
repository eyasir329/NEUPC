import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail, getPublishedEvents, getUserEventRegistrations } from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import MemberEventsClient from './_components/MemberEventsClient';

export const metadata = { title: 'Events | Member' };

export default async function MemberEventsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('member')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || user?.is_active === false) redirect('/account');

  const [events, myRegistrations] = await Promise.all([
    getPublishedEvents().catch(() => []),
    getUserEventRegistrations(user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="member" />
      <MemberEventsClient
        events={events}
        myRegistrations={myRegistrations}
        userId={user.id}
      />
    </div>
  );
}
