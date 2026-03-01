/**
 * @file Member dashboard layout.
 * Enforces `member` role via server-side guard, syncs the role to context.
 *
 * @module MemberLayout
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import RoleSync from '../_components/RoleSync';

export default async function MemberLayout({ children }) {
  await requireRole('member');

  return (
    <>
      <RoleSync role="member" />
      {children}
    </>
  );
}
