import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getUserEventRegistrations,
  getUserCertificates,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import GuestParticipationClient from './_components/GuestParticipationClient';

export const metadata = { title: 'My Participation | Guest' };

export default async function GuestParticipationPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('guest')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active') redirect('/account');

  const [registrations, certificates] = await Promise.all([
    getUserEventRegistrations(user.id).catch(() => []),
    getUserCertificates(user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="guest" />
      <GuestParticipationClient
        registrations={registrations}
        certificates={certificates}
        userName={user.full_name}
      />
    </div>
  );
}
