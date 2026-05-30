/**
 * @file Executive edit user page (server component).
 * Body is shared via {@link createEditUserPage} (see admin panel).
 *
 * @module ExecutiveEditUserPage
 * @access executive | admin
 */

import { createEditUserPage } from '@/app/account/_lib/pages/createUsersPages';

export const metadata = { title: 'Edit User | Executive | NEUPC' };

export default createEditUserPage('executive');
