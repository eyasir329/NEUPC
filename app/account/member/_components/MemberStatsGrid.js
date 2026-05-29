/**
 * @file Member stats grid component
 * @module MemberStatsGrid
 */

'use client';

import {
  Code2,
  TrendingUp,
  Calendar,
  Trophy,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

export default function MemberStatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Code2 className="h-5 w-5 text-emerald-600" />}
        title="Problems Solved"
        value={stats.problemsSolved}
        subtitle="Across 5 platforms"
        badge="+12 / week"
        badgeType="success"
        href="/account/member/problem-solving"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5 text-violet-400" />}
        title="Contest Rating"
        value={stats.contestRating}
        subtitle="Specialist tier"
        badge="+34"
        badgeType="success"
        href="/account/member/problem-solving"
      />
      <StatCard
        icon={<Calendar className="h-5 w-5 text-indigo-400" />}
        title="Upcoming Events"
        value={stats.upcomingEvents}
        subtitle="2 this week"
        href="/account/member/events"
      />
      <StatCard
        icon={<Trophy className="h-5 w-5 text-amber-400" />}
        title="Achievements"
        value={stats.achievements}
        subtitle="2 in progress"
        href="/account/member/achievements"
      />
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, badge, badgeType, href }) {
  const content = (
    <div className="group flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl transition-all hover:border-white/20 hover:shadow-lg hover:shadow-black/40">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            {title}
          </p>
          <h3 className="text-4xl font-light text-zinc-100">{value}</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400 transition-transform duration-300 group-hover:scale-105">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <p className="font-medium text-zinc-500">{subtitle}</p>
        {badge && (
          <div
            className={`flex items-center gap-1 rounded-2xl px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${
              badgeType === 'success'
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-white/10 text-zinc-400'
            }`}
          >
            {badgeType === 'success' && <ArrowUpRight className="h-3 w-3" />}
            {badge}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
