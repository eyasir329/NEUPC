/**
 * @file Pending actions widget — dashboard panel listing items
 *   awaiting executive review (applications, content, approvals).
 * @module ExecutivePendingActions
 */

'use client';

import { UserCheck, UserPlus, FileText, Calendar } from 'lucide-react';

const iconMap = {
  UserCheck: UserCheck,
  UserPlus: UserPlus,
  FileText: FileText,
  Calendar: Calendar,
};

const colorClasses = {
  red: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    hoverBg: 'hover:bg-red-500/20',
    icon: 'text-red-400',
    text: 'text-red-300',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    hoverBg: 'hover:bg-amber-500/20',
    icon: 'text-amber-400',
    text: 'text-amber-300',
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    hoverBg: 'hover:bg-blue-500/20',
    icon: 'text-blue-400',
    text: 'text-blue-300',
  },
  orange: {
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    hoverBg: 'hover:bg-orange-500/20',
    icon: 'text-orange-400',
    text: 'text-orange-300',
  },
};

export default function PendingActions({ pendingActions }) {
  const totalCount = pendingActions.reduce(
    (sum, action) => sum + action.count,
    0
  );

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">⚡ Pending Actions</h2>
          <p className="text-sm text-gray-400">
            Items requiring immediate attention
          </p>
        </div>
        <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
          {totalCount} Total
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pendingActions.map((action) => {
          const Icon = iconMap[action.icon];
          const colors = colorClasses[action.color];
          return (
            <div
              key={action.id}
              className={`group cursor-pointer rounded-lg border ${colors.border} ${colors.bg} p-4 transition-all duration-200 ${colors.hoverBg}`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${colors.icon}`} />
                <span className={`text-2xl font-bold ${colors.text}`}>
                  {action.count}
                </span>
              </div>
              <p className={`mt-2 text-sm font-semibold ${colors.text}`}>
                {action.label}
              </p>
              <button
                className={`mt-2 text-xs ${colors.icon} transition-colors group-hover:brightness-125`}
              >
                View Details →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
