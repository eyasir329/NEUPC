'use client';

import { Users, Calendar, CheckCircle, Star, TrendingUp, MessageSquare } from 'lucide-react';
import { StatCard } from './_ui';

export default function MentorStatsGrid({ stats }) {
  const cards = [
    {
      icon: Users,
      label: 'Active Mentees',
      value: stats.activeMentees,
      accent: 'blue',
      href: '/account/mentor/assigned-members',
      sublabel: 'assigned to you',
    },
    {
      icon: Calendar,
      label: 'Upcoming Sessions',
      value: stats.upcomingSessions,
      accent: 'emerald',
      sublabel: 'scheduled',
    },
    {
      icon: CheckCircle,
      label: 'Sessions Done',
      value: stats.completedSessions,
      accent: 'violet',
      sublabel: 'total completed',
    },
    {
      icon: Star,
      label: 'Avg. Rating',
      value: stats.averageRating,
      accent: 'amber',
      sublabel: 'out of 5.0',
    },
    {
      icon: TrendingUp,
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      accent: 'cyan',
      sublabel: 'mentee progress',
    },
    {
      icon: MessageSquare,
      label: 'Unread Messages',
      value: stats.unreadMessages,
      accent: 'pink',
      sublabel: 'need reply',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c, i) => (
        <StatCard key={c.label} delay={i * 0.06} {...c} />
      ))}
    </div>
  );
}
