import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import RegistrationsClient from './_components/RegistrationsClient';

export const metadata = { title: 'Registrations | Executive | NEUPC' };

export default async function RegistrationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive') && !userRoles.includes('admin'))
    redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, slug, status, start_date, event_registrations(count)')
    .in('status', ['upcoming', 'ongoing', 'completed'])
    .order('start_date', { ascending: false })
    .limit(50);

  const eventsWithCount = (events || []).map((e) => ({
    ...e,
    registrationCount: e.event_registrations?.[0]?.count ?? 0,
    event_registrations: undefined,
  }));

  return (
    <>
      <RoleSync role="executive" />
      <RegistrationsClient events={eventsWithCount} />
    </>
  );
}
