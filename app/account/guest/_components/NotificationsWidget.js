/**
 * @file Notifications widget — compact dashboard preview of recent
 *   guest notifications with unread count and mark-as-read actions.
 * @module GuestNotificationsWidget
 */

'use client';

import { Bell, Clock } from 'lucide-react';

export default function NotificationsWidget({ notifications, unreadCount }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-white">Notifications</h3>
          </div>
          {unreadCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg border p-3 transition-all duration-200 ${
                notification.unread
                  ? 'border-blue-500/30 bg-blue-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-start gap-2">
                {notification.unread && (
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white">
                    {notification.title}
                  </h4>
                  <p className="mt-1 text-xs text-gray-400">
                    {notification.message}
                  </p>
                  <span className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {notification.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
