'use client';

import { useState, useMemo } from 'react';
import {
  CalendarDays,
  Star,
  Search,
  PlusCircle,
  Filter,
  LayoutGrid,
  List,
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import EventCard from './EventCard';
import EventFormModal from './EventFormModal';
import RegistrationsModal from './RegistrationsModal';
import { getStatusConfig, CATEGORIES, STATUSES } from './eventConfig';

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, colorClass, sub }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3.5 backdrop-blur-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl leading-none font-bold text-white tabular-nums">
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-gray-500">{label}</p>
        {sub && (
          <p className="mt-0.5 truncate text-[10px] text-gray-600">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab, onCreateClick }) {
  const messages = {
    all: {
      icon: CalendarDays,
      title: 'No events yet',
      sub: 'Create your first event to get started.',
    },
    draft: {
      icon: FileEdit,
      title: 'No draft events',
      sub: 'Drafts appear here when you save without publishing.',
    },
    upcoming: {
      icon: Clock,
      title: 'No upcoming events',
      sub: 'Events with status "Upcoming" appear here.',
    },
    ongoing: {
      icon: Zap,
      title: 'No ongoing events',
      sub: 'Events that are currently running appear here.',
    },
    completed: { icon: CheckCircle2, title: 'No completed events', sub: '' },
    cancelled: { icon: XCircle, title: 'No cancelled events', sub: '' },
  };
  const { icon: Icon, title, sub } = messages[tab] ?? messages.all;
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/3 py-20 text-center">
      <Icon className="mb-4 h-12 w-12 text-gray-700" />
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      {sub && <p className="mt-1 text-xs text-gray-600">{sub}</p>}
      {tab === 'all' && (
        <button
          onClick={onCreateClick}
          className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600/80 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          <PlusCircle className="h-4 w-4" />
          Create Event
        </button>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function EventManagementClient({ initialEvents, stats }) {
  const [events, setEvents] = useState(initialEvents);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [viewRegEvent, setViewRegEvent] = useState(null);

  // ── live stats (recalculate from local state) ───────────────────────────────
  const liveStats = useMemo(
    () => ({
      total: events.length,
      draft: events.filter((e) => e.status === 'draft').length,
      upcoming: events.filter((e) => e.status === 'upcoming').length,
      ongoing: events.filter((e) => e.status === 'ongoing').length,
      completed: events.filter((e) => e.status === 'completed').length,
      cancelled: events.filter((e) => e.status === 'cancelled').length,
      featured: events.filter((e) => e.is_featured).length,
      totalRegistrations: events.reduce(
        (s, e) => s + (e.registrationCount ?? 0),
        0
      ),
    }),
    [events]
  );

  // ── filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = events;

    if (activeTab !== 'all') list = list.filter((e) => e.status === activeTab);

    if (search) {
      const term = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term) ||
          e.location?.toLowerCase().includes(term) ||
          e.category?.toLowerCase().includes(term)
      );
    }

    if (categoryFilter)
      list = list.filter((e) => e.category === categoryFilter);

    return list;
  }, [events, activeTab, search, categoryFilter]);

  // ── optimistic callbacks ────────────────────────────────────────────────────

  function handleSaved(savedEvent, mode) {
    if (mode === 'create') {
      setEvents((prev) => [savedEvent, ...prev]);
    } else {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === savedEvent.id
            ? {
                ...e,
                ...savedEvent,
                // preserve enriched fields not returned by the action
                creatorName: e.creatorName,
                creatorAvatar: e.creatorAvatar,
                registrationCount: e.registrationCount,
                attendedCount: e.attendedCount,
                confirmedCount: e.confirmedCount,
              }
            : e
        )
      );
    }
  }

  const statusTabs = [
    { key: 'all', label: 'All', count: liveStats.total, icon: CalendarDays },
    { key: 'draft', label: 'Draft', count: liveStats.draft, icon: FileEdit },
    {
      key: 'upcoming',
      label: 'Upcoming',
      count: liveStats.upcoming,
      icon: Clock,
    },
    { key: 'ongoing', label: 'Ongoing', count: liveStats.ongoing, icon: Zap },
    {
      key: 'completed',
      label: 'Completed',
      count: liveStats.completed,
      icon: CheckCircle2,
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      count: liveStats.cancelled,
      icon: XCircle,
    },
  ];

  return (
    <>
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white sm:text-3xl">
            <CalendarDays className="h-7 w-7 text-blue-400" />
            Event Management
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Create, publish, and track all club events
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/account/admin"
            className="rounded-xl bg-white/6 px-4 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            ← Dashboard
          </Link>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
          >
            <PlusCircle className="h-4 w-4" />
            New Event
          </button>
        </div>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Total Events"
          value={liveStats.total}
          colorClass="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          icon={Users}
          label="Total Registrations"
          value={liveStats.totalRegistrations}
          colorClass="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          icon={Zap}
          label="Ongoing / Upcoming"
          value={liveStats.ongoing + liveStats.upcoming}
          sub={`${liveStats.ongoing} live · ${liveStats.upcoming} scheduled`}
          colorClass="bg-amber-500/20 text-amber-400"
        />
        <StatCard
          icon={Star}
          label="Featured"
          value={liveStats.featured}
          sub={`${liveStats.completed} completed`}
          colorClass="bg-purple-500/20 text-purple-400"
        />
      </div>

      {/* ── Status Tabs ───────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {statusTabs.map(({ key, label, count, icon: Icon }) => {
          const active = activeTab === key;
          const sc = key !== 'all' ? getStatusConfig(key) : null;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
              }`}
            >
              {sc ? (
                <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {label}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${
                  active ? 'bg-white/10 text-white' : 'text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, location, category…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-sm text-white placeholder-gray-600 transition-colors outline-none focus:border-white/20"
          />
        </div>

        {/* category filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0f1117] px-3 py-2.5 text-sm text-gray-400 scheme-dark transition-colors outline-none focus:border-white/20 focus:text-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Event Grid ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} onCreateClick={() => setCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={(e) => setEditEvent(e)}
              onViewRegistrations={(e) => setViewRegEvent(e)}
            />
          ))}
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
          Event Lifecycle
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((s) => {
            const sc = getStatusConfig(s);
            return (
              <div
                key={s}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${sc.cardBg} ${sc.cardBorder}`}
              >
                <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                <span className={`text-xs font-semibold ${sc.text}`}>
                  {sc.label}
                </span>
              </div>
            );
          })}
          <span className="text-[10px] text-gray-600">
            Use the status dropdown on each card to transition events
          </span>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────── */}
      {createOpen && (
        <EventFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={(e) => handleSaved(e, 'create')}
        />
      )}

      {editEvent && (
        <EventFormModal
          event={events.find((e) => e.id === editEvent.id) ?? editEvent}
          onClose={() => setEditEvent(null)}
          onSaved={(e) => handleSaved(e, 'edit')}
        />
      )}

      {viewRegEvent && (
        <RegistrationsModal
          event={viewRegEvent}
          onClose={() => setViewRegEvent(null)}
        />
      )}
    </>
  );
}
