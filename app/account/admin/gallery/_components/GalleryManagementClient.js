/**
 * @file Gallery management client — admin interface for uploading,
 *   categorising, tagging, reordering, and featuring gallery items
 *   with bulk-add support.
 * @module AdminGalleryManagementClient
 */

'use client';

import { useState, useMemo } from 'react';
import GalleryItemCard from './GalleryItemCard';
import GalleryItemFormModal from './GalleryItemFormModal';
import BulkAddModal from './BulkAddModal';
import EventBulkUploadModal from './EventBulkUploadModal';
import DraggablePhotoGrid from './DraggablePhotoGrid';
import EventGalleryItemEditModal from './EventGalleryItemEditModal';
import { getStatCards } from './galleryConfig';
import Link from 'next/link';
import {
  reorderEventGalleryAction,
  deleteEventGalleryItemAction,
} from '@/app/_lib/gallery-actions';

// Lucide icons
import {
  ImageIcon,
  Folder,
  Video,
  Star,
  Tag,
  Calendar,
  Plus,
  Upload,
  Search,
  ArrowLeft,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Shared UI components
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  TabBar,
  EmptyState,
  ActionButton,
} from '../../_components/_ui';

const TABS = ['all', 'image', 'video', 'featured', 'by_event'];

const STAT_MAPPING = {
  'Total Items': { icon: Folder, accent: 'violet' },
  'Images': { icon: ImageIcon, accent: 'blue' },
  'Videos': { icon: Video, accent: 'rose' },
  'Featured': { icon: Star, accent: 'amber' },
  'Categories': { icon: Tag, accent: 'emerald' },
  'Linked Events': { icon: Calendar, accent: 'sky' },
};

function TabLabel(tab) {
  switch (tab) {
    case 'all':
      return 'All';
    case 'image':
      return 'Images';
    case 'video':
      return 'Videos';
    case 'featured':
      return 'Featured';
    case 'by_event':
      return 'By Event';
    default:
      return tab;
  }
}

