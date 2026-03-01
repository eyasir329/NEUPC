/**
 * @file Certificate generator client — executive tool for issuing
 *   certificates to event participants and contest winners with
 *   template selection and batch generation.
 * @module ExecutiveGenerateCertificatesClient
 */

'use client';

import { useState, useTransition } from 'react';
import {
  Award,
  Plus,
  Search,
  Download,
  Trophy,
  Calendar,
  Users,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  execCreateCertificateAction,
  execBulkCreateCertificatesAction,
} from '@/app/_lib/executive-actions';

const CERT_TYPES = [
  'participation',
  'achievement',
  'winner',
  'runner_up',
  'merit',
];

function CertBadge({ type }) {
  const colors = {
    winner: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    runner_up: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    achievement: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    participation: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    merit: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${colors[type] || colors.participation}`}
    >
      {type?.replace('_', ' ')}
    </span>
  );
}

function GenerateForm({ events, contests, users, onSuccess }) {
  const [mode, setMode] = useState('single');
  const [sourceType, setSourceType] = useState('event');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const sources = sourceType === 'event' ? events : contests;

  const handleSingle = (e) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.target);
    const sourceId = fd.get('source_id');
    fd.delete('source_id');
    fd.delete('source_type');
    if (sourceType === 'event') fd.set('event_id', sourceId);
    else fd.set('contest_id', sourceId);
    startTransition(async () => {
      const res = await execCreateCertificateAction(fd);
      if (res?.error) return setError(res.error);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onSuccess();
      }, 1500);
    });
  };

  const handleBulk = (e) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.target);
    const sourceId = fd.get('source_id');
    fd.delete('source_id');
    fd.delete('source_type');
    if (sourceType === 'event') fd.set('event_id', sourceId);
    else fd.set('contest_id', sourceId);
    startTransition(async () => {
      const res = await execBulkCreateCertificatesAction(fd);
      if (res?.error) return setError(res.error);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onSuccess();
      }, 1500);
    });
  };

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">
        Generate Certificates
      </h2>

      {/* Mode toggle */}
      <div className="flex w-fit rounded-xl border border-white/10 bg-white/5 p-1">
        {[
          { key: 'single', label: 'Single' },
          { key: 'bulk', label: 'Bulk (All Registrants)' },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${mode === m.key ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-300'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Source type */}
      <div className="flex gap-3">
        {['event', 'contest'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSourceType(t)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-all ${sourceType === t ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
          >
            {t === 'event' ? (
              <Calendar className="h-4 w-4" />
            ) : (
              <Trophy className="h-4 w-4" />
            )}
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {done && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          <CheckCircle className="h-4 w-4" /> Certificate(s) generated!
        </div>
      )}

      {mode === 'single' ? (
        <form onSubmit={handleSingle} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">
              {sourceType === 'event' ? 'Event' : 'Contest'} *
            </label>
            <select
              name="source_id"
              required
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="">Select…</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">
              Recipient *
            </label>
            <select
              name="recipient_id"
              required
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="">Select user…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">
              Certificate Title *
            </label>
            <input
              name="title"
              required
              placeholder="Certificate of Participation"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Type</label>
            <select
              name="certificate_type"
              defaultValue="participation"
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              {CERT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">
              Issue Date
            </label>
            <input
              name="issue_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Award className="h-4 w-4" />
              )}
              {isPending ? 'Generating…' : 'Issue Certificate'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBulk} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">
              {sourceType === 'event' ? 'Event' : 'Contest'} *
            </label>
            <select
              name="source_id"
              required
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="">Select…</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">
              Certificate Title *
            </label>
            <input
              name="title"
              required
              placeholder="Certificate of Participation"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Type</label>
            <select
              name="certificate_type"
              defaultValue="participation"
              className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              {CERT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">
              Issue Date
            </label>
            <input
              name="issue_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <p className="mb-3 text-xs text-gray-500">
              Certificates will be issued to all attended registrants of the
              selected {sourceType}.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {isPending ? 'Generating…' : 'Bulk Issue Certificates'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function GenerateCertificatesClient({
  events,
  contests,
  certificates: initialCerts,
  users,
}) {
  const [certificates, setCertificates] = useState(initialCerts);
  const [search, setSearch] = useState('');

  const filtered = certificates.filter((c) => {
    const q = search.toLowerCase();
    return (
      !search ||
      c.title?.toLowerCase().includes(q) ||
      c.users?.full_name?.toLowerCase().includes(q) ||
      c.users?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 px-4 pt-6 pb-8 sm:space-y-10 sm:px-6 sm:pt-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Certificates</h1>
          <p className="mt-1 text-gray-400">
            Issue and manage certificates for events and contests
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center">
          <p className="text-3xl font-bold text-blue-400">
            {certificates.length}
          </p>
          <p className="text-xs text-gray-400">Total Issued</p>
        </div>
      </div>

      {/* Generate form */}
      <GenerateForm
        events={events}
        contests={contests}
        users={users}
        onSuccess={() => window.location.reload()}
      />

      {/* History */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">
            Certificate History
          </h2>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none sm:w-64"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-14 text-center">
            <Award className="mb-4 h-12 w-12 text-gray-600" />
            <p className="text-lg font-medium text-gray-400">
              No certificates yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Issue certificates using the form above
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs tracking-wide text-gray-500 uppercase">
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Certificate</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="hidden px-4 py-3 md:table-cell">Source</th>
                    <th className="hidden px-4 py-3 lg:table-cell">
                      Issue Date
                    </th>
                    <th className="px-4 py-3">
                      <Download className="h-4 w-4" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-white/3"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">
                          {c.users?.full_name || '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.users?.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{c.title}</td>
                      <td className="px-4 py-3">
                        <CertBadge type={c.certificate_type} />
                      </td>
                      <td className="hidden px-4 py-3 text-gray-400 capitalize md:table-cell">
                        {c.event_id ? 'Event' : 'Contest'}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                        {c.issue_date
                          ? new Date(c.issue_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {c.certificate_url ? (
                          <a
                            href={c.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-lg p-2 text-blue-400 hover:bg-blue-500/10"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/10 px-4 py-3 text-xs text-gray-500">
              {filtered.length} of {certificates.length} certificates
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
