/**
 * @file Admin bootcamps listing page.
 * @module AdminBootcampsPage
 */

import { getAdminBootcamps } from '@/app/_lib/actions/bootcamp-actions';
import BootcampErrorState from '@/app/account/_components/bootcamps/BootcampErrorState';
import { safeFetch } from '@/app/account/_components/bootcamps/bootcampPageHelpers';
import BootcampManagementClient from './_components/BootcampManagementClient';

export const metadata = {
  title: 'Bootcamp Management | Admin',
  description: 'Manage bootcamp programs, courses, and enrollments',
};

export default async function AdminBootcampsPage() {
  const { data: bootcamps, error } = await safeFetch(getAdminBootcamps);

  if (error) {
    return <BootcampErrorState message={error} />;
  }

  return <BootcampManagementClient initialBootcamps={bootcamps || []} />;
}
