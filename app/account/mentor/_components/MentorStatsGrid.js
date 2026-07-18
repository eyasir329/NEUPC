/**
 * @file Mentor stats grid component — six live stat cards derived from
 *   the mentor's DB data.
 * @module MentorStatsGrid
 */

'use client';

import {
  Users,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { StatCard } from '@/app/account/_components/ui';

export default function MentorStatsGrid({ stats }) {
  const cards = [
    {
      icon: Users,
      label: 'Active Mentees',
      value: stats.activeMentees,
      accent: 'blue',
      href: '/account/mentor/assigned-members',
      sublabel: 'assigned to you',
    },
    {
      icon: Calendar,
      label: 'Upcoming Sessions',
      value: stats.upcomingSessions,
      accent: 'emerald',
      href: '/account/mentor/sessions',
      sublabel: 'scheduled',
    },
    {
      icon: CheckCircle,
      label: 'Sessions Done',
      value: stats.completedSessions,
      accent: 'violet',
      href: '/account/mentor/sessions',
      sublabel: 'total completed',
    },
    {
      icon: ClipboardCheck,
      label: 'Pending Reviews',
      value: stats.pendingReviews,
      accent: 'amber',
      href: '/account/mentor/tasks',
      sublabel: 'submissions waiting',
    },
    {
      icon: FileText,
      label: 'Active Tasks',
      value: stats.activeTasks,
      accent: 'cyan',
      href: '/account/mentor/tasks',
      sublabel: 'deadline ahead',
    },
    {
      icon: GraduationCap,
      label: 'My Bootcamps',
      value: stats.bootcamps,
      accent: 'pink',
      href: '/account/mentor/bootcamps',
      sublabel: 'assigned',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c, i) => (
        <StatCard key={c.label} delay={i * 0.06} {...c} />
      ))}
    </div>
  );
}
