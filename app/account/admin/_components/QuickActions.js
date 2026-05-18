/**
 * @file Quick actions tile grid — primary navigation shortcuts for the
 *   admin dashboard. Dark-glass tile pattern matching member panel.
 * @module QuickActions
 */

'use client';

import Link from 'next/link';
import {
  Zap,
  ArrowUpRight,
  Users,
  Shield,
  Calendar,
  BarChart3,
  FileText,
  Settings,
} from 'lucide-react';

const ICON_MAP = {
  Users,
  Shield,
  Calendar,
  BarChart3,
  FileText,
  Settings,
};

const ICON_TONE = {
  blue: 'text-blue-400',
  purple: 'text-violet-400',
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  pink: 'text-pink-400',
  cyan: 'text-cyan-400',
};

export default function QuickActions({ quickActions = [] }) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 rounded-2xl shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">
              Quick Actions
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Jump into the most-used admin tools
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {quickActions.map((action, idx) => {
          const Icon = ICON_MAP[action.iconName] ?? Settings;
          const tone = ICON_TONE[action.color] ?? 'text-zinc-300';
          return (
            <Link
              key={idx}
              href={action.link}
              className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-2xl group-hover:scale-105 transition-transform shrink-0">
                  <Icon className={`w-5 h-5 ${tone}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:text-zinc-300 transition-all" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-100 truncate">
                  {action.title}
                </p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 truncate">
                  {action.count}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
