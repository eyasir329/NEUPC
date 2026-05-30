/**
 * @file Admin membership applications page (server component).
 * Body is shared via {@link createApplicationsPage} (see executive panel).
 *
 * @module AdminApplicationsPage
 * @access admin
 */

import { createApplicationsPage } from '@/app/account/_lib/pages/createApplicationsPage';

export const metadata = { title: 'Applications | Admin | NEUPC' };

export default createApplicationsPage({ role: 'admin', allowedRoles: 'admin' });
