'use client';

import { useState } from 'react';
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

  const markAll = () => setList((prev) => prev.map((n) => ({ ...n, is_read: true })));
  const markOne = (id) =>
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));

  const unreadCount = list.filter((n) => !n.is_read).length;

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 rounded-2xl shrink-0">
             <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">Inbox</h3>
            <p className="text-xs text-zinc-500 mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAll} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 px-3 py-1.5 transition-colors shrink-0">
              <Check className="w-3.5 h-3.5" /> Mark all
            </button>
          )}
          <Link href="/account/member/notifications" className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 px-3 py-1.5 transition-colors shrink-0">
            <ArrowRight className="w-3.5 h-3.5" /> Open
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <AnimatePresence initial={false}>
          {visible.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nothing new</p>
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
                className={`group relative flex items-start gap-4 cursor-pointer pb-4 border-b border-white/5 last:border-0 last:pb-0 ${notif.is_read ? 'opacity-60' : ''}`}
              >
                {!notif.is_read && (
                  <div className="absolute -left-3 top-1.5 w-1.5 h-1.5 rounded-lg bg-indigo-500"></div>
                )}
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-4 mb-1">
                    <h4 className={`text-sm font-bold leading-tight group-hover:text-indigo-400 transition-colors pr-8 relative ${notif.is_read ? 'text-zinc-400' : 'text-zinc-100'}`}>
                      <span dangerouslySetInnerHTML={{ __html: notif.title.replace(/'([^']+)'/g, "<span class='text-indigo-400'>'$1'</span>") }} />
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest shrink-0">{ago(notif.created_at)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{notif.message}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      {list.length > 3 && (
        <Link href="/account/member/notifications" className="block w-full mt-6 text-center text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 transition-colors py-2">
          View {list.length - 3} more &rarr;
        </Link>
      )}
    </div>
  );
}
