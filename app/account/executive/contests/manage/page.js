import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import ManageContestsClient from './_components/ManageContestsClient';

export const metadata = { title: 'Contest Management | Executive | NEUPC' };

export default async function ManageContestsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive') && !userRoles.includes('admin'))
    redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const { data: contests } = await supabaseAdmin
    .from('contests')
    .select(
      `id, slug, title, description, platform, contest_url,
       start_time, duration, type, division, status, is_official,
       created_at, updated_at,
       contest_participants(count)`
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const serialized = (contests || []).map((c) => ({
    ...c,
    participantCount: c.contest_participants?.[0]?.count ?? 0,
    contest_participants: undefined,
  }));

  return (
    <>
      <RoleSync role="executive" />
      <ManageContestsClient initialContests={serialized} userId={user.id} />
    </>
  );
}
