/**
 * @file Advisor notices client component
 * @module AdvisorNoticesClient
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
import {
  PageShell,
  TabBar,
  PageHeader,
} from '@/app/account/_components/ui';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString();
const inDays = (d) => new Date(Date.now() + d * 86_400_000).toISOString();

const MOCK_NOTICES = [
  {
    id: 'a1',
    title: 'Faculty Advisor Review — May Committee Report',
    is_pinned: true,
    priority: 'high',
    notice_type: 'announcement',
    content:
      'The May executive committee report has been submitted for faculty advisor review. Key items include: budget utilisation for Q1, Spring Contest logistics, and mentorship program performance.\n\nPlease review by June 2 and submit your endorsement or feedback through the approvals panel.',
    created_at: daysAgo(2),
    expires_at: inDays(10),
    target_audience: ['advisor'],
  },
  {
    id: 'a2',
    title: 'Critical: Platform Maintenance — May 20 (2 AM – 6 AM BDT)',
    is_pinned: true,
    priority: 'critical',
    notice_type: 'alert',
    content:
      'The NEUPC platform will be offline for scheduled maintenance on May 20 from 2:00 AM to 6:00 AM BDT. Administrative panels (approvals, analytics) will be unavailable during this window.\n\nNo data loss expected. Members will be notified separately.',
    created_at: daysAgo(1),
    expires_at: inDays(3),
    target_audience: ['all'],
  },
  {
    id: 'a3',
    title: 'Pending Approvals: 3 Membership Applications Awaiting Review',
    is_pinned: false,
    priority: 'high',
    notice_type: 'reminder',
    content:
      'There are currently 3 membership applications that require faculty advisor sign-off before final approval. Please visit the Approvals panel to review the pending applications.\n\nDeadline for review: May 30.',
    created_at: daysAgo(3),
    expires_at: inDays(8),
    target_audience: ['advisor'],
  },
  {
    id: 'a4',
    title: 'Spring Contest 2026 — Faculty Oversight Requested',
    is_pinned: false,
    priority: 'medium',
    notice_type: 'announcement',
    content:
      'The Spring Programming Contest 2026 is scheduled for June 5. The organizing committee has requested faculty advisor presence during the event opening and the prize ceremony. Please confirm your availability with the executive president.',
    created_at: daysAgo(5),
    expires_at: inDays(18),
    target_audience: ['advisor'],
  },
  {
    id: 'a5',
    title: 'Bootcamp Cohort Performance — Q1 Analytics Ready',
    is_pinned: false,
    priority: 'medium',
    notice_type: 'announcement',
    content:
      'The Q1 2026 bootcamp performance analytics have been compiled and are available in your Analytics dashboard. Key metrics include cohort completion rates, mentor session logs, and exam score distributions.',
    created_at: daysAgo(6),
    expires_at: null,
    target_audience: ['advisor'],
  },
  {
    id: 'a6',
    title: 'Updated Club Code of Conduct — Advisory Acknowledgement Required',
    is_pinned: false,
    priority: 'low',
    notice_type: 'general',
    content:
      'The NEUPC club code of conduct has been updated for 2026. Faculty advisors are requested to review the updated document and formally acknowledge receipt by June 1. The updated policy covers session cancellations, communication standards, and grievance procedures.',
    created_at: daysAgo(10),
    expires_at: null,
    target_audience: ['all'],
  },
  {
    id: 'a7',
    title: 'Annual Budget Report — Pending Faculty Sign-Off',
    is_pinned: false,
    priority: 'low',
    notice_type: 'general',
    content:
      'The annual budget report for the 2025–2026 academic year has been prepared by the treasurer and submitted for faculty sign-off. The report includes all event expenditures, contest budgets, and membership-related costs.',
    created_at: daysAgo(14),
    expires_at: inDays(14),
    target_audience: ['advisor'],
  },
];

const PRIORITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    badge: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    badge: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  },
  medium: {
    icon: Info,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    badge: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  },
  low: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
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

export default function AdvisorNoticesClient({ notices: rawNotices = [] }) {
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
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Bell}
          title="Inbox"
          subtitle="Notices and announcements for faculty advisors."
          accent="violet"
          meta={
            pinnedCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-md border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-violet-400 uppercase">
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
                  className="w-44 rounded-lg border border-white/10 bg-white/5 py-1.5 pr-3 pl-8 text-xs text-white placeholder-gray-500 focus:border-violet-500/40 focus:outline-none"
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
                              ? 'bg-violet-500/3 hover:bg-violet-500/6'
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
                                className="absolute top-1/2 left-4 h-2 w-2 -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
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
                                  <span className="inline-flex items-center gap-1 rounded border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400">
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
                                ? 'border border-violet-500/30 bg-violet-500/20 text-violet-300'
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
                    color: 'text-violet-400 bg-violet-500/10',
                  },
                  {
                    label: 'High Priority',
                    value: criticalCount,
                    color: 'text-rose-400 bg-rose-500/10',
                  },
                  {
                    label: 'Announcements',
                    value: tabFilter(notices, 'announcements').length,
                    color: 'text-amber-400 bg-amber-500/10',
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
