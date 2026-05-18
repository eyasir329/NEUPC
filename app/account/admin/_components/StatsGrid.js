/**
 * @file Stats grid — hero metrics for the admin dashboard. Uses the
 *   same dark-glass StatCard pattern as the member panel so the visual
 *   language stays consistent across roles.
 * @module StatsGrid
 */

'use client';

import Link from 'next/link';
import {
  Users,
  UserCheck,
  Award,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

const statsConfig = [
  {
    label: 'Total Users',
    icon: Users,
    iconClass: 'text-blue-400',
    key: 'totalUsers',
    href: '/account/admin/users',
    subtitle: 'Across all roles',
  },
  {
    label: 'Active Members',
    icon: UserCheck,
    iconClass: 'text-emerald-400',
    key: 'activeMembers',
    href: '/account/admin/users',
    subtitle: 'Engaged this month',
  },
  {
    label: 'Mentors',
    icon: Award,
    iconClass: 'text-violet-400',
    key: 'mentors',
    href: '/account/admin/users',
    subtitle: 'Active reviewers',
  },
  {
    label: 'Upcoming Events',
    icon: Calendar,
    iconClass: 'text-indigo-400',
    key: 'upcomingEvents',
    href: '/account/admin/events',
    subtitle: 'Scheduled & published',
  },
  {
    label: 'Pending Approvals',
    icon: AlertCircle,
    iconClass: 'text-amber-400',
    key: 'pendingApprovals',
    href: '/account/admin/applications',
    subtitle: 'Awaiting review',
    accent: 'amber',
  },
  {
    label: 'System Health',
    icon: TrendingUp,
    iconClass: 'text-cyan-400',
    key: 'systemHealth',
    href: '/account/admin/system-logs',
    subtitle: 'Last 24 hours',
    formatPct: true,
    accent: 'success',
  },
];

export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 xl:gap-8">
      {statsConfig.map((stat) => {
        const Icon = stat.icon;
        const raw = stats?.[stat.key];
        const value = stat.formatPct ? `${raw}%` : raw;

        return (
          <Link
            key={stat.key}
            href={stat.href}
            className="block h-full"
          >
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 hover:shadow-lg hover:shadow-black/40 transition-all group h-full cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    {stat.label}
                  </p>
                  <h3 className="text-3xl font-light text-zinc-100 truncate">
                    {value}
                  </h3>
                </div>
                <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-2xl group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <Icon className={`w-5 h-5 ${stat.iconClass}`} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs gap-2">
                <p className="text-zinc-500 font-medium truncate">
                  {stat.subtitle}
                </p>
                {stat.accent === 'success' && (
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-2xl bg-emerald-500/10 text-emerald-300 shrink-0">
                    <ArrowUpRight className="w-3 h-3" />
                    Live
                  </div>
                )}
                {stat.accent === 'amber' && raw > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-2xl bg-amber-500/10 text-amber-300 shrink-0">
                    Action
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
