/**
 * @file Admin notices client component
 * @module AdminNoticesClient
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
import { inboxAccent } from './accent';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString();
const inDays = (d) => new Date(Date.now() + d * 86_400_000).toISOString();

const MOCK_NOTICES = [
  {
    id: 'adm1',
    title: 'System Update: Database Migration Scheduled — May 20',
    is_pinned: true,
    priority: 'critical',
    notice_type: 'alert',
    content:
      'A critical database migration is scheduled for May 20 from 2:00 AM to 6:00 AM BDT. All platform services will be temporarily unavailable. Admins must complete any bulk operations before 1:30 AM.\n\nPost-migration checks will be performed by the dev team. Contact the system administrator for queries.',
    created_at: daysAgo(1),
    expires_at: inDays(3),
    target_audience: ['admin', 'all'],
  },
  {
    id: 'adm2',
    title: 'New Role Assignments — May 2026 Committee',
    is_pinned: true,
    priority: 'high',
    notice_type: 'announcement',
    content:
      'The May 2026 committee role assignments have been finalised. New executive and mentor accounts have been provisioned. Admins should verify role mappings in the Roles panel and confirm access controls are correctly applied for each new member.',
    created_at: daysAgo(2),
    expires_at: inDays(14),
    target_audience: ['admin'],
  },
  {
    id: 'adm3',
    title: 'Pending Member Applications — Action Required',
    is_pinned: false,
    priority: 'high',
    notice_type: 'reminder',
    content:
      'There are currently 12 pending membership applications awaiting admin review. Applications older than 7 days require escalated review. Please process them via the Applications panel before May 28.\n\nStudents awaiting approval have been notified of the delay.',
    created_at: daysAgo(3),
    expires_at: inDays(6),
    target_audience: ['admin'],
  },
  {
    id: 'adm4',
    title: 'Spring Contest 2026 — System Capacity Check',
    is_pinned: false,
    priority: 'medium',
    notice_type: 'announcement',
    content:
      'The Spring Programming Contest 2026 is scheduled for June 5. The platform team should perform a load test by May 30 to verify contest infrastructure can handle peak concurrent submissions. Contact the DevOps lead to schedule the test.',
    created_at: daysAgo(4),
    expires_at: inDays(19),
    target_audience: ['admin'],
  },
  {
    id: 'adm5',
    title: 'Security Audit — User Permissions Review',
    is_pinned: false,
    priority: 'medium',
    notice_type: 'announcement',
    content:
      'As part of the annual security audit, all admin accounts should review active user permissions by May 31. Look for orphaned roles, inactive accounts with elevated access, and ensure multi-factor authentication is enabled for all privileged users.',
    created_at: daysAgo(6),
    expires_at: inDays(12),
    target_audience: ['admin'],
  },
  {
    id: 'adm6',
    title: 'Updated Privacy Policy — Platform Compliance',
    is_pinned: false,
    priority: 'low',
    notice_type: 'general',
    content:
      'The NEUPC platform privacy policy has been updated to comply with the latest university data governance guidelines. All admin staff should read and acknowledge the updated policy. Changes cover data retention periods and third-party sharing restrictions.',
    created_at: daysAgo(10),
    expires_at: null,
    target_audience: ['all'],
  },
  {
    id: 'adm7',
    title: 'Q1 2026 Analytics Report Published',
    is_pinned: false,
    priority: 'low',
    notice_type: 'general',
    content:
      'The Q1 2026 platform analytics report has been published and is available in the Analytics dashboard. Key highlights: 340 active members, 18 bootcamp cohorts running, 94% session completion rate. Share relevant findings with the faculty advisor.',
    created_at: daysAgo(14),
    expires_at: inDays(14),
    target_audience: ['admin'],
  },
];

// `medium` priority tracks the page accent (see inbox/accent.js); the others
// are fixed semantic colors.
const buildPriorityConfig = (a) => ({
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
    color: a.mediumColor,
    bg: a.mediumBg,
    badge: a.mediumBadge,
  },
  low: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  },
});

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

export default function InboxClient({
  notices: rawNotices = [],
  accent = 'sky',
  subtitle = 'Notices and system announcements.',
}) {
  const a = inboxAccent(accent);
  const priorityConfig = useMemo(() => buildPriorityConfig(a), [a]);
  const cfg = (p) => priorityConfig[p] ?? priorityConfig.medium;

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
    <PageShell className={`text-gray-300 ${a.selection}`}>
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Bell}
          title="Inbox"
          subtitle={subtitle}
          accent={accent}
          meta={
            pinnedCount > 0 ? (
              <span className={`flex items-center gap-1.5 rounded-md ${a.pinnedBadge} px-2.5 py-1 text-xs font-semibold tracking-wide uppercase`}>
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
                  className={`w-44 rounded-lg border border-white/10 bg-white/5 py-1.5 pr-3 pl-8 text-xs text-white placeholder-gray-500 ${a.searchFocus} focus:outline-none`}
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
                              ? `${a.rowActive}`
                              : 'bg-white/1 hover:bg-white/3'
                          )}
                        >
                          <AnimatePresence>
                            {n.is_pinned && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className={`absolute top-1/2 left-4 h-2 w-2 -translate-y-1/2 rounded-full ${a.pinDot}`}
                              />
                            )}
                          </AnimatePresence>

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
                                  <span className={`inline-flex items-center gap-1 rounded ${a.tag} px-1.5 py-0.5 text-[10px] font-semibold`}>
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
                                ? `${a.tabActive}`
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
                    color: `${a.mediumColor} ${a.mediumBg}`,
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
