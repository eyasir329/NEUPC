/**
 * @file Notice row — table-row component showing a single notice’s
 *   title, type badge, priority, audience, pin status, and actions.
 * @module AdminNoticeRow
 */

'use client';

import { useState, useTransition } from 'react';
import {
  getTypeConfig,
  getPriorityConfig,
  formatDate,
  formatDateTime,
  isExpired,
  isExpiringSoon,
} from './noticeConfig';
import {
  deleteNoticeAction,
  toggleNoticePinAction,
} from '@/app/_lib/notice-actions';

export default function NoticeRow({ notice, onEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinned, setPinned] = useState(notice.is_pinned);
  const [togglingPin, startPinTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const typeConf = getTypeConfig(notice.notice_type);
  const priConf = getPriorityConfig(notice.priority);
  const expired = isExpired(notice.expires_at);
  const expiringSoon = isExpiringSoon(notice.expires_at);
  const creatorName = notice.users?.full_name ?? 'Admin';

  // ── Pin toggle ─────────────────────────────────────────────────────────────
  function handleTogglePin(e) {
    e.stopPropagation();
    const newVal = !pinned;
    setPinned(newVal);
    startPinTransition(async () => {
      const fd = new FormData();
      fd.set('id', notice.id);
      fd.set('pinned', String(newVal));
      const res = await toggleNoticePinAction(fd);
      if (res?.error) setPinned(!newVal);
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(e) {
    e.stopPropagation();
    setDeleting(true);
    const fd = new FormData();
    fd.set('id', notice.id);
    await deleteNoticeAction(fd);
    setDeleting(false);
  }

  return (
    <>
      {/* ── Main Row ──────────────────────────────────────────────────────── */}
      <div
        className={`group grid cursor-pointer grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b border-slate-700/40 px-4 py-3.5 transition-colors hover:bg-slate-800/40 sm:grid-cols-[1fr_auto_auto_auto] ${notice.priority === 'critical' ? 'border-l-2 border-l-red-500' : ''} ${notice.priority === 'high' ? 'border-l-2 border-l-yellow-500' : ''} `}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* ── Left: title + badges ─────────────────────────────────────── */}
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-start gap-2">
            {pinned && (
              <span className="mt-0.5 shrink-0 text-xs text-violet-400">
                📌
              </span>
            )}
            <span className="text-sm leading-snug font-medium text-white">
              {notice.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type */}
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${typeConf.badge}`}
            >
              {typeConf.emoji} {typeConf.label}
            </span>
            {/* Priority */}
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${priConf.badge}`}
            >
              {priConf.emoji} {priConf.label}
            </span>
            {/* Expiry status */}
            {expired && (
              <span className="rounded-full border border-slate-600/30 bg-slate-700/60 px-2 py-0.5 text-xs text-slate-400">
                ⏳ Expired
              </span>
            )}
            {expiringSoon && !expired && (
              <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                ⚠ Expiring soon
              </span>
            )}
          </div>

          {/* Meta: creator + dates (visible on mobile too) */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>By {creatorName}</span>
            <span>{formatDate(notice.created_at)}</span>
            {notice.expires_at && (
              <span className={expired ? 'text-red-400/70' : ''}>
                Expires {formatDate(notice.expires_at)}
              </span>
            )}
            {notice.views > 0 && <span>👁 {notice.views}</span>}
          </div>
        </div>

        {/* ── Right: actions (always visible) ─────────────────────────── */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Pin toggle */}
          <button
            onClick={handleTogglePin}
            disabled={togglingPin}
            title={pinned ? 'Unpin' : 'Pin to top'}
            className={`rounded-lg p-1.5 transition-colors ${
              pinned
                ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-violet-500/10 hover:text-violet-400'
            }`}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M9.5 2a.75.75 0 01.75.75V8.5h2.75a.75.75 0 010 1.5H10.25v6.25a.75.75 0 01-1.5 0V10H6a.75.75 0 010-1.5h2.75V2.75A.75.75 0 019.5 2z" />
            </svg>
          </button>

          {/* Edit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(notice);
            }}
            title="Edit"
            className="rounded-lg p-1.5 text-slate-500 opacity-0 transition-colors group-hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-400"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white transition-colors hover:bg-red-700"
              >
                {deleting ? '…' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-600"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              title="Delete"
              className="rounded-lg p-1.5 text-slate-500 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          {/* Expand chevron */}
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 shrink-0 text-slate-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* ── Expanded content ──────────────────────────────────────────────── */}
      {expanded && (
        <div className="space-y-3 border-b border-slate-700/40 bg-slate-800/30 px-4 py-4">
          {/* Content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
            {notice.content}
          </p>

          {/* Target audience */}
          {notice.target_audience?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500">Target:</span>
              {notice.target_audience.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-slate-600/30 bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300"
                >
                  {a}
                </span>
              ))}
            </div>
          )}

          {/* Attachments */}
          {notice.attachments?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Attachments:</p>
              {notice.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-sky-400 transition-colors hover:text-sky-300"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5 shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {url.length > 60 ? url.slice(0, 60) + '…' : url}
                </a>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-600">
            Last updated: {formatDateTime(notice.updated_at)}
          </p>
        </div>
      )}
    </>
  );
}
