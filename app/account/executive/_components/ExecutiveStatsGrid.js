'use client';

import {
  Calendar,
  Users,
  AlertCircle,
  TrendingUp,
  Megaphone,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

const iconMap = {
  Calendar: Calendar,
  Users: Users,
  AlertCircle: AlertCircle,
  TrendingUp: TrendingUp,
  Megaphone: Megaphone,
  BarChart3: BarChart3,
};

export default function ExecutiveStatsGrid({ stats }) {
  const statConfigs = [
    {
      label: 'Total Events',
      value: stats.totalEvents,
      trend: '+12%',
      color: 'blue',
      icon: 'Calendar',
      shadowColor: 'blue',
    },
    {
      label: 'Active Members',
      value: stats.activeMembers,
      trend: '+8%',
      color: 'green',
      icon: 'Users',
      shadowColor: 'green',
    },
    {
      label: 'Pending Registrations',
      value: stats.pendingRegistrations,
      trend: 'Needs Review',
      color: 'amber',
      icon: 'AlertCircle',
      shadowColor: 'amber',
      isTrendAlert: true,
    },
    {
      label: 'Total Participation',
      value: stats.totalParticipation,
      trend: '+15%',
      color: 'purple',
      icon: 'TrendingUp',
      shadowColor: 'purple',
    },
    {
      label: 'Active Notices',
      value: stats.activeNotices,
      trend: 'Live',
      color: 'pink',
      icon: 'Megaphone',
      shadowColor: 'pink',
    },
    {
      label: 'Engagement Rate',
      value: `${stats.engagementRate}%`,
      trend: '+5%',
      color: 'cyan',
      icon: 'BarChart3',
      shadowColor: 'cyan',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {statConfigs.map((config, idx) => {
        const Icon = iconMap[config.icon];
        return (
          <div
            key={idx}
            className={`group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-${config.shadowColor}-500/20 sm:p-6`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  {config.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {config.value}
                </p>
                <p
                  className={`mt-1 flex items-center text-xs ${
                    config.isTrendAlert ? 'text-amber-400' : 'text-green-400'
                  }`}
                >
                  {!config.isTrendAlert && (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  )}
                  {config.trend}
                </p>
              </div>
              <Icon
                className={`h-9 w-9 text-${config.color}-400 opacity-80 transition-transform duration-300 group-hover:scale-110`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
