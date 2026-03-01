/**
 * @file Advisor dashboard layout.
 * Enforces `advisor` role via server-side guard, syncs the role to context.
 *
 * @module AdvisorLayout
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import RoleSync from '../_components/RoleSync';

export default async function AdvisorLayout({ children }) {
  await requireRole('advisor');

  return (
    <>
      <RoleSync role="advisor" />
      {children}
    </>
  );
}
