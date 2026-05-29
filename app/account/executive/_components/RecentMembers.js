/**
 * @file Recent members component
 * @module RecentMembers
 */

'use client';

import { Users, ArrowRight } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  ActionButton,
  Avatar,
  Pill,
} from '@/app/account/_components/ui';

const activityTone = { High: 'emerald', Medium: 'amber', Low: 'rose' };

export default function RecentMembers({ recentMembers }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Users}
        title="Recent Members"
        subtitle="Last 7 days"
        accent="emerald"
        action={
          <ActionButton
            tone="emerald"
            href="/account/executive/users"
            icon={ArrowRight}
          >
            Manage
          </ActionButton>
        }
      />
      <div className="space-y-2.5">
        {recentMembers.map((member, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/10 hover:bg-white/4"
          >
            <div className="flex items-center gap-3">
              <Avatar name={member.name} size="sm" />
              <div>
                <p className="text-sm font-semibold text-gray-200">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500">{member.joinDate}</p>
              </div>
            </div>
            <Pill tone={activityTone[member.activity] ?? 'gray'}>
              {member.activity}
            </Pill>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
