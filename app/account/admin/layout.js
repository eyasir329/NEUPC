/**
 * @file Admin dashboard layout.
 * Enforces `admin` role via server-side guard, syncs the role to context.
 *
 * @module AdminLayout
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import RoleSync from '../_components/RoleSync';

export default async function AdminLayout({ children }) {
  await requireRole('admin');

  return (
    <>
      <RoleSync role="admin" />
      {children}
    </>
  );
}
