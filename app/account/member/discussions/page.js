/**
 * @file Member Help Desk page (server component).
 * Full-featured help desk with tabs: All Post, Roadmap, Release Log,
 * Feature Requests, Self Troubleshoot. Body is shared via
 * {@link createDiscussionsPage}.
 *
 * @module MemberDiscussionsPage
 * @access member
 */

import { createDiscussionsPage } from '@/app/account/_lib/pages/createDiscussionsPage';

export const metadata = { title: 'Help Desk | Member | NEUPC' };

export default createDiscussionsPage('member');
