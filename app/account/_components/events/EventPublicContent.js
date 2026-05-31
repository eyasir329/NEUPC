/**
 * @file Redesigned event public content component
 * @module EventPublicContent
 */

'use client';

import EventContentRenderer from './EventContentRenderer';
import { driveImageUrl } from '@/app/_lib/utils/utils';

// Helper functions for date & status rendering
function fmtDateShort(d) {
  if (!d) return '';
  return new Date(d)
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimelineDateTime(dtStr) {
  if (!dtStr) return '';
  const match = dtStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    const [_, year, month, day, hourStr, minuteStr] = match;
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(month, 10) - 1] || 'Jan';
    return `${monthName} ${parseInt(day, 10)}, ${year} · ${hour12}:${minuteStr} ${ampm}`;
  }
  try {
    const d = new Date(dtStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  } catch {}
  return dtStr;
}

function statusConfig(status) {
  const map = {
    draft: {
      label: 'Draft',
      dot: 'bg-zinc-600',
      text: 'text-zinc-400',
      badge: 'border-white/10 bg-white/5 text-zinc-400',
    },
    upcoming: {
      label: 'Upcoming',
      dot: 'bg-neon-lime animate-pulse',
      text: 'text-neon-lime',
      badge: 'border-neon-lime/30 bg-neon-lime/10 text-neon-lime',
    },
    ongoing: {
      label: 'Live Now',
      dot: 'bg-neon-violet animate-pulse',
      text: 'text-neon-violet',
      badge: 'border-neon-violet/30 bg-neon-violet/10 text-neon-violet',
    },
    completed: {
      label: 'Completed',
      dot: 'bg-zinc-600',
      text: 'text-zinc-500',
      badge: 'border-white/10 bg-white/5 text-zinc-400',
    },
    cancelled: {
      label: 'Cancelled',
      dot: 'bg-red-500',
      text: 'text-red-400',
      badge: 'border-red-500/20 bg-red-500/10 text-red-400',
    },
  };
  return map[status] || map.upcoming;
}

function SectionLabel({ accent = 'lime', children }) {
  const line = accent === 'violet' ? 'bg-neon-violet' : 'bg-neon-lime';
  const text = accent === 'violet' ? 'text-neon-violet' : 'text-neon-lime';
  return (
    <div className="flex items-center gap-3">
      <span className={`h-px w-6 shrink-0 ${line}`} />
      <span
        className={`font-mono text-[10px] font-bold tracking-[0.4em] uppercase sm:text-[11px] ${text}`}
      >
        {children}
      </span>
    </div>
  );
}

