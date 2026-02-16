import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import JoinClient from './JoinClient';

export default async function Page() {
  const session = await auth();

  // Redirect to account if user is already logged in
  if (session?.user) {
    redirect('/account');
  }

  return <JoinClient />;
}
