/**
 * @file Advisor Bootcamp Analytics page.
 * @module AdvisorBootcampsPage
 * @access advisor
 */

import { getAdvisorBootcampAnalytics } from '@/app/_lib/actions/bootcamp-actions';
import BootcampErrorState from '@/app/account/_components/bootcamps/BootcampErrorState';
import { safeFetch } from '@/app/account/_components/bootcamps/bootcampPageHelpers';
import AdvisorBootcampClient from './_components/AdvisorBootcampClient';

export const metadata = {
  title: 'Bootcamp Analytics | Advisor | NEUPC',
  description:
    'Faculty advisor overview of bootcamp cohort performance, enrollment trends, and student progress.',
};

export default async function AdvisorBootcampsPage() {
  const { data: analytics, error } = await safeFetch(
    getAdvisorBootcampAnalytics
  );

  if (error) {
    return (
      <BootcampErrorState
        title="Failed to load bootcamp analytics"
        message={error}
      />
    );
  }

  return <AdvisorBootcampClient analytics={analytics} />;
}
