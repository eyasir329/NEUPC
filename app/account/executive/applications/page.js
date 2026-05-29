/**
 * @file Executive membership applications page (server component).
 * Body is shared via {@link createApplicationsPage} (see admin panel).
 *
 * @module ExecutiveApplicationsPage
 * @access executive | admin
 */

import { createApplicationsPage } from '@/app/account/_lib/pages/createApplicationsPage';

export const metadata = { title: 'Applications | Executive | NEUPC' };

export default createApplicationsPage({
  role: 'executive',
  allowedRoles: ['executive', 'admin'],
});
