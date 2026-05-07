/**
 * @file Member stats grid — 4 hero metrics (problems, rating, events,
 *   achievements). Sparkline + activity moved to dedicated widgets.
 * @module MemberStatsGrid
 */

'use client';

import { Calendar, Trophy, Code2, TrendingUp } from 'lucide-react';
import { StatCard } from './_ui';

export default function MemberStatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={Code2}
        label="Problems Solved"
        value={stats.problemsSolved}
        sublabel="Across 5 platforms"
        accent="emerald"
        href="/account/member/problem-solving"
        trend={{ dir: 'up', value: '12 / week' }}
        delay={0}
      />
      <StatCard
        icon={TrendingUp}
        label="Contest Rating"
        value={stats.contestRating}
        sublabel="Specialist tier"
        accent="violet"
        href="/account/member/problem-solving"
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
    </div>
  );
}
