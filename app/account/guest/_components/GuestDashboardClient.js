'use client';

import GuestWelcomeHeader from './GuestWelcomeHeader';
import GuestStatsGrid from './GuestStatsGrid';
import UpcomingEventsSection from './UpcomingEventsSection';
import NotificationsWidget from './NotificationsWidget';
import MembershipBenefitsBanner from './MembershipBenefitsBanner';
import RecentParticipationSection from './RecentParticipationSection';
import PublicFeaturesExplore from './PublicFeaturesExplore';
import QuickActionsGrid from './QuickActionsGrid';

export default function GuestDashboardClient({ session }) {
  const stats = {
    registeredEvents: 3,
    upcomingEvents: 5,
    participationCount: 7,
    notifications: 2,
  };

  const notifications = [
    {
      id: 1,
      title: 'Registration confirmed',
      message: 'Web Dev Workshop · Feb 20 at CSE Lab-B',
      time: '2h ago',
      type: 'success',
      unread: true,
    },
    {
      id: 2,
      title: 'New event: CP Contest #12',
      message: 'Registration open until Feb 21. 80 spots remaining.',
      time: '5h ago',
      type: 'event',
      unread: true,
    },
    {
      id: 3,
      title: 'Resource added: DP Cheatsheet',
      message: 'New public resource available in your library.',
      time: '1d ago',
      type: 'resource',
      unread: false,
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Web Development Workshop',
      date: 'Feb 20',
      time: '2:00 PM',
      venue: 'CSE Lab-B',
      tag: 'Workshop',
      status: 'registered',
      isPublic: true,
    },
    {
      id: 2,
      title: 'CP Contest #12',
      date: 'Feb 22',
      time: '4:00 PM',
      venue: 'Online',
      tag: 'Contest',
      status: 'open',
      isPublic: true,
    },
    {
      id: 3,
      title: 'Advanced Algorithms Bootcamp',
      date: 'Feb 25',
      time: '3:00 PM',
      venue: 'CSE Lab-A',
      tag: 'Bootcamp',
      status: 'members-only',
      isPublic: false,
    },
  ];

  const recentParticipation = [
    { id: 1, event: 'JavaScript Fundamentals', date: 'Feb 10, 2026', status: 'attended', certificate: true },
    { id: 2, event: 'Git & GitHub Workshop', date: 'Feb 5, 2026', status: 'attended', certificate: true },
    { id: 3, event: 'Intro to Competitive Programming', date: 'Jan 28, 2026', status: 'attended', certificate: false },
  ];

  const publicFeatures = [
    { id: 1, title: 'Public Events', description: 'Attend free workshops and seminars', iconKey: 'calendar', link: '/events' },
    { id: 2, title: 'Blog Posts', description: 'Read tech articles and tutorials', iconKey: 'bookOpen', link: '/blogs' },
    { id: 3, title: 'Roadmaps', description: 'Preview learning paths', iconKey: 'target', link: '/roadmaps' },
  ];

  const quickActions = [
    { id: 1, label: 'Profile Settings', iconKey: 'user', link: '/account/guest/profile' },
    { id: 2, label: 'My Certificates', iconKey: 'award', link: '/account/guest/participation' },
    { id: 3, label: 'Browse Events', iconKey: 'calendar', link: '/events' },
  ];

  const userName = session?.user?.name?.split(' ')[0] || 'Guest';

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-7 pb-20 sm:px-8 lg:px-10">
      {/* Header */}
      <GuestWelcomeHeader userName={userName} />

      {/* Stats */}
      <div className="mb-4">
        <GuestStatsGrid stats={stats} />
      </div>

      {/* Main 2-col: events (wider) + notifications */}
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <UpcomingEventsSection events={upcomingEvents} />
        <NotificationsWidget notifications={notifications} unreadCount={stats.notifications} />
      </div>

      {/* Second row: application progress + recent attendance */}
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <MembershipBenefitsBanner progress={0} />
        <RecentParticipationSection participation={recentParticipation} />
      </div>

      {/* Explore */}
      <div className="mb-4">
        <PublicFeaturesExplore features={publicFeatures} />
      </div>

      {/* Quick actions */}
      <QuickActionsGrid actions={quickActions} />
    </div>
  );
}
