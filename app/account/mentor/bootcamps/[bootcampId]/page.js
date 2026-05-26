import { notFound } from 'next/navigation';
import { requireRole } from '@/app/_lib/auth-guard';
import { getBootcampWithCurriculum } from '@/app/_lib/bootcamp-actions';
import BootcampErrorState from '@/app/account/_components/bootcamps/BootcampErrorState';
import { safeFetch } from '@/app/account/_components/bootcamps/bootcampPageHelpers';
import MentorBootcampDetailClient from './_components/MentorBootcampDetailClient';

export async function generateMetadata({ params }) {
  const { bootcampId } = await params;
  const { data: bootcamp } = await safeFetch(() => getBootcampWithCurriculum(bootcampId));
  return { title: `${bootcamp?.title || 'Bootcamp'} | Mentor | NEUPC` };
}

export default async function MentorBootcampDetailPage({ params }) {
  const { bootcampId } = await params;
  await requireRole('mentor');
  const { data: bootcamp, error } = await safeFetch(() => getBootcampWithCurriculum(bootcampId));

  if (!bootcamp && !error) notFound();
  if (error) {
    return <BootcampErrorState title="Failed to load bootcamp" message={error} />;
  }

  return <MentorBootcampDetailClient bootcamp={bootcamp} />;
}
