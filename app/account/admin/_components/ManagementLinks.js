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
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20 h-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 rounded-2xl shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">
              Management
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Secondary admin tools
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-2xl group-hover:scale-105 transition-transform shrink-0">
                <Icon className={`w-5 h-5 ${link.tone}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-zinc-100 truncate">
                    {link.label}
                  </p>
                  <ArrowUpRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:text-zinc-300 transition-all shrink-0" />
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 truncate">
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
