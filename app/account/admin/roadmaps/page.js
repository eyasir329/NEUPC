/**
 * @file Admin roadmap management page (server component).
 * Body is shared via {@link createRoadmapsPage} (see executive panel).
 *
 * @module AdminRoadmapsPage
 * @access admin
 */

import { createRoadmapsPage } from '@/app/account/_lib/pages/createRoadmapsPage';

export const metadata = { title: 'Roadmaps | Admin | NEUPC' };

export default createRoadmapsPage();
