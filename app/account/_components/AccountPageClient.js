'use client';

import { useEffect } from 'react';
import { useRole } from './RoleContext';

export default function AccountPageClient({ children }) {
  const { setActiveRole } = useRole();

  useEffect(() => {
    // Set role to 'yayaha' when on account selection page
    setActiveRole('yayaha');
  }, [setActiveRole]);

  return <>{children}</>;
}
