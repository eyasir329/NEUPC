import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getEventsWithStats,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import AdvisorEventsClient from './_components/AdvisorEventsClient';

export const metadata = { title: 'Events | Advisor' };

export default async function AdvisorEventsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const eventsData = await getEventsWithStats().catch(() => ({
    events: [],
    stats: {},
  }));
  const events = eventsData?.events || [];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="advisor" />
      <AdvisorEventsClient events={events} advisorId={user.id} />
    </div>
  );
}
