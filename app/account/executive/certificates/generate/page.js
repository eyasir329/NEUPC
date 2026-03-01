/**
 * @file Executive certificate generator — fetches completed events,
 *   contests, existing certificates, and active users so executives can
 *   generate and issue certificates for participants and winners.
 * @module ExecutiveGenerateCertificatesPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { supabaseAdmin } from '@/app/_lib/supabase';
import GenerateCertificatesClient from './_components/GenerateCertificatesClient';

export const metadata = { title: 'Generate Certificates | Executive | NEUPC' };

export default async function GenerateCertificatesPage() {
  const { user } = await requireRole(['executive', 'admin']);

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
        `id, certificate_number, title, certificate_type, issue_date, created_at,
        recipient:users!certificates_recipient_id_fkey(id, full_name, email)`
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
    <GenerateCertificatesClient
      events={eventsRes.data || []}
      contests={contestsRes.data || []}
      certificates={certsRes.data || []}
      users={usersRes.data || []}
      userId={user.id}
    />
  );
}
