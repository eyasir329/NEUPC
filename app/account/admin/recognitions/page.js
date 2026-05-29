/**
 * @file Admin recognitions management page (server component).
 * Achievements + certificates dashboards in one unified experience.
 * Body is shared via {@link createRecognitionsPage} (see executive panel).
 *
 * @module AdminRecognitionsPage
 * @access admin
 */

import { createRecognitionsPage } from '@/app/account/_lib/pages/createRecognitionsPage';

export const metadata = { title: 'Recognitions | Admin | NEUPC' };

export default createRecognitionsPage(['admin']);
