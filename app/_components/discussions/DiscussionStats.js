/**
 * @file Discussion Stats Component
 * Stats cards for member and staff dashboards.
 *
 * @module DiscussionStats
 */

'use client';

import { motion } from 'framer-motion';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

/**
 * Single stat card.
 */
function StatCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  className = '',
}) {
  const chipClasses = {
    blue: 'border-blue-500/20   bg-blue-500/10   text-blue-400',
    green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    yellow: 'border-amber-500/20  bg-amber-500/10  text-amber-400',
    red: 'border-rose-500/20   bg-rose-500/10   text-rose-400',
    purple: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    gray: 'border-white/10      bg-white/5       text-gray-400',
  };

  const chip = chipClasses[color] ?? chipClasses.gray;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-white/8 bg-gray-900 p-4 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {trend !== undefined && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3" />
              <span>
                {trend > 0 ? '+' : ''}
                {trend}% this week
              </span>
            </div>
          )}
        </div>
        <div className={`rounded-xl border p-2 ${chip}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Member discussion stats overview.
 */
export function MemberStats({ stats, className = '' }) {
  const { total = 0, open = 0, in_progress = 0, resolved = 0 } = stats || {};

  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}>
      <StatCard
        label="Total Discussions"
        value={total}
        icon={MessageSquare}
        color="blue"
      />
      <StatCard label="Open" value={open} icon={AlertCircle} color="yellow" />
      <StatCard
        label="In Progress"
        value={in_progress}
        icon={Clock}
        color="purple"
      />
      <StatCard
        label="Resolved"
        value={resolved}
        icon={CheckCircle}
        color="green"
      />
    </div>
  );
}

/**
 * Staff discussion stats overview.
 */
export function StaffStats({ stats, className = '' }) {
  const {
    total = 0,
    open = 0,
    in_progress = 0,
    unassigned = 0,
    urgent = 0,
    resolved = 0,
  } = stats || {};

  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 ${className}`}
    >
      <StatCard label="Total" value={total} icon={MessageSquare} color="blue" />
      <StatCard label="Open" value={open} icon={AlertCircle} color="yellow" />
      <StatCard
        label="In Progress"
        value={in_progress}
        icon={Clock}
        color="purple"
      />
      <StatCard
        label="Unassigned"
        value={unassigned}
        icon={Users}
        color="gray"
      />
      <StatCard
        label="Urgent"
        value={urgent}
        icon={AlertTriangle}
        color="red"
      />
      <StatCard
        label="Resolved"
        value={resolved}
        icon={CheckCircle}
        color="green"
      />
    </div>
  );
}

/**
 * Compact inline stats row.
 */
export function InlineStats({ stats, className = '' }) {
  const { total = 0, open = 0, resolved = 0 } = stats || {};

  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <div className="flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4 text-blue-400" />
        <span className="text-gray-400">Total:</span>
        <span className="font-medium text-white">{total}</span>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div className="flex items-center gap-1.5">
        <AlertCircle className="h-4 w-4 text-yellow-400" />
        <span className="text-gray-400">Open:</span>
        <span className="font-medium text-white">{open}</span>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div className="flex items-center gap-1.5">
        <CheckCircle className="h-4 w-4 text-green-400" />
        <span className="text-gray-400">Resolved:</span>
        <span className="font-medium text-white">{resolved}</span>
      </div>
    </div>
  );
}
