/**
 * @file Problem Solving Client Component
 * @module ProblemSolvingClient
 *
 * Sidebar-based dashboard layout matching the dark mockup.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  House,
  List,
  Trophy,
  BookOpen,
  Crown,
  Sparkles,
  Lightbulb,
  Target,
  User as UserIcon,
  Settings,
  Search,
  Funnel,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Calendar,
  Bell,
  Radar,
  LineChart,
  Clock,
} from 'lucide-react';
import {
  useProblemSolving,
  useConnectHandle,
} from '@/app/_hooks/useProblemSolving';
import ProblemDetailModal from './ProblemDetailModal';

// =====================================================================
// Constants & helpers
// =====================================================================

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: House },
  { id: 'problems', label: 'Problems', icon: List },
  { id: 'contests', label: 'Contests', icon: Trophy },
  { id: 'topics', label: 'Topics', icon: BookOpen },
  { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
  { id: 'recommended', label: 'Recommendations', icon: Sparkles },
  { id: 'profile', label: 'My Profile', icon: UserIcon },
];

const PLATFORM_META = {
  codeforces: {
    short: 'CF',
    name: 'Codeforces',
    color: 'bg-[#f87171]',
    dot: 'bg-[#f87171]',
    tagBg: 'bg-[#f87171]/10',
    tagText: 'text-[#f87171]',
    tagBorder: 'border-[#f87171]/20',
  },
  leetcode: {
    short: 'LC',
    name: 'LeetCode',
    color: 'bg-[#facc15]',
    dot: 'bg-[#facc15]',
    tagBg: 'bg-[#facc15]/10',
    tagText: 'text-[#facc15]',
    tagBorder: 'border-[#facc15]/20',
  },
  atcoder: {
    short: 'AC',
    name: 'AtCoder',
    color: 'bg-[#60a5fa]',
    dot: 'bg-[#4ade80]',
    tagBg: 'bg-[#60a5fa]/10',
    tagText: 'text-[#60a5fa]',
    tagBorder: 'border-[#60a5fa]/20',
  },
  codechef: {
    short: 'CC',
    name: 'CodeChef',
    color: 'bg-[#c084fc]',
    dot: 'bg-[#c084fc]',
    tagBg: 'bg-[#c084fc]/10',
    tagText: 'text-[#c084fc]',
    tagBorder: 'border-[#c084fc]/20',
  },
  hackerrank: {
    short: 'HR',
    name: 'HackerRank',
    color: 'bg-[#4ade80]',
    dot: 'bg-[#4ade80]',
    tagBg: 'bg-[#4ade80]/10',
    tagText: 'text-[#4ade80]',
    tagBorder: 'border-[#4ade80]/20',
  },
  spoj: {
    short: 'SP',
    name: 'SPOJ',
    color: 'bg-[#94a3b8]',
    dot: 'bg-[#94a3b8]',
    tagBg: 'bg-[#94a3b8]/10',
    tagText: 'text-[#94a3b8]',
    tagBorder: 'border-[#94a3b8]/20',
  },
};

function getPlatformMeta(code) {
  return (
    PLATFORM_META[(code || '').toLowerCase()] || {
      short: (code || '?').slice(0, 2).toUpperCase(),
      name: code || 'Unknown',
      color: 'bg-[#64748b]',
      dot: 'bg-[#64748b]',
      tagBg: 'bg-[#64748b]/10',
      tagText: 'text-[#94a3b8]',
      tagBorder: 'border-[#64748b]/20',
    }
  );
}

const TOAST_DURATION_MS = 4000;

const DEFAULT_PROBLEM_SOLVING_DATA = {
  handles: [],
  statistics: null,
  recentSubmissions: [],
  recentSolves: [],
  recentSolutions: [],
  dailyActivity: [],
  badges: [],
  leaderboard: null,
  ratingHistory: [],
  contestHistory: [],
  upcomingContests: [],
};

const getErrorMessage = (error, fallbackMessage) => {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return fallbackMessage;
};

function buildProblemUrl(platform, problemId) {
  if (!problemId) return null;
  const p = (platform || '').toLowerCase();
  if (p === 'codeforces') {
    // problemId is typically "1234A" or "1234/A"
    const match = String(problemId).match(/^(\d+)([A-Za-z]\d*)$/);
    if (match) return `https://codeforces.com/problemset/problem/${match[1]}/${match[2]}`;
    if (String(problemId).includes('/')) {
      const [contest, prob] = String(problemId).split('/');
      return `https://codeforces.com/problemset/problem/${contest}/${prob}`;
    }
    return null;
  }
  if (p === 'leetcode') return `https://leetcode.com/problems/${problemId}/`;
  if (p === 'atcoder') {
    // problemId like "abc123_a"
    const parts = String(problemId).split('_');
    if (parts.length >= 2) return `https://atcoder.jp/contests/${parts.slice(0, -1).join('_')}/tasks/${problemId}`;
    return null;
  }
  if (p === 'codechef') return `https://www.codechef.com/problems/${problemId}`;
  if (p === 'spoj') return `https://www.spoj.com/problems/${problemId}/`;
  if (p === 'hackerrank') return `https://www.hackerrank.com/challenges/${problemId}`;
  return null;
}

function formatNumber(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return '0';
  return v.toLocaleString();
}

function relativeTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diff = (now - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function shortDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// =====================================================================
// Toast / loader / error / connect modal
// =====================================================================
function Toast({ message, type, onClose }) {
  const config = {
    error: {
      icon: AlertCircle,
      ring: 'border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]',
    },
    warning: {
      icon: Info,
      ring: 'border-[#facc15]/30 bg-[#facc15]/10 text-[#facc15]',
    },
    success: {
      icon: CheckCircle2,
      ring: 'border-[#4ade80]/30 bg-[#4ade80]/10 text-[#4ade80]',
    },
    info: {
      icon: RefreshCw,
      ring: 'border-[#60a5fa]/30 bg-[#60a5fa]/10 text-[#60a5fa]',
    },
  };
  const { icon: Icon, ring } = config[type] || config.success;
  const iconClasses = `h-4 w-4 shrink-0 ${type === 'info' ? 'animate-spin' : ''}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl',
        ring
      )}
    >
      <Icon className={iconClasses} />
      <span className="text-sm font-medium text-white">{message}</span>
      <button
        onClick={onClose}
        className="text-[#64748b] hover:text-white"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-[#222228]" />
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-[#4ade80]" />
      </div>
      <p className="mt-4 text-sm text-[#94a3b8]">Loading your progress...</p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f87171]/10">
        <AlertCircle className="h-8 w-8 text-[#f87171]" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-white">
        Something went wrong
      </h3>
      <p className="mb-5 max-w-sm text-sm text-[#f87171]">{error}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg bg-[#f87171]/10 px-4 py-2 text-sm font-medium text-[#f87171] transition-colors hover:bg-[#f87171]/20"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function ConnectModal({ platform, onClose, onConnect }) {
  const [handle, setHandle] = useState('');
  if (!platform) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0b]/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-[400px] flex-col gap-2 rounded-xl border border-[#222228] bg-[#111114] p-6 shadow-xl">
        <h3 className="text-[16px] font-semibold text-white">
          Connect {platform.name || 'Platform'}
        </h3>
        <p className="mb-2 text-[13px] text-[#94a3b8]">
          Enter your handle to link your account and start syncing submissions.
        </p>
        <input
          type="text"
          autoFocus
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Your handle..."
          className="h-9 w-full rounded-md border border-[#334155] bg-[#1e1e24] px-3 font-mono text-[13px] text-white transition-colors outline-none focus:border-[#60a5fa]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-1.5 text-sm font-medium text-[#e2e8f0] transition-colors hover:bg-[#1e1e24]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (handle.trim()) onConnect(platform.code, handle.trim());
            }}
            disabled={!handle.trim()}
            className="flex items-center gap-2 rounded-md bg-[#60a5fa] px-4 py-1.5 text-sm font-medium text-[#0a0a0b] transition-colors hover:bg-[#3b82f6] disabled:opacity-50"
          >
            <ExternalLink className="h-4 w-4" /> Connect
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#222228] bg-[#111114] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#222228] bg-[#16161a] p-5">
          <h3 className="font-semibold text-white">Settings & Tweaks</h3>
          <button
            onClick={onClose}
            className="text-[#64748b] transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto p-5">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-widest text-[#64748b] uppercase">
              Display
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#e2e8f0]">
                Density
              </span>
              <div className="flex rounded-lg border border-[#222228] bg-[#0a0a0b] p-1">
                <button className="rounded-md bg-[#222228] px-3 py-1 text-xs font-semibold text-white">
                  Comfortable
                </button>
                <button className="rounded-md px-3 py-1 text-xs font-medium text-[#64748b] hover:text-[#e2e8f0]">
                  Compact
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-widest text-[#64748b] uppercase">
              Color
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#e2e8f0]">
                Heatmap palette
              </span>
              <select className="rounded-lg border border-[#222228] bg-[#0a0a0b] px-3 py-1.5 text-sm text-white outline-none focus:border-[#334155]">
                <option>Green</option>
                <option>Blue</option>
                <option>Warm</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================================
// Activity heatmap (52 cols x 7 rows)
// =====================================================================
function HeatmapCell({ level, count }) {
  const colors = [
    'bg-[#222228]',
    'bg-[#4ade80]/20',
    'bg-[#4ade80]/40',
    'bg-[#4ade80]/60',
    'bg-[#4ade80]',
  ];
  return (
    <div
      className={cn(
        'h-3 w-3 cursor-pointer rounded-[2.5px] ring-[#334155] ring-offset-1 ring-offset-[#111114] transition-all hover:ring-1',
        colors[level]
      )}
      title={`${count} solve${count === 1 ? '' : 's'}`}
    />
  );
}

function ActivityHeatmap({ data }) {
  // data: array of { activity_date, problems_solved }
  // Build 52 columns x 7 rows matrix (last 364 days, ending today)
  const grid = useMemo(() => {
    const map = new Map();
    (data || []).forEach((d) => {
      if (d.activity_date) map.set(d.activity_date, d.problems_solved || 0);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cols = [];
    let total = 0;
    for (let week = 51; week >= 0; week--) {
      const col = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (week * 7 + (6 - day)));
        const key = date.toISOString().split('T')[0];
        const count = map.get(key) || 0;
        total += count;
        const level =
          count === 0
            ? 0
            : count <= 1
              ? 1
              : count <= 3
                ? 2
                : count <= 6
                  ? 3
                  : 4;
        col.push({ date, count, level });
      }
      cols.push(col);
    }
    return { cols, total };
  }, [data]);

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-emerald-500/5 blur-[100px]" />
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="flex items-center gap-2 font-semibold text-white">
          <Calendar className="h-4 w-4 text-emerald-400" />
          Activity Heatmap
        </h3>
        <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
          365 Days
        </span>
      </div>
      <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 relative z-10 w-full overflow-x-auto pb-2">
        <div className="flex min-w-[720px] flex-col gap-2.5">
          <div className="flex pt-1 pl-8 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            {[
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ].map((m) => (
              <div key={m} style={{ flex: 1 }}>
                {m}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col justify-between py-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            <div className="flex flex-1 gap-1">
              {grid.cols.map((col, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {col.map((cell, j) => (
                    <HeatmapCell
                      key={j}
                      level={cell.level}
                      count={cell.count}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-auto flex items-center justify-between border-t border-white/5 pt-2 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
        <span className="text-zinc-400">
          Total: {formatNumber(grid.total)} solves
        </span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div
            className="mx-2 flex cursor-help gap-1.5 opacity-90 transition-opacity hover:opacity-100"
            title="0, 1, 2-3, 4-6, 7+ solves"
          >
            <div className="h-3 w-3 rounded-[3px] bg-zinc-800 ring-1 ring-white/5" />
            <div className="h-3 w-3 rounded-[3px] bg-emerald-500/20 ring-1 ring-emerald-500/20" />
            <div className="h-3 w-3 rounded-[3px] bg-emerald-500/40 ring-1 ring-emerald-500/40" />
            <div className="h-3 w-3 rounded-[3px] bg-emerald-500/70 ring-1 ring-emerald-500/50" />
            <div className="h-3 w-3 rounded-[3px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] ring-1 ring-emerald-400" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Difficulty donut
// =====================================================================
function DifficultyDonut({ statistics }) {
  const easy = Number(statistics?.easy_solved || 0);
  const medium = Number(statistics?.medium_solved || 0);
  const hard =
    Number(statistics?.hard_solved || 0) +
    Number(statistics?.expert_solved || 0);
  const total = easy + medium + hard || 1;

  // SVG ring geometry
  const R = 54; // radius to stroke centre
  const CX = 70;
  const CY = 70;
  const C = 2 * Math.PI * R;
  const GAP = 3; // px gap between segments

  const tiers = [
    {
      label: 'Easy',
      count: easy,
      color: '#34d399',
      glow: 'rgba(52,211,153,0.35)',
      text: 'text-emerald-400',
      bar: 'bg-emerald-500',
    },
    {
      label: 'Medium',
      count: medium,
      color: '#fbbf24',
      glow: 'rgba(251,191,36,0.35)',
      text: 'text-amber-400',
      bar: 'bg-amber-400',
    },
    {
      label: 'Hard',
      count: hard,
      color: '#fb7185',
      glow: 'rgba(251,113,133,0.35)',
      text: 'text-rose-400',
      bar: 'bg-rose-500',
    },
  ];

  // Build dash offsets for each segment with a small gap
  let offset = 0;
  const segments = tiers.map((t) => {
    const len = (t.count / total) * C;
    const visLen = Math.max(0, len - GAP);
    const seg = { ...t, len: visLen, offset };
    offset += len;
    return seg;
  });

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900/60 p-6 shadow-lg backdrop-blur-xl">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-violet-500/[0.06] blur-[60px]" />

      {/* Header */}
      <div className="relative z-10 mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
          <SlidersHorizontal className="h-4 w-4 text-violet-400" />
          By Difficulty
        </h3>
        <span className="text-[11px] font-medium text-gray-500">
          {formatNumber(total)} solved
        </span>
      </div>

      {/* Donut + rows side by side */}
      <div className="relative z-10 flex items-center gap-6">
        {/* SVG donut */}
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {/* track */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="14"
            />
            {/* segments */}
            {segments.map((s) =>
              s.count > 0 ? (
                <circle
                  key={s.label}
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${s.len} ${C - s.len}`}
                  strokeDashoffset={-s.offset}
                  transform={`rotate(-90 ${CX} ${CY})`}
                  style={{ filter: `drop-shadow(0 0 6px ${s.glow})` }}
                />
              ) : null
            )}
          </svg>
          {/* centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl leading-none font-bold text-white tabular-nums">
              {formatNumber(total)}
            </span>
            <span className="mt-1 text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
              Total
            </span>
          </div>
        </div>

        {/* Tier rows */}
        <div className="flex flex-1 flex-col gap-3.5">
          {tiers.map((t) => {
            const pct = Math.round((t.count / total) * 100);
            return (
              <div key={t.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={cn('text-[12px] font-semibold', t.text)}>
                    {t.label}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-bold text-white tabular-nums">
                      {formatNumber(t.count)}
                    </span>
                    <span className="text-[10px] text-gray-600">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className={cn('h-full rounded-full', t.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Topic radar (SVG, simple polygon)
// =====================================================================
function TopicRadar({ topics }) {
  // topics: [{ name, value (0..1) }]
  const arr = (topics || []).slice(0, 6);
  while (arr.length < 6) {
    arr.push({ name: '', value: 0 });
  }
  const cx = 100;
  const cy = 100;
  const r = 70;
  const points = arr
    .map((t, i) => {
      const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
      const radius = r * Math.max(0, Math.min(1, t.value));
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      return `${x},${y}`;
    })
    .join(' ');
  const gridLevels = [0.25, 0.5, 0.75, 1];
  return (
    <div className="relative flex h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl transition-all hover:bg-zinc-900/80">
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-[80px]" />
      <h3 className="mb-2 flex shrink-0 items-center gap-2 text-base font-semibold text-white">
        <Radar className="h-4 w-4 text-violet-400" />
        Top Topics
      </h3>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {arr.every((t) => !t.name) ? (
          <div className="text-center text-sm text-zinc-500">
            No topic data yet
          </div>
        ) : (
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full max-w-[260px] drop-shadow-xl"
          >
            {gridLevels.map((lvl, i) => {
              const pts = arr
                .map((_, j) => {
                  const angle = (Math.PI * 2 * j) / arr.length - Math.PI / 2;
                  const x = cx + Math.cos(angle) * r * lvl;
                  const y = cy + Math.sin(angle) * r * lvl;
                  return `${x},${y}`;
                })
                .join(' ');
              return (
                <polygon
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              );
            })}
            <polygon
              points={points}
              fill="rgba(139,92,246,0.3)"
              stroke="#8b5cf6"
              strokeWidth="2"
              className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            />
            {arr.map((_, i) => {
              const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
              const innerX = cx + Math.cos(angle) * r * 0.1;
              const innerY = cy + Math.sin(angle) * r * 0.1;
              const outerX = cx + Math.cos(angle) * r;
              const outerY = cy + Math.sin(angle) * r;
              return (
                <line
                  key={`line-${i}`}
                  x1={innerX}
                  y1={innerY}
                  x2={outerX}
                  y2={outerY}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              );
            })}
            {arr.map((t, i) => {
              const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
              const x = cx + Math.cos(angle) * (r + 18);
              const y = cy + Math.sin(angle) * (r + 18);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="tracking-wider uppercase"
                >
                  {t.name}
                </text>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// Tabs
// =====================================================================

function OverviewTab({
  statistics,
  dailyActivity,
  recentSubmissions,
  handles,
  onConnectClick,
  onSyncPlatform,
  syncingPlatform,
  onTabChange,
}) {
  const stats = [
    {
      l: 'Total Solved',
      v: formatNumber(statistics?.total_solved),
      t: 'from-emerald-400 to-teal-500',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      sub: 'Problems mastered',
    },
    {
      l: 'Submissions',
      v: formatNumber(statistics?.total_submissions),
      t: 'from-blue-400 to-indigo-500',
      icon: <List className="h-5 w-5 text-blue-500" />,
      sub: 'Attempts made',
    },
    {
      l: 'Weighted Score',
      v: formatNumber(statistics?.weighted_score),
      t: 'from-fuchsia-400 to-purple-500',
      icon: <Crown className="h-5 w-5 text-fuchsia-500" />,
      sub: 'Based on diff',
    },
    {
      l: 'Active Streak',
      v: formatNumber(statistics?.current_streak),
      t: 'from-orange-400 to-amber-500',
      icon: (
        <svg
          className="h-5 w-5 text-orange-500"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C12 2 8 6 8 11C8 14.5 10 16 12 18C14 16 16 14.5 16 11C16 6 12 2 12 2Z" />
        </svg>
      ),
      sub: 'days in a row',
    },
  ];

  const tags = useMemo(() => {
    const tally = new Map();
    (recentSubmissions || []).forEach((s) => {
      (s.tags || []).forEach((t) => tally.set(t, (tally.get(t) || 0) + 1));
    });
    const max = Math.max(1, ...Array.from(tally.values()));
    return Array.from(tally.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, value: count / max }));
  }, [recentSubmissions]);

  const solved = Number(statistics?.total_solved || 0);
  const submissions = Number(statistics?.total_submissions || 0);
  const accuracy = submissions > 0 ? (solved / submissions) * 100 : 0;
  const accuracyDisplay = accuracy.toFixed(1);

  // Arc gauge geometry (semicircle, 180°)
  const ARC_R = 38;
  const ARC_CX = 56;
  const ARC_CY = 54;
  const ARC_C = Math.PI * ARC_R; // half circumference
  const arcFill = (accuracy / 100) * ARC_C;
  const arcColor =
    accuracy >= 70 ? '#34d399' : accuracy >= 45 ? '#fbbf24' : '#fb7185';
  const arcGlow =
    accuracy >= 70
      ? 'rgba(52,211,153,0.4)'
      : accuracy >= 45
        ? 'rgba(251,191,36,0.4)'
        : 'rgba(251,113,133,0.4)';
  const arcTextColor =
    accuracy >= 70
      ? 'text-emerald-400'
      : accuracy >= 45
        ? 'text-amber-400'
        : 'text-rose-400';

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(4,1fr)_200px]">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20"
          >
            <div
              className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
              style={{ backgroundImage: `var(--tw-gradient-stops)` }}
            />

            <div className="relative z-10 mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                {s.l}
              </span>
              <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                {s.icon}
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-1">
              <span
                className={cn(
                  'bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent',
                  s.t
                )}
              >
                {s.v}
              </span>
              {s.sub && (
                <span className="text-sm font-medium text-zinc-500">
                  {s.sub}
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {/* Accuracy card */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="group relative col-span-1 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-5 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20 sm:col-span-2 lg:col-span-1 xl:col-span-1"
        >
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
            style={{ background: arcColor }}
          />

          <div className="relative z-10 mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Avg Accuracy
            </span>
            <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
              <Target className="h-5 w-5" style={{ color: arcColor }} />
            </div>
          </div>

          {/* Semicircle gauge */}
          <div className="relative z-10 flex flex-col items-center">
            <svg
              width="112"
              height="64"
              viewBox="0 0 112 64"
              className="overflow-visible"
            >
              {/* track */}
              <path
                d={`M ${ARC_CX - ARC_R} ${ARC_CY} A ${ARC_R} ${ARC_R} 0 0 1 ${ARC_CX + ARC_R} ${ARC_CY}`}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* fill */}
              <path
                d={`M ${ARC_CX - ARC_R} ${ARC_CY} A ${ARC_R} ${ARC_R} 0 0 1 ${ARC_CX + ARC_R} ${ARC_CY}`}
                fill="none"
                stroke={arcColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${arcFill} ${ARC_C}`}
                style={{ filter: `drop-shadow(0 0 6px ${arcGlow})` }}
              />
              {/* needle dot at tip */}
              {accuracy > 0 &&
                (() => {
                  const angle = Math.PI - (accuracy / 100) * Math.PI;
                  const nx = ARC_CX + Math.cos(angle) * ARC_R;
                  const ny = ARC_CY - Math.sin(angle) * ARC_R;
                  return (
                    <circle
                      cx={nx}
                      cy={ny}
                      r="4"
                      fill={arcColor}
                      style={{ filter: `drop-shadow(0 0 4px ${arcGlow})` }}
                    />
                  );
                })()}
            </svg>

            {/* value below gauge */}
            <div className="-mt-2 flex flex-col items-center">
              <span
                className={cn(
                  'text-3xl leading-none font-bold tabular-nums',
                  arcTextColor
                )}
              >
                {accuracyDisplay}%
              </span>
              <span className="mt-1 text-sm font-medium text-zinc-500">
                {formatNumber(solved)} / {formatNumber(submissions)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ActivityHeatmap data={dailyActivity} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TopicRadar topics={tags} />
        <DifficultyDonut statistics={statistics} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Recent Activity
            </h3>
            <button
              onClick={() => onTabChange('problems')}
              className="flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              See all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col pt-2">
            {(recentSubmissions || []).length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 rounded-full bg-white/5 p-4">
                  <List className="h-8 w-8 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-400">No submissions yet.</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Start solving to see history here!
                </p>
              </div>
            )}
            {(recentSubmissions || []).slice(0, 6).map((s, i) => {
              const verdict = String(s.verdict || '').toUpperCase();
              const isAc =
                verdict === 'OK' || verdict === 'AC' || verdict === 'ACCEPTED';
              const isWa = verdict.includes('WRONG') || verdict === 'WA';
              const dot = isAc
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : isWa
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                  : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
              const meta = getPlatformMeta(s.platform);
              return (
                <div
                  key={s.id || i}
                  className="group flex items-start gap-4 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-white/5 hover:bg-white/[0.02]"
                >
                  <div
                    className={cn(
                      'mt-2 h-2.5 w-2.5 shrink-0 rounded-full',
                      dot
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-zinc-200 transition-colors group-hover:text-indigo-300">
                        {s.problem_name || s.problem_id || 'Submission'}
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-zinc-500">
                        {relativeTime(s.submitted_at)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                          meta.tagBg,
                          meta.tagText,
                          meta.tagBorder
                        )}
                      >
                        {meta.short}
                      </span>
                      {s.difficulty_rating ? (
                        <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                          <Crown className="h-3 w-3" />
                          {s.difficulty_rating}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex h-fit flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl lg:col-span-1">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <House className="h-5 w-5 text-indigo-400" />
              Platforms
            </h3>
            <button
              onClick={() => onConnectClick({ code: '', name: 'Platform' })}
              className="flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Add New
            </button>
          </div>
          <div className="flex flex-col gap-1.5 pt-2">
            {Object.keys(PLATFORM_META).map((code) => {
              const meta = getPlatformMeta(code);
              const handle = (handles || []).find((h) => h.platform === code);
              const connected = !!handle;
              const handleName = handle?.handle;
              return (
                <div
                  key={code}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-zinc-950/50 p-3 transition-colors hover:bg-white/5"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-zinc-900 shadow-inner',
                      meta.color
                    )}
                  >
                    {meta.short}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-zinc-200">
                      {meta.name}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">
                      {connected ? `@${handleName}` : 'Not connected'}
                    </div>
                  </div>
                  {connected ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-400 uppercase">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        Active
                      </span>
                      <button
                        onClick={() => onSyncPlatform(code)}
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                        title="Sync now"
                        disabled={syncingPlatform === code}
                      >
                        <RefreshCw
                          className={cn(
                            'h-3.5 w-3.5',
                            syncingPlatform === code
                              ? 'animate-spin text-indigo-400'
                              : ''
                          )}
                        />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onConnectClick({ code, name: meta.name })}
                      className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
                    >
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function ProblemsTab({ submissions }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const PAGE_SIZE = 15;

  const list = useMemo(() => {
    const seen = new Map();
    (submissions || []).forEach((s) => {
      const key = `${s.platform}:${s.problem_id}`;
      // Sort properly rather than just relying on whatever appeared first
      if (
        !seen.has(key) ||
        new Date(s.submitted_at) > new Date(seen.get(key).submitted_at)
      ) {
        seen.set(key, s);
      }
    });
    let arr = Array.from(seen.values());
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (s) =>
          (s.problem_name || '').toLowerCase().includes(q) ||
          (s.problem_id || '').toLowerCase().includes(q)
      );
    }
    // Default sort by submitted_at desc
    arr.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    return arr;
  }, [submissions, search]);

  const totalSolved = list.filter((s) => {
    const v = String(s.verdict || '').toUpperCase();
    return v === 'OK' || v === 'AC' || v === 'ACCEPTED';
  }).length;

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
                / {formatNumber(list.length)}
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
      <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
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
          <button className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-sm font-medium whitespace-nowrap text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
            <Funnel className="h-4 w-4 text-zinc-400" /> Topic Tags
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-sm font-medium whitespace-nowrap text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
            <Crown className="h-4 w-4 text-amber-400" /> Difficulty
          </button>
          <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />
          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-zinc-400 transition-colors hover:text-white">
            <SlidersHorizontal className="h-4 w-4" /> Sort
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 w-full overflow-x-auto rounded-xl border border-white/5 bg-black/20">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
            <tr>
              <th className="w-12 px-5 py-4 text-center font-semibold">
                Status
              </th>
              <th className="px-5 py-4 font-semibold">Problem</th>
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
                  No problems match your filters.
                </td>
              </tr>
            )}
            {visible.map((s, i) => {
              const verdict = String(s.verdict || '').toUpperCase();
              const isAc =
                verdict === 'OK' || verdict === 'AC' || verdict === 'ACCEPTED';
              const isWa = verdict.includes('WRONG') || verdict === 'WA';
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
                      {title}
                      {(s.problem_url || buildProblemUrl(s.platform, s.problem_id)) && (
                        <ExternalLink
                          className="h-3 w-3 shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = s.problem_url || buildProblemUrl(s.platform, s.problem_id);
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
          Showing <span className="text-white">{start + 1}</span> to{' '}
          <span className="text-white">
            {Math.min(start + PAGE_SIZE, list.length)}
          </span>{' '}
          of <span className="text-white">{list.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={start + PAGE_SIZE >= list.length}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {selectedProblem && (
        <ProblemDetailModal
          problem={selectedProblem}
          onClose={() => setSelectedProblem(null)}
        />
      )}
    </div>
  );
}

// Simple SVG line chart for ratings
function RatingLineChart({ ratingHistory }) {
  // Group by platform code
  const grouped = useMemo(() => {
    const map = new Map();
    (ratingHistory || []).forEach((r) => {
      if (!r.platform || r.rating == null) return;
      if (!map.has(r.platform)) map.set(r.platform, []);
      map.get(r.platform).push({
        date: new Date(r.date).getTime(),
        rating: r.rating,
      });
    });
    map.forEach((arr) => arr.sort((a, b) => a.date - b.date));
    return map;
  }, [ratingHistory]);

  const platforms = Array.from(grouped.keys());

  if (platforms.length === 0) {
    return (
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-indigo-500/5 blur-[100px]" />
        <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <LineChart className="h-4 w-4 text-indigo-400" />
              Rating History
            </h3>
            <p className="mt-1 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              Platform ratings over time
            </p>
          </div>
        </div>
        <div className="relative z-10 flex h-72 w-full items-center justify-center text-sm font-medium text-zinc-500">
          No rating data yet
        </div>
      </div>
    );
  }

  // Find global min/max
  let minTime = Infinity;
  let maxTime = -Infinity;
  let minR = Infinity;
  let maxR = -Infinity;
  grouped.forEach((arr) => {
    arr.forEach((p) => {
      if (p.date < minTime) minTime = p.date;
      if (p.date > maxTime) maxTime = p.date;
      if (p.rating < minR) minR = p.rating;
      if (p.rating > maxR) maxR = p.rating;
    });
  });
  if (minR === maxR) {
    minR = minR - 100;
    maxR = maxR + 100;
  }

  const W = 800;
  const H = 280;
  const PAD = { l: 50, r: 20, t: 20, b: 30 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const xOf = (t) =>
    PAD.l + ((t - minTime) / Math.max(1, maxTime - minTime)) * innerW;
  const yOf = (r) =>
    PAD.t + (1 - (r - minR) / Math.max(1, maxR - minR)) * innerH;

  const colors = {
    codeforces: '#f87171',
    leetcode: '#facc15',
    atcoder: '#60a5fa',
    codechef: '#c084fc',
    hackerrank: '#4ade80',
  };

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-indigo-500/5 blur-[100px]" />
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <LineChart className="h-4 w-4 text-indigo-400" />
            Rating History
          </h3>
          <p className="mt-1 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
            Platform ratings over time
          </p>
        </div>
        <div className="flex gap-4">
          {platforms.map((p) => (
            <div
              key={p}
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
            >
              <span
                className="h-2 w-2 rounded-[2px] shadow-sm"
                style={{ backgroundColor: colors[p] || '#94a3b8' }}
              />
              {getPlatformMeta(p).name}
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 h-72 w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          className="drop-shadow-sm"
        >
          {/* y-axis grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = PAD.t + p * innerH;
            const val = Math.round(maxR - p * (maxR - minR));
            return (
              <g key={i}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={PAD.l - 12}
                  y={y + 4}
                  fill="#71717a"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="end"
                  className="font-mono tracking-wider"
                >
                  {val}
                </text>
              </g>
            );
          })}
          {platforms.map((p) => {
            const arr = grouped.get(p);
            if (!arr || arr.length < 1) return null;
            const path = arr
              .map(
                (pt, i) =>
                  `${i === 0 ? 'M' : 'L'} ${xOf(pt.date)} ${yOf(pt.rating)}`
              )
              .join(' ');
            return (
              <g key={p}>
                <path
                  d={path}
                  fill="none"
                  stroke={colors[p] || '#94a3b8'}
                  strokeWidth="2.5"
                  className="drop-shadow-md"
                />
                {arr.map((pt, i) => (
                  <circle
                    key={i}
                    cx={xOf(pt.date)}
                    cy={yOf(pt.rating)}
                    r="4"
                    fill="#18181b"
                    stroke={colors[p] || '#94a3b8'}
                    strokeWidth="2"
                    className="hover:r-5 cursor-pointer transition-all"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function ContestsTab({
  ratingHistory,
  contestHistory,
  upcomingContests,
  onSync,
  syncing,
}) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-6">
      <RatingLineChart ratingHistory={ratingHistory} />

      <div className="flex flex-col gap-6">
        <div className="flex h-max flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-5">
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Calendar className="h-4 w-4 text-indigo-400" />
                Upcoming Contests
              </h3>
              <p className="mt-1 text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
                Sync to refresh schedule
              </p>
            </div>
            <button
              onClick={onSync}
              disabled={syncing}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-white/5"
              title="Refresh"
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  syncing && 'animate-spin text-indigo-400'
                )}
              />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center p-6 text-sm text-zinc-400">
            {!upcomingContests || upcomingContests.length === 0 ? (
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Calendar className="h-5 w-5 text-zinc-500" />
                </div>
                <p className="mb-6">
                  Upcoming contest data appears here once your platform sync is
                  complete.
                </p>
                <button
                  onClick={onSync}
                  disabled={syncing}
                  className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  <Bell className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Sync Platforms
                </button>
              </>
            ) : (
              <div className="w-full text-left">
                <div className="divide-y divide-white/5">
                  {upcomingContests.map((c, i) => {
                    const meta = getPlatformMeta(c.platform);
                    return (
                      <div
                        key={i}
                        className="group -mx-4 flex items-center justify-between rounded-xl px-4 py-4 transition-colors hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm',
                              meta.tagBg,
                              meta.tagBorder
                            )}
                          >
                            <span className={cn('font-bold', meta.tagText)}>
                              {meta.short}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-zinc-200 transition-colors group-hover:text-indigo-400">
                              {c.name}
                            </h4>
                            <div className="mt-1 flex items-center gap-4 text-xs font-medium tracking-wide text-zinc-500">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" /> {c.date}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" /> {c.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-all hover:scale-105 hover:bg-white/10 hover:text-white"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-5">
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Trophy className="h-4 w-4 text-amber-400" />
              Contest History
            </h3>
          </div>
          <div className="w-full overflow-x-auto p-1">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead className="border-b border-white/10 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                <tr>
                  <th className="px-5 py-4">Contest Name</th>
                  <th className="w-28 px-5 py-4">Platform</th>
                  <th className="w-24 px-5 py-4">Rank</th>
                  <th className="w-28 px-5 py-4">Δ Rating</th>
                  <th className="w-24 px-5 py-4">Solved</th>
                  <th className="w-28 px-5 py-4">Date</th>
                  <th className="w-12 px-5 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-zinc-300">
                {(contestHistory || []).length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-sm text-zinc-500"
                    >
                      <Trophy className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                      No contest history yet
                    </td>
                  </tr>
                )}
                {(contestHistory || []).slice(0, 20).map((c, i) => {
                  const meta = getPlatformMeta(c.platform);
                  const delta = Number(c.ratingChange || 0);
                  const isOpen = expanded === i;
                  return (
                    <Fragment key={c.id || i}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : i)}
                        className={cn(
                          'group cursor-pointer transition-colors hover:bg-white/[0.04]',
                          isOpen && 'bg-white/[0.02]'
                        )}
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold text-zinc-200 transition-colors group-hover:text-indigo-400">
                            {c.name}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase',
                              meta.tagBg,
                              meta.tagBorder,
                              meta.tagText
                            )}
                          >
                            {meta.short}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-zinc-400">
                          {c.rank ? `#${c.rank}` : '—'}
                        </td>
                        <td className="px-5 py-4">
                          {delta !== 0 ? (
                            <span
                              className={cn(
                                'inline-flex min-w-[3rem] items-center justify-center rounded px-2 py-1 font-mono font-bold',
                                delta > 0
                                  ? 'bg-emerald-400/10 text-emerald-400'
                                  : 'bg-rose-400/10 text-rose-400'
                              )}
                            >
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          ) : (
                            <span className="font-mono text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-zinc-400">
                          <span className="font-semibold text-zinc-300">
                            {c.solved ?? '—'}
                          </span>
                          {c.totalProblems ? (
                            <span className="text-zinc-600">
                              /{c.totalProblems}
                            </span>
                          ) : (
                            ''
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-500">
                          {shortDate(c.date)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end">
                            <ChevronRight
                              className={cn(
                                'h-5 w-5 text-zinc-600 transition-transform group-hover:text-zinc-300',
                                isOpen && 'rotate-90 text-indigo-400'
                              )}
                            />
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-black/20">
                          <td
                            colSpan={7}
                            className="border-t-0 px-6 py-5 shadow-inner"
                          >
                            <div className="flex flex-col gap-4 text-xs sm:flex-row sm:items-center">
                              <span className="font-bold tracking-widest text-zinc-600 uppercase">
                                Problems
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {(c.problems || []).map((p, j) => {
                                  const verdict = String(
                                    p.result || p.verdict || ''
                                  ).toUpperCase();
                                  const ac =
                                    p.solved === true ||
                                    verdict === 'AC' ||
                                    verdict === 'OK';
                                  const wa =
                                    !ac &&
                                    (verdict.includes('WRONG') ||
                                      verdict === 'WA');
                                  return (
                                    <div
                                      key={j}
                                      className={cn(
                                        'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-bold shadow-sm',
                                        ac
                                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                          : wa
                                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                                            : 'border-white/5 bg-white/5 text-zinc-400'
                                      )}
                                    >
                                      <span>{p.label || p.id || j + 1}</span>
                                    </div>
                                  );
                                })}
                                {(!c.problems || c.problems.length === 0) && (
                                  <span className="text-[#64748b]">
                                    No problem data
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicsTab({ submissions }) {
  // Build topic mastery from submission tags
  const topics = useMemo(() => {
    const tally = new Map();
    (submissions || []).forEach((s) => {
      const v = String(s.verdict || '').toUpperCase();
      const ac = v === 'OK' || v === 'AC' || v === 'ACCEPTED';
      (s.tags || []).forEach((t) => {
        if (!tally.has(t)) tally.set(t, { solves: 0, attempts: 0 });
        const e = tally.get(t);
        e.attempts += 1;
        if (ac) e.solves += 1;
      });
    });
    return Array.from(tally.entries())
      .map(([name, e]) => {
        const total = Math.max(50, e.solves * 1.4);
        const pct = (e.solves / total) * 100;
        const level = pct >= 70 ? 'g' : pct >= 35 ? 'w' : 'b';
        return { n: name, s: e.solves, t: Math.round(total), l: level };
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, 18);
  }, [submissions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Topic Mastery
            </h3>
            <p className="mt-1 text-sm font-medium text-zinc-400">
              Performance by individual algorithm and data structure
            </p>
          </div>
          <div className="flex gap-4 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />{' '}
              Mastered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />{' '}
              Learning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />{' '}
              Needs Review
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {topics.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm font-medium text-zinc-500">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                <Sparkles className="h-5 w-5 text-zinc-600" />
              </div>
              No topic data — solve some problems to populate this section.
            </div>
          )}
          {topics.map((e, i) => {
            const n = Math.round((e.s / e.t) * 100);
            const r =
              e.l === 'g'
                ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                : e.l === 'w'
                  ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.3)]';
            return (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <span className="text-[13px] font-bold text-zinc-200 capitalize">
                    {e.n}
                  </span>
                  <div className="text-xs font-medium text-zinc-500">
                    <span className="font-bold text-white">{e.s}</span> / {e.t}{' '}
                    solves
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/40 shadow-inner ring-1 ring-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${n}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn(
                      'absolute top-0 left-0 h-full rounded-full',
                      r
                    )}
                  />
                  <div className="absolute top-1/2 right-2 -translate-y-1/2 text-[9px] font-black text-black/60 mix-blend-overlay drop-shadow-md">
                    {n}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeaderboardTab({ leaderboard, currentUserId }) {
  // leaderboard might be just user rank object, not full list. Use defensive.
  const list = useMemo(() => {
    if (Array.isArray(leaderboard)) return leaderboard;
    if (Array.isArray(leaderboard?.entries)) return leaderboard.entries;
    return [];
  }, [leaderboard]);

  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  const podiumStyles = [
    {
      ring: 'border-amber-400/40 shadow-amber-400/10',
      bg: 'bg-amber-400/20 backdrop-blur-xl',
      avatar: 'bg-amber-400/30 border-amber-400/50',
      gradient: 'to-amber-500/10',
      label: 'text-amber-400',
      width: 'w-56',
      pad: 'pt-8 pb-8',
      transform: 'z-10',
      rank: '#1',
      icon: (
        <Crown className="absolute -top-16 h-8 w-8 fill-amber-500 text-amber-500 drop-shadow-md" />
      ),
    },
    {
      ring: 'border-zinc-400/40 shadow-zinc-400/10',
      bg: 'bg-zinc-400/20 backdrop-blur-xl',
      avatar: 'bg-zinc-400/30 border-zinc-400/50',
      gradient: 'to-zinc-500/10',
      label: 'text-zinc-400',
      width: 'w-48',
      pad: 'pt-5 pb-6',
      transform: 'translate-y-4',
      rank: '#2',
    },
    {
      ring: 'border-orange-400/40 shadow-orange-400/10',
      bg: 'bg-orange-400/20 backdrop-blur-xl',
      avatar: 'bg-orange-400/30 border-orange-400/50',
      gradient: 'to-orange-500/10',
      label: 'text-orange-400',
      width: 'w-48',
      pad: 'pt-5 pb-6',
      transform: 'translate-y-8',
      rank: '#3',
    },
  ];

  // Order: 2nd, 1st, 3rd visually
  const podiumOrder = top3.length >= 3 ? [2, 0, 1] : top3.map((_, i) => i);

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 py-20 text-center text-sm text-zinc-400 backdrop-blur-xl">
        <Crown className="mb-4 h-12 w-12 text-zinc-600" />
        Leaderboard data unavailable. Sync to refresh rankings.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {top3.length > 0 && (
        <div className="mx-auto mt-8 flex h-72 w-full max-w-3xl items-end justify-center gap-1 px-4 md:gap-4">
          {podiumOrder.map((idx) => {
            const user = top3[idx];
            if (!user) return null;
            const style = podiumStyles[idx];
            return (
              <div
                key={idx}
                className={cn(
                  'relative flex flex-col items-center rounded-t-3xl border bg-black/40 bg-gradient-to-t from-black/80',
                  style.ring,
                  style.gradient,
                  style.width,
                  style.pad,
                  style.transform
                )}
              >
                <div
                  className={cn(
                    'absolute -top-12 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-zinc-950 backdrop-blur-xl',
                    style.avatar
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.user_id || idx}&backgroundColor=transparent`}
                    alt={`${user.username || 'user'} avatar`}
                    className="h-full w-full scale-110 object-cover"
                  />
                </div>
                {style.icon}
                <span
                  className={cn(
                    'mt-6 mb-1 font-mono text-sm font-black drop-shadow-md',
                    style.label
                  )}
                >
                  {style.rank}
                </span>
                <span className="w-full truncate px-4 text-center text-lg font-bold text-white drop-shadow-md">
                  {user.username || user.handle || 'User'}
                </span>
                <div className="mt-4 text-center">
                  <div className="font-mono text-3xl font-black text-white/90 drop-shadow-md">
                    {formatNumber(user.total_score || user.score)}
                  </div>
                  <div className="mt-1 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                    Score
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-5">
          <div className="flex rounded-lg border border-white/10 bg-black/40 p-1 shadow-sm">
            <button className="rounded-md bg-white/10 px-4 py-1.5 text-[11px] font-bold tracking-widest text-white uppercase shadow-sm">
              All Time
            </button>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-white/10 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              <tr>
                <th className="w-20 px-5 py-4 text-center">Rank</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4 text-right">Total Solved</th>
                <th className="px-5 py-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-zinc-300">
              {rest.map((u, i) => {
                const self = u.user_id === currentUserId;
                return (
                  <tr
                    key={u.user_id || i}
                    className={cn(
                      'transition-colors hover:bg-white/[0.04]',
                      self && 'relative bg-indigo-500/10'
                    )}
                  >
                    {self && (
                      <td className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
                    )}
                    <td className="px-5 py-4 text-center font-mono font-semibold text-zinc-400">
                      {u.global_rank || i + 4}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username || u.user_id || i}&backgroundColor=transparent`}
                          alt={`${u.username || 'user'} avatar`}
                          className="h-10 w-10 rounded-full border border-white/10 bg-white/5 object-cover"
                        />
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-zinc-200">
                            {u.username || u.handle || 'User'}
                          </span>
                          {self && (
                            <span className="rounded-md border border-indigo-400/30 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-zinc-400">
                      {formatNumber(u.total_solved)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-zinc-200">
                      {formatNumber(u.total_score || u.score)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RecommendationsTab({ submissions }) {
  // Build simple recommendations from weakest tags
  const recs = useMemo(() => {
    const tally = new Map();
    (submissions || []).forEach((s) => {
      const v = String(s.verdict || '').toUpperCase();
      const ac = v === 'OK' || v === 'AC' || v === 'ACCEPTED';
      (s.tags || []).forEach((t) => {
        if (!tally.has(t)) tally.set(t, { solves: 0, attempts: 0 });
        const e = tally.get(t);
        e.attempts += 1;
        if (ac) e.solves += 1;
      });
    });
    const weakest = Array.from(tally.entries())
      .filter(([, e]) => e.attempts >= 2)
      .sort((a, b) => a[1].solves / a[1].attempts - b[1].solves / b[1].attempts)
      .slice(0, 4)
      .map(([name]) => name);
    return weakest;
  }, [submissions]);

  if (recs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 py-20 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner">
          <Sparkles className="h-6 w-6 text-indigo-400" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-white">
          Not enough data yet
        </h3>
        <p className="text-sm font-medium text-zinc-400">
          Solve more problems to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-white">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Personalized Learning Path
          </h3>
          <p className="text-sm font-medium text-zinc-400">
            Based on your weakest topics
          </p>
        </div>
        <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30 sm:flex">
          <Target className="h-6 w-6 text-indigo-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {recs.map((topic, i) => (
          <div
            key={i}
            className="flex h-full flex-col rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl transition-transform hover:-translate-y-1"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <span className="self-start rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-indigo-400 uppercase shadow-sm">
                  Suggested Action
                </span>
                <h4 className="text-lg leading-tight font-bold text-white capitalize">
                  Practice <span className="text-indigo-400">{topic}</span>
                </h4>
              </div>
            </div>
            <div className="mb-2 flex-1 rounded-xl border border-white/5 bg-black/20 p-4 shadow-inner">
              <div className="mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
                  Why this?
                </span>
              </div>
              <p className="text-sm leading-relaxed font-medium text-zinc-400">
                Your acceptance rate on <strong>{topic}</strong> is below
                average. Focusing on this area can significantly lift your
                overall rating.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({ statistics, handles, badges, contestHistory, userId }) {
  // Derive a display name from the first connected handle, fallback to 'Member'
  const displayName =
    (handles || [])[0]?.handle ||
    (typeof userId === 'string' ? userId.slice(0, 12) : 'Member');
  const avatarLetter = displayName.slice(0, 1).toUpperCase();

  const statItems = [
    {
      value: formatNumber(statistics?.total_solved),
      label: 'Solved',
      accent: 'text-violet-400',
    },
    {
      value: formatNumber(statistics?.weighted_score),
      label: 'Score',
      accent: 'text-sky-400',
    },
    {
      value: formatNumber((contestHistory || []).length),
      label: 'Contests',
      accent: 'text-amber-400',
    },
    {
      value: statistics?.global_rank ? `#${statistics.global_rank}` : '—',
      label: 'Global Rank',
      accent: 'text-emerald-400',
    },
    {
      value: statistics?.current_streak ? `${statistics.current_streak}d` : '—',
      label: 'Streak',
      accent: 'text-orange-400',
    },
  ];

  const hasHandles = (handles || []).length > 0;

  return (
    <div className="space-y-5">
      {/* ── Hero card ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900">
        {/* subtle gradient wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-sky-600/5" />
        {/* top strip accent */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-sky-500" />

        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500 to-purple-600 text-3xl font-black text-white shadow-lg ring-4 ring-violet-500/20 sm:h-24 sm:w-24 sm:text-4xl">
              {avatarLetter}
            </div>
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {displayName}
              </h2>
              {hasHandles && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  Active
                </span>
              )}
            </div>

            {/* Platform handles row */}
            {hasHandles && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(handles || []).map((h) => {
                  const meta = getPlatformMeta(h.platform);
                  return (
                    <span
                      key={h.platform}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold',
                        meta.tagBg,
                        meta.tagText,
                        meta.tagBorder
                      )}
                    >
                      <span className="opacity-60">{meta.short}</span>
                      <span>@{h.handle}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Stats row */}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/[0.06] pt-5">
              {statItems.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span
                    className={cn(
                      'font-mono text-xl font-bold sm:text-2xl',
                      s.accent
                    )}
                  >
                    {s.value}
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Platform accounts ────────────────────────────────────────── */}
      {hasHandles && (
        <div className="rounded-2xl border border-white/[0.08] bg-gray-900">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-300">
              Connected Platforms
            </h3>
            <span className="text-[11px] font-medium text-gray-500">
              {handles.length} account{handles.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-px bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
            {(handles || []).map((h, idx) => {
              const meta = getPlatformMeta(h.platform);
              const ps = statistics?.platform_stats?.[h.platform];
              const isLast = idx === handles.length - 1;
              return (
                <div
                  key={h.platform}
                  className={cn(
                    'flex flex-col gap-4 bg-gray-900 p-5 transition-colors hover:bg-white/[0.02]',
                    // round corners on last item when odd count fills last col
                    idx === 0 ? 'rounded-bl-none' : '',
                    isLast && handles.length % 3 !== 0 ? '' : ''
                  )}
                >
                  {/* Platform header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-gray-950',
                          meta.color
                        )}
                      >
                        {meta.short}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-200">
                          {meta.name}
                        </p>
                        <p className="font-mono text-[11px] text-gray-500">
                          @{h.handle}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Live
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 divide-x divide-white/[0.05] rounded-xl border border-white/[0.06] bg-black/20">
                    {[
                      { v: ps?.rating || '—', l: 'Rating' },
                      { v: ps?.max_rating || ps?.rating || '—', l: 'Peak' },
                      { v: formatNumber(ps?.solved_count), l: 'Solved' },
                    ].map((item) => (
                      <div
                        key={item.l}
                        className="flex flex-col items-center py-3"
                      >
                        <span className="font-mono text-base font-bold text-white">
                          {item.v}
                        </span>
                        <span className="mt-0.5 text-[9px] font-semibold tracking-widest text-gray-500 uppercase">
                          {item.l}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Achievements ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] bg-gray-900">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Trophy className="h-4 w-4 text-amber-400" />
            Achievements
          </h3>
          {(badges || []).length > 0 && (
            <span className="text-[11px] font-medium text-gray-500">
              {badges.length} earned
            </span>
          )}
        </div>

        {(badges || []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-3xl">
              🏆
            </div>
            <p className="text-sm font-medium text-gray-400">
              No achievements yet
            </p>
            <p className="max-w-xs text-[12px] text-gray-600">
              Keep solving problems and participating in contests to earn
              badges.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-white/[0.04] sm:grid-cols-2 xl:grid-cols-3">
            {badges.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-gray-900 p-5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-xl">
                  {b.icon || '🏆'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-gray-200">
                    {b.name || b.badge_name || 'Badge'}
                  </p>
                  {b.description && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500">
                      {b.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// React Fragment shim (avoid import bloat)
const Fragment = ({ children }) => children;

// =====================================================================
// Main Component
// =====================================================================
export default function ProblemSolvingClient({ userId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectTarget, setConnectTarget] = useState(null);
  const toastTimeoutRef = useRef(null);

  const {
    data,
    loading,
    error,
    syncing,
    syncingPlatform,
    sync,
    syncPlatform,
    refetch,
  } = useProblemSolving();
  const { connect } = useConnectHandle();

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  const handleSync = useCallback(async () => {
    showToast('Syncing all platforms...', 'info');
    try {
      const result = await sync(true);
      showToast(result?.message || 'Synced successfully!', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Sync failed'), 'error');
    }
  }, [sync, showToast]);

  const handleSyncPlatform = useCallback(
    async (platform) => {
      if (!platform) return;
      showToast(`Syncing ${platform}...`, 'info');
      try {
        const result = await syncPlatform(platform, true);
        showToast(result?.message || `${platform} synced!`, 'success');
      } catch (err) {
        showToast(getErrorMessage(err, `Failed to sync ${platform}`), 'error');
      }
    },
    [syncPlatform, showToast]
  );

  const handleConnect = useCallback(
    async (platform, handle) => {
      if (!platform || !handle) return;
      try {
        await connect(platform, handle);
        showToast(`Connected ${handle} on ${platform}`, 'success');
        setConnectTarget(null);
        refetch();
      } catch (err) {
        showToast(getErrorMessage(err, 'Failed to connect'), 'error');
      }
    },
    [connect, refetch, showToast]
  );

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const problemSolvingData = useMemo(
    () => ({ ...DEFAULT_PROBLEM_SOLVING_DATA, ...(data || {}) }),
    [data]
  );

  const {
    handles,
    statistics,
    recentSubmissions,
    dailyActivity,
    badges,
    leaderboard,
    ratingHistory,
    contestHistory,
    upcomingContests,
  } = problemSolvingData;

  const renderTab = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} onRetry={refetch} />;

    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            statistics={statistics}
            dailyActivity={dailyActivity}
            recentSubmissions={recentSubmissions}
            handles={handles}
            onConnectClick={(p) => setConnectTarget(p)}
            onSyncPlatform={handleSyncPlatform}
            syncingPlatform={syncingPlatform}
            onTabChange={handleTabChange}
          />
        );
      case 'problems':
        return <ProblemsTab submissions={recentSubmissions} />;
      case 'contests':
        return (
          <ContestsTab
            ratingHistory={ratingHistory}
            contestHistory={contestHistory}
            upcomingContests={upcomingContests}
            onSync={handleSync}
            syncing={syncing}
          />
        );
      case 'topics':
        return <TopicsTab submissions={recentSubmissions} />;
      case 'leaderboard':
        return (
          <LeaderboardTab leaderboard={leaderboard} currentUserId={userId} />
        );
      case 'recommended':
        return <RecommendationsTab submissions={recentSubmissions} />;
      case 'profile':
        return (
          <ProfileTab
            statistics={statistics}
            handles={handles}
            badges={badges}
            contestHistory={contestHistory}
            userId={userId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full min-h-screen text-gray-300 selection:bg-violet-500/30">
      {/* ── Secondary left nav ───────────────────────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 border-r border-white/[0.06] bg-gray-950 xl:flex xl:flex-col">
        {/* Section header */}
        {/* <div className="border-b border-white/[0.06] px-4 py-[14px]">
          <p className="text-[10.5px] font-semibold tracking-widest text-gray-600 uppercase select-none">
            Problem Solving
          </p>
        </div> */}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* <p className="mb-0.5 px-3 pt-3 pb-1 text-[10.5px] font-semibold tracking-widest text-gray-600 uppercase select-none">
            Dashboard
          </p> */}
          <div className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'group/nav relative flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                    active
                      ? 'bg-violet-500/12 font-semibold text-violet-400 shadow-violet-500/10'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                  )}
                >
                  {active && (
                    <div className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-purple-600" />
                  )}
                  <Icon className="h-[17px] w-[17px] shrink-0" />
                  <span className="flex-1 truncate text-left">{tab.label}</span>
                  {tab.id === 'recommended' && (
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sync status + actions */}
        <div className="shrink-0 space-y-1.5 border-t border-white/[0.06] px-3 py-3">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              {syncing && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  syncing ? 'bg-emerald-400' : 'bg-emerald-500/70'
                )}
              />
            </span>
            <span className="text-[12px] text-gray-500">
              {syncing ? 'Syncing…' : 'Synced'}
            </span>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="group/nav flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-gray-200 disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                'h-[17px] w-[17px] shrink-0',
                syncing
                  ? 'animate-spin'
                  : 'transition-transform duration-300 group-hover/nav:rotate-180'
              )}
            />
            Sync Now
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="group/nav flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-gray-200"
          >
            <Settings className="h-[17px] w-[17px] shrink-0" />
            Settings
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet horizontal tab bar (visible below xl) */}
        <div className="sticky top-14 z-20 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-xl xl:hidden">
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6">
            <nav className="scrollbar-none -mb-px flex items-center gap-0.5 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[13px] font-medium transition-colors',
                      active
                        ? 'border-violet-500 text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    )}
                  >
                    <Icon
                      className={cn('h-4 w-4', active ? 'text-violet-400' : '')}
                    />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="flex shrink-0 items-center gap-1.5 py-2">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 transition-colors hover:border-white/[0.14] hover:text-gray-200 disabled:opacity-50"
                aria-label="Sync"
              >
                <RefreshCw
                  className={cn('h-4 w-4', syncing && 'animate-spin')}
                />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 transition-colors hover:border-white/[0.14] hover:text-gray-200"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 p-4 pb-10 sm:p-5 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-7xl space-y-8"
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Connect modal */}
      <AnimatePresence>
        {connectTarget && (
          <ConnectModal
            platform={connectTarget}
            onClose={() => setConnectTarget(null)}
            onConnect={handleConnect}
          />
        )}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </AnimatePresence>
    </div>
  );
}
