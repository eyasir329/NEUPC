/**
 * @file Admin create user page (server component).
 * Body is shared via {@link createCreateUserPage} (see executive panel).
 *
 * @module AdminCreateUserPage
 * @access admin
 */

import { createCreateUserPage } from '@/app/account/_lib/pages/createUsersPages';

export const metadata = { title: 'Create User | Admin | NEUPC' };

export default createCreateUserPage('admin');
