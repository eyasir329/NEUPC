'use client';

import { Calendar, CheckCircle, Flame, Bell } from 'lucide-react';

const STATS = [
  { label: 'Registered', icon: Calendar, valueKey: 'registeredEvents', unit: 'active', trend: '+1 this week' },
  { label: 'Attended',   icon: CheckCircle, valueKey: 'participationCount', unit: 'events', trend: 'Last: Apr 26' },
  { label: 'Upcoming',   icon: Flame, valueKey: 'upcomingEvents', unit: 'available', trend: '2 closing soon' },
  { label: 'Alerts',     icon: Bell, valueKey: 'notifications', unit: 'unread', trend: '1 urgent' },
];

export default function GuestStatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {STATS.map(({ label, icon: Icon, valueKey, unit, trend }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#111418] p-4"
        >
          <div className="mb-2 flex items-center gap-1.5">
            <Icon className="h-3 w-3 text-gray-500" />
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-gray-500">
              {label}
            </span>
          </div>
          <div className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-white">
            {stats[valueKey]}
            <span className="ml-1 text-sm font-normal text-gray-500">{unit}</span>
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500">{trend}</div>
          <div className="absolute top-3.5 right-3.5 flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04]">
            <Icon className="h-3.5 w-3.5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}
