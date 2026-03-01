/**
 * @file Mentor tasks page — lists all weekly programming tasks so the
 *   mentor can review assignments, create new tasks, and monitor
 *   mentee submissions.
 * @module MentorTasksPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getAllWeeklyTasks } from '@/app/_lib/data-service';
import MentorTasksClient from './_components/MentorTasksClient';

export const metadata = { title: 'Tasks | Mentor | NEUPC' };

export default async function MentorTasksPage() {
  const [{ user }, tasks] = await Promise.all([
    requireRole('mentor'),
    getAllWeeklyTasks().catch(() => []),
  ]);

  return <MentorTasksClient tasks={tasks} mentorId={user.id} />;
}
