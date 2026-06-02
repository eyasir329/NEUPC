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

import { Link as LinkIcon } from 'lucide-react';
import { getFeedMeta, getFeedItemUrl } from './utils';

/**
 * @param {object}  props
 * @param {object}  props.task            The feed item.
 * @param {'row'|'chip'} [props.variant]  Layout variant (default "row").
 * @param {boolean} [props.link]          Show the open-link affordance (chip).
 * @param {(id:string)=>void} [props.onSelect]  Click handler (opens detail).
 */
export default function FeedItemCard({ task, variant = 'row', link = false, onSelect }) {
  const meta = getFeedMeta(task);
  if (!meta) return null;

  const url = getFeedItemUrl(task);
  const handleClick = onSelect ? () => onSelect(task.id) : undefined;

  if (variant === 'chip') {
    return (
      <div
        onClick={handleClick}
        className={`flex items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${meta.accent} ${
          link ? 'cursor-pointer transition hover:brightness-110' : ''
        }`}
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
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm transition ${meta.accent} ${
        handleClick ? 'cursor-pointer hover:brightness-110' : ''
      }`}
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
            {task.isContest && task.contestTime && <span>🕒 {task.contestTime}</span>}
            {!task.isContest && task.time && <span>🕒 {task.time}</span>}
            {task.contestDuration && <span>⏳ {task.contestDuration}</span>}
          </div>
        </div>
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition hover:brightness-110 ${meta.accent}`}
        >
          <LinkIcon className="h-3 w-3" />
          <span>Open</span>
        </a>
      )}
    </div>
  );
}
