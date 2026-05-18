'use client';

import {
  ChevronLeft, Tag, Globe, Ticket, FileText, Calendar, Clock, MapPin, Star,
} from 'lucide-react';
import { GlassCard } from '@/app/account/member/_components/_ui';
import { EVENT_STATUS_CONFIG } from './eventConstants';
import { driveImageUrl } from '@/app/_lib/utils';
import EventContentRenderer from './EventContentRenderer';

/**
 * Shared read-only event detail page layout for all non-manage roles.
 *
 * Props:
 *   event       — enriched event object
 *   onBack      — callback to return to list
 *   rightSlot   — React node rendered in the right column (reg stats, register CTA, etc.)
 *   topSlot     — React node rendered in top-right of top bar (optional)
 */
export default function EventContentDetail({ event, onBack, rightSlot, topSlot }) {
  const sc = EVENT_STATUS_CONFIG[event.status] || EVENT_STATUS_CONFIG.draft;

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="flex flex-col gap-5 pb-16">

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 rounded-lg border border-white/8 bg-gray-900 px-3.5 py-2 text-xs font-semibold text-gray-300 transition-all hover:bg-white/6 hover:text-white active:scale-95">
          <ChevronLeft size={14} /> Back to Events
        </button>
        {topSlot && <div className="flex items-center gap-2">{topSlot}</div>}
      </div>

      {/* Banner */}
      {event.banner_image && (
        <div className="overflow-hidden rounded-2xl border border-white/8">
          <img src={driveImageUrl(event.banner_image)} alt={event.title}
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            className="h-48 w-full object-cover opacity-75 sm:h-64" />
        </div>
      )}

      {/* Main grid: content 3/5, sidebar 2/5 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* LEFT: content */}
        <div className="flex flex-col gap-5 lg:col-span-3">

          {/* Header */}
          <div className="flex items-start gap-4">
            {event.cover_image ? (
              <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:block">
                <img src={driveImageUrl(event.cover_image)} alt=""
                  onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                  className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="mt-0.5 hidden h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-purple-500/20 sm:flex">
                <span className="text-[9px] font-bold tracking-widest text-violet-400 uppercase">
                  {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-2xl font-bold text-white">{new Date(event.start_date).getDate()}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${sc.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} /> {sc.label}
                </span>
                {event.category && (
                  <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-violet-300 uppercase">
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
              <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">{event.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-500" /> {fmtDate(event.start_date)}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-500" /> {new Date(event.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                {event.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-500" /> {event.location}</span>}
              </div>
            </div>
          </div>

          {event.description && (
            <GlassCard>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <FileText className="h-3.5 w-3.5 text-violet-400" /> About
              </h3>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-300">{event.description}</p>
            </GlassCard>
          )}

          {event.content && (
            <GlassCard>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <FileText className="h-3.5 w-3.5 text-blue-400" /> Full Details / Schedule
              </h3>
              <EventContentRenderer content={event.content} />
            </GlassCard>
          )}

          {event.tags?.length > 0 && (
            <GlassCard>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <Tag className="h-3.5 w-3.5 text-violet-400" /> Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}

          {(event.external_url || event.registration_url) && (
            <GlassCard>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Links
              </h3>
              <div className="flex flex-col gap-2">
                {event.external_url && (
                  <a href={event.external_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:underline">
                    <Globe className="h-4 w-4 shrink-0" /> External Link
                  </a>
                )}
                {event.registration_url && (
                  <a href={event.registration_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:underline">
                    <Ticket className="h-4 w-4 shrink-0" /> Registration Link
                  </a>
                )}
              </div>
            </GlassCard>
          )}
        </div>

        {/* RIGHT: role-specific sidebar */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Common detail card */}
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Event Details</p>
            <div className="flex flex-col divide-y divide-white/6">
              {[
                { label: 'Venue', value: event.venue_type ? event.venue_type.charAt(0).toUpperCase() + event.venue_type.slice(1) : '—' },
                { label: 'Location', value: event.location || '—' },
                ...(event.end_date ? [{ label: 'End Date', value: fmtDate(event.end_date) }] : []),
                { label: 'Participation', value: event.participation_type === 'team' ? `Team · ${event.team_size ?? '?'} members` : 'Individual' },
                { label: 'Eligibility', value: event.eligibility || 'All' },
                ...(event.prerequisites ? [{ label: 'Prerequisites', value: event.prerequisites }] : []),
                ...(event.registration_required ? [{ label: 'Registration', value: 'Required' }] : []),
                ...(event.registration_deadline ? [{ label: 'Reg. Deadline', value: fmtDateTime(event.registration_deadline) }] : []),
                ...(event.max_participants ? [{ label: 'Max Participants', value: event.max_participants }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2">
                  <span className="shrink-0 text-xs text-gray-500">{label}</span>
                  <span className="text-right text-xs font-medium text-gray-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Role-specific slot (register button, membership CTA, reg stats, etc.) */}
          {rightSlot}
        </div>
      </div>
    </div>
  );
}
