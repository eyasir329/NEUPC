/**
 * @file Mentee overview component — the mentor's real active mentorships
 *   and assigned bootcamps, linked to the management pages.
 * @module MenteeProgressOverview
 */

'use client';

import Link from 'next/link';
import { Users, GraduationCap, ArrowRight } from 'lucide-react';
import { formatDate } from '@/app/_lib/utils/utils';
import {
  GlassCard,
  SectionHeader,
  Pill,
  ActionButton,
  Avatar,
  EmptyState,
} from '@/app/account/_components/ui';

const BOOTCAMP_TONE = {
  active: 'emerald',
  upcoming: 'blue',
  completed: 'violet',
  draft: 'amber',
};

export default function MenteeProgressOverview({
  menteeOverview = [],
  bootcamps = [],
}) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Users}
        title="My Mentees & Bootcamps"
        subtitle="Who and what you're mentoring"
        accent="blue"
        action={
          <ActionButton href="/account/mentor/assigned-members" tone="primary">
            View All
          </ActionButton>
        }
      />

      {menteeOverview.length === 0 && bootcamps.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No mentees or bootcamps yet"
          description="Assignments made by the admin will appear here."
          accent="blue"
        />
      ) : (
        <div className="space-y-4">
          {bootcamps.length > 0 && (
            <div className="space-y-2">
              {bootcamps.slice(0, 4).map((b) => (
                <Link
                  key={b.id}
                  href={`/account/mentor/bootcamps/${b.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/10 hover:bg-white/4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
                    <GraduationCap className="h-4.5 w-4.5 text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {b.title}
                    </p>
                    <p className="text-xs text-gray-500">Bootcamp</p>
                  </div>
                  <Pill tone={BOOTCAMP_TONE[b.status] || 'blue'}>
                    {b.status || 'active'}
                  </Pill>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-500" />
                </Link>
              ))}
            </div>
          )}

          {menteeOverview.length > 0 && (
            <div className="space-y-2">
              {menteeOverview.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/10 hover:bg-white/4"
                >
                  <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {m.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      Mentee since {formatDate(m.since)}
                    </p>
                  </div>
                  <Pill tone="emerald">{m.status}</Pill>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
