/**
 * @file Member Code Runner Page
 * @module MemberCodeRunnerPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import CodeRunnerClient from './_components/CodeRunnerClient';

export const metadata = {
  title: 'Code Runner | Member Dashboard | NEUPC',
  description: 'Online sandbox for running, formatting, and debugging code with an AI tutor.',
};

export default async function MemberCodeRunnerPage() {
  await requireRole('member');

  return <CodeRunnerClient />;
}
