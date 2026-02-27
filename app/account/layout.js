import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/app/_lib/data-service';
import AccountLayoutClient from './_components/AccountLayoutClient';
import { RoleProvider } from './_components/RoleContext';

export default async function AccountLayout({ children }) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user roles
  const userRoles = await getUserRoles(session.user.email);

  // Extract only serializable data from session
  const userData = {
    name: session.user?.name || '',
    email: session.user?.email || '',
    image: session.user?.image || '',
    role: session.user?.role || 'guest',
  };

  return (
    <RoleProvider>
      <AccountLayoutClient session={userData} userRoles={userRoles}>
        {children}
      </AccountLayoutClient>
    </RoleProvider>
  );
}
