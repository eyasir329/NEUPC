import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import ExecutiveProfileClient from './_components/ExecutiveProfileClient';

export const metadata = { title: 'Profile | Executive | NEUPC' };

export default async function ExecutiveProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive') && !userRoles.includes('admin'))
    redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const { data: memberProfile } = await supabaseAdmin
    .from('member_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: committeeInfo } = await supabaseAdmin
    .from('committee_members')
    .select(
      `
      id, term_start, term_end, is_current, bio,
      position:committee_positions(title, category)
    `
    )
    .eq('user_id', user.id)
    .eq('is_current', true)
    .maybeSingle();

  return (
    <>
      <RoleSync role="executive" />
      <ExecutiveProfileClient
        user={user}
        memberProfile={memberProfile}
        committeeInfo={committeeInfo}
      />
    </>
  );
}
