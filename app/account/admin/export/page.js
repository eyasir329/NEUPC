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

  return <ExportClient adminId={user.id} adminName={user.full_name} />;
}
