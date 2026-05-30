/**
 * @file Admin bootcamp detail/edit page with curriculum builder.
 * @module AdminBootcampDetailPage
 */

import { notFound } from 'next/navigation';
import { getBootcampWithCurriculum } from '@/app/_lib/actions/bootcamp-actions';
import BootcampErrorState from '@/app/account/_components/bootcamps/BootcampErrorState';
import { safeFetch } from '@/app/account/_components/bootcamps/bootcampPageHelpers';
import BootcampDetailClient from './_components/BootcampDetailClient';

export async function generateMetadata({ params }) {
  const { bootcampId } = await params;
  const { data: bootcamp } = await safeFetch(() =>
    getBootcampWithCurriculum(bootcampId)
  );
  return {
    title: `${bootcamp?.title || 'Edit Bootcamp'} | Admin`,
    description: 'Edit bootcamp details and curriculum',
  };
}

export default async function AdminBootcampDetailPage({ params }) {
  const { bootcampId } = await params;
  const { data: bootcamp, error } = await safeFetch(() =>
    getBootcampWithCurriculum(bootcampId)
  );

  if (!bootcamp && !error) notFound();
  if (error) {
    return (
      <BootcampErrorState title="Failed to load bootcamp" message={error} />
    );
  }

  return <BootcampDetailClient bootcamp={bootcamp} />;
}
