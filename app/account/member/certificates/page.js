/**
 * @file Member certificates page — displays all certificates earned by
 *   the member through event participation, contest achievements, or
 *   other club recognitions.
 * @module MemberCertificatesPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getUserCertificates } from '@/app/_lib/data-service';
import MemberCertificatesClient from './_components/MemberCertificatesClient';

export const metadata = { title: 'Certificates | Member | NEUPC' };

export default async function MemberCertificatesPage() {
  const { user } = await requireRole('member');
  const certificates = await getUserCertificates(user.id).catch(() => []);

  return (
    <MemberCertificatesClient
      certificates={certificates}
      userName={user.full_name}
    />
  );
}
