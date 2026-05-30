/**
 * @file Latest notices component
 * @module LatestNotices
 */

'use client';

import { Megaphone, Plus, Eye } from 'lucide-react';
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
            icon={Plus}
          >
            Create
          </ActionButton>
        }
      />
      <div className="space-y-2.5">
        {latestNotices.map((notice, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/2 p-4 transition-all hover:border-white/10 hover:bg-white/4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-200">
                {notice.title}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{notice.date}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Pill tone={notice.status === 'Published' ? 'emerald' : 'amber'}>
                {notice.status}
              </Pill>
              <button className="rounded-lg border border-white/6 bg-white/2 p-1.5 text-gray-400 transition-all hover:bg-white/6 hover:text-white">
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
