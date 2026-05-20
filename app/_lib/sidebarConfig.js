import {
  Calendar,
  Trophy,
  Bell,
  User,
  Home,
  Settings,
  Award,
  Users,
  Shield,
  FileText,
  BookOpen,
  Target,
  BarChart,
  Briefcase,
  MessageSquare,
  Image,
  Layout,
  CheckSquare,
  TrendingUp,
  DollarSign,
  ClipboardCheck,
  Database,
  Lock,
  Download,
  FolderOpen,
  Code,
  MapPin,
  Mail,
  PenTool,
  BarChart3,
  GraduationCap,
  Video,
} from 'lucide-react';

export function getSidebarNavigation(activeRole, stats, session) {
  const baseRole = activeRole || null;

  const configs = {
    // ─── Guest ────────────────────────────────────────────────────────────
    guest: [
      {
        key: 'overview',
        label: '',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            href: '/account/guest',
          },
          {
            id: 'notifications',
            label: 'Inbox',
            icon: Bell,
            href: '/account/guest/notifications',
            badge: stats.notifications,
            badgeType: 'alert',
          },
        ],
      },
      {
        key: 'activity',
        label: 'Activity',
        items: [
          {
            id: 'participation',
            label: 'My Participation',
            icon: Trophy,
            href: '/account/guest/participation',
            badge: stats.participationCount,
            condition: ({ stats }) => stats.participationCount > 0,
          },
        ],
      },
      {
        key: 'discover',
        label: 'Discover',
        items: [
          {
            id: 'events',
            label: 'Events',
            icon: Calendar,
            href: '/account/guest/events',
            badge: stats.upcomingEvents,
            condition: ({ stats }) => stats.upcomingEvents > 0,
          },
          {
            id: 'resources',
            label: 'Resources',
            icon: BookOpen,
            href: '/account/guest/resources',
          },
        ],
      },
      {
        key: 'account',
        label: 'Account',
        items: [
          {
            id: 'profile',
            label: 'Profile',
            icon: User,
            href: '/account/guest/profile',
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            href: '/account/guest/settings',
          },
        ],
      },
    ],

    // ─── Member ───────────────────────────────────────────────────────────
    member: [
      {
        key: 'overview',
        label: '',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            href: '/account/member',
          },
          {
            id: 'notifications',
            label: 'Inbox',
            icon: Bell,
            href: '/account/member/notifications',
            badge: stats.notifications,
            badgeType: 'alert',
          },
          {
            id: 'discussions',
            label: 'Help Desk',
            icon: MessageSquare,
            href: '/account/member/discussions',
          },
        ],
      },
      {
        key: 'activities',
        label: 'Activities',
        items: [
          {
            id: 'daily-activity',
            label: 'Daily Activity',
            icon: CheckSquare,
            href: '/account/member/daily-activity',
          },
          {
            id: 'events',
            label: 'Events',
            icon: Calendar,
            href: '/account/member/events',
            badge: stats.upcomingEvents,
            condition: ({ stats }) => stats.upcomingEvents > 0,
          },
          {
            id: 'problem-solving',
            label: 'Problem Solving',
            icon: Code,
            href: '/account/member/problem-solving',
          },
        ],
      },
      {
        key: 'resources',
        label: 'Learning',
        items: [
          {
            id: 'bootcamps',
            label: 'Bootcamps',
            icon: GraduationCap,
            href: '/account/member/bootcamps',
          },
          {
            id: 'resources',
            label: 'Resources',
            icon: FolderOpen,
            href: '/account/member/resources',
          },
          {
            id: 'participation',
            label: 'History',
            icon: CheckSquare,
            href: '/account/member/participation',
          },
        ],
      },
      {
        key: 'account',
        label: 'Account',
        items: [
          {
            id: 'profile',
            label: 'Profile',
            icon: User,
            href: '/account/member/profile',
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            href: '/account/member/settings',
          },
        ],
      },
    ],

    // ─── Executive ────────────────────────────────────────────────────────
    executive: [
      {
        key: 'overview',
        label: 'Overview',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            href: '/account/executive',
          },
          {
            id: 'notices',
            label: 'Inbox',
            icon: Bell,
            href: '/account/executive/notices/create',
          },
          {
            id: 'discussions',
            label: 'Help Desk',
            icon: MessageSquare,
            href: '/account/executive/discussions',
          },
        ],
      },
      {
        key: 'management',
        label: 'Management',
        items: [
          {
            id: 'events',
            label: 'Events',
            icon: Calendar,
            href: '/account/executive/events',
          },
          {
            id: 'contests',
            label: 'Contests',
            icon: Trophy,
            href: '/account/executive/contests/manage',
          },
          {
            id: 'members',
            label: 'Member Approvals',
            icon: Users,
            href: '/account/executive/members',
            badge: stats.pendingMembers,
            badgeType: 'alert',
            condition: ({ stats }) => stats.pendingMembers > 0,
          },
        ],
      },
      {
        key: 'content',
        label: 'Content',
        items: [
          {
            id: 'blogs',
            label: 'Blogs',
            icon: PenTool,
            href: '/account/executive/blogs/manage',
          },
          {
            id: 'gallery',
            label: 'Gallery',
            icon: Image,
            href: '/account/executive/gallery/manage',
          },
          {
            id: 'certificates',
            label: 'Certificates',
            icon: Award,
            href: '/account/executive/certificates/generate',
          },
        ],
      },
      {
        key: 'insights',
        label: 'Insights',
        items: [
          {
            id: 'reports',
            label: 'Reports',
            icon: BarChart,
            href: '/account/executive/reports',
          },
        ],
      },
      {
        key: 'account',
        label: 'Account',
        items: [
          {
            id: 'profile',
            label: 'Profile',
            icon: User,
            href: '/account/executive/profile',
          },
        ],
      },
    ],

    // ─── Admin ────────────────────────────────────────────────────────────
    admin: [
      {
        key: 'overview',
        label: 'Overview',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            href: '/account/admin',
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart3,
            href: '/account/admin/analytics',
          },
          {
            id: 'notices',
            label: 'Inbox',
            icon: Bell,
            href: '/account/admin/notices',
          },
          {
            id: 'discussions',
            label: 'Help Desk',
            icon: MessageSquare,
            href: '/account/admin/discussions',
          },
        ],
      },
      {
        key: 'people',
        label: 'People',
        items: [
          {
            id: 'users',
            label: 'Users',
            icon: Users,
            href: '/account/admin/users',
            badge: stats.totalUsers,
          },
          {
            id: 'roles',
            label: 'Roles',
            icon: Shield,
            href: '/account/admin/roles',
            condition: ({ activeRole }) => activeRole === 'admin',
          },
          {
            id: 'committee',
            label: 'Committee',
            icon: Briefcase,
            href: '/account/admin/committee',
          },
          {
            id: 'applications',
            label: 'Applications',
            icon: FileText,
            href: '/account/admin/applications',
          },
        ],
      },
      {
        key: 'content',
        label: 'Content',
        items: [
          {
            id: 'events',
            label: 'Events',
            icon: Calendar,
            href: '/account/admin/events',
          },
          {
            id: 'blogs',
            label: 'Blogs',
            icon: PenTool,
            href: '/account/admin/blogs',
          },
          {
            id: 'roadmaps',
            label: 'Roadmaps',
            icon: MapPin,
            href: '/account/admin/roadmaps',
          },
          {
            id: 'bootcamps',
            label: 'Bootcamps',
            icon: GraduationCap,
            href: '/account/admin/bootcamps',
          },
          {
            id: 'resources',
            label: 'Resources',
            icon: FolderOpen,
            href: '/account/admin/resources',
          },
          {
            id: 'gallery',
            label: 'Gallery',
            icon: Image,
            href: '/account/admin/gallery',
          },
          {
            id: 'achievements',
            label: 'Achievements',
            icon: Award,
            href: '/account/admin/achievements',
          },
        ],
      },
      {
        key: 'system',
        label: 'System',
        items: [
          {
            id: 'contact',
            label: 'Contact',
            icon: Mail,
            href: '/account/admin/contact-submissions',
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            href: '/account/admin/settings',
          },
          {
            id: 'security',
            label: 'Security',
            icon: Lock,
            href: '/account/admin/security',
            condition: ({ activeRole }) => activeRole === 'admin',
          },
          {
            id: 'system-logs',
            label: 'System Logs',
            icon: Database,
            href: '/account/admin/system-logs',
            condition: ({ activeRole }) => activeRole === 'admin',
          },
          {
            id: 'export',
            label: 'Export',
            icon: Download,
            href: '/account/admin/export',
          },
        ],
      },
    ],

    // ─── Mentor ───────────────────────────────────────────────────────────
    mentor: [
      {
        key: 'overview',
        label: 'Overview',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            href: '/account/mentor',
          },
          {
            id: 'notices',
            label: 'Inbox',
            icon: Bell,
            href: '/account/mentor/notices',
          },
          {
            id: 'discussions',
            label: 'Help Desk',
            icon: MessageSquare,
            href: '/account/mentor/discussions',
          },
        ],
      },
      {
        key: 'bootcamps',
        label: 'Bootcamps',
        items: [
          {
            id: 'bootcamps',
            label: 'My Bootcamps',
            icon: GraduationCap,
            href: '/account/mentor/bootcamps',
          },
        ],
      },
      {
        key: 'mentorship',
        label: 'Mentorship',
        items: [
          {
            id: 'assigned-members',
            label: 'Assigned Members',
            icon: Users,
            href: '/account/mentor/assigned-members',
            badge: stats.mentees,
            condition: ({ stats }) => stats.mentees > 0,
          },
          {
            id: 'tasks',
            label: 'Tasks',
            icon: CheckSquare,
            href: '/account/mentor/tasks',
          },
          {
            id: 'sessions',
            label: 'Sessions',
            icon: Video,
            href: '/account/mentor/sessions',
          },
          {
            id: 'recommendations',
            label: 'Recommendations',
            icon: Target,
            href: '/account/mentor/recommendations',
          },
        ],
      },
      {
        key: 'resources',
        label: 'Resources',
        items: [
          {
            id: 'resources',
            label: 'Resources',
            icon: BookOpen,
            href: '/account/mentor/resources',
          },
          {
            id: 'events',
            label: 'Events',
            icon: Calendar,
            href: '/account/mentor/events',
          },
        ],
      },
      {
        key: 'account',
        label: 'Account',
        items: [
          {
            id: 'profile',
            label: 'Profile',
            icon: User,
            href: '/account/mentor/profile',
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            href: '/account/mentor/settings',
          },
        ],
      },
    ],

    // ─── Advisor ──────────────────────────────────────────────────────────
    advisor: [
      {
        key: 'overview',
        label: 'Overview',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            href: '/account/advisor',
          },
          {
            id: 'club-overview',
            label: 'Club Overview',
            icon: Layout,
            href: '/account/advisor/club-overview',
          },
          {
            id: 'notices',
            label: 'Inbox',
            icon: Bell,
            href: '/account/advisor/notices',
          },
          {
            id: 'discussions',
            label: 'Help Desk',
            icon: MessageSquare,
            href: '/account/advisor/discussions',
          },
        ],
      },
      {
        key: 'governance',
        label: 'Governance',
        items: [
          {
            id: 'committee',
            label: 'Committee',
            icon: Users,
            href: '/account/advisor/committee',
          },
          {
            id: 'events',
            label: 'Events',
            icon: Calendar,
            href: '/account/advisor/events',
          },
          {
            id: 'approvals',
            label: 'Approvals',
            icon: ClipboardCheck,
            href: '/account/advisor/approvals',
            badge: stats.pendingReviews,
            badgeType: 'alert',
            condition: ({ stats }) => stats.pendingReviews > 0,
          },
          {
            id: 'budget',
            label: 'Budget',
            icon: DollarSign,
            href: '/account/advisor/budget',
          },
        ],
      },
      {
        key: 'insights',
        label: 'Insights',
        items: [
          {
            id: 'analytics',
            label: 'Analytics',
            icon: TrendingUp,
            href: '/account/advisor/analytics',
          },
          {
            id: 'achievements',
            label: 'Achievements',
            icon: Award,
            href: '/account/advisor/achievements',
          },
          {
            id: 'reports',
            label: 'Reports',
            icon: BarChart,
            href: '/account/advisor/reports',
          },
        ],
      },
      {
        key: 'account',
        label: 'Account',
        items: [
          {
            id: 'profile',
            label: 'Profile',
            icon: User,
            href: '/account/advisor/profile',
          },
        ],
      },
    ],
  };

  const groups = configs[baseRole] || configs.guest;

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.condition) {
          return item.condition({ session, stats, activeRole });
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}
