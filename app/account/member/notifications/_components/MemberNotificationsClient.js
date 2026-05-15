/**
 * @file Member Notifications Client — redesigned to match the
 *   problem-solving page aesthetic via shared `_ui` primitives.
 * @module MemberNotificationsClient
 */

'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  Bell,
  BellOff,
  Calendar,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Zap,
  BookOpen,
  MessageSquare,
  Settings,
  Check,
  Trash2,
  AtSign,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from '@/app/_lib/notification-actions';
import {
  PageHeader,
  GlassCard,
  TabBar,
  EmptyState,
  ActionButton,
  IconChip,
} from '../../_components/_ui';
import { motion, AnimatePresence } from 'framer-motion';

const ago = (h) => new Date(Date.now() - h * 3600000).toISOString();

const MOCK_NOTIFICATIONS = [
  { id: 'n1', notification_type: 'event', title: 'Web3 & Smart Contract Workshop starts in 2 hours', message: 'Reminder for your registered event on May 12 at 14:00 in CSE Seminar Hall.', created_at: ago(0.05), is_read: false },
  { id: 'n2', notification_type: 'mention', title: 'Sajid Hossain replied to your thread', message: '"How to debug Express middleware order?" — your reply was upvoted 12 times.', created_at: ago(0.2), is_read: false },
  { id: 'n3', notification_type: 'achievement', title: "You earned the 'Open-Source Contributor' badge", message: '5 PRs merged in NEUPC repos this month.', created_at: ago(3), is_read: false },
  { id: 'n4', notification_type: 'mention', title: 'Nusrat Jahan mentioned you', message: '"@you check this elegant DP transition for LIS!" in #algorithms.', created_at: ago(6), is_read: false },
  { id: 'n5', notification_type: 'system', title: 'Codeforces sync completed', message: '+12 new submissions imported. Rating updated to 1547.', created_at: ago(8), is_read: false },
  { id: 'n6', notification_type: 'event', title: "Inter-University Hackathon '26 registration opens tomorrow", message: 'Save your seat — limited to 312 participants across 78 teams.', created_at: ago(24), is_read: true },
  { id: 'n7', notification_type: 'lesson', title: 'New lesson available: JWT Authentication', message: 'In Full-Stack Web Development bootcamp · 22 min · by Tanvir Ahmed.', created_at: ago(36), is_read: true },
  { id: 'n8', notification_type: 'achievement', title: '30-day streak milestone reached!', message: "You've solved problems 30 days in a row. Keep it up!", created_at: ago(48), is_read: true },
  { id: 'n9', notification_type: 'system', title: 'Profile review approved', message: 'Your member profile changes are now live.', created_at: ago(72), is_read: true },
  { id: 'n10', notification_type: 'event', title: 'Reminder: NEUPC Monthly Contest #27', message: 'Starts May 24, 20:00 BDT on Codeforces — 2.5 hours, 6 problems.', created_at: ago(96), is_read: true },
];

