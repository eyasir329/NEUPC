/**
 * @file Shared API authentication and authorization guard.
 * Provides reusable helpers for API routes to verify session,
 * roles, and account status consistently.
 *
 * @module api-guard
 */

import { auth } from '@/app/_lib/auth';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { NextResponse } from 'next/server';

/**
 * Verify the current request is from an authenticated user with
 * the required role(s) and an active account.
 *
 * @param {string|string[]} requiredRoles — Role(s) the caller must have (at least one).
 * @param {object} [options]
 * @param {boolean} [options.checkAccountStatus=true] — Also verify account_status === 'active'.
 * @returns {Promise<{ session: object, user: object, userRoles: string[] } | NextResponse>}
 *   Returns user data on success, or a NextResponse error (401/403) on failure.
 */
export async function requireApiAuth(requiredRoles, options = {}) {
  const { checkAccountStatus = true } = options;

  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const userRoles = await getUserRoles(session.user.email);
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const hasRole = roles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  if (checkAccountStatus) {
    const user = await getUserByEmail(session.user.email);

    if (!user || user.account_status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    return { session, user, userRoles };
  }

  return { session, user: null, userRoles };
}

/**
 * Lightweight API auth — only checks that the user is authenticated
 * (no role requirement). Useful for endpoints any logged-in user can access.
 *
 * @returns {Promise<{ session: object, user: object } | NextResponse>}
 */
export async function requireApiSession() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await getUserByEmail(session.user.email);

  if (!user || user.account_status !== 'active') {
    return NextResponse.json(
      { error: 'Account is not active' },
      { status: 403 }
    );
  }

  return { session, user };
}

/**
 * Check if a requireApiAuth/requireApiSession result is an error response.
 * @param {object} result — Return value from requireApiAuth or requireApiSession.
 * @returns {boolean}
 */
export function isAuthError(result) {
  return result instanceof NextResponse;
}
