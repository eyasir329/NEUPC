/**
 * @file Achievements preview — dashboard tile listing recent club
 *   accomplishments using shared primitives.
 *
 * @module AdvisorAchievementsPreview
 */

'use client';

import { Trophy, ArrowRight, Award } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  Pill,
  ActionButton,
  EmptyState,
} from '../../_components/ui/dashboard';

const CATEGORY_TONE = {
  Contest: 'rose',
  Hackathon: 'amber',
  Research: 'cyan',
  Workshop: 'violet',
};

export default function Achievements({ achievements = [] }) {
  return (
    <GlassCard>
      <SectionHeader
        icon={Trophy}
        title="Recent Achievements"
        subtitle="What the club has accomplished lately"
        accent="amber"
        action={
          <ActionButton
            href="/account/advisor/achievements"
            tone="ghost"
            icon={ArrowRight}
          >
            View all
          </ActionButton>
        }
      />
      {achievements.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No achievements logged"
          description="Club achievements published by the executive will appear here."
        />
      ) : (
        <ul className="space-y-2">
          {achievements.map((a, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-amber-500/30 hover:bg-amber-500/[0.04]"
            >
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
                <Award className="h-4 w-4 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-white">
                  {a.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Pill tone={CATEGORY_TONE[a.category] ?? 'gray'}>
                    {a.category}
                  </Pill>
                  <span>{a.date}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
