'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useRole } from './RoleContext';
import AccountSidebar from './AccountSidebar';
import { getSidebarNavigation } from '@/app/_lib/sidebarConfig';

export default function AccountLayoutClient({ children, session, userRoles }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { activeRole } = useRole();
  // Hide sidebar only on the account selection page
  const hideSidebar = pathname === '/account';

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Close sidebar on route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Dynamic stats based on user session and role
  const stats = useMemo(() => {
    return {
      upcomingEvents: 5,
      participationCount: 7,
      notifications: 2,
      pendingMembers: 15,
      totalUsers: 245,
      mentees: 8,
      pendingReviews: 4,
    };
  }, [session]);

  // Get sidebar navigation based on role
  const sidebarNavigation = useMemo(() => {
    return getSidebarNavigation(activeRole, stats, session);
  }, [activeRole, stats, session]);

  return (
    <div className="relative flex min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950">
      <AccountSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        hideSidebar={hideSidebar}
        sidebarNavigation={sidebarNavigation}
        activeRole={activeRole}
        session={session}
        userRoles={userRoles}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
