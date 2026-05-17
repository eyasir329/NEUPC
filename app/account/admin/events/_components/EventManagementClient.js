'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Star, Search, PlusCircle, FileEdit,
  Clock, CheckCircle2, XCircle, Users, Zap,
  LayoutGrid, LayoutList, Filter, ArrowUpDown, Eye,
  Edit3, Trash2, Loader2, X,
} from 'lucide-react';
import EventCard from './EventCard';
import EventFormPanel from './EventFormPanel';
import RegistrationsModal from './RegistrationsModal';
import { getStatusConfig, getCategoryConfig, formatEventDate, CATEGORIES, STATUSES } from './eventConfig';
import { deleteEventAction } from '@/app/_lib/event-actions';
import { driveImageUrl } from '@/app/_lib/utils';
import { PageShell, PageHeader, TabBar, StatCard } from '@/app/account/member/_components/_ui';
import EventListLayout from '@/app/account/_components/events/EventListLayout';
import { enrichEvent } from '@/app/account/_components/events/eventUtils';
import { EVENT_STATUS_CONFIG } from '@/app/account/_components/events/eventConstants';

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'title',  label: 'Title A–Z' },
  { key: 'registrations', label: 'Most Registrations' },
];

const STATUS_TABS = [
  { value: 'all',       label: 'All',       icon: CalendarDays  },
  { value: 'draft',     label: 'Draft',     icon: FileEdit      },
  { value: 'upcoming',  label: 'Upcoming',  icon: Clock         },
  { value: 'ongoing',   label: 'Ongoing',   icon: Zap           },
  { value: 'completed', label: 'Completed', icon: CheckCircle2  },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle       },
];

function filterFn(event, tab) {
  if (tab === 'all') return true;
  return event.status === tab;
}

export default function EventManagementClient({ initialEvents, roles = [] }) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [view, setView] = useState('list');
  const [viewRegEvent, setViewRegEvent] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  const liveStats = useMemo(() => ({
    total: events.length,
    draft: events.filter((e) => e.status === 'draft').length,
    upcoming: events.filter((e) => e.status === 'upcoming').length,
    ongoing: events.filter((e) => e.status === 'ongoing').length,
    completed: events.filter((e) => e.status === 'completed').length,
    cancelled: events.filter((e) => e.status === 'cancelled').length,
    featured: events.filter((e) => e.is_featured).length,
    totalRegistrations: events.reduce((s, e) => s + (e.registrationCount ?? 0), 0),
  }), [events]);

  // Secondary filters applied on top of tab filter
  const baseEnriched = useMemo(() => events.map(enrichEvent), [events]);

  const searchFiltered = useMemo(() => {
    let list = baseEnriched;
    if (search) {
      const term = search.toLowerCase();
      list = list.filter((e) =>
        e.title?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term) ||
        e.category?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter) list = list.filter((e) => e.category === categoryFilter);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.start_date) - new Date(b.start_date);
        case 'title': return (a.title ?? '').localeCompare(b.title ?? '');
        case 'registrations': return (b.registrationCount ?? 0) - (a.registrationCount ?? 0);
        default: return new Date(b.start_date) - new Date(a.start_date);
      }
    });
  }, [baseEnriched, search, categoryFilter, sortBy]);

  async function handleDelete(id) {
    setDeletePending(true);
    const fd = new FormData(); fd.set('id', id);
    const result = await deleteEventAction(fd);
    setDeletePending(false);
    setDeleteId(null);
    if (!result?.error) router.refresh();
  }

  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.value === 'all' ? events.length : events.filter((e) => e.status === t.value).length,
  }));

  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, location or category…"
            className="w-full rounded-xl border border-white/8 bg-white/4 py-2.5 pr-4 pl-10 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/15 transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-0.5 text-gray-500 hover:text-gray-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 pr-8 text-sm text-gray-400 scheme-dark outline-none focus:border-white/20 focus:text-white">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 pr-8 text-sm text-gray-400 scheme-dark outline-none focus:border-white/20 focus:text-white">
            {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/3 p-0.5">
            <button onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${view === 'list' ? 'bg-white/12 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView('grid')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${view === 'grid' ? 'bg-white/12 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shrink-0">
            <PlusCircle className="h-4 w-4" /> New Event
          </button>
        </div>
      </div>

      {(search || categoryFilter) && (
        <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/2 px-4 py-2.5">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-300">{searchFiltered.length}</span> of {events.length} events
          </p>
          <button onClick={() => { setSearch(''); setCategoryFilter(''); }}
            className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
            <X className="h-3 w-3" /> Clear filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <PageShell>
      <PageHeader
        icon={CalendarDays}
        title="Event Management"
        subtitle={`${liveStats.total} events · ${liveStats.totalRegistrations} registrations`}
        accent="blue"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={CalendarDays} label="Total Events"       value={liveStats.total}                        accent="blue"   />
        <StatCard icon={Users}        label="Registrations"      value={liveStats.totalRegistrations}           accent="emerald"/>
        <StatCard icon={Zap}          label="Ongoing / Upcoming" value={liveStats.ongoing + liveStats.upcoming} accent="amber"  />
        <StatCard icon={Star}         label="Featured"           value={liveStats.featured}                     accent="violet" />
      </div>

      <TabBar tabs={tabs} value={undefined} onChange={() => {}} />

      {/* Toolbar + content — handled internally via EventListLayout, but we need
          the extra search/sort/view filters here so we compose manually */}
      <EventListLayout
        pageHeader={null}
        tabs={tabs}
        events={searchFiltered}
        filterFn={filterFn}
        stats={[]}
        sidebarCta={null}
        rowProps={{
          showStatus: true,
          showCover: true,
          showRegs: true,
          onEdit: (ev) => setEditEvent(ev),
          onDelete: (ev) => setDeleteId(ev.id),
          actionSlot: undefined,
        }}
        getDetailProps={(event) => ({
          detailRows: [
            { label: 'Status',    value: getStatusConfig(event.status)?.label ?? event.status },
            { label: 'Category',  value: event._type },
            { label: 'Registered', value: `${event.registrationCount ?? 0}${event.max_participants ? ` / ${event.max_participants}` : ''}` },
          ],
          ctaSlot: (
            <div className="flex gap-2">
              <button onClick={() => setViewRegEvent(event)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 transition-colors">
                <Eye className="h-3.5 w-3.5" /> Registrations
              </button>
              <button onClick={() => setEditEvent(event)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-blue-500/15 hover:text-blue-400 transition-colors">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setDeleteId(event.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ),
        })}
        aboveList={toolbar}
      />

      {/* Grid view overlay — replaces EventListLayout list when view=grid */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 -mt-4">
          {searchFiltered.map((event) => (
            <EventCard key={event.id} event={event}
              onEdit={(e) => setEditEvent(e)}
              onViewRegistrations={(e) => setViewRegEvent(e)} />
          ))}
        </div>
      )}

      {createOpen && (
        <EventFormPanel roles={roles} onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); router.refresh(); }} />
      )}
      {editEvent && (
        <EventFormPanel event={editEvent} roles={roles} onClose={() => setEditEvent(null)} onSaved={() => { setEditEvent(null); router.refresh(); }} />
      )}
      {viewRegEvent && (
        <RegistrationsModal event={viewRegEvent} onClose={() => setViewRegEvent(null)} />
      )}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete Event?</h3>
            <p className="mt-2 text-sm text-gray-400">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} disabled={deletePending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60">
                {deletePending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
