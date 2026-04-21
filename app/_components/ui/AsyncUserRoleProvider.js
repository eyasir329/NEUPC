import { auth } from '@/app/_lib/auth';
import { UserRoleProvider } from './UserRoleProvider';

export default async function AsyncUserRoleProvider({ children }) {
  const session = await auth();
  return (
    <UserRoleProvider role={session?.user?.role || null} isLoggedIn={!!session}>
      {children}
    </UserRoleProvider>
  );
}
