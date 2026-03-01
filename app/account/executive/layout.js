/**
 * @file Executive dashboard layout.
 * Enforces `executive` or `admin` role via server-side guard,
 * syncs the executive role to context.
 *
 * @module ExecutiveLayout
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import RoleSync from '../_components/RoleSync';

export default async function ExecutiveLayout({ children }) {
  await requireRole(['executive', 'admin']);

  return (
    <>
      <RoleSync role="executive" />
      {children}
    </>
  );
}
