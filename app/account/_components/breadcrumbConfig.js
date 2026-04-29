/**
 * @file Breadcrumb label map for dashboard topbar.
 * Maps URL segments to human labels across every role's routes.
 *
 * @module breadcrumbConfig
 */

import { ROLE_LABELS } from './roleTheme';

export const SEGMENT_LABELS = {
  // Roles
  ...ROLE_LABELS,
  account: 'Account',

  // Common
  dashboard: 'Dashboard',
  profile: 'Profile',
  settings: 'Settings',
  notifications: 'Notifications',
  events: 'Events',
  resources: 'Resources',
  participation: 'My Participation',
  achievements: 'Achievements',
  discussions: 'Discussions',
  notices: 'Notices',
  gallery: 'Gallery',
  blogs: 'Blogs',
  certificates: 'Certificates',
  bootcamps: 'Bootcamps',
  committee: 'Committee',
  analytics: 'Analytics',
  reports: 'Reports',
  members: 'Members',
  users: 'Users',
  roles: 'Roles',
  security: 'Security',
  'system-logs': 'System Logs',
  applications: 'Applications',
  'contact-submissions': 'Contact Submissions',
  contests: 'Contests',
  registrations: 'Registrations',
  'membership-application': 'Apply',
  'problem-solving': 'Problem Solving',
  'problem-solving-extraction': 'PS Extraction',
  roadmaps: 'Roadmaps',
  budget: 'Budget',
  approvals: 'Approvals',
  'club-overview': 'Club Overview',
  'assigned-members': 'Assigned Members',
  recommendations: 'Recommendations',
  sessions: 'Sessions',
  tasks: 'Tasks',
  export: 'Export',
};

export function labelFor(segment) {
  if (!segment) return '';
  return SEGMENT_LABELS[segment] || segment.replace(/-/g, ' ');
}

/**
 * Build crumb list from pathname.
 * /account/admin/users/create → [Account, Admin, Users, Create]
 * Skips trailing UUIDs / numeric IDs.
 */
export function buildBreadcrumbs(pathname) {
  if (!pathname) return [];
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((seg, i) => {
    const isId = /^[0-9a-f]{8,}$|^\d+$/i.test(seg);
    return {
      label: isId ? '#' + seg.slice(0, 6) : labelFor(seg),
      href: '/' + parts.slice(0, i + 1).join('/'),
    };
  });
}
