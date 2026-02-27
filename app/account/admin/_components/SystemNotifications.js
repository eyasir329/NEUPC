'use client';

import { Bell, AlertCircle, CheckCircle } from 'lucide-react';

export default function SystemNotifications() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-amber-400" />
        <h3 className="font-bold text-white">System Notifications</h3>
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                Database backup scheduled
              </p>
              <p className="mt-1 text-xs text-gray-400">Tonight at 2:00 AM</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-300">
                All systems operational
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Last checked: 5 min ago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
