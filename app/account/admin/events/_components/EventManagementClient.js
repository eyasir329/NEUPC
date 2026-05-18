'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  CalendarDays, FileEdit, Clock, CheckCircle2, XCircle, Users, Zap, Plus,
  Search, Download, CheckCircle, UserCheck, X, Loader2,
} from 'lucide-react';
import { deleteEventAction, createEventAction, updateEventAction, uploadEventImageAction, deleteEventImageAction } from '@/app/_lib/event-actions';
import { useScrollLock } from '@/app/_lib/hooks';
import EventListLayout from '@/app/account/_components/events/EventListLayout';
import ManageEventDetail from '@/app/account/_components/events/ManageEventDetail';
import { enrichEvent } from '@/app/account/_components/events/eventUtils';
import { EVENT_STATUS_CONFIG, REG_STATUS_CONFIG, computeStats } from '@/app/account/_components/events/eventConstants';

// ─── Create event modal (new events only — no edit popup) ──────────────────────

import { CATEGORIES, VENUE_TYPES } from '@/app/account/_components/events/eventConstants';
import { AlertTriangle } from 'lucide-react';

function CreateEventModal({ onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  useScrollLock();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = await createEventAction(fd);
      if (res?.error) return setError(res.error);
      onSuccess();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-bold text-white">Create Event</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-400">Title *</label>
              <input name="title" required placeholder="Event title"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Start Date *</label>
              <input name="start_date" type="datetime-local" required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:ring-1 focus:ring-blue-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">End Date</label>
              <input name="end_date" type="datetime-local"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Location *</label>
              <input name="location" required placeholder="Location or URL"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Venue Type</label>
              <select name="venue_type" defaultValue="offline"
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-white focus:outline-none">
                {VENUE_TYPES.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Category</label>
              <select name="category" defaultValue=""
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-white focus:outline-none">
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Status</label>
              <select name="status" defaultValue="draft"
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-white focus:outline-none">
                {Object.entries(EVENT_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Max Participants</label>
              <input name="max_participants" type="number" placeholder="Unlimited"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-400">Description</label>
              <textarea name="description" rows={3} placeholder="Short description"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input name="registration_required" type="checkbox" value="true" className="h-4 w-4 rounded accent-blue-500" />
                <span className="text-sm text-gray-400">Registration Required</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input name="is_featured" type="checkbox" value="true" className="h-4 w-4 rounded accent-purple-500" />
                <span className="text-sm text-gray-400">Featured</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
              {isPending ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Registrations modal ───────────────────────────────────────────────────────

function RegistrationsModal({ event, onClose }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);
  useScrollLock();

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch(`/api/admin/events/${event.id}/registrations`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setRegistrations(Array.isArray(data) ? data : (data.registrations || [])))
      .catch(() => showToast('Failed to load registrations', 'error'))
      .finally(() => setLoading(false));
  }, [event.id]);

  const filtered = registrations.filter((r) => {
    const name = (r.users?.full_name || r.user?.full_name || '').toLowerCase();
    const email = (r.users?.email || r.user?.email || '').toLowerCase();
    return (!search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()))
      && (statusFilter === 'all' || r.status === statusFilter);
  });

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Status', 'Attended', 'Registered At'],
      ...filtered.map((r) => {
        const u = r.users || r.user || {};
        return [u.full_name || '', u.email || '', r.status, r.attended ? 'Yes' : 'No', r.registered_at ? new Date(r.registered_at).toLocaleDateString() : ''];
      })];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `registrations-${event.id}.csv` });
    a.click();
  };

  const regStats = {
    total: registrations.length,
    confirmed: registrations.filter((r) => r.status === 'confirmed').length,
    attended: registrations.filter((r) => r.attended).length,
    cancelled: registrations.filter((r) => r.status === 'cancelled').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-8 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div>
            <h2 className="font-bold text-white">{event.title}</h2>
            <p className="mt-0.5 text-xs text-gray-500">Registrations</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {!loading && registrations.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: Users, label: 'Total', val: regStats.total },
                { icon: UserCheck, label: 'Confirmed', val: regStats.confirmed },
                { icon: CheckCircle, label: 'Attended', val: regStats.attended },
                { icon: XCircle, label: 'Cancelled', val: regStats.cancelled },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/3 px-3 py-2">
                  <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                  <div><p className="text-base font-bold text-white tabular-nums">{val}</p><p className="mt-0.5 text-[10px] text-gray-500">{label}</p></div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
              <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-white placeholder-gray-600 outline-none focus:border-white/20" />
            </div>
            <div className="flex gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none">
                <option value="all">All Status</option>
                {Object.entries(REG_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={exportCSV} disabled={registrations.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-white/8 hover:text-white disabled:opacity-40">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/6 bg-white/3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                <Users className="mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm">{registrations.length === 0 ? 'No registrations yet.' : 'No results.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map((reg, idx) => {
                  const u = reg.users || reg.user || {};
                  const sc = REG_STATUS_CONFIG[reg.status] || REG_STATUS_CONFIG.registered;
                  return (
                    <div key={reg.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3">
                      <span className="w-5 text-center text-xs text-gray-500">{idx + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{u.full_name || '—'}</p>
                        <p className="truncate text-xs text-gray-500">{u.email || '—'}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {event.max_participants && (
            <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/3 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-gray-400"><Users className="h-4 w-4 text-gray-600" /> Capacity</div>
              <div className="text-right">
                <span className="font-bold text-white">{registrations.length}</span>
                <span className="text-gray-500"> / {event.max_participants}</span>
                {registrations.length >= event.max_participants && (
                  <span className="ml-2 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">Full</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed right-6 bottom-6 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-green-500/30 bg-green-500/20 text-green-300'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Status tabs ───────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: 'all',       label: 'All',       icon: CalendarDays  },
  { value: 'upcoming',  label: 'Upcoming',  icon: Clock         },
  { value: 'ongoing',   label: 'Ongoing',   icon: Zap           },
  { value: 'completed', label: 'Completed', icon: CheckCircle2  },
  { value: 'draft',     label: 'Draft',     icon: FileEdit      },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle       },
];

function filterFn(event, tab) {
  if (tab === 'all') return true;
  return event.status === tab;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function EventManagementClient({ initialEvents }) {
  const [events, setEvents] = useState(initialEvents);
  const [createModal, setCreateModal] = useState(false);
  const [viewRegEvent, setViewRegEvent] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const enriched = useMemo(() => events.map(enrichEvent), [events]);
  const sidebarStats = useMemo(() => computeStats('manage', enriched), [enriched]);
  const allCategories = useMemo(() => [...new Set(enriched.map((e) => e.category).filter(Boolean))], [enriched]);

  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.value === 'all' ? events.length : events.filter((e) => e.status === t.value).length,
  }));

  return (
    <>
      <EventListLayout
        pageHeader={{ icon: CalendarDays, title: 'Event Management', subtitle: 'Create, edit, and manage events', accent: 'blue' }}
        tabs={tabs}
        events={enriched}
        filterFn={filterFn}
        stats={sidebarStats}
        sidebarCta={null}
        rowProps={{ showStatus: true, showRegs: true }}
        renderDetail={(event, onBack) => (
          <ManageEventDetail
            event={event}
            onBack={onBack}
            allCategories={allCategories}
            saveAction={updateEventAction}
            uploadImageAction={uploadEventImageAction}
            deleteImageAction={deleteEventImageAction}
            deleteAction={(fd) => deleteEventAction(fd).then((res) => {
              if (!res?.error) setEvents((prev) => prev.filter((e) => e.id !== fd.get('id')));
              return res;
            })}
            onSaved={() => { showToast('Event saved!'); window.location.reload(); }}
            onDeleted={() => { showToast('Event deleted.'); window.location.reload(); }}
            onViewRegs={() => setViewRegEvent(event)}
          />
        )}
        listHeader={
          <div className="flex justify-end">
            <button onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 hover:bg-blue-500/20 transition-colors">
              <Plus className="h-4 w-4" /> Create Event
            </button>
          </div>
        }
      />

      {createModal && (
        <CreateEventModal
          onClose={() => setCreateModal(false)}
          onSuccess={() => { setCreateModal(false); showToast('Event created!'); window.location.reload(); }}
        />
      )}

      {viewRegEvent && (
        <RegistrationsModal event={viewRegEvent} onClose={() => setViewRegEvent(null)} />
      )}

      {toast && (
        <div className={`fixed right-6 bottom-6 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-green-500/30 bg-green-500/20 text-green-300'}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
