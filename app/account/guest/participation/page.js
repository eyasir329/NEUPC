/**
 * @file Guest participation tracker — shows event registrations and any
 *   certificates earned by the guest user, providing a record of their
 *   involvement with club activities.
 * @module GuestParticipationPage
 * @access guest
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getUserEventRegistrations,
  getUserCertificates,
} from '@/app/_lib/data-service';
import GuestParticipationClient from './_components/GuestParticipationClient';

export const metadata = { title: 'My Participation | Guest | NEUPC' };

export default async function GuestParticipationPage() {
  const { user } = await requireRole('guest', { checkIsActive: false });

  const [registrations, certificates] = await Promise.all([
    getUserEventRegistrations(user.id).catch(() => []),
    getUserCertificates(user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <GuestParticipationClient
        registrations={registrations}
        certificates={certificates}
        userName={user.full_name}
      />
    </div>
  );
}
