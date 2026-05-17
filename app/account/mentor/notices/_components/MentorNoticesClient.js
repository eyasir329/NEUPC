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
import { PageShell, TabBar, PageHeader } from '@/app/account/mentor/_components/_ui';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString();
const inDays  = (d) => new Date(Date.now() + d * 86_400_000).toISOString();

const MOCK_NOTICES = [
  {
    id: 'n1', title: 'NEUPC Mentorship Program — May Session Guidelines', is_pinned: true, priority: 'high', notice_type: 'announcement',
    content: 'All mentors are required to log a minimum of 2 sessions per week during May. Please ensure session notes are filled in within 24 hours. The mentorship committee will review logs on June 1.\n\nMentors who do not meet the minimum will receive a warning and may be placed on probation. Contact the admin panel if you have any conflicts.',
    created_at: daysAgo(2), expires_at: inDays(28), target_audience: ['mentor', 'all'],
  },
  {
    id: 'n2', title: 'Critical: Platform Maintenance on May 20 — 2 AM to 6 AM BDT', is_pinned: true, priority: 'critical', notice_type: 'alert',
    content: 'The NEUPC platform (including the mentor dashboard, session logging, and task submission) will be down for scheduled maintenance on May 20 from 2:00 AM to 6:00 AM BDT.\n\nPlease log any pending sessions and tasks before 1:30 AM. Students will be notified separately. No data loss expected.',
    created_at: daysAgo(1), expires_at: inDays(3), target_audience: ['all'],
  },
  {
    id: 'n3', title: 'New Feature: In-App Session Video Calling (Beta)', is_pinned: false, priority: 'medium', notice_type: 'announcement',
    content: 'We have launched a beta version of in-app video calling for mentorship sessions. You can now start a session directly from the Sessions page without leaving the platform.\n\nThis feature is available to all mentors. Please report any issues via the Help Desk. We plan to move out of beta by June 15.',
    created_at: daysAgo(4), expires_at: null, target_audience: ['mentor'],
  },
  {
    id: 'n4', title: 'Reminder: Submit Monthly Mentee Progress Reports by May 31', is_pinned: false, priority: 'high', notice_type: 'reminder',
    content: 'The deadline for submitting May progress reports for all active mentees is May 31, 11:59 PM. Reports should cover:\n• Problems solved this month\n• Contests participated in\n• Key milestones reached\n• Areas needing improvement\n\nSubmit via the Recommendations page. Late submissions will not be accepted.',
    created_at: daysAgo(5), expires_at: inDays(13), target_audience: ['mentor'],
  },
  {
    id: 'n5', title: 'Mentor Training Webinar — Advanced Coaching Techniques', is_pinned: false, priority: 'medium', notice_type: 'event',
    content: 'NEUPC is hosting a mentor training webinar on May 25 at 7:00 PM BDT covering advanced coaching techniques, how to handle struggling mentees, and goal-setting frameworks. Attendance is optional but strongly encouraged for mentors in their first year.',
    created_at: daysAgo(6), expires_at: inDays(7), target_audience: ['mentor'],
  },
  {
    id: 'n6', title: 'Updated Code of Conduct for Mentorship Interactions', is_pinned: false, priority: 'low', notice_type: 'general',
    content: 'The NEUPC mentorship code of conduct has been updated. Key changes include clearer guidelines on session cancellations (48-hour notice required), communication expectations, and conflict resolution procedures. Please review the full document in the resources section.',
    created_at: daysAgo(10), expires_at: null, target_audience: ['mentor', 'all'],
  },
  {
    id: 'n7', title: 'Leaderboard Reset — New Month Starting June 1', is_pinned: false, priority: 'low', notice_type: 'general',
    content: 'The mentor leaderboard (ranked by sessions completed and mentee satisfaction ratings) will reset on June 1. Top 3 mentors of May will receive recognition certificates and featured placement on the public NEUPC website.',
    created_at: daysAgo(14), expires_at: inDays(14), target_audience: ['mentor'],
  },
];

