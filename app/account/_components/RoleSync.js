/**
 * @file Role synchronization component.
 * Syncs active role in Context API from server-detected role prop.
 *
 * @module RoleSync
 */

'use client';

import { useEffect } from 'react';
import { useRole } from './RoleContext';

/** @param {{ role: string }} props */
export default function RoleSync({ role }) {
  const { setActiveRole } = useRole();

  useEffect(() => {
    if (role) {
      setActiveRole(role);
    }
  }, [role, setActiveRole]);

  return null; // This component doesn't render anything
}
