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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-8">
      {statsConfig.map((stat) => {
        const Icon = stat.icon;
        const raw = stats?.[stat.key];
        const value = stat.formatPct ? `${raw}%` : raw;

        return (
          <Link key={stat.key} href={stat.href} className="block h-full">
            <div className="group flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl transition-all hover:border-white/20 hover:shadow-lg hover:shadow-black/40">
              <div className="mb-6 flex items-start justify-between">
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    {stat.label}
                  </p>
                  <h3 className="truncate text-3xl font-light text-zinc-100">
                    {value}
                  </h3>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-transform duration-300 group-hover:scale-105">
                  <Icon className={`h-5 w-5 ${stat.iconClass}`} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <p className="truncate font-medium text-zinc-500">
                  {stat.subtitle}
                </p>
                {stat.accent === 'success' && (
                  <div className="flex shrink-0 items-center gap-1 rounded-2xl bg-emerald-500/10 px-2 py-1 text-[10px] font-bold tracking-widest text-emerald-300 uppercase">
                    <ArrowUpRight className="h-3 w-3" />
                    Live
                  </div>
                )}
                {stat.accent === 'amber' && raw > 0 && (
                  <div className="flex shrink-0 items-center gap-1 rounded-2xl bg-amber-500/10 px-2 py-1 text-[10px] font-bold tracking-widest text-amber-300 uppercase">
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
