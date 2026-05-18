import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/app/_lib/auth-guard';
import {
  getBootcampCurriculumLight,
  checkEnrollment,
  updateEnrollmentAccess,
  getBootcampProgress,
} from '@/app/_lib/bootcamp-actions';
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

export default async function BootcampLearningPage({ params }) {
  const { bootcampId } = await params;
  await requireRole('member');

  let bootcamp;
  try {
    bootcamp = await getBootcampCurriculumLight(bootcampId);
  } catch {
    notFound();
  }

  if (!bootcamp) notFound();

  const [enrollmentCheck, progressResult] = await Promise.all([
    checkEnrollment(bootcamp.id),
    getBootcampProgress(bootcamp.id).catch(() => ({ lessonProgress: {} })),
  ]);

  if (!enrollmentCheck.enrolled) {
    redirect(`/account/member/bootcamps`);
  }

  // Fire-and-forget — don't block render
  updateEnrollmentAccess(bootcamp.id).catch(() => {});

  const { lessonProgress } = progressResult;

  return <BootcampLearningClient bootcamp={bootcamp} lessonProgress={lessonProgress} />;
}
