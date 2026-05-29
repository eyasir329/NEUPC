'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
import EventPublicContent from './EventPublicContent';

/**
 * Shared read-only event detail layout for member / guest / mentor / advisor.
 * Renders the public-style flowing content (no images) plus a details sidebar
 * and any role-specific registration slot.
 *
 * Props:
 *   event     — enriched event object
 *   onBack    — callback to return to list
 *   rightSlot — React node in the right column (registration CTA / stats)
 *   topSlot   — React node in the top-right action bar (optional)
 */

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
}
function fmtDateTime(d) {
  return d
    ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
}

export default function EventContentDetail({ event, onBack, rightSlot, topSlot }) {
  const detailRows = [
    { label: 'Venue', value: event.venue_type ? event.venue_type.charAt(0).toUpperCase() + event.venue_type.slice(1) : '—' },
    { label: 'Location', value: event.location || '—' },
    ...(event.end_date ? [{ label: 'End Date', value: fmtDate(event.end_date) }] : []),
    { label: 'Participation', value: event.participation_type === 'team' ? `Team · ${event.team_size ?? '?'} members` : 'Individual' },
    { label: 'Eligibility', value: event.eligibility || 'All' },
    ...(event.prerequisites ? [{ label: 'Prerequisites', value: event.prerequisites }] : []),
    ...(event.registration_required ? [{ label: 'Registration', value: 'Required' }] : []),
    ...(event.registration_deadline ? [{ label: 'Reg. Deadline', value: fmtDateTime(event.registration_deadline) }] : []),
    ...(event.max_participants ? [{ label: 'Capacity', value: event.max_participants }] : []),
  ];

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2 font-heading text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-all hover:border-neon-lime/30 hover:text-neon-lime active:scale-95 sm:text-[11px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Events
        </button>
        <div className="flex items-center gap-2">
          <a
            href={`/events/${event.slug || event.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/3 px-4 py-2 font-heading text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-all hover:border-neon-lime/30 hover:text-neon-lime sm:text-[11px]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Public Page</span>
          </a>
          {topSlot}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Main content */}
        <div className="order-last lg:order-first lg:col-span-8">
          <EventPublicContent event={event} />
        </div>

        {/* Sidebar */}
        <div className="order-first lg:order-last lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-6">
            {/* Event details */}
            <div className="holographic-card no-lift rounded-2xl p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-6 shrink-0 bg-neon-lime" />
                <span className="font-mono text-[10px] font-bold tracking-[0.4em] text-neon-lime uppercase sm:text-[11px]">
                  Details
                </span>
              </div>
              <ul>
                {detailRows.map(({ label, value }) => (
                  <li
                    key={label}
                    className="flex items-start justify-between gap-4 border-b border-white/5 py-3 last:border-0 last:pb-0"
                  >
                    <span className="shrink-0 font-mono text-[9px] tracking-widest text-zinc-500 uppercase sm:text-[10px]">
                      {label}
                    </span>
                    <span className="text-right font-heading text-[13px] font-bold leading-snug text-white sm:text-sm">
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Role-specific slot */}
            {rightSlot}
          </div>
        </div>
      </div>
    </div>
  );
}
