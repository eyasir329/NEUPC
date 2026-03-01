/**
 * @file Management links grid — navigation tiles linking to secondary
 *   admin sub-pages (system logs, security, data export, contact
 *   submissions, and settings).
 * @module ManagementLinks
 */

'use client';

import Link from 'next/link';
import { Layers, FileText, Lock, Database, MessageSquare } from 'lucide-react';

const managementLinks = [
  {
    label: 'System Logs',
    icon: FileText,
    color: 'cyan',
    href: '/account/admin/system-logs',
  },
  {
    label: 'Security',
    icon: Lock,
    color: 'red',
    href: '/account/admin/security',
  },
  {
    label: 'Export Data',
    icon: Database,
    color: 'green',
    href: '/account/admin/export',
  },
  {
    label: 'Messages',
    icon: MessageSquare,
    color: 'blue',
    href: '/account/admin/contact-submissions',
  },
];

export default function ManagementLinks() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Layers className="h-5 w-5 text-purple-400" />
        <h3 className="font-bold text-white">Management</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {managementLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <Icon className={`h-4 w-4 text-${link.color}-400`} />
              <span className="text-sm font-semibold text-white">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
