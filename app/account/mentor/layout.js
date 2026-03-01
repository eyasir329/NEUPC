/**
 * @file Mentor dashboard layout.
 * Enforces `mentor` role via server-side guard, syncs the role to context.
 *
 * @module MentorLayout
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import RoleSync from '../_components/RoleSync';

export default async function MentorLayout({ children }) {
  await requireRole('mentor');

  return (
    <>
      <RoleSync role="mentor" />
      {children}
    </>
  );
}
