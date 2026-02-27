'use client';

import { useState, useMemo } from 'react';
import GalleryItemCard from './GalleryItemCard';
import GalleryItemFormModal from './GalleryItemFormModal';
import BulkAddModal from './BulkAddModal';
import { getStatCards, GALLERY_CATEGORIES } from './galleryConfig';

const TABS = ['all', 'image', 'video', 'featured'];

function TabLabel(tab) {
  switch (tab) {
    case 'all':
      return 'All';
    case 'image':
      return '🖼️ Images';
    case 'video':
      return '🎬 Videos';
    case 'featured':
      return '⭐ Featured';
    default:
      return tab;
  }
}

export default function GalleryManagementClient({
  initialItems = [],
  stats,
  events = [],
}) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  const [editItem, setEditItem] = useState(null); // null = closed, item obj = edit mode
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  // ── Derived categories & events from data ─────────────────────────────────
  const allCategories = useMemo(
    () =>
      [...new Set(initialItems.map((i) => i.category).filter(Boolean))].sort(),
    [initialItems]
  );

  // ── Tab counts ────────────────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      all: initialItems.length,
      image: initialItems.filter((i) => i.type === 'image').length,
      video: initialItems.filter((i) => i.type === 'video').length,
      featured: initialItems.filter((i) => i.is_featured).length,
    }),
    [initialItems]
  );

  // ── Filtered items ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...initialItems];

    if (tab === 'image') items = items.filter((i) => i.type === 'image');
    else if (tab === 'video') items = items.filter((i) => i.type === 'video');
    else if (tab === 'featured') items = items.filter((i) => i.is_featured);

    if (categoryFilter)
      items = items.filter((i) => i.category === categoryFilter);
    if (eventFilter) items = items.filter((i) => i.event_id === eventFilter);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.caption?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.tags?.some((t) => t.toLowerCase().includes(q)) ||
          i.events?.title?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [initialItems, tab, search, categoryFilter, eventFilter]);

  const statCards = getStatCards(stats);

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Gallery Management</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Manage all photos and videos in the public gallery.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-600/40 bg-slate-700/60 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Bulk Add
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-900/30 transition-colors hover:bg-violet-700"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add Item
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`bg-linear-to-br ${s.color} flex flex-col gap-1 rounded-xl border p-3.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">{s.icon}</span>
              <span className={`text-xl font-bold ${s.text}`}>{s.value}</span>
            </div>
            <p className="truncate text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search captions, tags, categories…"
            className="w-full rounded-xl border border-slate-700/50 bg-slate-800/60 py-2 pr-4 pl-9 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Event filter */}
        {events.length > 0 && (
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none"
          >
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex w-fit gap-1 rounded-xl border border-slate-700/40 bg-slate-800/50 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {TabLabel(t)}{' '}
            <span
              className={`ml-1 text-xs ${tab === t ? 'text-violet-200' : 'text-slate-600'}`}
            >
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 text-5xl">🖼️</div>
          <p className="font-medium text-slate-400">No items found</p>
          <p className="mt-1 text-sm text-slate-500">
            {search || categoryFilter || eventFilter
              ? 'Try adjusting your filters.'
              : 'Add the first gallery item to get started.'}
          </p>
          {!search && !categoryFilter && !eventFilter && (
            <button
              onClick={() => setAddOpen(true)}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              Add Item
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {initialItems.length} items
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <GalleryItemCard
                key={item.id}
                item={item}
                onEdit={(i) => setEditItem(i)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {addOpen && (
        <GalleryItemFormModal
          events={events}
          onClose={() => setAddOpen(false)}
        />
      )}
      {editItem && (
        <GalleryItemFormModal
          item={editItem}
          events={events}
          onClose={() => setEditItem(null)}
        />
      )}
      {bulkOpen && (
        <BulkAddModal events={events} onClose={() => setBulkOpen(false)} />
      )}
    </div>
  );
}
