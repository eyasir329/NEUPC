/**
 * @file Account hub page client wrapper.
 * Resets active role context when user visits the account selection page.
 *
 * @module AccountPageClient
 */

'use client';

import { useEffect } from 'react';
import { useRole } from './RoleContext';

export default function AccountPageClient({ children }) {
  const { setActiveRole } = useRole();

  useEffect(() => {
    // Reset active role when on the account hub/selection page
    setActiveRole(null);
  }, [setActiveRole]);

  return <>{children}</>;
}
