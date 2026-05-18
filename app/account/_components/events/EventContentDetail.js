'use client';

import { ChevronLeft, Tag, Globe, FileText, Calendar, Clock, MapPin, Star, Info } from 'lucide-react';
import { EVENT_STATUS_CONFIG } from './eventConstants';
import { driveImageUrl } from '@/app/_lib/utils';
import EventContentRenderer from './EventContentRenderer';

/**
 * Shared read-only event detail layout for member / guest / mentor / advisor.
 *
 * Props:
 *   event     — enriched event object
 *   onBack    — callback to return to list
 *   rightSlot — React node in the right column (reg stats, register CTA, etc.)
 *   topSlot   — React node in the top-right action bar (optional)
 */
export default function EventContentDetail({ event, onBack, rightSlot, topSlot }) {
  const sc = EVENT_STATUS_CONFIG[event.status] || EVENT_STATUS_CONFIG.draft;

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const detailRows = [
    { label: 'Venue',         value: event.venue_type ? event.venue_type.charAt(0).toUpperCase() + event.venue_type.slice(1) : '—' },
    { label: 'Location',      value: event.location || '—' },
    ...(event.end_date        ? [{ label: 'End Date',      value: fmtDate(event.end_date) }]               : []),
    { label: 'Participation', value: event.participation_type === 'team' ? `Team · ${event.team_size ?? '?'} members` : 'Individual' },
    { label: 'Eligibility',   value: event.eligibility || 'All' },
    ...(event.prerequisites   ? [{ label: 'Prerequisites',  value: event.prerequisites }]                  : []),
    ...(event.registration_required ? [{ label: 'Registration', value: 'Required' }]                       : []),
    ...(event.registration_deadline ? [{ label: 'Reg. Deadline', value: fmtDateTime(event.registration_deadline) }] : []),
    ...(event.max_participants ? [{ label: 'Capacity',      value: event.max_participants }]               : []),
  ];

  return (
    <div className="flex flex-col gap-5 pb-16">

      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white active:scale-95">
          <ChevronLeft size={14} /> Back to Events
        </button>
        <div className="flex items-center gap-2">
          <a href={`/events/${event.slug || event.id}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white">
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Public Page</span>
          </a>
          {topSlot}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* LEFT col-span-2 */}
        <div className="flex flex-col gap-5 xl:col-span-2">

          {/* Header card */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-colors hover:border-slate-700/80 md:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-start gap-5">
              {event.cover_image ? (
                <div className="hidden h-[130px] w-[130px] shrink-0 overflow-hidden rounded-xl border border-slate-700 sm:block">
                  <img src={driveImageUrl(event.cover_image)} alt={event.title}
                    onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                    className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="hidden h-[130px] w-[130px] shrink-0 flex-col items-center justify-center rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-900/40 to-violet-900/40 sm:flex">
                  <span className="text-[9px] font-bold tracking-widest text-indigo-400 uppercase">
                    {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-3xl font-bold text-white">{new Date(event.start_date).getDate()}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${sc.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} /> {sc.label}
                  </span>
                  {event.category && (
                    <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
                      {event.category}
                    </span>
                  )}
                  {event.is_featured && (
                    <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      <Star className="h-2.5 w-2.5" /> Featured
                    </span>
                  )}
                  {event._bucket === 'ongoing' && (
                    <span className="flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" /> Live
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{event.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-500" /> {fmtDate(event.start_date)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-500" /> {new Date(event.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  {event.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {event.location}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          {event.description && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-colors hover:border-slate-700/80">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Info className="h-3.5 w-3.5 text-indigo-400" /> About
              </h3>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-300">{event.description}</p>
            </div>
          )}

          {/* Full content */}
          {event.content && (
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-colors hover:border-slate-700/80">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/10 blur-3xl" />
              <h3 className="relative mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <FileText className="h-3.5 w-3.5 text-indigo-400" /> Full Details / Schedule
              </h3>
              <div className="relative">
                <EventContentRenderer content={event.content} />
              </div>
            </div>
          )}

          {/* Tags */}
          {event.tags?.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:border-slate-700/80">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Tag className="h-3.5 w-3.5 text-indigo-400" /> Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-300">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT col-span-1 */}
        <div className="flex flex-col gap-4 xl:col-span-1">

          {/* Common event details widget */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 transition-colors hover:border-slate-700/80">
            <div className="border-b border-slate-800 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Event Details</span>
            </div>
            <div className="divide-y divide-slate-800/60">
              {detailRows.map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-slate-800/40">
                  <span className="shrink-0 text-xs text-slate-500">{label}</span>
                  <span className="text-right text-xs font-semibold text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Role-specific slot */}
          {rightSlot}
        </div>
      </div>
    </div>
  );
}
