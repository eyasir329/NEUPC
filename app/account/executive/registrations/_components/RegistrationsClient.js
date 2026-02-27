'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  ClipboardCheck,
  Search,
  Users,
  CheckCircle,
  XCircle,
  UserCheck,
  Download,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import {
  execUpdateRegistrationAction,
  execMarkAttendedAction,
} from '@/app/_lib/executive-actions';

const STATUS_CONFIG = {
  registered: {
    label: 'Registered',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  attended: {
    label: 'Attended',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

export default function RegistrationsClient({ events }) {
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
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
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
          r.id === id
            ? {
                ...r,
                attended: !attended,
                status: !attended ? 'attended' : 'confirmed',
              }
            : r
        )
      );
      showToast(attended ? 'Marked as not attended.' : 'Marked as attended.');
    });
  };

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

  const filtered = registrations.filter((r) => {
    const name = r.user?.full_name?.toLowerCase() || '';
    const email = r.user?.email?.toLowerCase() || '';
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter((r) => r.status === 'confirmed').length,
    attended: registrations.filter((r) => r.attended).length,
    cancelled: registrations.filter((r) => r.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Event Registrations</h1>
        <p className="mt-1 text-gray-400">
          View and manage registrations for events
        </p>
      </div>

      {/* Event Selector */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Select Event
        </label>
        <div className="relative">
          <select
            value={selectedEventId}
            onChange={handleEventSelect}
            className="w-full appearance-none rounded-xl border border-white/10 bg-gray-900 px-4 py-3 pr-10 text-white focus:ring-1 focus:ring-blue-500/50 focus:outline-none"
          >
            <option value="">— Choose an event —</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.registrationCount} registered)
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {selectedEventId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total', value: stats.total, color: 'text-blue-400' },
              {
                label: 'Confirmed',
                value: stats.confirmed,
                color: 'text-cyan-400',
              },
              {
                label: 'Attended',
                value: stats.attended,
                color: 'text-green-400',
              },
              {
                label: 'Cancelled',
                value: stats.cancelled,
                color: 'text-red-400',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-1 text-3xl font-bold ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters + Export */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
              <Users className="mb-4 h-12 w-12 text-gray-600" />
              <p className="text-lg font-medium text-gray-400">
                No registrations found
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {[
                        '#',
                        'Name',
                        'Email',
                        'Status',
                        'Attended',
                        'Registered',
                        'Actions',
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-400 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((reg, idx) => {
                      const sc =
                        STATUS_CONFIG[reg.status] || STATUS_CONFIG.registered;
                      return (
                        <tr
                          key={reg.id}
                          className="transition-colors hover:bg-white/3"
                        >
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-white">
                              {reg.user?.full_name || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {reg.user?.email || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${sc.color}`}
                            >
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                handleToggleAttended(reg.id, reg.attended)
                              }
                              disabled={isPending}
                              className={`rounded-lg p-1 transition-colors ${reg.attended ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-white/5'}`}
                            >
                              {reg.attended ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <XCircle className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {reg.registered_at
                              ? new Date(reg.registered_at).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={reg.status}
                              onChange={(e) =>
                                handleStatusUpdate(reg.id, e.target.value)
                              }
                              disabled={isPending}
                              className="rounded-lg border border-white/10 bg-gray-900 px-2 py-1 text-xs text-white focus:outline-none"
                            >
                              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v.label}
                                </option>
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
      )}

      {!selectedEventId && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-20 text-center">
          <ClipboardCheck className="mb-4 h-14 w-14 text-gray-600" />
          <p className="text-xl font-semibold text-gray-300">Select an Event</p>
          <p className="mt-2 text-sm text-gray-500">
            Choose an event from the dropdown above to view its registrations
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-green-500/30 bg-green-500/20 text-green-300'}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
