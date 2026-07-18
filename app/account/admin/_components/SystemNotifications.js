/**
 * @file System notifications widget — latest active notices targeted at
 *   administrators, passed in from the server. Matches the member panel
 *   inbox-style preview.
 * @module SystemNotifications
 */

'use client';

import Link from 'next/link';
import { Bell, AlertCircle, CheckCircle2, Pin, ArrowRight } from 'lucide-react';

const TONE_MAP = {
  amber: {
    chip: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    title: 'text-amber-300',
    icon: AlertCircle,
  },
  emerald: {
    chip: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    title: 'text-emerald-300',
    icon: CheckCircle2,
  },
  cyan: {
    chip: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    title: 'text-cyan-300',
    icon: Pin,
  },
};

export default function SystemNotifications({ notices = [] }) {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Bell className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Notices
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Latest announcements for admins
            </p>
          </div>
        </div>
        <Link
          href="/account/admin/inbox"
          className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-100"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Inbox
        </Link>
      </div>

      {notices.length === 0 ? (
        <div className="py-8 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
          <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
            No active notices
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {notices.map((notice) => {
            const tone = TONE_MAP[notice.tone] ?? TONE_MAP.emerald;
            const Icon = tone.icon;
            return (
              <div
                key={notice.id}
                className="group flex items-start gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${tone.chip}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4
                    className={`mb-1 truncate text-sm leading-tight font-bold ${tone.title}`}
                  >
                    {notice.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-zinc-500">
                    {notice.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
