import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/app/_lib/auth-guard';
import {
  getBootcampCurriculumLight,
  getLesson,
  checkEnrollment,
  getBootcampProgress,
  updateEnrollmentAccess,
} from '@/app/_lib/bootcamp-actions';
import BootcampLearningClient from '../_components/BootcampLearningClient';

export async function generateMetadata({ params }) {
  const { lessonId } = await params;
  try {
    const lesson = await getLesson(lessonId);
    return { title: `${lesson?.title || 'Lesson'} | NEUPC` };
  } catch {
    return { title: 'Lesson | NEUPC' };
  }
}

export default async function LessonPage({ params }) {
  const { bootcampId, lessonId } = await params;
  await requireRole('member');

  let bootcamp;
  try {
    bootcamp = await getBootcampCurriculumLight(bootcampId);
  } catch {
    notFound();
  }
  if (!bootcamp) notFound();

  // Verify lesson belongs to this bootcamp via the curriculum (no extra query).
  let stub = null;
  for (const c of bootcamp.courses || []) {
    for (const m of c.modules || []) {
      const found = m.lessons?.find((l) => l.id === lessonId);
      if (found) { stub = found; break; }
    }
    if (stub) break;
  }
  if (!stub) notFound();

  let lesson;
  try {
    lesson = await getLesson(lessonId);
  } catch {
    notFound();
  }
  if (!lesson) notFound();

  if (!stub.is_free_preview) {
    const enrollmentCheck = await checkEnrollment(bootcamp.id);
    if (!enrollmentCheck.enrolled) redirect(`/account/member/bootcamps/${bootcampId}`);
  }

  await updateEnrollmentAccess(bootcamp.id).catch(() => {});

  const { lessonProgress } = await getBootcampProgress(bootcamp.id).catch(() => ({ lessonProgress: {} }));

  // Render the same SPA shell with the lesson pre-selected and preloaded
  return (
    <BootcampLearningClient
      bootcamp={bootcamp}
      lessonProgress={lessonProgress}
      initialLessonId={lessonId}
      initialLesson={lesson}
    />
  );
}
