/**
 * @file Executive recognitions management page (server component).
 * Achievements + certificates dashboards in one unified experience.
 * Body is shared via {@link createRecognitionsPage} (see admin panel).
 *
 * @module ExecutiveRecognitionsPage
 * @access executive | admin
 */

import { createRecognitionsPage } from '@/app/account/_lib/pages/createRecognitionsPage';

export const metadata = { title: 'Recognitions | Executive | NEUPC' };

export default createRecognitionsPage(['executive', 'admin']);
