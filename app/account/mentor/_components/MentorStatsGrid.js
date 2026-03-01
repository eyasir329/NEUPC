/**
 * @file Mentor stats grid — responsive card grid showing key
 *   mentoring metrics such as active mentees, sessions held,
 *   and pending tasks.
 * @module MentorStatsGrid
 */

'use client';

import Link from 'next/link';
import {
  Users,
  Calendar,
  CheckCircle,
  Star,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';

export default function MentorStatsGrid({ stats }) {
  const statConfigs = [
    {
      label: 'Active Mentees',
      value: stats.activeMentees,
      href: '/account/mentor/mentees',
      icon: Users,
      color: 'blue',
      shadowColor: 'blue',
    },
    {
      label: 'Upcoming',
      value: stats.upcomingSessions,
      href: null,
      icon: Calendar,
      color: 'green',
      shadowColor: 'green',
    },
    {
      label: 'Completed',
      value: stats.completedSessions,
      href: null,
      icon: CheckCircle,
      color: 'purple',
      shadowColor: 'purple',
    },
    {
      label: 'Avg. Rating',
      value: stats.averageRating,
      href: null,
      icon: Star,
      color: 'amber',
      shadowColor: 'amber',
      isFilled: true,
    },
    {
      label: 'Completion',
      value: `${stats.completionRate}%`,
      href: null,
      icon: TrendingUp,
      color: 'cyan',
      shadowColor: 'cyan',
    },
    {
      label: 'Messages',
      value: stats.unreadMessages,
      href: null,
      icon: MessageSquare,
      color: 'pink',
      shadowColor: 'pink',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {statConfigs.map((config, idx) => {
        const Icon = config.icon;
        const baseClasses = `group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${config.shadowColor}-500/20 sm:p-6`;

        const content = (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">
                {config.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {config.value}
              </p>
            </div>
            {config.isFilled ? (
              <Icon
                className={`h-8 w-8 fill-${config.color}-400 text-${config.color}-400 opacity-70 transition-transform duration-300 group-hover:scale-110`}
              />
            ) : (
              <Icon
                className={`h-8 w-8 text-${config.color}-400 opacity-70 transition-transform duration-300 group-hover:scale-110`}
              />
            )}
          </div>
        );

        if (config.href) {
          return (
            <Link key={idx} href={config.href} className={baseClasses}>
              {content}
            </Link>
          );
        }

        return (
          <div key={idx} className={baseClasses}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
