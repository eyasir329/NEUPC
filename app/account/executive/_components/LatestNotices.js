'use client';

import { Megaphone, Plus, Eye } from 'lucide-react';
import { GlassCard, SectionHeader, ActionButton, Pill } from './_ui';

export default function LatestNotices({ latestNotices }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Megaphone}
        title="Latest Notices"
        subtitle="Recent announcements"
        accent="pink"
        action={
          <ActionButton tone="primary" href="/account/executive/notices/create" icon={Plus}>
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200 truncate">{notice.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{notice.date}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Pill tone={notice.status === 'Published' ? 'emerald' : 'amber'}>
                {notice.status}
              </Pill>
              <button className="rounded-lg border border-white/6 bg-white/2 p-1.5 text-gray-400 hover:text-white hover:bg-white/6 transition-all">
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
