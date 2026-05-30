/**
 * @file Bootcamp id layout
 * @module BootcampIdLayout
 */

import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getBootcampCurriculumLight,
  checkEnrollment,
  getBootcampProgress,
  updateEnrollmentAccess,
} from '@/app/_lib/actions/bootcamp-actions';
import { getUserByEmail } from '@/app/_lib/services/data-service';
import BootcampLearningClient from './_components/BootcampLearningClient';

export async function generateMetadata({ params }) {
  const { bootcampId } = await params;
  try {
    const bootcamp = await getBootcampCurriculumLight(bootcampId);
    return { title: `${bootcamp?.title || 'Bootcamp'} | NEUPC` };
  } catch {
    return { title: 'Bootcamp | NEUPC' };
  }
}

export default async function BootcampLayout({ params, children }) {
  const { bootcampId } = await params;
  await requireRole('member');

  const { user: sessionUser } = await requireRole('member');

  let bootcamp;
  try {
    bootcamp = await getBootcampCurriculumLight(bootcampId);
  } catch {
    notFound();
  }
  if (!bootcamp) notFound();

  const [enrollmentCheck, progressResult, currentUser] = await Promise.all([
    checkEnrollment(bootcamp.id),
    getBootcampProgress(bootcamp.id).catch(() => ({ lessonProgress: {} })),
    sessionUser?.email
      ? getUserByEmail(sessionUser.email)
          .then((u) =>
            u
              ? { id: u.id, full_name: u.full_name, avatar_url: u.avatar_url }
              : null
          )
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!enrollmentCheck.enrolled) {
    redirect(`/account/member/bootcamps`);
  }

  updateEnrollmentAccess(bootcamp.id).catch(() => {});

  const { lessonProgress } = progressResult;

  return (
    <BootcampLearningClient
      bootcamp={bootcamp}
      lessonProgress={lessonProgress}
      enrollment={enrollmentCheck.enrollment}
      currentUser={currentUser}
    />
  );
}
