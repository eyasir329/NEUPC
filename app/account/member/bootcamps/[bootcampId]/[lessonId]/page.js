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
  const { bootcampId, lessonId } = await params;
  try {
    // Use the curriculum light fetch (shared with page handler via Next.js request dedup)
    // rather than a separate getLesson call. Falls back gracefully.
    const bootcamp = await getBootcampCurriculumLight(bootcampId);
    let title = 'Lesson';
    for (const c of bootcamp?.courses || []) {
      for (const m of c.modules || []) {
        const l = m.lessons?.find((l) => l.id === lessonId);
        if (l) { title = l.title; break; }
      }
    }
    return { title: `${title} | NEUPC` };
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

  // Run independent fetches in parallel
  const [lessonResult, enrollmentCheck, progressResult] = await Promise.allSettled([
    getLesson(lessonId),
    stub.is_free_preview ? Promise.resolve({ enrolled: true }) : checkEnrollment(bootcamp.id),
    getBootcampProgress(bootcamp.id),
  ]);

  const lesson = lessonResult.status === 'fulfilled' ? lessonResult.value : null;
  if (!lesson) notFound();

  if (!stub.is_free_preview) {
    const enrollment = enrollmentCheck.status === 'fulfilled' ? enrollmentCheck.value : { enrolled: false };
    if (!enrollment.enrolled) redirect(`/account/member/bootcamps/${bootcampId}`);
  }

  const { lessonProgress } = progressResult.status === 'fulfilled'
    ? progressResult.value
    : { lessonProgress: {} };

  // Fire-and-forget — don't block render
  updateEnrollmentAccess(bootcamp.id).catch(() => {});

  return (
    <BootcampLearningClient
      bootcamp={bootcamp}
      lessonProgress={lessonProgress}
      initialLessonId={lessonId}
      initialLesson={lesson}
    />
  );
}
