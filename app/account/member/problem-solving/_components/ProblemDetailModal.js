/**
 * @file Problem detail modal component
 * @module ProblemDetailModal
 */

'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  FileText,
  Clock,
  Lightbulb,
  StickyNote,
  Star,
  X,
  ExternalLink,
  Share2,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProblemTab from './ProblemTab';
import NotesTab from './NotesTab';
import AIAnalysisTab from './AIAnalysisTab';
import SubmissionsTab from './SubmissionsTab';
import SimilarTab from './SimilarTab';

const TABS = [
  {
    id: 'Problem',
    icon: FileText,
    label: 'Problem',
    accent: 'text-violet-400',
    gradient: 'from-violet-500 to-purple-500',
    hint: 'Statement, examples, constraints',
  },
  {
    id: 'Submissions',
    icon: Clock,
    label: 'Submissions',
    accent: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
    hint: 'Your attempts and others’',
  },
  {
    id: 'AI Analysis',
    icon: Sparkles,
    label: 'AI Analysis',
    accent: 'text-indigo-400',
    gradient: 'from-indigo-500 to-blue-500',
    hint: 'Smart breakdown & chat',
  },
  {
    id: 'Similar',
    icon: Lightbulb,
    label: 'Similar',
    accent: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
    hint: 'Related practice',
  },
  {
    id: 'Notes',
    icon: StickyNote,
    label: 'Notes',
    accent: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
    hint: 'Personal & club notes',
  },
];

const DIFFICULTY_CONFIG = {
  Easy: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    dot: 'bg-emerald-400',
  },
  Medium: {
    text: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    dot: 'bg-amber-400',
  },
  Hard: {
    text: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    dot: 'bg-rose-400',
  },
};

const PLATFORM_STYLE = {
  codeforces: 'border-[#f87171]/20 bg-[#f87171]/10 text-[#f87171]',
  leetcode: 'border-[#facc15]/20 bg-[#facc15]/10 text-[#facc15]',
  atcoder: 'border-[#60a5fa]/20 bg-[#60a5fa]/10 text-[#60a5fa]',
  codechef: 'border-[#c084fc]/20 bg-[#c084fc]/10 text-[#c084fc]',
  hackerrank: 'border-[#4ade80]/20 bg-[#4ade80]/10 text-[#4ade80]',
  spoj: 'border-[#94a3b8]/20 bg-[#94a3b8]/10 text-[#94a3b8]',
};

