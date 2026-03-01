/**
 * @file auth guard
 * @module auth-guard
 */

import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { cache } from 'react';

/**
 * Cached version of getUserByEmail — deduplicated within a single request.
 * When layout.js and page.js both call requireRole(), the DB query runs only once.
 */
const getCachedUserByEmail = cache(async (email) => {
  return getUserByEmail(email);
});

/**
 * Cached version of getUserRoles — deduplicated within a single request.
 */
const getCachedUserRoles = cache(async (email) => {
  return getUserRoles(email);
});

/**
 * Centralized auth guard for role-based pages.
 * Handles authentication, role verification, and account status checks.
 *
 * @param {string|string[]} requiredRole - Role(s) required to access the page.
 *   Pass a single role string or an array (user needs at least one).
 * @param {object} [options] - Additional options.
 * @param {boolean} [options.checkIsActive=true] - Whether to check is_active flag.
 *   Set to false for guest role (guests only need account_status === 'active').
 * @returns {Promise<{session: object, user: object, userRoles: string[]}>}
 */
export async function requireRole(requiredRole, options = {}) {
  const { checkIsActive = true } = options;

  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const email = session.user.email;
  const userRoles = await getCachedUserRoles(email);

  // Support single role or array of roles
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const hasRole = roles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    redirect('/account');
  }

  const user = await getCachedUserByEmail(email);

  if (user?.account_status !== 'active') {
    redirect('/account');
  }

  if (checkIsActive && !user?.is_active) {
    redirect('/account');
  }

  return { session, user, userRoles };
}

/**
 * Lightweight auth check — validates authentication only.
 * Use in pages that don't need role checking (e.g., /account hub).
 *
 * @returns {Promise<{session: object, user: object, userRoles: string[]}>}
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const email = session.user.email;
  const [user, userRoles] = await Promise.all([
    getCachedUserByEmail(email),
    getCachedUserRoles(email),
  ]);

  return { session, user, userRoles };
}

// Re-export cached getters for pages that need user data without full guard
export { getCachedUserByEmail, getCachedUserRoles };
