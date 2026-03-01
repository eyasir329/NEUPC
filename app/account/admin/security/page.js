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

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <SecurityClient data={securityData} adminId={user.id} />
    </div>
  );
}
