/**
 * @file Executive user management page (server component).
 * Body is shared via {@link createUsersPage} (see admin panel).
 *
 * @module ExecutiveUsersPage
 * @access executive | admin
 */

import { createUsersPage } from '@/app/account/_lib/pages/createUsersPages';

export const metadata = { title: 'Users | Executive | NEUPC' };
export const revalidate = 0;

export default createUsersPage('executive');
