import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import ManageEventsClient from './_components/ManageEventsClient';

export const metadata = { title: 'Event Management | Executive | NEUPC' };

export default async function ManageEventsPage() {
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
    .select(
      `id, title, slug, status, category, venue_type, start_date, end_date,
       cover_image, is_featured, registration_required, max_participants,
       created_at, updated_at,
       event_registrations(count)`
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const serialized = (events || []).map((e) => ({
    ...e,
    registrationCount: e.event_registrations?.[0]?.count ?? 0,
    event_registrations: undefined,
  }));

  return (
    <>
      <RoleSync role="executive" />
      <ManageEventsClient initialEvents={serialized} userId={user.id} />
    </>
  );
}
