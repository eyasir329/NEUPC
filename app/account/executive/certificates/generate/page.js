import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import GenerateCertificatesClient from './_components/GenerateCertificatesClient';

export const metadata = { title: 'Generate Certificates | Executive | NEUPC' };

export default async function GenerateCertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive') && !userRoles.includes('admin'))
    redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const [eventsRes, contestsRes, certsRes, usersRes] = await Promise.all([
    supabaseAdmin
      .from('events')
      .select('id, title, start_date')
      .in('status', ['completed', 'ongoing'])
      .order('start_date', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('contests')
      .select('id, title, start_time')
      .order('start_time', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('certificates')
      .select(
        `
        id, certificate_number, title, certificate_type, issue_date, created_at,
        recipient:users!certificates_recipient_id_fkey(id, full_name, email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .eq('account_status', 'active')
      .order('full_name')
      .limit(500),
  ]);

  return (
    <>
      <RoleSync role="executive" />
      <GenerateCertificatesClient
        events={eventsRes.data || []}
        contests={contestsRes.data || []}
        certificates={certsRes.data || []}
        users={usersRes.data || []}
        userId={user.id}
      />
    </>
  );
}
