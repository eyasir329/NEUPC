/**
 * @file Admin edit user page (server component).
 * Body is shared via {@link createEditUserPage} (see executive panel).
 *
 * @module AdminEditUserPage
 * @access admin
 */

import { createEditUserPage } from '@/app/account/_lib/pages/createUsersPages';

export const metadata = { title: 'Edit User | Admin | NEUPC' };

export default createEditUserPage('admin');
