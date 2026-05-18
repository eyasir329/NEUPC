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
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 rounded-2xl shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">
              Recent Activity
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Latest platform events
            </p>
          </div>
        </div>
        {extra > 0 && (
          <Link
            href="/account/admin/system-logs"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 transition-colors shrink-0"
          >
            All {recentActivities.length} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="relative border-l border-white/10 ml-6 space-y-8 pb-2 mt-4">
        {visible.map((activity, i) => {
          const Icon = ICON_MAP[activity.iconName] ?? Activity;
          const tone = TYPE_TO_TONE[activity.type] ?? TYPE_TO_TONE.system;

          return (
            <div key={i} className="relative pl-8 group cursor-pointer">
              <div
                className={`absolute -left-[17px] top-0 w-8 h-8 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border ${tone.border} flex items-center justify-center shadow-lg shadow-black/40 group-hover:scale-110 transition-transform`}
              >
                <Icon className={`w-4 h-4 ${tone.text}`} />
              </div>

              <div className="pt-1">
                <h4 className="text-sm font-bold text-zinc-100 leading-tight mb-1 group-hover:text-indigo-400 transition-colors">
                  {activity.action}
                </h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
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