const TYPE_CONFIG = {
  event:       { icon: Calendar,      accent: 'blue' },
  mention:     { icon: AtSign,        accent: 'violet' },
  achievement: { icon: Trophy,        accent: 'amber' },
  system:      { icon: Zap,           accent: 'cyan' },
  info:        { icon: AlertCircle,   accent: 'sky' },
  success:     { icon: CheckCircle2,  accent: 'emerald' },
  lesson:      { icon: BookOpen,      accent: 'pink' },
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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function tabFilter(notifs, id) {
  if (id === 'all') return notifs;
  if (id === 'unread') return notifs.filter((n) => !n.is_read);
  if (id === 'mentions') return notifs.filter((n) => n.notification_type === 'mention');
  if (id === 'events') return notifs.filter((n) => n.notification_type === 'event');
  if (id === 'system') return notifs.filter((n) => SYSTEM_TYPES.includes(n.notification_type));
  return notifs;
}

export default function MemberNotificationsClient({
  notifications: serverNotifs = [],
  unreadCount: _initialUnread = 0,
}) {
  const useMock = serverNotifs.length === 0;
  const [notifs, setNotifs] = useState(useMock ? MOCK_NOTIFICATIONS : serverNotifs);
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifs.filter((n) => !n.is_read).length;
  const filtered = useMemo(() => tabFilter(notifs, tab), [notifs, tab]);

  const ITEMS_PER_PAGE = 7;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedNotifs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setCurrentPage(1);
  };

  const tabs = [
    { value: 'all', label: 'All', icon: Inbox, count: notifs.length },
    { value: 'unread', label: 'Unread', icon: Bell, count: unreadCount },
    { value: 'mentions', label: 'Mentions', icon: AtSign, count: tabFilter(notifs, 'mentions').length },
    { value: 'events', label: 'Events', icon: Calendar, count: tabFilter(notifs, 'events').length },
    { value: 'system', label: 'System', icon: Zap, count: tabFilter(notifs, 'system').length },
  ];

  const markRead = (id) => {
    startTransition(async () => {
      if (!useMock) await markAsReadAction(id).catch(() => {});
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    });
  };

  const markAllRead = () => {
    startTransition(async () => {
      if (!useMock) await markAllAsReadAction().catch(() => {});
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    });
  };

  const del = (id) => {
    startTransition(async () => {
      if (!useMock) await deleteNotificationAction(id).catch(() => {});
      setNotifs((prev) => {
        const remaining = prev.filter((n) => n.id !== id);
        const newFiltered = tabFilter(remaining, tab);
        if (currentPage > 1 && newFiltered.length <= (currentPage - 1) * ITEMS_PER_PAGE) {
          setCurrentPage(currentPage - 1);
        }
        return remaining;
      });
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Bell}
        title="Inbox"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread · ${notifs.length} total`
            : 'All caught up'
        }
        accent="rose"
        actions={
          <>
            {unreadCount > 0 && (
              <ActionButton
                tone="ghost"
                icon={Check}
                onClick={markAllRead}
                disabled={isPending}
              >
                Mark all read
              </ActionButton>
            )}
            <ActionButton tone="ghost" icon={Settings}>
              Preferences
            </ActionButton>
          </>
        }
      />

      <TabBar tabs={tabs} value={tab} onChange={handleTabChange} />

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <GlassCard padding="p-0">
              <EmptyState
                icon={BellOff}
                title={tab === 'unread' ? "You're all caught up!" : "No notifications here"}
                description={
                  tab === 'unread'
                    ? "You've read all your notifications."
                    : 'New notifications will show up here.'
                }
                accent="rose"
                action={
                  tab !== 'all' && (
                    <ActionButton tone="ghost" onClick={() => handleTabChange('all')}>
                      View all notifications
                    </ActionButton>
                  )
                }
              />
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <GlassCard padding="p-0">
              <AnimatePresence initial={false}>
                {paginatedNotifs.map((n, i) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, delay: i * 0.02 }}
                onClick={() => { if (!n.is_read) markRead(n.id); }}
                tabIndex={!n.is_read ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!n.is_read && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    markRead(n.id);
                  }
                }}
                className={`group relative flex items-start gap-4 border-b border-white/[0.04] p-4 transition-colors last:border-0 hover:bg-white/[0.03] ${
                  !n.is_read ? 'bg-violet-500/[0.03] cursor-pointer focus:outline-none focus:bg-white/[0.05]' : ''
                }`}
              >
                <div className="relative shrink-0">
                  {!n.is_read && (
                    <span className="absolute -left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(124,131,255,0.8)]" />
                  )}
                  <IconChip
                    icon={cfg(n.notification_type).icon}
                    accent={cfg(n.notification_type).accent}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={`text-sm leading-snug ${
                        n.is_read
                          ? 'font-medium text-gray-300'
                          : 'font-semibold text-white'
                      }`}
                    >
                      {n.title}
                    </p>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-gray-400">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.message && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-400/90 leading-relaxed">
                      {n.message}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2 opacity-100 sm:opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        disabled={isPending}
                        aria-label="Mark as read"
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-gray-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" /> Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); del(n.id); }}
                      disabled={isPending}
                      aria-label="Delete notification"
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-gray-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/[0.04] p-4">
              <span className="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
                Showing <span className="text-gray-300">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-gray-300">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of <span className="text-gray-300">{filtered.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
