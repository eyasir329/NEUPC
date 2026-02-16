'use client';

import { useEffect } from 'react';
import { useRole } from './RoleContext';

/**
 * Client component that syncs the active role in Context API
 * based on the role prop passed from server component
 */
export default function RoleSync({ role }) {
  const { setActiveRole } = useRole();

  useEffect(() => {
    if (role) {
      setActiveRole(role);
    }
  }, [role, setActiveRole]);

  return null; // This component doesn't render anything
}
