import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import NoticesClient from './_components/NoticesClient';

export const metadata = { title: 'Notices | Executive | NEUPC' };

export default async function CreateNoticePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive') && !userRoles.includes('admin'))
    redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const { data: notices } = await supabaseAdmin
    .from('notices')
    .select(
      'id, title, content, notice_type, priority, target_audience, is_pinned, expires_at, views, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <>
      <RoleSync role="executive" />
      <NoticesClient initialNotices={notices || []} userId={user.id} />
    </>
  );
}
