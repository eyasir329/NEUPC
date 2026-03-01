/**
 * @file Stats grid — responsive card grid showing key platform metrics
 *   (total users, active members, mentors, upcoming events, pending
 *   approvals, system health) with configurable icons and colours.
 * @module StatsGrid
 */

'use client';

import {
  Users,
  UserCheck,
  Award,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

const statsConfig = [
  {
    label: 'Total Users',
    icon: Users,
    color: 'blue',
    key: 'totalUsers',
  },
  {
    label: 'Active Members',
    icon: UserCheck,
    color: 'green',
    key: 'activeMembers',
  },
  {
    label: 'Mentors',
    icon: Award,
    color: 'purple',
    key: 'mentors',
  },
  {
    label: 'Events',
    icon: Calendar,
    color: 'amber',
    key: 'upcomingEvents',
  },
  {
    label: 'Pending',
    icon: AlertCircle,
    color: 'red',
    key: 'pendingApprovals',
  },
  {
    label: 'Health',
    icon: TrendingUp,
    color: 'cyan',
    key: 'systemHealth',
  },
];

export default function StatsGrid({ stats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {statsConfig.map((stat) => {
        const Icon = stat.icon;
        const value = stats[stat.key];

        return (
          <div
            key={stat.key}
            className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 sm:p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stat.key === 'systemHealth' ? `${value}%` : value}
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
