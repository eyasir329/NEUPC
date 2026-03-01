/**
 * @file Admin resource management page (server component).
 * Fetches learning resources with stats for the management UI.
 *
 * @module AdminResourcesPage
 * @access admin
 */

import { getResourcesAdmin } from '@/app/_lib/data-service';
import ResourceManagementClient from './_components/ResourceManagementClient';

export const metadata = { title: 'Resources | Admin | NEUPC' };

export default async function AdminResourcesPage() {
  const { resources, stats } = await getResourcesAdmin().catch(() => ({
    resources: [],
    stats: {},
  }));

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <ResourceManagementClient initialResources={resources} stats={stats} />
    </div>
  );
}
