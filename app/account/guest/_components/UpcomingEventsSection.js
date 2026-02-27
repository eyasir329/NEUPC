'use client';

import Link from 'next/link';
import { Lock, Calendar, Clock, CheckCircle, ChevronRight } from 'lucide-react';

export default function UpcomingEventsSection({ events }) {
  return (
    <div className="lg:col-span-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">📅 Upcoming Events</h2>
            <p className="text-sm text-gray-400">Public events you can join</p>
          </div>
          <Link
            href="/events"
            className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
          >
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white group-hover:text-blue-300">
                      {event.title}
                    </h3>
                    {!event.isPublic && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                        <Lock className="h-3 w-3" />
                        Members Only
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.isPublic ? (
                    event.status === 'registered' ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-300">
                        <CheckCircle className="h-3 w-3" />
                        Registered
                      </span>
                    ) : (
                      <button className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                        Register
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-500/20 px-3 py-1.5 text-xs font-semibold text-gray-400">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
