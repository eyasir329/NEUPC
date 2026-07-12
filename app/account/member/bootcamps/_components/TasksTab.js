/**
 * @file Tasks tab: task cards, stepper, and submissions.
 * @module TasksTab
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, ChevronDown, ClipboardList, Clock, FileText, HourglassIcon, Layers, Loader2, Send, Sparkles, Trophy, Upload } from 'lucide-react';
import { getMemberBootcampTasks, submitTaskAction, uploadTaskAttachmentAction } from '@/app/_lib/actions/bootcamp-actions';
import { PointsStatsPanel } from './PointsStatsPanel';
import { AttachmentList, EmptyState, MultiBlockEditor, TaskDescriptionRenderer, cn, fmtDhaka } from './bootcamps-shared';

const DIFF_COLOR = {
  easy: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  hard: 'text-rose-400 bg-rose-500/10 ring-rose-500/20',
};

const SUB_STATUS_STYLE = {
  pending:
    'text-amber-400 bg-amber-500/10 ring-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]',
  completed:
    'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]',
  accepted:
    'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]',
  late: 'text-rose-400 bg-rose-500/10 ring-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.05)]',
  'redo action required':
    'text-orange-400 bg-orange-500/10 ring-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.05)]',
  'bonus deserved':
    'text-violet-400 bg-violet-500/10 ring-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.05)]',
};

function TaskStepper({ task, sub }) {
  const isAssigned = true;
  const isSubmitted = !!sub;
  const isGraded = sub?.points_earned != null || !!sub?.feedback;
  const isRedo = sub?.status === 'redo action required';

  const availableDate = task.start_time || task.created_at;
  const steps = [
    {
      label: 'Available',
      active: isAssigned,
      desc: availableDate
        ? fmtDhaka(availableDate, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : 'Active',
    },
    {
      label: isSubmitted ? 'Submitted' : 'Pending',
      active: isSubmitted,
      desc: sub?.submitted_at
        ? new Date(sub.submitted_at).toLocaleDateString()
        : 'Awaiting solution',
    },
    {
      label: isRedo ? 'Redo Required' : isGraded ? 'Graded' : 'Assessment',
      active: isGraded || isSubmitted,
      desc: isRedo
        ? 'Action needed'
        : isGraded
          ? `${sub.points_earned} pts`
          : isSubmitted
            ? 'Under Review'
            : 'Awaiting grading',
    },
  ];

  return (
    <div className="mb-5 rounded-2xl border border-white/5 bg-zinc-950/20 p-4.5 shadow-inner select-none">
      <div className="relative mx-auto flex max-w-lg items-center justify-between gap-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="group relative z-10 flex flex-1 flex-col items-center text-center"
          >
            {/* Connector Line */}
            {idx > 0 && (
              <div className="absolute top-4.5 right-1/2 -left-1/2 -z-10 h-0.5">
                <div
                  className={cn(
                    'h-full transition-all duration-700 ease-in-out',
                    steps[idx].active
                      ? 'bg-linear-to-r from-violet-500 to-indigo-500'
                      : 'bg-white/5'
                  )}
                />
              </div>
            )}

            {/* Step Node */}
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-all duration-500',
                step.active
                  ? idx === 2 && isRedo
                    ? 'text-rose-450 scale-105 border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'to-indigo-650 scale-105 border-violet-500 bg-linear-to-br from-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'border-white/10 bg-zinc-900 text-gray-600'
              )}
            >
              {idx === 0 ? (
                <Calendar className="h-4.5 w-4.5" />
              ) : idx === 1 ? (
                <Upload className="h-4.5 w-4.5" />
              ) : isRedo ? (
                <AlertCircle className="h-4.5 w-4.5 animate-pulse" />
              ) : isGraded ? (
                <Trophy className="h-4.5 w-4.5 text-amber-300" />
              ) : (
                <HourglassIcon className="h-4.5 w-4.5" />
              )}
            </div>

            {/* Labels */}
            <p
              className={cn(
                'mt-2.5 text-[10.5px] font-black tracking-wider uppercase transition-colors',
                step.active ? 'text-white' : 'text-gray-550'
              )}
            >
              {step.label}
            </p>
            <p className="mt-0.5 font-mono text-[9.5px] text-gray-500">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onSubmitted, focusId }) {
  const isFocused = focusId === `task-${task.id}`;
  const cardRef = useRef(null);
  const [open, setOpen] = useState(isFocused);
  const [content, setContent] = useState(
    () =>
      task.mySubmission?.notes ||
      JSON.stringify([
        { id: crypto.randomUUID(), type: 'richText', content: '' },
      ])
  );
  const [attachments, setAttachments] = useState(() =>
    Array.isArray(task.mySubmission?.attachments)
      ? task.mySubmission.attachments
      : []
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const sub = task.mySubmission;
  const isRedo = sub?.status === 'redo action required';
  const canSubmit = !sub || isRedo;
  const isPastDue = task.deadline && new Date(task.deadline) < new Date();

  // Scroll a deep-linked task into view once it mounts (after async load).
  useEffect(() => {
    if (!isFocused || !cardRef.current) return;
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(t);
  }, [isFocused]);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setError('');
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadTaskAttachmentAction(fd);
      if (res.error) {
        setError(res.error);
        continue;
      }
      uploaded.push({
        url: res.url,
        name: res.name,
        size: res.size,
        type: res.type,
      });
    }
    setAttachments((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData();
    fd.set('task_id', task.id);
    fd.set('submission_url', '');
    fd.set('notes', content);
    fd.set('attachments', JSON.stringify(attachments));
    const result = await submitTaskAction(fd);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSubmitted(task.id, result.data);
  };

  const diffAccent = {
    easy: {
      border: 'border-l-[3.5px] border-l-emerald-500/85',
      glow: 'hover:shadow-[0_4px_24px_rgba(16,185,129,0.04)] border-emerald-500/10',
    },
    medium: {
      border: 'border-l-[3.5px] border-l-amber-500/85',
      glow: 'hover:shadow-[0_4px_24px_rgba(245,158,11,0.04)] border-amber-500/10',
    },
    hard: {
      border: 'border-l-[3.5px] border-l-rose-500/85',
      glow: 'hover:shadow-[0_4px_24px_rgba(244,63,94,0.04)] border-rose-500/10',
    },
  };
  const activeDiff = diffAccent[task.difficulty] || {
    border: 'border-l-[3.5px] border-l-gray-500/50',
    glow: '',
  };

  return (
    <div
      ref={cardRef}
      id={`task-${task.id}`}
      className={cn(
        'relative scroll-mt-24 overflow-hidden rounded-2xl border bg-zinc-900/40 backdrop-blur-xl transition-all duration-300',
        open
          ? 'animate-none border-violet-500/30 bg-zinc-900/60 shadow-[0_0_24px_rgba(139,92,246,0.06)]'
          : cn(
              'border-white/5 hover:border-white/20 hover:bg-zinc-900/60',
              activeDiff.glow
            ),
        isFocused && 'ring-2 ring-violet-500/60 ring-offset-2 ring-offset-zinc-950',
        activeDiff.border
      )}
    >
      <button
        className="group flex w-full items-center gap-3.5 px-5 py-4.5 text-left select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={cn(
            'shrink-0 rounded px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest uppercase ring-1',
            DIFF_COLOR[task.difficulty] ??
              'text-gray-450 bg-white/5 ring-white/10'
          )}
        >
          {task.difficulty}
        </span>
        <span className="flex-1 truncate text-[14px] font-bold text-white/95 transition-colors group-hover:text-white">
          {task.title}
        </span>
        <span className="shrink-0 rounded border border-white/5 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest text-gray-500 uppercase">
          {task.bootcampTitle?.split(':')[0]}
        </span>
        {task.points != null && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10.5px] font-black text-amber-400">
            <Trophy className="h-3 w-3 text-amber-400" /> {task.points} pts
          </span>
        )}
        {task.start_time && (
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] font-semibold text-gray-600">
            <Calendar className="h-3 w-3 opacity-60" />
            {fmtDhaka(task.start_time, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
        {task.deadline && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-bold',
              isPastDue && !sub ? 'text-rose-400' : 'text-gray-500'
            )}
          >
            <Clock className="h-3.5 w-3.5 opacity-60" />
            {fmtDhaka(task.deadline, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
        {sub ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-black tracking-widest uppercase ring-1',
              SUB_STATUS_STYLE[sub.status] ??
                'bg-white/5 text-gray-400 ring-white/10'
            )}
          >
            {sub.status}
          </span>
        ) : (
          <span className="text-gray-550 shrink-0 rounded-full bg-white/2 px-2.5 py-0.5 font-mono text-[9px] font-black tracking-widest uppercase ring-1 ring-white/[0.05]">
            not submitted
          </span>
        )}
        <ChevronDown
          className={cn(
            'text-gray-555 h-4 w-4 shrink-0 transition-transform duration-300 group-hover:text-white',
            open ? 'rotate-180 text-violet-400 group-hover:text-violet-400' : ''
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 border-t border-white/5 bg-white/[0.01] px-6 pt-5 pb-6 text-left"
          >
            {/* Visual Lifecycle Stepper */}
            <TaskStepper task={task} sub={sub} />

            {task.description && (
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">
                  Task Details
                </p>
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4.5 text-[13px] leading-relaxed text-gray-300 shadow-inner">
                  <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-linear-to-b from-violet-500 to-indigo-500 opacity-60" />
                  <TaskDescriptionRenderer content={task.description} />
                </div>
              </div>
            )}

            {Array.isArray(task.problem_links) &&
              task.problem_links.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">
                    Problem Attachments
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                    {task.problem_links.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 rounded-xl border border-violet-500/10 bg-violet-500/[0.02] px-4 py-3 text-xs font-bold text-violet-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-violet-500/[0.08] active:scale-95"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 transition-all group-hover:scale-105">
                          <FileText className="h-4.5 w-4.5 text-violet-400" />
                        </div>
                        <span className="truncate">
                          Download Resource {i + 1}
                        </span>
                        <ArrowRight className="ml-auto h-3.5 w-3.5 text-violet-400/60 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {sub && (
              <div className="space-y-4 rounded-2xl border border-white/5 bg-black/20 p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <p className="text-[10.5px] font-extrabold tracking-widest text-gray-400 uppercase">
                      Your Submission
                    </p>
                  </div>
                  {sub.submitted_at && (
                    <span className="font-mono text-[10.5px] font-bold text-gray-500">
                      Submitted{' '}
                      {fmtDhaka(sub.submitted_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {sub.notes && (
                  <div className="rounded-xl border border-white/5 bg-black/35 p-4 text-[13px] leading-relaxed text-gray-300 shadow-inner">
                    <TaskDescriptionRenderer content={sub.notes} />
                  </div>
                )}
                {Array.isArray(sub.attachments) &&
                  sub.attachments.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9.5px] font-extrabold tracking-widest text-gray-500 uppercase">
                        Submitted Files
                      </p>
                      <AttachmentList files={sub.attachments} />
                    </div>
                  )}

                {/* Points earned — shown whenever the mentor has graded the submission */}
                {sub.points_earned != null && (
                  <div className="flex items-center gap-3.5 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] px-4.5 py-3.5 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 shadow-[0_2px_8px_rgba(245,158,11,0.05)] ring-1 ring-amber-500/20">
                      <Trophy
                        className="h-4.5 w-4.5 animate-bounce text-amber-400"
                        style={{ animationDuration: '3s' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-[9.5px] font-extrabold tracking-widest text-amber-500/80 uppercase">
                        Assessment Score
                      </p>
                      <p className="text-amber-350 mt-1 font-mono text-lg leading-none font-black">
                        {sub.points_earned}
                        {task.points != null && (
                          <span className="ml-1 text-[12px] font-bold text-amber-500/55">
                            / {task.points} max pts
                          </span>
                        )}
                      </p>
                    </div>
                    {task.points != null && sub.points_earned != null && (
                      <div className="shrink-0 rounded-xl border border-white/5 bg-white/2 px-3 py-1.5 text-right font-mono">
                        <p className="text-gray-550 text-[9px] font-extrabold tracking-widest uppercase">
                          Grade Pct
                        </p>
                        <p className="text-emerald-450 mt-0.5 text-[13px] font-black">
                          {Math.round((sub.points_earned / task.points) * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {sub.feedback && (
                  <div className="relative space-y-3 overflow-hidden rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] p-4.5 shadow-md">
                    <div className="bg-emerald-505 absolute top-0 bottom-0 left-0 w-0.5 opacity-40" />
                    {/* Header with mentor info */}
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-500/5 pb-2.5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-widest text-emerald-400 uppercase">
                        <Sparkles className="text-emerald-455 h-3.5 w-3.5 animate-pulse" />
                        Mentor Assessment Notes
                      </div>
                      {sub.reviewer && (
                        <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-950/20 px-2.5 py-1">
                          {sub.reviewer.avatar_url ? (
                            <img
                              src={sub.reviewer.avatar_url}
                              alt={sub.reviewer.full_name || 'Mentor'}
                              className="h-5 w-5 rounded-full object-cover ring-1 ring-emerald-500/30"
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                              {(sub.reviewer.full_name || 'M')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="max-w-[120px] truncate text-[10.5px] font-bold text-gray-300">
                            {sub.reviewer.full_name || 'Mentor'}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-350 text-[13px] leading-relaxed whitespace-pre-wrap">
                      {sub.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}

            {canSubmit && (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 border-t border-white/5 pt-4.5"
              >
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                    Your Solution / Explanatory Notes
                  </label>
                  <div className="bg-zinc-955/80 overflow-hidden rounded-xl border border-white/10 shadow-inner backdrop-blur-md transition-all focus-within:border-violet-500/35">
                    <MultiBlockEditor value={content} onChange={setContent} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                    Supporting Attachments
                  </label>
                  {attachments.length > 0 && (
                    <div className="mb-2 rounded-xl border border-white/5 bg-white/2 p-2.5">
                      <AttachmentList
                        files={attachments}
                        onRemove={(i) =>
                          setAttachments((prev) =>
                            prev.filter((_, j) => j !== i)
                          )
                        }
                      />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) =>
                      handleFiles(Array.from(e.target.files || []))
                    }
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-gray-350 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/2 px-4 py-4 text-[11.5px] font-bold transition-all duration-300 hover:border-violet-500/30 hover:bg-white/5 hover:text-white disabled:opacity-40"
                  >
                    {uploading ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-violet-400" />
                    ) : (
                      <Upload className="h-4.5 w-4.5 text-violet-400 transition-transform group-hover:-translate-y-0.5" />
                    )}
                    {uploading
                      ? 'Processing files…'
                      : 'Add Solution Files & Supporting Documents'}
                  </button>
                </div>
                {error && (
                  <p className="text-rose-455 text-[11.5px] font-semibold">
                    {error}
                  </p>
                )}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="from-violet-650 to-indigo-650 hover:from-violet-555 hover:to-indigo-555 flex items-center gap-2 rounded-xl bg-linear-to-r px-5.5 py-2.5 text-[12px] font-bold text-white shadow-md shadow-violet-600/10 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {loading
                      ? 'Submitting…'
                      : isRedo
                        ? 'Resubmit Solution'
                        : 'Submit Solution'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function TasksTab({ enrolledBootcamps, focusId }) {
  const [allTasks, setAllTasks] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [bootcampFilter, setBootcampFilter] = useState('all');

  useEffect(() => {
    if (!enrolledBootcamps.length) {
      setAllTasks([]);
      return;
    }
    Promise.all(
      enrolledBootcamps.map(({ bootcamp }) =>
        getMemberBootcampTasks(bootcamp.id)
          .then((tasks) =>
            tasks.map((t) => ({
              ...t,
              bootcampId: bootcamp.id,
              bootcampTitle: bootcamp.title,
            }))
          )
          .catch(() => [])
      )
    ).then((results) => {
      const flat = results.flat();
      flat.sort(
        (a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0)
      );
      setAllTasks(flat);
    });
  }, [enrolledBootcamps]);

  const handleSubmitted = (taskId, submissionData) => {
    setAllTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, mySubmission: submissionData } : t
      )
    );
  };

  const filtered = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter((t) => {
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
            ? !t.mySubmission
            : !!t.mySubmission;
      const matchBootcamp =
        bootcampFilter === 'all' || t.bootcampId === bootcampFilter;
      return matchStatus && matchBootcamp;
    });
  }, [allTasks, statusFilter, bootcampFilter]);

  const filteredTasksForStats = useMemo(() => {
    if (!allTasks) return [];
    return bootcampFilter === 'all'
      ? allTasks
      : allTasks.filter((t) => t.bootcampId === bootcampFilter);
  }, [allTasks, bootcampFilter]);

  if (allTasks === null)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="mb-3 h-7 w-7 animate-spin text-violet-500" />
        <span className="text-[13px] font-semibold">
          Loading assigned tasks…
        </span>
      </div>
    );

  if (enrolledBootcamps.length === 0)
    return (
      <div className="py-16 text-center text-[13px] text-gray-500">
        Enroll in a bootcamp to see tasks.
      </div>
    );

  const pendingCount = filteredTasksForStats.filter(
    (t) => !t.mySubmission
  ).length;
  const submittedCount = filteredTasksForStats.filter(
    (t) => t.mySubmission
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Tasks',
            value: filteredTasksForStats.length,
            color: 'text-white',
            icon: Layers,
            iconColor:
              'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]',
            bg: 'bg-zinc-950/25 border-white/5',
            glow: 'hover:shadow-[0_4px_24px_rgba(99,102,241,0.04)] hover:border-indigo-500/25',
          },
          {
            label: 'Not Submitted',
            value: pendingCount,
            color: 'text-rose-455',
            icon: AlertCircle,
            iconColor:
              'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]',
            bg: 'bg-zinc-950/25 border-white/5',
            glow: 'hover:shadow-[0_4px_24px_rgba(244,63,94,0.04)] hover:border-rose-500/25',
          },
          {
            label: 'Submitted',
            value: submittedCount,
            color: 'text-emerald-455',
            icon: CheckCircle2,
            iconColor:
              'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
            bg: 'bg-zinc-950/25 border-white/5',
            glow: 'hover:shadow-[0_4px_24px_rgba(16,185,129,0.04)] hover:border-emerald-500/25',
          },
        ].map(({ label, value, color, icon: Icon, iconColor, bg, glow }) => (
          <div
            key={label}
            className={cn(
              'relative flex items-center justify-between overflow-hidden rounded-2xl border p-5 shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5',
              bg,
              glow
            )}
          >
            <div className="space-y-1 text-left">
              <div className="text-gray-550 text-[10px] font-extrabold tracking-widest uppercase">
                {label}
              </div>
              <div
                className={cn(
                  'font-mono text-2xl leading-none font-black tracking-tight sm:text-3xl',
                  color
                )}
              >
                {value}
              </div>
            </div>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-350',
                iconColor
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Points analytics */}
      {(() => {
        const byBootcamp = {};
        for (const { bootcamp } of enrolledBootcamps) {
          if (bootcampFilter !== 'all' && bootcamp.id !== bootcampFilter)
            continue;
          byBootcamp[bootcamp.id] = {
            name: bootcamp.title.split(':')[0].trim(),
            earned: 0,
            max: 0,
          };
        }
        for (const t of filteredTasksForStats) {
          if (!byBootcamp[t.bootcampId]) continue;
          byBootcamp[t.bootcampId].max += t.points ?? 0;
          if (t.mySubmission?.points_earned != null)
            byBootcamp[t.bootcampId].earned += t.mySubmission.points_earned;
        }
        const chartData = Object.values(byBootcamp).filter(
          (d) => d.max > 0 || d.earned > 0
        );
        const totalEarned = filteredTasksForStats.reduce(
          (s, t) => s + (t.mySubmission?.points_earned ?? 0),
          0
        );
        const totalMax = filteredTasksForStats.reduce(
          (s, t) => s + (t.points ?? 0),
          0
        );
        return (
          <PointsStatsPanel
            chartData={chartData}
            totalEarned={totalEarned}
            totalMax={totalMax}
            label="Task Points"
          />
        );
      })()}

      {/* Glassy Filter Panel */}
      <div className="space-y-4.5 rounded-2xl border border-white/5 bg-zinc-950/25 p-4.5 backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="text-left">
            <h3 className="text-sm font-bold tracking-wider text-white uppercase">
              Assigned Task Ledger
            </h3>
            <p className="mt-0.5 text-[11.5px] text-gray-500">
              Solve, submit, and review grades for your tasks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-550 text-[11px] font-extrabold tracking-widest uppercase">
              Status
            </span>
            <div className="flex w-fit gap-1.5 rounded-xl border border-white/5 bg-white/2 p-1">
              {[
                { v: 'all', l: 'All', c: filteredTasksForStats.length },
                { v: 'pending', l: 'Pending', c: pendingCount },
                { v: 'submitted', l: 'Submitted', c: submittedCount },
              ].map((pill) => (
                <button
                  key={pill.v}
                  onClick={() => setStatusFilter(pill.v)}
                  className={cn(
                    'relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all duration-300',
                    statusFilter === pill.v
                      ? 'from-violet-650 to-indigo-650 shadow-violet-650/20 bg-linear-to-r text-white shadow-md'
                      : 'border border-transparent bg-transparent text-gray-400 hover:text-white'
                  )}
                >
                  {pill.l}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 font-mono text-[9px] font-black',
                      statusFilter === pill.v
                        ? 'bg-white/20 text-white'
                        : 'text-gray-550 bg-white/5'
                    )}
                  >
                    {pill.c}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bootcamp filters */}
        {enrolledBootcamps.length > 1 && (
          <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
            <button
              onClick={() => setBootcampFilter('all')}
              className={cn(
                'rounded-full border px-4 py-1.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300',
                bootcampFilter === 'all'
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/5'
                  : 'border-white/10 bg-white/2 text-gray-400 hover:border-white/20 hover:text-white'
              )}
            >
              All Bootcamps
            </button>
            {enrolledBootcamps.map(({ bootcamp }) => (
              <button
                key={bootcamp.id}
                onClick={() => setBootcampFilter(bootcamp.id)}
                className={cn(
                  'max-w-[220px] truncate rounded-full border px-4 py-1.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300',
                  bootcampFilter === bootcamp.id
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/5'
                    : 'border-white/10 bg-white/2 text-gray-400 hover:border-white/20 hover:text-white'
                )}
              >
                {bootcamp.title.split(':')[0].trim()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-14 text-center">
          <EmptyState
            icon={ClipboardList}
            title="No tasks found"
            description="Try selecting a different filter or adjusting your parameters."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSubmitted={handleSubmitted}
              focusId={focusId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Points Stats Panel (shared by Tasks + Sessions) ─────────────────────────


export { TasksTab };
