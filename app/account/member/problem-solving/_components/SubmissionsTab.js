/**
 * @file Submissions tab component
 * @module SubmissionsTab
 */

'use client';
import {
  CheckCircle2,
  Terminal,
  XCircle,
  ChevronLeft,
  Copy,
  Users,
  User,
  UserCheck,
  Trophy,
  Clock,
  MemoryStick,
  Lock,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const VIEW_MODES = [
  { id: 'Mine', icon: User, label: 'My Submissions' },
  { id: 'Club', icon: Users, label: 'Club' },
  { id: 'Following', icon: UserCheck, label: 'Following' },
  { id: 'Top', icon: Trophy, label: 'Top Global' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const row = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.18 } },
};

function verdictStyle(verdict) {
  const v = String(verdict || '').toUpperCase();
  if (v === 'OK' || v === 'AC' || v === 'ACCEPTED')
    return {
      label: 'Accepted',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/20',
      icon: CheckCircle2,
    };
  if (v.includes('WRONG') || v === 'WA')
    return {
      label: 'Wrong Answer',
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/10',
      borderColor: 'border-rose-400/20',
      icon: XCircle,
    };
  if (v === 'TLE')
    return {
      label: 'Time Limit Exceeded',
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
      icon: Clock,
    };
  return {
    label: verdict || 'Unknown',
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-400/10',
    borderColor: 'border-zinc-700',
    icon: Terminal,
  };
}

function relativeTime(iso) {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ComingSoonState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-zinc-800/60">
        <Lock className="h-5 w-5 text-zinc-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-zinc-400">{label} not available yet</p>
        <p className="text-xs text-zinc-600">This feature is coming soon.</p>
      </div>
    </div>
  );
}

export default function SubmissionsTab({ submissions = [], loading = false }) {
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('Mine');
  const [copied, setCopied] = useState(false);

  const displaySubmissions = useMemo(() => {
    if (viewMode !== 'Mine') return [];
    return submissions;
  }, [viewMode, submissions]);

  const selectedSub = useMemo(
    () => submissions.find((s) => s.id === selectedId),
    [submissions, selectedId]
  );

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ── Detail view ──────────────────────────────────────────────────── */
  if (selectedSub) {
    const style = verdictStyle(selectedSub.verdict);
    const Icon = style.icon;
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="detail"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="mx-auto max-w-4xl space-y-6 pb-12"
        >
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-2 text-xs font-semibold tracking-widest text-zinc-500 uppercase transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            All Submissions
          </button>

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/50">
            <div className="flex flex-col gap-5 border-b border-white/[0.07] p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${style.borderColor} ${style.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${style.color}`} />
                </div>
                <div>
                  <h2 className={`text-base font-semibold ${style.color}`}>
                    {style.label}
                  </h2>
                  <p className="mt-0.5 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
                    Submitted {relativeTime(selectedSub.submitted_at)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {[
                  {
                    icon: Clock,
                    label: 'Runtime',
                    value: selectedSub.execution_time_ms
                      ? `${selectedSub.execution_time_ms} ms`
                      : '—',
                  },
                  {
                    icon: MemoryStick,
                    label: 'Memory',
                    value: selectedSub.memory_kb
                      ? `${(selectedSub.memory_kb / 1024).toFixed(1)} MB`
                      : '—',
                  },
                ].map(({ icon: StatIcon, label, value }) => (
                  <div
                    key={label}
                    className="flex min-w-28 flex-col rounded-xl border border-white/[0.07] bg-zinc-950/60 p-3"
                  >
                    <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
                      <StatIcon className="h-3 w-3" /> {label}
                    </div>
                    <div className="text-base font-bold text-white tabular-nums">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSub.language && (
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.07] bg-zinc-950/50 px-5 py-3">
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-violet-400 uppercase">
                    <Terminal className="h-3.5 w-3.5" />
                    {selectedSub.language}
                  </div>
                  {selectedSub.source_code && (
                    <button
                      onClick={() => handleCopy(selectedSub.source_code)}
                      className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/4 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-zinc-400 transition-all hover:border-white/20 hover:text-white"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                {selectedSub.source_code ? (
                  <div className="bg-zinc-950 p-6">
                    <pre className="custom-scrollbar max-h-105 overflow-auto font-mono text-xs leading-relaxed text-zinc-300">
                      <code>{selectedSub.source_code}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-10 text-sm text-zinc-500">
                    Source code not stored.
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ── List view ────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex items-center gap-1">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            const active = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-violet-500/12 text-white'
                    : 'text-zinc-500 hover:bg-white/4 hover:text-zinc-300'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${active ? 'text-violet-400' : ''}`}
                />
                <span className="hidden sm:inline">{mode.label}</span>
                {active && (
                  <motion.div
                    layoutId="submissionsViewMode"
                    className="absolute inset-0 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {viewMode !== 'Mine' ? (
        <ComingSoonState label={VIEW_MODES.find((m) => m.id === viewMode)?.label} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900/40">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-120 border-collapse text-left text-sm">
              <thead className="border-b border-white/[0.07] bg-zinc-950/50">
                <tr className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="hidden px-5 py-4 font-semibold sm:table-cell">
                    Runtime / Memory
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Submitted
                  </th>
                </tr>
              </thead>
              <motion.tbody
                variants={container}
                initial="hidden"
                animate="show"
                className="divide-y divide-white/5"
              >
                {loading && (
                  <tr>
                    <td colSpan={3} className="py-16 text-center text-sm text-zinc-500">
                      Loading submissions...
                    </td>
                  </tr>
                )}
                {!loading && displaySubmissions.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-16 text-center text-sm text-zinc-500"
                    >
                      No submissions found for this problem.
                    </td>
                  </tr>
                )}
                {displaySubmissions.map((sub) => {
                  const style = verdictStyle(sub.verdict);
                  const Icon = style.icon;
                  return (
                    <motion.tr
                      key={sub.id}
                      variants={row}
                      onClick={() => setSelectedId(sub.id)}
                      className="group cursor-pointer transition-colors hover:bg-white/3"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${style.borderColor} ${style.bgColor}`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${style.color}`}>
                              {style.label}
                            </div>
                            {sub.language && (
                              <div className="mt-0.5 flex items-center gap-1.5 text-zinc-600">
                                <Terminal className="h-3 w-3" />
                                <span className="font-mono text-[10px]">
                                  {sub.language}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-4 sm:table-cell">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-[9px] tracking-widest text-zinc-600 uppercase">
                              Runtime
                            </span>
                            <span className="font-mono text-xs font-semibold text-zinc-300">
                              {sub.execution_time_ms
                                ? `${sub.execution_time_ms} ms`
                                : '—'}
                            </span>
                          </div>
                          <div className="h-5 w-px bg-white/6" />
                          <div className="flex flex-col">
                            <span className="font-mono text-[9px] tracking-widest text-zinc-600 uppercase">
                              Memory
                            </span>
                            <span className="font-mono text-xs font-semibold text-zinc-300">
                              {sub.memory_kb
                                ? `${(sub.memory_kb / 1024).toFixed(1)} MB`
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs font-medium text-zinc-400">
                          {relativeTime(sub.submitted_at)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
