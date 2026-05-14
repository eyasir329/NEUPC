'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActivityViz } from './ActivityViz';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  House,
  Settings,
  Trash2,
  Pencil,
  Calendar as CalendarIcon,
  PlaySquare,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Code,
  GraduationCap,
  MessageSquare,
  Filter,
  Flag,
  Clock,
  Sparkles,
  CircleDot,
  CheckCircle2,
  Circle,
  X,
  Repeat,
  Folder,
  FolderPlus,
  ChevronDown,
  Check,
  Edit2
} from 'lucide-react';
import {
    GlassCard,
    SectionHeader,
    Pill,
    ActionButton,
    EmptyState,
  } from '../../_components/_ui';

// ───────────────────────── Constants ─────────────────────────
const STORAGE_KEY = 'neupc.member.daily-activity.v1';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function offsetDate(days, hour = 0, minute = 0) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// dateKey = YYYY-MM-DD (local)
function dateKey(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

function sameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDayLong(d) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CATEGORIES = {
  todo: {
    label: 'To-do',
    icon: CheckSquare,
    tone: 'blue',
    dot: 'bg-blue-400',
    chip: 'border-white/[0.06] bg-white/[0.01] text-white',
  },
  contest: {
    label: 'Contests',
    icon: Trophy,
    tone: 'amber',
    dot: 'bg-amber-400',
    chip: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  event: {
    label: 'Events',
    icon: CalendarIcon,
    tone: 'violet',
    dot: 'bg-violet-400',
    chip: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  },
  bootcamp: {
    label: 'Bootcamps',
    icon: GraduationCap,
    tone: 'emerald',
    dot: 'bg-emerald-400',
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  problem: {
    label: 'Problem Solving',
    icon: Code,
    tone: 'cyan',
    dot: 'bg-cyan-400',
    chip: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  },
  discussion: {
    label: 'Discussions',
    icon: MessageSquare,
    tone: 'pink',
    dot: 'bg-pink-400',
    chip: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
  },
  video: {
    label: 'Watch Time',
    icon: PlaySquare,
    tone: 'rose',
    dot: 'bg-rose-400',
    chip: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  },
  module: {
    label: 'Module Complete',
    icon: BookOpenCheck,
    tone: 'indigo',
    dot: 'bg-indigo-400',
    chip: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  },
};

const PRIORITY_DOT = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-white/[0.01]',
};

// ───────────────────────── Seed data ─────────────────────────
const SEED_FEED = [
  {
    id: 'f1',
    category: 'contest',
    title: 'Codeforces Round #960 (Div. 2)',
    location: 'Online · codeforces.com',
    start: offsetDate(1, 14, 35),
    durationMin: 120,
  },
  {
    id: 'f2',
    category: 'contest',
    title: 'AtCoder Beginner Contest 350',
    location: 'Online · atcoder.jp',
    start: offsetDate(2, 12, 0),
    durationMin: 100,
  },
  {
    id: 'f3',
    category: 'event',
    title: 'Google I/O Extended',
    location: 'Tech Hub',
    start: offsetDate(4, 18, 0),
    durationMin: 180,
  },
  {
    id: 'f4',
    category: 'meeting',
    title: 'Mentor 1:1',
    location: 'Google Meet',
    start: offsetDate(0, 16, 0),
    durationMin: 45,
  },
  {
    id: 'f5',
    category: 'meeting',
    title: 'Hackathon Info Session',
    location: 'Room 201',
    start: offsetDate(5, 17, 30),
    durationMin: 60,
  },
  {
    id: 'f6',
    category: 'contest',
    title: 'LeetCode Weekly Contest 400',
    location: 'Online · leetcode.com',
    start: offsetDate(3, 2, 30),
    durationMin: 90,
  },
  {
    id: 'f7',
    category: 'event',
    title: 'Tech Career Fair',
    location: 'University Hall',
    start: offsetDate(8, 10, 0),
    durationMin: 240,
  },
  {
    id: 'f8',
    category: 'meeting',
    title: 'Group Project Sync',
    location: 'Discord',
    start: offsetDate(1, 20, 30),
    durationMin: 60,
  },
  {
    id: 'f9',
    category: 'event',
    title: 'Tech Talk: AI in SWE',
    location: 'Auditorium 1',
    start: offsetDate(12, 15, 0),
    durationMin: 120,
  },
  {
    id: 'f10',
    category: 'contest',
    title: 'Codeforces Round #961 (Div. 1 + Div. 2)',
    location: 'Online · codeforces.com',
    start: offsetDate(10, 14, 35),
    durationMin: 150,
  }
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: House },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

const GROUP_TONES = ['blue', 'emerald', 'amber', 'violet', 'rose', 'cyan', 'pink'];

const GROUP_DOT_CLASS = {
  blue: 'bg-blue-400 border-blue-400',
  emerald: 'bg-emerald-400 border-emerald-400',
  amber: 'bg-amber-400 border-amber-400',
  violet: 'bg-violet-400 border-violet-400',
  rose: 'bg-rose-400 border-rose-400',
  cyan: 'bg-cyan-400 border-cyan-400',
  pink: 'bg-pink-400 border-pink-400',
  gray: 'bg-gray-400 border-gray-400'
};

function TodoOccurrenceItem({ occurrence, todo, onEdit, onToggle, onDelete, isDone, group }) {
  const { dateKey } = occurrence;
  const isRecurring = Boolean(todo.recurrence);
  const recDesc = describeRecurrence(todo.recurrence);
  const priorityColors = { high: 'text-rose-400', medium: 'text-amber-400', low: 'text-sky-400' };
  const priorityDot = priorityColors[todo.priority] || 'text-gray-500';
  return (
    <div className={`group flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all duration-150 ${isDone ? 'border-transparent bg-transparent opacity-50' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'}`}>
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onToggle(todo.id, dateKey)}
          className={`shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition ${isDone ? 'border-violet-500 bg-violet-500 text-white' : 'border-white/20 hover:border-violet-400 hover:bg-violet-500/10'}`}
        >
          {isDone && <Check className="h-3 w-3" />}
        </button>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={`text-[13px] leading-snug ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${group?.tone ? GROUP_DOT_CLASS[group.tone] : GROUP_DOT_CLASS['gray']}`} />
            {todo.title}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {todo.time && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock className="h-3 w-3" />{todo.time}
              </span>
            )}
            {todo.priority && (
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${priorityDot}`}>
                {todo.priority}
              </span>
            )}
            {isRecurring && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <Repeat className="h-3 w-3" />{recDesc}
              </span>
            )}
            {todo.notes && <span className="text-[11px] text-gray-500 line-clamp-1">{todo.notes}</span>}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pl-2">
        {group && (
          <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${GROUP_DOT_CLASS[group.tone] ? `text-gray-400 border-white/[0.06] bg-white/[0.02]` : 'text-gray-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${GROUP_DOT_CLASS[group.tone]?.split(' ')[0]}`} />
            {group.name}
          </span>
        )}
        <button onClick={() => onEdit(todo)} className="text-gray-500 hover:text-white p-1 rounded-md transition opacity-0 group-hover:opacity-100" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(todo, isRecurring ? dateKey : null)} className="text-gray-500 hover:text-rose-400 p-1 rounded-md transition opacity-0 group-hover:opacity-100" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function TodoEditor({ open, onClose, onSave, initial, groups, defaultDateKey }) {
  const [draft, setDraft] = useState({});
  const [recFreq, setRecFreq] = useState('');
  const [recInterval, setRecInterval] = useState(1);
  const [recEndType, setRecEndType] = useState('none');
  const [recCount, setRecCount] = useState(10);
  const [recUntil, setRecUntil] = useState('');

  useEffect(() => {
    if (open) {
      if (initial) {
        setDraft(initial);
        const rec = initial.recurrence;
        setRecFreq(rec?.freq || '');
        setRecInterval(rec?.interval || 1);
        if (rec?.end?.type === 'count') { setRecEndType('count'); setRecCount(rec.end.count || 10); }
        else if (rec?.end?.type === 'until') { setRecEndType('until'); setRecUntil(rec.end.untilKey || ''); }
        else setRecEndType('none');
      } else {
        setDraft({
          title: '',
          notes: '',
          groupId: groups?.[0]?.id || null,
          startKey: defaultDateKey || dateKey(new Date()),
          time: '',
          priority: 'medium',
        });
        setRecFreq('');
        setRecInterval(1);
        setRecEndType('none');
        setRecCount(10);
        setRecUntil('');
      }
    }
  }, [open, initial, groups, defaultDateKey]);

  function buildRecurrence() {
    if (!recFreq) return null;
    const rec = { freq: recFreq, interval: Math.max(1, Number(recInterval) || 1) };
    if (recEndType === 'count') rec.end = { type: 'count', count: Math.max(1, Number(recCount) || 10) };
    else if (recEndType === 'until' && recUntil) rec.end = { type: 'until', untilKey: recUntil };
    else rec.end = null;
    return rec;
  }

  function handleSave() {
    if (!draft.title?.trim()) return;
    onSave({ ...draft, recurrence: buildRecurrence() });
  }

  if (!open) return null;

  const inputCls = "w-full bg-gray-900/80 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition";
  const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-gray-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-gray-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-[15px] font-semibold text-white">{draft.id ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1 rounded-md"><X className="w-4 h-4" /></button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Title <span className="text-rose-500">*</span></label>
            <input
              className={inputCls}
              value={draft.title || ''}
              onChange={e => setDraft({ ...draft, title: e.target.value })}
              placeholder="Task title"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Notes</label>
            <textarea
              className={inputCls}
              value={draft.notes || ''}
              onChange={e => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Optional notes"
              rows={2}
            />
          </div>
          {/* Group + Priority */}
          <div className="grid grid-cols-2 gap-3">
            {groups && groups.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Group</label>
                <select className={inputCls} value={draft.groupId || ''} onChange={e => setDraft({ ...draft, groupId: e.target.value })}>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Priority</label>
              <select className={inputCls} value={draft.priority || 'medium'} onChange={e => setDraft({ ...draft, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Start Date</label>
              <input
                type="date"
                className={`${inputCls} [color-scheme:dark]`}
                value={draft.startKey || ''}
                onChange={e => setDraft({ ...draft, startKey: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Time</label>
              <input
                type="time"
                className={`${inputCls} [color-scheme:dark]`}
                value={draft.time || ''}
                onChange={e => setDraft({ ...draft, time: e.target.value })}
              />
            </div>
          </div>
          {/* Recurrence */}
          <div className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <label className={labelCls}>Recurrence</label>
            <div className="grid grid-cols-2 gap-3">
              <select className={inputCls} value={recFreq} onChange={e => setRecFreq(e.target.value)}>
                <option value="">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {recFreq && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">Every</span>
                  <input
                    type="number"
                    min={1} max={99}
                    className={`${inputCls} w-16 text-center`}
                    value={recInterval}
                    onChange={e => setRecInterval(e.target.value)}
                  />
                  <span className="text-[11px] text-gray-500">{recFreq === 'daily' ? 'day(s)' : recFreq === 'weekly' ? 'wk(s)' : 'mo(s)'}</span>
                </div>
              )}
            </div>
            {recFreq && (
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>End condition</label>
                  <select className={inputCls} value={recEndType} onChange={e => setRecEndType(e.target.value)}>
                    <option value="none">Forever</option>
                    <option value="count">After N occurrences</option>
                    <option value="until">Until date</option>
                  </select>
                </div>
                {recEndType === 'count' && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Occurrences</label>
                    <input type="number" min={1} max={999} className={inputCls} value={recCount} onChange={e => setRecCount(e.target.value)} />
                  </div>
                )}
                {recEndType === 'until' && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Until</label>
                    <input type="date" className={`${inputCls} [color-scheme:dark]`} value={recUntil} onChange={e => setRecUntil(e.target.value)} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition rounded-lg">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!draft.title?.trim()}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteRecurringModal({ open, pending, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-[1rem] border border-white/10 bg-gray-900 p-6 text-center">
        <h3 className="text-white text-lg font-medium mb-4">Delete Mode</h3>
        <p className="text-white/60 text-sm mb-6">Do you want to delete this specific occurrence or the entire recurring series?</p>
        <div className="flex flex-col gap-2">
          {pending?.occKey && (
            <button onClick={() => onConfirm('one')} className="px-4 py-2 bg-white/5 hover:bg-white/10 transition text-white rounded">
              Delete this occurrence
            </button>
          )}
          <button onClick={() => onConfirm('all')} className="px-4 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition rounded">
            Delete entire series
          </button>
          <button onClick={onClose} className="px-4 py-2 mt-2 text-white/50 hover:text-white transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_GROUPS = [
  { id: 'g-personal', name: 'Personal', tone: 'blue' },
  { id: 'g-icpc', name: 'ICPC Prep', tone: 'amber' },
  { id: 'g-bootcamp', name: 'Bootcamp', tone: 'emerald' },
  { id: 'g-work', name: 'Internship', tone: 'cyan' },
  { id: 'g-health', name: 'Health & Fitness', tone: 'rose' },
  { id: 'g-uni', name: 'University', tone: 'violet' },
  { id: 'g-finance', name: 'Finance', tone: 'emerald' },
];

// startDate as ISO date-string (YYYY-MM-DD) or null/undefined for "no date".
// recurrence: { freq: 'daily'|'weekly'|'monthly', interval: N, byWeekday?: [0..6], end?: { type: 'until'|'count', untilKey?: string, count?: number } } | null
const DEFAULT_TODOS = [
  {
    id: 't-seed-1',
    groupId: 'g-icpc',
    title: 'Solve 3 Dynamic Programming problems',
    priority: 'high',
    notes: 'Focus on CSES DP section.',
    startKey: dateKey(TODAY),
    time: '18:00',
    recurrence: {
      freq: 'daily',
      interval: 1,
      end: { type: 'count', count: 14 },
    },
  },
  {
    id: 't-seed-2',
    groupId: 'g-icpc',
    title: 'Team practice contest',
    priority: 'high',
    notes: 'Virtual participation Codeforces Div 2',
    startKey: dateKey(offsetDate(1)),
    time: '20:00',
    recurrence: {
      freq: 'weekly',
      interval: 1,
      byWeekday: [3, 6],
      end: null,
    },
  },
  {
    id: 't-seed-3',
    groupId: 'g-bootcamp',
    title: 'Watch Graph Bootcamp lesson',
    priority: 'medium',
    notes: 'Topic: Dijkstra and A* algorithms',
    startKey: dateKey(offsetDate(0)),
    time: '19:30',
    recurrence: null,
  },
  {
    id: 't-seed-4',
    groupId: 'g-personal',
    title: 'Read Atomic Habits',
    priority: 'low',
    notes: 'Read for 30 minutes',
    startKey: dateKey(offsetDate(0)),
    time: '22:00',
    recurrence: {
      freq: 'daily',
      interval: 1,
      end: null,
    },
  },
  {
    id: 't-seed-5',
    groupId: 'g-health',
    title: 'Morning Run 5K',
    priority: 'medium',
    notes: 'Maintain pace at 5:30/km',
    startKey: dateKey(offsetDate(-2)),
    time: '06:00',
    recurrence: {
      freq: 'weekly',
      interval: 1,
      byWeekday: [1, 3, 5],
      end: null,
    },
  },
  {
    id: 't-seed-6',
    groupId: 'g-uni',
    title: 'Algorithms Assignment 3',
    priority: 'high',
    notes: 'Submit on Canvas before 23:59',
    startKey: dateKey(offsetDate(3)),
    time: '20:00',
    recurrence: null,
  },
  {
    id: 't-seed-7',
    groupId: 'g-uni',
    title: 'Operating Systems Lecture',
    priority: 'medium',
    notes: 'Room 402',
    startKey: dateKey(offsetDate(0)),
    time: '10:00',
    recurrence: {
      freq: 'weekly',
      interval: 1,
      byWeekday: [1, 3],
      end: null
    },
  },
  {
    id: 't-seed-8',
    groupId: 'g-work',
    title: 'Weekly Standup',
    priority: 'high',
    notes: 'Prepare updates for the login feature',
    startKey: dateKey(offsetDate(0)),
    time: '09:30',
    recurrence: {
      freq: 'weekly',
      interval: 1,
      byWeekday: [1],
      end: null
    },
  },
  {
    id: 't-seed-9',
    groupId: 'g-finance',
    title: 'Review Monthly Budget',
    priority: 'medium',
    notes: 'Check expenses in YNAB',
    startKey: dateKey(offsetDate(14)),
    time: '10:00',
    recurrence: {
      freq: 'monthly',
      interval: 1,
      end: null
    },
  },
  {
    id: 't-seed-10',
    groupId: 'g-uni',
    title: 'Study group meet',
    priority: 'low',
    notes: 'Library 3rd floor',
    startKey: dateKey(offsetDate(2)),
    time: '14:00',
    recurrence: {
      freq: 'weekly',
      interval: 1,
      byWeekday: [4],
      end: null
    },
  },
  {
    id: 't-seed-11',
    groupId: 'g-health',
    title: 'Gym (Upper Body)',
    priority: 'high',
    notes: 'Focus on chest and triceps',
    startKey: dateKey(offsetDate(0)),
    time: '17:30',
    recurrence: {
      freq: 'weekly',
      interval: 1,
      byWeekday: [2, 4],
      end: null
    },
  },
  {
    id: 't-seed-12',
    groupId: 'g-icpc',
    title: 'Upsolve AtCoder ABC',
    priority: 'medium',
    notes: 'Solve problem D and E',
    startKey: dateKey(offsetDate(1)),
    time: '14:00',
    recurrence: null
  },
];

// ───────────────────────── Recurrence engine ─────────────────────────
function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDaysKey(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}


/**
 * Yields all occurrence date-keys for `todo` that fall within
 * [rangeStartKey, rangeEndKey] inclusive. Cap at 366 to avoid runaway loops.
 */
function occurrencesInRange(todo, rangeStartKey, rangeEndKey) {
  if (!todo.startKey) return [];
  const out = [];
  const rec = todo.recurrence;

  // Non-recurring: single occurrence on startKey.
  if (!rec) {
    if (todo.startKey >= rangeStartKey && todo.startKey <= rangeEndKey) {
      out.push(todo.startKey);
    }
    return out;
  }

  const interval = Math.max(1, rec.interval || 1);
  const untilKey = rec.end?.untilKey;
  const maxCount = rec.end?.type === 'count' ? rec.end.count : Infinity;
  const HARD_CAP = 366;
  let produced = 0;

  if (rec.freq === 'daily') {
    let cur = todo.startKey;
    while (produced < maxCount && produced < HARD_CAP) {
      if (untilKey && cur > untilKey) break;
      if (cur > rangeEndKey) break;
      if (cur >= rangeStartKey) out.push(cur);
      cur = addDaysKey(cur, interval);
      produced++;
    }
  } else if (rec.freq === 'weekly') {
    const weekdays =
      rec.byWeekday && rec.byWeekday.length > 0
        ? [...rec.byWeekday].sort((a, b) => a - b)
        : [parseKey(todo.startKey).getDay()];

    // Walk week by week from the start week.
    const startD = parseKey(todo.startKey);
    const startWeekStart = new Date(startD);
    startWeekStart.setDate(startWeekStart.getDate() - startD.getDay());
    let weekStartKey = dateKey(startWeekStart);
    let safety = 0;

    while (produced < maxCount && safety < HARD_CAP * 2) {
      for (const wd of weekdays) {
        const cand = addDaysKey(weekStartKey, wd);
        if (cand < todo.startKey) continue;
        if (untilKey && cand > untilKey) {
          produced = maxCount;
          break;
        }
        if (cand > rangeEndKey) {
          produced = maxCount;
          break;
        }
        if (cand >= rangeStartKey) out.push(cand);
        produced++;
        if (produced >= maxCount) break;
      }
      weekStartKey = addDaysKey(weekStartKey, 7 * interval);
      safety++;
    }
  } else if (rec.freq === 'monthly') {
    const start = parseKey(todo.startKey);
    const day = start.getDate();
    let y = start.getFullYear();
    let m = start.getMonth();
    let safety = 0;

    while (produced < maxCount && safety < HARD_CAP) {
      // Clamp day to month length.
      const lastOfMonth = new Date(y, m + 1, 0).getDate();
      const dd = Math.min(day, lastOfMonth);
      const cur = dateKey(new Date(y, m, dd));
      if (untilKey && cur > untilKey) break;
      if (cur > rangeEndKey) break;
      if (cur >= rangeStartKey && cur >= todo.startKey) out.push(cur);
      // Advance interval months.
      m += interval;
      while (m > 11) {
        m -= 12;
        y++;
      }
      produced++;
      safety++;
    }
  }

  return out;
}

function describeRecurrence(rec) {
  if (!rec) return null;
  const interval = Math.max(1, rec.interval || 1);
  let base;
  if (rec.freq === 'daily') {
    base = interval === 1 ? 'Every day' : `Every ${interval} days`;
  } else if (rec.freq === 'weekly') {
    if (rec.byWeekday && rec.byWeekday.length) {
      const names = [...rec.byWeekday]
        .sort((a, b) => a - b)
        .map((w) => WEEKDAYS[w])
        .join(', ');
      base = interval === 1 ? `Weekly on ${names}` : `Every ${interval} weeks on ${names}`;
    } else {
      base = interval === 1 ? 'Every week' : `Every ${interval} weeks`;
    }
  } else if (rec.freq === 'monthly') {
    base = interval === 1 ? 'Every month' : `Every ${interval} months`;
  } else {
    base = 'Repeats';
  }
  if (rec.end?.type === 'until' && rec.end.untilKey) {
    base += ` · until ${rec.end.untilKey}`;
  } else if (rec.end?.type === 'count' && rec.end.count) {
    base += ` · ${rec.end.count}×`;
  }
  return base;
}

// ───────────────────────── Persistence ─────────────────────────
function loadState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

function saveState(s) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

// ───────────────────────── Subcomponents ─────────────────────────
// ───────────────────────── Group Panel ─────────────────────────



function GroupPanel({
  groups,
  activeGroupId,
  setActiveGroupId,
  groupVisible,
  toggleGroupVisible,
  onCreate,
  onRename,
  onDelete,
  countsByGroup,
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [tone, setTone] = useState(GROUP_TONES[0]);

  const [renamingGroupId, setRenamingGroupId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState(null);

  const handleCreate = () => {
    onCreate(name.trim(), tone);
    setCreating(false);
    setName('');
    setTone(GROUP_TONES[0]);
  };

  const startRename = (g) => {
    setRenamingGroupId(g.id);
    setEditName(g.name);
  };

  const handleRename = (id) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
    }
    setRenamingGroupId(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04] mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Lists</span>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[11px] font-medium text-gray-400 hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-gray-200 transition"
        >
          <Plus className="h-3 w-3" /> New list
        </button>
      </div>

      {creating && (
        <div className="rounded-md border border-white/[0.06] bg-white/[0.01] p-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="List name"
            className="mb-2 w-full rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1.5 text-[12.5px] font-medium text-white focus:outline-none"
            autoFocus
          />
          <div className="mb-2 flex flex-wrap gap-1">
            {GROUP_TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`h-5 w-5 rounded-full border-2 ${GROUP_DOT_CLASS[t]} ${
                  tone === t ? 'border-white/[0.06]' : 'border-transparent'
                }`}
                aria-label={t}
              />
            ))}
          </div>
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded px-2 py-1 text-[11.5px] text-gray-400 hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim()}
              className="rounded border border-white/[0.06] bg-white/[0.01] px-2 py-1 text-[11.5px] font-semibold text-white hover:bg-violet-500/20 disabled:opacity-40"
            >
              Create
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setActiveGroupId('__contests')}
        className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-[12.5px] transition ${
          activeGroupId === '__contests'
            ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
            : 'border-white/[0.06] bg-white/[0.02] text-gray-300 hover:border-white/[0.1] hover:bg-white/[0.04]'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-amber-400" /> Contests
        </span>
        <span className="text-[10.5px] text-gray-400">{countsByGroup.__contests || 0}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveGroupId(null)}
        className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-[12.5px] transition ${
          activeGroupId === null
            ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
            : 'border-white/[0.06] bg-white/[0.02] text-gray-300 hover:border-white/[0.1] hover:bg-white/[0.04]'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Folder className="h-3.5 w-3.5" /> All tasks
        </span>
        <span className="text-[10.5px] text-gray-400">{countsByGroup.__all || 0}</span>
      </button>

      {groups.map((g) => {
        const isActive = activeGroupId === g.id;
        const visible = groupVisible[g.id] !== false;
        
        if (deletingGroupId === g.id) {
          return (
            <div key={g.id} className="rounded-md border border-white/[0.06] bg-rose-500/10 p-2 text-center text-xs">
              <p className="mb-2 text-rose-200">Delete &quot;{g.name}&quot;?</p>
              <div className="flex justify-center gap-2">
                <button onClick={() => setDeletingGroupId(null)} className="px-2 text-gray-400 hover:text-white">Cancel</button>
                <button onClick={() => { onDelete(g.id); setDeletingGroupId(null); }} className="rounded bg-rose-500 px-2 py-1 text-white">Delete</button>
              </div>
            </div>
          );
        }
        
        if (renamingGroupId === g.id) {
          return (
            <div key={g.id} className="flex flex-col gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.01] p-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(g.id)}
                className="w-full rounded bg-white/[0.04] px-2 py-1 text-[12.5px] font-medium text-white focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <button onClick={() => setRenamingGroupId(null)} className="px-2 py-1 text-[11px] text-gray-400 hover:text-white">Cancel</button>
                <button onClick={() => handleRename(g.id)} className="rounded border border-white/10 bg-white/[0.02] px-2 py-1 text-[11px] text-white">Save</button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={g.id}
            className={`group flex items-center gap-1 rounded-md border px-2 py-1.5 ${
              isActive
                ? 'border-violet-500/20 bg-violet-500/5'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleGroupVisible(g.id)}
              className="shrink-0"
              title={visible ? 'Hide on calendar' : 'Show on calendar'}
            >
              <span
                className={`flex h-2 w-2 rounded-full ${GROUP_DOT_CLASS[g.tone]} ${
                  visible ? '' : 'opacity-30'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => setActiveGroupId(g.id)}
              className="flex-1 truncate text-left text-[12.5px] font-medium transition"
              style={{ color: isActive ? 'rgb(196 181 253)' : 'rgb(209 213 219)' }}
            >
              {g.name}
            </button>
            <span className="text-[10.5px] text-gray-400">{countsByGroup[g.id] || 0}</span>
            <div className={`flex items-center opacity-0 transition group-hover:opacity-100`}>
              <button
                type="button"
                onClick={() => startRename(g)}
                className="rounded p-0.5 text-gray-400 hover:text-white"
                aria-label="Rename"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setDeletingGroupId(g.id)}
                className="rounded p-0.5 text-gray-400 hover:text-rose-400"
                aria-label="Delete group"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────── Pagination ─────────────────────────
function getPageRange(current, total) {
  // Compact pagination: 1 … (current-1) current (current+1) … total
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

function Pagination({ page, totalPages, total, pageStart, pageEnd, pageSize, setPage, setPageSize }) {
  if (total === 0) return null;
  const range = getPageRange(page, totalPages);
  const btn =
    'inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.01] px-2 text-[11.5px] font-semibold text-gray-300 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40 disabled:hover:bg-white/[0.04]';
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <span>
          {pageStart + 1}–{pageEnd} of {total}
        </span>
        <span className="text-white/80">·</span>
        <label className="flex items-center gap-1.5">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-gray-300 focus:outline-none"
          >
            {[10, 15, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPage(1)}
          disabled={page <= 1}
          className={btn}
          aria-label="First page"
        >
          «
        </button>
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className={btn}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {range.map((p, i) =>
          p === '…' ? (
            <span key={`g-${i}`} className="px-1 text-[11px] text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`${btn} ${
                p === page
                  ? 'border-white/[0.1] bg-white/[0.01] text-white'
                  : ''
              }`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className={btn}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setPage(totalPages)}
          disabled={page >= totalPages}
          className={btn}
          aria-label="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
}

// ───────────────────────── Calendar ─────────────────────────
function MonthCalendar({
  monthAnchor,
  setMonthAnchor,
  selected,
  setSelected,
  itemsByDay,
  visible,
}) {
  const first = startOfMonth(monthAnchor);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(
    monthAnchor.getFullYear(),
    monthAnchor.getMonth() + 1,
    0,
  ).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(first);
    d.setDate(d.getDate() - (startWeekday - i));
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), day),
      inMonth: true,
    });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }

  function shiftMonth(delta) {
    const m = new Date(monthAnchor);
    m.setMonth(m.getMonth() + delta);
    setMonthAnchor(m);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-medium tracking-wider text-white">
          {MONTH_NAMES[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-md border border-white/[0.06] bg-white/[0.01] p-1.5 text-gray-400 transition-all hover:bg-white/[0.04] hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMonthAnchor(new Date(TODAY));
              setSelected(new Date(TODAY));
            }}
            className="rounded-md border border-white/[0.06] bg-white/[0.01] px-2.5 py-1 text-[11px] font-semibold text-gray-300 transition-all hover:bg-white/[0.04] hover:text-white"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-md border border-white/[0.06] bg-white/[0.01] p-1.5 text-gray-400 transition-all hover:bg-white/[0.04] hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="px-1 py-1 text-center text-[10px] font-medium tracking-widest text-gray-400 font-mono uppercase"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const isToday = sameDay(cell.date, TODAY);
          const isSelected = sameDay(cell.date, selected);
          const dayItems = (itemsByDay.get(dateKey(cell.date)) || []).filter(
            (it) => visible[it.category],
          );
          const dotCats = Array.from(new Set(dayItems.map((it) => it.category))).slice(0, 4);

          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(new Date(cell.date))}
              className={`group/cell relative flex min-h-[68px] flex-col rounded-lg border p-1.5 text-left transition-all sm:min-h-[88px] ${
                isSelected
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
              } ${cell.inMonth ? '' : 'opacity-30'}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11.5px] font-semibold ${
                    isToday
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/30 text-violet-300 font-bold'
                      : isSelected
                        ? 'text-violet-300'
                        : cell.inMonth
                          ? 'text-gray-300'
                          : 'text-gray-500'
                  }`}
                >
                  {cell.date.getDate()}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[9.5px] font-semibold text-gray-400">
                    {dayItems.length}
                  </span>
                )}
              </div>

              <div className="mt-1 hidden flex-1 flex-col gap-0.5 sm:flex">
                {dayItems.map((it) => {
                  const cat = CATEGORIES[it.category];
                  const Icon = cat.icon;
                  return (
                    <span
                      key={it.id + it.dateKey}
                      className={`flex items-start gap-1 rounded-sm px-1 py-0.5 text-[9.5px] leading-tight ${
                        cat.chip
                      } ${it.done ? 'line-through opacity-50' : ''}`}
                      title={it.title}
                    >
                      <Icon className="mt-px h-2.5 w-2.5 shrink-0" />
                      {it.recurring && <Repeat className="mt-px h-2.5 w-2.5 shrink-0 opacity-70" />}
                      <span className="break-words whitespace-normal">{it.title}</span>
                    </span>
                  );
                })}
              </div>

              <div className="mt-auto flex items-center gap-0.5 sm:hidden">
                {dotCats.map((c) => (
                  <span
                    key={c}
                    className={`h-1.5 w-1.5 rounded-full ${CATEGORIES[c].dot}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeedEntry({ item }) {
  const cat = CATEGORIES[item.category];
  const Icon = cat.icon;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className={`mt-0.5 inline-flex shrink-0 rounded-md border p-1.5 ${cat.chip}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white">{item.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {fmtTime(item.start)} · {item.durationMin}m
          </span>
          {item.location && <span className="truncate">· {item.location}</span>}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Main ─────────────────────────
export default function DailyActivityClient() {
  // Load persisted state once on mount.
  const [hydrated, setHydrated] = useState(false);
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [todos, setTodos] = useState(DEFAULT_TODOS);
  // completions: { [todoId]: { [dateKey]: true } }
  const [completions, setCompletions] = useState({});

  useEffect(() => {
    const s = loadState();
    if (s) {
      if (Array.isArray(s.groups)) setGroups(s.groups);
      if (Array.isArray(s.todos)) setTodos(s.todos);
      if (s.completions && typeof s.completions === 'object') setCompletions(s.completions);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ groups, todos, completions });
  }, [hydrated, groups, todos, completions]);

  const [selected, setSelected] = useState(new Date(TODAY));
  const [monthAnchor, setMonthAnchor] = useState(new Date(TODAY));
  const [visible, setVisible] = useState(() =>
    Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, true])),
  );
  const [groupVisible, setGroupVisible] = useState({});
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [todoFilter, setTodoFilter] = useState('upcoming'); // upcoming | today | done | all
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  function toggleGroupVisible(gid) {
    setGroupVisible((v) => ({ ...v, [gid]: v[gid] === false ? true : false }));
  }

  // ── Group ops ──
  function createGroup(name, tone) {
    setGroups((gs) => [...gs, { id: `g-${Date.now()}`, name, tone }]);
  }
  function renameGroup(id, name) {
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, name } : g)));
  }
  function deleteGroup(id) {
    setGroups((gs) => {
      const remaining = gs.filter((g) => g.id !== id);
      if (remaining.length === 0) return gs; // keep at least one
      const fallback = remaining[0].id;
      setTodos((ts) => ts.map((t) => (t.groupId === id ? { ...t, groupId: fallback } : t)));
      return remaining;
    });
    if (activeGroupId === id) setActiveGroupId(null);
  }

  // ── Todo ops ──
  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }
  function openEdit(todo) {
    setEditing(todo);
    setEditorOpen(true);
  }
  function saveTodo(draft) {
    setTodos((prev) => {
      if (draft.id) return prev.map((t) => (t.id === draft.id ? { ...t, ...draft } : t));
      return [{ ...draft, id: `t-${Date.now()}` }, ...prev];
    });
    setEditorOpen(false);
    setEditing(null);
  }

  function toggleOccurrence(todoId, dKey) {
    setCompletions((c) => {
      const cur = c[todoId] || {};
      const next = { ...cur };
      if (next[dKey]) delete next[dKey];
      else next[dKey] = true;
      return { ...c, [todoId]: next };
    });
  }

  function requestDelete(todo, occKey) {
    if (!todo.recurrence) {
      // Single-instance: just remove.
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
      return;
    }
    setPendingDelete({ todo, occKey });
  }

  function confirmDelete(scope) {
    const { todo, occKey } = pendingDelete;
    if (scope === 'all') {
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } else if (scope === 'one') {
      // Add an exclusion list.
      setTodos((prev) =>
        prev.map((t) =>
          t.id === todo.id
            ? { ...t, exclusions: [...(t.exclusions || []), occKey] }
            : t,
        ),
      );
    } else if (scope === 'future') {
      // Set recurrence end to (occKey - 1 day).
      const newUntil = addDaysKey(occKey, -1);
      setTodos((prev) =>
        prev.map((t) => {
          if (t.id !== todo.id) return t;
          if (newUntil < t.startKey) {
            // Removes the entire series including its first occurrence.
            return null;
          }
          return {
            ...t,
            recurrence: {
              ...(t.recurrence || {}),
              end: { type: 'until', untilKey: newUntil },
            },
          };
        }).filter(Boolean),
      );
    }
    setPendingDelete(null);
  }

  // ── Expand occurrences for the visible month ──
  // Range = the calendar grid (startWeekday before to fill 42 cells).
  const monthRange = useMemo(() => {
    const first = startOfMonth(monthAnchor);
    const startWeekday = first.getDay();
    const start = new Date(first);
    start.setDate(start.getDate() - startWeekday);
    const end = new Date(start);
    end.setDate(end.getDate() + 41);
    return { startKey: dateKey(start), endKey: dateKey(end) };
  }, [monthAnchor]);

  // Wider range for to-do list scroll (90 days from today).
  const listRange = useMemo(
    () => ({
      startKey: dateKey(offsetDate(-30)),
      endKey: dateKey(offsetDate(90)),
    }),
    [],
  );

  function expandOccurrences(rangeStartKey, rangeEndKey) {
    const out = [];
    todos.forEach((t) => {
      const keys = occurrencesInRange(t, rangeStartKey, rangeEndKey);
      keys.forEach((k) => {
        if ((t.exclusions || []).includes(k)) return;
        out.push({ todo: t, dateKey: k });
      });
    });
    return out;
  }

  const itemsByDay = useMemo(() => {
    const map = new Map();
    const push = (key, payload) => {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(payload);
    };

    SEED_FEED.forEach((it) => push(dateKey(it.start), { ...it, dateKey: dateKey(it.start) }));

    const occ = expandOccurrences(monthRange.startKey, monthRange.endKey);
    occ.forEach(({ todo, dateKey: k }) => {
      const groupOk = groupVisible[todo.groupId] !== false;
      if (!groupOk) return;
      const done = !!completions[todo.id]?.[k];
      push(k, {
        id: todo.id,
        category: 'todo',
        title: todo.title,
        dateKey: k,
        recurring: !!todo.recurrence,
        done,
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, completions, monthRange, groupVisible]);

  // Selected-day data.
  const selKey = dateKey(selected);

  const occurrencesAll = useMemo(
    () => expandOccurrences(listRange.startKey, listRange.endKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos, listRange],
  );

  // Combined task + calendar feed list.
  const filteredOccurrences = useMemo(() => {
    const todayKey = dateKey(TODAY);
    const selKeyLocal = dateKey(selected);

    // Tasks (group-aware).
    const todoEntries = activeGroupId === '__contests' ? [] : occurrencesAll
      .filter(({ todo }) => activeGroupId == null || todo.groupId === activeGroupId)
      .filter(({ todo }) => groupVisible[todo.groupId] !== false)
      .map(({ todo, dateKey: k }) => ({
        kind: 'todo',
        dateKey: k,
        sortTime: todo.time || '00:00',
        todo,
      }));

    // Calendar feed (category-aware via `visible`).
    const feedEntries =
      todoFilter === 'done'
        ? []
        : SEED_FEED.filter((it) => 
            activeGroupId === '__contests' 
              ? it.category === 'contest' 
              : (activeGroupId === null && visible[it.category])
          ).map((it) => ({
            kind: 'feed',
            dateKey: dateKey(it.start),
            sortTime: it.start.toTimeString().slice(0, 5),
            item: it,
          }));

    let list = [...todoEntries, ...feedEntries];

    if (todoFilter === 'today') list = list.filter((e) => e.dateKey === todayKey);
    else if (todoFilter === 'upcoming') list = list.filter((e) => e.dateKey >= todayKey);
    else if (todoFilter === 'day') list = list.filter((e) => e.dateKey === selKeyLocal);
    else if (todoFilter === 'done')
      list = list.filter(
        (e) => e.kind === 'todo' && !!completions[e.todo.id]?.[e.dateKey],
      );
    else if (todoFilter === 'contests')
      list = SEED_FEED.filter((it) => it.category === 'contest').map((it) => ({
        kind: 'feed',
        dateKey: dateKey(it.start),
        sortTime: it.start.toTimeString().slice(0, 5),
        item: it,
      }));

    return list.sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
      return a.sortTime < b.sortTime ? -1 : a.sortTime > b.sortTime ? 1 : 0;
    });
  }, [
    occurrencesAll,
    todoFilter,
    activeGroupId,
    groupVisible,
    completions,
    selected,
    visible,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredOccurrences.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pagedOccurrences = filteredOccurrences.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage(1);
  }, [todoFilter, activeGroupId, pageSize, selected]);

  // Group counts (open occurrences in next 30 days).
  const countsByGroup = useMemo(() => {
    const todayKey = dateKey(TODAY);
    const horizon = dateKey(offsetDate(30));
    const counts = { __all: 0 };
    occurrencesAll.forEach(({ todo, dateKey: k }) => {
      if (k < todayKey || k > horizon) return;
      if (completions[todo.id]?.[k]) return;
      counts.__all = (counts.__all || 0) + 1;
      counts[todo.groupId] = (counts[todo.groupId] || 0) + 1;
    });
    counts.__contests = SEED_FEED.filter((it) => it.category === 'contest' && dateKey(it.start) >= todayKey && dateKey(it.start) <= horizon).length;
    return counts;
  }, [occurrencesAll, completions]);

  // Header stats.
  const stats = useMemo(() => {
    const todayKey = dateKey(TODAY);
    const todaysOcc = occurrencesAll.filter(({ dateKey: k }) => k === todayKey);
    const open = todaysOcc.filter(({ todo, dateKey: k }) => !completions[todo.id]?.[k]).length;
    const doneToday = todaysOcc.filter(
      ({ todo, dateKey: k }) => completions[todo.id]?.[k],
    ).length;
    const upcomingContests = SEED_FEED.filter(
      (i) => i.category === 'contest' && i.start >= TODAY,
    ).length;
    const upcomingEvents = SEED_FEED.filter(
      (i) => i.category === 'event' && i.start >= TODAY,
    ).length;
    return { open, doneToday, upcomingContests, upcomingEvents };
  }, [occurrencesAll, completions]);

  const groupById = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);

  const renderTab = () => {
    switch(activeTab) {
      case 'overview': {
        const todayKeyLocal = dateKey(TODAY);
        const upcomingOcc = occurrencesAll
          .filter(({ dateKey: k }) => k >= todayKeyLocal)
          .filter(({ todo }) => groupVisible[todo.groupId] !== false);
        const todayOcc = upcomingOcc.filter(({ dateKey: k }) => k === todayKeyLocal);
        const doneToday = todayOcc.filter(({ todo, dateKey: k }) => !!completions[todo.id]?.[k]).length;
        const openToday = todayOcc.length - doneToday;
        const next7 = upcomingOcc.filter(({ dateKey: k }) => k <= addDaysKey(todayKeyLocal, 7)).length;
        const highPriority = upcomingOcc.filter(({ todo }) => todo.priority === 'high').length;

        const STAT_CARDS = [
          { label: 'Open today', value: openToday, accent: 'violet', icon: CircleDot, sub: 'tasks remaining' },
          { label: 'Done today', value: doneToday, accent: 'emerald', icon: CheckCircle2, sub: 'completed' },
          { label: 'Next 7 days', value: next7, accent: 'blue', icon: CalendarIcon, sub: 'upcoming tasks' },
          { label: 'High priority', value: highPriority, accent: 'rose', icon: Flag, sub: 'need attention' },
          { label: 'Contests', value: stats.upcomingContests, accent: 'amber', icon: Trophy, sub: 'upcoming' },
          { label: 'Events', value: stats.upcomingEvents, accent: 'cyan', icon: Sparkles, sub: 'upcoming' },
        ];

        const accentChip = {
          violet: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
          emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
          blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
          rose: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
          amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
          cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
        };

        return (
          <div className="flex flex-col gap-6 w-full">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {STAT_CARDS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2">
                    <div className={`inline-flex w-fit rounded-lg border p-2 ${accentChip[s.accent]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick actions row */}
            <GlassCard padding="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-200">Quick Actions</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Jump to your most common tasks</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton tone="primary" icon={Plus} onClick={openCreate}>New task</ActionButton>
                  <ActionButton tone="ghost" icon={CalendarIcon} onClick={() => setActiveTab('tasks')}>View tasks</ActionButton>
                  <ActionButton tone="ghost" icon={CheckSquare} onClick={() => { setTodoFilter('today'); setActiveTab('tasks'); }}>Today&apos;s tasks</ActionButton>
                  <ActionButton tone="ghost" icon={Trophy} onClick={() => { setTodoFilter('contests'); setActiveTab('tasks'); }}>Contests</ActionButton>
                </div>
              </div>
            </GlassCard>

            {/* Activity chart */}
            <ActivityViz />
          </div>
        );
      }
        case 'tasks': {
          // Group filtered occurrences by date for display.
          const todayKey2 = dateKey(TODAY);
          const grouped = [];
          let lastDateKey = null;
          pagedOccurrences.forEach((entry) => {
            if (entry.dateKey !== lastDateKey) {
              lastDateKey = entry.dateKey;
              const d = parseKey(entry.dateKey);
              const isToday = entry.dateKey === todayKey2;
              const isTomorrow = entry.dateKey === addDaysKey(todayKey2, 1);
              const label = isToday
                ? 'Today'
                : isTomorrow
                ? 'Tomorrow'
                : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              grouped.push({ type: 'separator', label, dateKey: entry.dateKey, isToday });
            }
            grouped.push({ type: 'item', entry });
          });

          return (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 w-full">
            {/* Left: Lists panel */}
            <div className="xl:col-span-3">
              <GlassCard padding="p-4">
                <GroupPanel
                  groups={groups}
                  activeGroupId={activeGroupId}
                  setActiveGroupId={setActiveGroupId}
                  groupVisible={groupVisible}
                  toggleGroupVisible={toggleGroupVisible}
                  countsByGroup={countsByGroup}
                  onCreate={createGroup}
                  onRename={renameGroup}
                  onDelete={deleteGroup}
                />
              </GlassCard>
            </div>

            {/* Right: Task list */}
            <div className="xl:col-span-9">
              <GlassCard padding="p-5">
                {/* Header row */}
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-200">
                        {todoFilter === 'contests' || activeGroupId === '__contests' ? 'Contests' : activeGroupId ? groupById[activeGroupId]?.name || 'Tasks' : 'All Tasks'}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {todoFilter === 'day' ? fmtDayLong(selected) : `${filteredOccurrences.length} item${filteredOccurrences.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <ActionButton tone="primary" icon={Plus} onClick={openCreate}>New task</ActionButton>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                    {[
                      { v: 'today', l: 'Today', icon: CircleDot },
                      { v: 'upcoming', l: 'Upcoming', icon: CalendarIcon },
                      { v: 'day', l: 'By day', icon: Sparkles },
                      { v: 'done', l: 'Completed', icon: CheckCircle2 },
                      { v: 'all', l: 'All', icon: Filter },
                      { v: 'contests', l: 'Contests', icon: Trophy },
                    ].map((t) => {
                      const TIcon = t.icon;
                      return (
                        <button
                          key={t.v}
                          type="button"
                          onClick={() => setTodoFilter(t.v)}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all border ${
                            todoFilter === t.v
                              ? 'bg-white/[0.06] text-white shadow-sm border-white/[0.06]'
                              : 'text-gray-400 border-transparent hover:bg-white/[0.03] hover:text-gray-200'
                          }`}
                        >
                          <TIcon className="h-3 w-3" />
                          {t.l}
                        </button>
                      );
                    })}
                  </div>

                  {/* Day filter back button */}
                  {todoFilter === 'day' && !sameDay(selected, TODAY) && (
                    <div className="flex justify-end">
                      <ActionButton tone="ghost" icon={X} onClick={() => { setSelected(new Date(TODAY)); setTodoFilter('today'); }}>
                        Back to today
                      </ActionButton>
                    </div>
                  )}
                </div>

                {/* Task list */}
                {filteredOccurrences.length === 0 ? (
                  <EmptyState
                    icon={Flag}
                    title="Nothing here"
                    description={
                      todoFilter === 'done' ? 'No completed tasks yet. Check off tasks to see them here.' :
                      todoFilter === 'contests' ? 'No upcoming contests in the next 30 days.' :
                      todoFilter === 'today' ? 'Nothing scheduled for today. Add a task to get started.' :
                      'No tasks match this filter.'
                    }
                    action={todoFilter !== 'contests' && <ActionButton tone="primary" icon={Plus} onClick={openCreate}>New task</ActionButton>}
                    accent="violet"
                  />
                ) : (
                  <>
                    <ul className="space-y-1">
                      <AnimatePresence initial={false}>
                        {grouped.map((row, idx) => {
                          if (row.type === 'separator') {
                            return (
                              <li key={`sep-${row.dateKey}`} className={`flex items-center gap-2 pt-3 pb-1 ${idx === 0 ? 'pt-0' : ''}`}>
                                <span className={`text-[11px] font-semibold ${
                                  row.isToday ? 'text-violet-400' : 'text-gray-500'
                                }`}>{row.label}</span>
                                <span className="flex-1 h-px bg-white/[0.04]" />
                              </li>
                            );
                          }
                          const entry = row.entry;
                          if (entry.kind === 'feed') return <li key={`feed-${entry.item.id}-${entry.dateKey}`}><FeedEntry item={entry.item} /></li>;
                          return (
                            <motion.li
                              key={`todo-${entry.todo.id}-${entry.dateKey}`}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                            >
                              <TodoOccurrenceItem
                                occurrence={{ dateKey: entry.dateKey }}
                                todo={entry.todo}
                                group={groupById[entry.todo.groupId]}
                                isDone={!!completions[entry.todo.id]?.[entry.dateKey]}
                                onToggle={toggleOccurrence}
                                onEdit={openEdit}
                                onDelete={requestDelete}
                              />
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                    <Pagination
                      page={safePage} totalPages={totalPages} total={filteredOccurrences.length}
                      pageStart={pageStart} pageEnd={Math.min(pageStart + pageSize, filteredOccurrences.length)}
                      pageSize={pageSize} setPage={setPage} setPageSize={setPageSize}
                    />
                  </>
                )}
              </GlassCard>
            </div>
          </div>
        );}
      case 'calendar': {
        const todayKeyLocal = dateKey(TODAY);
        const todaysEventsList = SEED_FEED.filter(
          (i) => i.category === 'event' && dateKey(i.start) === todayKeyLocal
        ).sort((a, b) => a.start.getTime() - b.start.getTime());

        return (
          <div className="flex flex-col gap-6 w-full">
            {todaysEventsList.length > 0 && (
              <GlassCard padding="p-6">
                <SectionHeader icon={CalendarIcon} title="Today's Events" subtitle="Events scheduled for today." />
                <ul className="space-y-1.5">
                  {todaysEventsList.map((event, i) => (
                    <li key={`event-${i}`}>
                      <FeedEntry item={event} />
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
            <GlassCard padding="p-6">
              <MonthCalendar
                monthAnchor={monthAnchor}
                setMonthAnchor={setMonthAnchor}
                selected={selected}
                setSelected={(d) => { setSelected(d); setTodoFilter('day'); setActiveTab('tasks'); }}
                itemsByDay={itemsByDay}
                visible={visible}
              />
            </GlassCard>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="flex h-full min-h-screen text-gray-300 selection:bg-violet-500/30">
      <aside className="hidden w-[240px] shrink-0 border-r border-white/[0.06] bg-gray-950 xl:flex xl:flex-col">
        <nav className="flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group/nav relative flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                    active
                      ? 'bg-violet-500/12 font-semibold text-violet-400 shadow-violet-500/10'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                  }`}
                >
                  {active && (
                    <div className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-purple-600" />
                  )}
                  <Icon className="h-[17px] w-[17px] shrink-0" />
                  <span className="flex-1 truncate text-left">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-14 z-20 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-xl xl:hidden">
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6">
            <nav className="scrollbar-none -mb-px flex items-center gap-0.5 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[13px] font-medium transition-colors ${
                      active
                        ? 'border-violet-500 text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-violet-400' : ''}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
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

      <TodoEditor
        open={editorOpen}
        initial={editing}
        groups={groups}
        defaultDateKey={selKey}
        onSave={saveTodo}
        onClose={() => { setEditorOpen(false); setEditing(null); }}
      />
      <DeleteRecurringModal
        open={!!pendingDelete}
        pending={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
