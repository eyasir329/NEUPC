'use client';

import EventContentRenderer from './EventContentRenderer';

// Public-style flowing event content (no images).
// Mirrors the /events/[eventId] page layout: header, description + rich
// content, At a Glance, Agenda timeline, Speakers (text-only), Prerequisites,
// Tags. Shared by the in-account member/guest/mentor/advisor and
// admin/executive event detail views.

function fmtDateShort(d) {
  if (!d) return '';
  return new Date(d)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}
function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
function venueLabel(type) {
  return { online: 'Online', offline: 'In-Person', hybrid: 'Hybrid' }[type] || '';
}
function statusConfig(status) {
  const map = {
    draft: { label: 'Draft', dot: 'bg-zinc-600', text: 'text-zinc-400', badge: 'border-white/10 bg-white/5 text-zinc-400' },
    upcoming: { label: 'Upcoming', dot: 'bg-neon-lime animate-pulse', text: 'text-neon-lime', badge: 'border-neon-lime/30 bg-neon-lime/10 text-neon-lime' },
    ongoing: { label: 'Live Now', dot: 'bg-neon-violet animate-pulse', text: 'text-neon-violet', badge: 'border-neon-violet/30 bg-neon-violet/10 text-neon-violet' },
    completed: { label: 'Completed', dot: 'bg-zinc-600', text: 'text-zinc-500', badge: 'border-white/10 bg-white/5 text-zinc-400' },
    cancelled: { label: 'Cancelled', dot: 'bg-red-500', text: 'text-red-400', badge: 'border-red-500/20 bg-red-500/10 text-red-400' },
  };
  return map[status] || map.upcoming;
}

function SectionLabel({ accent = 'lime', children }) {
  const line = accent === 'violet' ? 'bg-neon-violet' : 'bg-neon-lime';
  const text = accent === 'violet' ? 'text-neon-violet' : 'text-neon-lime';
  return (
    <div className="flex items-center gap-3">
      <span className={`h-px w-6 shrink-0 ${line}`} />
      <span className={`font-mono text-[10px] font-bold tracking-[0.4em] uppercase sm:text-[11px] ${text}`}>
        {children}
      </span>
    </div>
  );
}

