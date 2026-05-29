/**
 * @file Admin contact submissions page (server component).
 * Body is shared via {@link createContactSubmissionsPage} (see executive panel).
 *
 * @module AdminContactSubmissionsPage
 * @access admin
 */

import { createContactSubmissionsPage } from '@/app/account/_lib/pages/createContactSubmissionsPage';

export const metadata = { title: 'Contact Submissions | Admin | NEUPC' };

export default createContactSubmissionsPage('admin');
