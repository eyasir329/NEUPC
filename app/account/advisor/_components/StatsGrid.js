/**
 * @file Advisor stats grid — six hero metrics using the shared StatCard
 *   primitive. Pending Approvals leads (advisor's primary job).
 *
 * @module AdvisorStatsGrid
 */

'use client';

import {
  ClipboardCheck,
  Users,
  Calendar,
  Trophy,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/app/account/_components/ui';

export default function StatsGrid({ stats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        icon={ClipboardCheck}
        label="Pending Approvals"
        value={stats.pendingApprovals}
        sublabel="Awaiting your review"
        accent="amber"
        href="/account/advisor/approvals"
        delay={0}
      />
      <StatCard
        icon={Users}
        label="Total Members"
        value={stats.totalMembers}
        sublabel="Active students"
        accent="blue"
        href="/account/advisor/club-overview"
        delay={0.04}
      />
      <StatCard
        icon={Calendar}
        label="Events · Semester"
        value={stats.eventsSemester}
        sublabel="This term"
        accent="violet"
        href="/account/advisor/events"
        delay={0.08}
      />
      <StatCard
        icon={Trophy}
        label="Achievements"
        value={stats.achievementsYear}
        sublabel="This year"
        accent="emerald"
        href="/account/advisor/achievements"
        delay={0.12}
      />
      <StatCard
        icon={BarChart3}
        label="Growth Rate"
        value={`${stats.participationGrowth}%`}
        sublabel="Participation YoY"
        accent="cyan"
        href="/account/advisor/analytics"
        trend={{ dir: 'up', value: `${stats.participationGrowth}%` }}
        delay={0.16}
      />
      <StatCard
        icon={Wallet}
        label="Budget Used"
        value={`${stats.budgetUtilization}%`}
        sublabel="of allocated"
        accent="rose"
        href="/account/advisor/budget"
        delay={0.2}
      />
    </div>
  );
}
