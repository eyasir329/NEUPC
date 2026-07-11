/**
 * @file Member Problem Solving Profile Page
 * @module MemberProfilePage
 * @access member
 *
 * View another member's problem solving statistics and activity.
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getMemberProblemSolvingData } from '@/app/_lib/actions/problem-solving-actions';
import { notFound } from 'next/navigation';
import PeerProfileClient from './_components/PeerProfileClient';
import { PageShell } from '@/app/account/_components/ui';

export async function generateMetadata({ params }) {
  const { userId } = await params;
  const result = await getMemberProblemSolvingData(userId);

  if (!result.success) {
    return { title: 'Member Not Found | NEUPC' };
  }

  return {
    title: `${result.data.profile.name}'s Problem Solving | NEUPC`,
  };
}

export default async function MemberProfilePage({ params }) {
  await requireRole('member');
  const { userId } = await params;

  const result = await getMemberProblemSolvingData(userId);

  if (!result.success) {
    notFound();
  }

  return (
    <PageShell className="text-gray-300">
      <PeerProfileClient data={result.data} />
    </PageShell>
  );
}
