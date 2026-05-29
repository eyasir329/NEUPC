/**
 * @file Similar tab component
 * @module SimilarTab
 */

'use client';
import {
  Activity,
  Brain,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

const SOLVED_PROBLEMS = [
  {
    id: '18',
    name: '4Sum',
    difficulty: 'Medium',
    tags: ['array', 'two-pointers'],
    solvedDate: '2 days ago',
  },
  {
    id: '217',
    name: 'Contains Duplicate',
    difficulty: 'Easy',
    tags: ['array', 'hash-table'],
    solvedDate: '1 week ago',
  },
];
const SIMILAR_PROBLEMS = [
  {
    id: '15',
    name: 'Three Sum',
    difficulty: 'Medium',
    tags: ['array', 'two-pointers'],
    frequency: 95,
  },
  {
    id: '167',
    name: 'Two Sum II — Sorted Array',
    difficulty: 'Medium',
    tags: ['array', 'two-pointers', 'binary-search'],
    frequency: 88,
  },
  {
    id: '170',
    name: 'Two Sum III — Data Structure Design',
    difficulty: 'Easy',
    tags: ['design', 'hash-table'],
    frequency: 45,
  },
  {
    id: '560',
    name: 'Subarray Sum Equals K',
    difficulty: 'Medium',
    tags: ['array', 'hash-table', 'prefix-sum'],
    frequency: 92,
  },
  {
    id: '653',
    name: 'Two Sum IV — Input is a BST',
    difficulty: 'Easy',
    tags: ['tree', 'depth-first-search', 'hash-table'],
    frequency: 60,
  },
];

function difficultyStyle(diff) {
  switch ((diff || '').toLowerCase()) {
    case 'easy':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'medium':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'hard':
      return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    default:
      return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

export default function SimilarTab() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      {/* ── Previously solved ──────────────────────────────────────────── */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Previously Solved
              </h2>
              <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                Similar problems you've conquered
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-zinc-400">
            {SOLVED_PROBLEMS.length}{' '}
            <span className="font-normal text-zinc-600">solved</span>
          </span>
        </div>

        <div className="space-y-2">
          {SOLVED_PROBLEMS.map((prob) => (
            <motion.div
              key={prob.id}
              variants={item}
              className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/50 p-4 transition-colors hover:border-white/10 hover:bg-zinc-900/80 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="w-10 shrink-0 font-mono text-xs font-bold text-zinc-700">
                  #{prob.id.padStart(3, '0')}
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-zinc-400 line-through decoration-zinc-600 group-hover:text-zinc-300">
                      {prob.name}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${difficultyStyle(prob.difficulty)}`}
                    >
                      {prob.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prob.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium text-zinc-600 capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 md:ml-4">
                <span className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
                  Solved
                </span>
                <span className="rounded-md border border-white/[0.07] bg-zinc-900/80 px-2 py-0.5 text-xs text-zinc-400">
                  {prob.solvedDate}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Recommended problems ───────────────────────────────────────── */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Recommended Next
              </h2>
              <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                Strategically chosen practice problems
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-zinc-400">
            {SIMILAR_PROBLEMS.length}{' '}
            <span className="font-normal text-zinc-600">problems</span>
          </span>
        </div>

        <div className="space-y-2">
          {SIMILAR_PROBLEMS.map((prob) => (
            <motion.div
              key={prob.id}
              variants={item}
              className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/50 p-4 transition-colors hover:border-indigo-500/20 hover:bg-zinc-900/80 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="w-10 shrink-0 font-mono text-xs font-bold text-zinc-700">
                  #{prob.id.padStart(3, '0')}
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-zinc-200 transition-colors group-hover:text-white">
                      {prob.name}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${difficultyStyle(prob.difficulty)}`}
                    >
                      {prob.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prob.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium text-zinc-600 capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-5 md:ml-4">
                {/* Popularity bar */}
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1 font-mono text-[9px] tracking-widest text-zinc-600 uppercase">
                    <Activity className="h-2.5 w-2.5" /> Popularity
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${prob.frequency}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        className="h-full rounded-full bg-indigo-500"
                      />
                    </div>
                    <span className="w-7 text-right font-mono text-[10px] font-bold text-zinc-400">
                      {prob.frequency}%
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-zinc-400" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Insight banner ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 md:flex-row md:items-center"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
          <Brain className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="mb-1 text-sm font-semibold text-white">
            Pattern Insight
          </h3>
          <p className="text-xs leading-relaxed text-zinc-400">
            These problems share the same core pattern:{' '}
            <span className="font-medium text-zinc-200">
              complement lookup via hash map
            </span>
            . High popularity scores indicate these are essential for mastering
            O(1) state retrieval in competitive contexts.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 md:ml-auto">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
            Key Pattern
          </span>
        </div>
      </motion.div>
    </div>
  );
}
