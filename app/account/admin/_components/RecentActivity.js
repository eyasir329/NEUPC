/**
 * @file Recent activity timeline — vertical timeline of admin-relevant
 *   system events (registrations, approvals, role changes, backups)
 *   with tone-coded icons. Matches member panel timeline pattern.
 * @module RecentActivity
 */

'use client';

import Link from 'next/link';
import {
  Activity,
  UserCheck,
  CheckCircle2,
  Shield,
  Database,
  ArrowRight,
} from 'lucide-react';

const ICON_MAP = {
  UserCheck,
  CheckCircle: CheckCircle2,
  CheckCircle2,
  Shield,
  Database,
};

const TYPE_TO_TONE = {
  user: { text: 'text-blue-400', border: 'border-blue-500/30' },
  event: { text: 'text-emerald-400', border: 'border-emerald-500/30' },
  role: { text: 'text-violet-400', border: 'border-violet-500/30' },
  system: { text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

const MAX_ITEMS = 4;

export default function RecentActivity({ recentActivities = [] }) {
  const visible = recentActivities.slice(0, MAX_ITEMS);
  const extra = recentActivities.length - visible.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <Activity className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Recent Activity
            </h3>
            <p className="mt-1 text-xs text-zinc-500">Latest platform events</p>
          </div>
        </div>
        {extra > 0 && (
          <Link
            href="/account/admin/system-logs"
            className="flex shrink-0 items-center gap-2 text-xs font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-100"
          >
            All {recentActivities.length} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="relative mt-4 ml-6 space-y-8 border-l border-white/10 pb-2">
        {visible.map((activity, i) => {
          const Icon = ICON_MAP[activity.iconName] ?? Activity;
          const tone = TYPE_TO_TONE[activity.type] ?? TYPE_TO_TONE.system;

          return (
            <div key={i} className="group relative cursor-pointer pl-8">
              <div
                className={`absolute top-0 -left-[17px] h-8 w-8 rounded-2xl border bg-zinc-900/50 backdrop-blur-xl ${tone.border} flex items-center justify-center shadow-lg shadow-black/40 transition-transform group-hover:scale-110`}
              >
                <Icon className={`h-4 w-4 ${tone.text}`} />
              </div>

              <div className="pt-1">
                <h4 className="mb-1 text-sm leading-tight font-bold text-zinc-100 transition-colors group-hover:text-indigo-400">
                  {activity.action}
                </h4>
                <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
