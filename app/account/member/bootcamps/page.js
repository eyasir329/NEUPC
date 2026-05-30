/**
 * @file Member bootcamps page — displays all available bootcamps
 *   with enrollment status and progress tracking.
 * @module MemberBootcampsPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getMyEnrollments,
  getBootcampProgress,
  getMemberBootcamps,
  getLearningActivity,
} from '@/app/_lib/actions/bootcamp-actions';
import MemberBootcampsClient from './_components/MemberBootcampsClient';

export const metadata = { title: 'Bootcamps | Member | NEUPC' };

export default async function MemberBootcampsPage() {
  const { user } = await requireRole('member');

  // Fetch all published bootcamps (for members to browse)
  const allBootcamps = await getMemberBootcamps().catch(() => []);

  // Fetch user's enrollments (active + completed, including archived bootcamps)
  const enrollments = await getMyEnrollments().catch(() => []);

  // Split into active-bootcamp and archived-bootcamp enrollments
  const valid = enrollments.filter(
    (e) => e.bootcamps?.id && e.bootcamps.status !== 'archived'
  );
  const archivedValid = enrollments.filter(
    (e) => e.bootcamps?.id && e.bootcamps.status === 'archived'
  );

  // Fetch progress for all + learning activity in parallel
  const [progressList, archivedProgressList, learningActivity] =
    await Promise.all([
      Promise.all(
        valid.map((e) =>
          getBootcampProgress(e.bootcamps.id).catch(() => ({
            lessonProgress: {},
          }))
        )
      ),
      Promise.all(
        archivedValid.map((e) =>
          getBootcampProgress(e.bootcamps.id).catch(() => ({
            lessonProgress: {},
          }))
        )
      ),
      getLearningActivity(null, 365).catch(() => []),
    ]);

  const enrollmentMap = {};
  valid.forEach((enrollment, idx) => {
    const progress = progressList[idx];
    const completedCount = Object.values(progress.lessonProgress || {}).filter(
      (p) => p.is_completed
    ).length;
    enrollmentMap[enrollment.bootcamps.id] = {
      ...enrollment,
      completed_lessons: completedCount,
      progressData: progress,
    };
  });

  const archivedEnrollmentMap = {};
  archivedValid.forEach((enrollment, idx) => {
    const progress = archivedProgressList[idx];
    const completedCount = Object.values(progress.lessonProgress || {}).filter(
      (p) => p.is_completed
    ).length;
    archivedEnrollmentMap[enrollment.bootcamps.id] = {
      ...enrollment,
      completed_lessons: completedCount,
      progressData: progress,
    };
  });

  return (
    <MemberBootcampsClient
      user={user}
      bootcamps={allBootcamps}
      enrollmentMap={enrollmentMap}
      archivedEnrollmentMap={archivedEnrollmentMap}
      learningActivity={learningActivity}
    />
  );
}
