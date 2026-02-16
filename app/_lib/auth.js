import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { createGuest, getGuest, getUserRoles, updateGuest } from './data-service';

const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      return !!auth?.user;
    },
    async signIn({ user, account, profile }) {
      try {
        // Check if user already exists in database
        const existingGuest = await getGuest(user.email);

        if (!existingGuest) {
          // Create new user in database
          await createGuest({
            email: user.email,
            full_name: user.name,
            avatar_url: user.image,
            provider: account.provider,
            created_at: new Date().toISOString(),
          });
          console.log('New user created:', user.email);
        } else {
          // Update last login time for existing user
          const updateResult = await updateGuest(user.email, {
            last_login: new Date().toISOString(),
          });
        }

        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        // Allow sign-in even if database operation fails
        // This prevents users from being locked out if database is down
        return true;
      }
    },
    async session({ session, token }) {
      // Add user info to session
      if (token?.sub) {
        session.user.id = token.sub;
      }

      // Optionally fetch additional user data from database
      try {
        const userData = await getGuest(session.user.email);
        const userRoles = await getUserRoles(session.user.email);
        
        if (userData) {
          session.user.fullName = userData.full_name;
          session.user.avatarUrl = userData.avatar_url;
        }
        
        // Set roles (getUserRoles already returns array of role names)
        session.user.roles = userRoles;
      } catch (error) {
        console.error('Error fetching user data for session:', error);
        // Default to guest role if error occurs
        session.user.roles = ['guest'];
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
