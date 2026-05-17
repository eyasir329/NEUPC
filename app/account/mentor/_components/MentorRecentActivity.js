'use client';

import { CheckCircle, UserPlus, BookOpen, Star, Zap } from 'lucide-react';
import { GlassCard, SectionHeader, Avatar, StaggerList } from './_ui';

const iconMap = { CheckCircle, UserPlus, BookOpen, Star };

const TONE_CHIP = {
  green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  purple: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
};

export default function MentorRecentActivity({ recentActivities }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Zap}
        title="Recent Activity"
        subtitle="Latest updates"
        accent="amber"
      />

      <StaggerList>
        {recentActivities.map((activity, idx) => {
          const Icon = iconMap[activity.icon] ?? CheckCircle;
          const chip = TONE_CHIP[activity.color] ?? TONE_CHIP.blue;
          return (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/10 hover:bg-white/4"
            >
              <div className={`inline-flex shrink-0 rounded-lg border p-1.5 ${chip}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-snug">{activity.action}</p>
                <p className="mt-0.5 text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </StaggerList>
    </GlassCard>
  );
}
