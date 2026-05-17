'use client';

import { useState, useMemo, useTransition, useRef } from 'react';
import {
  Bell,
  BellOff,
  Calendar,
  Users,
  Star,
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
  MessageSquare,
} from 'lucide-react';
import {
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from '@/app/_lib/notification-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell, TabBar, PageHeader } from '@/app/account/mentor/_components/_ui';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ago = (h) => new Date(Date.now() - h * 3600_000).toISOString();

const MOCK_NOTIFICATIONS = [
  { id: 'mn1', notification_type: 'mentee', title: 'Aisha Rahman submitted her weekly task', message: 'React Hooks assignment · 3 problems solved, 1 pending. Due in 6 hours.', created_at: ago(0.1), is_read: false },
  { id: 'mn2', notification_type: 'session', title: 'Session reminder: Rahul Sharma in 30 minutes', message: 'Backend Debugging Session — Zoom · 6:30 PM. Topic: Express middleware.', created_at: ago(0.3), is_read: false },
  { id: 'mn3', notification_type: 'mention', title: 'Sara Ahmed mentioned you in Help Desk', message: '"@mentor can you review my solution for the LIS DP problem?"', created_at: ago(1.5), is_read: false },
  { id: 'mn4', notification_type: 'rating', title: 'New 5-star rating received', message: 'John Doe rated your last session 5 stars: "Excellent explanation of system design concepts."', created_at: ago(3), is_read: false },
  { id: 'mn5', notification_type: 'mentee', title: 'David Lee accepted your mentorship request', message: 'New mentee onboarded. Focus area: Full Stack Development. Session starts next week.', created_at: ago(6), is_read: false },
  { id: 'mn6', notification_type: 'system', title: 'Monthly mentorship report generated', message: 'May 2026: 12 sessions, 47 hrs logged, 4 active mentees. View full report.', created_at: ago(24), is_read: true },
  { id: 'mn7', notification_type: 'session', title: 'Session completed: Career Guidance with Sara', message: 'Session logged for May 17, 8:00 PM — 60 min. Notes saved.', created_at: ago(36), is_read: true },
  { id: 'mn8', notification_type: 'mentee', title: 'Rahul Sharma missed the task deadline', message: 'Binary Search Trees assignment due May 15 — no submission received.', created_at: ago(48), is_read: true },
  { id: 'mn9', notification_type: 'system', title: 'Resource "Graph Algorithms Guide" shared with mentees', message: 'Your uploaded resource is now visible to 4 active mentees.', created_at: ago(72), is_read: true },
  { id: 'mn10', notification_type: 'rating', title: 'Aisha Rahman rated your session 4 stars', message: '"Great session! Would love more examples on useEffect cleanup."', created_at: ago(96), is_read: true },
  { id: 'mn11', notification_type: 'mention', title: 'John Doe replied to your recommendation note', message: '"Thank you for the feedback! I\'ll work on improving my time complexity analysis."', created_at: ago(120), is_read: true },
];

const TYPE_CONFIG = {
  mentee:  { icon: Users,         color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  session: { icon: Calendar,      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  mention: { icon: AtSign,        color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  rating:  { icon: Star,          color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  system:  { icon: Zap,           color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
  task:    { icon: BookOpen,      color: 'text-pink-400',    bg: 'bg-pink-500/10' },
  message: { icon: MessageSquare, color: 'text-sky-400',     bg: 'bg-sky-500/10' },
};

const cfg = (t) => TYPE_CONFIG[t] ?? TYPE_CONFIG.system;

const SYSTEM_TYPES = ['system', 'rating', 'task'];

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
  if (id === 'mentees') return notifs.filter((n) => n.notification_type === 'mentee');
  if (id === 'sessions') return notifs.filter((n) => n.notification_type === 'session');
  if (id === 'system') return notifs.filter((n) => SYSTEM_TYPES.includes(n.notification_type));
  return notifs;
}

export default function MentorNotificationsClient({
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
    { value: 'all',      label: 'All',      icon: Inbox,    count: notifs.length },
    { value: 'unread',   label: 'Unread',   icon: Bell,     count: unreadCount },
    { value: 'mentees',  label: 'Mentees',  icon: Users,    count: tabFilter(notifs, 'mentees').length },
    { value: 'sessions', label: 'Sessions', icon: Calendar, count: tabFilter(notifs, 'sessions').length },
    { value: 'system',   label: 'System',   icon: Zap,      count: tabFilter(notifs, 'system').length },
  ];

  const markRead = (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    if (!useMock) startTransition(() => markAsReadAction(id).catch(() => {}));
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (!useMock) startTransition(() => markAllAsReadAction().catch(() => {}));
  };

  const del = (id) => {
    setNotifs((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      const newFiltered = tabFilter(remaining, tab);
      if (currentPage > 1 && newFiltered.length <= (currentPage - 1) * ITEMS_PER_PAGE) {
        setCurrentPage(currentPage - 1);
      }
      return remaining;
    });
    if (!useMock) startTransition(() => deleteNotificationAction(id).catch(() => {}));
  };

  return (
    <PageShell className="text-gray-300 selection:bg-emerald-500/30">
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Bell}
          title="Inbox"
          subtitle="Stay updated with the latest mentee activity and alerts."
          accent="emerald"
          meta={unreadCount > 0 ? (
            <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {unreadCount} Unread
            </span>
          ) : null}
        />
        <TabBar tabs={tabs} value={tab} onChange={handleTabChange} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Notifications list */}
          <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 pb-3 border-b border-white/[0.06]">
              <p className="text-xs text-gray-500 font-medium">
                {filtered.length === 0
                  ? 'No notifications found'
                  : `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <div className="lg:hidden flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={isPending}
                    className="text-[11px] font-semibold text-gray-400 hover:text-emerald-400 transition-colors px-2 py-1 flex items-center gap-1.5"
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
                  className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/[0.08] border-dashed rounded-2xl text-center"
                >
                  <BellOff size={48} className="text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-1">
                    {tab === 'unread' ? "You're all caught up!" : 'No notifications here'}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-6">
                    {tab === 'unread' ? "You've read all your notifications." : 'New notifications will show up here.'}
                  </p>
                  {tab !== 'all' && (
                    <button
                      onClick={() => handleTabChange('all')}
                      className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm font-semibold text-gray-300 transition-colors shadow-sm active:scale-95"
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
                  className={cn('flex flex-col rounded-2xl border border-white/[0.06] overflow-hidden shadow-sm', isPending ? 'pointer-events-none' : '')}
                >
                  <AnimatePresence initial={false}>
                    {paginatedNotifs.map((n) => {
                      const config = cfg(n.notification_type);
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={n.id}
                          exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                          onClick={() => { if (!n.is_read) markRead(n.id); }}
                          className={cn(
                            'group relative flex items-start gap-4 p-4 border-b border-white/[0.04] last:border-b-0 transition-colors duration-200',
                            n.is_read
                              ? 'bg-white/[0.01] hover:bg-white/[0.03]'
                              : 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.07] cursor-pointer'
                          )}
                        >
                          <AnimatePresence>
                            {!n.is_read && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="absolute top-1/2 left-4 w-2 h-2 -translate-y-1/2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                              />
                            )}
                          </AnimatePresence>

                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-0.5 transition-[margin] duration-200',
                            !n.is_read ? 'ml-4' : '',
                            config.bg, config.color, 'border-white/5'
                          )}>
                            <Icon size={18} />
                          </div>

                          <div className="flex-1 min-w-0 pr-12">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <p className={cn(
                                'text-sm leading-snug truncate transition-colors duration-300',
                                n.is_read ? 'font-medium text-gray-400' : 'font-semibold text-gray-100'
                              )}>
                                {n.title}
                              </p>
                              <span className="shrink-0 font-mono text-[11px] font-medium text-gray-500">
                                {timeAgo(n.created_at)}
                              </span>
                            </div>
                            {n.message && (
                              <p className={cn(
                                'text-[13px] leading-relaxed line-clamp-2 transition-colors duration-300',
                                n.is_read ? 'text-gray-600' : 'text-gray-400'
                              )}>
                                {n.message}
                              </p>
                            )}
                          </div>

                          <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-150 bg-gray-950/90 lg:bg-transparent p-1 lg:p-0 rounded-lg backdrop-blur-sm lg:backdrop-blur-none">
                            {!n.is_read && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                                title="Mark as read"
                                className="p-1.5 rounded-md hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors"
                              >
                                <Check size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); del(n.id); }}
                              title="Delete"
                              className="p-1.5 rounded-md hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-3 border-t border-white/[0.06]">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                            )}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
              <h3 className="text-sm font-bold text-gray-200 mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={markAllRead}
                  disabled={isPending || unreadCount === 0}
                  className={cn(
                    'w-full flex items-center gap-2 justify-center py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm',
                    unreadCount > 0
                      ? 'bg-white text-gray-900 hover:bg-gray-200 active:scale-95'
                      : 'bg-white/[0.03] text-gray-500 border border-white/[0.05] cursor-not-allowed'
                  )}
                >
                  <CheckCheck size={16} /> Mark All as Read
                </button>
                <button className="w-full flex items-center gap-2 justify-center py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-gray-300 text-[13px] font-bold transition-colors">
                  <Settings size={16} /> Preferences
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
              <h3 className="text-sm font-bold text-gray-200 mb-4">Inbox Overview</h3>
              <div className="flex flex-col gap-4 text-sm">
                {[
                  { label: 'Unread',        value: unreadCount,                          color: 'text-emerald-400 bg-emerald-500/10' },
                  { label: 'Total',         value: notifs.length,                        color: 'text-white bg-white/[0.06]' },
                  { label: 'Mentee alerts', value: tabFilter(notifs, 'mentees').length,  color: 'text-blue-400 bg-blue-500/10' },
                  { label: 'Sessions',      value: tabFilter(notifs, 'sessions').length, color: 'text-cyan-400 bg-cyan-500/10' },
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
