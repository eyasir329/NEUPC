/**
 * @file Admin role management page (server component).
 * Fetches roles, permissions, and users for the RBAC management UI.
 *
 * @module AdminRolesPage
 * @access admin
 */

import { getRolesWithStats, getUsersBasic } from '@/app/_lib/data-service';
import RoleManagementClient from './_components/RoleManagementClient';

export const metadata = { title: 'Roles | Admin | NEUPC' };

export default async function AdminRolesPage() {
  const [{ roles, allPermissions }, users] = await Promise.all([
    getRolesWithStats().catch(() => ({ roles: [], allPermissions: [] })),
    getUsersBasic().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleManagementClient
        initialRoles={roles}
        allPermissions={allPermissions}
        initialUsers={users}
      />
    </div>
  );
}
