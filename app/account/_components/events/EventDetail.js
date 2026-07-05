/**
 * @file Event detail component
 * @module EventDetail
 */

'use client';

import { useEffect } from 'react';
import { Calendar, Clock, MapPin, FileText, ChevronLeft } from 'lucide-react';
import { GlassCard } from '@/app/account/_components/ui';
import posthog from 'posthog-js';

/**
 * Shared event detail view used by all role views.
 *
 * Props:
 *   event       — enriched event object
 *   onBack      — callback to return to list
 *   detailRows  — extra rows for the details card: [{ label, value, accent? }]
 *   ctaSlot     — React node rendered in the hero (e.g. Register button) — optional
 *   sidebarSlot — React node rendered below the details card — optional
 */
export default function EventDetail({
  event,
  onBack,
  detailRows = [],
  ctaSlot,
  sidebarSlot,
}) {
  useEffect(() => {
    if (event?.id) {
      posthog.capture('event_viewed', {
        event_id: event.id,
        event_title: event.title,
        event_type: event._type,
        event_status: event._bucket,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  return (
    <div className="flex flex-col gap-6 pb-12 lg:gap-8">
      <button
        onClick={onBack}
        className="flex w-max items-center gap-2 rounded-lg border border-white/8 bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-300 transition-all hover:bg-white/6 hover:text-white active:scale-95"
      >
        <ChevronLeft size={16} /> Back to Events
      </button>

      {/* Banner image */}
      {event.banner_image && (
        <div className="overflow-hidden rounded-2xl border border-white/8">
          <img
            src={event.banner_image}
            alt={event.title}
            className="h-48 w-full object-cover opacity-80 sm:h-64"
          />
        </div>
      )}

      {/* Hero */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div className="flex items-start gap-5">
          <div className="mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-linear-to-br from-violet-500/20 to-purple-500/20 text-violet-400 shadow-inner">
            <Calendar size={32} />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {event._type && (
                <span className="rounded-md border border-white/8 bg-white/6 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-300 uppercase">
                  {event._type}
                </span>
              )}
              {event._bucket === 'ongoing' && (
                <span className="flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />{' '}
                  Live Now
                </span>
              )}
              {(event._bucket === 'upcoming' || event._isUpcoming) &&
                event._bucket !== 'ongoing' && (
                  <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{' '}
                    Upcoming
                  </span>
                )}
            </div>
            <h1 className="mb-4 text-3xl leading-snug font-bold tracking-tight text-white lg:text-4xl">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" /> {event._date}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" /> {event._time}
              </div>
              {event._location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-500" />{' '}
                  {event._location}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA slot (e.g. Register button for member) */}
        {ctaSlot && <div className="shrink-0 md:self-start">{ctaSlot}</div>}
      </div>

      {/* Body */}
      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <GlassCard>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-200">
              <FileText size={16} className="text-violet-400" /> About Event
            </h3>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-300">
              {event.description || 'No description provided.'}
            </p>
          </GlassCard>
          {event.content && (
            <GlassCard>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-200">
                <FileText size={16} className="text-blue-400" /> Details
              </h3>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-300">
                {event.content}
              </p>
            </GlassCard>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <GlassCard>
            <h3 className="mb-4 text-sm font-bold text-gray-200">
              Event Details
            </h3>
            <div className="flex flex-col gap-0 text-sm">
              {detailRows.map(({ label, value, accent }, i) => (
                <div
                  key={label}
                  className={`flex items-center justify-between py-2 ${i < detailRows.length - 1 ? 'border-b border-white/6' : ''}`}
                >
                  <span className="font-medium text-gray-500">{label}</span>
                  <span
                    className={`font-semibold ${accent ?? 'text-gray-200'}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {sidebarSlot}
        </div>
      </div>
    </div>
  );
}
