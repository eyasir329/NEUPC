import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getPublishedEvents,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import GuestEventsClient from './_components/GuestEventsClient';

export const metadata = { title: 'Events | Guest' };

export default async function GuestEventsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('guest')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active') redirect('/account');

  const events = await getPublishedEvents().catch(() => []);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="guest" />
      <GuestEventsClient events={events} />
    </div>
  );
}
