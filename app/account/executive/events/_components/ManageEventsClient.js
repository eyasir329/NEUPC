'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CalendarCheck, ClipboardCheck, Plus, Search,
  Users, Globe, CheckCircle, FileEdit, X, ChevronDown,
  UserCheck, XCircle, Download, Loader2,
} from 'lucide-react';
import {
  execCreateEventAction, execUpdateEventAction, execDeleteEventAction,
  execUpdateRegistrationAction, execMarkAttendedAction,
} from '@/app/_lib/executive-actions';
import { useScrollLock } from '@/app/_lib/hooks';
import { PageShell, PageHeader, TabBar, GlassCard, StatCard } from '@/app/account/executive/_components/_ui';
import EventListLayout from '@/app/account/_components/events/EventListLayout';
import { enrichEvent } from '@/app/account/_components/events/eventUtils';
import { EVENT_STATUS_CONFIG, REG_STATUS_CONFIG, CATEGORIES, VENUE_TYPES } from '@/app/account/_components/events/eventConstants';

// ─── Event form modal ──────────────────────────────────────────────────────────

function EventModal({ event, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const isEdit = !!event?.id;
  useScrollLock();

  const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.target);
    if (isEdit) fd.set('id', event.id);
    startTransition(async () => {
      const res = isEdit ? await execUpdateEventAction(fd) : await execCreateEventAction(fd);
      if (res?.error) return setError(res.error);
      onSuccess();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-bold text-white">{isEdit ? 'Edit Event' : 'Create Event'}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-400">Title *</label>
              <input name="title" defaultValue={event?.title || ''} required placeholder="Event title"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Start Date *</label>
              <input name="start_date" type="datetime-local" defaultValue={fmt(event?.start_date)} required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:ring-1 focus:ring-blue-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">End Date</label>
              <input name="end_date" type="datetime-local" defaultValue={fmt(event?.end_date)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:ring-1 focus:ring-blue-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Location *</label>
              <input name="location" defaultValue={event?.location || ''} required placeholder="Location or URL"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Venue Type</label>
              <select name="venue_type" defaultValue={event?.venue_type || 'offline'}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-white focus:outline-none">
                {VENUE_TYPES.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Category</label>
              <select name="category" defaultValue={event?.category || ''}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-white focus:outline-none">
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Status</label>
              <select name="status" defaultValue={event?.status || 'draft'}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-white focus:outline-none">
                {Object.entries(EVENT_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Max Participants</label>
              <input name="max_participants" type="number" defaultValue={event?.max_participants || ''} placeholder="Unlimited"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Cover Image URL</label>
              <input name="cover_image" defaultValue={event?.cover_image || ''} placeholder="https://..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Registration Deadline</label>
              <input name="registration_deadline" type="datetime-local" defaultValue={fmt(event?.registration_deadline)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-400">Description</label>
              <textarea name="description" defaultValue={event?.description || ''} rows={3} placeholder="Short description"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-400">Tags (comma separated)</label>
              <input name="tags" defaultValue={event?.tags?.join(', ') || ''} placeholder="cp, workshop, competitive"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input name="registration_required" type="checkbox" value="true" defaultChecked={event?.registration_required} className="h-4 w-4 rounded accent-blue-500" />
                <span className="text-sm text-gray-400">Registration Required</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input name="is_featured" type="checkbox" value="true" defaultChecked={event?.is_featured} className="h-4 w-4 rounded accent-purple-500" />
                <span className="text-sm text-gray-400">Featured</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
              {isPending ? 'Saving…' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Registrations tab ─────────────────────────────────────────────────────────

function RegistrationsTab({ events }) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadRegistrations = useCallback(async (eventId) => {
    if (!eventId) return setRegistrations([]);
    setLoading(true);
    try {
      const res = await fetch(`/api/account/events/${eventId}/registrations`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch { showToast('Failed to load registrations', 'error'); }
    finally { setLoading(false); }
  }, []);

  const handleStatusUpdate = (id, status) => {
    startTransition(async () => {
      const fd = new FormData(); fd.set('id', id); fd.set('status', status);
      const res = await execUpdateRegistrationAction(fd);
      if (res?.error) return showToast(res.error, 'error');
      setRegistrations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      showToast('Status updated.');
    });
  };

  const handleToggleAttended = (id, attended) => {
    startTransition(async () => {
      const fd = new FormData(); fd.set('id', id); fd.set('attended', String(!attended));
      const res = await execMarkAttendedAction(fd);
      if (res?.error) return showToast(res.error, 'error');
      setRegistrations((prev) => prev.map((r) => r.id === id ? { ...r, attended: !attended, status: !attended ? 'attended' : 'confirmed' } : r));
      showToast(attended ? 'Marked as not attended.' : 'Marked as attended.');
    });
  };

  const filtered = registrations.filter((r) => {
    const name = r.user?.full_name?.toLowerCase() || '';
    const email = r.user?.email?.toLowerCase() || '';
    const matchSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    return matchSearch && (statusFilter === 'all' || r.status === statusFilter);
  });

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Status', 'Attended', 'Registered At'],
      ...filtered.map((r) => [r.user?.full_name || '', r.user?.email || '', r.status, r.attended ? 'Yes' : 'No', r.registered_at ? new Date(r.registered_at).toLocaleDateString() : ''])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `registrations-${selectedEventId}.csv` });
    a.click();
  };

  const regStats = {
    total: registrations.length,
    confirmed: registrations.filter((r) => r.status === 'confirmed').length,
    attended: registrations.filter((r) => r.attended).length,
    cancelled: registrations.filter((r) => r.status === 'cancelled').length,
  };

  return (
    <div className="flex flex-col gap-6">
      <GlassCard padding="p-5">
        <label className="mb-2 block text-sm font-medium text-gray-300">Select Event</label>
        <div className="relative">
          <select value={selectedEventId} onChange={(e) => { setSelectedEventId(e.target.value); loadRegistrations(e.target.value); }}
            className="w-full appearance-none rounded-xl border border-white/10 bg-gray-900 px-4 py-3 pr-10 text-white focus:ring-1 focus:ring-blue-500/50 focus:outline-none">
            <option value="">— Choose an event —</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title} ({e.registrationCount} registered)</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </GlassCard>

      {selectedEventId ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Users}       label="Total"     value={regStats.total}     accent="blue"   />
            <StatCard icon={UserCheck}   label="Confirmed" value={regStats.confirmed} accent="cyan"   />
            <StatCard icon={CheckCircle} label="Attended"  value={regStats.attended}  accent="emerald"/>
            <StatCard icon={XCircle}     label="Cancelled" value={regStats.cancelled} accent="rose"   />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2.5 text-sm text-white focus:outline-none">
              <option value="all">All Status</option>
              {Object.entries(REG_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/2 py-16 text-center">
              <Users className="mb-4 h-12 w-12 text-gray-600" />
              <p className="text-lg font-medium text-gray-400">No registrations found</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['#', 'Name', 'Email', 'Status', 'Attended', 'Registered', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((reg, idx) => {
                      const sc = REG_STATUS_CONFIG[reg.status] || REG_STATUS_CONFIG.registered;
                      return (
                        <tr key={reg.id} className="transition-colors hover:bg-white/3">
                          <td className="px-4 py-3 text-xs text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-white">{reg.user?.full_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{reg.user?.email || '—'}</td>
                          <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span></td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleToggleAttended(reg.id, reg.attended)} disabled={isPending}
                              className={`rounded-lg p-1 transition-colors ${reg.attended ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-white/5'}`}>
                              {reg.attended ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">
                            <select value={reg.status} onChange={(e) => handleStatusUpdate(reg.id, e.target.value)} disabled={isPending}
                              className="rounded-lg border border-white/10 bg-gray-900 px-2 py-1 text-xs text-white focus:outline-none">
                              {Object.entries(REG_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/2 py-20 text-center">
          <ClipboardCheck className="mb-4 h-14 w-14 text-gray-600" />
          <p className="text-xl font-semibold text-gray-300">Select an Event</p>
          <p className="mt-2 text-sm text-gray-500">Choose an event from the dropdown above to view its registrations</p>
        </div>
      )}

      {toast && (
        <div className={`fixed right-6 bottom-6 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-green-500/30 bg-green-500/20 text-green-300'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Events tab ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: 'all',       label: 'All',       icon: Calendar      },
  { value: 'upcoming',  label: 'Upcoming',  icon: Calendar      },
  { value: 'ongoing',   label: 'Ongoing',   icon: Globe         },
  { value: 'completed', label: 'Completed', icon: CalendarCheck },
  { value: 'draft',     label: 'Draft',     icon: FileEdit      },
];

function filterFn(event, tab) {
  if (tab === 'all') return true;
  return event.status === tab;
}

function EventsTab({ events, setEvents }) {
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  useScrollLock(!!deleteTarget);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSuccess = () => { setModal(null); showToast('Event saved!'); window.location.reload(); };

  const handleDelete = (id) => {
    startTransition(async () => {
      const fd = new FormData(); fd.set('id', id);
      const res = await execDeleteEventAction(fd);
      if (res?.error) return showToast(res.error, 'error');
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setDeleteTarget(null);
      showToast('Event deleted.');
    });
  };

  const enriched = useMemo(() => events.map(enrichEvent), [events]);

  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === 'upcoming').length,
    ongoing: events.filter((e) => e.status === 'ongoing').length,
    draft: events.filter((e) => e.status === 'draft').length,
  };

  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.value === 'all' ? events.length : events.filter((e) => e.status === t.value).length,
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Calendar}    label="Total Events" value={stats.total}    accent="blue"   />
        <StatCard icon={CheckCircle} label="Upcoming"     value={stats.upcoming} accent="cyan"   />
        <StatCard icon={Globe}       label="Ongoing"      value={stats.ongoing}  accent="emerald"/>
        <StatCard icon={FileEdit}    label="Drafts"       value={stats.draft}    accent="amber"  />
      </div>

      <EventListLayout
        pageHeader={null}
        tabs={tabs}
        events={enriched}
        filterFn={filterFn}
        stats={[]}
        sidebarCta={null}
        rowProps={{
          showStatus: true,
          showCover: true,
          showRegs: true,
          onEdit: setModal,
          onDelete: setDeleteTarget,
        }}
        getDetailProps={(event) => ({
          detailRows: [
            { label: 'Status',   value: EVENT_STATUS_CONFIG[event.status]?.label ?? event.status },
            { label: 'Category', value: event._type },
            { label: 'Registered', value: event.registrationCount || 0 },
          ],
        })}
        aboveList={
          <div className="flex justify-end">
            <button onClick={() => setModal('create')}
              className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 hover:bg-blue-500/20 transition-colors">
              <Plus className="h-4 w-4" /> Create Event
            </button>
          </div>
        }
      />

      {modal && (
        <EventModal event={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSuccess={handleSuccess} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete Event?</h3>
            <p className="mt-2 text-sm text-gray-400">This action cannot be undone. All registrations will also be affected.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget.id)} disabled={isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60">
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed right-6 bottom-6 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-green-500/30 bg-green-500/20 text-green-300'}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

const ROOT_TABS = [
  { value: 'events',        label: 'Events',        icon: Calendar      },
  { value: 'registrations', label: 'Registrations', icon: ClipboardCheck },
];

export default function ManageEventsClient({ initialEvents }) {
  const [events, setEvents] = useState(initialEvents);
  const [activeTab, setActiveTab] = useState('events');

  return (
    <PageShell>
      <PageHeader icon={Calendar} title="Event Management" subtitle="Create, edit, and manage events and registrations" accent="blue" />
      <TabBar tabs={ROOT_TABS} value={activeTab} onChange={setActiveTab} />
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {activeTab === 'events'
            ? <EventsTab events={events} setEvents={setEvents} />
            : <RegistrationsTab events={events} />}
        </motion.div>
      </AnimatePresence>
    </PageShell>
  );
}
