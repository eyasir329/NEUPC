/**
 * @file Event row component
 * @module EventRow
 */

'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Edit2, Trash2 } from 'lucide-react';
import { driveImageUrl } from '@/app/_lib/utils/utils';
import { EVENT_STATUS_CONFIG } from './eventConstants';

/**
 * Shared event row card used by all role views.
 *
 * Props:
 *   event       — enriched event object (from enrichEvent())
 *   index       — list position, drives stagger delay
 *   onClick     — fires when the row is clicked (detail view)
 *   onEdit      — (optional) renders Edit button for manage roles
 *   onDelete    — (optional) renders Delete button for manage roles
 *   showStatus  — show DB status badge instead of bucket badge (admin/exec)
 *   showCover   — show cover image instead of date block (admin/exec)
 *   showRegs    — show registration count (observer / manage roles)
 */
export default function EventRow({
  event,
  index = 0,
  onClick,
  onEdit,
  onDelete,
  showStatus = false,
  showCover = false,
  showRegs = false,
  actionSlot,
}) {
  const dateObj = new Date(event.start_date || new Date());
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });

  const sc = showStatus
    ? EVENT_STATUS_CONFIG[event.status] || EVENT_STATUS_CONFIG.draft
    : null;

  const leftBarColor =
    event._bucket === 'ongoing'
      ? 'bg-blue-500/50'
      : event._bucket === 'upcoming' || event._isUpcoming
        ? 'bg-emerald-500/50'
        : event.status === 'draft'
          ? 'bg-gray-500/50'
          : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      onClick={onClick}
      className={`group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/8 bg-gray-900 p-5 transition-all duration-300 hover:border-white/12 hover:bg-white/2 sm:flex-row ${onClick ? 'cursor-pointer' : ''}`}
    >
      {leftBarColor && (
        <div className={`absolute top-0 left-0 h-full w-1 ${leftBarColor}`} />
      )}

      {/* Left: cover image or date block */}
      {showCover && event.cover_image ? (
        <div className="z-10 hidden h-14 w-14 shrink-0 overflow-hidden rounded-xl sm:block">
          <img
            src={driveImageUrl(event.cover_image)}
            alt={event.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/placeholder-event.svg';
            }}
            className="h-full w-full object-cover opacity-70"
          />
        </div>
      ) : (
        <div className="z-10 hidden h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-white/5 bg-gray-900/50 shadow-inner transition-all group-hover:border-violet-500/40 sm:flex">
          <span className="mb-1 text-[9px] leading-none font-bold tracking-widest text-violet-400 uppercase">
            {month}
          </span>
          <span className="text-xl leading-none font-bold text-white">
            {day}
          </span>
        </div>
      )}

      {/* Center: badges + title + meta */}
      <div className="z-10 flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {event._type && (
            <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-violet-300 uppercase">
              {event._type}
            </span>
          )}

          {event._bucket === 'ongoing' && (
            <span className="flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />{' '}
              Live
            </span>
          )}
          {(event._bucket === 'upcoming' || event._isUpcoming) &&
            event._bucket !== 'ongoing' &&
            !showStatus && (
              <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{' '}
                Open
              </span>
            )}
        </div>

        <h3 className="mb-1 line-clamp-2 text-base leading-snug font-semibold text-gray-200 transition-colors group-hover:text-violet-400">
          {event.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-600" /> {event._date}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-gray-600" /> {event._time}
          </div>
          {event._location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-gray-600" />
              <span className="max-w-37.5 truncate">{event._location}</span>
            </div>
          )}
          {showRegs && (
            <div className="flex items-center gap-1.5">
              <Users size={13} className="text-gray-600" />
              {event.registrationCount || 0} registered
            </div>
          )}
        </div>
      </div>

      {/* Right: status pill or action buttons */}
      <div className="z-10 flex w-full shrink-0 items-center justify-between gap-3 border-t border-white/6 pt-3 sm:ml-4 sm:w-auto sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
        {actionSlot ?? (
          <>
            {!onEdit && !onDelete && (
              <span
                className={`rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide capitalize ${
                  showStatus && sc
                    ? sc.badge
                    : 'border-white/8 bg-white/3 text-gray-400'
                }`}
              >
                {showStatus && sc ? sc.label : event._bucket}
              </span>
            )}
            {(onEdit || onDelete) && (
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(event);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/5"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(event);
                    }}
                    className="flex items-center justify-center rounded-lg border border-red-500/20 p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
