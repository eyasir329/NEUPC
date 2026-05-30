/**
 * @file Mentor resources library — learning materials available to mentors
 *   and their mentees. Submissions use the shared "member" variant.
 * @module MentorResourcesPage
 * @access mentor
 */

import { createResourcesPage } from '@/app/account/_lib/pages/createResourcesPage';

export const metadata = { title: 'Resources | Mentor | NEUPC' };

export default createResourcesPage({ role: 'mentor', submitVariant: 'member' });
