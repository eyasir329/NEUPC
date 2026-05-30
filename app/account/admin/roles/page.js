/**
 * @file Admin role management page (server component).
 * Fetches roles, permissions, and users for the RBAC management UI.
 *
 * @module AdminRolesPage
 * @access admin
 */

import {
  getRolesWithStats,
  getUsersBasic,
} from '@/app/_lib/services/data-service';
import RoleManagementClient from './_components/RoleManagementClient';

export const metadata = { title: 'Roles | Admin | NEUPC' };

export default async function AdminRolesPage() {
  const [{ roles, allPermissions }, users] = await Promise.all([
    getRolesWithStats().catch(() => ({ roles: [], allPermissions: [] })),
    getUsersBasic().catch(() => []),
  ]);

  return (
    <RoleManagementClient
      initialRoles={roles}
      allPermissions={allPermissions}
      initialUsers={users}
    />
  );
}
