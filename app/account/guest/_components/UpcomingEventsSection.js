'use client';

import Link from 'next/link';
import { Lock, Clock, MapPin, CheckCircle, ChevronRight } from 'lucide-react';

function DateBlock({ date }) {
  const [month, day] = date.split(' ');
  return (
    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-center">
      <span className="font-mono text-[9px] uppercase leading-none text-gray-500">{month}</span>
      <span className="mt-0.5 text-sm font-semibold leading-none text-white">
        {day?.replace(',', '')}
      </span>
    </div>
  );
}

function StatusBadge({ status, isPublic }) {
  if (!isPublic) {
    return (
      <span className="group relative inline-flex cursor-help items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-gray-400">
        <Lock className="h-3 w-3" />
        Members only
        <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 w-52 -translate-x-1/2 rounded-lg border border-white/10 bg-[#050608] p-2.5 text-[11.5px] text-gray-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
          <strong className="text-blue-400">Member-only feature</strong>
          <br />
          Bootcamps are reserved for full members.
          <span className="mt-1.5 block font-semibold text-blue-400">Apply for membership →</span>
        </span>
      </span>
    );
  }
  if (status === 'registered') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10.5px] font-medium text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        Registered
      </span>
    );
  }
  return (
    <button className="inline-flex items-center gap-1 rounded-md bg-blue-500 px-2.5 py-1 text-[10.5px] font-semibold text-[#0b0d10] transition-all hover:brightness-110">
      Register
    </button>
  );
}

export default function UpcomingEventsSection({ events }) {
  return (
    <div className="lg:col-span-2">
      <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#111418]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            Upcoming events
          </h3>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-400 transition-colors hover:text-white"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div>
          {events.map((event, i) => (
            <div
              key={event.id}
              className={`flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-white/[0.02] ${
                i < events.length - 1 ? 'border-b border-white/[0.07]' : ''
              }`}
            >
              <DateBlock date={event.date} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-[13px] font-medium text-white">{event.title}</div>
                <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {event.time}
                  </span>
                  {event.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {event.venue}
                    </span>
                  )}
                  {event.tag && (
                    <span className="font-mono rounded bg-white/[0.04] px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-gray-500">
                      {event.tag}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <StatusBadge status={event.status} isPublic={event.isPublic} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
