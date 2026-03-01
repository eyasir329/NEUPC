/**
 * @file Admin header banner — gradient card displaying “Admin Control
 *   Centre” title, full-access badge, system-health indicator, and
 *   current uptime derived from stats props.
 * @module AdminHeader
 */

'use client';

import { Shield, Activity, Server } from 'lucide-react';

export default function AdminHeader({ stats }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-linear-to-br from-red-500/10 via-orange-500/10 to-amber-500/10 p-6 backdrop-blur-xl sm:p-8">
      <div className="absolute top-0 right-0 h-40 w-40 bg-red-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-orange-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              🛠️ Admin Control Center
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-300">
                <Shield className="h-4 w-4" />
                Full Access
              </span>
              <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-300">
                <Activity className="h-4 w-4" />
                System Healthy
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-xs text-gray-400">System Health</p>
                <p className="text-sm font-bold text-white">
                  {stats.systemHealth}%
                </p>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-green-500 to-cyan-500"
                style={{ width: `${stats.systemHealth}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
