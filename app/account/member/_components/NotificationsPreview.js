/**
 * @file Notifications preview — top 3 unread items inline on dashboard.
 * @module NotificationsPreview
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bell,
  ArrowRight,
  Check,
  Calendar,
  Trophy,
  AtSign,
  Zap,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlassCard,
  SectionHeader,
  ActionButton,
  EmptyState,
  IconChip,
} from './_ui';

const TYPE_CFG = {
  event: { icon: Calendar, accent: 'blue' },
  mention: { icon: AtSign, accent: 'violet' },
  achievement: { icon: Trophy, accent: 'amber' },
  system: { icon: Zap, accent: 'cyan' },
  lesson: { icon: BookOpen, accent: 'pink' },
};

const cfg = (t) => TYPE_CFG[t] ?? { icon: AlertCircle, accent: 'gray' };

function ago(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function NotificationsPreview({ items = [] }) {
  const [list, setList] = useState(items);
  const visible = list.slice(0, 3);

  const markAll = () => setList((prev) => prev.map((n) => ({ ...n, is_read: true })));
  const markOne = (id) =>
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));

  const unreadCount = list.filter((n) => !n.is_read).length;

  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Bell}
        title="Inbox"
        subtitle={
          unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'
        }
        accent="rose"
        action={
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <ActionButton tone="ghost" icon={Check} onClick={markAll}>
                Mark all
              </ActionButton>
            )}
            <ActionButton
              tone="primary"
              icon={ArrowRight}
              href="/account/member/notifications"
            >
              Open
            </ActionButton>
          </div>
        }
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing new"
          description="You're all caught up."
          accent="rose"
        />
      ) : (
        <div className="-mx-2 space-y-0.5">
          <AnimatePresence initial={false}>
            {visible.map((n, i) => {
              const c = cfg(n.notification_type);
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className={`group relative flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.03] ${
                    !n.is_read ? '' : 'opacity-70'
                  }`}
                >
                  {!n.is_read && (
                    <span className="absolute top-1/2 left-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(124,131,255,0.7)]" />
                  )}
                  <IconChip icon={c.icon} accent={c.accent} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[12.5px] leading-snug ${
                        n.is_read ? 'text-gray-400' : 'font-medium text-white'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="line-clamp-1 text-[10.5px] text-gray-500">
                      {n.message}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-mono text-[10px] tabular-nums text-gray-500">
                      {ago(n.created_at)}
                    </span>
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => markOne(n.id)}
                        title="Mark read"
                        className="rounded p-1 text-gray-600 opacity-0 transition group-hover:opacity-100 hover:bg-emerald-500/10 hover:text-emerald-300"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {list.length > 3 && (
            <div className="mt-2 border-t border-white/[0.04] pt-2">
              <Link
                href="/account/member/notifications"
                className="block text-center text-[11px] text-gray-500 transition hover:text-gray-300"
              >
                View {list.length - 3} more →
              </Link>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
