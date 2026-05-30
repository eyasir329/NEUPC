/**
 * @file Admin user management page (server component).
 * Body is shared via {@link createUsersPage} (see executive panel).
 *
 * @module AdminUsersPage
 * @access admin
 */

import { createUsersPage } from '@/app/account/_lib/pages/createUsersPages';

export const metadata = { title: 'Users | Admin | NEUPC' };
export const revalidate = 0;

export default createUsersPage('admin');
