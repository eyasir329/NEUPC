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
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_SUBMISSIONS = [
  {
    id: 1,
    status: 'Accepted',
    runtime: '54 ms',
    memory: '42.3 MB',
    language: 'C++',
    date: '2 mins ago',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
    code: '// Solution...',
  },
  {
    id: 2,
    status: 'Accepted',
    runtime: '82 ms',
    memory: '43.1 MB',
    language: 'Python3',
    date: '1 hour ago',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
    code: '# Solution...',
  },
  {
    id: 3,
    status: 'Wrong Answer',
    runtime: 'N/A',
    memory: 'N/A',
    language: 'Python3',
    date: '1 hour ago',
    icon: XCircle,
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
    borderColor: 'border-rose-400/20',
    code: '# Wrong solution...',
  },
];
const MOCK_CLUB_SUBMISSIONS = [
  {
    id: 101,
    username: 'alex_dev',
    status: 'Accepted',
    runtime: '48 ms',
    memory: '41.9 MB',
    language: 'C++',
    date: '3 hours ago',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
    code: '// Club solution...',
  },
  {
    id: 102,
    username: 'sarah_coder',
    status: 'Accepted',
    runtime: '75 ms',
    memory: '43.5 MB',
    language: 'Python3',
    date: 'yesterday',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
    code: '# Club solution...',
  },
];
const MOCK_FOLLOWING_SUBMISSIONS = [
  {
    id: 201,
    username: 'top_coder_99',
    status: 'Accepted',
    runtime: '41 ms',
    memory: '41.2 MB',
    language: 'C++',
    date: '5 days ago',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
    code: '// Pro solution...',
  },
];
const MOCK_TOP_SUBMISSIONS = [
  {
    id: 301,
    username: 'tourist',
    status: 'Accepted',
    runtime: '32 ms',
    memory: '40.1 MB',
    language: 'C++',
    date: 'During Contest',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
    code: '// Elite solution...',
    rank: 1,
  },
  {
    id: 302,
    username: 'jiangly',
    status: 'Accepted',
    runtime: '35 ms',
    memory: '40.5 MB',
    language: 'C++',
    date: 'During Contest',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
    code: '// Elite solution...',
    rank: 2,
  },
];

const VIEW_MODES = [
  { id: 'Mine', icon: User, label: 'My Submissions' },
  { id: 'Club', icon: Users, label: 'Club' },
  { id: 'Following', icon: UserCheck, label: 'Following' },
  { id: 'Top', icon: Trophy, label: 'Top Global' },
];

const allSubmissions = [
  ...MOCK_SUBMISSIONS,
  ...MOCK_CLUB_SUBMISSIONS,
  ...MOCK_FOLLOWING_SUBMISSIONS,
  ...MOCK_TOP_SUBMISSIONS,
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const row = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.18 } },
};

