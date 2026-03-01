/**
 * @file User Role Provider
 * @module UserRoleProvider
 */

'use client';

import { createContext, useContext } from 'react';

const UserRoleContext = createContext(null);

/**
 * Provides user role info to all client components.
 * Wrap in root layout with the session's user role.
 *
 * @param {string|null} role – User role from session (null if not logged in)
 */
export function UserRoleProvider({ role = null, children }) {
  return (
    <UserRoleContext.Provider value={role}>{children}</UserRoleContext.Provider>
  );
}

/**
 * Returns the current user's role, or null if not logged in.
 * Roles: 'guest' | 'member' | 'admin' | 'executive' | 'advisor' | 'mentor'
 */
export function useUserRole() {
  return useContext(UserRoleContext);
}

/**
 * Returns true if the user is a non-guest member (already joined).
 * When true, "Join" CTAs should be hidden.
 */
export function useIsMember() {
  const role = useUserRole();
  return role !== null && role !== 'guest';
}
