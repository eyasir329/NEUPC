/**
 * @file Latest notices component
 * @module LatestNotices
 */

'use client';

import { Megaphone, ArrowRight } from 'lucide-react';
import { formatDate } from '@/app/_lib/utils/utils';
import {
  GlassCard,
  SectionHeader,
  ActionButton,
  Pill,
} from '@/app/account/_components/ui';

export default function LatestNotices({ latestNotices }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Megaphone}
        title="Latest Notices"
        subtitle="Recent announcements"
        accent="pink"
        action={
          <ActionButton
            tone="primary"
            href="/account/executive/inbox"
            icon={ArrowRight}
          >
            View all
          </ActionButton>
        }
      />
      {latestNotices.length === 0 ? (
        <p className="rounded-xl border border-white/6 bg-white/2 p-4 text-sm text-gray-500">
          No notices published yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {latestNotices.map((notice) => (
            <div
              key={notice.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/2 p-4 transition-all hover:border-white/10 hover:bg-white/4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-200">
                  {notice.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {notice.date ? formatDate(notice.date) : ''}
                </p>
              </div>
              <Pill tone={notice.active ? 'emerald' : 'gray'}>
                {notice.active ? 'Active' : 'Expired'}
              </Pill>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
