'use client';

import { useState, useEffect, useMemo, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, Calendar, AlertTriangle, Info, Clock,
  Paperclip, Check, CheckCheck, Pin, Trophy, Inbox,
  AtSign, Zap, ChevronLeft, ChevronRight, ExternalLink,
  X, Lock,
} from 'lucide-react';
import { PageShell, TabBar, PageHeader, GlassCard, ActionButton } from '../../_components/_ui';

const READ_KEY = 'neupc_guest_read_notices';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hrs ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPE_CONFIG = {
  general:     { icon: Info,          color: 'text-sky-400',     bg: 'bg-sky-500/10' },
  urgent:      { icon: AlertTriangle, color: 'text-rose-400',    bg: 'bg-rose-500/10' },
  event:       { icon: Calendar,      color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  deadline:    { icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  achievement: { icon: Trophy,        color: 'text-amber-400',   bg: 'bg-amber-500/10' },
};

const cfg = (t) => TYPE_CONFIG[t] ?? TYPE_CONFIG.general;

function tabFilter(notices, id, readIds, mounted) {
  if (id === 'all') return notices;
  if (id === 'unread') return notices.filter((n) => !mounted || !readIds.has(n.id));
  if (id === 'pinned') return notices.filter((n) => n.is_pinned);
  if (id === 'critical') return notices.filter((n) => n.priority === 'critical');
  return notices;
}

const FALLBACK_NOTICES = [
  {
    id: 'fn1', notice_type: 'event', is_pinned: true, priority: null,
    title: 'Registration open: Web Dev Workshop',
    content: 'Registration is now open until Feb 21. Limited to 40 participants. Visit the Events page to secure your spot.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    users: { full_name: 'NEUPC Team' },
  },
  {
    id: 'fn2', notice_type: 'general', is_pinned: false, priority: null,
    title: 'New resource added: DP Cheatsheet',
    content: 'A comprehensive dynamic programming reference sheet is now available in the Resources section. Covers knapsack, LCS, interval DP and more.',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    users: { full_name: 'Resource Team' },
  },
  {
    id: 'fn3', notice_type: 'deadline', is_pinned: false, priority: null,
    title: 'NEUPC Monthly Contest #27 starts in 3 days',
    content: 'Starts May 24, 20:00 BDT on Codeforces — 2.5 hours, 6 problems. Make sure to register before the deadline.',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    users: { full_name: 'Contest Committee' },
  },
  {
    id: 'fn4', notice_type: 'urgent', is_pinned: false, priority: 'critical',
    title: 'Room change: Advanced Algorithms Bootcamp',
    content: 'The bootcamp venue has changed from CSE Lab-A to Lab-C (3rd floor). Please update your plans accordingly.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    users: { full_name: 'Events Coordinator' },
  },
  {
    id: 'fn5', notice_type: 'general', is_pinned: false, priority: null,
    title: 'Welcome to NEUPC!',
    content: 'Thank you for joining NEUPC as a guest. Explore our events and resources, and consider applying for full membership to unlock all features.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    users: { full_name: 'NEUPC Admin' },
  },
];

export default function GuestNotificationsClient({ notices = [] }) {
  const displayNotices = notices.length > 0 ? notices : FALLBACK_NOTICES;
  const [readIds, setReadIds] = useState(new Set());
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [, startTransition] = useTransition();
  const prevTabRef = useRef(tab);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      if (raw) setReadIds(new Set(JSON.parse(raw)));
    } catch {}
    setMounted(true);
  }, []);

  const isRead = (id) => !mounted || readIds.has(id);
  const unreadCount = mounted ? displayNotices.filter((n) => !readIds.has(n.id)).length : 0;

  function markRead(id) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(READ_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function markAllRead() {
    const next = new Set([...readIds, ...displayNotices.map((n) => n.id)]);
    setReadIds(next);
    try { localStorage.setItem(READ_KEY, JSON.stringify([...next])); } catch {}
  }

  const handleTabChange = (newTab) => {
    prevTabRef.current = tab;
    setTab(newTab);
    setCurrentPage(1);
  };

  const filtered = useMemo(
    () => tabFilter(displayNotices, tab, readIds, mounted),
    [displayNotices, tab, readIds, mounted]
  );

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedNotices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const tabs = [
    { value: 'all',      label: 'All',      icon: Inbox,    count: displayNotices.length },
    { value: 'unread',   label: 'Unread',   icon: Bell,     count: unreadCount },
    { value: 'pinned',   label: 'Pinned',   icon: Pin,      count: displayNotices.filter((n) => n.is_pinned).length },
    { value: 'critical', label: 'Critical', icon: AlertTriangle, count: displayNotices.filter((n) => n.priority === 'critical').length },
  ].filter((t) => t.value === 'all' || t.count > 0);

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Bell}
          title="Inbox"
          subtitle="Stay updated with the latest club announcements and notices."
          accent="rose"
          meta={unreadCount > 0 ? (
            <span className="flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              {unreadCount} Unread
            </span>
          ) : null}
        />

        <TabBar tabs={tabs} value={tab} onChange={handleTabChange} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Notifications List */}
          <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 pb-3 border-b border-white/6">
              <p className="text-xs text-gray-500 font-medium">
                {filtered.length === 0
                  ? 'No notifications found'
                  : `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <div className="lg:hidden flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-gray-400 hover:text-rose-400 transition-colors px-2 py-1 flex items-center gap-1.5"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
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
                  <h3 className="text-lg font-medium text-gray-300 mb-1">
                    {tab === 'unread' ? "You're all caught up!" : 'No notifications here'}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-6">
                    {tab === 'unread'
                      ? "You've read all your notifications."
                      : 'New notices will appear here.'}
                  </p>
                  {tab !== 'all' && (
                    <button
                      onClick={() => handleTabChange('all')}
                      className="px-5 py-2.5 bg-white/4 hover:bg-white/8 border border-white/8 rounded-xl text-sm font-semibold text-gray-300 transition-colors shadow-sm active:scale-95"
                    >
                      View all notifications
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
                  {paginatedNotices.map((notice) => {
                    const config = cfg(notice.notice_type);
                    const Icon = config.icon;
                    const read = isRead(notice.id);
                    return (
                      <motion.div
                        key={notice.id}
                        exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                        onClick={() => { if (!read) markRead(notice.id); }}
                        className={cn(
                          'group relative flex items-start gap-4 p-4 border-b border-white/4 last:border-b-0 transition-colors duration-200',
                          read
                            ? 'bg-white/1 hover:bg-white/3'
                            : 'bg-rose-500/4 hover:bg-rose-500/[0.07] cursor-pointer'
                        )}
                      >
                        <AnimatePresence>
                          {!read && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="absolute top-1/2 left-4 w-2 h-2 -translate-y-1/2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                            />
                          )}
                        </AnimatePresence>

                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-0.5 transition-[margin] duration-200',
                          !read ? 'ml-4' : '',
                          config.bg, config.color, 'border-white/5'
                        )}>
                          <Icon size={18} />
                        </div>

                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <p className={cn(
                              'text-sm leading-snug truncate transition-colors duration-300',
                              read ? 'font-medium text-gray-400' : 'font-semibold text-gray-100'
                            )}>
                              {notice.title}
                            </p>
                            <span className="shrink-0 font-mono text-[11px] font-medium text-gray-500">
                              {timeAgo(notice.created_at)}
                            </span>
                          </div>
                          {notice.content && (
                            <p className={cn(
                              'text-[13px] leading-relaxed line-clamp-2 transition-colors duration-300',
                              read ? 'text-gray-600' : 'text-gray-400'
                            )}>
                              {notice.content}
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
                            {notice.is_pinned && <span className="flex items-center gap-1"><Pin className="h-3 w-3" /> Pinned</span>}
                            {notice.users?.full_name && <span>By {notice.users.full_name}</span>}
                            {notice.attachments?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Paperclip className="h-3 w-3" /> {notice.attachments.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {!read && (
                          <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-150 bg-gray-950/90 lg:bg-transparent p-1 lg:p-0 rounded-lg backdrop-blur-sm lg:backdrop-blur-none">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); markRead(notice.id); }}
                              title="Mark as read"
                              className="p-1.5 rounded-md hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors"
                            >
                              <Check size={15} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

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
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
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

          {/* Right Sidebar */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-14">
            {/* Quick Actions */}
            <GlassCard>
              <h3 className="text-sm font-bold text-gray-200 mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className={cn(
                    'w-full flex items-center gap-2 justify-center py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm',
                    unreadCount > 0
                      ? 'bg-white text-gray-900 hover:bg-gray-200 active:scale-95'
                      : 'bg-white/3 text-gray-500 border border-white/5 cursor-not-allowed'
                  )}
                >
                  <CheckCheck size={16} /> Mark All as Read
                </button>
              </div>
            </GlassCard>

            {/* Inbox Overview */}
            <GlassCard>
              <h3 className="text-sm font-bold text-gray-200 mb-4">Inbox Overview</h3>
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Unread</span>
                  <span className="text-rose-400 font-semibold tabular-nums bg-rose-500/10 px-2 py-0.5 rounded-md">{unreadCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Total</span>
                  <span className="text-white font-semibold tabular-nums bg-white/6 px-2 py-0.5 rounded-md">{displayNotices.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Pinned</span>
                  <span className="text-white font-semibold tabular-nums bg-white/6 px-2 py-0.5 rounded-md">{displayNotices.filter((n) => n.is_pinned).length}</span>
                </div>
              </div>
            </GlassCard>

            {/* Upgrade CTA */}
            <GlassCard className="border-violet-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-violet-950/30">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-violet-400" />
                <p className="text-[13px] font-semibold text-white">Want smarter alerts?</p>
              </div>
              <p className="mb-3 text-[12px] text-gray-400">Members get role-targeted notifications, contest reminders &amp; leaderboard alerts.</p>
              <ActionButton
                href="/account/guest/membership-application"
                tone="indigo"
                className="w-full justify-center"
              >
                Apply for membership
              </ActionButton>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
