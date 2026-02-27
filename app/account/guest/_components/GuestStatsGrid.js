'use client';

import { Calendar, TrendingUp, Trophy, Bell } from 'lucide-react';

const statIcons = {
  calendar: Calendar,
  trendingUp: TrendingUp,
  trophy: Trophy,
  bell: Bell,
};

export default function GuestStatsGrid({ stats }) {
  const statsConfig = [
    {
      label: 'Registered',
      value: stats.registeredEvents,
      detail: 'Active events',
      icon: 'calendar',
      color: 'blue',
      shadowColor: 'blue-500/20',
    },
    {
      label: 'Upcoming',
      value: stats.upcomingEvents,
      detail: 'Available',
      icon: 'trendingUp',
      color: 'amber',
      shadowColor: 'amber-500/20',
    },
    {
      label: 'Attended',
      value: stats.participationCount,
      detail: 'Events',
      icon: 'trophy',
      color: 'green',
      shadowColor: 'green-500/20',
    },
    {
      label: 'Alerts',
      value: stats.notifications,
      detail: 'Unread',
      icon: 'bell',
      color: 'purple',
      shadowColor: 'purple-500/20',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {statsConfig.map((stat, idx) => {
        const Icon = statIcons[stat.icon];
        return (
          <div
            key={idx}
            className={`group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${stat.color}-500/20 sm:p-6`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stat.value}
                </p>
                <p className={`mt-1 text-xs text-${stat.color}-400`}>
                  {stat.detail}
                </p>
              </div>
              <Icon
                className={`h-8 w-8 text-${stat.color}-400 opacity-70 transition-transform duration-300 group-hover:scale-110`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
