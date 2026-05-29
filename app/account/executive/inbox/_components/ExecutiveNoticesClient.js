/**
 * @file Executive notices client component
 * @module ExecutiveNoticesClient
 */

'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Bell,
  BellOff,
  Pin,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell, TabBar, PageHeader } from '@/app/account/_components/ui';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString();
const inDays = (d) => new Date(Date.now() + d * 86_400_000).toISOString();

const MOCK_NOTICES = [
  {
    id: 'e1',
    title: 'NEUPC Executive Committee — May Meeting Agenda',
    is_pinned: true,
    priority: 'high',
    notice_type: 'announcement',
    content:
      'The May executive committee meeting is scheduled for May 28 at 5:00 PM in Room 301. Agenda includes: budget review, event planning for June, membership drive update, and upcoming contest preparation. All executive members are required to attend.\n\nPlease prepare your department reports and submit them to the secretary by May 27, 2:00 PM.',
    created_at: daysAgo(2),
    expires_at: inDays(7),
    target_audience: ['executive'],
  },
  {
    id: 'e2',
    title: 'Critical: Server Maintenance — May 20 (2 AM – 6 AM BDT)',
    is_pinned: true,
    priority: 'critical',
    notice_type: 'alert',
    content:
      'The NEUPC platform will be offline for scheduled maintenance on May 20 from 2:00 AM to 6:00 AM BDT. Administrative actions (notice publishing, member management) will be unavailable during this window.\n\nPlease complete any pending actions before 1:30 AM. Members will be notified separately.',
    created_at: daysAgo(1),
    expires_at: inDays(3),
    target_audience: ['all'],
  },
  {
    id: 'e3',
    title: 'Spring Programming Contest 2026 — Final Preparation',
    is_pinned: false,
    priority: 'high',
    notice_type: 'reminder',
    content:
      'The Spring Programming Contest 2026 is scheduled for June 5. Executive members coordinating logistics should finalize:\n• Venue booking confirmation\n• Volunteer assignments\n• Problem set security protocol\n• Registration closing date: May 30\n\nContact the contest director for any outstanding items.',
    created_at: daysAgo(4),
    expires_at: inDays(20),
    target_audience: ['executive'],
  },
  {
    id: 'e4',
    title: 'Membership Drive Campaign — Action Required',
    is_pinned: false,
    priority: 'medium',
    notice_type: 'announcement',
    content:
      'The 2026 membership drive campaign launches June 1. Marketing team to prepare social media assets by May 29. Outreach team to coordinate with university departments for tabling slots. All executives are requested to share the campaign on personal networks.',
    created_at: daysAgo(5),
    expires_at: inDays(15),
    target_audience: ['executive'],
  },
  {
    id: 'e5',
    title: 'New Feature: In-App Video Calling for Sessions (Beta)',
    is_pinned: false,
    priority: 'medium',
    notice_type: 'announcement',
    content:
      'The NEUPC platform now supports in-app video calling for mentorship sessions (beta). Executives can enable/disable this feature per cohort from the Bootcamp management panel. Please test and report issues via the Help Desk.',
    created_at: daysAgo(6),
    expires_at: null,
    target_audience: ['all'],
  },
  {
    id: 'e6',
    title: 'Updated Club Code of Conduct — Review Required',
    is_pinned: false,
    priority: 'low',
    notice_type: 'general',
    content:
      'The NEUPC club code of conduct has been updated for 2026. Key changes include updated session cancellation policies, communication guidelines, and conflict resolution procedures. All executive members must review and acknowledge receipt by June 1.',
    created_at: daysAgo(10),
    expires_at: null,
    target_audience: ['executive', 'all'],
  },
  {
    id: 'e7',
    title: 'Budget Allocation — Q2 2026 Report Submitted',
    is_pinned: false,
    priority: 'low',
    notice_type: 'general',
    content:
      'The Q2 2026 budget allocation report has been submitted to the faculty advisor for review. A detailed breakdown is available in the shared drive. Executive members with budget queries should contact the treasurer directly.',
    created_at: daysAgo(14),
    expires_at: inDays(14),
    target_audience: ['executive'],
  },
];

const PRIORITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    dot: 'bg-rose-500',
    glow: 'rgba(244,63,94,0.6)',
    badge: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-500',
    glow: 'rgba(245,158,11,0.6)',
    badge: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  },
  medium: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-500',
    glow: 'rgba(59,130,246,0.6)',
    badge: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  },
  low: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
    glow: 'rgba(16,185,129,0.6)',
    badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  },
};

const cfg = (p) => PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG.medium;

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hrs ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function tabFilter(notices, id) {
  if (id === 'all') return notices;
  if (id === 'pinned') return notices.filter((n) => n.is_pinned);
  if (id === 'critical')
    return notices.filter(
      (n) => n.priority === 'critical' || n.priority === 'high'
    );
  if (id === 'announcements')
    return notices.filter(
      (n) => n.notice_type === 'announcement' || n.notice_type === 'alert'
    );
  if (id === 'general')
    return notices.filter(
      (n) =>
        n.notice_type === 'general' ||
        n.notice_type === 'reminder' ||
        n.notice_type === 'event'
    );
  return notices;
}

export default function ExecutiveNoticesClient({ notices: rawNotices = [] }) {
  const notices = rawNotices.length === 0 ? MOCK_NOTICES : rawNotices;

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const pinnedCount = notices.filter((n) => n.is_pinned).length;
  const criticalCount = notices.filter(
    (n) => n.priority === 'critical' || n.priority === 'high'
  ).length;

  const filtered = useMemo(() => {
    const byTab = tabFilter(notices, tab);
    if (!search) return byTab;
    const q = search.toLowerCase();
    return byTab.filter(
      (n) =>
        n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q)
    );
  }, [notices, tab, search]);

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const prevTabRef = useRef(tab);
  const handleTabChange = (newTab) => {
    prevTabRef.current = tab;
    setTab(newTab);
    setCurrentPage(1);
    setExpanded(null);
  };

  const tabs = [
    { value: 'all', label: 'All', icon: Inbox, count: notices.length },
    { value: 'pinned', label: 'Pinned', icon: Pin, count: pinnedCount },
    {
      value: 'critical',
      label: 'High Priority',
      icon: AlertTriangle,
      count: criticalCount,
    },
    {
      value: 'announcements',
      label: 'Announcements',
      icon: Bell,
      count: tabFilter(notices, 'announcements').length,
    },
    {
      value: 'general',
      label: 'General',
      icon: Info,
      count: tabFilter(notices, 'general').length,
    },
  ];

  return (
    <PageShell className="text-gray-300 selection:bg-blue-500/30">
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Bell}
          title="Inbox"
          subtitle="Announcements and updates for the executive committee."
          accent="blue"
          meta={
            pinnedCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-400 uppercase">
                <Pin size={11} />
                {pinnedCount} Pinned
              </span>
            ) : null
          }
        />

        <TabBar tabs={tabs} value={tab} onChange={handleTabChange} />

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Notices list */}
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
            {/* Search + count row */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/6 pb-3">
              <p className="text-xs font-medium text-gray-500">
                {filtered.length === 0
                  ? 'No notices found'
                  : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} notice${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-44 rounded-lg border border-white/10 bg-white/5 py-1.5 pr-3 pl-8 text-xs text-white placeholder-gray-500 focus:border-blue-500/40 focus:outline-none"
                />
              </div>
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.length === 0 ? (
                <motion.div
                  key={`empty-${tab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/2 p-12 text-center"
                >
                  <BellOff size={48} className="mb-4 text-gray-700" />
                  <h3 className="mb-1 text-lg font-medium text-gray-300">
                    No notices here
                  </h3>
                  <p className="mb-6 max-w-sm text-sm text-gray-500">
                    {search
                      ? 'No results match your search.'
                      : 'New notices will show up here.'}
                  </p>
                  {(tab !== 'all' || search) && (
                    <button
                      onClick={() => {
                        handleTabChange('all');
                        setSearch('');
                      }}
                      className="rounded-xl border border-white/8 bg-white/4 px-5 py-2.5 text-sm font-semibold text-gray-300 shadow-sm transition-colors hover:bg-white/8 active:scale-95"
                    >
                      View all notices
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={`list-${tab}-${currentPage}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col overflow-hidden rounded-2xl border border-white/6 shadow-sm"
                >
                  <AnimatePresence initial={false}>
                    {paginated.map((n) => {
                      const config = cfg(n.priority);
                      const Icon = config.icon;
                      const isExpanded = expanded === n.id;
                      return (
                        <motion.div
                          key={n.id}
                          exit={{
                            opacity: 0,
                            height: 0,
                            paddingTop: 0,
                            paddingBottom: 0,
                          }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                          className={cn(
                            'group relative flex flex-col border-b border-white/4 transition-colors duration-200 last:border-b-0',
                            n.is_pinned
                              ? 'bg-blue-500/3 hover:bg-blue-500/6'
                              : 'bg-white/1 hover:bg-white/3'
                          )}
                        >
                          {/* Pinned dot */}
                          <AnimatePresence>
                            {n.is_pinned && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="absolute top-1/2 left-4 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                              />
                            )}
                          </AnimatePresence>

                          {/* Header row — click to expand */}
                          <div
                            className={cn(
                              'flex cursor-pointer items-start gap-4 p-4',
                              n.is_pinned ? 'pl-8' : ''
                            )}
                            onClick={() =>
                              setExpanded(isExpanded ? null : n.id)
                            }
                          >
                            <div
                              className={cn(
                                'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                                config.bg,
                                config.color,
                                'border-white/5'
                              )}
                            >
                              <Icon size={18} />
                            </div>

                            <div className="min-w-0 flex-1 pr-8">
                              <div className="mb-1 flex items-start justify-between gap-3">
                                <p className="truncate text-sm leading-snug font-semibold text-gray-100">
                                  {n.title}
                                </p>
                                <span className="shrink-0 font-mono text-[11px] font-medium text-gray-500">
                                  {timeAgo(n.created_at)}
                                </span>
                              </div>
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize',
                                    config.badge
                                  )}
                                >
                                  {n.priority}
                                </span>
                                {n.is_pinned && (
                                  <span className="inline-flex items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                                    <Pin size={9} /> Pinned
                                  </span>
                                )}
                                {n.notice_type && (
                                  <span className="inline-flex rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 capitalize">
                                    {n.notice_type}
                                  </span>
                                )}
                                {n.expires_at && (
                                  <span className="text-[10px] text-gray-500">
                                    Expires{' '}
                                    {new Date(n.expires_at).toLocaleDateString(
                                      'en-US',
                                      { month: 'short', day: 'numeric' }
                                    )}
                                  </span>
                                )}
                              </div>
                              {!isExpanded && (
                                <p className="line-clamp-1 text-[13px] leading-relaxed text-gray-500">
                                  {n.content}
                                </p>
                              )}
                            </div>

                            <div className="absolute top-4 right-4 text-gray-500">
                              {isExpanded ? (
                                <ChevronUp size={15} />
                              ) : (
                                <ChevronDown size={15} />
                              )}
                            </div>
                          </div>

                          {/* Expanded body */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.2,
                                  ease: 'easeInOut',
                                }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div
                                  className={cn(
                                    'border-t border-white/4 px-4 pt-3 pb-4',
                                    n.is_pinned ? 'pl-8' : 'pl-18'
                                  )}
                                >
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-300">
                                    {n.content}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-white/6 p-3">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-xs font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronLeft size={14} /> Prev
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={cn(
                              'h-8 w-8 rounded-lg text-xs font-bold transition-colors',
                              currentPage === i + 1
                                ? 'border border-blue-500/30 bg-blue-500/20 text-blue-300'
                                : 'text-gray-500 hover:bg-white/4 hover:text-gray-300'
                            )}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-xs font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right sidebar */}
          <div className="sticky top-6 hidden flex-col gap-6 lg:flex">
            <div className="rounded-2xl border border-white/8 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
              <h3 className="mb-4 text-sm font-bold text-gray-200">Overview</h3>
              <div className="flex flex-col gap-4 text-sm">
                {[
                  {
                    label: 'Total',
                    value: notices.length,
                    color: 'text-white bg-white/[0.06]',
                  },
                  {
                    label: 'Pinned',
                    value: pinnedCount,
                    color: 'text-blue-400 bg-blue-500/10',
                  },
                  {
                    label: 'High Priority',
                    value: criticalCount,
                    color: 'text-rose-400 bg-rose-500/10',
                  },
                  {
                    label: 'Announcements',
                    value: tabFilter(notices, 'announcements').length,
                    color: 'text-violet-400 bg-violet-500/10',
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-500">{label}</span>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 font-semibold tabular-nums',
                        color
                      )}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
