/**
 * @file Student drawer component
 * @module StudentDrawer
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Award,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Star,
  BookOpen,
  Plus,
  Loader2,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Video,
} from 'lucide-react';
import {
  getMemberProgressAction,
  saveMentorNotesAction,
} from '@/app/_lib/actions/mentor-actions';

const TABS = [
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'recommendation', label: 'Recommendation', icon: Star },
];

function currentMonthPeriod() {
  return new Date().toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

function monthRange(period) {
  try {
    const d = new Date(period + ' 1');
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    return { start, end };
  } catch {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10),
    };
  }
}

// ─── Progress log form ───────────────────────────────────────────────────────

function ProgressLogForm({ menteeId, onDone }) {
  const [period, setPeriod] = useState(currentMonthPeriod());
  const [problems, setProblems] = useState('');
  const [contests, setContests] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!period.trim()) {
      setError('Period is required');
      return;
    }
    setSaving(true);
    setError(null);
    const { start, end } = monthRange(period);
    const fd = new FormData();
    fd.set('menteeId', menteeId);
    fd.set('period', period.trim());
    fd.set('start_date', start);
    fd.set('end_date', end);
    fd.set('problems_solved', problems || '0');
    fd.set('contests_participated', contests || '0');
    fd.set('mentor_notes', notes.trim());
    const result = await saveMentorNotesAction(fd);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onDone?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-md"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
        <p className="text-[10px] font-bold tracking-wider text-violet-400 uppercase">
          New Progress Entry
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
          Period (e.g. May 2026)
        </label>
        <input
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
            Problems Solved
          </label>
          <input
            type="number"
            min="0"
            value={problems}
            onChange={(e) => setProblems(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
            Contests
          </label>
          <input
            type="number"
            min="0"
            value={contests}
            onChange={(e) => setContests(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
          Monthly Performance Notes
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What key learning benchmarks did the student reach?"
          className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      {error && <p className="font-mono text-xs text-rose-400">{error}</p>}

      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => onDone?.()}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/2 py-2.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase transition duration-300 hover:bg-white/10 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-violet-500/20 bg-violet-500/10 py-2.5 text-[10px] font-bold tracking-wider text-violet-300 uppercase transition duration-300 hover:bg-violet-500/25"
        >
          {saving ? 'Saving…' : 'Save Log'}
        </button>
      </div>
    </form>
  );
}

// ─── Recommendation form ─────────────────────────────────────────────────────

function RecommendationForm({ menteeId, currentNote, onDone }) {
  const [note, setNote] = useState(currentNote || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set('menteeId', menteeId);
    fd.set('period', 'Recommendation');
    fd.set('start_date', new Date().getFullYear() + '-01-01');
    fd.set('end_date', new Date().getFullYear() + '-12-31');
    fd.set('problems_solved', '0');
    fd.set('contests_participated', '0');
    fd.set('mentor_notes', note.trim());
    const result = await saveMentorNotesAction(fd);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onDone?.(note.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        rows={6}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write a recommendation covering this mentee's strengths, areas of improvement, and readiness for opportunities…"
        className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/40"
      />

      {error && <p className="font-mono text-xs text-rose-400">{error}</p>}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => onDone?.()}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/2 py-2.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase transition duration-300 hover:bg-white/10 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 py-2.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase transition duration-300 hover:bg-amber-500/25"
        >
          {saving ? 'Saving…' : 'Save Recommendation'}
        </button>
      </div>
    </form>
  );
}

// ─── Main drawer ─────────────────────────────────────────────────────────────

export function StudentDrawer({ student, onClose, detailedStats }) {
  const [tab, setTab] = useState('syllabus');
  const [progress, setProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showRecForm, setShowRecForm] = useState(false);
  const [recNote, setRecNote] = useState(null);

  const menteeId = student?.user_id;

  useEffect(() => {
    if (!menteeId) return;
    setProgressLoading(true);
    getMemberProgressAction(menteeId).then(({ progress: p }) => {
      const entries = p || [];
      setProgress(entries.filter((e) => e.period !== 'Recommendation'));
      const rec = entries.find((e) => e.period === 'Recommendation');
      setRecNote(rec?.mentor_notes || null);
      setProgressLoading(false);
    });
  }, [menteeId]);

  if (!student) return null;

  const user = student.users;
  const name = user?.full_name || 'Candidate';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Use detailedStats curriculum if loaded, else fall back
  const lessons =
    detailedStats?.curriculum?.courses?.flatMap(
      (c) => c.modules?.flatMap((m) => m.lessons || []) || []
    ) || [];
  const completedCount =
    detailedStats?.lessonsCompleted ??
    lessons.filter((l) => l.progress?.is_completed).length;
  const totalLessons = lessons.length;
  const pct =
    totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : student.progress_percent || 0;
  const scoreBreakdown = detailedStats?.scoreBreakdown;
  const totalScore = scoreBreakdown?.total ?? student.score ?? 0;
  const totalWatchTime = detailedStats?.totalWatchTime || 0;
  const sessionsAttended = detailedStats?.sessionsAttended || 0;

  const totalProblems = progress.reduce(
    (s, p) => s + (p.problems_solved || 0),
    0
  );
  const totalContests = progress.reduce(
    (s, p) => s + (p.contests_participated || 0),
    0
  );

  function fmtSecs(s) {
    if (!s) return '0m';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative z-10 flex w-full max-w-md flex-col border-l border-white/10 bg-zinc-900/95 text-gray-300 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/2 px-5 py-4.5">
            <div className="flex items-center gap-3">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={name}
                  className="h-9 w-9 rounded-xl border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-xs font-bold text-violet-400">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-200">{name}</p>
                <p className="mt-0.5 max-w-55 truncate text-[10px] text-gray-500">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-500 transition duration-300 hover:bg-white/5 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stats cockpit */}
          <div className="grid shrink-0 grid-cols-4 gap-2 border-b border-white/10 bg-white/2 p-3">
            {[
              {
                label: 'Score',
                value: detailedStats?.loading ? '…' : totalScore,
                color: 'text-amber-400',
                bg: 'bg-amber-500/[0.03] border-amber-500/10',
              },
              {
                label: 'Watch',
                value: detailedStats?.loading ? '…' : fmtSecs(totalWatchTime),
                color: 'text-violet-400',
                bg: 'bg-violet-500/[0.03] border-violet-500/10',
              },
              {
                label: 'Sessions',
                value: detailedStats?.loading ? '…' : sessionsAttended,
                color: 'text-sky-400',
                bg: 'bg-sky-500/[0.03] border-sky-500/10',
              },
              {
                label: 'Logs',
                value: progress.length,
                color: 'text-blue-400',
                bg: 'bg-blue-500/[0.03] border-blue-500/10',
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-xl border px-1 py-2 ${s.bg} text-center`}
              >
                <p
                  className={`font-mono text-xs font-bold tracking-tight ${s.color}`}
                >
                  {s.value}
                </p>
                <p className="mt-0.5 text-[9px] font-semibold tracking-wider text-gray-500 uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex shrink-0 gap-1.5 border-b border-white/10 bg-white/2 p-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                    active
                      ? 'border border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.06)]'
                      : 'border border-transparent bg-transparent text-gray-400 hover:bg-black/30 hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                  {t.id === 'recommendation' && recNote && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-20">
            {/* Syllabus tab */}
            {tab === 'syllabus' && (
              <div className="space-y-4">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                    <span className="mb-1 block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                      Status
                    </span>
                    <span className="font-bold text-violet-300 capitalize">
                      {student.status}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                    <span className="mb-1 block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                      Enrolled
                    </span>
                    <span className="font-bold text-slate-200">
                      {new Date(student.enrolled_at).toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric', year: 'numeric' }
                      )}
                    </span>
                  </div>
                </div>

                {/* Score breakdown */}
                {scoreBreakdown && (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60">
                    <div className="flex items-center gap-2 border-b border-white/5 bg-white/2 px-4 py-2.5">
                      <Award className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                        Score Breakdown
                      </span>
                      <span className="ml-auto text-xs font-black text-amber-300 tabular-nums">
                        {scoreBreakdown.total} pts total
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-px bg-white/5">
                      {[
                        {
                          label: 'Lessons',
                          value: scoreBreakdown.lesson,
                          color: 'text-violet-400',
                        },
                        {
                          label: 'Tasks',
                          value: scoreBreakdown.task,
                          color: 'text-emerald-400',
                        },
                        {
                          label: 'Exams',
                          value: scoreBreakdown.exam,
                          color: 'text-fuchsia-400',
                        },
                        {
                          label: 'Sessions',
                          value: scoreBreakdown.session,
                          color: 'text-sky-400',
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="bg-zinc-950/80 px-2 py-3 text-center"
                        >
                          <p
                            className={`text-sm font-black tabular-nums ${s.color}`}
                          >
                            {s.value}
                          </p>
                          <p className="mt-0.5 text-[9px] tracking-wider text-gray-600 uppercase">
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-2 px-0.5">
                  <div className="flex justify-between text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    <span>Lesson progress</span>
                    <span className="text-slate-300">
                      {completedCount}/{totalLessons} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full border border-white/5 bg-white/5">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Lesson list */}
                {detailedStats?.loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  </div>
                ) : lessons.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-white/10 bg-zinc-950/80 px-4 py-2.5 text-[9px]">
                      <span className="flex items-center gap-1.5 font-mono font-bold text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-rose-500/60" />
                        <span className="h-2 w-2 rounded-full bg-amber-500/60" />
                        <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
                        <span className="ml-1 font-bold tracking-widest text-slate-400 uppercase">
                          Syllabus Logs
                        </span>
                      </span>
                      {totalWatchTime > 0 && (
                        <span className="flex items-center gap-1 font-mono font-bold text-violet-400">
                          <Clock className="h-3 w-3" />
                          {fmtSecs(totalWatchTime)}
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-b-2xl border border-white/10 bg-zinc-950/80 p-3.5 pr-1">
                      {lessons.map((l) => {
                        const done = l.progress?.is_completed;
                        const exam = l.examSubmission;
                        const wt = l.progress?.watch_time;
                        return (
                          <div
                            key={l.id}
                            className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/2 px-3 py-2 text-xs transition hover:border-white/10"
                          >
                            {done ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            ) : (
                              <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
                            )}
                            <span
                              className={`flex-1 truncate font-mono ${done ? 'text-gray-500' : 'text-gray-300'}`}
                            >
                              {l.title}
                            </span>
                            {exam?.status === 'graded' && (
                              <span className="shrink-0 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-400">
                                {exam.score}pt
                              </span>
                            )}
                            {wt > 0 && (
                              <span className="shrink-0 font-mono text-[9px] text-zinc-600">
                                {fmtSecs(wt)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="py-6 text-center font-mono text-xs text-gray-500 italic">
                    No lesson data available
                  </p>
                )}

                {/* Task submissions */}
                {detailedStats?.taskSubmissions?.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60">
                    <div className="flex items-center gap-2 border-b border-white/5 bg-white/2 px-4 py-2.5">
                      <FileText className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                        Task Submissions
                      </span>
                    </div>
                    <div className="space-y-1.5 p-3">
                      {detailedStats.taskSubmissions.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 px-3 py-2 text-xs"
                        >
                          <span className="flex-1 truncate text-gray-300">
                            {t.weekly_tasks?.title || 'Task'}
                          </span>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                              t.status === 'graded'
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : t.status === 'pending'
                                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                                  : 'border-white/10 bg-white/5 text-gray-400'
                            }`}
                          >
                            {t.status === 'graded'
                              ? `${t.points_earned}pt`
                              : t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Session attendance */}
                {detailedStats?.sessionDetails?.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60">
                    <div className="flex items-center gap-2 border-b border-white/5 bg-white/2 px-4 py-2.5">
                      <Video className="h-3.5 w-3.5 text-sky-400" />
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                        Sessions
                      </span>
                      <span className="ml-auto text-[9px] font-bold text-sky-400">
                        {sessionsAttended}/{detailedStats.sessionDetails.length}{' '}
                        attended
                      </span>
                    </div>
                    <div className="max-h-40 space-y-1.5 overflow-y-auto p-3">
                      {detailedStats.sessionDetails.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 px-3 py-2 text-xs"
                        >
                          <span className="flex-1 truncate text-gray-300">
                            {s.topic ||
                              new Date(s.session_date).toLocaleDateString()}
                          </span>
                          {s.attended ? (
                            <span className="shrink-0 rounded-full border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold text-sky-400">
                              {s.points > 0 ? `+${s.points}pt` : '✓'}
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-zinc-600">
                              absent
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress tab */}
            {tab === 'progress' && (
              <div className="space-y-4">
                {progressLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  </div>
                ) : (
                  <>
                    {!showProgressForm && (
                      <button
                        onClick={() => setShowProgressForm(true)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/2 py-3 text-xs font-bold text-gray-400 transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/[0.02] hover:text-violet-300"
                      >
                        <Plus className="h-4 w-4" /> Log Progress Entry
                      </button>
                    )}

                    {showProgressForm && (
                      <ProgressLogForm
                        menteeId={menteeId}
                        onDone={() => {
                          setShowProgressForm(false);
                          getMemberProgressAction(menteeId).then(
                            ({ progress: p }) => {
                              setProgress(
                                (p || []).filter(
                                  (e) => e.period !== 'Recommendation'
                                )
                              );
                            }
                          );
                        }}
                      />
                    )}

                    {progress.length === 0 && !showProgressForm && (
                      <p className="py-6 text-center font-mono text-xs text-gray-500 italic">
                        No progress logged yet.
                      </p>
                    )}

                    <div className="space-y-3">
                      {progress.map((p) => (
                        <div
                          key={p.id}
                          className="relative rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition-all hover:border-white/20"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-violet-400" />
                              <p className="text-xs font-bold text-slate-200">
                                {p.period}
                              </p>
                            </div>
                            <div className="flex gap-2.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                              <span className="rounded-full border border-blue-500/10 bg-blue-500/10 px-2 py-0.5 text-blue-400">
                                {p.problems_solved ?? 0} prob
                              </span>
                              <span className="rounded-full border border-emerald-500/10 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                                {p.contests_participated ?? 0} cont
                              </span>
                            </div>
                          </div>
                          {p.mentor_notes && (
                            <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-gray-400">
                              {p.mentor_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Recommendation tab */}
            {tab === 'recommendation' && (
              <div className="space-y-4">
                {!showRecForm ? (
                  <>
                    {recNote ? (
                      <div className="relative rounded-2xl border border-amber-500/20 bg-zinc-900/60 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-amber-200">
                        <div className="absolute top-2 right-2 opacity-30">
                          <Award className="h-8 w-8 text-amber-400" />
                        </div>
                        {recNote}
                      </div>
                    ) : (
                      <p className="py-6 text-center font-mono text-xs text-gray-500 italic">
                        No recommendation written yet.
                      </p>
                    )}
                    <button
                      onClick={() => setShowRecForm(true)}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 py-3 text-xs font-bold tracking-wider text-amber-300 uppercase transition-all duration-300 hover:bg-amber-500/20 hover:text-amber-200"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {recNote ? 'Edit Recommendation' : 'Write Recommendation'}
                    </button>
                  </>
                ) : (
                  <RecommendationForm
                    menteeId={menteeId}
                    currentNote={recNote}
                    onDone={(saved) => {
                      setShowRecForm(false);
                      if (typeof saved === 'string') setRecNote(saved || null);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="absolute right-0 bottom-0 left-0 z-20 flex items-center justify-between border-t border-white/10 bg-zinc-950/80 px-5 py-4 shadow-lg">
            <span className="font-mono text-[9px] tracking-wider text-gray-600">
              ID: {user?.id?.slice(0, 12)}…
            </span>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/2 px-4 py-2 text-xs font-bold tracking-wider text-gray-400 uppercase transition duration-300 hover:bg-white/10 hover:text-slate-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
