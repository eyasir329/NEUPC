/**
 * @file Server action authentication guard.
 * Provides reusable auth verification for 'use server' actions
 * that derive userId from the session instead of trusting client input.
 *
 * @module action-guard
 */

import { auth } from '@/app/_lib/auth';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';

/**
 * Verify the caller is authenticated with the required role(s)
 * and return verified user data. For use in server actions.
 *
 * Unlike requireRole (for pages), this does NOT redirect —
 * it returns an error object that the action can return to the client.
 *
 * @param {string|string[]} requiredRoles — Role(s) needed (at least one).
 * @param {object} [options]
 * @param {boolean} [options.checkAccountStatus=true]
 * @returns {Promise<{ user: object, userRoles: string[] } | { error: string }>}
 */
export async function requireActionAuth(requiredRoles, options = {}) {
  const { checkAccountStatus = true } = options;

  const session = await auth();

  if (!session?.user?.email) {
    return { error: 'Authentication required. Please sign in.' };
  }

  const userRoles = await getUserRoles(session.user.email);
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const hasRole = roles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    return { error: 'You do not have permission to perform this action.' };
  }

  if (checkAccountStatus) {
    const user = await getUserByEmail(session.user.email);

    if (!user || user.account_status !== 'active') {
      return { error: 'Your account is not active.' };
    }

    return { user, userRoles };
  }

  // Return minimal user data from session when skipping DB check
  return { user: { email: session.user.email }, userRoles };
}

/**
 * Lightweight action auth — checks authentication only (no role requirement).
 * Returns the verified user from the database.
 *
 * @returns {Promise<{ user: object } | { error: string }>}
 */
export async function requireActionSession() {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: 'Authentication required. Please sign in.' };
  }

  const user = await getUserByEmail(session.user.email);

  if (!user) {
    return { error: 'User not found.' };
  }

  if (user.account_status !== 'active') {
    return { error: 'Your account is not active.' };
  }

  return { user };
}
