/**
 * @file Account layout client wrapper.
 * Manages sidebar state, role detection from URL, and navigation config.
 *
 * @module AccountLayoutClient
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useRole } from './RoleContext';
import AccountSidebar from './AccountSidebar';
import { getSidebarNavigation } from '@/app/_lib/sidebarConfig';

// Valid role segments in the URL
const VALID_ROLES = [
  'guest',
  'member',
  'executive',
  'admin',
  'mentor',
  'advisor',
];

/**
 * Detect active role from the current URL pathname.
 * e.g., /account/admin/events → 'admin'
 */
function getRoleFromPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  // pathname is /account/<role>/...
  if (segments.length >= 2 && segments[0] === 'account') {
    const roleSegment = segments[1];
    if (VALID_ROLES.includes(roleSegment)) {
      return roleSegment;
    }
  }
  return null;
}

// Sidebar navigation stats (placeholder — replace with real data via props)
const SIDEBAR_STATS = {
  upcomingEvents: 5,
  participationCount: 7,
  notifications: 2,
  pendingMembers: 15,
  totalUsers: 245,
  mentees: 8,
  pendingReviews: 4,
};

export default function AccountLayoutClient({ children, session, userRoles }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { activeRole, setActiveRole } = useRole();

  // Auto-detect and sync role from URL
  const detectedRole = getRoleFromPath(pathname);

  useEffect(() => {
    if (detectedRole && detectedRole !== activeRole) {
      setActiveRole(detectedRole);
    }
  }, [detectedRole, activeRole, setActiveRole]);

  const currentRole = detectedRole || activeRole;

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

  // Get sidebar navigation based on current role
  const sidebarNavigation = useMemo(() => {
    return getSidebarNavigation(currentRole, SIDEBAR_STATS, session);
  }, [currentRole, session]);

  return (
    <div className="relative flex min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950">
      <AccountSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        hideSidebar={hideSidebar}
        sidebarNavigation={sidebarNavigation}
        activeRole={currentRole}
        session={session}
        userRoles={userRoles}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
