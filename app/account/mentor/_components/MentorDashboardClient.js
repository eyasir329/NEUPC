'use client';

import RoleSync from '../../_components/RoleSync';
import MentorHeader from './MentorHeader';
import MentorStatsGrid from './MentorStatsGrid';
import TodaysSchedule from './TodaysSchedule';
import MentorRecentActivity from './MentorRecentActivity';
import MenteeProgressOverview from './MenteeProgressOverview';
import QuickAccessGrid from './QuickAccessGrid';

export default function MentorDashboardClient({ session }) {
  const mentorName = session.user.name?.split(' ')[0] || 'Mentor';

  // Mock stats - replace with real data
  const stats = {
    activeMentees: 18,
    upcomingSessions: 3,
    completedSessions: 47,
    averageRating: 4.8,
    completionRate: 92,
    unreadMessages: 5,
  };

  // Mock upcoming sessions
  const todaySessions = [
    {
      id: 1,
      title: 'React Fundamentals',
      mentee: 'Aisha Rahman',
      time: '4:00 PM',
      type: '1:1',
      platform: 'Google Meet',
      status: 'upcoming',
    },
    {
      id: 2,
      title: 'Backend Debugging Session',
      mentee: 'Rahul Sharma',
      time: '6:30 PM',
      type: 'Group',
      platform: 'Zoom',
      status: 'upcoming',
    },
    {
      id: 3,
      title: 'Career Guidance',
      mentee: 'Sara Ahmed',
      time: '8:00 PM',
      type: '1:1',
      platform: 'Google Meet',
      status: 'upcoming',
    },
  ];

  // Mock mentee progress
  const menteeProgress = [
    {
      id: 1,
      name: 'Aisha Rahman',
      roadmap: 'Frontend Development',
      progress: 70,
      status: 'On Track',
      lastSession: '2 days ago',
      statusColor: 'green',
    },
    {
      id: 2,
      name: 'Rahul Sharma',
      roadmap: 'Backend Development',
      progress: 45,
      status: 'Needs Attention',
      lastSession: '5 days ago',
      statusColor: 'amber',
    },
    {
      id: 3,
      name: 'Sara Ahmed',
      roadmap: 'DSA Track',
      progress: 85,
      status: 'Excellent',
      lastSession: 'Yesterday',
      statusColor: 'emerald',
    },
    {
      id: 4,
      name: 'John Doe',
      roadmap: 'Full Stack',
      progress: 60,
      status: 'On Track',
      lastSession: '3 days ago',
      statusColor: 'green',
    },
  ];

  // Mock recent activities
  const recentActivities = [
    {
      action: 'Completed session with Aisha on React Hooks',
      time: '1 hour ago',
      icon: 'CheckCircle',
      color: 'green',
    },
    {
      action: 'New mentee request from David Lee',
      time: '3 hours ago',
      icon: 'UserPlus',
      color: 'blue',
    },
    {
      action: 'Uploaded new Backend resources',
      time: '1 day ago',
      icon: 'BookOpen',
      color: 'purple',
    },
    {
      action: 'Received 5-star rating from Sara',
      time: '2 days ago',
      icon: 'Star',
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="mentor" />

      <MentorHeader mentorName={mentorName} stats={stats} />
      <MentorStatsGrid stats={stats} />

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <TodaysSchedule todaySessions={todaySessions} />
        <MentorRecentActivity recentActivities={recentActivities} />
      </div>

      {/* Mentee Progress Overview */}
      <MenteeProgressOverview menteeProgress={menteeProgress} />

      {/* Quick Access Grid */}
      <QuickAccessGrid />
    </div>
  );
}
