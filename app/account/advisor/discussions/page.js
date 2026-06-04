/**
 * @file Advisor Help Desk page (server component).
 * Body is shared via {@link createDiscussionsPage}.
 *
 * @module AdvisorDiscussionsPage
 * @access advisor
 */

import { createDiscussionsPage } from '@/app/account/_lib/pages/createDiscussionsPage';

export const metadata = { title: 'Help Desk | Advisor | NEUPC' };

export default createDiscussionsPage('advisor');
