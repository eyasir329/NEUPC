/**
 * @file Admin resources library — learning materials, guides and shared
 *   documents available to administrators.
 * @module AdminResourcesPage
 * @access admin
 */

import { createResourcesPage } from '@/app/account/_lib/pages/createResourcesPage';

export const metadata = { title: 'Resources | Admin | NEUPC' };

export default createResourcesPage({ role: 'admin' });
