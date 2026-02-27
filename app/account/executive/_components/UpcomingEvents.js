'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';

export default function UpcomingEvents({ upcomingEvents }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">📅 Upcoming Events</h2>
          <p className="text-sm text-gray-400">Manage event operations</p>
        </div>
        <Link
          href="/account/executive/events/manage"
          className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
        >
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-blue-300">
                  {event.name}
                </h3>
                <p className="mt-1 text-sm text-gray-400">{event.date}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  event.statusColor === 'green'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {event.status}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                <Users className="mr-1 inline h-4 w-4" />
                {event.registrations} Registered
              </span>
              <div className="flex gap-2">
                <button className="rounded bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                  Manage
                </button>
                <button className="rounded bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/30">
                  Registrations
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
