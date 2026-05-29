/**
 * @file Executive create user page (server component).
 * Body is shared via {@link createCreateUserPage} (see admin panel).
 *
 * @module ExecutiveCreateUserPage
 * @access executive | admin
 */

import { createCreateUserPage } from '@/app/account/_lib/pages/createUsersPages';

export const metadata = { title: 'Create User | Executive | NEUPC' };

export default createCreateUserPage('executive');
