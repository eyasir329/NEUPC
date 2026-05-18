'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, Users, Search, CheckCircle2, XCircle, Clock, Loader2,
  Download, UserCheck, Mail, Ban, CalendarCheck, CalendarX,
  ShieldCheck, ChevronDown, AlertCircle, Trophy,
} from 'lucide-react';
import { useScrollLock } from '@/app/_lib/hooks';
import { getFallbackAvatarUrl } from '@/app/_lib/utils';

// ─── Config ───────────────────────────────────────────────────────────────────

const REG_STATUS = {
  registered: { label: 'Registered', dot: 'bg-blue-400',    badge: 'border-blue-500/30 bg-blue-500/10 text-blue-300',    icon: Clock        },
  confirmed:  { label: 'Confirmed',  dot: 'bg-emerald-400', badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', icon: CheckCircle2 },
  attended:   { label: 'Attended',   dot: 'bg-purple-400',  badge: 'border-purple-500/30 bg-purple-500/10 text-purple-300',  icon: UserCheck    },
  cancelled:  { label: 'Cancelled',  dot: 'bg-red-400',     badge: 'border-red-500/30 bg-red-500/10 text-red-300',        icon: XCircle      },
};

const MEMBER_ACCEPT = {
  accepted: { label: 'Accepted', color: 'text-emerald-400', icon: '✓' },
  declined: { label: 'Declined', color: 'text-red-400',     icon: '✕' },
  pending:  { label: 'Pending',  color: 'text-amber-400',   icon: '⏳' },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, src, size = 9 }) {
  const initials = name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  const fallback = getFallbackAvatarUrl(name || 'user');
  return (
    <div className={`flex h-${size} w-${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-xs font-bold text-slate-300 ring-1 ring-slate-700`}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" onError={(e) => { e.target.src = fallback; }} />
      ) : (
        <span style={{ fontSize: size < 9 ? '9px' : '11px' }}>{initials}</span>
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = REG_STATUS[status] ?? REG_STATUS.registered;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({ icon: Icon, label, colorClass, loading, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colorClass}`}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

// ─── Registration row ─────────────────────────────────────────────────────────

function RegRow({ reg, idx, onUpdateStatus, actionPending }) {
  const [expanded, setExpanded] = useState(false);
  const user = reg.users || reg.user;
  const isPending = actionPending === reg.id;
  const hasTeam = (reg.team_member_details ?? []).length > 0;

  const teamMembers = reg.team_member_details ?? [];
  const nonLeaders = (reg.member_acceptances ?? []).filter((a) => !a.is_leader);
  const pendingCount = nonLeaders.filter((a) => a.status === 'pending').length;
  const declinedCount = nonLeaders.filter((a) => a.status === 'declined').length;
  const allTeamAccepted = nonLeaders.length === 0 || (pendingCount === 0 && declinedCount === 0);

  return (
    <div className={`transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/30'} hover:bg-slate-800/40`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-5 py-3">
        {/* Index */}
        <span className="w-5 shrink-0 text-center text-[10px] font-mono text-slate-600">{idx + 1}</span>

        {/* Avatar */}
        <Avatar name={user?.full_name} src={user?.avatar_url} size={9} />

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">{user?.full_name ?? 'Unknown'}</p>
            {reg.team_name && (
              <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                {reg.team_name}
              </span>
            )}
            {reg.certificate_issued && (
              <span className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                <Trophy className="h-2.5 w-2.5" /> Cert
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0 text-slate-600" />
            <p className="truncate text-xs text-slate-500">{user?.email ?? '—'}</p>
            {reg.registered_at && (
              <>
                <span className="text-slate-700">·</span>
                <p className="shrink-0 text-[10px] text-slate-600">
                  {new Date(reg.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={reg.status} />

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {reg.status !== 'cancelled' ? (
              <>
                {reg.status === 'registered' && (
                  <ActionBtn
                    icon={ShieldCheck}
                    label={allTeamAccepted ? 'Confirm' : `Wait (${pendingCount + declinedCount})`}
                    colorClass="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                    loading={isPending}
                    disabled={nonLeaders.length > 0 && !allTeamAccepted}
                    title={pendingCount > 0 ? `${pendingCount} member(s) pending` : declinedCount > 0 ? `${declinedCount} declined` : undefined}
                    onClick={() => onUpdateStatus(reg.id, 'confirmed')}
                  />
                )}
                {reg.status === 'confirmed' && (
                  <ActionBtn
                    icon={CalendarCheck}
                    label="Attended"
                    colorClass="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20"
                    loading={isPending}
                    onClick={() => onUpdateStatus(reg.id, 'attended')}
                  />
                )}
                {reg.status === 'attended' && (
                  <ActionBtn
                    icon={CalendarX}
                    label="Undo"
                    colorClass="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                    loading={isPending}
                    onClick={() => onUpdateStatus(reg.id, 'confirmed')}
                  />
                )}
                <ActionBtn
                  icon={Ban}
                  label="Cancel"
                  colorClass="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                  loading={isPending}
                  onClick={() => onUpdateStatus(reg.id, 'cancelled')}
                />
              </>
            ) : (
              <ActionBtn
                icon={UserCheck}
                label="Restore"
                colorClass="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                loading={isPending}
                onClick={() => onUpdateStatus(reg.id, 'registered')}
              />
            )}
          </div>

          {/* Expand team */}
          {hasTeam && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-700 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-300"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Team members expanded */}
      {hasTeam && expanded && (
        <div className="border-t border-slate-800/60 bg-slate-900/60 px-5 pb-3 pt-2.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Team Members ({teamMembers.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {teamMembers.map((m) => {
              const acc = (reg.member_acceptances ?? []).find((a) => a.user_id === m.id);
              const st = acc?.status ?? 'pending';
              const stCfg = MEMBER_ACCEPT[st] ?? MEMBER_ACCEPT.pending;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={m.full_name} src={m.avatar_url} size={6} />
                    <span className="text-xs text-slate-300">{m.full_name}</span>
                    {acc?.is_leader && (
                      <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400">Leader</span>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold ${stCfg.color}`}>
                    {stCfg.icon} {stCfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Shared registration modal for admin and executive roles.
 *
 * Props:
 *   event          — event object
 *   onClose        — close callback
 *   fetchUrl       — API URL to GET registrations
 *   onUpdateStatus — async (id, status) => void
 *   dataKey        — key in API response that holds the array (default: null = root array)
 *   userKey        — 'users' (admin) | 'user' (exec)
 */
export default function RegistrationsModal({
  event,
  onClose,
  fetchUrl,
  onUpdateStatus,
  dataKey = null,
  userKey = 'users',
}) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionPending, setActionPending] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [toast, setToast] = useState(null);

  useScrollLock();

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    fetch(fetchUrl)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
      .then((data) => setRegistrations(dataKey ? (data[dataKey] ?? []) : (Array.isArray(data) ? data : [])))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fetchUrl, dataKey]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleUpdateStatus = useCallback(async (id, status) => {
    setActionPending(id);
    setActionError(null);
    try {
      await onUpdateStatus(id, status, registrations, setRegistrations);
      showToast('Status updated.');
    } catch (err) {
      setActionError(err.message || 'Update failed.');
    } finally {
      setActionPending(null);
    }
  }, [onUpdateStatus, registrations, showToast]);

  const filtered = registrations.filter((r) => {
    const user = r.users || r.user;
    const name = user?.full_name?.toLowerCase() ?? '';
    const email = user?.email?.toLowerCase() ?? '';
    const team = (r.team_name ?? '').toLowerCase();
    const members = (r.team_member_details ?? []).map((m) => `${m.full_name ?? ''} ${m.email ?? ''}`).join(' ').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || email.includes(q) || team.includes(q) || members.includes(q);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = registrations.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {});
  const attendedCount = registrations.filter((r) => r.status === 'attended' || r.attended).length;

  function exportCSV() {
    const rows = [
      ['Name', 'Email', 'Status', 'Team', 'Team Members', 'Registered At'],
      ...registrations.map((r) => {
        const user = r.users || r.user;
        return [
          user?.full_name ?? '', user?.email ?? '', r.status, r.team_name ?? '',
          (r.team_member_details ?? []).map((m) => m.full_name).join('; '),
          r.registered_at ? new Date(r.registered_at).toISOString() : '',
        ];
      }),
    ];
    const csv = rows.map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `registrations-${event.slug ?? event.id}.csv`,
    });
    a.click();
  }

  const pct = event.max_participants
    ? Math.min(100, Math.round((registrations.length / event.max_participants) * 100))
    : null;
  const isFull = event.max_participants && registrations.length >= event.max_participants;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0c0f18] shadow-2xl">

        {/* ── Header ── */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">{event.title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Registrations · {registrations.length} total
              {event.max_participants && ` · ${event.max_participants} cap`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-500 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Stat strip ── */}
        {!loading && registrations.length > 0 && (
          <div className="grid shrink-0 grid-cols-4 divide-x divide-slate-800 border-b border-slate-800">
            {[
              { key: 'registered', label: 'Registered', val: counts.registered ?? 0, color: 'text-blue-400'    },
              { key: 'confirmed',  label: 'Confirmed',  val: counts.confirmed  ?? 0, color: 'text-emerald-400' },
              { key: 'attended',   label: 'Attended',   val: attendedCount,           color: 'text-purple-400'  },
              { key: 'cancelled',  label: 'Cancelled',  val: counts.cancelled  ?? 0, color: 'text-red-400'     },
            ].map(({ key, label, val, color }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
                className={`flex flex-col items-center justify-center py-3 transition-colors hover:bg-slate-800/40 ${filterStatus === key ? 'bg-slate-800/60' : ''}`}
              >
                <span className={`text-xl font-bold tabular-nums ${color}`}>{val}</span>
                <span className="text-[10px] text-slate-500">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Capacity bar ── */}
        {pct !== null && (
          <div className="shrink-0 border-b border-slate-800 px-6 py-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
              <span>Capacity</span>
              <span className={isFull ? 'font-bold text-red-400' : 'text-slate-400'}>
                {registrations.length} / {event.max_participants}{isFull ? ' · Full' : ''}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-800 px-6 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, team…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/40"
            />
          </div>
          {/* Status filter pill buttons */}
          <div className="flex items-center gap-1">
            {['all', ...Object.keys(REG_STATUS)].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                  filterStatus === tab
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {tab === 'all' ? `All (${registrations.length})` : REG_STATUS[tab].label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            disabled={registrations.length === 0}
            title="Export CSV"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-[11px] font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-white disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>

        {/* ── Action error ── */}
        {actionError && (
          <div className="mx-6 mt-3 flex shrink-0 items-center justify-between rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <div className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 shrink-0" /> {actionError}</div>
            <button onClick={() => setActionError(null)}><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* ── List ── */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">Loading registrations…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <XCircle className="mb-3 h-10 w-10 text-red-400/40" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="mb-3 h-10 w-10 text-slate-700" />
              <p className="text-sm text-slate-500">
                {registrations.length === 0 ? 'No registrations yet.' : 'No results match your filter.'}
              </p>
              {registrations.length > 0 && (
                <button onClick={() => { setSearch(''); setFilterStatus('all'); }}
                  className="mt-2 text-xs text-indigo-400 hover:underline">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filtered.map((reg, idx) => (
                <RegRow
                  key={reg.id}
                  reg={reg}
                  idx={idx}
                  onUpdateStatus={handleUpdateStatus}
                  actionPending={actionPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-800 px-6 py-3">
          <p className="text-[11px] text-slate-600">
            {filtered.length} of {registrations.length} shown
            {filterStatus !== 'all' && ` · filtered by ${filterStatus}`}
          </p>
          <button onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-white">
            Close
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl transition-all ${
          toast.type === 'error'
            ? 'border-red-500/30 bg-red-950/90 text-red-300'
            : 'border-emerald-500/30 bg-emerald-950/90 text-emerald-300'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
