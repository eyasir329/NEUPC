'use client';

import Link from 'next/link';
import { Bell, CheckCircle, Calendar, BookOpen, ChevronRight } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  event: Calendar,
  resource: BookOpen,
  default: Bell,
};

const iconColorMap = {
  success: 'text-emerald-400',
  event: 'text-blue-400',
  resource: 'text-amber-400',
  default: 'text-gray-400',
};

export default function NotificationsWidget({ notifications, unreadCount }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#111418]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
          <Bell className="h-3.5 w-3.5 text-gray-500" />
          Recent activity
          {unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </h3>
        <Link
          href="/account/guest/notifications"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-400 transition-colors hover:text-white"
        >
          All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div>
        {notifications.map((n, i) => {
          const Icon = iconMap[n.type] || iconMap.default;
          const iconColor = iconColorMap[n.type] || iconColorMap.default;
          return (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] ${
                n.unread ? 'bg-blue-500/[0.04]' : ''
              } ${i < notifications.length - 1 ? 'border-b border-white/[0.07]' : ''}`}
            >
              {n.unread && (
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              )}
              {!n.unread && <div className="mt-1.5 h-1.5 w-1.5 shrink-0" />}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-white">{n.title}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-gray-500">{n.message}</div>
                <div className="mt-1 font-mono text-[10.5px] text-gray-600">{n.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
