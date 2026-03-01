/**
 * @file auth
 * @module auth
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { NextResponse } from 'next/server';
import {
  createUser,
  getUserByEmail,
  getUserRoles,
  updateUser,
} from './data-service';

const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = request.nextUrl.pathname === '/login';

      if (!isLoggedIn && !isOnLoginPage) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
      }

      return true;
    },

    async signIn({ user, account }) {
      try {
        const existingUser = await getUserByEmail(user.email);

        if (!existingUser) {
          // Generate initials as avatar fallback if no image provided
          const initials =
            user.name
              ?.split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase() || '?';

          const avatarValue = user.image || initials;

          await createUser({
            email: user.email,
            full_name: user.name,
            avatar_url: avatarValue,
            email_verified: true,
            account_status: 'pending',
            status_reason: 'Pending approval',
            is_active: false,
            provider: account?.provider || 'google',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          await updateUser(existingUser.id, {
            is_active: true,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        // Allow sign-in even if DB operations fail to prevent lockout,
        // but the user may not have full account data until next login.
        // This is intentional: blocking login on transient DB errors
        // would lock all users out during maintenance.
        return true;
      }
    },

    async signOut({ token }) {
      try {
        if (token?.email) {
          const dbUser = await getUserByEmail(token.email);
          if (dbUser) {
            await updateUser(dbUser.id, {
              is_active: false,
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Error during sign out:', error);
      }
      return true;
    },

    async session({ session, token }) {
      if (token?.sub) {
        session.user = session.user || {};

        // Try to use the token.sub as ID (for newly created users with Google ID)
        // But also fetch actual user from DB to get their real ID in case they were created before this fix
        if (session.user.email) {
          try {
            const dbUser = await getUserByEmail(session.user.email);
            if (dbUser) {
              session.user.id = dbUser.id; // Use database ID
            } else {
              session.user.id = token.sub; // Fallback to token.sub for new users
            }

            const userRoles = await getUserRoles(session.user.email);
            session.user.role = userRoles[0] || 'guest';
          } catch (error) {
            console.error(
              'Error fetching user info in session callback:',
              error
            );
            session.user.id = token.sub;
            session.user.role = 'guest';
          }
        } else {
          session.user.id = token.sub;
          session.user.role = 'guest';
        }
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(authConfig);
