/**
 * @file Notice form modal — create / edit dialog for announcements
 *   with fields for title, content, notice type, priority, target
 *   audience, pin status, and expiry date.
 * @module AdminNoticeFormModal
 */

'use client';

import { useState, useRef } from 'react';
import {
  NOTICE_TYPES,
  PRIORITIES,
  getTypeConfig,
  getPriorityConfig,
} from './noticeConfig';
import {
  createNoticeAction,
  updateNoticeAction,
} from '@/app/_lib/notice-actions';

export default function NoticeFormModal({ notice, onClose }) {
  const isEdit = Boolean(notice);
  const formRef = useRef(null);

  const [isPinned, setIsPinned] = useState(notice?.is_pinned ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Format date for datetime-local input
  function toDatetimeLocal(str) {
    if (!str) return '';
    return new Date(str).toISOString().slice(0, 16);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(formRef.current);
    fd.set('is_pinned', String(isPinned));

    const res = isEdit
      ? await updateNoticeAction(fd)
      : await createNoticeAction(fd);

    setLoading(false);
    if (res?.error) setError(res.error);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700/50 bg-slate-900 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? '✏️ Edit Notice' : '➕ Create Notice'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 p-6">
          {isEdit && <input type="hidden" name="id" value={notice.id} />}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={notice?.title ?? ''}
              placeholder="Notice title…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Type
              </label>
              <select
                name="notice_type"
                defaultValue={notice?.notice_type ?? 'general'}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {NOTICE_TYPES.map((t) => {
                  const c = getTypeConfig(t);
                  return (
                    <option key={t} value={t}>
                      {c.emoji} {c.label}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Priority
              </label>
              <select
                name="priority"
                defaultValue={notice?.priority ?? 'medium'}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {PRIORITIES.map((p) => {
                  const c = getPriorityConfig(p);
                  return (
                    <option key={p} value={p}>
                      {c.emoji} {c.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              name="content"
              required
              defaultValue={notice?.content ?? ''}
              placeholder="Write the full notice content here…"
              rows={6}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Target Audience{' '}
              <span className="text-xs text-slate-500">
                (comma-separated, e.g. members, executive)
              </span>
            </label>
            <input
              name="target_audience"
              defaultValue={notice?.target_audience?.join(', ') ?? ''}
              placeholder="all, members, executive, admin…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Expires At{' '}
              <span className="text-xs text-slate-500">(optional)</span>
            </label>
            <input
              name="expires_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(notice?.expires_at)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Attachment URLs{' '}
              <span className="text-xs text-slate-500">(one per line)</span>
            </label>
            <textarea
              name="attachments"
              defaultValue={notice?.attachments?.join('\n') ?? ''}
              placeholder={
                'https://example.com/file.pdf\nhttps://example.com/doc.docx'
              }
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Pin toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPinned((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${isPinned ? 'bg-violet-600' : 'bg-slate-700'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${isPinned ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className="text-sm text-slate-300">📌 Pin to top</span>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-700/50 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-sky-900/30 transition-colors hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? 'Saving…' : isEdit ? 'Update Notice' : 'Create Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
