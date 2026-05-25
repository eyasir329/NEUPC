import { requireRole } from '@/app/_lib/auth-guard';
import { getAllWeeklyTasks, getAllTaskSubmissions } from '@/app/_lib/data-service';
import { getMentorAssignedBootcamps } from '@/app/_lib/bootcamp-actions';
import MentorTasksClient from './_components/MentorTasksClient';

export const metadata = { title: 'Tasks | Mentor | NEUPC' };

export default async function MentorTasksPage() {
  const [{ user }, tasks, submissions, bootcamps] = await Promise.all([
    requireRole('mentor'),
    getAllWeeklyTasks().catch((e) => { console.error('getAllWeeklyTasks failed:', e); return []; }),
    getAllTaskSubmissions().catch((e) => { console.error('getAllTaskSubmissions failed:', e); return []; }),
    getMentorAssignedBootcamps().catch((e) => { console.error('getMentorAssignedBootcamps failed:', e); return []; }),
  ]);

  return (
    <MentorTasksClient
      tasks={tasks}
      submissions={submissions}
      mentorId={user.id}
      bootcamps={bootcamps}
    />
  );
}
