/**
 * @file Registrations modal — overlay listing all participant
 *   registrations for a specific event with attendance status.
 * @module AdminRegistrationsModal
 */

'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Download,
  ExternalLink,
  UserCheck,
  Mail,
} from 'lucide-react';
import {
  getStatusConfig,
  getCategoryConfig,
  formatEventDate,
} from './eventConfig';

// ─── registration status config ───────────────────────────────────────────────

const REG_STATUS = {
  registered: {
    label: 'Registered',
    badge: 'bg-blue-500/20 text-blue-300',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-emerald-500/20 text-emerald-300',
    icon: CheckCircle2,
  },
  attended: {
    label: 'Attended',
    badge: 'bg-purple-500/20 text-purple-300',
    icon: UserCheck,
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-red-500/20 text-red-300',
    icon: XCircle,
  },
};

function RegStatusBadge({ status }) {
  const cfg = REG_STATUS[status] ?? REG_STATUS.registered;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── user avatar ──────────────────────────────────────────────────────────────

function Avatar({ name, src, size = 8 }) {
  const initials =
    name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';
  return (
    <div
      className={`flex h-${size} w-${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-bold text-gray-300`}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: size < 10 ? '10px' : '12px' }}>
          {initials}
        </span>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function RegistrationsModal({ event, onClose }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const sc = getStatusConfig(event.status);
  const cc = getCategoryConfig(event.category);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    async function fetchRegistrations() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/events/${event.id}/registrations`);
        if (!res.ok) throw new Error('Failed to fetch registrations.');
        const data = await res.json();
        setRegistrations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRegistrations();
  }, [event.id]);

  // filter
  const filtered = registrations.filter((r) => {
    const name = r.users?.full_name ?? '';
    const email = r.users?.email ?? '';
    const matchSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // stat counts
  const counts = registrations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  // CSV export
  function exportCSV() {
    const rows = [
      ['Name', 'Email', 'Status', 'Team Name', 'Registered At'],
      ...registrations.map((r) => [
        r.users?.full_name ?? '',
        r.users?.email ?? '',
        r.status,
        r.team_name ?? '',
        r.registered_at ? new Date(r.registered_at).toISOString() : '',
      ]),
    ];
    const csv = rows
      .map((row) => row.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${event.slug ?? event.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const STATUS_TABS = [
    'all',
    'registered',
    'confirmed',
    'attended',
    'cancelled',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl">
        {/* header */}
        <div className="border-b border-white/8 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-lg ${cc.placeholder}`}
              >
                {cc.icon}
              </div>
              <div>
                <h2 className="font-bold text-white">{event.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{formatEventDate(event.start_date)}</span>
                  <span>·</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${sc.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {/* stats summary */}
          {!loading && registrations.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(REG_STATUS).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/3 px-3 py-2"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                    <div>
                      <p className="text-base leading-none font-bold text-white tabular-nums">
                        {counts[key] ?? 0}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {cfg.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* toolbar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-white placeholder-gray-600 outline-none focus:border-white/20"
              />
            </div>
            <button
              onClick={exportCSV}
              disabled={registrations.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>

          {/* status filter tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filterStatus === tab
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'all'
                  ? `All (${registrations.length})`
                  : `${tab} (${counts[tab] ?? 0})`}
              </button>
            ))}
          </div>

          {/* list */}
          <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/6 bg-white/3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
                <p className="mt-3 text-sm text-gray-500">
                  Loading registrations…
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-red-400">
                <XCircle className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                <Users className="mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm">
                  {registrations.length === 0
                    ? 'No registrations yet.'
                    : 'No results match your filter.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map((reg) => {
                  const user = reg.users;
                  return (
                    <div
                      key={reg.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/3"
                    >
                      <Avatar name={user?.full_name} src={user?.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">
                            {user?.full_name ?? 'Unknown User'}
                          </p>
                          {reg.team_name && (
                            <span className="shrink-0 rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] text-gray-400">
                              Team: {reg.team_name}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Mail className="h-3 w-3 shrink-0 text-gray-600" />
                          <p className="truncate text-xs text-gray-500">
                            {user?.email ?? '—'}
                          </p>
                        </div>
                        {reg.registered_at && (
                          <p className="mt-0.5 text-[10px] text-gray-600">
                            {new Date(reg.registered_at).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <RegStatusBadge status={reg.status} />
                        {reg.certificate_issued && (
                          <span className="text-[10px] text-purple-400">
                            🎓 Cert issued
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* capacity indicator */}
          {event.max_participants && (
            <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/3 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="h-4 w-4 text-gray-600" />
                Capacity
              </div>
              <div className="text-right">
                <span className="font-bold text-white">
                  {registrations.length}
                </span>
                <span className="text-gray-500">
                  {' '}
                  / {event.max_participants}
                </span>
                {registrations.length >= event.max_participants && (
                  <span className="ml-2 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                    Full
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
