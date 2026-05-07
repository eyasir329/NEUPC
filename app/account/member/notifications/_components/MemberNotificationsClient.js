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
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
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
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifs.filter((n) => !n.is_read).length;
  const filtered = useMemo(() => tabFilter(notifs, tab), [notifs, tab]);

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
      setNotifs((prev) => prev.filter((n) => n.id !== id));
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

      <TabBar tabs={tabs} value={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <GlassCard padding="p-0">
          <EmptyState
            icon={BellOff}
            title="No notifications here"
            description={
              tab === 'unread'
                ? "You're all caught up — nothing unread."
                : 'New notifications will show up here.'
            }
            accent="rose"
          />
        </GlassCard>
      ) : (
        <GlassCard padding="p-0">
          <AnimatePresence initial={false}>
            {filtered.map((n, i) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18, delay: i * 0.02 }}
                className={`group relative flex items-start gap-3 border-b border-white/[0.04] px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.025] ${
                  !n.is_read ? 'bg-violet-500/[0.025]' : ''
                }`}
              >
                {!n.is_read && (
                  <span className="absolute top-1/2 left-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(124,131,255,0.7)]" />
                )}

                <IconChip
                  icon={cfg(n.notification_type).icon}
                  accent={cfg(n.notification_type).accent}
                  size="sm"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={`text-[13px] leading-snug ${
                        n.is_read
                          ? 'font-medium text-gray-300'
                          : 'font-semibold text-white'
                      }`}
                    >
                      {n.title}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-gray-500">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.message && (
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] text-gray-500">
                      {n.message}
                    </p>
                  )}

                  <div className="mt-1.5 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-gray-300 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-50"
                      >
                        <Check className="h-2.5 w-2.5" /> Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => del(n.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-gray-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-2.5 w-2.5" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </GlassCard>
      )}
    </div>
  );
}
