/**
 * @file Member notifications client component
 * @module MemberNotificationsClient
 */

'use client';

import { useState, useMemo, useTransition, useRef } from 'react';
import {
  Bell,
  BellOff,
  Calendar,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Zap,
  BookOpen,
  Settings,
  Check,
  Trash2,
  AtSign,
  Inbox,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';
import {
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from '@/app/_lib/actions/notification-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell, TabBar, PageHeader } from '@/app/account/_components/ui';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const TYPE_CONFIG = {
  event: { icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  mention: { icon: AtSign, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  achievement: { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  system: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  info: { icon: AlertCircle, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  lesson: { icon: BookOpen, color: 'text-pink-400', bg: 'bg-pink-500/10' },
};

const cfg = (t) => TYPE_CONFIG[t] ?? TYPE_CONFIG.system;

const SYSTEM_TYPES = ['system', 'achievement', 'info', 'success', 'lesson'];

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

function tabFilter(notifs, id) {
  if (id === 'all') return notifs;
  if (id === 'unread') return notifs.filter((n) => !n.is_read);
  if (id === 'mentions')
    return notifs.filter((n) => n.notification_type === 'mention');
  if (id === 'events')
    return notifs.filter((n) => n.notification_type === 'event');
  if (id === 'system')
    return notifs.filter((n) => SYSTEM_TYPES.includes(n.notification_type));
  return notifs;
}

export default function MemberNotificationsClient({
  notifications: serverNotifs = [],
  unreadCount: _initialUnread = 0,
}) {
  const [notifs, setNotifs] = useState(serverNotifs);
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifs.filter((n) => !n.is_read).length;
  const filtered = useMemo(() => tabFilter(notifs, tab), [notifs, tab]);

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedNotifs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const prevTabRef = useRef(tab);
  const handleTabChange = (newTab) => {
    prevTabRef.current = tab;
    setTab(newTab);
    setCurrentPage(1);
  };

  const tabs = [
    { value: 'all', label: 'All', icon: Inbox, count: notifs.length },
    { value: 'unread', label: 'Unread', icon: Bell, count: unreadCount },
    {
      value: 'mentions',
      label: 'Mentions',
      icon: AtSign,
      count: tabFilter(notifs, 'mentions').length,
    },
    {
      value: 'events',
      label: 'Events',
      icon: Calendar,
      count: tabFilter(notifs, 'events').length,
    },
    {
      value: 'system',
      label: 'System',
      icon: Zap,
      count: tabFilter(notifs, 'system').length,
    },
  ];

  const markRead = (id) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    startTransition(() => markAsReadAction(id).catch(() => {}));
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    startTransition(() => markAllAsReadAction().catch(() => {}));
  };

  const del = (id) => {
    setNotifs((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      const newFiltered = tabFilter(remaining, tab);
      if (
        currentPage > 1 &&
        newFiltered.length <= (currentPage - 1) * ITEMS_PER_PAGE
      ) {
        setCurrentPage(currentPage - 1);
      }
      return remaining;
    });
    startTransition(() => deleteNotificationAction(id).catch(() => {}));
  };

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Bell}
          title="Inbox"
          subtitle="Stay updated with the latest activities and alerts."
          accent="rose"
          meta={
            unreadCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-rose-400 uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                {unreadCount} Unread
              </span>
            ) : null
          }
        />
        <TabBar tabs={tabs} value={tab} onChange={handleTabChange} />
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Center content (Notifications List) */}
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/[0.06] pb-3">
              <p className="text-xs font-medium text-gray-500">
                {filtered.length === 0
                  ? 'No notifications found'
                  : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
              </p>

              {/* Actions for small screens */}
              <div className="flex items-center gap-2 lg:hidden">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-gray-400 transition-colors hover:text-rose-400"
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
                  className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center"
                >
                  <BellOff size={48} className="mb-4 text-gray-700" />
                  <h3 className="mb-1 text-lg font-medium text-gray-300">
                    {tab === 'unread'
                      ? "You're all caught up!"
                      : 'No notifications here'}
                  </h3>
                  <p className="mb-6 max-w-sm text-sm text-gray-500">
                    {tab === 'unread'
                      ? "You've read all your notifications."
                      : 'New notifications will show up here.'}
                  </p>
                  {tab !== 'all' && (
                    <button
                      onClick={() => handleTabChange('all')}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-gray-300 shadow-sm transition-colors hover:bg-white/[0.08] active:scale-95"
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
                  className={`flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] shadow-sm ${isPending ? 'pointer-events-none' : ''}`}
                >
                  <AnimatePresence initial={false}>
                    {paginatedNotifs.map((n) => {
                      const config = cfg(n.notification_type);
                      const Icon = config.icon;
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
                          onClick={() => {
                            if (!n.is_read) markRead(n.id);
                          }}
                          className={cn(
                            'group relative flex items-start gap-4 border-b border-white/[0.04] p-4 transition-colors duration-200 last:border-b-0',
                            n.is_read
                              ? 'bg-white/[0.01] hover:bg-white/[0.03]'
                              : 'cursor-pointer bg-rose-500/[0.04] hover:bg-rose-500/[0.07]'
                          )}
                        >
                          <AnimatePresence>
                            {!n.is_read && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="absolute top-1/2 left-4 h-2 w-2 -translate-y-1/2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                              />
                            )}
                          </AnimatePresence>

                          <div
                            className={cn(
                              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-[margin] duration-200',
                              !n.is_read ? 'ml-4' : '',
                              config.bg,
                              config.color,
                              'border-white/5'
                            )}
                          >
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0 flex-1 pr-12">
                            <div className="mb-1 flex items-start justify-between gap-3">
                              <p
                                className={cn(
                                  'truncate text-sm leading-snug transition-colors duration-300',
                                  n.is_read
                                    ? 'font-medium text-gray-400'
                                    : 'font-semibold text-gray-100'
                                )}
                              >
                                {n.title}
                              </p>
                              <span className="shrink-0 font-mono text-[11px] font-medium text-gray-500">
                                {timeAgo(n.created_at)}
                              </span>
                            </div>
                            {n.message && (
                              <p
                                className={cn(
                                  'line-clamp-2 text-[13px] leading-relaxed transition-colors duration-300',
                                  n.is_read ? 'text-gray-600' : 'text-gray-400'
                                )}
                              >
                                {n.message}
                              </p>
                            )}
                          </div>

                          <div className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-gray-950/90 p-1 opacity-100 backdrop-blur-sm transition-opacity duration-150 lg:bg-transparent lg:p-0 lg:opacity-0 lg:backdrop-blur-none lg:group-hover:opacity-100">
                            {!n.is_read && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markRead(n.id);
                                }}
                                title="Mark as read"
                                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                              >
                                <Check size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                del(n.id);
                              }}
                              title="Delete"
                              className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-white/[0.06] p-3">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs font-semibold text-gray-400 transition-all hover:bg-white/[0.05] hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
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
                                ? 'border border-rose-500/30 bg-rose-500/20 text-rose-300'
                                : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
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
                        className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs font-semibold text-gray-400 transition-all hover:bg-white/[0.05] hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar - Fixed */}
          <div className="sticky top-6 hidden flex-col gap-6 lg:flex">
            {/* Actions Box */}
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
              <h3 className="mb-4 text-sm font-bold text-gray-200">
                Quick Actions
              </h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={markAllRead}
                  disabled={isPending || unreadCount === 0}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold shadow-sm transition-all',
                    unreadCount > 0
                      ? 'bg-white text-gray-900 hover:bg-gray-200 active:scale-95'
                      : 'cursor-not-allowed border border-white/[0.05] bg-white/[0.03] text-gray-500'
                  )}
                >
                  <CheckCheck size={16} /> Mark All as Read
                </button>

                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[13px] font-bold text-gray-300 transition-colors hover:bg-white/[0.06]">
                  <Settings size={16} /> Preferences
                </button>
              </div>
            </div>

            {/* Overview Box */}
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
              <h3 className="mb-4 text-sm font-bold text-gray-200">
                Inbox Overview
              </h3>
              <div className="flex flex-col gap-4 text-sm">
                <div className="group flex items-center justify-between">
                  <span className="font-medium text-gray-500">Unread</span>
                  <span className="rounded-md bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-400 tabular-nums">
                    {unreadCount}
                  </span>
                </div>
                <div className="group flex items-center justify-between">
                  <span className="font-medium text-gray-500">
                    Total Received
                  </span>
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-semibold text-white tabular-nums">
                    {notifs.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
