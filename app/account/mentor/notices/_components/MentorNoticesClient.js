/**
 * @file Mentor notices client — read-only view of club notices
 *   filtered for mentor relevance with search and category filters.
 * @module MentorNoticesClient
 */

'use client';

import { useState } from 'react';
import {
  Bell,
  Search,
  Pin,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PRIORITY_CONFIG = {
  critical: {
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertCircle,
  },
  high: {
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: AlertTriangle,
  },
  medium: {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Info,
  },
  low: {
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle,
  },
};

const TYPE_COLORS = {
  announcement: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  event: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  alert: 'bg-red-500/20 text-red-400 border-red-500/30',
  reminder: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  general: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function MentorNoticesClient({ notices = [], mentorId }) {
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const pinned = notices.filter((n) => n.is_pinned);
  const regular = notices.filter((n) => !n.is_pinned);

  const filterFn = (n) => {
    const matchSearch =
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content?.toLowerCase().includes(search.toLowerCase());
    const matchPriority =
      filterPriority === 'all' || n.priority === filterPriority;
    return matchSearch && matchPriority;
  };

  const filteredPinned = pinned.filter(filterFn);
  const filteredRegular = regular.filter(filterFn);

  const stats = {
    total: notices.length,
    pinned: pinned.length,
    critical: notices.filter((n) => n.priority === 'critical').length,
    unread: notices.filter(
      (n) => n.priority === 'high' || n.priority === 'critical'
    ).length,
  };

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Notices</h1>
        <p className="mt-1 text-gray-400">
          Announcements and notifications for mentors
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-400' },
          { label: 'Pinned', value: stats.pinned, color: 'text-amber-400' },
          { label: 'Critical', value: stats.critical, color: 'text-red-400' },
          {
            label: 'High Priority',
            value: stats.unread,
            color: 'text-orange-400',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
          >
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notices…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none"
          />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Pinned Notices */}
      {filteredPinned.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider text-amber-400 uppercase">
            <Pin className="h-4 w-4" />
            Pinned ({filteredPinned.length})
          </h2>
          <div className="space-y-3">
            {filteredPinned.map((n) => (
              <NoticeCard
                key={n.id}
                notice={n}
                expanded={expanded === n.id}
                onToggle={() => setExpanded(expanded === n.id ? null : n.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Notices */}
      {filteredRegular.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Recent Notices ({filteredRegular.length})
          </h2>
          <div className="space-y-3">
            {filteredRegular.map((n) => (
              <NoticeCard
                key={n.id}
                notice={n}
                expanded={expanded === n.id}
                onToggle={() => setExpanded(expanded === n.id ? null : n.id)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredPinned.length === 0 && filteredRegular.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
          <Bell className="mx-auto mb-4 h-16 w-16 text-gray-600" />
          <p className="text-lg font-medium text-gray-400">No notices</p>
          <p className="mt-1 text-sm text-gray-500">
            {notices.length === 0
              ? 'There are no active notices for mentors.'
              : 'No results match your search.'}
          </p>
        </div>
      )}
    </div>
  );
}

function NoticeCard({ notice, expanded, onToggle }) {
  const priorityCfg =
    PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.medium;
  const PriorityIcon = priorityCfg.icon;

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl ${notice.is_pinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/5'}`}
    >
      <div
        className="flex cursor-pointer items-start justify-between gap-3 p-5"
        onClick={onToggle}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${priorityCfg.color}`}
          >
            <PriorityIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">{notice.title}</h3>
              {notice.is_pinned && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              )}
              {notice.notice_type && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${TYPE_COLORS[notice.notice_type] || TYPE_COLORS.general}`}
                >
                  {notice.notice_type}
                </span>
              )}
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${priorityCfg.color}`}
              >
                {notice.priority}
              </span>
            </div>
            {!expanded && (
              <p className="line-clamp-2 text-sm text-gray-400">
                {notice.content}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {new Date(notice.created_at || Date.now()).toLocaleDateString(
                'en-US',
                { month: 'long', day: 'numeric', year: 'numeric' }
              )}
              {notice.expires_at &&
                ` · Expires ${new Date(notice.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-gray-400">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 px-5 pt-4 pb-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-300">
            {notice.content}
          </p>
        </div>
      )}
    </div>
  );
}
