/**
 * @file Mentor recent activity component — real events (sessions,
 *   tasks, resources, submissions) with relative timestamps.
 * @module MentorRecentActivity
 */

'use client';

import {
  CheckCircle,
  UserPlus,
  BookOpen,
  FileText,
  Star,
  Zap,
} from 'lucide-react';
import { formatRelativeTime } from '@/app/_lib/utils/utils';
import {
  GlassCard,
  SectionHeader,
  StaggerList,
  EmptyState,
} from '@/app/account/_components/ui';

const iconMap = { CheckCircle, UserPlus, BookOpen, FileText, Star };

const TONE_CHIP = {
  green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  purple: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
};

export default function MentorRecentActivity({ recentActivities = [] }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Zap}
        title="Recent Activity"
        subtitle="Latest updates"
        accent="amber"
      />

      {recentActivities.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No activity yet"
          description="Your sessions, tasks and resources will show up here."
          accent="amber"
        />
      ) : (
        <StaggerList>
          {recentActivities.map((activity, idx) => {
            const Icon = iconMap[activity.icon] ?? CheckCircle;
            const chip = TONE_CHIP[activity.color] ?? TONE_CHIP.blue;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/10 hover:bg-white/4"
              >
                <div
                  className={`inline-flex shrink-0 rounded-lg border p-1.5 ${chip}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-white">
                    {activity.action}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatRelativeTime(activity.at)}
                  </p>
                </div>
              </div>
            );
          })}
        </StaggerList>
      )}
    </GlassCard>
  );
}
