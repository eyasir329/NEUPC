/**
 * @file Member notifications client — personal notification feed with
 *   unread counter, mark-as-read, and dismiss actions.
 * @module MemberNotificationsClient
 */

'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Search,
  X,
  Calendar,
  Trophy,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  ExternalLink,
  Filter,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from '@/app/_lib/notification-actions';

// ─── Notification type config ─────────────────────────────────────────────────

const TYPE_CONFIG = {
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    label: 'Info',
  },
  success: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    label: 'Success',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    label: 'Warning',
  },
  error: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    label: 'Error',
  },
  event: {
    icon: Calendar,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    label: 'Event',
  },
  mention: {
    icon: Bell,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    label: 'Mention',
  },
  achievement: {
    icon: Trophy,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    label: 'Achievement',
  },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.info;
}

function timeAgo(str) {
  if (!str) return '';
  const diff = Math.floor((Date.now() - new Date(str)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(str).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MemberNotificationsClient({
  notifications: initialNotifications = [],
  unreadCount: initialUnreadCount = 0,
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [typeFilter, setTypeFilter] = useState('all');
  const [isPending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  // Filtered notifications
  const filtered = useMemo(() => {
    let list = notifications;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q)
      );
    }

    if (filter === 'unread') list = list.filter((n) => !n.is_read);
    if (filter === 'read') list = list.filter((n) => n.is_read);

    if (typeFilter !== 'all')
      list = list.filter((n) => n.notification_type === typeFilter);

    return list;
  }, [notifications, search, filter, typeFilter]);

  // Actions
  const handleMarkRead = (id) => {
    startTransition(async () => {
      try {
        await markAsReadAction(id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      } catch {
        toast.error('Failed to mark as read');
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      try {
        await markAllAsReadAction();
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            is_read: true,
            read_at: new Date().toISOString(),
          }))
        );
        toast.success('All notifications marked as read');
      } catch {
        toast.error('Failed to mark all as read');
      }
    });
  };

  const handleDelete = (id) => {
    startTransition(async () => {
      try {
        await deleteNotificationAction(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success('Notification deleted');
      } catch {
        toast.error('Failed to delete notification');
      }
    });
  };

  // Available types from data
  const availableTypes = useMemo(() => {
    const types = new Set(
      notifications.map((n) => n.notification_type).filter(Boolean)
    );
    return Array.from(types);
  }, [notifications]);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-50"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:border-primary-500/50 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-8 pl-9 text-sm text-white placeholder-gray-500 transition-colors outline-none focus:bg-white/8"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-500/20 text-primary-300 border-primary-500/30 border'
                  : 'border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}

          {availableTypes.length > 1 && (
            <>
              <div className="mx-1 h-6 w-px self-center bg-white/10" />
              {availableTypes.map((type) => {
                const cfg = getTypeConfig(type);
                return (
                  <button
                    key={type}
                    onClick={() =>
                      setTypeFilter(typeFilter === type ? 'all' : type)
                    }
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      typeFilter === type
                        ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                        : 'border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/2 py-20">
          <BellOff size={48} className="mb-4 text-gray-600" />
          <p className="text-lg font-medium text-gray-400">
            {search || filter !== 'all' || typeFilter !== 'all'
              ? 'No notifications match your filters'
              : 'No notifications yet'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {search || filter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : "You'll be notified about events, achievements, and updates"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => {
            const cfg = getTypeConfig(notification.notification_type);
            const Icon = cfg.icon;

            return (
              <div
                key={notification.id}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-200 ${
                  notification.is_read
                    ? 'border-white/5 bg-white/2 hover:bg-white/4'
                    : 'border-white/10 bg-white/5 hover:bg-white/8'
                }`}
              >
                {/* Unread indicator */}
                {!notification.is_read && (
                  <div className="bg-primary-500 absolute top-0 left-0 h-full w-0.5" />
                )}

                <div className="flex items-start gap-3 p-4">
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.color}`}
                  >
                    <Icon size={16} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`text-sm font-semibold ${
                          notification.is_read ? 'text-gray-300' : 'text-white'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span className="shrink-0 text-xs text-gray-500">
                        {timeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-sm leading-relaxed ${
                        notification.is_read ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {notification.message}
                    </p>

                    {/* Actions row */}
                    <div className="mt-2 flex items-center gap-2">
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="text-primary-400 inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs transition-colors hover:bg-white/10"
                        >
                          <ExternalLink size={10} />
                          View
                        </a>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                          <Check size={10} />
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 size={10} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
