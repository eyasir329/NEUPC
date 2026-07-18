/**
 * @file Guest notifications client component
 * @module GuestNotificationsClient
 */

'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  Paperclip,
  Check,
  CheckCheck,
  Pin,
  Trophy,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { markNoticesReadAction } from '@/app/_lib/actions/guest-actions';
import {
  PageShell,
  TabBar,
  PageHeader,
  GlassCard,
  ActionButton,
  Pill,
} from '@/app/account/_components/ui';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const TYPE_CONFIG = {
  general: { icon: Info, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  urgent: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  event: { icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  deadline: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  achievement: { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const cfg = (t) => TYPE_CONFIG[t] ?? TYPE_CONFIG.general;

/** Windowed page list: 1 … (c-1) c (c+1) … N, capped so it never overflows. */
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('…');
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  )
    pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

function tabFilter(notices, id, readIds) {
  if (id === 'all') return notices;
  if (id === 'unread') return notices.filter((n) => !readIds.has(n.id));
  if (id === 'pinned') return notices.filter((n) => n.is_pinned);
  if (id === 'critical')
    return notices.filter((n) => n.priority === 'critical');
  return notices;
}

export default function GuestNotificationsClient({
  notices = [],
  initialReadIds = [],
}) {
  const displayNotices = notices;
  const [readIds, setReadIds] = useState(() => new Set(initialReadIds));
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const prevTabRef = useRef(tab);

  const isRead = (id) => readIds.has(id);
  const unreadCount = displayNotices.filter((n) => !readIds.has(n.id)).length;

  function markRead(id) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    markNoticesReadAction([id]);
  }

  function markAllRead() {
    const unreadIds = displayNotices
      .map((n) => n.id)
      .filter((id) => !readIds.has(id));
    if (!unreadIds.length) return;
    setReadIds((prev) => new Set([...prev, ...unreadIds]));
    markNoticesReadAction(unreadIds);
  }

  const handleTabChange = (newTab) => {
    prevTabRef.current = tab;
    setTab(newTab);
    setCurrentPage(1);
  };

  const filtered = useMemo(
    () => tabFilter(displayNotices, tab, readIds),
    [displayNotices, tab, readIds]
  );

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedNotices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const tabs = [
    { value: 'all', label: 'All', icon: Inbox, count: displayNotices.length },
    { value: 'unread', label: 'Unread', icon: Bell, count: unreadCount },
    {
      value: 'pinned',
      label: 'Pinned',
      icon: Pin,
      count: displayNotices.filter((n) => n.is_pinned).length,
    },
    {
      value: 'critical',
      label: 'Critical',
      icon: AlertTriangle,
      count: displayNotices.filter((n) => n.priority === 'critical').length,
    },
  ].filter((t) => t.value === 'all' || t.count > 0);

  return (
    <PageShell className="space-y-6 text-zinc-300 selection:bg-violet-500/30">
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Bell}
          title="Inbox"
          subtitle="Stay updated with the latest club announcements and notices."
          accent="violet"
          meta={
            unreadCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-bold tracking-wide text-violet-400 uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                {unreadCount} Unread
              </span>
            ) : null
          }
        />

        <TabBar tabs={tabs} value={tab} onChange={handleTabChange} />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_280px]">
          {/* Notifications List */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/5 pb-2">
              <p className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                {filtered.length === 0
                  ? 'No notifications found'
                  : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} notices`}
              </p>
              <div className="flex items-center gap-2 lg:hidden">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-extrabold tracking-wide text-zinc-400 uppercase transition-colors hover:text-violet-400"
                  >
                    <CheckCheck className="h-4.5 w-4.5" /> Mark all read
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
                  className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 bg-zinc-950/20 p-12 text-center"
                >
                  <BellOff size={48} className="mb-4 text-zinc-700" />
                  <h3 className="mb-1 text-base font-bold text-zinc-300">
                    {tab === 'unread'
                      ? "You're all caught up!"
                      : 'No notifications here'}
                  </h3>
                  <p className="mb-6 max-w-sm text-xs leading-relaxed font-semibold text-zinc-500">
                    {tab === 'unread'
                      ? 'You have read all announcements.'
                      : 'New notices will appear here.'}
                  </p>
                  {tab !== 'all' && (
                    <button
                      onClick={() => handleTabChange('all')}
                      className="rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2 text-xs font-bold text-zinc-300 shadow-md transition-all hover:bg-zinc-800 active:scale-95"
                    >
                      View All Notices
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
                  className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-xl"
                >
                  <div className="divide-y divide-white/5">
                    {paginatedNotices.map((notice) => {
                      const config = cfg(notice.notice_type);
                      const Icon = config.icon;
                      const read = isRead(notice.id);
                      return (
                        <motion.div
                          key={notice.id}
                          exit={{
                            opacity: 0,
                            height: 0,
                            paddingTop: 0,
                            paddingBottom: 0,
                          }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                          onClick={() => {
                            if (!read) markRead(notice.id);
                          }}
                          className={cn(
                            'group relative flex items-start gap-4 px-6 py-5 transition-colors duration-200 last:border-b-0',
                            read
                              ? 'bg-zinc-900/30 hover:bg-white/[0.01]'
                              : 'cursor-pointer bg-violet-500/[0.02] hover:bg-violet-500/[0.04]'
                          )}
                        >
                          <AnimatePresence>
                            {!read && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="absolute top-1/2 left-4 h-2 w-2 -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.7)]"
                              />
                            )}
                          </AnimatePresence>

                          <div
                            className={cn(
                              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 shadow-inner transition-all',
                              !read ? 'ml-2' : '',
                              config.bg,
                              config.color
                            )}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </div>

                          <div className="min-w-0 flex-1 pr-4">
                            <div className="mb-1.5 flex items-start justify-between gap-3">
                              <p
                                className={cn(
                                  'truncate text-sm leading-snug transition-colors duration-300',
                                  read
                                    ? 'font-bold text-zinc-400'
                                    : 'font-extrabold text-zinc-100 group-hover:text-violet-400'
                                )}
                              >
                                {notice.title}
                              </p>
                              <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold text-zinc-500">
                                {timeAgo(notice.created_at)}
                              </span>
                            </div>
                            {notice.content && (
                              <p
                                className={cn(
                                  'line-clamp-2 text-xs leading-relaxed font-semibold transition-colors duration-300',
                                  read ? 'text-zinc-600' : 'text-zinc-400'
                                )}
                              >
                                {notice.content}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-bold text-zinc-500">
                              {notice.is_pinned && (
                                <span className="flex items-center gap-1 text-violet-400">
                                  <Pin className="h-3.5 w-3.5 rotate-45 transform" />{' '}
                                  Pinned
                                </span>
                              )}
                              {notice.users?.full_name && (
                                <span>By {notice.users.full_name}</span>
                              )}
                              {notice.attachments?.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Paperclip className="h-3 w-3" />{' '}
                                  {notice.attachments.length} Attachments
                                </span>
                              )}
                            </div>
                          </div>

                          {!read && (
                            <div className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-1 opacity-100 transition-all lg:opacity-0 lg:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markRead(notice.id);
                                }}
                                title="Mark as read"
                                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-400 shadow-md transition-all hover:bg-emerald-500/20 active:scale-90"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-white/5 p-4">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 rounded-xl border border-white/5 bg-zinc-950/40 px-3 py-1.5 text-[11px] font-bold text-zinc-400 transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Prev
                      </button>
                      <div className="hidden items-center gap-1 sm:flex">
                        {pageWindow(currentPage, totalPages).map((p, i) =>
                          p === '…' ? (
                            <span
                              key={`gap-${i}`}
                              className="px-1 text-xs font-black text-zinc-600"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => setCurrentPage(p)}
                              aria-label={`Page ${p}`}
                              aria-current={
                                currentPage === p ? 'page' : undefined
                              }
                              className={cn(
                                'h-8 w-8 rounded-lg text-xs font-black transition-all',
                                currentPage === p
                                  ? 'border border-violet-500/30 bg-violet-500/20 text-violet-300'
                                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                              )}
                            >
                              {p}
                            </button>
                          )
                        )}
                      </div>
                      <span className="text-xs font-bold text-zinc-500 tabular-nums sm:hidden">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 rounded-xl border border-white/5 bg-zinc-950/40 px-3 py-1.5 text-[11px] font-bold text-zinc-400 transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar Widgets */}
          <div className="sticky top-20 hidden flex-col gap-6 lg:flex">
            {/* Quick Actions Widget */}
            <GlassCard className="border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
              <h3 className="mb-4 text-xs font-black tracking-wider text-zinc-400 uppercase">
                Quick Actions
              </h3>
              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-md transition-all',
                  unreadCount > 0
                    ? 'border border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 active:scale-95'
                    : 'cursor-not-allowed border border-white/5 bg-zinc-950/20 text-zinc-600'
                )}
              >
                <CheckCheck className="h-4 w-4" /> Mark All as Read
              </button>
            </GlassCard>

            {/* Inbox Overview Widget */}
            <GlassCard className="border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
              <h3 className="mb-4 text-xs font-black tracking-wider text-zinc-400 uppercase">
                Inbox Overview
              </h3>
              <div className="flex flex-col gap-4 text-xs font-bold text-zinc-400">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-500">Unread</span>
                  <span className="rounded-md border border-violet-500/10 bg-violet-500/15 px-2 py-0.5 font-extrabold text-violet-400 tabular-nums">
                    {unreadCount}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="font-semibold text-zinc-500">Total</span>
                  <span className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 font-extrabold text-white tabular-nums">
                    {displayNotices.length}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="font-semibold text-zinc-500">Pinned</span>
                  <span className="rounded-md border border-violet-500/10 bg-violet-500/15 px-2 py-0.5 font-extrabold text-violet-400 tabular-nums">
                    {displayNotices.filter((n) => n.is_pinned).length}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Premium Upgrade callout */}
            <GlassCard className="relative overflow-hidden border border-violet-500/20 bg-linear-to-br from-zinc-950 via-zinc-900/60 to-violet-950/20 p-5 shadow-xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
              </div>
              <div className="mb-2.5 flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 shrink-0 text-violet-400" />
                <p className="text-xs font-bold tracking-wide text-white uppercase">
                  Premium Alerts
                </p>
              </div>
              <p className="mb-4 text-xs leading-relaxed font-semibold text-zinc-400">
                Full club members receive instant Telegram logs, direct bootcamp
                updates, and exam reminders.
              </p>
              <ActionButton
                href="/account/guest/membership-application"
                tone="indigo"
                className="w-full justify-center py-2"
              >
                Apply for Membership
              </ActionButton>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
