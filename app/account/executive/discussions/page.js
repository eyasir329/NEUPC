/**
 * @file Executive Help Desk page (server component).
 * Body is shared via {@link createDiscussionsPage}.
 *
 * @module ExecutiveDiscussionsPage
 * @access executive
 */

import { createDiscussionsPage } from '@/app/account/_lib/pages/createDiscussionsPage';

export const metadata = { title: 'Help Desk | Executive | NEUPC' };

export default createDiscussionsPage('executive');
