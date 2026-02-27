'use client';

import { useState } from 'react';
import { GALLERY_CATEGORIES } from './galleryConfig';
import { bulkAddGalleryItemsAction } from '@/app/_lib/gallery-actions';

export default function BulkAddModal({ events = [], onClose }) {
  const [type, setType] = useState('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [urlsText, setUrlsText] = useState('');

  const urlCount = urlsText
    .split('\n')
    .map((u) => u.trim())
    .filter(Boolean).length;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (urlCount === 0) {
      setError('Paste at least one URL.');
      return;
    }
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    fd.set('type', type);
    fd.set('urls', urlsText);

    const res = await bulkAddGalleryItemsAction(fd);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(
        `✅ Added ${res.count} item${res.count === 1 ? '' : 's'} successfully.`
      );
      setTimeout(onClose, 1400);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            ⚡ Bulk Add Items
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

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* URLs textarea */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                Media URLs <span className="text-red-400">*</span>
              </label>
              {urlCount > 0 && (
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">
                  {urlCount} URL{urlCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <textarea
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              placeholder={
                'https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg\nhttps://youtu.be/video1\n…'
              }
              rows={8}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              One URL per line. Maximum 50 items.
            </p>
          </div>

          {/* Type toggle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              All items are
            </label>
            <div className="flex gap-2">
              {['image', 'video'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    type === t
                      ? t === 'image'
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-red-500 bg-red-600 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {t === 'image' ? '🖼️ Images' : '🎬 Videos'}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Category (optional)
            </label>
            <input
              name="category"
              list="bulk-categories"
              placeholder="Event Photos, Workshop, …"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
            <datalist id="bulk-categories">
              {GALLERY_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Linked Event */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Linked Event (optional)
            </label>
            <select
              name="event_id"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
            >
              <option value="">— No event —</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/30 bg-green-900/30 px-4 py-2.5 text-sm text-green-400">
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-700/50 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || urlCount === 0}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              {loading
                ? 'Adding…'
                : `Add ${urlCount > 0 ? urlCount : ''} Item${urlCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
