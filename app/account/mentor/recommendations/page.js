import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getMentorshipsByMentor,
} from '@/app/_lib/data-service';
import RoleSync from '@/app/account/_components/RoleSync';
import MentorRecommendationsClient from './_components/MentorRecommendationsClient';

export const metadata = { title: 'Recommendations | Mentor | NEUPC' };

export default async function MentorRecommendationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const mentorships = await getMentorshipsByMentor(user.id).catch(() => []);

  return (
    <>
      <RoleSync role="mentor" />
      <MentorRecommendationsClient
        mentorships={mentorships}
        mentorId={user.id}
      />
    </>
  );
}
