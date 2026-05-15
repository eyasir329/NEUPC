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
} from '@/app/_lib/notification-actions';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

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
  event:       { icon: Calendar,      color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  mention:     { icon: AtSign,        color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  achievement: { icon: Trophy,        color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  system:      { icon: Zap,           color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
  info:        { icon: AlertCircle,   color: 'text-sky-400',     bg: 'bg-sky-500/10' },
  success:     { icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  lesson:      { icon: BookOpen,      color: 'text-pink-400',    bg: 'bg-pink-500/10' },
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

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
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
    <div className="flex min-h-screen text-gray-300 selection:bg-violet-500/30">
      {/* ── Secondary left nav ───────────────────────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 border-r border-white/[0.06] bg-gray-950 xl:flex xl:flex-col z-20">
        <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-0.5 mt-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => handleTabChange(t.value)}
                  className={cn(
                    'group/nav relative flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                    active
                      ? 'bg-rose-500/12 font-semibold text-rose-400 shadow-rose-500/10'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                  )}
                >
                  {active && (
                    <motion.div layoutId="activeTabIndicator" className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-rose-500 to-pink-600" />
                  )}
                  <div className="flex items-center gap-3">
                    <Icon className="h-[17px] w-[17px] shrink-0 transition-colors" />
                    <span className="truncate text-left">{t.label}</span>
                  </div>
                  {t.count !== undefined && t.count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                      active ? "bg-rose-500/20 text-rose-300" : "bg-white/[0.06] text-gray-500"
                    )}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-950">
        {/* Mobile / tablet horizontal tab bar */}
        <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-xl xl:hidden">
          <div className="flex items-center gap-2 px-4 sm:px-6">
            <nav className="scrollbar-none -mb-px flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => handleTabChange(t.value)}
                    className={cn(
                      'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[13px] font-medium transition-colors',
                      active
                        ? 'border-rose-500 text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', active ? 'text-rose-400' : '')} />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 xl:p-10 custom-scrollbar h-full">
          <div className="mx-auto w-full max-w-7xl">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                  <Bell size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight mb-1.5 flex items-center gap-3">
                    Inbox
                    {unreadCount > 0 && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold tracking-wide uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                        {unreadCount} Unread
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-400">Stay updated with the latest activities and alerts.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Center content (Notifications List) */}
              <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 pb-3 border-b border-white/[0.06]">
                  <p className="text-xs text-gray-500 font-medium">
                    {filtered.length === 0
                      ? 'No notifications found'
                      : `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`
                    }
                  </p>
                  
                  {/* Actions for small screens */}
                  <div className="lg:hidden flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        disabled={isPending}
                        className="text-[11px] font-semibold text-gray-400 hover:text-rose-400 transition-colors px-2 py-1 flex items-center gap-1.5"
                      >
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {filtered.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/[0.08] border-dashed rounded-2xl text-center"
                    >
                      <BellOff size={48} className="text-gray-700 mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-1">
                        {tab === 'unread' ? "You're all caught up!" : "No notifications here"}
                      </h3>
                      <p className="text-sm text-gray-500 max-w-sm mb-6">
                        {tab === 'unread'
                          ? "You've read all your notifications."
                          : 'New notifications will show up here.'}
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
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden shadow-sm"
                    >
                      <AnimatePresence initial={false}>
                        {paginatedNotifs.map((n, i) => {
                          const config = cfg(n.notification_type);
                          const Icon = config.icon;
                          
                          return (
                            <motion.div
                              layout
                              key={n.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0, opacity: 0, transition: { duration: 0.2 } }}
                              transition={{ duration: 0.2, delay: i * 0.02 }}
                              onClick={() => { if (!n.is_read) markRead(n.id); }}
                              className={cn(
                                "group relative flex items-start gap-4 p-4 border-b border-white/[0.04] transition-all duration-300 last:border-b-0",
                                n.is_read 
                                  ? "bg-transparent hover:bg-white/[0.02]" 
                                  : "bg-rose-500/[0.04] hover:bg-rose-500/[0.06] cursor-pointer"
                              )}
                            >
                              {!n.is_read && (
                                <div className="absolute top-1/2 left-4 w-2 h-2 -translate-y-1/2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                              )}
                              
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-inner mt-0.5",
                                !n.is_read ? "ml-4" : "", // Push right if there's an unread dot
                                config.bg,
                                config.color,
                                "border-white/5"
                              )}>
                                <Icon size={18} />
                              </div>

                              <div className="flex-1 min-w-0 pr-12">
                                <div className="flex items-start justify-between gap-3 mb-1">
                                  <p className={cn(
                                    "text-sm leading-snug truncate",
                                    n.is_read ? "font-medium text-gray-300" : "font-bold text-gray-100"
                                  )}>
                                    {n.title}
                                  </p>
                                  <span className="shrink-0 font-mono text-[11px] font-medium text-gray-500">
                                    {timeAgo(n.created_at)}
                                  </span>
                                </div>
                                
                                {n.message && (
                                  <p className={cn(
                                    "text-[13px] leading-relaxed line-clamp-2",
                                    n.is_read ? "text-gray-500" : "text-gray-400"
                                  )}>
                                    {n.message}
                                  </p>
                                )}
                              </div>
                              
                              {/* Hover Actions (Absolute on Desktop) */}
                              <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-gray-950/80 lg:bg-transparent p-1 lg:p-0 rounded-lg backdrop-blur-sm lg:backdrop-blur-none">
                                {!n.is_read && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                                    disabled={isPending}
                                    title="Mark as read"
                                    className="p-1.5 rounded-md hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
                                  >
                                    <Check size={16} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); del(n.id); }}
                                  disabled={isPending}
                                  title="Delete"
                                  className="p-1.5 rounded-md hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-2">
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
                                  "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                                  currentPage === i + 1 
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-inner" 
                                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
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

              {/* Right Sidebar - Fixed */}
              <div className="hidden lg:flex flex-col gap-6 sticky top-6">
                {/* Actions Box */}
                <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
                  <h3 className="text-sm font-bold text-gray-200 mb-4">Quick Actions</h3>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={markAllRead}
                      disabled={isPending || unreadCount === 0}
                      className={cn(
                        "w-full flex items-center gap-2 justify-center py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm",
                        unreadCount > 0 
                          ? "bg-white text-gray-900 hover:bg-gray-200 active:scale-95" 
                          : "bg-white/[0.03] text-gray-500 border border-white/[0.05] cursor-not-allowed"
                      )}
                    >
                      <CheckCheck size={16} /> Mark All as Read
                    </button>
                    
                    <button className="w-full flex items-center gap-2 justify-center py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-gray-300 text-[13px] font-bold transition-colors">
                      <Settings size={16} /> Preferences
                    </button>
                  </div>
                </div>

                {/* Overview Box */}
                <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
                  <h3 className="text-sm font-bold text-gray-200 mb-4">Inbox Overview</h3>
                  <div className="flex flex-col gap-4 text-sm">
                    <div className="flex justify-between items-center group">
                      <span className="text-gray-500 font-medium">Unread</span>
                      <span className="text-rose-400 font-semibold tabular-nums bg-rose-500/10 px-2 py-0.5 rounded-md">{unreadCount}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-gray-500 font-medium">Total Received</span>
                      <span className="text-white font-semibold tabular-nums bg-white/[0.06] px-2 py-0.5 rounded-md">{notifs.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