function buildProblemUrl(platform, problemId) {
  if (!problemId) return null;
  const p = (platform || '').toLowerCase();
  if (p === 'codeforces') {
    const m = String(problemId).match(/^(\d+)([A-Za-z]\d*)$/);
    if (m) return `https://codeforces.com/problemset/problem/${m[1]}/${m[2]}`;
    if (String(problemId).includes('/')) {
      const [c, x] = String(problemId).split('/');
      return `https://codeforces.com/problemset/problem/${c}/${x}`;
    }
    return null;
  }
  if (p === 'leetcode') return `https://leetcode.com/problems/${problemId}/`;
  if (p === 'atcoder') {
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

function normalizeProblem(problem) {
  if (!problem) return null;
  // Allow either snake_case (live data) or camelCase (mock).
  const platform = problem.platform || problem.platformId || 'leetcode';
  const problemId = problem.problem_id || problem.problemId || '';
  const verdict = String(problem.verdict || '').toUpperCase();
  const isAc = verdict === 'OK' || verdict === 'AC' || verdict === 'ACCEPTED';
  const rating = problem.difficulty_rating || problem.difficultyRating || 0;
  const difficulty =
    problem.difficulty ||
    (rating > 0 && rating < 1400
      ? 'Easy'
      : rating < 1900
        ? 'Medium'
        : rating >= 1900
          ? 'Hard'
          : 'Easy');
  return {
    platform,
    problemId,
    problemName:
      problem.problem_name || problem.problemName || problemId || 'Problem',
    difficulty,
    difficultyRating: rating || 800,
    tags: problem.tags || [],
    verdict: isAc ? 'AC' : verdict || 'AC',
    submittedAt:
      problem.submitted_at || problem.submittedAt || new Date().toISOString(),
  };
}

export default function ProblemDetailModal({ problem, onClose }) {
  const [activeTab, setActiveTab] = useState('Problem');
  const [starred, setStarred] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const real = useMemo(() => normalizeProblem(problem), [problem]);

  // Compose the data shape ProblemTab expects, falling back to demo content.
  const tabData = useMemo(
    () => ({
      difficulty: real?.difficulty ?? 'Easy',
      difficultyRating: real?.difficultyRating ?? 800,
      id: 'sub-0',
      platform: real?.platform ?? 'leetcode',
      problemId: real?.problemId ?? 'sample',
      problemName: real?.problemName ?? 'Two Sum',
      submittedAt: real?.submittedAt ?? new Date().toISOString(),
      tags: real?.tags?.length ? real.tags : ['hash-map', 'array'],
      verdict: real?.verdict ?? 'AC',
      description:
        'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      inputFormat:
        'The first line contains an array of integers `nums`.\nThe second line contains an integer `target`.',
      outputFormat:
        'Return an array containing two integers: the indices of the two numbers that add up to `target`.',
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
        },
      ],
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Only one valid answer exists.',
      ],
      hints: [],
    }),
    [real]
  );

  const externalUrl = useMemo(
    () => buildProblemUrl(tabData.platform, tabData.problemId),
    [tabData.platform, tabData.problemId]
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Don't capture keys while typing in inputs/textareas.
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable)
        return;

      // 1-5 quick tab switch
      if (/^[1-5]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (TABS[idx]) setActiveTab(TABS[idx].id);
        return;
      }
      // ←/→ to step through tabs
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const dir = e.key === 'ArrowLeft' ? -1 : 1;
        const i = TABS.findIndex((t) => t.id === activeTab);
        const next = TABS[(i + dir + TABS.length) % TABS.length];
        setActiveTab(next.id);
      }
    },
    [activeTab, onClose]
  );

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKey);
    };
  }, [handleKey]);

  // Reset to first tab whenever the modal opens for a new problem
  useEffect(() => {
    setActiveTab('Problem');
    setStarred(false);
  }, [problem]);

  const diffStyle =
    DIFFICULTY_CONFIG[tabData.difficulty] || DIFFICULTY_CONFIG.Easy;
  const platformStyle =
    PLATFORM_STYLE[tabData.platform.toLowerCase()] ||
    'border-white/8 bg-white/4 text-zinc-400';
  const activeTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  const handleShare = async () => {
    const url =
      externalUrl ||
      (typeof window !== 'undefined' ? window.location.href : '');
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  if (!mounted) return null;

  return createPortal(
    <motion.div
      key="problem-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-100 flex min-h-0 flex-col overflow-hidden bg-[#09090b] font-sans text-zinc-200 selection:bg-violet-500/30"
      style={{
        backgroundImage:
          'radial-gradient(at 0% 0%, rgba(139,92,246,0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(99,102,241,0.05) 0px, transparent 50%)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Problem: ${tabData.problemName}`}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#09090b]/90 px-4 backdrop-blur-xl md:px-6">
        {/* Left: identity + meta */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Active tab dot — visual context for what user is viewing */}
          <div
            className={`hidden h-2 w-2 shrink-0 rounded-full bg-linear-to-br ${activeTabMeta.gradient} sm:block`}
            title={`Currently viewing: ${activeTabMeta.label}`}
          />

          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden shrink-0 font-mono text-[10px] tracking-widest text-zinc-600 uppercase sm:inline">
              #
              {String(tabData.problemId)
                .split(/[-/]/)
                .pop()
                .slice(0, 6)
                .padStart(4, '0')}
            </span>
            <h1 className="truncate text-sm font-semibold text-white">
              {tabData.problemName}
            </h1>
          </div>

          {/* Meta chips */}
          <div className="hidden items-center gap-1.5 md:flex">
            <span
              className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${diffStyle.text} ${diffStyle.bg} ${diffStyle.border}`}
            >
              <span className={`h-1 w-1 rounded-full ${diffStyle.dot}`} />
              {tabData.difficulty}
            </span>
            <span className="rounded-md border border-white/8 bg-white/4 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-400">
              R{tabData.difficultyRating}
            </span>
            <span
              className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase ${platformStyle}`}
            >
              {tabData.platform}
            </span>
          </div>
        </div>

        {/* Right: action cluster */}
        <div className="flex shrink-0 items-center gap-1.5">
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on platform"
              className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/8 bg-white/3 px-3 text-[11px] font-semibold text-zinc-400 transition-all hover:border-white/20 hover:bg-white/8 hover:text-white sm:flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          )}
          <button
            onClick={handleShare}
            title="Copy link"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-zinc-500 transition-all hover:border-white/20 hover:text-zinc-300"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setStarred((s) => !s)}
            title={starred ? 'Remove bookmark' : 'Bookmark problem'}
            aria-pressed={starred}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
              starred
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-400'
                : 'border-white/8 bg-white/3 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 ${starred ? 'fill-amber-400' : ''}`}
            />
          </button>
          <div className="mx-1 hidden h-5 w-px bg-white/8 sm:block" />
          <button
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-zinc-500 transition-all hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-white/[0.07] bg-[#09090b]/95 backdrop-blur-md">
        <nav
          role="tablist"
          aria-label="Problem detail tabs"
          className="scrollbar-none mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-2 md:px-4"
        >
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                title={`${tab.hint} — press ${idx + 1}`}
                className={`group relative my-1.5 flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium tracking-wide whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none ${
                  isActive
                    ? 'text-white'
                    : 'text-zinc-500 hover:bg-white/4 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="problemModalTabBg"
                    className={`absolute inset-0 rounded-lg bg-linear-to-r ${tab.gradient} opacity-[0.12]`}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="problemModalTabBorder"
                    className={`absolute inset-0 rounded-lg border bg-transparent ${
                      tab.id === 'Problem'
                        ? 'border-violet-500/30'
                        : tab.id === 'Submissions'
                          ? 'border-emerald-500/30'
                          : tab.id === 'AI Analysis'
                            ? 'border-indigo-500/30'
                            : tab.id === 'Similar'
                              ? 'border-amber-500/30'
                              : 'border-purple-500/30'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon
                  className={`relative h-3.5 w-3.5 transition-colors ${
                    isActive ? tab.accent : 'opacity-60 group-hover:opacity-100'
                  }`}
                />
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'Problem' && <ProblemTab data={tabData} />}
              {activeTab === 'Submissions' && <SubmissionsTab />}
              {activeTab === 'AI Analysis' && <AIAnalysisTab />}
              {activeTab === 'Similar' && <SimilarTab />}
              {activeTab === 'Notes' && <NotesTab />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer with keyboard hints ─────────────────────────────── */}
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-t border-white/5 px-4 py-3 md:px-6">
          <div className="hidden items-center gap-3 text-[10px] font-medium text-zinc-600 sm:flex">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">
                Esc
              </kbd>
              <span>close</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">
                ←
              </kbd>
              <kbd className="rounded border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">
                →
              </kbd>
              <span>switch tabs</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">
                1–5
              </kbd>
              <span>jump to tab</span>
            </span>
          </div>
          <div className="ml-auto font-mono text-[10px] tracking-widest text-zinc-700 uppercase">
            {activeTabMeta.label}
          </div>
        </div>
      </main>
    </motion.div>,
    document.body
  );
}
