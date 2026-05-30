/**
 * @file Executive blog management page (server component).
 * Body is shared via {@link createBlogsPage} (see admin panel).
 *
 * @module ExecutiveBlogsPage
 * @access executive
 */

import { createBlogsPage } from '@/app/account/_lib/pages/createBlogsPage';

export const metadata = { title: 'Blogs | Executive | NEUPC' };

export default createBlogsPage();
