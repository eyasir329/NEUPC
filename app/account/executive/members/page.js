import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import MembersClient from './_components/MembersClient';

export const metadata = { title: 'Member Approval | Executive | NEUPC' };

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive') && !userRoles.includes('admin'))
    redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const { data: pendingRequests } = await supabaseAdmin
    .from('join_requests')
    .select(
      'id, name, email, student_id, batch, department, phone, interests, codeforces_handle, github, reason, status, created_at'
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { data: allMembers } = await supabaseAdmin
    .from('users')
    .select(
      `
      id, email, full_name, avatar_url, account_status, created_at,
      member_profiles(student_id, batch, department, github, codeforces_handle)
    `
    )
    .in('account_status', ['active', 'pending'])
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <>
      <RoleSync role="executive" />
      <MembersClient
        pendingRequests={pendingRequests || []}
        allMembers={allMembers || []}
      />
    </>
  );
}
