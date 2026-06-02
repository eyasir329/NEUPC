/**
 * @file Right-side slide-over panel for a single goal. One component serves
 *   three modes:
 *     • create — a draft buffered locally and committed via onCreateTask.
 *     • edit   — an existing editable todo; every field change is persisted
 *                immediately through onUpdateTask.
 *     • read-only — feed items (contests/events/deadlines/sessions), shown
 *                with a category banner and a portal link; no editing.
 *   Shared controls cover the title/description, a 7-day date strip with
 *   multi-day & recurrence support, start/end time, priority, project &
 *   section, labels, subtasks, and a comment timeline.
 *
 * @module daily-activity/TaskDetailPane
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Trash2, Archive, Calendar, Flag, CheckSquare, Plus, MessageSquare,
  Send, GitPullRequest, RefreshCw, Paperclip, Sparkles, Flame, ShieldAlert,
  HelpCircle, Tag, Clock,
} from 'lucide-react';
import {
  Priority, generateId, getFeedItemUrl, getTodayDateString, formatDateString,
  addDays, isFeedItem,
} from './utils';

export default function TaskDetailPane({
  task,
  mode = 'edit',
  initialTitle = '',
  defaultProjectId,
  onClose,
  projects,
  sections,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
}) {
  const isCreate = mode === 'create';

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [multiDayActive, setMultiDayActive] = useState(false);
  const [prevRecFreq, setPrevRecFreq] = useState(null);

  // Draft state backs "create" mode; edit mode reads/writes the live task.
  const [draft, setDraft] = useState(() => ({
    title: initialTitle,
    description: '',
    priority: Priority.P3,
    dueDate: getTodayDateString(),
    projectId: defaultProjectId || projects[0]?.id || '',
    sectionId: '',
    recurrence: 'none',
    labels: [],
    subtasks: [],
    comments: [],
  }));

  if (!task && !isCreate) return null;

  const values = isCreate ? draft : task;

  // React state synchronization pattern (effect-like render-phase update)
  if (values && values.recurrence?.freq !== prevRecFreq) {
    setPrevRecFreq(values.recurrence?.freq);
    setMultiDayActive(values.recurrence?.freq === 'custom_dates' || (Array.isArray(values.recurrence?.dates) && values.recurrence.dates.length > 1));
  }

  // Read-only feed items (contests, events, sessions, deadlines) — view only.
  const isReadOnly = !isCreate && isFeedItem(task);

  if (isReadOnly) {
    const totalSubs = task.subtasks?.length || 0;
    const completedSubs = task.subtasks?.filter((s) => s.completed).length || 0;
    const progressPercent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

    let themeColor = '#d97706'; // default Contest Amber
    let categoryLabel = '🏆 CONTEST';
    let bgGradient = 'from-amber-500/[0.08] to-yellow-500/[0.02] border-amber-500/20';

    if (task.feedCategory === 'event') {
      themeColor = '#10b981'; // Emerald
      categoryLabel = '📣 EVENT';
      bgGradient = 'from-emerald-500/[0.08] to-teal-500/[0.02] border-emerald-500/20';
    } else if (task.feedCategory === 'task') {
      themeColor = '#6366f1'; // Indigo
      categoryLabel = '📅 DEADLINE';
      bgGradient = 'from-violet-500/[0.08] to-purple-500/[0.02] border-violet-500/20';
    } else if (task.feedCategory === 'session') {
      themeColor = '#0ea5e9'; // Sky
      categoryLabel = '🎓 SESSION';
      bgGradient = 'from-sky-500/[0.08] to-blue-500/[0.02] border-sky-500/20';
    }

    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%', transition: { duration: 0.2 } }}
        className="w-full md:w-[480px] bg-gray-900 border-l border-white/[0.08] h-full flex flex-col shadow-2xl z-40 fixed right-0 top-0 select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: themeColor }} />
            <span className="text-[10px] font-black font-mono tracking-widest text-gray-400 uppercase">{categoryLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            {getFeedItemUrl(task) && (
              <a
                href={getFeedItemUrl(task)}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 text-[9px] font-black font-mono tracking-wider bg-violet-600 hover:bg-violet-500 text-white rounded-lg flex items-center gap-1 transition"
              >
                <span>VISIT PORTAL</span>
              </a>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-lg text-gray-400 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header Banner */}
          <div className={`p-4 rounded-2xl border bg-gradient-to-br ${bgGradient}`}>
            <h2 className="text-sm font-extrabold text-white break-words leading-snug select-text">{task.title}</h2>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Details / Instructions</label>
            <div className="text-xs text-gray-300 bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-xl leading-relaxed select-text whitespace-pre-wrap">
              {task.description || <span className="italic text-gray-500">No additional description or timeline details specified.</span>}
            </div>
          </div>

          {/* Properties Grid */}
          <div className="bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.06] grid grid-cols-2 gap-4 text-[11px]">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Scheduled Date</span>
              <div className="flex items-center gap-1.5 text-gray-300 font-bold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{task.dueDate ? new Date(task.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Continuous'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Assigned Priority</span>
              <div className="flex items-center gap-1.5 text-gray-300 font-bold">
                <Flag className={`w-3.5 h-3.5 ${task.priority === Priority.P1 ? 'text-red-500 fill-current' : task.priority === Priority.P2 ? 'text-amber-500 fill-current' : task.priority === Priority.P3 ? 'text-blue-500 fill-current' : 'text-slate-400'}`} />
                <span>{task.priority === Priority.P1 ? 'Critical (P1)' : task.priority === Priority.P2 ? 'High (P2)' : task.priority === Priority.P3 ? 'Medium (P3)' : 'Low (P4)'}</span>
              </div>
            </div>

            {task.bootcampTitle && (
              <div className="flex flex-col gap-1 col-span-2 border-t border-white/[0.06] pt-2.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Associated Bootcamp/Track</span>
                <span className="text-violet-300 font-extrabold">{task.bootcampTitle}</span>
              </div>
            )}

            {task.time && (
              <div className="flex flex-col gap-1 col-span-2 border-t border-white/[0.06] pt-2.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Start Time</span>
                <span className="text-gray-300 font-bold">🕒 {task.time}</span>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.06] space-y-2 text-[11px] w-full">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Reference Resources ({task.attachments.length})
              </span>
              <div className="space-y-1.5 mt-2">
                {task.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-900 border border-white/[0.04]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-bold text-gray-300">{att.name}</span>
                      <span className="text-[9px] text-slate-500 shrink-0 font-mono">({att.size})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks Section */}
          {totalSubs > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-[9px] text-slate-500 uppercase tracking-wider">Progress Subgoals ({completedSubs}/{totalSubs})</span>
                <span className="text-[10px] font-mono text-violet-400 font-bold">{progressPercent}% complete</span>
              </div>

              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="space-y-1">
                {task.subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <input type="checkbox" checked={s.completed} disabled className="rounded text-violet-500 border-white/20 h-3.5 w-3.5 opacity-60 cursor-not-allowed" />
                    <span className={`text-xs text-gray-300 truncate font-semibold ${s.completed ? 'line-through text-slate-500 font-medium' : ''}`}>{s.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Static Log / Comments Section */}
          {task.comments && task.comments.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <span className="font-black text-[9px] text-slate-500 uppercase tracking-wider block">Activity Logs / System Notes ({task.comments.length})</span>
              <div className="space-y-2.5">
                {task.comments.map((c) => (
                  <div key={c.id} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.06] flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-black text-gray-400">{c.authorName}</span>
                      <span className="text-gray-500 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-300 break-words leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // --- Shared editable model (create draft OR live task) ---

  // Apply a field patch: buffered locally in create mode, persisted in edit mode.
  const patch = (changes) => {
    if (isCreate) setDraft((d) => ({ ...d, ...changes }));
    else onUpdateTask(task.id, changes);
  };

  const activeProject = projects.find((p) => p.id === values.projectId) || projects[0];
  const activeSections = sections.filter((s) => s.projectId === values.projectId);
  const activeSection = sections.find((s) => s.id === values.sectionId);

  const addTag = (raw) => {
    const clean = raw.trim().replace(/^[@#]/, '');
    if (!clean) return;
    if (!values.labels.some((l) => l.toLowerCase() === clean.toLowerCase())) {
      patch({ labels: [...values.labels, clean] });
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    }
  };

  const handleSpawn = () => {
    if (!draft.title.trim()) return;
    onCreateTask({
      title: draft.title.trim(),
      description: draft.description.trim(),
      priority: draft.priority,
      dueDate: draft.dueDate || undefined,
      projectId: draft.projectId || projects[0]?.id || undefined,
      sectionId: draft.sectionId || undefined,
      recurrence: draft.recurrence === 'none' ? undefined : draft.recurrence,
      labels: draft.labels,
    });
    onClose();
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub = { id: generateId(), title: newSubtaskTitle.trim(), completed: false, priority: Priority.P4 };
    patch({ subtasks: [...values.subtasks, newSub] });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subId) => {
    patch({ subtasks: values.subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s)) });
  };

  const handleDeleteSubtask = (subId) => {
    patch({ subtasks: values.subtasks.filter((s) => s.id !== subId) });
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: generateId(),
      authorName: 'You (eyaSIR329)',
      authorEmail: 'eyaSIR329@gmail.com',
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    patch({ comments: [...values.comments, newComment] });
    setNewCommentText('');
  };

  const handleDeleteComment = (commentId) => {
    patch({ comments: values.comments.filter((c) => c.id !== commentId) });
  };

  const totalSubs = values.subtasks.length;
  const completedSubs = values.subtasks.filter((s) => s.completed).length;
  const progressPercent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

  const priorityCards = [
    { level: Priority.P1, text: 'CRITICAL (P1)', icon: Flame, color: 'border-rose-500/20 text-rose-400 bg-rose-500/5', activeColor: 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-black border-rose-500 shadow-[0_4px_18px_rgba(244,63,94,0.35)] scale-[1.03]' },
    { level: Priority.P2, text: 'MEDIUM (P2)', icon: ShieldAlert, color: 'border-amber-500/20 text-amber-400 bg-amber-500/5', activeColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black border-amber-400 shadow-[0_4px_18px_rgba(245,158,11,0.35)] scale-[1.03]' },
    { level: Priority.P3, text: 'GENERAL (P3)', icon: HelpCircle, color: 'border-violet-500/20 text-violet-400 bg-violet-500/5', activeColor: 'bg-gradient-to-r from-violet-600 to-violet-600 text-white font-black border-violet-500 shadow-[0_4px_18px_rgba(99,102,241,0.35)] scale-[1.03]' },
  ];

  const datePresets = [
    { label: 'TODAY', value: getTodayDateString() },
    { label: 'TOMORROW', value: formatDateString(addDays(new Date(), 1)) },
    { label: 'NEXT WEEK', value: formatDateString(addDays(new Date(), 7)) },
  ];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%', transition: { duration: 0.2 } }}
      className="w-full md:w-[480px] bg-gray-900 border-l border-white/[0.08] h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] z-40 fixed right-0 top-0 select-none transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-950/40 to-violet-950/10 border-b border-white/[0.06] backdrop-blur-md">
        {isCreate ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 bg-gradient-to-br from-violet-500/10 to-violet-500/10 text-violet-400 rounded-lg border border-violet-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-violet-400 to-purple-400 uppercase">Spawn New Goal</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeProject?.color }} />
            <span className="text-xs font-bold truncate text-gray-300 font-mono uppercase tracking-wider">{activeProject?.name} {activeSection ? `/ ${activeSection.name}` : ''}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          {!isCreate && (
            <>
              <button
                onClick={() => { onUpdateTask(task.id, { isArchived: !task.isArchived }); onClose(); }}
                title={task.isArchived ? 'Unarchive task' : 'Archive task'}
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-violet-400 transition cursor-pointer"
              >
                <Archive className="w-4 h-4" />
              </button>

              <button
                onClick={() => { if (confirm('Are you sure you want to delete this task?')) { onDeleteTask(task.id); onClose(); } }}
                title="Delete task"
                className="p-1.5 hover:bg-white/5 rounded-lg text-red-400/80 hover:text-red-400 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-6 bg-white/[0.06] mx-1" />
            </>
          )}

          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Title + Description */}
        <div className="space-y-4">
          <textarea
            value={values.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder={isCreate ? 'What needs to be done?' : 'Step Title'}
            rows={2}
            className="w-full text-lg font-black text-white bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] focus:border-violet-500/80 focus:bg-white/[0.03] p-3.5 rounded-2xl outline-none transition-all duration-300 resize-none break-words tracking-tight placeholder:text-gray-600"
          />

          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-black block">Task Details / Resources</label>
            <textarea
              value={values.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Add more details, links, or specific instructions..."
              rows={4}
              className="w-full text-xs text-gray-300 bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.1] focus:border-violet-500/80 focus:bg-slate-950/60 p-3.5 rounded-2xl outline-none transition-all duration-300 resize-none break-words leading-relaxed placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* === Shared controls (identical in create + edit) === */}
        <div className="space-y-5">
            {/*
              Date + recurrence block. Two scheduling modes share one UI:
                - single day: `dueDate` holds the one date; `recurrence` stays
                  'none' (or a freq object whose `dates` mirror `dueDate`).
                - multi-day (`multiDayActive`): the date strip toggles a set of
                  dates held in `recurrence.dates`; with no chosen freq this is
                  stored as `{ freq: 'custom_dates', dates }`, otherwise the
                  chosen freq (daily/weekly/monthly) is kept and `dates` seeds
                  the recurrence start. `dueDate` always tracks `dates[0]` so
                  list grouping and the calendar agree on a primary day.
            */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Scheduled Date Planning Block</label>
                <button
                  type="button"
                  onClick={() => {
                    const active = !multiDayActive;
                    setMultiDayActive(active);
                    if (active) {
                      const currentDates = Array.isArray(values.recurrence?.dates) ? values.recurrence.dates : (values.dueDate ? [values.dueDate] : []);
                      const currentFreq = values.recurrence?.freq && values.recurrence.freq !== 'custom_dates' ? values.recurrence.freq : 'none';
                      const nextFreq = currentFreq === 'none' ? 'custom_dates' : currentFreq;
                      patch({ recurrence: { freq: nextFreq, dates: currentDates }, dueDate: currentDates[0] || null });
                    } else {
                      const firstDate = values.recurrence?.dates?.[0] || values.dueDate || getTodayDateString();
                      const currentFreq = values.recurrence?.freq && values.recurrence.freq !== 'custom_dates' ? values.recurrence.freq : 'none';
                      patch({
                        dueDate: firstDate,
                        recurrence: currentFreq === 'none' ? 'none' : { freq: currentFreq, dates: [firstDate] }
                      });
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-[8.5px] font-mono font-black uppercase border transition duration-300 ${
                    multiDayActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {multiDayActive ? '✓ Multiple Days Active' : 'Select Multiple Days'}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = addDays(new Date(), i);
                  const dStr = formatDateString(d);
                  const isSelected = multiDayActive
                    ? (Array.isArray(values.recurrence?.dates) && values.recurrence.dates.includes(dStr))
                    : (dStr === values.dueDate);
                  const isToday = dStr === getTodayDateString();
                  return (
                    <button
                      key={`date-strip-${i}`}
                      type="button"
                      onClick={() => {
                        if (multiDayActive) {
                          const currentDates = Array.isArray(values.recurrence?.dates) ? [...values.recurrence.dates] : (values.dueDate ? [values.dueDate] : []);
                          let nextDates;
                          if (currentDates.includes(dStr)) {
                            nextDates = currentDates.filter(x => x !== dStr);
                          } else {
                            nextDates = [...currentDates, dStr].sort();
                          }
                          const currentFreq = values.recurrence?.freq && values.recurrence.freq !== 'custom_dates' ? values.recurrence.freq : 'none';
                          const nextFreq = currentFreq === 'none' ? (nextDates.length > 1 ? 'custom_dates' : 'none') : currentFreq;
                          patch({
                            recurrence: nextFreq === 'none' ? 'none' : { freq: nextFreq, dates: nextDates },
                            dueDate: nextDates[0] || null
                          });
                        } else {
                          const currentFreq = values.recurrence?.freq && values.recurrence.freq !== 'custom_dates' ? values.recurrence.freq : 'none';
                          patch({
                            dueDate: dStr,
                            recurrence: currentFreq === 'none' ? 'none' : { freq: currentFreq, dates: [dStr] }
                          });
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-300 relative ${
                        isSelected
                          ? 'bg-gradient-to-br from-violet-600 via-violet-500 to-violet-600 border-violet-400 text-white font-extrabold shadow-[0_8px_25px_rgba(99,102,241,0.35)] scale-[1.04]'
                          : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-slate-300 hover:bg-white/[0.06] hover:border-white/10 hover:scale-[1.02]'
                      }`}
                    >
                      <span className="text-[8px] font-mono font-black tracking-wider uppercase block leading-none">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className={`text-[11px] font-mono font-black mt-1.5 block leading-none ${isToday && !isSelected ? 'text-violet-400' : ''}`}>{d.getDate()}</span>
                      {isToday && <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-violet-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]'}`} />}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex gap-2">
                  {datePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (multiDayActive) {
                          const currentDates = Array.isArray(values.recurrence?.dates) ? [...values.recurrence.dates] : (values.dueDate ? [values.dueDate] : []);
                          let nextDates;
                          if (currentDates.includes(preset.value)) {
                            nextDates = currentDates.filter(x => x !== preset.value);
                          } else {
                            nextDates = [...currentDates, preset.value].sort();
                          }
                          const currentFreq = values.recurrence?.freq && values.recurrence.freq !== 'custom_dates' ? values.recurrence.freq : 'none';
                          const nextFreq = currentFreq === 'none' ? (nextDates.length > 1 ? 'custom_dates' : 'none') : currentFreq;
                          patch({
                            recurrence: nextFreq === 'none' ? 'none' : { freq: nextFreq, dates: nextDates },
                            dueDate: nextDates[0] || null
                          });
                        } else {
                          const currentFreq = values.recurrence?.freq && values.recurrence.freq !== 'custom_dates' ? values.recurrence.freq : 'none';
                          patch({
                            dueDate: preset.value,
                            recurrence: currentFreq === 'none' ? 'none' : { freq: currentFreq, dates: [preset.value] }
                          });
                        }
                      }}
                      className={`px-3 py-1.5 text-[8.5px] font-black font-mono border rounded-xl transition-all duration-300 ${
                        (!multiDayActive && values.dueDate === preset.value) || (multiDayActive && Array.isArray(values.recurrence?.dates) && values.recurrence.dates.includes(preset.value))
                          ? 'bg-violet-500/20 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] scale-[1.02]'
                          : 'bg-white/[0.01] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 border border-white/[0.06] rounded-xl focus-within:border-violet-500/60 transition duration-150">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                  <input
                    type="date"
                    value={values.dueDate || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        if (multiDayActive) {
                          const currentDates = Array.isArray(values.recurrence?.dates) ? [...values.recurrence.dates] : [];
                          if (!currentDates.includes(e.target.value)) {
                            const nextDates = [...currentDates, e.target.value].sort();
                            const currentFreq = values.recurrence?.freq && values.recurrence.freq !== 'custom_dates' ? values.recurrence.freq : 'none';
                            const nextFreq = currentFreq === 'none' ? 'custom_dates' : currentFreq;
                            patch({
                              recurrence: { freq: nextFreq, dates: nextDates },
                              dueDate: nextDates[0] || null
                            });
                          }
                        } else {
                          const currentFreq = values.recurrence?.freq && values.recurrence.freq !== 'custom_dates' ? values.recurrence.freq : 'none';
                          patch({
                            dueDate: e.target.value,
                            recurrence: currentFreq === 'none' ? 'none' : { freq: currentFreq, dates: [e.target.value] }
                          });
                        }
                      }
                    }}
                    className="bg-transparent border-none outline-none focus:ring-0 text-[10px] text-white p-0.5 w-[110px] text-right font-mono [color-scheme:dark] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Scheduled Time Period Block */}
            <div className="space-y-2">
              <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Scheduled Time Period Block</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2.5 border border-white/[0.06] rounded-2xl focus-within:border-violet-500/80 transition-all duration-200 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col items-start leading-none">
                    <span className="text-[7.5px] font-mono text-gray-500 font-bold uppercase tracking-wider mb-0.5">Start Time</span>
                    <input
                      type="time"
                      value={(() => {
                        const timeStr = values.time || '';
                        const [startTime = ''] = timeStr.includes(' - ') ? timeStr.split(' - ') : [timeStr];
                        return startTime;
                      })()}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        const timeStr = values.time || '';
                        const [, endTime = ''] = timeStr.includes(' - ') ? timeStr.split(' - ') : ['', ''];
                        if (!newStart) {
                          patch({ time: null });
                        } else if (!endTime) {
                          patch({ time: newStart });
                        } else {
                          patch({ time: `${newStart} - ${endTime}` });
                        }
                      }}
                      className="bg-transparent border-none outline-none focus:ring-0 text-[11px] text-white p-0 w-full font-mono [color-scheme:dark] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2.5 border border-white/[0.06] rounded-2xl focus-within:border-violet-500/80 transition-all duration-200 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col items-start leading-none">
                    <span className="text-[7.5px] font-mono text-gray-500 font-bold uppercase tracking-wider mb-0.5">End Time</span>
                    <input
                      type="time"
                      value={(() => {
                        const timeStr = values.time || '';
                        const [, endTime = ''] = timeStr.includes(' - ') ? timeStr.split(' - ') : ['', ''];
                        return endTime;
                      })()}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        const timeStr = values.time || '';
                        const [startTime = ''] = timeStr.includes(' - ') ? timeStr.split(' - ') : [timeStr];
                        if (!startTime) {
                          if (newEnd) patch({ time: `12:00 - ${newEnd}` });
                        } else if (!newEnd) {
                          patch({ time: startTime });
                        } else {
                          patch({ time: `${startTime} - ${newEnd}` });
                        }
                      }}
                      className="bg-transparent border-none outline-none focus:ring-0 text-[11px] text-white p-0 w-full font-mono [color-scheme:dark] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Preset Durations */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider font-bold">Durations:</span>
                {[
                  { label: '30m', mins: 30 },
                  { label: '1h', mins: 60 },
                  { label: '2h', mins: 120 },
                  { label: '4h', mins: 240 },
                ].map((item) => (
                  <button
                    key={`time-dur-${item.label}`}
                    type="button"
                    onClick={() => {
                      const timeStr = values.time || '';
                      const [startTime = '12:00'] = timeStr.includes(' - ') ? timeStr.split(' - ') : [timeStr || '12:00'];
                      const [h, m] = startTime.split(':').map(Number);
                      const d = new Date();
                      d.setHours(h, m + item.mins, 0, 0);
                      const resH = String(d.getHours()).padStart(2, '0');
                      const resM = String(d.getMinutes()).padStart(2, '0');
                      const newEndTime = `${resH}:${resM}`;
                      patch({ time: `${startTime} - ${newEndTime}` });
                    }}
                    className="px-2 py-0.5 bg-white/[0.02] border border-white/[0.04] rounded text-[8px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition duration-200 cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
                {values.time && (
                  <button
                    type="button"
                    onClick={() => patch({ time: null })}
                    className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[8px] font-mono text-rose-400 hover:text-white hover:bg-rose-500 transition duration-200 ml-auto cursor-pointer"
                  >
                    Clear Time
                  </button>
                )}
              </div>
            </div>

            {/* Priority cards */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Priority Classification</label>
              <div className="grid grid-cols-3 gap-2">
                {priorityCards.map((p) => {
                  const IconComponent = p.icon;
                  const isActive = values.priority === p.level;
                  return (
                    <button
                      key={p.level}
                      type="button"
                      onClick={() => patch({ priority: p.level })}
                      className={`py-2.5 px-2 text-[9px] font-black font-mono rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-300 ${
                        isActive ? p.activeColor : `${p.color} hover:bg-white/[0.04] hover:scale-[1.01]`
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
                      <span>{p.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project chips */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Associated Space List Category</label>
              <div className="flex flex-wrap gap-2 max-h-[85px] overflow-y-auto p-2 bg-slate-950/40 rounded-2xl border border-white/[0.06]">
                {projects.map((p) => {
                  const isSelected = values.projectId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => patch({ projectId: p.id, sectionId: undefined })}
                      className={`px-3 py-1.5 text-[9.5px] font-bold rounded-xl border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600/20 border-violet-500 text-white font-extrabold shadow-md shadow-violet-600/10'
                          : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section + Recurrence */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Project Section</label>
                <div className="flex items-center gap-1.5 bg-slate-950/40 p-2.5 border border-white/[0.06] rounded-2xl focus-within:border-violet-500/80 transition-all duration-200 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  <GitPullRequest className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={values.sectionId || ''}
                    onChange={(e) => patch({ sectionId: e.target.value || undefined })}
                    disabled={activeSections.length === 0}
                    className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 text-gray-300 w-full font-medium disabled:opacity-40"
                  >
                    <option value="" className="bg-slate-950 text-slate-300">(None)</option>
                    {activeSections.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-950 text-slate-200">{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Recurrence Block</label>
                <div className="flex items-center gap-1.5 bg-slate-950/40 p-2.5 border border-white/[0.06] rounded-2xl focus-within:border-violet-500/80 transition-all duration-200 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={values.recurrence?.freq || (typeof values.recurrence === 'string' ? values.recurrence : 'none')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const currentDates = Array.isArray(values.recurrence?.dates) 
                        ? values.recurrence.dates 
                        : (values.dueDate ? [values.dueDate] : []);

                      if (val === 'none') {
                        if (currentDates.length > 1) {
                          patch({ recurrence: { freq: 'custom_dates', dates: currentDates }, dueDate: currentDates[0] || null });
                        } else {
                          patch({ recurrence: 'none', dueDate: currentDates[0] || null });
                        }
                      } else {
                        patch({
                          recurrence: { freq: val, dates: currentDates, interval: 1 },
                          dueDate: currentDates[0] || null
                        });
                      }
                    }}
                    className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 text-gray-300 w-full font-medium"
                  >
                    <option value="none" className="bg-slate-950 text-slate-300">No Recurrence</option>
                    <option value="daily" className="bg-slate-950 text-slate-200">Daily</option>
                    <option value="weekly" className="bg-slate-950 text-slate-200">Weekly</option>
                    <option value="monthly" className="bg-slate-950 text-slate-200">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom tags + suggestions */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Custom Tags</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type a tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="w-full pl-9 pr-3 py-3 bg-slate-950/40 border border-white/[0.06] rounded-2xl focus:outline-none focus:border-violet-500/80 text-white font-mono text-xs placeholder:text-slate-600 transition-all duration-200 focus:shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                />
                <Tag className="w-3.5 h-3.5 absolute left-3 top-3.5 text-slate-500" />
              </div>
              {values.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {values.labels.map((lbl) => (
                    <span key={`tag-${lbl}`} className="px-2.5 py-1 bg-violet-600/15 border border-violet-500/40 text-violet-300 text-[10.5px] font-semibold rounded-lg flex items-center gap-1.5">
                      #{lbl}
                      <button type="button" onClick={() => patch({ labels: values.labels.filter((l) => l !== lbl) })} className="hover:text-white cursor-pointer">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider font-bold">Suggestions:</span>
                {['Study', 'Practice', 'Contest', 'Refactor', 'Urgent'].map((item) => (
                  <button
                    key={`tag-preset-${item}`}
                    type="button"
                    onClick={() => addTag(item)}
                    className="px-2 py-0.5 bg-slate-950/40 border border-white/[0.04] rounded text-[8px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition duration-200"
                  >
                    +{item}
                  </button>
                ))}
              </div>
            </div>
          </div>

        {/* Subtasks — both modes */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-gray-400" />
              <span className="font-bold text-xs text-gray-300 uppercase tracking-wider">Subtasks ({completedSubs}/{totalSubs})</span>
            </div>
            {totalSubs > 0 && <span className="text-[11px] font-mono text-slate-400 font-black">{progressPercent}% done</span>}
          </div>

          {totalSubs > 0 && (
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-violet-500 to-violet-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          )}

          <div className="space-y-2">
            {values.subtasks.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-white/[0.01] to-transparent border border-white/[0.03] hover:from-white/[0.03] transition-all duration-200 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <input type="checkbox" checked={s.completed} onChange={() => handleToggleSubtask(s.id)} className="rounded text-violet-500 border-white/20 bg-slate-950 focus:ring-violet-500 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer" />
                  <span className={`text-xs text-gray-300 truncate font-semibold ${s.completed ? 'line-through text-slate-500 font-medium' : ''}`}>{s.title}</span>
                </div>
                <button type="button" onClick={() => handleDeleteSubtask(s.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-md text-slate-400 hover:text-red-500 transition cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="Add subtask goal..." className="flex-1 text-xs px-3.5 py-2 bg-slate-950/60 border border-white/[0.06] rounded-xl focus:outline-none focus:border-violet-500 focus:bg-slate-950 text-white transition-all duration-200" />
            <button type="submit" disabled={!newSubtaskTitle.trim()} className="px-3.5 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] disabled:opacity-40 rounded-xl cursor-pointer transition text-gray-200 flex items-center">
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Comments / Timeline */}
        <div className="space-y-4">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="font-bold text-xs text-gray-300 uppercase tracking-wider">Timeline / Comments ({values.comments.length})</span>
            </div>

            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
              <textarea value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="Type activity message log or note..." rows={2} className="w-full text-xs p-3 bg-slate-950/60 border border-white/[0.06] rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-slate-950 text-white resize-none transition-all duration-200 leading-relaxed placeholder:text-gray-600" />
              <button type="submit" disabled={!newCommentText.trim()} className="self-end px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-500 hover:brightness-110 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-[0_4px_15px_rgba(99,102,241,0.2)] disabled:opacity-40 cursor-pointer transition active:scale-[0.98]">
                <span>Comment</span>
                <Send className="w-3 h-3" />
              </button>
            </form>

            <div className="space-y-3 pt-2">
              {values.comments.map((c) => {
                const initials = c.authorName ? c.authorName.charAt(0).toUpperCase() : 'Y';
                return (
                  <div key={c.id} className="flex gap-3 p-3.5 bg-gradient-to-br from-violet-500/[0.02] to-violet-500/[0.01] rounded-2xl border border-white/[0.04] relative group/comment">
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="font-extrabold text-gray-200">{c.authorName}</span>
                        <div className="flex items-center gap-1.5 text-gray-500 font-mono">
                          <span>{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <button type="button" onClick={() => handleDeleteComment(c.id)} className="opacity-0 group-hover/comment:opacity-100 hover:text-red-500 p-0.5 transition rounded" title="Delete comment">
                            <X className="w-2.5 h-2.5 cursor-pointer" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11.5px] text-gray-300 break-words leading-relaxed select-text font-medium">{c.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      </div>

      {/* Footer actions — create mode only */}
      {isCreate && (
        <div className="px-5 py-4 border-t border-white/[0.06] bg-gray-900 backdrop-blur-md flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-2.5 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:text-white text-slate-400 transition-all duration-300 rounded-xl text-[10px] font-black font-mono uppercase tracking-widest cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSpawn}
            disabled={!draft.title.trim()}
            className="px-5.5 py-2.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:hover:brightness-100 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.25)] text-[10px] uppercase font-black font-mono tracking-widest flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Spawn Goal
          </button>
        </div>
      )}
    </motion.div>
  );
}
