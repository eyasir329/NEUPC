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
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
            <Zap className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Quick Actions
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Jump into the most-used admin tools
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-transform group-hover:scale-105">
                  <Icon className={`h-5 w-5 ${tone}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-600 opacity-0 transition-all group-hover:text-zinc-300 group-hover:opacity-100" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-100">
                  {action.title}
                </p>
                <p className="mt-1 truncate text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
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
