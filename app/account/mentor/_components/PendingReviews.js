/**
 * @file Pending reviews component — task submissions awaiting the
 *   mentor's review, linked to the Tasks page.
 * @module PendingReviews
 */

'use client';

import Link from 'next/link';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '@/app/_lib/utils/utils';
import {
  GlassCard,
  SectionHeader,
  Avatar,
  EmptyState,
} from '@/app/account/_components/ui';

export default function PendingReviews({ submissions = [] }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={ClipboardCheck}
        title="Pending Reviews"
        subtitle="Submissions waiting for you"
        accent="blue"
      />

      {submissions.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="All caught up"
          description="No submissions are waiting for review."
          accent="blue"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/10 hover:bg-white/4"
            >
              <Avatar
                name={s.users?.full_name || 'Member'}
                src={s.users?.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {s.users?.full_name || 'Member'}
                  </p>
                  <span className="shrink-0 text-[11px] text-gray-500">
                    {formatRelativeTime(s.submitted_at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {s.weekly_tasks?.title || 'Task submission'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/account/mentor/tasks"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
      >
        Review Submissions <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </GlassCard>
  );
}