export default function EventPublicContent({ event }) {
  const sc = statusConfig(event.status);
  const duration = getDuration(event.start_date, event.end_date);
  const venue = venueLabel(event.venue_type);
  const tags = event.tags || [];
  const agenda = Array.isArray(event.agenda) ? event.agenda : [];
  const speakers = Array.isArray(event.speakers) ? event.speakers : [];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header (no image) */}
      <div className="holographic-card no-lift rounded-2xl p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[9px] font-bold tracking-widest uppercase sm:text-[10px] ${sc.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
          {event.category && (
            <span className="inline-flex min-h-[28px] items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[9px] tracking-widest text-zinc-400 uppercase sm:text-[10px]">
              {event.category}
            </span>
          )}
        </div>
        <h1 className="kinetic-headline font-heading text-[clamp(1.5rem,3vw+0.5rem,2.75rem)] font-black text-white uppercase [line-height:1.05]">
          {event.title}
        </h1>
        <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/8 pt-5 sm:flex sm:flex-wrap sm:gap-3">
          {event.start_date && (
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 sm:px-4">
              <span className="block font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase sm:text-[10px]">Date &amp; Time</span>
              <span className="mt-0.5 block font-heading text-[13px] font-bold text-white sm:text-sm">
                {fmtDateShort(event.start_date)}
                {fmtTime(event.start_date) ? ` · ${fmtTime(event.start_date)}` : ''}
              </span>
            </div>
          )}
          {event.location && (
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 sm:px-4">
              <span className="block font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase sm:text-[10px]">Location</span>
              <span className="mt-0.5 block font-heading text-[13px] font-bold text-white sm:text-sm">{event.location}</span>
            </div>
          )}
          {duration && (
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 sm:px-4">
              <span className="block font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase sm:text-[10px]">Duration</span>
              <span className="mt-0.5 block font-heading text-[13px] font-bold text-white sm:text-sm">{duration}</span>
            </div>
          )}
          {event.participation_type && (
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 sm:px-4">
              <span className="block font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase sm:text-[10px]">Format</span>
              <span className="mt-0.5 block font-heading text-[13px] font-bold text-white sm:text-sm">
                {event.participation_type === 'team'
                  ? `Team${event.team_size ? ` of ${event.team_size}` : ''}`
                  : 'Individual'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description + rich content */}
      {(event.description || event.content) && (
        <div className="holographic-card rounded-2xl p-5 sm:p-7">
          {event.description && (
            <p className="text-sm leading-[1.9] text-zinc-400 sm:text-base">{event.description}</p>
          )}
          {event.content && (
            <div className={event.description ? 'mt-5 border-t border-white/5 pt-5 sm:mt-6 sm:pt-6' : ''}>
              <EventContentRenderer content={event.content} />
            </div>
          )}
        </div>
      )}

      {/* At a Glance */}
      {(event.eligibility || venue || event.participation_type || event.category) && (
        <div className="holographic-card rounded-2xl p-5 sm:p-6">
          <div className="mb-5">
            <SectionLabel accent="violet">At a Glance</SectionLabel>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
            {event.category && (
              <div>
                <dt className="mb-1 font-mono text-[9px] tracking-widest text-zinc-600 uppercase sm:text-[10px]">Category</dt>
                <dd className="text-sm font-bold leading-snug text-white">{event.category}</dd>
              </div>
            )}
            {event.participation_type && (
              <div>
                <dt className="mb-1 font-mono text-[9px] tracking-widest text-zinc-600 uppercase sm:text-[10px]">Format</dt>
                <dd className="text-sm font-bold leading-snug text-white">
                  {event.participation_type === 'team'
                    ? `Team${event.team_size ? ` · ${event.team_size}` : ''}`
                    : 'Individual'}
                </dd>
              </div>
            )}
            {venue && (
              <div>
                <dt className="mb-1 font-mono text-[9px] tracking-widest text-zinc-600 uppercase sm:text-[10px]">Venue</dt>
                <dd className="text-sm font-bold leading-snug text-white">{venue}</dd>
              </div>
            )}
            {event.eligibility && (
              <div>
                <dt className="mb-1 font-mono text-[9px] tracking-widest text-zinc-600 uppercase sm:text-[10px]">Eligibility</dt>
                <dd className="text-sm font-bold leading-snug text-white">{event.eligibility}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Agenda timeline */}
      {agenda.length > 0 && (
        <div className="holographic-card rounded-2xl p-5 sm:p-7">
          <div className="mb-6">
            <SectionLabel accent="lime">Agenda</SectionLabel>
          </div>
          <div className="relative space-y-6 border-l border-white/10 pl-6">
            <span className="absolute top-1.5 bottom-1.5 left-0 w-px bg-gradient-to-b from-neon-lime/40 via-white/10 to-neon-violet/30" />
            {agenda.map((ag) => (
              <div key={ag.id} className="relative">
                <span className="absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#05060B] bg-neon-lime shadow-[0_0_12px_rgba(182,243,107,0.5)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-black/50" />
                </span>
                {ag.time && (
                  <span className="font-mono text-[10px] font-bold tracking-widest text-neon-lime uppercase">
                    {ag.time}
                  </span>
                )}
                {ag.title && (
                  <h4 className="mt-0.5 font-heading text-sm font-bold text-white">{ag.title}</h4>
                )}
                {ag.description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{ag.description}</p>
                )}
                {ag.speaker && (
                  <p className="mt-1.5 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    Speaker · <span className="font-bold text-zinc-300">{ag.speaker}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speakers (text-only) */}
      {speakers.length > 0 && (
        <div className="holographic-card rounded-2xl p-5 sm:p-7">
          <div className="mb-5">
            <SectionLabel accent="violet">Speakers</SectionLabel>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {speakers.map((spk) => (
              <div
                key={spk.id}
                className="rounded-xl border border-white/8 bg-white/3 px-4 py-3.5 transition-colors hover:border-neon-violet/30"
              >
                <h5 className="font-heading text-sm font-bold text-white">{spk.name}</h5>
                {spk.role && <p className="mt-0.5 text-[13px] text-zinc-500">{spk.role}</p>}
                <p className="mt-1.5 font-mono text-[9px] font-bold tracking-widest text-neon-lime uppercase">
                  Keynote Presenter
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {event.prerequisites && (
        <div className="holographic-card rounded-2xl p-5 sm:p-7">
          <div className="mb-5">
            <SectionLabel accent="lime">Requirements</SectionLabel>
          </div>
          <div className="space-y-2">
            {event.prerequisites
              .split('\n')
              .filter(Boolean)
              .map((line, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border-l-2 border-neon-lime/20 py-2.5 pl-4 transition-all hover:border-neon-lime/50 hover:bg-neon-lime/5"
                >
                  <span className="shrink-0 font-mono text-[9px] font-bold tracking-widest text-neon-lime/60 sm:text-[10px]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm leading-relaxed text-zinc-400">{line.trim()}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <div className="mb-3">
            <SectionLabel accent="violet">Topics</SectionLabel>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full border border-neon-violet/20 bg-neon-violet/10 px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-neon-violet uppercase"
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
