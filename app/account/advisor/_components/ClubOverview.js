/**
 * @file Club overview — compact committee snapshot using shared primitives.
 *
 * @module AdvisorClubOverview
 */

'use client';

import { Users, ArrowRight } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  Avatar,
  Pill,
  ActionButton,
  EmptyState,
} from '@/app/account/_components/ui/dashboard';

export default function ClubOverview({ committee = [] }) {
  return (
    <GlassCard>
      <SectionHeader
        icon={Users}
        title="Committee Snapshot"
        subtitle={`${committee.length} active position${committee.length === 1 ? '' : 's'}`}
        accent="indigo"
        action={
          <ActionButton
            href="/account/advisor/club-overview"
            tone="ghost"
            icon={ArrowRight}
          >
            Details
          </ActionButton>
        }
      />
      {committee.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No committee members yet"
          description="Add positions in the committee module to see them here."
        />
      ) : (
        <ul className="space-y-2">
          {committee.map((m, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={m.name ?? '?'} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {m.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">{m.role}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Pill tone={m.status === 'Active' ? 'emerald' : 'gray'}>
                  {m.status}
                </Pill>
                <span className="text-[10px] text-gray-500">{m.term}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
