import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/app/_lib/auth-guard';
import {
  getBootcampCurriculumLight,
  checkEnrollment,
} from '@/app/_lib/bootcamp-actions';

export async function generateMetadata({ params }) {
  const { bootcampId, lessonId } = await params;
  try {
    const bootcamp = await getBootcampCurriculumLight(bootcampId);
    for (const c of bootcamp?.courses || []) {
      for (const m of c.modules || []) {
        const l = m.lessons?.find((l) => l.id === lessonId);
        if (l) return { title: `${l.title} | NEUPC` };
      }
    }
  } catch {}
  return { title: 'Lesson | NEUPC' };
}

// Auth + access guard for direct URL loads.
// The layout already mounts BootcampLearningClient — this page returns null.
// The client shell reads the lessonId from the URL and loads it client-side.
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

  // Verify lesson belongs to this bootcamp
  let stub = null;
  for (const c of bootcamp.courses || []) {
    for (const m of c.modules || []) {
      const found = m.lessons?.find((l) => l.id === lessonId);
      if (found) { stub = found; break; }
    }
    if (stub) break;
  }
  if (!stub) notFound();

  // For non-preview lessons, verify enrollment (layout already checked but
  // this catches direct URL hits before the layout runs in parallel).
  if (!stub.is_free_preview) {
    const enrollment = await checkEnrollment(bootcamp.id).catch(() => ({ enrolled: false }));
    if (!enrollment.enrolled) redirect(`/account/member/bootcamps/${bootcampId}`);
  }

  // Layout handles rendering — this page is intentionally empty.
  return null;
}
