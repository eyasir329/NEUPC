import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import {
  createGuest,
  getGuest,
  getUserRoles,
  updateGuest,
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
      return !!auth?.user;
    },
    async signIn({ user, account, profile }) {
      try {
        // Check if user already exists in database
        const existingGuest = await getGuest(user.email);

        if (!existingGuest) {
          // Create new user in database
          // Note: For OAuth users, password_hash should be nullable in DB
          await createGuest({
            email: user.email,
            full_name: user.name,
            avatar: user.image,
            email_verified: true, // OAuth emails are verified
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          console.log('New OAuth user created:', user.email);
        } else {
          // Update last login time for existing user
          await updateGuest(user.email, {
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          console.log('Existing user logged in:', user.email);
        }

        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        // Allow sign-in even if database operation fails
        // This prevents users from being locked out if database is down
        console.warn('Proceeding with sign-in despite database error');
        return true;
      }
    },
    async session({ session, token }) {
      // Add user info to session
      if (token?.sub) {
        session.user.id = token.sub;
      }

      // Set default role - this will be overridden by page-level calls
      session.user.role = 'guest';

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
