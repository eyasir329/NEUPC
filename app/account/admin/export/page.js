/**
 * @file Admin data export page (server component).
 * Provides the export center for downloading platform data.
 *
 * @module AdminExportPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import ExportClient from './_components/ExportClient';

export const metadata = { title: 'Export | Admin | NEUPC' };

export default async function AdminExportPage() {
  const { user } = await requireRole('admin');

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <ExportClient adminId={user.id} adminName={user.full_name} />
    </div>
  );
}
