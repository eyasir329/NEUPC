/**
 * @file Account layout (server component).
 * Authenticates the session, fetches user roles, and wraps all /account/*
 * routes in the RoleProvider context + sidebar layout.
 * Uses cached data-fetchers shared with `requireRole()` to deduplicate
 * DB queries within a single request.
 *
 * @module AccountLayout
 */

import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getCachedUserRoles } from '@/app/_lib/auth-guard';
import { getUserByEmail } from '@/app/_lib/data-service';
import AccountLayoutClient from './_components/AccountLayoutClient';
import { RoleProvider } from './_components/RoleContext';
import ChatFAB from '@/app/_components/chat/ChatFAB';

/** All account pages require runtime auth — prevent static generation */
export const dynamic = 'force-dynamic';

export default async function AccountLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRoles = await getCachedUserRoles(session.user.email);
  const dbUser = await getUserByEmail(session.user.email);

  // Serialize only the fields the client needs
  const userData = {
    name: session.user?.name || '',
    email: session.user?.email || '',
    image: session.user?.image || '',
    role: session.user?.role || 'guest',
  };

  const isGuest = userData.role === 'guest';
  const isActive = dbUser?.account_status === 'active';
  const showChat = !isGuest && isActive;

  return (
    <RoleProvider userRoles={userRoles}>
      <AccountLayoutClient session={userData} userRoles={userRoles}>
        {children}
      </AccountLayoutClient>
      {showChat && <ChatFAB session={session} />}
    </RoleProvider>
  );
}
