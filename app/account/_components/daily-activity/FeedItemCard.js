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
import { getFeedMeta, getFeedItemUrl, fmt24 } from './utils';

/**
 * @param {object}  props
 * @param {object}  props.task            The feed item.
 * @param {'row'|'chip'} [props.variant]  Layout variant (default "row").
 * @param {boolean} [props.link]          Show the open-link affordance (chip).
 * @param {(id:string)=>void} [props.onSelect]  Click handler (opens detail).
 */

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
      ? `${fmt24(task.time)} – ${fmt24(task.endTime)}`
      : fmt24(task.time)
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
  const ac = accentColor || '#64748b';

  // Build meta chips array
  const chips = [];
  if (task.isContest && task.contestPlatform) chips.push({ text: task.contestPlatform, capitalize: true });
  if (task.bootcampTitle) chips.push({ text: task.bootcampTitle });
  if (task.eventCategory) chips.push({ text: task.eventCategory, capitalize: true });
  if (task.isContest && task.contestTime) chips.push({ text: `🕒 ${task.contestTime}` });
  if (task.feedCategory === 'task' && task.availableFrom) chips.push({ text: `📂 ${fmtDateWithTime(task.availableFrom, task.startTime)}` });
  if (task.feedCategory === 'task' && task.dueDate) {
    chips.push({ text: `🕐 ${fmtDateTime(task.endTime ? `${task.dueDate}T${task.endTime}:00+06:00` : `${task.dueDate}T00:00:00+06:00`)}` });
  }
  if (!task.isContest && task.feedCategory !== 'task' && timeRange) chips.push({ text: `🕒 ${timeRange}` });
  if (task.contestDuration) chips.push({ text: `⏳ ${task.contestDuration}` });
  if (!task.isContest && task.feedCategory !== 'task' && typeof task.durationMin === 'number') {
    chips.push({ text: `⏳ ${task.durationMin >= 60 ? `${Math.floor(task.durationMin / 60)}h${task.durationMin % 60 ? ` ${task.durationMin % 60}m` : ''}` : `${task.durationMin}m`}` });
  }
  if (task.location) chips.push({ text: task.location, icon: 'pin' });
  if (task.difficulty) chips.push({ text: task.difficulty, capitalize: true });
  if (typeof task.points === 'number') chips.push({ text: `${typeof task.pointsEarned === 'number' ? `${task.pointsEarned}/${task.points}` : task.points} pts` });
  if (task.submissionStatus && task.submissionStatus !== 'pending') chips.push({ text: task.submissionStatus, accent: task.submissionStatus === 'accepted' ? 'emerald' : 'amber' });
  if (task.feedCategory === 'session' && task.status && task.status !== 'scheduled') chips.push({ text: task.status, capitalize: true });

  return (
    <div
      onClick={handleClick}
      style={{ borderColor: ac + '2e', backgroundColor: ac + '0a' }}
      className={`relative flex items-start gap-3 pl-4 pr-3 py-3 border rounded-2xl group select-none transition-all duration-150 hover:translate-x-0.5 hover:brightness-110 ${handleClick ? 'cursor-pointer' : ''}`}
    >
      {/* Left accent bar */}
      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full" style={{ backgroundColor: ac }} />

      {/* Category icon */}
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm mt-0.5"
        style={{ backgroundColor: ac + '20' }}
      >
        {meta.emoji}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] font-bold text-slate-100 truncate leading-snug flex-1" title={task.title}>
            {task.title}
          </span>
          <span
            className="text-[7.5px] font-black font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-md shrink-0"
            style={{ color: ac, backgroundColor: ac + '18', borderColor: ac + '30' }}
          >
            {meta.label}
          </span>
        </div>

        {task.description && (
          <p className="mt-0.5 truncate text-[10px] leading-snug text-slate-400">{task.description}</p>
        )}

        {chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {chips.map((c, i) => (
              <span
                key={`feed-chip-${i}`}
                className={`inline-flex items-center gap-0.5 text-[8.5px] font-semibold text-slate-400 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-md leading-none ${c.capitalize ? 'capitalize' : ''}`}
              >
                {c.icon === 'pin' && <MapPin className="h-2 w-2 shrink-0" />}
                {c.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-1.5 self-center">
        {task.feedCategory === 'session' && task.url && (
          <a href={task.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[9px] font-black font-mono text-sky-400 transition hover:bg-sky-500/20">
            <Video className="h-3 w-3" /><span>JOIN</span>
          </a>
        )}
        {task.feedCategory === 'session' && task.recordingUrl && (
          <a href={task.recordingUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[9px] font-black font-mono text-violet-400 transition hover:bg-violet-500/20">
            <BookOpen className="h-3 w-3" /><span>REC</span>
          </a>
        )}
        {url && task.feedCategory !== 'session' && (
          <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-black font-mono transition hover:brightness-125"
            style={{ color: ac, borderColor: ac + '40', backgroundColor: ac + '15' }}>
            <LinkIcon className="h-3 w-3" /><span>OPEN</span>
          </a>
        )}
      </div>
    </div>
  );
}
