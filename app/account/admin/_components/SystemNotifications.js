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
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20 h-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 rounded-2xl shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">
              System Notices
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Platform-level alerts
            </p>
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
              className="group flex items-start gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0"
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-2xl border shrink-0 ${tone.chip}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`text-sm font-bold leading-tight mb-1 ${tone.title}`}>
                  {notice.title}
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
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
