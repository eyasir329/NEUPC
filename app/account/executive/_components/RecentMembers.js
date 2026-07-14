/**
 * @file Recent members component
 * @module RecentMembers
 */

'use client';

import { Users, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '@/app/_lib/utils/utils';
import {
  GlassCard,
  SectionHeader,
  ActionButton,
  Avatar,
  Pill,
} from '@/app/account/_components/ui';

const statusTone = { Active: 'emerald', Pending: 'amber' };

export default function RecentMembers({ recentMembers }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Users}
        title="Recent Members"
        subtitle="Newest accounts"
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
      {recentMembers.length === 0 ? (
        <p className="rounded-xl border border-white/6 bg-white/2 p-4 text-sm text-gray-500">
          No members yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {recentMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/10 hover:bg-white/4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={member.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-200">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {member.joined
                      ? `Joined ${formatRelativeTime(member.joined)}`
                      : member.role}
                  </p>
                </div>
              </div>
              <Pill tone={statusTone[member.status] ?? 'gray'}>
                {member.status}
              </Pill>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
