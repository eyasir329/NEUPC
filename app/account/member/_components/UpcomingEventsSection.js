'use client';

import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function UpcomingEventsSection({ upcomingEvents }) {
  return (
    <div className="lg:col-span-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">📅 Upcoming Events</h2>
            <p className="text-sm text-gray-400">
              Events you might be interested in
            </p>
          </div>
          <Link
            href="/account/member/events"
            className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
          >
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/10"
            >
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-500 text-3xl">
                  {event.image}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-blue-300">
                    {event.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        event.status === 'Registered'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {event.status}
                    </span>
                    {event.status === 'Not Registered' && (
                      <button className="rounded bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                        Register Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
