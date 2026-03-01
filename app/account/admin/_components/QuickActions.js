/**
 * @file Quick actions panel — icon-labelled shortcut buttons linking
 *   to frequently used admin pages (users, roles, events, analytics,
 *   blogs, settings).
 * @module QuickActions
 */

'use client';

import Link from 'next/link';
import {
  ExternalLink,
  Users,
  Shield,
  Calendar,
  BarChart3,
  FileText,
  Settings,
} from 'lucide-react';

const iconMap = {
  Users,
  Shield,
  Calendar,
  BarChart3,
  FileText,
  Settings,
};

export default function QuickActions({ quickActions }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">⚡ Quick Actions</h2>
        <p className="text-sm text-gray-400">
          Administrative tools and management
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {quickActions.map((action, idx) => {
          const Icon = iconMap[action.iconName];
          return (
            <Link
              key={idx}
              href={action.link}
              className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg bg-${action.color}-500/20 p-2`}>
                  <Icon className={`h-5 w-5 text-${action.color}-400`} />
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <h3 className="font-semibold text-white">{action.title}</h3>
              <p className="mt-1 text-xs text-gray-400">
                {typeof action.count === 'number' ? action.count : action.count}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
