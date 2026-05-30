/**
 * @file Executive contact submissions page (server component).
 * Body is shared via {@link createContactSubmissionsPage} (see admin panel).
 *
 * @module ExecutiveContactSubmissionsPage
 * @access executive
 */

import { createContactSubmissionsPage } from '@/app/account/_lib/pages/createContactSubmissionsPage';

export const metadata = { title: 'Contact Submissions | Executive | NEUPC' };

export default createContactSubmissionsPage('executive');
