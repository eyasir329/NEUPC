/**
 * @file role Dashboard Config
 * @module roleDashboardConfig
 */

export const roleDashboards = {
  guest: {
    title: 'Public Account',
    description: 'Limited access to public features',
    color: 'blue',
    icon: 'User',
    path: '/account/guest',
    features: ['Browse Events', 'Register for Events', 'View Achievements'],
    ctaText: 'Apply for Membership',
    ctaPath: '/account/guest/membership-application',
  },
  member: {
    title: 'Member Dashboard',
    description: 'Full access to club resources',
    color: 'purple',
    icon: 'UserCog',
    path: '/account/member',
    features: [
      'Exclusive Contests',
      'Problem Archives',
      'Discussion Forum',
      'Mentorship',
    ],
  },
  executive: {
    title: 'Executive Panel',
    description: 'Manage events and members',
    color: 'amber',
    icon: 'Shield',
    path: '/account/executive',
    features: [
      'Event Management',
      'Member Approval',
      'Content Moderation',
      'Reports',
    ],
  },
  admin: {
    title: 'Admin Control',
    description: 'Full system administration',
    color: 'red',
    icon: 'Crown',
    path: '/account/admin',
    features: [
      'User Management',
      'System Settings',
      'Analytics',
      'Database Access',
    ],
  },
  mentor: {
    title: 'Mentor Dashboard',
    description: 'Guide and teach members',
    color: 'green',
    icon: 'GraduationCap',
    path: '/account/mentor',
    features: [
      'Mentee Management',
      'Session Scheduling',
      'Progress Tracking',
      'Resources',
    ],
  },
  advisor: {
    title: 'Advisor Panel',
    description: 'Strategic guidance and oversight',
    color: 'teal',
    icon: 'Briefcase',
    path: '/account/advisor',
    features: [
      'Strategic Planning',
      'Policy Review',
      'Leadership Guidance',
      'Club Oversight',
    ],
  },
};

export const colorClasses = {
  blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/50',
  purple:
    'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50',
  amber:
    'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-500/50',
  red: 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-500/50',
  green:
    'from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-500/50',
  teal: 'from-teal-500/20 to-teal-600/10 border-teal-500/30 hover:border-teal-500/50',
};
