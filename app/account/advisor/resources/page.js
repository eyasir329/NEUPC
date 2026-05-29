/**
 * @file Advisor resources library — learning materials, guides and shared
 *   documents available to club advisors.
 * @module AdvisorResourcesPage
 * @access advisor
 */

import { createResourcesPage } from '@/app/account/_lib/pages/createResourcesPage';

export const metadata = { title: 'Resources | Advisor | NEUPC' };

export default createResourcesPage({ role: 'advisor' });
