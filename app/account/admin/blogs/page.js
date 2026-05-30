/**
 * @file Admin blog management page (server component).
 * Body is shared via {@link createBlogsPage} (see executive panel).
 *
 * @module AdminBlogsPage
 * @access admin
 */

import { createBlogsPage } from '@/app/account/_lib/pages/createBlogsPage';

export const metadata = { title: 'Blogs | Admin | NEUPC' };

export default createBlogsPage();
