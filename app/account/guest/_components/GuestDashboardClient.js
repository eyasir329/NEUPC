/**
 * @file Guest dashboard client — composes welcome header, stats grid,
 *   quick actions, upcoming events, and membership benefits banner into
 *   a unified guest landing experience.
 * @module GuestDashboardClient
 */

'use client';

import GuestWelcomeHeader from './GuestWelcomeHeader';
import GuestStatsGrid from './GuestStatsGrid';
import UpcomingEventsSection from './UpcomingEventsSection';
import NotificationsWidget from './NotificationsWidget';
import RecentParticipationSection from './RecentParticipationSection';
import PublicFeaturesExplore from './PublicFeaturesExplore';
import MembershipBenefitsBanner from './MembershipBenefitsBanner';
import QuickActionsGrid from './QuickActionsGrid';

export default function GuestDashboardClient({ session }) {
  // Mock data - replace with actual API calls later
  const stats = {
    registeredEvents: 3,
    upcomingEvents: 5,
    participationCount: 7,
    notifications: 2,
  };

  const notifications = [
    {
      id: 1,
      title: 'Event Registration Confirmed',
      message: 'You are registered for Web Development Workshop',
      time: '2 hours ago',
      type: 'success',
      unread: true,
    },
    {
      id: 2,
      title: 'New Event Available',
      message: 'CP Contest #12 is now open for registration',
      time: '5 hours ago',
      type: 'info',
      unread: true,
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Web Development Workshop',
      date: 'Feb 20, 2026',
      time: '2:00 PM',
      status: 'registered',
      isPublic: true,
    },
    {
      id: 2,
      title: 'CP Contest #12',
      date: 'Feb 22, 2026',
      time: '4:00 PM',
      status: 'available',
      isPublic: true,
    },
    {
      id: 3,
      title: 'Advanced Algorithms',
      date: 'Feb 25, 2026',
      time: '3:00 PM',
      status: 'members-only',
      isPublic: false,
    },
  ];

  const recentParticipation = [
    {
      id: 1,
      event: 'JavaScript Fundamentals',
      date: 'Feb 10, 2026',
      status: 'attended',
      certificate: true,
    },
    {
      id: 2,
      event: 'Git & GitHub Workshop',
      date: 'Feb 5, 2026',
      status: 'attended',
      certificate: true,
    },
  ];

  // Member benefits with icon key mapping (strings instead of components)
  const memberBenefits = [
    { iconKey: 'trophy', text: 'Access to exclusive contests', color: 'amber' },
    { iconKey: 'bookOpen', text: 'Premium learning resources', color: 'blue' },
    { iconKey: 'users', text: 'Mentorship opportunities', color: 'purple' },
    { iconKey: 'award', text: 'Certificates & badges', color: 'green' },
    { iconKey: 'target', text: 'Personalized roadmaps', color: 'pink' },
    { iconKey: 'rocket', text: 'Networking events', color: 'cyan' },
  ];

  // Available public features
  const publicFeatures = [
    {
      id: 1,
      title: 'Public Events',
      description: 'Attend free workshops and seminars',
      iconKey: 'calendar',
      color: 'blue',
      link: '/events',
    },
    {
      id: 2,
      title: 'Blog Posts',
      description: 'Read tech articles and tutorials',
      iconKey: 'bookOpen',
      color: 'purple',
      link: '/blogs',
    },
    {
      id: 3,
      title: 'Roadmaps',
      description: 'Preview learning paths',
      iconKey: 'target',
      color: 'green',
      link: '/roadmaps',
    },
  ];

  // Quick actions
  const quickActions = [
    {
      id: 1,
      label: 'Profile Settings',
      iconKey: 'user',
      color: 'blue',
      link: '/account/settings',
    },
    {
      id: 2,
      label: 'My Certificates',
      iconKey: 'award',
      color: 'green',
      link: '/account/guest/certificates',
    },
    {
      id: 3,
      label: 'Browse Events',
      iconKey: 'calendar',
      color: 'purple',
      link: '/events',
    },
  ];

  const userName = session.user.name?.split(' ')[0] || 'Guest';

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      {/* Welcome Header */}
      <GuestWelcomeHeader userName={userName} />

      {/* Stats Grid */}
      <GuestStatsGrid stats={stats} />

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Upcoming Events - Takes 2 columns */}
        <UpcomingEventsSection events={upcomingEvents} />

        {/* Sidebar - Notifications */}
        <NotificationsWidget
          notifications={notifications}
          unreadCount={stats.notifications}
        />
      </div>

      {/* Recent Participation & Public Features */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Participation */}
        <RecentParticipationSection participation={recentParticipation} />

        {/* Available Public Features */}
        <PublicFeaturesExplore features={publicFeatures} />
      </div>

      {/* Membership Benefits Banner */}
      <MembershipBenefitsBanner benefits={memberBenefits} />

      {/* Quick Actions */}
      <QuickActionsGrid actions={quickActions} />
    </div>
  );
}
