/**
 * @file Mentor sessions page — scheduler for upcoming mentorship rooms +
 *   log/history of past one-on-one sessions.
 * @module MentorSessionsPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getMentorshipsByMentor } from '@/app/_lib/data-service';
import { getMentorAssignedBootcamps, getEnrollmentsWithProgress } from '@/app/_lib/bootcamp-actions';
import { getMentorScheduledSessionsAction, getMentorPastScheduledSessionsAction } from '@/app/_lib/mentor-actions';
import MentorSessionsClient from './_components/MentorSessionsClient';

export const metadata = { title: 'Sessions | Mentor | NEUPC' };

export default async function MentorSessionsPage() {
  const { user } = await requireRole('mentor');

  const [mentorships, bootcamps, scheduledResult, pastScheduledResult] = await Promise.all([
    getMentorshipsByMentor(user.id).catch(() => []),
    getMentorAssignedBootcamps().catch(() => []),
    getMentorScheduledSessionsAction().catch(() => ({ sessions: [] })),
    getMentorPastScheduledSessionsAction().catch(() => ({ sessions: [] })),
  ]);

  const bootcampStudents = await Promise.all(
    bootcamps.map(async (bc) => {
      try {
        const { enrollments } = await getEnrollmentsWithProgress(bc.id);
        const students = enrollments
          .filter((e) => e.status === 'active')
          .map((e) => ({
            id: e.user_id,
            name: e.users?.full_name || 'Unknown',
            email: e.users?.email || '',
            avatar_url: e.users?.avatar_url,
          }));
        return { ...bc, students };
      } catch {
        return { ...bc, students: [] };
      }
    })
  );

  const allStudents = bootcampStudents.flatMap((bc) =>
    (bc.students || []).map((s) => ({ ...s, bootcampId: bc.id }))
  );

  const enrichSessions = (sessions) =>
    (sessions ?? []).map((s) => {
      const bcStudents = bootcampStudents.find((bc) => bc.id === s.bootcamp_id)?.students ?? allStudents;
      const bcTitle = bootcampStudents.find((bc) => bc.id === s.bootcamp_id)?.title?.split(':')[0] ?? '';
      if (s.target_type === 'one-on-one') {
        const student = bcStudents.find((u) => u.id === (s.target_student_ids ?? [])[0]);
        return { ...s, targetType: s.target_type, targetStudentName: student?.name ?? '', targetStudentAvatar: student?.avatar_url ?? null, bootcampTitle: bcTitle };
      }
      if (s.target_type === 'selected-group') {
        const matched = (s.target_student_ids ?? []).map((id) => bcStudents.find((u) => u.id === id)).filter(Boolean);
        return { ...s, targetType: s.target_type, targetStudentNames: matched.map((u) => u.name), targetStudentAvatars: matched.map((u) => u.avatar_url ?? null), bootcampTitle: bcTitle };
      }
      return { ...s, targetType: s.target_type, targetStudentNamesAll: bcStudents.map((u) => u.name), targetStudentAvatars: bcStudents.map((u) => u.avatar_url ?? null), bootcampTitle: bcTitle };
    });

  return (
    <MentorSessionsClient
      mentorships={mentorships}
      mentorId={user.id}
      bootcamps={bootcampStudents}
      scheduledSessions={enrichSessions(scheduledResult.sessions)}
      pastScheduledSessions={enrichSessions(pastScheduledResult.sessions)}
    />
  );
}
