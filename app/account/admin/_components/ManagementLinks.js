/**
 * @file Management links grid — secondary navigation tiles linking to
 *   logs, security, exports, and messages. Matches member panel quick
 *   link card style.
 * @module ManagementLinks
 */

'use client';

import Link from 'next/link';
import {
  Layers,
  FileText,
  Lock,
  Database,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';

const LINKS = [
  {
    label: 'System Logs',
    description: 'Audit trail & errors',
    icon: FileText,
    tone: 'text-cyan-400',
    href: '/account/admin/system-logs',
  },
  {
    label: 'Security',
    description: 'Sessions & access',
    icon: Lock,
    tone: 'text-rose-400',
    href: '/account/admin/security',
  },
  {
    label: 'Export Data',
    description: 'CSV & JSON downloads',
    icon: Database,
    tone: 'text-emerald-400',
    href: '/account/admin/export',
  },
  {
    label: 'Inbox',
    description: 'Contact form submissions',
    icon: MessageSquare,
    tone: 'text-blue-400',
    href: '/account/admin/contact-submissions',
  },
];

export default function ManagementLinks() {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
            <Layers className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Management
            </h3>
            <p className="mt-1 text-xs text-zinc-500">Secondary admin tools</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-transform group-hover:scale-105">
                <Icon className={`h-5 w-5 ${link.tone}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-zinc-100">
                    {link.label}
                  </p>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 opacity-0 transition-all group-hover:text-zinc-300 group-hover:opacity-100" />
                </div>
                <p className="mt-1 truncate text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  {link.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
