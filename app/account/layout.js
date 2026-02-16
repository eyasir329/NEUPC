import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import AccountLayoutClient from './_components/AccountLayoutClient';
import { RoleProvider } from './_components/RoleContext';

export default async function AccountLayout({ children }) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <RoleProvider>
      <AccountLayoutClient session={session}>{children}</AccountLayoutClient>
    </RoleProvider>
  );
}
