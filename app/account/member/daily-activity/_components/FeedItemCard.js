/**
 * @file Shared renderer for read-only activity-feed items (contests, events,
 *   bootcamp deadlines, sessions). Replaces the near-identical card markup
 *   that was previously hand-written in TasksView and CalendarView. Category
 *   styling is sourced once from {@link getFeedMeta}.
 *
 *   Variants:
 *     • "row"  — full-width list/agenda row with title, meta chips, and an
 *                optional "Open" link. Used by the Tasks list and the
 *                calendar day-detail panel.
 *     • "chip" — compact pill (emoji + truncated title) for dense calendar
 *                cells; pass `link` to show a trailing open-link icon
 *                (weekly agenda) or omit it (month grid).
 *
 * @module daily-activity/FeedItemCard
 */

'use client';

import { Link as LinkIcon, Video, BookOpen, MapPin } from 'lucide-react';
import { getFeedMeta, getFeedItemUrl } from './utils';

/**
 * @param {object}  props
 * @param {object}  props.task            The feed item.
 * @param {'row'|'chip'} [props.variant]  Layout variant (default "row").
 * @param {boolean} [props.link]          Show the open-link affordance (chip).
 * @param {(id:string)=>void} [props.onSelect]  Click handler (opens detail).
 */
function fmt24(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

const DHAKA_TZ = 'Asia/Dhaka';

function fmtDate(dateStr) {
  if (!dateStr) return '';
  // dateStr is already Dhaka-local YYYY-MM-DD from the feed route — parse at noon to avoid DST edge cases
  const d = new Date(dateStr + 'T12:00:00+06:00');
  return d.toLocaleDateString('en-US', { timeZone: DHAKA_TZ, month: 'short', day: 'numeric' });
}

// Format a full ISO datetime string as "Jun 7, 2026, 11:59 PM" in Dhaka time
function fmtDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-US', {
    timeZone: DHAKA_TZ,
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// Format a Dhaka-local date string + HH:MM time as "Jun 1, 10:00 AM"
function fmtDateWithTime(dateStr, timeHHMM) {
  if (!dateStr) return null;
  const base = new Date(dateStr + 'T12:00:00+06:00');
  const label = base.toLocaleDateString('en-US', { timeZone: DHAKA_TZ, month: 'short', day: 'numeric' });
  if (!timeHHMM) return label;
  return `${label}, ${fmt24(timeHHMM)}`;
}

export default function FeedItemCard({ task, variant = 'row', link = false, onSelect, accentColor }) {
  const meta = getFeedMeta(task);
  if (!meta) return null;

  const timeRange = task.time
    ? task.endTime
      ? `${task.time} – ${fmt24(task.endTime)}`
      : task.time
    : null;

  const url = getFeedItemUrl(task);
  const handleClick = onSelect ? () => onSelect(task.id) : undefined;

  // accentColor overrides the default meta.accent when layer color is customised.
  const chipStyle = accentColor
    ? { borderColor: accentColor + '60', backgroundColor: accentColor + '20', color: accentColor }
    : undefined;
  const rowStyle = accentColor
    ? { borderColor: accentColor + '40', backgroundColor: accentColor + '12' }
    : undefined;

  if (variant === 'chip') {
    return (
      <div
        onClick={handleClick}
        style={chipStyle}
        className={`flex items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${!accentColor ? meta.accent : ''} ${link ? 'cursor-pointer transition hover:brightness-110' : ''}`}
      >
        <span className="shrink-0">{meta.emoji}</span>
        <span className="flex-1 truncate">{task.title}</span>
        {link && url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 rounded p-0.5 transition hover:bg-white/10"
          >
            <LinkIcon className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    );
  }

  // variant === 'row'
  return (
    <div
      onClick={handleClick}
      style={rowStyle}
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm transition ${!accentColor ? meta.accent : 'border-white/10'} ${handleClick ? 'cursor-pointer hover:brightness-110' : ''}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 text-base leading-none">{meta.emoji}</span>
        <div className="min-w-0 flex-1">
          <span className={`block truncate text-xs font-bold leading-tight ${meta.title}`}>
            {task.title}
          </span>
          {task.description && (
            <p className="mt-0.5 truncate text-[10px] leading-snug text-gray-400">
              {task.description}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold text-gray-400">
            <span className={`rounded border px-1.5 py-0.5 ${meta.accent}`}>
              {meta.emoji} {meta.label.toUpperCase()}
            </span>
            {task.isContest && task.contestPlatform && (
              <span className="capitalize">{task.contestPlatform}</span>
            )}
            {task.bootcampTitle && <span>{task.bootcampTitle}</span>}
            {task.eventCategory && <span className="capitalize">{task.eventCategory}</span>}
            {task.isContest && task.contestTime && <span>🕒 {task.contestTime}</span>}
            {task.feedCategory === 'task' && task.availableFrom && (
              <span className="flex items-center gap-1">
                <span>📂</span>
                <span>{fmtDateWithTime(task.availableFrom, task.startTime)}</span>
              </span>
            )}
            {task.feedCategory === 'task' && task.dueDate && (
              <span className="flex items-center gap-1">
                <span>🕐</span>
                <span>
                  {fmtDateTime(
                    task.endTime
                      ? `${task.dueDate}T${task.endTime}:00+06:00`
                      : `${task.dueDate}T00:00:00+06:00`
                  )}
                </span>
              </span>
            )}
            {!task.isContest && task.feedCategory !== 'task' && timeRange && <span>🕒 {timeRange}</span>}
            {task.contestDuration && <span>⏳ {task.contestDuration}</span>}
            {!task.isContest && task.feedCategory !== 'task' && typeof task.durationMin === 'number' && (
              <span>⏳ {task.durationMin >= 60 ? `${Math.floor(task.durationMin / 60)}h${task.durationMin % 60 ? ` ${task.durationMin % 60}m` : ''}` : `${task.durationMin}m`}</span>
            )}
            {task.location && (
              <span className="flex items-center gap-0.5"><MapPin className="h-2 w-2" />{task.location}</span>
            )}
            {task.difficulty && <span className="capitalize">{task.difficulty}</span>}
            {typeof task.points === 'number' && (
              <span>
                {typeof task.pointsEarned === 'number' ? `${task.pointsEarned}/${task.points}` : task.points} pts
              </span>
            )}
            {task.submissionStatus && task.submissionStatus !== 'pending' && (
              <span className={task.submissionStatus === 'accepted' ? 'text-emerald-400' : 'text-amber-400'}>
                {task.submissionStatus}
              </span>
            )}
            {task.feedCategory === 'session' && task.status && task.status !== 'scheduled' && (
              <span className="capitalize">{task.status}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {task.feedCategory === 'session' && task.url && (
          <a
            href={task.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold text-sky-400 transition hover:brightness-110"
          >
            <Video className="h-3 w-3" />
            <span>Join</span>
          </a>
        )}
        {task.feedCategory === 'session' && task.recordingUrl && (
          <a
            href={task.recordingUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-400 transition hover:brightness-110"
          >
            <BookOpen className="h-3 w-3" />
            <span>Recording</span>
          </a>
        )}
        {url && task.feedCategory !== 'session' && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition hover:brightness-110 ${meta.accent}`}
          >
            <LinkIcon className="h-3 w-3" />
            <span>Open</span>
          </a>
        )}
      </div>
    </div>
  );
}
