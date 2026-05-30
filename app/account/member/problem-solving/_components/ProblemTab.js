/**
 * @file Problem tab component
 * @module ProblemTab
 */

'use client';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  BarChart2,
  ChevronDown,
  ListChecks,
  ArrowDownToLine,
  UploadCloud,
  ExternalLink,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';

function getDifficultyStyle(diff) {
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

function getVerdictDetails(verdict) {
  if (verdict === 'AC' || verdict === 'Accepted')
    return {
      label: 'Accepted',
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-400/5',
      icon: CheckCircle2,
    };
  if (verdict === 'WA' || verdict === 'Wrong Answer')
    return {
      label: 'Wrong Answer',
      color: 'text-rose-400 border-rose-500/20 bg-rose-400/5',
      icon: XCircle,
    };
  if (verdict === 'TLE')
    return {
      label: 'Time Limit Exceeded',
      color: 'text-amber-400 border-amber-500/20 bg-amber-400/5',
      icon: Clock,
    };
  return {
    label: verdict,
    color: 'text-zinc-400 border-zinc-700 bg-zinc-800/20',
    icon: AlertCircle,
  };
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function ProblemTab({ data }) {
  const verdictInfo = getVerdictDetails(data.verdict);
  const VerdictIcon = verdictInfo.icon;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-4xl space-y-8"
    >
      {/* ── Problem header ───────────────────────────────────────────── */}
      <motion.div
        variants={item}
        className="flex flex-col gap-5 border-b border-white/[0.07] pb-8 md:flex-row md:items-end md:justify-between"
      >
        <div className="space-y-3">
          {/* Platform breadcrumb */}
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-zinc-600" />
            <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              {data.platform} · Archive
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {data.problemName}
          </h1>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getDifficultyStyle(data.difficulty)}`}
            >
              {data.difficulty}
            </span>
            {(data.tags || []).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/[0.07] bg-white/3 px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-zinc-400 uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Rating + link */}
        <div className="flex items-center gap-3">
          <div className="flex min-w-22.5 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-zinc-900/60 px-5 py-3">
            <div className="mb-0.5 flex items-center gap-1 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              <BarChart2 className="h-3 w-3" /> Rating
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {data.difficultyRating}
            </div>
          </div>
          {data.problemId && (
            <a
              href={`#`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-zinc-900/60 text-zinc-500 transition-colors hover:border-white/20 hover:text-white"
              title="Open on platform"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </motion.div>

      {/* ── Main two-column layout ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Verdict banner */}
          <motion.div
            variants={item}
            className={`flex items-center gap-3 rounded-xl border p-4 ${verdictInfo.color}`}
          >
            <VerdictIcon className="h-5 w-5 shrink-0" />
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold">
                Last Submission: {verdictInfo.label}
              </h3>
              <p className="font-mono text-[10px] tracking-widest opacity-60">
                Submitted {formatDate(data.submittedAt)}
              </p>
            </div>
          </motion.div>

          {/* Description */}
          <motion.section variants={item} className="space-y-3">
            <h2 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              Problem Statement
            </h2>
            <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-zinc-300">
              <Markdown>{data.description}</Markdown>
            </div>
          </motion.section>

          {/* Input / Output format */}
          {(data.inputFormat || data.outputFormat) && (
            <motion.section
              variants={item}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {data.inputFormat && (
                <div className="rounded-xl border border-white/[0.07] bg-zinc-900/50 p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    <ArrowDownToLine className="h-3.5 w-3.5" /> Input Format
                  </h3>
                  <div className="prose prose-invert prose-xs max-w-none leading-relaxed text-zinc-400">
                    <Markdown>{data.inputFormat}</Markdown>
                  </div>
                </div>
              )}
              {data.outputFormat && (
                <div className="rounded-xl border border-white/[0.07] bg-zinc-900/50 p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    <UploadCloud className="h-3.5 w-3.5" /> Output Format
                  </h3>
                  <div className="prose prose-invert prose-xs max-w-none leading-relaxed text-zinc-400">
                    <Markdown>{data.outputFormat}</Markdown>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* Examples */}
          {(data.examples || []).length > 0 && (
            <motion.section variants={item} className="space-y-4">
              <h2 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                Examples
              </h2>
              <div className="space-y-3">
                {data.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900/50"
                  >
                    <div className="border-b border-white/[0.07] bg-zinc-900/80 px-4 py-2 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                      Example {idx + 1}
                    </div>
                    <div className="space-y-3 p-5 font-mono text-xs">
                      <div className="flex gap-3">
                        <span className="shrink-0 text-zinc-500">Input:</span>
                        <span className="break-all text-zinc-300">
                          {ex.input}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span className="shrink-0 text-zinc-500">Output:</span>
                        <span className="break-all text-emerald-400">
                          {ex.output}
                        </span>
                      </div>
                      {ex.explanation && (
                        <div className="border-t border-white/[0.07] pt-3 font-sans text-xs leading-relaxed text-zinc-400">
                          <span className="mr-2 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                            Explanation:
                          </span>
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Constraints */}
          {(data.constraints || []).length > 0 && (
            <motion.section
              variants={item}
              className="rounded-xl border border-white/[0.07] bg-zinc-900/50 p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-violet-400" />
                <h3 className="text-xs font-bold tracking-widest text-zinc-300 uppercase">
                  Constraints
                </h3>
              </div>
              <ul className="space-y-2.5">
                {data.constraints.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-xs text-zinc-400"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-500/60" />
                    <code className="font-mono leading-relaxed">{c}</code>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {/* Hints */}
          {(data.hints || []).length > 0 && (
            <motion.section variants={item} className="space-y-2">
              {data.hints.map((hint, idx) => (
                <details
                  key={idx}
                  className="group overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-4 text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-colors select-none hover:text-zinc-200">
                    Hint {idx + 1}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-white/[0.07] px-4 pt-3 pb-4 text-xs leading-relaxed text-zinc-400">
                    <Markdown>{hint}</Markdown>
                  </div>
                </details>
              ))}
            </motion.section>
          )}

          {/* Metadata */}
          <motion.section variants={item} className="space-y-2">
            {[
              { label: 'System ID', value: data.id },
              { label: 'Platform ID', value: data.problemId },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-zinc-900/50 px-4 py-3"
              >
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  {label}
                </span>
                <span className="font-mono text-xs text-zinc-400">{value}</span>
              </div>
            ))}
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
