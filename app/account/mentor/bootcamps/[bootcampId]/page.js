import { notFound } from 'next/navigation';
import { requireRole } from '@/app/_lib/auth-guard';
import {
  getBootcampWithCurriculum,
  getMentorBootcampMembers,
  getMentorBootcampSessions,
  getMentorBootcampMentorships,
  getBootcampTasks,
  getBootcampHelpTickets,
} from '@/app/_lib/bootcamp-actions';
import MentorBootcampDetailClient from './_components/MentorBootcampDetailClient';

export async function generateMetadata({ params }) {
  const { bootcampId } = await params;
  try {
    const bootcamp = await getBootcampWithCurriculum(bootcampId);
    return { title: `${bootcamp?.title || 'Bootcamp'} | Mentor | NEUPC` };
  } catch {
    return { title: 'Bootcamp | Mentor | NEUPC' };
  }
}

export default async function MentorBootcampDetailPage({ params }) {
  const { bootcampId } = await params;
  await requireRole('mentor');

  let bootcamp = null;
  let error = null;

  try {
    bootcamp = await getBootcampWithCurriculum(bootcampId);
  } catch (err) {
    error = err.message;
  }

  if (!bootcamp && !error) notFound();

  if (error) {
    return (
      <div className="mx-4 my-6 flex min-h-[400px] items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 sm:mx-6 lg:mx-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-400">Failed to load bootcamp</p>
          <p className="mt-2 text-xs text-red-300/80">{error}</p>
        </div>
      </div>
    );
  }

  // Fetch all bootcamp-scoped data in parallel; fail gracefully per section
  const [membersResult, sessions, mentorships, tasks, helpTickets] = await Promise.all([
    getMentorBootcampMembers(bootcampId).catch(() => ({ members: [], totalLessons: 0 })),
    getMentorBootcampSessions(bootcampId).catch(() => []),
    getMentorBootcampMentorships(bootcampId).catch(() => []),
    getBootcampTasks(bootcampId).catch(() => []),
    getBootcampHelpTickets(bootcampId).catch(() => []),
  ]);

  return (
    <MentorBootcampDetailClient
      bootcamp={bootcamp}
      members={membersResult.members}
      totalLessons={membersResult.totalLessons}
      sessions={sessions}
      mentorships={mentorships}
      tasks={tasks}
      helpTickets={helpTickets}
    />
  );
}
