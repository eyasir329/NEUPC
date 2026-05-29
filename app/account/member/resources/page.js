/**
 * @file Member resources library — learning materials, guides and shared
 *   documents available to active club members.
 * @module MemberResourcesPage
 * @access member
 */

import { createResourcesPage } from '@/app/account/_lib/pages/createResourcesPage';

export const metadata = { title: 'Resources | Member | NEUPC' };

export default createResourcesPage({ role: 'member' });
