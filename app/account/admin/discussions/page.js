/**
 * @file Admin Help Desk page (server component).
 * Body is shared via {@link createDiscussionsPage}.
 *
 * @module AdminDiscussionsPage
 * @access admin
 */

import { createDiscussionsPage } from '@/app/account/_lib/pages/createDiscussionsPage';

export const metadata = { title: 'Help Desk | Admin | NEUPC' };

export default createDiscussionsPage('admin');
