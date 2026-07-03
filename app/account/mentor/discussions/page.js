/**
 * @file Mentor Help Desk page (server component).
 * Body is shared via {@link createDiscussionsPage}.
 *
 * @module MentorDiscussionsPage
 * @access mentor
 */

import { createDiscussionsPage } from '@/app/account/_lib/pages/createDiscussionsPage';

export const metadata = { title: 'Help Desk | Mentor | NEUPC' };

export default createDiscussionsPage('mentor');