export default function EventPublicContent({ event }) {
  const sc = statusConfig(event.status);
  const tags = event.tags || [];
  const agenda = Array.isArray(event.agenda) ? event.agenda : [];
  const speakers = Array.isArray(event.speakers) ? event.speakers : [];
  const timeline = Array.isArray(event.timeline) ? event.timeline : [];
  const coverUrl = driveImageUrl(event.cover_image || event.image);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Redesigned Header Block with Dynamic Cover Banner */}
      <div className="holographic-card no-lift overflow-hidden rounded-2xl border border-white/5 bg-white/2 backdrop-blur-md">
        
        {/* Cover image banner strip if it exists */}
        {coverUrl && (
          <div className="relative h-40 w-full overflow-hidden sm:h-52 md:h-60 border-b border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover opacity-75"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b11] via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex min-h-[26px] items-center gap-1.5 rounded-full border px-3.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase sm:text-[10px] ${sc.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            {event.category && (
              <span className="inline-flex min-h-[26px] items-center rounded-full border border-white/10 bg-white/5 px-3.5 py-0.5 font-mono text-[9px] tracking-widest text-zinc-400 uppercase sm:text-[10px]">
                {event.category}
              </span>
            )}
          </div>

          <h1 className="kinetic-headline font-heading text-[clamp(1.5rem,3.5vw+0.5rem,2.5rem)] [line-height:1.05] font-black text-white uppercase">
            {event.title}
          </h1>

          {/* Quick Date token */}
          {event.start_date && (
            <div className="flex items-center gap-2 pt-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">
              <svg className="h-4 w-4 text-neon-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{fmtDateShort(event.start_date)}</span>
              {fmtTime(event.start_date) && (
                <>
                  <span>·</span>
                  <span>{fmtTime(event.start_date)}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description + Rich Content Blocks */}
      {(event.description || event.content) && (
        <div className="holographic-card rounded-2xl border border-white/5 bg-white/2 p-6 sm:p-8 backdrop-blur-md">
          <div className="mb-4">
            <SectionLabel accent="lime">Overview</SectionLabel>
          </div>
          {event.description && (
            <p className="text-sm leading-[1.8] text-zinc-300 sm:text-[15px]">
              {event.description}
            </p>
          )}
          {event.content && (
            <div
              className={
                event.description
                  ? "mt-6 border-t border-white/5 pt-6 sm:mt-8 sm:pt-8"
                  : ""
              }
            >
              <EventContentRenderer content={event.content} />
            </div>
          )}
        </div>
      )}

      {/* Multi-Timeline Sessions */}
      {timeline.length > 0 && (
        <div className="holographic-card rounded-2xl border border-white/5 bg-white/2 p-6 sm:p-8 backdrop-blur-md">
          <div className="mb-6">
            <SectionLabel accent="lime">Schedule & Sessions</SectionLabel>
          </div>
          <div className="relative space-y-6 border-l border-white/10 pl-6">
            <span className="from-neon-lime/40 to-neon-violet/30 absolute top-1.5 bottom-1.5 left-0 w-px bg-linear-to-b via-white/10" />
            {timeline.map((tm) => (
              <div key={tm.id} className="relative group">
                <span className="bg-neon-lime absolute top-1 -left-[27px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#05060B] shadow-[0_0_12px_rgba(182,243,107,0.55)] group-hover:scale-105 transition-transform">
                  <span className="h-1.5 w-1.5 rounded-full bg-black/50" />
                </span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {tm.start_date && (
                    <span className="text-neon-lime font-mono text-[10px] font-bold tracking-widest uppercase">
                      {formatTimelineDateTime(tm.start_date)}
                    </span>
                  )}
                  {tm.end_date && (
                    <span className="text-zinc-500 font-mono text-[10px] font-bold uppercase">
                      to {formatTimelineDateTime(tm.end_date)}
                    </span>
                  )}
                </div>
                {tm.title && (
                  <h4 className="font-heading mt-0.5 text-sm font-bold text-white uppercase tracking-wide">
                    {tm.title}
                  </h4>
                )}
                {tm.location && (
                  <p className="mt-1.5 font-mono text-[9px] tracking-widest text-zinc-500 uppercase sm:text-[10px]">
                    Location · <span className="font-bold text-zinc-300">{tm.location}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda/Schedule timeline */}
      {agenda.length > 0 && (
        <div className="holographic-card rounded-2xl border border-white/5 bg-white/2 p-6 sm:p-8 backdrop-blur-md">
          <div className="mb-6">
            <SectionLabel accent="lime">Agenda</SectionLabel>
          </div>
          <div className="relative space-y-6 border-l border-white/10 pl-6">
            <span className="from-neon-lime/40 to-neon-violet/30 absolute top-1.5 bottom-1.5 left-0 w-px bg-linear-to-b via-white/10" />
            {agenda.map((ag) => (
              <div key={ag.id} className="relative group">
                <span className="bg-neon-lime absolute top-1 -left-[27px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#05060B] shadow-[0_0_12px_rgba(182,243,107,0.55)] group-hover:scale-105 transition-transform">
                  <span className="h-1.5 w-1.5 rounded-full bg-black/50" />
                </span>
                {ag.time && (
                  <span className="text-neon-lime font-mono text-[10px] font-bold tracking-widest uppercase">
                    {ag.time}
                  </span>
                )}
                {ag.title && (
                  <h4 className="font-heading mt-0.5 text-sm font-bold text-white uppercase tracking-wide">
                    {ag.title}
                  </h4>
                )}
                {ag.description && (
                  <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-zinc-400">
                    {ag.description}
                  </p>
                )}
                {ag.speaker && (
                  <p className="mt-1.5 font-mono text-[9px] tracking-widest text-zinc-500 uppercase sm:text-[10px]">
                    Speaker · <span className="font-bold text-zinc-300">{ag.speaker}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speakers Panel */}
      {speakers.length > 0 && (
        <div className="holographic-card rounded-2xl border border-white/5 bg-white/2 p-6 sm:p-8 backdrop-blur-md">
          <div className="mb-5">
            <SectionLabel accent="violet">Speakers</SectionLabel>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {speakers.map((spk) => (
              <div
                key={spk.id}
                className="hover:border-neon-violet/30 rounded-xl border border-white/5 bg-white/1 px-4 py-3.5 transition-colors"
              >
                <h5 className="font-heading text-sm font-bold text-white uppercase tracking-wide">
                  {spk.name}
                </h5>
                {spk.role && (
                  <p className="mt-0.5 text-xs text-zinc-400">{spk.role}</p>
                )}
                <p className="text-neon-lime mt-2 font-mono text-[9px] font-bold tracking-widest uppercase">
                  Keynote Speaker
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisites / Requirements */}
      {event.prerequisites && (
        <div className="holographic-card rounded-2xl border border-white/5 bg-white/2 p-6 sm:p-8 backdrop-blur-md">
          <div className="mb-5">
            <SectionLabel accent="lime">Requirements</SectionLabel>
          </div>
          <div className="space-y-2.5">
            {event.prerequisites
              .split('\n')
              .filter(Boolean)
              .map((line, i) => (
                <div
                  key={i}
                  className="border-white/5 hover:border-neon-lime/30 hover:bg-white/2 flex gap-3.5 rounded-xl border p-3 transition-all duration-300"
                >
                  <span className="text-neon-lime/60 shrink-0 font-mono text-[9px] font-bold tracking-widest sm:text-[10px]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
                    {line.trim()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tags Topics */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <SectionLabel accent="violet">Topics</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="border-neon-violet/20 bg-neon-violet/10 text-neon-violet inline-block rounded-full border px-3.5 py-1 font-mono text-[9px] font-bold tracking-widest uppercase sm:text-[10px]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
