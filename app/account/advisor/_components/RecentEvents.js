/**
 * @file Recent events — dashboard preview of the latest club events
 *   with attendance figures and status indicators.
 * @module AdvisorRecentEvents
 */

'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';

export default function RecentEvents({ recentEvents }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">📅 Recent Events</h2>
          <p className="text-sm text-gray-400">Event monitoring</p>
        </div>
        <Link
          href="/account/advisor/events"
          className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
        >
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {recentEvents.map((event, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">
                  {event.name}
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  {event.type} • {event.date}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  <Users className="mr-1 inline h-3 w-3" />
                  {event.participants} Participants
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  event.approval === 'Approved'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {event.approval}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
