/**
 * @file Stats grid — responsive card grid showing key advisor-level
 *   metrics such as pending approvals, active members, and events.
 * @module AdvisorStatsGrid
 */

'use client';

import {
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  DollarSign,
  ClipboardCheck,
  BarChart3,
  Clock,
} from 'lucide-react';

export default function StatsGrid({ stats }) {
  const statItems = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      subtext: 'Active students',
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Events - Semester',
      value: stats.eventsSemester,
      subtext: 'This semester',
      icon: Calendar,
      color: 'green',
    },
    {
      label: 'Achievements',
      value: stats.achievementsYear,
      subtext: 'This year',
      icon: Trophy,
      color: 'amber',
    },
    {
      label: 'Growth Rate',
      value: `${stats.participationGrowth}%`,
      subtext: 'Increasing',
      icon: BarChart3,
      color: 'purple',
      trendUp: true,
    },
    {
      label: 'Budget Status',
      value: `${stats.budgetUtilization}%`,
      subtext: 'Utilized',
      icon: DollarSign,
      color: 'cyan',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      subtext: 'Action needed',
      icon: ClipboardCheck,
      color: 'orange',
      actionNeeded: true,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        const colorClasses = {
          blue: 'hover:shadow-blue-500/10',
          green: 'hover:shadow-green-500/10',
          amber: 'hover:shadow-amber-500/10',
          purple: 'hover:shadow-purple-500/10',
          cyan: 'hover:shadow-cyan-500/10',
          orange: 'hover:shadow-orange-500/10',
        };
        const textColors = {
          blue: 'text-blue-400',
          green: 'text-green-400',
          amber: 'text-amber-400',
          purple: 'text-purple-400',
          cyan: 'text-cyan-400',
          orange: 'text-orange-400',
        };

        return (
          <div
            key={idx}
            className={`group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${colorClasses[item.color]} sm:p-6`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {item.value}
                </p>
                <p
                  className={`mt-1 flex items-center text-xs ${item.trendUp ? 'text-green-400' : item.actionNeeded ? 'text-orange-400' : 'text-gray-400'}`}
                >
                  {item.trendUp && <TrendingUp className="mr-1 h-3 w-3" />}
                  {item.actionNeeded && <Clock className="mr-1 h-3 w-3" />}
                  {item.subtext}
                </p>
              </div>
              <Icon
                className={`h-8 w-8 ${textColors[item.color]} opacity-70`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
