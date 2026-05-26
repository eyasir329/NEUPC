/**
 * @file Executive bootcamps listing page.
 * @module ExecutiveBootcampsPage
 */

import { getAdminBootcamps } from '@/app/_lib/bootcamp-actions';
import BootcampErrorState from '@/app/account/_components/bootcamps/BootcampErrorState';
import { safeFetch } from '@/app/account/_components/bootcamps/bootcampPageHelpers';
import BootcampManagementClient from '../../admin/bootcamps/_components/BootcampManagementClient';

export const metadata = {
  title: 'Bootcamp Management | Executive',
  description: 'Manage bootcamp programs, courses, and enrollments',
};

export default async function ExecutiveBootcampsPage() {
  const { data: bootcamps, error } = await safeFetch(getAdminBootcamps);

  if (error) {
    return <BootcampErrorState message={error} />;
  }

  return <BootcampManagementClient initialBootcamps={bootcamps || []} />;
}