export default function GalleryManagementClient({
  initialItems = [],
  stats,
  events = [],
  eventGalleryItems = [],
}) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  // Tracks which event's add-modal is pre-populated
  const [addEventId, setAddEventId] = useState(null);
  // Tracks which event's bulk file upload modal is open
  const [bulkUploadEvent, setBulkUploadEvent] = useState(null);

  const [editItem, setEditItem] = useState(null);
  const [editEventItem, setEditEventItem] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  // ── Pagination ──────────────────────────────────────────────────────────
  const ITEMS_PER_PAGE = 24;
  const [currentPage, setCurrentPage] = useState(1);

  function openAddForEvent(eventId) {
    setAddEventId(eventId);
    setAddOpen(true);
  }
  function closeAdd() {
    setAddOpen(false);
    setAddEventId(null);
  }

  // ── Derived categories & events from data ─────────────────────────────────
  const allCategories = useMemo(
    () =>
      [...new Set(initialItems.map((i) => i.category).filter(Boolean))].sort(),
    [initialItems]
  );

  // ── Tab counts ────────────────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      all: initialItems.length + eventGalleryItems.length,
      image:
        initialItems.filter((i) => i.type === 'image').length +
        eventGalleryItems.filter((i) => i.type === 'image').length,
      video:
        initialItems.filter((i) => i.type === 'video').length +
        eventGalleryItems.filter((i) => i.type === 'video').length,
      featured: initialItems.filter((i) => i.is_featured).length,
      by_event: events.length,
    }),
    [initialItems, eventGalleryItems, events]
  );

  // ── Grouped by event (for by_event tab) ──────────────────────────────────
  const groupedByEvent = useMemo(() => {
    const map = new Map();
    // seed all known events so they show even with 0 items
    events.forEach((ev) => map.set(ev.id, { event: ev, items: [] }));
    eventGalleryItems.forEach((item) => {
      if (!map.has(item.event_id)) {
        const ev = {
          id: item.event_id,
          title: item.events?.title || 'Unknown Event',
        };
        map.set(item.event_id, { event: ev, items: [] });
      }
      map.get(item.event_id).items.push(item);
    });
    return [...map.values()].sort((a, b) => b.items.length - a.items.length);
  }, [eventGalleryItems, events]);

  // ── Filtered items ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    // Normalize event gallery items so they render with GalleryItemCard
    const normalizedEventItems = eventGalleryItems.map((i) => ({
      ...i,
      _source: 'event_gallery',
      category: null,
      tags: [],
      is_featured: false,
    }));

    // featured tab: only gallery_items have is_featured; exclude event_gallery
    let items =
      tab === 'featured'
        ? [...initialItems]
        : [...initialItems, ...normalizedEventItems];

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
  }, [
    initialItems,
    eventGalleryItems,
    tab,
    search,
    categoryFilter,
    eventFilter,
  ]);

  // Reset page when filters change
  const filterKey = `${tab}-${search}-${categoryFilter}-${eventFilter}`;
  useMemo(() => setCurrentPage(1), [filterKey]);

  // ── Paginated slice ─────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(
    () =>
      filtered.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
      ),
    [filtered, safePage]
  );

  const statCards = getStatCards(stats);

  const statusTabs = TABS.map((t) => {
    let icon = ImageIcon;
    if (t === 'image') icon = ImageIcon;
    else if (t === 'video') icon = Video;
    else if (t === 'featured') icon = Star;
    else if (t === 'by_event') icon = Calendar;
    else if (t === 'all') icon = Folder;

    return {
      value: t,
      label: TabLabel(t),
      count: counts[t],
      icon,
    };
  });

  return (
    <PageShell>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        icon={ImageIcon}
        title="Gallery Management"
        subtitle={`${stats.total} media items · ${events.length} managed events`}
        accent="violet"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/account/admin"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-xs font-semibold text-gray-400 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <button
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-xs font-semibold text-gray-400 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white"
            >
              <Upload className="h-3.5 w-3.5" />
              Bulk Add
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.35)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </button>
          </div>
        }
      />

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s, idx) => {
          const mapping = STAT_MAPPING[s.label] || { icon: ImageIcon, accent: 'violet' };
          return (
            <StatCard
              key={s.label}
              icon={mapping.icon}
              label={s.label}
              value={s.value}
              accent={mapping.accent}
              delay={idx * 0.04}
            />
          );
        })}
      </div>

      {/* ── Status Tabs ────────────────────────────────────────────────── */}
      <TabBar tabs={statusTabs} value={tab} onChange={(v) => setTab(v)} />

      {/* ── Toolbar & Filters ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search captions, tags, categories, events…"
            className="w-full bg-white/3 border border-white/8 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-gray-600 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center flex-wrap gap-2 sm:ml-auto">
          {/* Category filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-white/3 border border-white/8 text-white text-xs rounded-xl px-3 py-2.5 pr-8 outline-none focus:border-violet-500/50 transition-all cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              <option value="">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
          </div>

          {/* Event filter */}
          {events.length > 0 && (
            <div className="relative">
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="appearance-none bg-white/3 border border-white/8 text-white text-xs rounded-xl px-3 py-2.5 pr-8 outline-none focus:border-violet-500/50 transition-all cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* ── Filter Indicator / Reset ────────────────────────────────────── */}
      {(search || categoryFilter || eventFilter) && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            Showing <span className="text-white font-medium">{filtered.length}</span> of{' '}
            <span className="text-white font-medium">{initialItems.length + eventGalleryItems.length}</span> items
          </span>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setEventFilter('');
            }}
            className="ml-2 flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        </div>
      )}

      {/* ── By Event view ─────────────────────────────────────────────── */}
      {tab === 'by_event' && (
        <div className="space-y-6">
          {groupedByEvent.map(({ event: ev, items: evItems }) => (
            <GlassCard
              key={ev.id}
              className="border-white/[0.06] bg-white/[0.02]"
              padding="p-6"
            >
              <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <Calendar className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">{ev.title}</h3>
                    <p className="text-xs text-gray-500">
                      {evItems.length} item{evItems.length !== 1 ? 's' : ''} in event
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ActionButton
                    tone="emerald"
                    icon={Upload}
                    onClick={() => setBulkUploadEvent(ev)}
                  >
                    Upload Files
                  </ActionButton>
                  <ActionButton
                    tone="violet"
                    icon={Plus}
                    onClick={() => openAddForEvent(ev.id)}
                  >
                    Add URL
                  </ActionButton>
                </div>
              </div>
              {evItems.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="No photos yet for this event"
                  description="Upload event pictures or add an external media URL to populate the gallery."
                  accent="violet"
                  action={
                    <ActionButton
                      tone="emerald"
                      icon={Upload}
                      onClick={() => setBulkUploadEvent(ev)}
                    >
                      Upload files
                    </ActionButton>
                  }
                />
              ) : (
                <DraggablePhotoGrid
                  items={evItems}
                  onEdit={(i) => setEditEventItem(i)}
                  reorderAction={reorderEventGalleryAction}
                />
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* ── Grid (normal tabs) ──────────────────────────────────────────── */}
      {tab !== 'by_event' && (
        <>
          {filtered.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title={search || categoryFilter || eventFilter ? 'No items found' : 'No gallery items'}
              description={
                search || categoryFilter || eventFilter
                  ? 'Try adjusting your search query or dropdown filters.'
                  : 'Get started by creating your first gallery item.'
              }
              accent="violet"
              action={
                search || categoryFilter || eventFilter ? (
                  <ActionButton
                    onClick={() => {
                      setSearch('');
                      setCategoryFilter('');
                      setEventFilter('');
                    }}
                    tone="violet"
                    icon={X}
                  >
                    Clear Filters
                  </ActionButton>
                ) : (
                  <ActionButton
                    onClick={() => setAddOpen(true)}
                    tone="violet"
                    icon={Plus}
                  >
                    Add Item
                  </ActionButton>
                )
              }
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of{' '}
                  <span className="text-white font-medium">{filtered.length}</span> items
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedItems.map((item) => (
                  <GalleryItemCard
                    key={item.id}
                    item={item}
                    onEdit={(i) =>
                      i._source === 'event_gallery'
                        ? setEditEventItem(i)
                        : setEditItem(i)
                    }
                    noFeatured={item._source === 'event_gallery'}
                    deleteAction={
                      item._source === 'event_gallery'
                        ? deleteEventGalleryItemAction
                        : undefined
                    }
                  />
                ))}
              </div>

              {/* ── Pagination Controls ─────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 pt-6 border-t border-white/[0.06] sm:flex-row sm:justify-between">
                  <p className="text-xs text-gray-500">
                    Page <span className="text-white">{safePage}</span> of {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={safePage <= 1}
                      className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-xs font-semibold border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - safePage) <= 2
                      )
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1)
                          acc.push('ellipsis-' + p);
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p) =>
                        typeof p === 'string' ? (
                          <span
                            key={p}
                            className="px-1.5 text-xs text-gray-600 select-none"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                              p === safePage
                                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                : 'border border-white/6 bg-white/2 text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={safePage >= totalPages}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safePage >= totalPages}
                      className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-xs font-semibold border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {addOpen && (
        <GalleryItemFormModal
          events={events}
          defaultEventId={addEventId}
          onClose={closeAdd}
        />
      )}
      {editItem && (
        <GalleryItemFormModal
          item={editItem}
          events={events}
          onClose={() => setEditItem(null)}
        />
      )}
      {editEventItem && (
        <EventGalleryItemEditModal
          item={editEventItem}
          onClose={() => setEditEventItem(null)}
        />
      )}
      {bulkOpen && (
        <BulkAddModal events={events} onClose={() => setBulkOpen(false)} />
      )}
      {bulkUploadEvent && (
        <EventBulkUploadModal
          event={bulkUploadEvent}
          events={events}
          onClose={() => setBulkUploadEvent(null)}
        />
      )}
    </PageShell>
  );
}
