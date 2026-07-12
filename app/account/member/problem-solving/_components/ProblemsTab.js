/**
 * @file Problems list tab.
 * @module ProblemsTab
 */

'use client';

import ProblemDetailModal from './ProblemDetailModal';
import { CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildProblemUrl, cn, formatNumber, getPaginationRange, getPlatformMeta, relativeTime, shortDate } from './ps-shared';

function ProblemsTab({ problems, loading, handles, recentSubmissions }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'solved' | 'unsolved'
  const [platformFilter, setPlatformFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | '7d' | '30d' | '90d' | '1y' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [now] = useState(() => Date.now());
  const [page, setPage] = useState(0);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const PAGE_SIZE = 15;

  // All connected platforms from handles; fall back to platforms seen in problems
  const availablePlatforms = useMemo(() => {
    if (handles && handles.length > 0) {
      return [
        ...new Set(
          handles.map((h) => (h.platform || '').toLowerCase()).filter(Boolean)
        ),
      ].sort();
    }
    return [
      ...new Set((problems || []).map((s) => s.platform).filter(Boolean)),
    ].sort();
  }, [handles, problems]);

  const list = useMemo(() => {
    let arr = problems || [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (s) =>
          (s.problem_name || '').toLowerCase().includes(q) ||
          (s.problem_id || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'solved') arr = arr.filter((s) => s.solved);
    if (statusFilter === 'unsolved') arr = arr.filter((s) => !s.solved);
    if (platformFilter !== 'all')
      arr = arr.filter((s) => s.platform === platformFilter);
    if (dateFilter !== 'all') {
      if (dateFilter === 'custom') {
        const startTime = customStartDate
          ? new Date(`${customStartDate}T00:00:00`).getTime()
          : null;
        const endTime = customEndDate
          ? new Date(`${customEndDate}T23:59:59.999`).getTime()
          : null;

        if (startTime !== null || endTime !== null) {
          arr = arr.filter((s) => {
            if (!s.submitted_at) return false;
            const submittedTime = new Date(s.submitted_at).getTime();
            if (Number.isNaN(submittedTime)) return false;
            if (startTime !== null && submittedTime < startTime) return false;
            if (endTime !== null && submittedTime > endTime) return false;
            return true;
          });
        }
      } else {
        const cutoffMs =
          {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365,
          }[dateFilter] * 86400000;
        const cutoff = now - cutoffMs;
        arr = arr.filter((s) => {
          if (!s.submitted_at) return false;
          return new Date(s.submitted_at).getTime() >= cutoff;
        });
      }
    }
    return arr;
  }, [
    problems,
    search,
    statusFilter,
    platformFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    now,
  ]);

  const totalSolved = (problems || []).filter((s) => s.solved).length;

  const easy = list.filter(
    (s) => (s.difficulty_rating || 0) > 0 && (s.difficulty_rating || 0) < 1400
  ).length;
  const medium = list.filter(
    (s) =>
      (s.difficulty_rating || 0) >= 1400 && (s.difficulty_rating || 0) < 1900
  ).length;
  const hard = list.filter((s) => (s.difficulty_rating || 0) >= 1900).length;

  const start = page * PAGE_SIZE;
  const visible = list.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const paginationRange = getPaginationRange(page, totalPages);

  if (loading) {
    return (
      <div className="animate-in fade-in mt-2 flex items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/50 p-24 shadow-lg backdrop-blur-xl duration-500">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
        <span className="ml-3 text-sm text-zinc-500">Loading problems…</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in mt-2 space-y-6 rounded-2xl border border-white/5 bg-zinc-900/50 p-6 pb-12 shadow-lg backdrop-blur-xl duration-500 md:p-8">
      {/* Stat Bar top */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="flex items-center gap-12">
          <div>
            <div className="mb-1.5 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              Total Solved
            </div>
            <div className="flex items-baseline gap-2 text-4xl font-black tracking-tight text-white">
              {formatNumber(totalSolved)}{' '}
              <span className="text-sm font-medium text-zinc-600">
                / {formatNumber((problems || []).length)}
              </span>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-white/10 sm:block" />

          <div>
            <div className="mb-2 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              Difficulty Split
            </div>
            <div className="flex items-center gap-5 text-sm">
              <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-medium text-emerald-300">
                  Easy
                </span>
                <span className="font-mono text-xs font-bold text-emerald-100">
                  {formatNumber(easy)}
                </span>
              </span>
              <span className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                <span className="text-xs font-medium text-amber-300">
                  Medium
                </span>
                <span className="font-mono text-xs font-bold text-amber-100">
                  {formatNumber(medium)}
                </span>
              </span>
              <span className="flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]" />
                <span className="text-xs font-medium text-rose-300">Hard</span>
                <span className="font-mono text-xs font-bold text-rose-100">
                  {formatNumber(hard)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 pt-2">
        {/* Row 1: search + status */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="group relative w-full sm:w-[360px]">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-indigo-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search problems by name or ID..."
              className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pr-4 pl-10 text-sm text-zinc-200 transition-all outline-none placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            {['all', 'solved', 'unsolved'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setStatusFilter(f);
                  setPage(0);
                }}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap capitalize transition-colors',
                  statusFilter === f
                    ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: platform + date filters */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {/* Platform filter */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              Platform
            </span>
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setPage(0);
              }}
              className="cursor-pointer rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All platforms</option>
              {availablePlatforms.map((p) => (
                <option key={p} value={p}>
                  {getPlatformMeta(p).name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden h-4 w-px bg-white/10 sm:block" />

          {/* Date filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="shrink-0 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              Date
            </span>
            {[
              { value: 'all', label: 'All time' },
              { value: '7d', label: '7 days' },
              { value: '30d', label: '30 days' },
              { value: '90d', label: '3 months' },
              { value: '1y', label: '1 year' },
              { value: 'custom', label: 'Custom' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  setDateFilter(value);
                  setPage(0);
                }}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                  dateFilter === value
                    ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                Start date
              </span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setPage(0);
                }}
                style={{ colorScheme: 'dark' }}
                className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                End date
              </span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setPage(0);
                }}
                style={{ colorScheme: 'dark' }}
                className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setDateFilter('all');
                setCustomStartDate('');
                setCustomEndDate('');
                setPage(0);
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium whitespace-nowrap text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Clear custom range
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 w-full overflow-x-auto rounded-xl border border-white/5 bg-black/20">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
            <tr>
              <th className="w-12 px-5 py-4 text-center font-semibold">
                Status
              </th>
              <th className="min-w-[220px] px-5 py-4 font-semibold">Problem</th>
              <th className="w-[140px] px-5 py-4 font-semibold">Tags</th>
              <th className="w-36 px-5 py-4 font-semibold">Platform</th>
              <th className="w-28 px-5 py-4 text-right font-semibold">
                Difficulty
              </th>
              <th className="w-36 px-5 py-4 text-right font-semibold">
                Submitted
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-300">
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-16 text-center text-sm text-zinc-500"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <Search className="h-8 w-8 text-zinc-600" />
                  </div>
                  {(problems || []).length === 0
                    ? 'No problems synced yet. Sync your platforms to see all your problems here.'
                    : 'No problems match your filters.'}
                </td>
              </tr>
            )}
            {visible.map((s, i) => {
              const isAc = s.solved === true;
              const verdict = String(s.verdict || '').toUpperCase();
              const isWa =
                !isAc && (verdict.includes('WRONG') || verdict === 'WA');
              const meta = getPlatformMeta(s.platform);
              const diff = s.difficulty_rating;
              const title = s.problem_name || s.problem_id;

              return (
                <tr
                  key={`${s.platform}-${s.problem_id}-${i}`}
                  className="group cursor-pointer transition-colors hover:bg-white/[0.04]"
                  onClick={() => setSelectedProblem(s)}
                >
                  <td className="px-5 py-4 text-center">
                    {isAc ? (
                      <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    ) : isWa ? (
                      <X className="mx-auto h-5 w-5 text-rose-500" />
                    ) : (
                      <div className="mx-auto h-2 w-2 rounded-full bg-zinc-600" />
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 font-semibold text-zinc-200 transition-colors group-hover:text-indigo-300">
                      <span
                        className="max-w-[180px] truncate sm:max-w-[320px]"
                        title={title}
                      >
                        {title}
                      </span>
                      {(s.problem_url ||
                        buildProblemUrl(s.platform, s.problem_id)) && (
                        <ExternalLink
                          className="h-3 w-3 shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            const url =
                              s.problem_url ||
                              buildProblemUrl(s.platform, s.problem_id);
                            window.open(url, '_blank', 'noopener');
                          }}
                        />
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-zinc-500">
                      ID: {s.problem_id}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(s.tags || []).slice(0, 2).map((tag, tIndex) => (
                        <span
                          key={tIndex}
                          className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] whitespace-nowrap text-zinc-400"
                        >
                          {tag.length > 10 ? tag.slice(0, 10) + '...' : tag}
                        </span>
                      ))}
                      {(s.tags || []).length > 2 && (
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500">{`+${(s.tags || []).length - 2}`}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md border px-2 py-1 text-[10px] font-bold tracking-wider uppercase',
                          meta.tagBg,
                          meta.tagText,
                          meta.tagBorder
                        )}
                      >
                        {meta.short}
                      </span>
                      <span className="hidden text-xs font-medium text-zinc-400 lg:inline">
                        {meta.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {diff ? (
                      <div
                        className={cn(
                          'inline-flex w-full items-center justify-end gap-1.5 font-mono text-xs font-bold',
                          diff < 1400
                            ? 'text-emerald-400'
                            : diff < 1900
                              ? 'text-amber-400'
                              : 'text-rose-400'
                        )}
                      >
                        {diff}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-xs font-medium text-zinc-400">
                      {relativeTime(s.submitted_at)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-zinc-600">
                      {shortDate(s.submitted_at)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <div className="text-sm font-medium text-zinc-500">
          Showing{' '}
          <span className="text-white">
            {list.length === 0 ? 0 : start + 1}
          </span>{' '}
          to{' '}
          <span className="text-white">
            {Math.min(start + PAGE_SIZE, list.length)}
          </span>{' '}
          of <span className="text-white">{list.length}</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {paginationRange.map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="flex h-8 w-8 items-center justify-center text-xs font-semibold text-zinc-600"
                  >
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-colors',
                    p === page
                      ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                      : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {selectedProblem && (
        <ProblemDetailModal
          problem={selectedProblem}
          recentSubmissions={recentSubmissions}
          onClose={() => setSelectedProblem(null)}
        />
      )}
    </div>
  );
}

// Simple SVG line chart for ratings
// Position the hover tooltip relative to the Rating History box so it always
// stays inside it: coordinates are converted from viewport space to box space,
// the tooltip is centered over the point and placed above it by default
// (flipped below near the top), then clamped to the box's bounds.

export { ProblemsTab };
