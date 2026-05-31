/**
 * @file Redesigned event content detail component with countdown & capacity progress.
 * @module EventContentDetail
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import EventPublicContent from './EventPublicContent';

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';
}

function fmtDateTime(d) {
  return d
    ? new Date(d).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
}

function getDuration(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.ceil(hours / 24);
    return `${days} Day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours} Hour${hours > 1 ? 's' : ''}`;
  return `${minutes} Min`;
}

export default function EventContentDetail({
  event,
  onBack,
  rightSlot,
  topSlot,
}) {
  const [timeLeft, setTimeLeft] = useState(null);
  const isCompleted = event.status === 'completed';

  // ── Client-side Countdown Ticker logic ──
  useEffect(() => {
    if (isCompleted || !event.start_date) return;

    const targetTime = new Date(event.start_date).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [event.start_date, isCompleted]);

  const detailRows = [
    ...(event.start_date
      ? [{ label: 'Date', value: fmtDate(event.start_date) }]
      : []),
    {
      label: 'Venue',
      value: event.venue_type
        ? event.venue_type.charAt(0).toUpperCase() + event.venue_type.slice(1)
        : '—',
    },
    { label: 'Location', value: event.location || '—' },
    ...(event.end_date
      ? [
          { label: 'End Date', value: fmtDate(event.end_date) },
          { label: 'Duration', value: getDuration(event.start_date, event.end_date) || '—' },
        ]
      : []),
    {
      label: 'Format',
      value:
        event.participation_type === 'team'
          ? `Team (${event.team_size ?? '?'} members)`
          : 'Individual',
    },
    { label: 'Eligibility', value: event.eligibility || 'All' },
    ...(event.registration_required
      ? [{ label: 'Registration', value: 'Required' }]
      : []),
    ...(event.registration_deadline
      ? [
          {
            label: 'Reg. Deadline',
            value: fmtDateTime(event.registration_deadline),
          },
        ]
      : []),
  ];

  const registrationCount = event.registrationCount ?? 0;
  const maxParticipants = event.max_participants;
  const isCapActive = !isCompleted && maxParticipants;

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="font-heading hover:border-neon-lime/30 hover:text-neon-lime flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-all active:scale-95 sm:text-[11px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Events
        </button>
        <div className="flex items-center gap-2">
          <a
            href={`/events/${event.slug || event.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-heading hover:border-neon-lime/30 hover:text-neon-lime flex items-center gap-1.5 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-all sm:text-[11px]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Public Page</span>
          </a>
          {topSlot}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        
        {/* Main Content Pane */}
        <div className="order-last lg:order-first lg:col-span-8">
          <EventPublicContent event={event} />
        </div>

        {/* Sticky Sidebar */}
        <div className="order-first lg:order-last lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-6">

            {/* Countdown timer for upcoming events */}
            {!isCompleted && timeLeft && !timeLeft.expired && (
              <div className="holographic-card no-lift border-neon-lime/10 relative overflow-hidden rounded-2xl border bg-white/2 p-5 backdrop-blur-md">
                <div className="absolute top-0 right-0 h-1.5 w-12 rounded-bl-lg bg-linear-to-l from-neon-lime to-neon-violet" />
                <p className="mb-3 font-mono text-[9px] font-bold tracking-[0.3em] text-zinc-500 uppercase">
                  /// Event Countdown
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-white/3 border border-white/5 py-2.5 px-0.5">
                    <span className="font-mono text-lg font-black text-white">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="mt-0.5 font-mono text-[8px] tracking-widest text-zinc-500 uppercase">
                      Days
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-white/3 border border-white/5 py-2.5 px-0.5">
                    <span className="font-mono text-lg font-black text-white">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="mt-0.5 font-mono text-[8px] tracking-widest text-zinc-500 uppercase">
                      Hours
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-white/3 border border-white/5 py-2.5 px-0.5">
                    <span className="font-mono text-lg font-black text-white">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="mt-0.5 font-mono text-[8px] tracking-widest text-zinc-500 uppercase">
                      Mins
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-white/3 border border-white/5 py-2.5 px-0.5">
                    <span className="text-neon-lime font-mono text-lg font-black">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="mt-0.5 font-mono text-[8px] tracking-widest text-zinc-500 uppercase">
                      Secs
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Details card */}
            <div className="holographic-card no-lift rounded-2xl border border-white/5 bg-white/2 p-5 sm:p-6 backdrop-blur-md">
              <div className="mb-4 flex items-center gap-3">
                <span className="bg-neon-lime h-px w-6 shrink-0" />
                <span className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.4em] uppercase sm:text-[11px]">
                  Details
                </span>
              </div>
              <ul className="space-y-0.5">
                {detailRows.map(({ label, value }) => (
                  <li
                    key={label}
                    className="flex items-start justify-between gap-4 border-b border-white/5 py-3 last:border-0 last:pb-0"
                  >
                    <span className="shrink-0 font-mono text-[9px] tracking-widest text-zinc-500 uppercase sm:text-[10px]">
                      {label}
                    </span>
                    <span className="font-heading text-right text-[13px] leading-snug font-bold text-white sm:text-sm">
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Spots capacity visual progress bar */}
            {isCapActive && (
              <div className="holographic-card no-lift rounded-2xl border border-white/5 bg-white/2 p-5 sm:p-6 backdrop-blur-md space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] tracking-widest text-zinc-500 uppercase">
                    Spot Occupancy
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {registrationCount} / {maxParticipants} Spots
                  </span>
                </div>
                
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-neon-lime to-neon-violet h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, (registrationCount / maxParticipants) * 100)}%`,
                    }}
                  />
                </div>

                <p className="font-mono text-[9px] text-zinc-500 leading-normal uppercase tracking-wide">
                  {maxParticipants - registrationCount > 0
                    ? `Only ${maxParticipants - registrationCount} seats remaining`
                    : 'Registration Full!'}
                </p>
              </div>
            )}

            {/* Role-specific widget slot (e.g. Register Button) */}
            {rightSlot}
          </div>
        </div>

      </div>
    </div>
  );
}
