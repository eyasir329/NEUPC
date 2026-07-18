/**
 * @file Admin committee management page (server component)
 * Fetches committee data and renders the professional management interface
 * @module AdminCommitteePage
 */

import {
  getAllCommitteeMembers,
  getCommitteePositions,
  getUsersBasic,
} from '@/app/_lib/services/data-service';
import CommitteeManagementClient from './_components/CommitteeManagementClient';

export const metadata = { title: 'Committee | Admin | NEUPC' };

export default async function AdminCommitteePage() {
  const [members, positions, users] = await Promise.all([
    getAllCommitteeMembers().catch(() => []),
    getCommitteePositions().catch(() => []),
    getUsersBasic().catch(() => []),
  ]);

  return (
    <CommitteeManagementClient
      initialMembers={members}
      initialPositions={positions}
      initialUsers={users}
    />
  );
}
