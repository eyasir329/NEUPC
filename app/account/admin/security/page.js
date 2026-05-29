/**
 * @file Admin security overview page (server component).
 * Fetches security metrics and audit data for the security dashboard.
 *
 * @module AdminSecurityPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getSecurityData } from '@/app/_lib/security-service';
import SecurityClient from './_components/SecurityClient';

export const metadata = { title: 'Security | Admin | NEUPC' };

export default async function AdminSecurityPage() {
  const [{ user }, securityData] = await Promise.all([
    requireRole('admin'),
    getSecurityData().catch(() => null),
  ]);

  return <SecurityClient data={securityData} adminId={user.id} />;
}
