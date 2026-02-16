'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Trophy,
  Bell,
  User,
  Sparkles,
  ChevronRight,
  Home,
  Settings,
  Menu,
  X,
  LogOut,
  Award,
  Users,
  Shield,
  FileText,
  BookOpen,
  Target,
  BarChart,
  Briefcase,
  UserPlus,
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
  Megaphone,
  Mail,
  PenTool,
  BarChart3,
} from 'lucide-react';
import { signOutAction } from '@/app/_lib/actions';
import { useRole } from './RoleContext';

export default function AccountLayoutClient({ children, session }) {
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

  // Close sidebar when route changes on mobile
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

  // Role-based navigation configuration with conditional visibility
  const sidebarNavigation = useMemo(() => {
    const baseRole = activeRole || 'guest';

    const configs = {
      guest: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          href: '/account/guest',
        },
        {
          id: 'events',
          label: 'Browse Events',
          icon: Calendar,
          href: '/account/guest/events',
          badge: stats.upcomingEvents,
          condition: ({ stats }) => stats.upcomingEvents > 0,
        },
        {
          id: 'participation',
          label: 'My Participations',
          icon: Trophy,
          href: '/account/guest/participation',
          badge: stats.participationCount,
          condition: ({ stats }) => stats.participationCount > 0,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          href: '/account/guest/notifications',
          badge: stats.notifications,
          badgeType: 'alert',
        },
        {
          id: 'membership',
          label: 'Apply Membership',
          icon: UserPlus,
          href: '/account/guest/membership-application',
        },
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
      member: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          href: '/account/member',
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
          id: 'contests',
          label: 'Contests',
          icon: Trophy,
          href: '/account/member/contests',
        },
        {
          id: 'resources',
          label: 'Resources',
          icon: BookOpen,
          href: '/account/member/resources',
        },
        {
          id: 'problem-set',
          label: 'Problem Set',
          icon: Code,
          href: '/account/member/problem-set',
        },
        {
          id: 'roadmap',
          label: 'Roadmap',
          icon: MapPin,
          href: '/account/member/roadmap',
        },
        {
          id: 'achievements',
          label: 'Achievements',
          icon: Award,
          href: '/account/member/achievements',
        },
        {
          id: 'discussions',
          label: 'Discussions',
          icon: MessageSquare,
          href: '/account/member/discussions',
        },
        {
          id: 'gallery',
          label: 'Gallery',
          icon: Image,
          href: '/account/member/gallery',
        },
        {
          id: 'notices',
          label: 'Notices',
          icon: Megaphone,
          href: '/account/member/notices',
        },
        {
          id: 'participation',
          label: 'Participation',
          icon: CheckSquare,
          href: '/account/member/participation',
        },
        {
          id: 'certificates',
          label: 'Certificates',
          icon: Award,
          href: '/account/member/certificates',
        },
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
      executive: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          href: '/account/executive',
        },
        {
          id: 'events',
          label: 'Event Management',
          icon: Calendar,
          href: '/account/executive/events/manage',
        },
        {
          id: 'registrations',
          label: 'Registrations',
          icon: ClipboardCheck,
          href: '/account/executive/registrations',
        },
        {
          id: 'contests',
          label: 'Contest Management',
          icon: Trophy,
          href: '/account/executive/contests/manage',
        },
        {
          id: 'blogs',
          label: 'Blog Management',
          icon: PenTool,
          href: '/account/executive/blogs/manage',
        },
        {
          id: 'gallery',
          label: 'Gallery Management',
          icon: Image,
          href: '/account/executive/gallery/manage',
        },
        {
          id: 'notices',
          label: 'Notices',
          icon: Megaphone,
          href: '/account/executive/notices/create',
        },
        {
          id: 'members',
          label: 'Member Approval',
          icon: Users,
          href: '/account/executive/members',
          badge: stats.pendingMembers,
          badgeType: 'alert',
          condition: ({ stats }) => stats.pendingMembers > 0,
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart,
          href: '/account/executive/reports',
        },
        {
          id: 'certificates',
          label: 'Generate Certificates',
          icon: Award,
          href: '/account/executive/certificates/generate',
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          href: '/account/executive/profile',
        },
      ],
      admin: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          href: '/account/admin',
        },
        {
          id: 'users',
          label: 'User Management',
          icon: Users,
          href: '/account/admin/users',
          badge: stats.totalUsers,
        },
        {
          id: 'roles',
          label: 'Role Management',
          icon: Shield,
          href: '/account/admin/roles',
          condition: ({ activeRole }) => activeRole === 'admin',
        },
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
        {
          id: 'notices',
          label: 'Notices',
          icon: Megaphone,
          href: '/account/admin/notices',
        },
        {
          id: 'contact',
          label: 'Contact Submissions',
          icon: Mail,
          href: '/account/admin/contact-submissions',
        },
        {
          id: 'applications',
          label: 'Applications',
          icon: FileText,
          href: '/account/admin/applications',
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          href: '/account/admin/analytics',
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
          label: 'Export Data',
          icon: Download,
          href: '/account/admin/export',
        },
      ],
      mentor: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          href: '/account/mentor',
        },
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
          id: 'resources',
          label: 'Resources',
          icon: BookOpen,
          href: '/account/mentor/resources',
        },
        {
          id: 'sessions',
          label: 'Sessions',
          icon: Calendar,
          href: '/account/mentor/sessions',
        },
        {
          id: 'recommendations',
          label: 'Recommendations',
          icon: Target,
          href: '/account/mentor/recommendations',
        },
        {
          id: 'notices',
          label: 'Notices',
          icon: Megaphone,
          href: '/account/mentor/notices',
        },
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
      advisor: [
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
        {
          id: 'budget',
          label: 'Budget',
          icon: DollarSign,
          href: '/account/advisor/budget',
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
          id: 'profile',
          label: 'Profile',
          icon: User,
          href: '/account/advisor/profile',
        },
      ],
    };

    const navigationItems = configs[baseRole] || configs.guest;

    // Filter navigation items based on conditional visibility
    return navigationItems.filter((item) => {
      // Check if item has a condition function
      if (item.condition) {
        return item.condition({ session, stats, activeRole });
      }
      return true; // Default: show all items
    });
  }, [activeRole, stats, session]);

  return (
    <div className="relative flex min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Mobile Menu Button */}
      {!hideSidebar && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`fixed top-4 z-50 rounded-xl border border-white/20 bg-gray-900/90 p-3 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-gray-800 lg:hidden ${
            sidebarOpen ? 'left-68' : 'left-4'
          }`}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Mobile Overlay */}
      {!hideSidebar && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {!hideSidebar && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-linear-to-b from-gray-900/98 via-gray-900/95 to-gray-900/98 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* User Profile Section */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-bold text-white">
                    {session?.user?.name || 'Guest User'}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {session?.user?.email || 'guest@example.com'}
                  </p>
                </div>
              </div>
              {/* Role Badge */}
              {activeRole && (
                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300">
                    {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="scrollbar-hide flex-1 overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Main Navigation */}
              <div className="mb-8">
                <h3 className="mb-3 px-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Navigation
                </h3>
                <div className="space-y-1.5">
                  {sidebarNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`group relative flex items-center justify-between overflow-hidden rounded-xl px-4 py-3.5 transition-all duration-300 ${
                          isActive
                            ? 'bg-linear-to-r from-blue-500/20 to-blue-600/10 text-blue-400 shadow-lg shadow-blue-500/20'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-blue-400 to-blue-600" />
                        )}
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-5 w-5 transition-transform duration-300 ${
                              isActive ? 'scale-110' : 'group-hover:scale-110'
                            }`}
                          />
                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span
                              className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold shadow-lg ${
                                item.badgeType === 'alert'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-blue-500/30 text-blue-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {isActive && <ChevronRight className="h-4 w-4" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Upgrade Section - Only for guests */}
              {activeRole === 'guest' && (
                <div>
                  <h3 className="mb-3 px-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Membership
                  </h3>
                  <Link
                    href="/join"
                    className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-purple-500/30 bg-linear-to-br from-purple-500/20 via-pink-500/15 to-purple-600/20 px-4 py-4 shadow-lg shadow-purple-500/20 transition-all duration-300 hover:border-purple-500/50 hover:shadow-purple-500/30"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-purple-600/0 via-pink-600/10 to-purple-600/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      <span className="text-sm font-bold text-purple-300">
                        Upgrade Account
                      </span>
                    </div>
                    <ChevronRight className="relative h-4 w-4 text-purple-400 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              )}
            </nav>

            {/* Sidebar Footer */}
            <div className="space-y-3 border-t border-white/10 p-4">
              {/* Switch Role Button */}
              <Link
                href="/account"
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 shadow-lg transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/20 hover:shadow-blue-500/20"
              >
                <User className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                <span>Switch Role</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Logout Button */}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 shadow-lg transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/20 hover:shadow-red-500/20"
                >
                  <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
