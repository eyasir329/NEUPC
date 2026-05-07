/**
 * @file Member stats grid — six headline metrics + 30-day sparkline,
 *   styled with the shared `_ui` design primitives.
 * @module MemberStatsGrid
 */

'use client';

import {
  Calendar,
  Trophy,
  MessageSquare,
  Target,
  Code2,
  TrendingUp,
} from 'lucide-react';
import { StatCard, GlassCard, Sparkline } from './_ui';

export default function MemberStatsGrid({ stats, activity = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      <StatCard
        icon={Code2}
        label="Problems Solved"
        value={stats.problemsSolved}
        sublabel="Across 5 platforms"
        accent="emerald"
        href="/account/member/problem-solving"
        trend={{ dir: 'up', value: '12 this week' }}
        delay={0}
      />
      <StatCard
        icon={TrendingUp}
        label="Contest Rating"
        value={stats.contestRating}
        sublabel="Specialist tier"
        accent="violet"
        trend={{ dir: 'up', value: '+34' }}
        delay={0.04}
      />
      <StatCard
        icon={Calendar}
        label="Upcoming Events"
        value={stats.upcomingEvents}
        sublabel="2 this week"
        accent="blue"
        href="/account/member/events"
        delay={0.08}
      />
      <StatCard
        icon={Trophy}
        label="Achievements"
        value={stats.achievements}
        sublabel="2 in progress"
        accent="amber"
        href="/account/member/achievements"
        delay={0.12}
      />
      <StatCard
        icon={MessageSquare}
        label="Unread"
        value={stats.unreadMessages}
        sublabel="Help Desk replies"
        accent="rose"
        href="/account/member/notifications"
        delay={0.16}
      />
      <GlassCard padding="p-4" className="hidden 2xl:block">
        <div className="flex items-start justify-between">
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
            <Target className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-400">Last 30 Days</div>
          <div className="mt-2">
            <Sparkline data={activity} tone="emerald" />
          </div>
          <div className="mt-1 text-[10px] text-gray-500">
            {activity.reduce((a, b) => a + b, 0)} solves
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