export default function SubmissionsTab() {
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [viewMode, setViewMode] = useState('Mine');
  const [topFilter, setTopFilter] = useState('10');
  const [copied, setCopied] = useState(false);

  const selectedSub = allSubmissions.find((s) => s.id === selectedSubId);

  const displaySubmissions =
    viewMode === 'Mine'
      ? MOCK_SUBMISSIONS
      : viewMode === 'Club'
        ? MOCK_CLUB_SUBMISSIONS
        : viewMode === 'Following'
          ? MOCK_FOLLOWING_SUBMISSIONS
          : MOCK_TOP_SUBMISSIONS.filter(
              (s) =>
                topFilter === 'Custom' || (s.rank || 0) <= parseInt(topFilter)
            );

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ── Detail view ──────────────────────────────────────────────────── */
  if (selectedSub) {
    const Icon = selectedSub.icon;
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
            onClick={() => setSelectedSubId(null)}
            className="flex items-center gap-2 text-xs font-semibold tracking-widest text-zinc-500 uppercase transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            All Submissions
          </button>

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/50">
            {/* Header row */}
            <div className="flex flex-col gap-5 border-b border-white/[0.07] p-6 md:flex-row md:items-center md:justify-between">
              {/* Status */}
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${selectedSub.borderColor} ${selectedSub.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${selectedSub.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2
                      className={`text-base font-semibold ${selectedSub.color}`}
                    >
                      {selectedSub.status}
                    </h2>
                    {'username' in selectedSub && (
                      <span className="rounded-md border border-white/[0.07] bg-white/4 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                        @{selectedSub.username}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
                    Submitted {selectedSub.date}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3">
                {[
                  { icon: Clock, label: 'Runtime', value: selectedSub.runtime },
                  {
                    icon: MemoryStick,
                    label: 'Memory',
                    value: selectedSub.memory,
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

            {/* Code viewer */}
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.07] bg-zinc-950/50 px-5 py-3">
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-violet-400 uppercase">
                  <Terminal className="h-3.5 w-3.5" />
                  {selectedSub.language}
                </div>
                <button
                  onClick={() => handleCopy(selectedSub.code)}
                  className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/4 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-zinc-400 transition-all hover:border-white/20 hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-zinc-950 p-6">
                <pre className="custom-scrollbar max-h-105 overflow-auto font-mono text-xs leading-relaxed text-zinc-300">
                  <code>{selectedSub.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ── List view ────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Tab bar + filter */}
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

        {viewMode === 'Top' && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Show
            </span>
            <select
              value={topFilter}
              onChange={(e) => setTopFilter(e.target.value)}
              className="rounded-lg border border-white/[0.07] bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 outline-none focus:border-violet-500/50"
            >
              <option value="10">Top 10</option>
              <option value="25">Top 25</option>
              <option value="50">Top 50</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900/40">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-150 border-collapse text-left text-sm">
            <thead className="border-b border-white/[0.07] bg-zinc-950/50">
              <tr className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {viewMode === 'Top' && (
                  <th className="px-5 py-4 font-semibold">Rank</th>
                )}
                <th className="px-5 py-4 font-semibold">Status</th>
                {viewMode !== 'Mine' && (
                  <th className="px-5 py-4 font-semibold">User</th>
                )}
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
              {displaySubmissions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-sm text-zinc-500"
                  >
                    No submissions found.
                  </td>
                </tr>
              )}
              {displaySubmissions.map((sub) => {
                const Icon = sub.icon;
                return (
                  <motion.tr
                    key={sub.id}
                    variants={row}
                    onClick={() => setSelectedSubId(sub.id)}
                    className="group cursor-pointer transition-colors hover:bg-white/3"
                  >
                    {viewMode === 'Top' && (
                      <td className="px-5 py-4">
                        <span
                          className={`font-mono text-sm font-bold ${sub.rank && sub.rank <= 3 ? 'text-amber-400' : 'text-zinc-500'}`}
                        >
                          #{String(sub.rank || '—').padStart(2, '0')}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${sub.borderColor} ${sub.bgColor}`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${sub.color}`} />
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${sub.color}`}>
                            {sub.status}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-zinc-600">
                            <Terminal className="h-3 w-3" />
                            <span className="font-mono text-[10px]">
                              {sub.language}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {viewMode !== 'Mine' && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.07] bg-zinc-800">
                            <User className="h-3 w-3 text-zinc-500" />
                          </div>
                          <span className="text-sm font-medium text-zinc-300">
                            @{sub.username}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-[9px] tracking-widest text-zinc-600 uppercase">
                            Runtime
                          </span>
                          <span className="font-mono text-xs font-semibold text-zinc-300">
                            {sub.runtime}
                          </span>
                        </div>
                        <div className="h-5 w-px bg-white/6" />
                        <div className="flex flex-col">
                          <span className="font-mono text-[9px] tracking-widest text-zinc-600 uppercase">
                            Memory
                          </span>
                          <span className="font-mono text-xs font-semibold text-zinc-300">
                            {sub.memory}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-xs font-medium text-zinc-400">
                        {sub.date}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
