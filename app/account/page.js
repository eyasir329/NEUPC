import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getUserRoles } from '../_lib/data-service';
import RoleCard from './_components/RoleCard';
import AccountPageClient from './_components/AccountPageClient';

async function page() {
  const session = await auth();
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  const userRoles = await getUserRoles(session.user.email);
  // Get all user roles (default to guest if no roles)
  const userRole = session.user.role;

  // Role-based dashboard configuration (using icon names instead of components)
  const roleDashboards = {
    guest: {
      title: 'Public Account',
      description: 'Limited access to public features',
      color: 'blue',
      icon: 'User',
      path: '/account/guest',
      features: ['Browse Events', 'Register for Events', 'View Achievements'],
      ctaText: 'Apply for Membership',
      ctaPath: '/join',
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

  // Get available dashboards for user's roles
  const availableRoles = userRoles
    .map((role) => ({ role, config: roleDashboards[role] }))
    .filter(({ config }) => config); // Filter out any invalid roles
  const colorClasses = {
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

  return (
    <AccountPageClient>
      <main className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-extrabold text-white sm:text-5xl">
              Welcome Back! 👋
            </h1>
            <p className="text-lg text-gray-300">{session.user.name}</p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>

          {/* User Avatar */}
          <div className="mb-8 flex justify-center">
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name}
                className="h-24 w-24 rounded-full border-4 border-white/20 shadow-xl sm:h-32 sm:w-32"
              />
            )}
          </div>

          {/* Available Roles Section */}
          <div className="mb-8">
            <h2 className="mb-6 text-center text-2xl font-bold text-white">
              Your Available Dashboards
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableRoles.map(({ role, config }) => (
                <RoleCard
                  key={role}
                  role={role}
                  config={config}
                  colorClass={colorClasses[config.color]}
                />
              ))}
            </div>
          </div>

          {/* Upgrade Banner - Only for Guests */}
          {userRoles.includes('guest') &&
            !userRoles.some((role) => role !== 'guest') && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-purple-500/30 bg-linear-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 p-1">
                <div className="rounded-xl bg-gray-900/80 p-6 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                      <Sparkles className="h-8 w-8 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-xl font-bold text-white">
                        Unlock Full Access
                      </h3>
                      <p className="text-sm text-gray-300">
                        Apply for membership to access exclusive features,
                        contests, and mentorship programs.
                      </p>
                    </div>
                    <Link
                      href="/join"
                      className="shrink-0 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>
    </AccountPageClient>
  );
}

export default page;
