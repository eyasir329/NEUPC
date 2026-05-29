/**
 * @file Mentee progress overview component
 * @module MenteeProgressOverview
 */

'use client';

import { CheckCircle, Target, AlertCircle, Users } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  GradientBar,
  Pill,
  ActionButton,
  Avatar,
  EmptyState,
} from '@/app/account/_components/ui';

const STATUS_CONFIG = {
  Excellent: { tone: 'emerald', icon: CheckCircle },
  'On Track': { tone: 'blue', icon: Target },
  'Needs Attention': { tone: 'amber', icon: AlertCircle },
};

const PROGRESS_TONE = {
  emerald: 'emerald',
  green: 'emerald',
  amber: 'amber',
  red: 'rose',
};

export default function MenteeProgressOverview({ menteeProgress }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Users}
        title="Mentee Progress"
        subtitle="Track your mentees' learning journey"
        accent="blue"
        action={
          <ActionButton href="/account/mentor/assigned-members" tone="primary">
            View All
          </ActionButton>
        }
      />

      {menteeProgress.length === 0 ? (
        <EmptyState icon={Users} title="No mentees yet" accent="blue" />
      ) : (
        <div className="space-y-3">
          {menteeProgress.map((mentee) => {
            const cfg =
              STATUS_CONFIG[mentee.status] ?? STATUS_CONFIG['On Track'];
            const Icon = cfg.icon;
            const tone = PROGRESS_TONE[mentee.statusColor] ?? 'blue';

            return (
              <div
                key={mentee.id}
                className="grid grid-cols-1 gap-3 rounded-xl border border-white/6 bg-white/2 p-4 transition-all hover:border-white/10 hover:bg-white/4 sm:grid-cols-12 sm:items-center"
              >
                {/* Name */}
                <div className="flex items-center gap-2.5 sm:col-span-3">
                  <Avatar name={mentee.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {mentee.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {mentee.roadmap}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="sm:col-span-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <GradientBar
                        value={mentee.progress}
                        tone={tone}
                        height="h-1.5"
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-bold text-white">
                      {mentee.progress}%
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="sm:col-span-3">
                  <Pill tone={cfg.tone} icon={Icon}>
                    {mentee.status}
                  </Pill>
                </div>

                {/* Meta + action */}
                <div className="flex items-center justify-between gap-2 sm:col-span-2 sm:justify-end">
                  <span className="text-xs text-gray-500">
                    Last: {mentee.lastSession}
                  </span>
                  <ActionButton tone="primary">Message</ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
