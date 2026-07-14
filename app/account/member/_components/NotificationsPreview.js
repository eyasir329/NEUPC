/**
 * @file Notifications preview component
 * @module NotificationsPreview
 */

'use client';

import { useState } from 'react';
import {
  markAsReadAction,
  markAllAsReadAction,
} from '@/app/_lib/actions/notification-actions';
import Link from 'next/link';
import { Bell, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const markAll = () => {
    setList((prev) => prev.map((n) => ({ ...n, is_read: true })));
    markAllAsReadAction().catch(() => {});
  };
  const markOne = (id) => {
    setList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    markAsReadAction(id).catch(() => {});
  };

  const unreadCount = list.filter((n) => !n.is_read).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Inbox
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAll}
              className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-100"
            >
              <Check className="h-3.5 w-3.5" /> Mark all
            </button>
          )}
          <Link
            href="/account/member/notifications"
            className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-100"
          >
            <ArrowRight className="h-3.5 w-3.5" /> Open
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <AnimatePresence initial={false}>
          {visible.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                Nothing new
              </p>
            </div>
          ) : (
            visible.map((notif) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={notif.id}
                onClick={() => markOne(notif.id)}
                className={`group relative flex cursor-pointer items-start gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0 ${notif.is_read ? 'opacity-60' : ''}`}
              >
                {!notif.is_read && (
                  <div className="absolute top-1.5 -left-3 h-1.5 w-1.5 rounded-lg bg-indigo-500"></div>
                )}
                <div className="flex-1">
                  <div className="mb-1 flex items-baseline justify-between gap-4">
                    <h4
                      className={`relative pr-8 text-sm leading-tight font-bold transition-colors group-hover:text-indigo-400 ${notif.is_read ? 'text-zinc-400' : 'text-zinc-100'}`}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: notif.title.replace(
                            /'([^']+)'/g,
                            "<span class='text-indigo-400'>'$1'</span>"
                          ),
                        }}
                      />
                    </h4>
                    <span className="shrink-0 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                      {ago(notif.created_at)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {notif.message}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {list.length > 3 && (
        <Link
          href="/account/member/notifications"
          className="mt-6 block w-full py-2 text-center text-xs font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-100"
        >
          View {list.length - 3} more &rarr;
        </Link>
      )}
    </div>
  );
}
