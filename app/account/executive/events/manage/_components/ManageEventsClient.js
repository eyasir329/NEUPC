'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Users,
  Globe,
  CheckCircle,
  Clock,
  Archive,
  FileEdit,
  X,
  ChevronDown,
  ClipboardCheck,
  UserCheck,
  XCircle,
  Download,
  Loader2,
} from 'lucide-react';
import {
  execCreateEventAction,
  execUpdateEventAction,
  execDeleteEventAction,
  execUpdateRegistrationAction,
  execMarkAttendedAction,
} from '@/app/_lib/executive-actions';
import { driveImageUrl } from '@/app/_lib/utils';
import { useScrollLock } from '@/app/_lib/hooks';
import { PageShell, PageHeader, GlassCard, StatCard } from '@/app/account/executive/_components/_ui';

const EVENT_STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  upcoming:  { label: 'Upcoming',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ongoing:   { label: 'Ongoing',   color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const REG_STATUS_CONFIG = {
  registered: { label: 'Registered', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  confirmed:  { label: 'Confirmed',  color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  attended:   { label: 'Attended',   color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const CATEGORIES = ['Workshop', 'Contest', 'Seminar', 'Bootcamp', 'Hackathon', 'Meetup', 'Other'];
const VENUE_TYPES = ['offline', 'online', 'hybrid'];

function EventModal({ event, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const isEdit = !!event?.id;
  useScrollLock();

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

  const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');

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
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-400">Title *</label>
              <input name="title" defaultValue={event?.title || ''} required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none"
                placeholder="Event title" />
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
              <input name="location" defaultValue={event?.location || ''} required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none"
                placeholder="Location or URL" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Venue Type</label>
              <select name="venue_type" defaultValue={event?.venue_type || 'offline'}
                className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-white focus:outline-none">
                {VENUE_TYPES.map((v) => (
                  <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
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
                {Object.entries(EVENT_STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Max Participants</label>
              <input name="max_participants" type="number" defaultValue={event?.max_participants || ''}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none"
                placeholder="Leave empty for unlimited" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Cover Image URL</label>
              <input name="cover_image" defaultValue={event?.cover_image || ''}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none"
                placeholder="https://..." />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Registration Deadline</label>
              <input name="registration_deadline" type="datetime-local" defaultValue={fmt(event?.registration_deadline)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-400">Description</label>
              <textarea name="description" defaultValue={event?.description || ''} rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none"
                placeholder="Short description" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-400">Tags (comma separated)</label>
              <input name="tags" defaultValue={event?.tags?.join(', ') || ''}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none"
                placeholder="cp, workshop, competitive" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input name="registration_required" type="checkbox" value="true"
                  defaultChecked={event?.registration_required} className="h-4 w-4 rounded accent-blue-500" />
                <span className="text-sm text-gray-400">Registration Required</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input name="is_featured" type="checkbox" value="true"
                  defaultChecked={event?.is_featured} className="h-4 w-4 rounded accent-purple-500" />
                <span className="text-sm text-gray-400">Featured</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400 hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
              {isPending ? 'Saving…' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventsTab({ events, setEvents }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  useScrollLock(!!deleteId);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = events.filter((e) => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSuccess = () => {
    setModal(null);
    showToast('Event saved successfully!');
    window.location.reload();
  };

  const handleDelete = (id) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', id);
      const res = await execDeleteEventAction(fd);
      if (res?.error) return showToast(res.error, 'error');
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setDeleteId(null);
      showToast('Event deleted.');
    });
  };

  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === 'upcoming').length,
    ongoing: events.filter((e) => e.status === 'ongoing').length,
    draft: events.filter((e) => e.status === 'draft').length,
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
        >
          <Plus className="h-4 w-4" /> Create Event
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Calendar}   label="Total Events" value={stats.total}    accent="blue"   />
        <StatCard icon={CheckCircle} label="Upcoming"    value={stats.upcoming} accent="cyan"   />
        <StatCard icon={Globe}       label="Ongoing"     value={stats.ongoing}  accent="emerald"/>
        <StatCard icon={FileEdit}    label="Drafts"      value={stats.draft}    accent="amber"  />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2.5 text-sm text-white focus:outline-none">
          <option value="all">All Status</option>
          {Object.entries(EVENT_STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
          <Calendar className="mb-4 h-12 w-12 text-gray-600" />
          <p className="text-lg font-medium text-gray-400">No events found</p>
          <p className="mt-1 text-sm text-gray-500">Create your first event to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ev) => {
            const sc = EVENT_STATUS_CONFIG[ev.status] || EVENT_STATUS_CONFIG.draft;
            return (
              <div key={ev.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/8">
                {ev.cover_image && (
                  <div className="h-36 overflow-hidden bg-gray-800">
                    <img src={driveImageUrl(ev.cover_image)} alt={ev.title}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-event.svg'; }}
                      className="h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90" />
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 leading-snug font-semibold text-white">{ev.title}</h3>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {ev.start_date ? new Date(ev.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {ev.category && (
                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">{ev.category}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {ev.registrationCount || 0} registered
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setModal(ev)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-xs text-gray-300 hover:bg-white/5">
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => setDeleteId(ev.id)}
                      className="flex items-center justify-center rounded-lg border border-red-500/20 p-1.5 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <EventModal event={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSuccess={handleSuccess} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete Event?</h3>
            <p className="mt-2 text-sm text-gray-400">This action cannot be undone. All registrations will also be affected.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} disabled={isPending}
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

function RegistrationsTab({ events }) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRegistrations = useCallback(async (eventId) => {
    if (!eventId) return setRegistrations([]);
    setLoading(true);
    try {
      const res = await fetch(`/api/account/events/${eventId}/registrations`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch {
      showToast('Failed to load registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEventSelect = (e) => {
    const id = e.target.value;
    setSelectedEventId(id);
    loadRegistrations(id);
  };

  const handleStatusUpdate = (id, status) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', id);
      fd.set('status', status);
      const res = await execUpdateRegistrationAction(fd);
      if (res?.error) return showToast(res.error, 'error');
      setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      showToast('Status updated.');
    });
  };

  const handleToggleAttended = (id, attended) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', id);
      fd.set('attended', String(!attended));
      const res = await execMarkAttendedAction(fd);
      if (res?.error) return showToast(res.error, 'error');
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, attended: !attended, status: !attended ? 'attended' : 'confirmed' } : r
        )
      );
      showToast(attended ? 'Marked as not attended.' : 'Marked as attended.');
    });
  };

  const filtered = registrations.filter((r) => {
    const name = r.user?.full_name?.toLowerCase() || '';
    const email = r.user?.email?.toLowerCase() || '';
    const matchSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Status', 'Attended', 'Registered At']];
    filtered.forEach((r) => {
      rows.push([
        r.user?.full_name || '',
        r.user?.email || '',
        r.status,
        r.attended ? 'Yes' : 'No',
        r.registered_at ? new Date(r.registered_at).toLocaleDateString() : '',
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${selectedEventId}.csv`;
    a.click();
  };

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter((r) => r.status === 'confirmed').length,
    attended: registrations.filter((r) => r.attended).length,
    cancelled: registrations.filter((r) => r.status === 'cancelled').length,
  };

  return (
    <>
      <GlassCard padding="p-5">
        <label className="mb-2 block text-sm font-medium text-gray-300">Select Event</label>
        <div className="relative">
          <select value={selectedEventId} onChange={handleEventSelect}
            className="w-full appearance-none rounded-xl border border-white/10 bg-gray-900 px-4 py-3 pr-10 text-white focus:ring-1 focus:ring-blue-500/50 focus:outline-none">
            <option value="">— Choose an event —</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title} ({e.registrationCount} registered)</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </GlassCard>

      {selectedEventId ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Users}       label="Total"     value={stats.total}     accent="blue"   />
            <StatCard icon={UserCheck}   label="Confirmed" value={stats.confirmed} accent="cyan"   />
            <StatCard icon={CheckCircle} label="Attended"  value={stats.attended}  accent="emerald"/>
            <StatCard icon={XCircle}     label="Cancelled" value={stats.cancelled} accent="rose"   />
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
              {Object.entries(REG_STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button onClick={exportCSV}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
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
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-white">{reg.user?.full_name || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">{reg.user?.email || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleToggleAttended(reg.id, reg.attended)} disabled={isPending}
                              className={`rounded-lg p-1 transition-colors ${reg.attended ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-white/5'}`}>
                              {reg.attended ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <select value={reg.status} onChange={(e) => handleStatusUpdate(reg.id, e.target.value)} disabled={isPending}
                              className="rounded-lg border border-white/10 bg-gray-900 px-2 py-1 text-xs text-white focus:outline-none">
                              {Object.entries(REG_STATUS_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-20 text-center">
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
    </>
  );
}

const TABS = [
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'registrations', label: 'Registrations', icon: ClipboardCheck },
];

export default function ManageEventsClient({ initialEvents }) {
  const [events, setEvents] = useState(initialEvents);
  const [activeTab, setActiveTab] = useState('events');

  return (
    <PageShell>
      <PageHeader
        icon={Calendar}
        title="Event Management"
        subtitle="Create, edit, and manage events and registrations"
        accent="blue"
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'events' ? (
        <EventsTab events={events} setEvents={setEvents} />
      ) : (
        <RegistrationsTab events={events} />
      )}
    </PageShell>
  );
}
