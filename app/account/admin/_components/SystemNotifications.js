/**
 * @file System notifications widget — scheduled maintenance, uptime
 *   confirmations, and other platform-level notices. Matches the
 *   member panel inbox-style preview.
 * @module SystemNotifications
 */

'use client';

import { Bell, AlertCircle, CheckCircle2, Database } from 'lucide-react';

const NOTICES = [
  {
    id: 'backup',
    icon: Database,
    title: 'Database backup scheduled',
    body: 'Tonight at 2:00 AM',
    tone: 'amber',
  },
  {
    id: 'uptime',
    icon: CheckCircle2,
    title: 'All systems operational',
    body: 'Last health check 5 minutes ago',
    tone: 'emerald',
  },
  {
    id: 'cert',
    icon: AlertCircle,
    title: 'SSL certificate renews in 14 days',
    body: 'No action required — auto-renew enabled',
    tone: 'cyan',
  },
];

const TONE_MAP = {
  amber: {
    chip: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    title: 'text-amber-300',
  },
  emerald: {
    chip: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    title: 'text-emerald-300',
  },
  cyan: {
    chip: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    title: 'text-cyan-300',
  },
};

export default function SystemNotifications() {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Bell className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              System Notices
            </h3>
            <p className="mt-1 text-xs text-zinc-500">Platform-level alerts</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {NOTICES.map((notice) => {
          const Icon = notice.icon;
          const tone = TONE_MAP[notice.tone];
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
                  className={`mb-1 text-sm leading-tight font-bold ${tone.title}`}
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
    </div>
  );
}
