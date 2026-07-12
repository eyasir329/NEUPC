/**
 * @file Shared constants, formatters, and small UI bits for the problem-solving dashboard.
 * @module ps-shared
 */

'use client';

import { motion } from 'framer-motion';
import { AlertCircle, BookOpen, CheckCircle2, Crown, House, Info, List, RefreshCw, Sparkles, Trophy, X, User as UserIcon } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getPaginationRange(currentPageIndex, totalPages) {
  const currentPage = currentPageIndex + 1;
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots.map((item) => (item === '...' ? '...' : item - 1));
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
  cfgym: {
    short: 'CG',
    name: 'CF Gym',
    color: 'bg-[#f472b6]',
    dot: 'bg-[#f472b6]',
    tagBg: 'bg-[#f472b6]/10',
    tagText: 'text-[#f472b6]',
    tagBorder: 'border-[#f472b6]/20',
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
  if (p === 'cfgym') {
    // problemId is like "100001A" (contestId >= 100000)
    const match = String(problemId).match(/^(\d+)([A-Za-z]\d*)$/);
    if (match)
      return `https://codeforces.com/gym/${match[1]}/problem/${match[2]}`;
    return null;
  }
  if (p === 'codeforces') {
    // problemId is typically "1234A" or "1234/A"
    const match = String(problemId).match(/^(\d+)([A-Za-z]\d*)$/);
    if (match)
      return `https://codeforces.com/problemset/problem/${match[1]}/${match[2]}`;
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
    if (parts.length >= 2)
      return `https://atcoder.jp/contests/${parts.slice(0, -1).join('_')}/tasks/${problemId}`;
    return null;
  }
  if (p === 'codechef') return `https://www.codechef.com/problems/${problemId}`;
  if (p === 'spoj') return `https://www.spoj.com/problems/${problemId}/`;
  if (p === 'hackerrank')
    return `https://www.hackerrank.com/challenges/${problemId}`;
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

function formatContestStart(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatContestDuration(seconds) {
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) return '—';
  const minutes = Math.round(total / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
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

function getTooltipStyle(pos, box) {
  const WIDTH = 260;
  const EST_HEIGHT = 200;
  const MARGIN = 8;
  const GAP = 14;
  if (!box) return { left: 0, top: 0 };

  const rect = box.getBoundingClientRect();
  const px = pos.x - rect.left;
  const py = pos.y - rect.top;

  const maxLeft = rect.width - WIDTH - MARGIN;
  const left = Math.max(MARGIN, Math.min(px - WIDTH / 2, maxLeft));

  const above = py - GAP - EST_HEIGHT;
  const maxTop = rect.height - EST_HEIGHT - MARGIN;
  let top = above >= MARGIN ? above : py + GAP + 12;
  top = Math.max(MARGIN, Math.min(top, maxTop));

  return { left, top };
}


export { cn, getPaginationRange, TABS, PLATFORM_META, getPlatformMeta, TOAST_DURATION_MS, DEFAULT_PROBLEM_SOLVING_DATA, getErrorMessage, buildProblemUrl, formatNumber, relativeTime, shortDate, formatContestStart, formatContestDuration, Toast, LoadingState, ErrorState, getTooltipStyle };
