/**
 * @file Executive resources library — learning materials, guides and shared
 *   documents available to club executives.
 * @module ExecutiveResourcesPage
 * @access executive
 */

import { createResourcesPage } from '@/app/account/_lib/pages/createResourcesPage';

export const metadata = { title: 'Resources | Executive | NEUPC' };

export default createResourcesPage({ role: 'executive' });