const PRIORITY_CONFIG = {
  critical: { icon: AlertCircle,   color: 'text-rose-400',    bg: 'bg-rose-500/10',    dot: 'bg-rose-500',    glow: 'rgba(244,63,94,0.6)',    badge: 'border-rose-500/20 bg-rose-500/10 text-rose-400' },
  high:     { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/10',   dot: 'bg-amber-500',   glow: 'rgba(245,158,11,0.6)',   badge: 'border-amber-500/20 bg-amber-500/10 text-amber-400' },
  medium:   { icon: Info,          color: 'text-blue-400',    bg: 'bg-blue-500/10',    dot: 'bg-blue-500',    glow: 'rgba(59,130,246,0.6)',   badge: 'border-blue-500/20 bg-blue-500/10 text-blue-400' },
  low:      { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', glow: 'rgba(16,185,129,0.6)',   badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' },
};

const cfg = (p) => PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG.medium;

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hrs ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function tabFilter(notices, id) {
  if (id === 'all') return notices;
  if (id === 'pinned') return notices.filter((n) => n.is_pinned);
  if (id === 'critical') return notices.filter((n) => n.priority === 'critical' || n.priority === 'high');
  if (id === 'announcements') return notices.filter((n) => n.notice_type === 'announcement' || n.notice_type === 'alert');
  if (id === 'general') return notices.filter((n) => n.notice_type === 'general' || n.notice_type === 'reminder' || n.notice_type === 'event');
  return notices;
}

export default function MentorNoticesClient({ notices: rawNotices = [] }) {
  const notices = rawNotices.length === 0 ? MOCK_NOTICES : rawNotices;

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const pinnedCount = notices.filter((n) => n.is_pinned).length;
  const criticalCount = notices.filter((n) => n.priority === 'critical' || n.priority === 'high').length;

  const filtered = useMemo(() => {
    const byTab = tabFilter(notices, tab);
    if (!search) return byTab;
    const q = search.toLowerCase();
    return byTab.filter((n) => n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q));
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
    { value: 'all',           label: 'All',          icon: Inbox,         count: notices.length },
    { value: 'pinned',        label: 'Pinned',        icon: Pin,           count: pinnedCount },
    { value: 'critical',      label: 'High Priority', icon: AlertTriangle, count: criticalCount },
    { value: 'announcements', label: 'Announcements', icon: Bell,          count: tabFilter(notices, 'announcements').length },
    { value: 'general',       label: 'General',       icon: Info,          count: tabFilter(notices, 'general').length },
  ];

  return (
    <PageShell className="text-gray-300 selection:bg-amber-500/30">
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Bell}
          title="Notices"
          subtitle="Announcements and updates for mentors."
          accent="amber"
          meta={pinnedCount > 0 ? (
            <span className="flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase text-amber-400">
              <Pin size={11} />
              {pinnedCount} Pinned
            </span>
          ) : null}
        />

        <TabBar tabs={tabs} value={tab} onChange={handleTabChange} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Notices list */}
          <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
            {/* Search + count row */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 pb-3 border-b border-white/6">
              <p className="text-xs text-gray-500 font-medium">
                {filtered.length === 0
                  ? 'No notices found'
                  : `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} notice${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-44 rounded-lg border border-white/10 bg-white/5 py-1.5 pr-3 pl-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/40"
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
                  className="flex flex-col items-center justify-center p-12 bg-white/2 border border-white/8 border-dashed rounded-2xl text-center"
                >
                  <BellOff size={48} className="text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-1">No notices here</h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-6">
                    {search ? 'No results match your search.' : 'New notices will show up here.'}
                  </p>
                  {(tab !== 'all' || search) && (
                    <button
                      onClick={() => { handleTabChange('all'); setSearch(''); }}
                      className="px-5 py-2.5 bg-white/4 hover:bg-white/8 border border-white/8 rounded-xl text-sm font-semibold text-gray-300 transition-colors shadow-sm active:scale-95"
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
                  className="flex flex-col rounded-2xl border border-white/6 overflow-hidden shadow-sm"
                >
                  <AnimatePresence initial={false}>
                    {paginated.map((n) => {
                      const config = cfg(n.priority);
                      const Icon = config.icon;
                      const isExpanded = expanded === n.id;
                      return (
                        <motion.div
                          key={n.id}
                          exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                          className={cn(
                            'group relative flex flex-col border-b border-white/4 last:border-b-0 transition-colors duration-200',
                            n.is_pinned
                              ? 'bg-amber-500/3 hover:bg-amber-500/6'
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
                                className="absolute top-1/2 left-4 w-2 h-2 -translate-y-1/2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                              />
                            )}
                          </AnimatePresence>

                          {/* Header row — click to expand */}
                          <div
                            className={cn('flex items-start gap-4 p-4 cursor-pointer', n.is_pinned ? 'pl-8' : '')}
                            onClick={() => setExpanded(isExpanded ? null : n.id)}
                          >
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-0.5',
                              config.bg, config.color, 'border-white/5'
                            )}>
                              <Icon size={18} />
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <p className="text-sm font-semibold text-gray-100 leading-snug truncate">
                                  {n.title}
                                </p>
                                <span className="shrink-0 font-mono text-[11px] font-medium text-gray-500">
                                  {timeAgo(n.created_at)}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border capitalize', config.badge)}>
                                  {n.priority}
                                </span>
                                {n.is_pinned && (
                                  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                    <Pin size={9} /> Pinned
                                  </span>
                                )}
                                {n.notice_type && (
                                  <span className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold border border-white/10 bg-white/5 text-gray-400 capitalize">
                                    {n.notice_type}
                                  </span>
                                )}
                                {n.expires_at && (
                                  <span className="text-[10px] text-gray-500">
                                    Expires {new Date(n.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              {!isExpanded && (
                                <p className="text-[13px] text-gray-500 line-clamp-1 leading-relaxed">
                                  {n.content}
                                </p>
                              )}
                            </div>

                            <div className="absolute top-4 right-4 text-gray-500">
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </div>
                          </div>

                          {/* Expanded body */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div className={cn('border-t border-white/4 px-4 pt-3 pb-4', n.is_pinned ? 'pl-8' : 'pl-18')}>
                                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
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
                    <div className="flex items-center justify-between p-3 border-t border-white/6">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 border border-white/8 bg-white/2 hover:bg-white/5 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft size={14} /> Prev
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={cn(
                              'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                              currentPage === i + 1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/4'
                            )}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 border border-white/8 bg-white/2 hover:bg-white/5 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
          <div className="hidden lg:flex flex-col gap-6 sticky top-6">
            <div className="rounded-2xl border border-white/8 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
              <h3 className="text-sm font-bold text-gray-200 mb-4">Overview</h3>
              <div className="flex flex-col gap-4 text-sm">
                {[
                  { label: 'Total',        value: notices.length,                              color: 'text-white bg-white/[0.06]' },
                  { label: 'Pinned',       value: pinnedCount,                                 color: 'text-amber-400 bg-amber-500/10' },
                  { label: 'High Priority', value: criticalCount,                              color: 'text-rose-400 bg-rose-500/10' },
                  { label: 'Announcements', value: tabFilter(notices, 'announcements').length, color: 'text-violet-400 bg-violet-500/10' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">{label}</span>
                    <span className={cn('font-semibold tabular-nums px-2 py-0.5 rounded-md', color)}>{value}</span>
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
