'use client';

import { useState, useTransition } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Star,
  Edit3,
  Trash2,
  Eye,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Globe,
  Wifi,
  GitMerge,
} from 'lucide-react';
import {
  getStatusConfig,
  getCategoryConfig,
  getVenueConfig,
  formatEventDate,
} from './eventConfig';
import {
  updateEventStatusAction,
  toggleEventFeaturedAction,
  deleteEventAction,
} from '@/app/_lib/event-actions';

const ORDERED_STATUSES = [
  'draft',
  'upcoming',
  'ongoing',
  'completed',
  'cancelled',
];

const VenueIcon = ({ type }) => {
  if (type === 'online') return <Wifi className="h-3 w-3" />;
  if (type === 'hybrid') return <GitMerge className="h-3 w-3" />;
  return <MapPin className="h-3 w-3" />;
};

export default function EventCard({ event, onEdit, onViewRegistrations }) {
  const [isPending, startTransition] = useTransition();
  const [featuredPending, setFeaturedPending] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [flash, setFlash] = useState(null); // 'featured' | 'status'

  const sc = getStatusConfig(event.status);
  const cc = getCategoryConfig(event.category);
  const vc = getVenueConfig(event.venue_type);

  function showFlash(type) {
    setFlash(type);
    setTimeout(() => setFlash(null), 1800);
  }

  async function handleStatusChange(newStatus) {
    setStatusOpen(false);
    if (newStatus === event.status) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', event.id);
      fd.set('status', newStatus);
      await updateEventStatusAction(fd);
      showFlash('status');
    });
  }

  async function handleToggleFeatured() {
    setFeaturedPending(true);
    const fd = new FormData();
    fd.set('id', event.id);
    fd.set('featured', String(!event.is_featured));
    await toggleEventFeaturedAction(fd);
    setFeaturedPending(false);
    showFlash('featured');
  }

  async function handleDelete() {
    setDeletePending(true);
    const fd = new FormData();
    fd.set('id', event.id);
    await deleteEventAction(fd);
    setDeletePending(false);
  }

  const participantFill =
    event.max_participants && event.registrationCount
      ? Math.min(
          100,
          Math.round((event.registrationCount / event.max_participants) * 100)
        )
      : null;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${sc.cardBg} ${sc.cardBorder}`}
    >
      {/* top accent bar */}
      <div className={`h-1 w-full bg-linear-to-r ${sc.gradient}`} />

      {/* cover image / placeholder */}
      <div className="relative h-36 w-full overflow-hidden">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-linear-to-br text-5xl ${cc.placeholder}`}
          >
            {cc.icon}
          </div>
        )}

        {/* featured star overlay */}
        <button
          onClick={handleToggleFeatured}
          disabled={featuredPending}
          className={`absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full transition-all ${
            event.is_featured
              ? 'bg-amber-500/80 text-white backdrop-blur-sm'
              : 'bg-black/40 text-gray-400 opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:text-amber-400'
          }`}
          title={
            event.is_featured ? 'Remove from featured' : 'Mark as featured'
          }
        >
          {featuredPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star
              className="h-3.5 w-3.5"
              fill={event.is_featured ? 'currentColor' : 'none'}
            />
          )}
        </button>

        {/* category badge overlay */}
        {event.category && (
          <span
            className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${cc.badge}`}
          >
            {cc.icon} {event.category}
          </span>
        )}
      </div>

      {/* card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* title + status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-sm leading-snug font-bold text-white">
            {event.title}
          </h3>

          {/* status + dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setStatusOpen((p) => !p)}
              disabled={isPending}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold tracking-wide uppercase transition-all ${sc.badge} ${isPending ? 'opacity-50' : 'hover:opacity-80'}`}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              )}
              {flash === 'status' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : (
                <>
                  {sc.label}
                  <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                </>
              )}
            </button>

            {statusOpen && (
              <div className="absolute top-full right-0 z-20 mt-1 min-w-32 overflow-hidden rounded-xl border border-white/10 bg-[#1a1d27] shadow-2xl">
                {ORDERED_STATUSES.map((s) => {
                  const scOpt = getStatusConfig(s);
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5 ${
                        s === event.status ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${scOpt.dot} shrink-0`}
                      />
                      <span className="capitalize">{scOpt.label}</span>
                      {s === event.status && (
                        <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* description snippet */}
        {event.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
            {event.description}
          </p>
        )}

        {/* meta info */}
        <div className="space-y-1.5">
          {/* start date */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-600" />
            <span>{formatEventDate(event.start_date)}</span>
            {event.end_date && event.end_date !== event.start_date && (
              <span className="text-gray-600">
                → {formatEventDate(event.end_date)}
              </span>
            )}
          </div>

          {/* location + venue */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <VenueIcon type={event.venue_type} />
            <span className="truncate">{event.location}</span>
            <span
              className={`ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${vc.badge}`}
            >
              {vc.icon} {vc.label}
            </span>
          </div>
        </div>

        {/* registrations bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Users className="h-3.5 w-3.5 text-gray-600" />
              <span>
                <span className="font-semibold text-white">
                  {event.registrationCount}
                </span>
                {event.max_participants ? (
                  <span className="text-gray-600">
                    {' '}
                    / {event.max_participants}
                  </span>
                ) : (
                  <span className="text-gray-600"> registered</span>
                )}
              </span>
            </div>
            {event.attendedCount > 0 && (
              <span className="text-[10px] text-emerald-500">
                {event.attendedCount} attended
              </span>
            )}
          </div>

          {/* progress bar */}
          {participantFill !== null && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full bg-linear-to-r transition-all ${
                  participantFill >= 90
                    ? 'from-red-500 to-rose-500'
                    : participantFill >= 70
                      ? 'from-amber-500 to-yellow-500'
                      : 'from-blue-500 to-cyan-500'
                }`}
                style={{ width: `${participantFill}%` }}
              />
            </div>
          )}
        </div>

        {/* tags */}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-500"
              >
                #{tag}
              </span>
            ))}
            {event.tags.length > 4 && (
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-600">
                +{event.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* creator */}
        <div className="flex items-center gap-2 border-t border-white/5 pt-2.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[9px] font-bold text-gray-400">
            {event.creatorAvatar ? (
              <img
                src={event.creatorAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              (event.creatorName ?? 'A').charAt(0).toUpperCase()
            )}
          </div>
          <span className="truncate text-[10px] text-gray-600">
            by {event.creatorName ?? 'Admin'}
          </span>
          {event.is_featured && (
            <span className="ml-auto rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
              ★ Featured
            </span>
          )}
        </div>
      </div>

      {/* action footer */}
      <div className="flex items-center gap-1.5 border-t border-white/5 p-3">
        {/* view registrations */}
        <button
          onClick={() => onViewRegistrations(event)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-white/8 hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
          Registrations
          {event.registrationCount > 0 && (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-gray-300">
              {event.registrationCount}
            </span>
          )}
        </button>

        {/* edit */}
        <button
          onClick={() => onEdit(event)}
          className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-gray-400 transition-colors hover:bg-blue-500/15 hover:text-blue-400"
          title="Edit event"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>

        {/* delete */}
        {deleteConfirm ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deletePending}
              className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-2 text-[10px] font-semibold text-red-400 transition-colors hover:bg-red-500/30"
            >
              {deletePending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Confirm'
              )}
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="rounded-lg bg-white/5 px-2 py-2 text-[10px] text-gray-500 transition-colors hover:bg-white/8"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-gray-400 transition-colors hover:bg-red-500/15 hover:text-red-400"
            title="Delete event"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* click-outside closer for status dropdown */}
      {statusOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setStatusOpen(false)}
        />
      )}
    </div>
  );
}
