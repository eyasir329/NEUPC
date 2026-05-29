/**
 * @file Executive roadmap management page (server component).
 * Body is shared via {@link createRoadmapsPage} (see admin panel).
 *
 * @module ExecutiveRoadmapsPage
 * @access executive
 */

import { createRoadmapsPage } from '@/app/account/_lib/pages/createRoadmapsPage';

export const metadata = { title: 'Roadmaps | Executive | NEUPC' };

export default createRoadmapsPage();
