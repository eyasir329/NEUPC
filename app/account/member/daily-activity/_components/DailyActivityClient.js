'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Trash2,
  Pencil,
  Calendar as CalendarIcon,
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
} from 'lucide-react';
import {
  PageShell,
  PageHeader,
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
    chip: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
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
};

const PRIORITY_DOT = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-gray-500',
};

// ───────────────────────── Seed data ─────────────────────────
const SEED_FEED = [
  {
    id: 'f1',
    category: 'contest',
    title: 'Codeforces Round #952 (Div. 2)',
    location: 'Online · codeforces.com',
    start: offsetDate(1, 20, 5),
    durationMin: 135,
  },
  {
    id: 'f2',
    category: 'contest',
    title: 'NEUPC Weekly Practice',
    location: 'Online · vjudge',
    start: offsetDate(3, 21, 0),
    durationMin: 150,
  },
  {
    id: 'f3',
    category: 'contest',
    title: 'ICPC Dhaka Regional — Mock',
    location: 'NEU CSE Lab 4',
    start: offsetDate(9, 10, 0),
    durationMin: 300,
  },
  {
    id: 'f4',
    category: 'event',
    title: 'Club General Meeting',
    location: 'Auditorium B',
    start: offsetDate(2, 17, 30),
    durationMin: 60,
  },
  {
    id: 'f5',
    category: 'event',
    title: 'Guest Talk: Industry & Competitive Programming',
    location: 'Seminar Hall',
    start: offsetDate(6, 16, 0),
    durationMin: 90,
  },
  {
    id: 'f6',
    category: 'bootcamp',
    title: 'DP Bootcamp · Lesson 4 — Knapsack Variants',
    location: 'Self-paced · /bootcamps/dp',
    start: offsetDate(0, 19, 0),
    durationMin: 60,
  },
  {
    id: 'f7',
    category: 'bootcamp',
    title: 'Graph Bootcamp · Lesson 2 — BFS/DFS Patterns',
    location: 'Self-paced · /bootcamps/graphs',
    start: offsetDate(4, 19, 0),
    durationMin: 60,
  },
  {
    id: 'f8',
    category: 'bootcamp',
    title: 'Greedy Bootcamp · Live Q&A',
    location: 'Discord',
    start: offsetDate(8, 21, 0),
    durationMin: 45,
  },
  {
    id: 'f9',
    category: 'problem',
    title: 'Daily Ladder · 3 problems (rated 1400-1600)',
    location: 'Problem Solving',
    start: offsetDate(0, 22, 0),
    durationMin: 90,
  },
  {
    id: 'f10',
    category: 'problem',
    title: 'Weekly Virtual — Educational Round set',
    location: 'Problem Solving',
    start: offsetDate(5, 20, 0),
    durationMin: 120,
  },
  {
    id: 'f11',
    category: 'discussion',
    title: 'Editorial Discussion: Round #951',
    location: 'Discussions',
    start: offsetDate(-1, 22, 0),
    durationMin: 60,
  },
  {
    id: 'f12',
    category: 'discussion',
    title: 'Team Strategy Sync (ICPC Roster)',
    location: 'Discussions · #icpc-team',
    start: offsetDate(7, 18, 0),
    durationMin: 45,
  },
];

const GROUP_TONES = ['blue', 'emerald', 'amber', 'violet', 'rose', 'cyan', 'pink'];

const DEFAULT_GROUPS = [
  { id: 'g-personal', name: 'Personal', tone: 'blue' },
  { id: 'g-icpc', name: 'ICPC Prep', tone: 'amber' },
  { id: 'g-bootcamp', name: 'Bootcamp', tone: 'emerald' },
];

// startDate as ISO date-string (YYYY-MM-DD) or null/undefined for "no date".
// recurrence: { freq: 'daily'|'weekly'|'monthly', interval: N, byWeekday?: [0..6], end?: { type: 'until'|'count', untilKey?: string, count?: number } } | null
const DEFAULT_TODOS = [
  {
    id: 't-seed-1',
    groupId: 'g-icpc',
    title: 'Solve 3 DP problems',
    priority: 'high',
    notes: '',
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
    notes: '',
    startKey: dateKey(offsetDate(1)),
    time: '20:00',
    recurrence: {
      freq: 'weekly',
      interval: 1,
      byWeekday: [3, 6], // Wed + Sat
      end: null,
    },
  },
  {
    id: 't-seed-3',
    groupId: 'g-bootcamp',
    title: 'Watch Graph Bootcamp lesson',
    priority: 'medium',
    notes: '',
    startKey: dateKey(offsetDate(0)),
    time: '19:30',
    recurrence: null,
  },
  {
    id: 'recurring-mensual',
    groupId: 'g-personal',
    title: 'Monthly retrospective',
    priority: 'low',
    notes: '',
    startKey: dateKey(new Date(TODAY.getFullYear(), TODAY.getMonth(), 28)),
    time: '21:00',
    recurrence: {
      freq: 'monthly',
      interval: 1,
      end: null,
    },
  },
  {
    id: 't-seed-4',
    groupId: 'g-personal',
    title: 'Submit weekly upsolve writeup',
    priority: 'medium',
    notes: '',
    startKey: dateKey(offsetDate(5)),
    time: '23:00',
    recurrence: null,
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

function diffDays(aKey, bKey) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((parseKey(bKey) - parseKey(aKey)) / MS);
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
  const endType = rec.end?.type;
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
function FilterChips({ visible, onToggle }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
        <Filter className="h-3 w-3" /> Show
      </span>
      {Object.entries(CATEGORIES).map(([key, cat]) => {
        const active = visible[key];
        const Icon = cat.icon;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
              active
                ? cat.chip
                : 'border-white/[0.08] bg-white/[0.02] text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="h-3 w-3" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

function PriorityDot({ priority }) {
  return <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[priority]}`} />;
}

function GroupDot({ tone }) {
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT.high.replace(
        'bg-rose-400',
        '',
      )} bg-${tone}-400`}
    />
  );
}

// safelist note: tone classes are constrained to GROUP_TONES; we use static map.
const GROUP_DOT_CLASS = {
  blue: 'bg-blue-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  violet: 'bg-violet-400',
  rose: 'bg-rose-400',
  cyan: 'bg-cyan-400',
  pink: 'bg-pink-400',
};

function GroupBadge({ group }) {
  if (!group) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-gray-400">
      <span className={`h-1.5 w-1.5 rounded-full ${GROUP_DOT_CLASS[group.tone]}`} />
      {group.name}
    </span>
  );
}

function TodoOccurrenceItem({
  occurrence,
  todo,
  group,
  isDone,
  onToggle,
  onEdit,
  onDelete,
}) {
  const rec = describeRecurrence(todo.recurrence);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.18 }}
      className="group flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 hover:border-white/[0.1] hover:bg-white/[0.04]"
    >
      <button
        type="button"
        onClick={() => onToggle(todo.id, occurrence.dateKey)}
        className="mt-0.5 shrink-0 text-gray-400 transition-colors hover:text-blue-300"
        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
      >
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] leading-snug ${
            isDone ? 'text-gray-500 line-through' : 'text-gray-200'
          }`}
        >
          {todo.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <PriorityDot priority={todo.priority} />
            {todo.priority}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {occurrence.dateKey}
            {todo.time ? ` · ${todo.time}` : ''}
          </span>
          {rec && (
            <span className="inline-flex items-center gap-1 text-blue-300/80">
              <Repeat className="h-3 w-3" />
              {rec}
            </span>
          )}
          {group && <GroupBadge group={group} />}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(todo)}
          className="rounded p-1 text-gray-500 hover:bg-white/[0.05] hover:text-blue-300"
          aria-label="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(todo, occurrence.dateKey)}
          className="rounded p-1 text-gray-500 hover:bg-white/[0.05] hover:text-rose-400"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.li>
  );
}

// ───────────────────────── Editor modal ─────────────────────────
function TodoEditor({ open, initial, groups, defaultDateKey, onSave, onClose }) {
  const blank = {
    id: null,
    groupId: groups[0]?.id || null,
    title: '',
    priority: 'medium',
    notes: '',
    startKey: defaultDateKey,
    time: '18:00',
    recurrence: null,
  };
  const [draft, setDraft] = useState(blank);
  const [repeatOn, setRepeatOn] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setDraft({
        id: initial.id,
        groupId: initial.groupId || groups[0]?.id || null,
        title: initial.title,
        priority: initial.priority,
        notes: initial.notes || '',
        startKey: initial.startKey || defaultDateKey,
        time: initial.time || '',
        recurrence: initial.recurrence || null,
      });
      setRepeatOn(!!initial.recurrence);
    } else {
      setDraft({ ...blank, startKey: defaultDateKey });
      setRepeatOn(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, defaultDateKey]);

  if (!open) return null;

  const rec = draft.recurrence || { freq: 'daily', interval: 1, byWeekday: [], end: null };

  function setRec(patch) {
    setDraft((d) => ({ ...d, recurrence: { ...rec, ...patch } }));
  }

  function toggleWeekday(w) {
    const list = rec.byWeekday || [];
    const next = list.includes(w) ? list.filter((x) => x !== w) : [...list, w];
    setRec({ byWeekday: next });
  }

  function setEnd(type, value) {
    if (type === 'never') return setRec({ end: null });
    if (type === 'until') return setRec({ end: { type: 'until', untilKey: value } });
    if (type === 'count')
      return setRec({ end: { type: 'count', count: Math.max(1, Number(value) || 1) } });
  }

  function commit() {
    if (!draft.title.trim()) return;
    const final = {
      ...draft,
      title: draft.title.trim(),
      recurrence: repeatOn
        ? {
            freq: rec.freq || 'daily',
            interval: Math.max(1, Number(rec.interval) || 1),
            byWeekday: rec.freq === 'weekly' ? rec.byWeekday || [] : undefined,
            end: rec.end || null,
          }
        : null,
    };
    onSave(final);
  }

  const endType = !repeatOn ? 'never' : rec.end?.type || 'never';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-white/[0.08] bg-gray-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <h3 className="text-sm font-semibold text-white">
            {initial ? 'Edit task' : 'New task'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3.5 overflow-y-auto p-5 text-[13px]">
          <div>
            <label className="mb-1 block text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
              Title
            </label>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="What needs to get done?"
              className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-gray-100 placeholder:text-gray-600 focus:border-blue-500/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                Group
              </label>
              <select
                value={draft.groupId ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, groupId: e.target.value || null }))}
                className="w-full rounded-md border border-white/[0.08] bg-gray-900 px-2 py-2 text-gray-200 focus:outline-none"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                Priority
              </label>
              <select
                value={draft.priority}
                onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                className="w-full rounded-md border border-white/[0.08] bg-gray-900 px-2 py-2 text-gray-200 focus:outline-none"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                Start date
              </label>
              <input
                type="date"
                value={draft.startKey || ''}
                onChange={(e) => setDraft((d) => ({ ...d, startKey: e.target.value }))}
                className="w-full rounded-md border border-white/[0.08] bg-gray-900 px-2 py-2 text-gray-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                Time
              </label>
              <input
                type="time"
                value={draft.time || ''}
                onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                className="w-full rounded-md border border-white/[0.08] bg-gray-900 px-2 py-2 text-gray-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
              Notes
            </label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-gray-100 placeholder:text-gray-600 focus:border-blue-500/40 focus:outline-none"
              placeholder="Optional details…"
            />
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <label className="flex cursor-pointer items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-gray-200">
                <Repeat className="h-3.5 w-3.5 text-blue-300" />
                Repeat
              </span>
              <input
                type="checkbox"
                checked={repeatOn}
                onChange={(e) => setRepeatOn(e.target.checked)}
                className="h-4 w-4 accent-blue-500"
              />
            </label>

            {repeatOn && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={rec.freq || 'daily'}
                    onChange={(e) => setRec({ freq: e.target.value })}
                    className="rounded-md border border-white/[0.08] bg-gray-900 px-2 py-1.5 text-gray-200 focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] text-gray-500">Every</span>
                    <input
                      type="number"
                      min={1}
                      value={rec.interval || 1}
                      onChange={(e) => setRec({ interval: Number(e.target.value) || 1 })}
                      className="w-16 rounded-md border border-white/[0.08] bg-gray-900 px-2 py-1.5 text-gray-200 focus:outline-none"
                    />
                    <span className="text-[11.5px] text-gray-500">
                      {rec.freq === 'weekly'
                        ? 'week(s)'
                        : rec.freq === 'monthly'
                          ? 'month(s)'
                          : 'day(s)'}
                    </span>
                  </div>
                </div>

                {rec.freq === 'weekly' && (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                      On
                    </p>
                    <div className="flex gap-1">
                      {WEEKDAY_SHORT.map((label, idx) => {
                        const on = (rec.byWeekday || []).includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleWeekday(idx)}
                            className={`h-7 w-7 rounded-md border text-[11px] font-semibold transition ${
                              on
                                ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
                                : 'border-white/[0.08] bg-white/[0.02] text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-1 text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                    Ends
                  </p>
                  <div className="space-y-1.5 text-[12.5px] text-gray-300">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="end"
                        checked={endType === 'never'}
                        onChange={() => setEnd('never')}
                        className="accent-blue-500"
                      />
                      Never
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="end"
                        checked={endType === 'until'}
                        onChange={() =>
                          setEnd('until', rec.end?.untilKey || addDaysKey(draft.startKey, 30))
                        }
                        className="accent-blue-500"
                      />
                      On
                      <input
                        type="date"
                        value={rec.end?.untilKey || ''}
                        onChange={(e) => setEnd('until', e.target.value)}
                        disabled={endType !== 'until'}
                        className="rounded-md border border-white/[0.08] bg-gray-900 px-2 py-1 text-gray-200 disabled:opacity-40"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="end"
                        checked={endType === 'count'}
                        onChange={() => setEnd('count', rec.end?.count || 10)}
                        className="accent-blue-500"
                      />
                      After
                      <input
                        type="number"
                        min={1}
                        value={rec.end?.count || ''}
                        onChange={(e) => setEnd('count', e.target.value)}
                        disabled={endType !== 'count'}
                        className="w-16 rounded-md border border-white/[0.08] bg-gray-900 px-2 py-1 text-gray-200 disabled:opacity-40"
                      />
                      occurrences
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-white/[0.01] px-5 py-3">
          <ActionButton tone="ghost" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton tone="primary" icon={CheckSquare} onClick={commit}>
            {initial ? 'Save' : 'Create task'}
          </ActionButton>
        </div>
      </motion.div>
    </div>
  );
}

// ───────────────────────── Delete modal ─────────────────────────
function DeleteRecurringModal({ open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-white/[0.08] bg-gray-950 shadow-2xl">
        <div className="border-b border-white/[0.06] px-5 py-3">
          <h3 className="text-sm font-semibold text-white">Delete recurring task?</h3>
          <p className="mt-1 text-[12px] text-gray-500">
            This task repeats. Choose what to remove.
          </p>
        </div>
        <div className="space-y-1.5 p-3">
          <button
            type="button"
            onClick={() => onConfirm('one')}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-left text-[13px] text-gray-200 hover:border-blue-500/30 hover:bg-blue-500/[0.05]"
          >
            <div className="font-semibold">Just this occurrence</div>
            <div className="text-[11.5px] text-gray-500">Other dates stay scheduled.</div>
          </button>
          <button
            type="button"
            onClick={() => onConfirm('future')}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-left text-[13px] text-gray-200 hover:border-amber-500/30 hover:bg-amber-500/[0.05]"
          >
            <div className="font-semibold">This and future occurrences</div>
            <div className="text-[11.5px] text-gray-500">Stops the series after this day.</div>
          </button>
          <button
            type="button"
            onClick={() => onConfirm('all')}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-left text-[13px] text-gray-200 hover:border-rose-500/30 hover:bg-rose-500/[0.05]"
          >
            <div className="font-semibold">All occurrences</div>
            <div className="text-[11.5px] text-gray-500">Removes the task entirely.</div>
          </button>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[0.06] bg-white/[0.01] px-5 py-3">
          <ActionButton tone="ghost" onClick={onClose}>
            Cancel
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Group panel ─────────────────────────
function GroupPanel({
  groups,
  activeGroupId,
  setActiveGroupId,
  groupVisible,
  toggleGroupVisible,
  countsByGroup,
  onCreate,
  onRename,
  onDelete,
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTone, setNewTone] = useState('blue');

  function commit() {
    const name = newName.trim();
    if (!name) return;
    onCreate(name, newTone);
    setNewName('');
    setNewTone('blue');
    setCreating(false);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
          Groups
        </p>
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] text-gray-300 hover:border-blue-500/30 hover:text-blue-300"
        >
          <FolderPlus className="h-3 w-3" />
          New
        </button>
      </div>

      {creating && (
        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            placeholder="Group name"
            className="mb-2 w-full rounded-md border border-white/[0.06] bg-gray-900 px-2 py-1.5 text-[12.5px] text-gray-200 focus:outline-none"
            autoFocus
          />
          <div className="mb-2 flex flex-wrap gap-1">
            {GROUP_TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewTone(t)}
                className={`h-5 w-5 rounded-full border-2 ${GROUP_DOT_CLASS[t]} ${
                  newTone === t ? 'border-white/60' : 'border-transparent'
                }`}
                aria-label={t}
              />
            ))}
          </div>
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded px-2 py-1 text-[11.5px] text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={!newName.trim()}
              className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[11.5px] font-semibold text-blue-300 hover:bg-blue-500/20 disabled:opacity-40"
            >
              Create
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setActiveGroupId(null)}
        className={`flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-[12.5px] transition ${
          activeGroupId === null
            ? 'border-blue-500/30 bg-blue-500/[0.08] text-blue-200'
            : 'border-white/[0.05] bg-white/[0.02] text-gray-300 hover:border-white/[0.12]'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Folder className="h-3.5 w-3.5" />
          All groups
        </span>
        <span className="text-[10.5px] text-gray-500">{countsByGroup.__all || 0}</span>
      </button>

      {groups.map((g) => {
        const isActive = activeGroupId === g.id;
        const visible = groupVisible[g.id] !== false;
        return (
          <div
            key={g.id}
            className={`group flex items-center gap-1 rounded-md border px-2 py-1.5 ${
              isActive
                ? 'border-blue-500/30 bg-blue-500/[0.08]'
                : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.12]'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleGroupVisible(g.id)}
              className="shrink-0"
              title={visible ? 'Hide on calendar' : 'Show on calendar'}
            >
              <span
                className={`h-2 w-2 rounded-full ${GROUP_DOT_CLASS[g.tone]} ${
                  visible ? '' : 'opacity-30'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => setActiveGroupId(g.id)}
              className="flex-1 truncate text-left text-[12.5px] text-gray-200"
            >
              {g.name}
            </button>
            <span className="text-[10.5px] text-gray-500">{countsByGroup[g.id] || 0}</span>
            <div className="flex items-center opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => {
                  const name = window.prompt('Rename group', g.name);
                  if (name && name.trim()) onRename(g.id, name.trim());
                }}
                className="rounded p-0.5 text-gray-500 hover:text-blue-300"
                aria-label="Rename"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete group "${g.name}"? Tasks in this group will be moved to the first remaining group.`,
                    )
                  )
                    onDelete(g.id);
                }}
                className="rounded p-0.5 text-gray-500 hover:text-rose-400"
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
    'inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.02] px-2 text-[11.5px] font-semibold text-gray-300 transition hover:border-white/[0.18] hover:text-white disabled:opacity-40 disabled:hover:border-white/[0.08]';
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
      <div className="flex items-center gap-2 text-[11px] text-gray-500">
        <span>
          {pageStart + 1}–{pageEnd} of {total}
        </span>
        <span className="text-gray-700">·</span>
        <label className="flex items-center gap-1.5">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border border-white/[0.08] bg-gray-900 px-1.5 py-0.5 text-[11px] text-gray-200 focus:outline-none"
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
            <span key={`g-${i}`} className="px-1 text-[11px] text-gray-600">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`${btn} ${
                p === page
                  ? 'border-blue-500/40 bg-blue-500/[0.12] text-blue-200'
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
        <h2 className="text-base font-semibold text-white">
          {MONTH_NAMES[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-md border border-white/[0.08] bg-white/[0.02] p-1.5 text-gray-400 transition-all hover:border-white/[0.15] hover:text-white"
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
            className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-semibold text-gray-300 transition-all hover:border-white/[0.15] hover:text-white"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-md border border-white/[0.08] bg-white/[0.02] p-1.5 text-gray-400 transition-all hover:border-white/[0.15] hover:text-white"
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
            className="px-1 py-1 text-center text-[10px] font-semibold tracking-widest text-gray-500 uppercase"
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
                  ? 'border-blue-500/40 bg-blue-500/[0.08]'
                  : 'border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.03]'
              } ${cell.inMonth ? '' : 'opacity-40'}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11.5px] font-semibold ${
                    isToday
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white'
                      : isSelected
                        ? 'text-blue-300'
                        : cell.inMonth
                          ? 'text-gray-300'
                          : 'text-gray-600'
                  }`}
                >
                  {cell.date.getDate()}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[9.5px] font-semibold text-gray-500">
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
    <div className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
      <div className={`mt-0.5 inline-flex shrink-0 rounded-md border p-1.5 ${cat.chip}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-gray-100">{item.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
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

  function toggleVisible(key) {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
  }
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
  const selectedFeed = useMemo(
    () =>
      SEED_FEED.filter((it) => sameDay(it.start, selected) && visible[it.category]).sort(
        (a, b) => a.start - b.start,
      ),
    [selected, visible],
  );

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
    const todoEntries = occurrencesAll
      .filter(({ todo }) => activeGroupId == null || todo.groupId === activeGroupId)
      .filter(({ todo }) => groupVisible[todo.groupId] !== false)
      .map(({ todo, dateKey: k }) => ({
        kind: 'todo',
        dateKey: k,
        sortTime: todo.time || '00:00',
        todo,
      }));

    // Calendar feed (category-aware via `visible`).
    // Done filter only applies to todos, so skip feed entries on that view.
    const feedEntries =
      todoFilter === 'done'
        ? []
        : SEED_FEED.filter((it) => visible[it.category]).map((it) => ({
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

  return (
    <PageShell>
      <PageHeader
        icon={Sparkles}
        title="Daily Activity"
        subtitle="Plan your day, repeat tasks, and keep an eye on the calendar."
        accent="blue"
        meta={
          <>
            <Pill icon={CircleDot} tone="blue">
              {stats.open} open today
            </Pill>
            <Pill icon={CheckSquare} tone="emerald">
              {stats.doneToday} done today
            </Pill>
            <Pill icon={Trophy} tone="amber">
              {stats.upcomingContests} contests
            </Pill>
            <Pill icon={CalendarIcon} tone="violet">
              {stats.upcomingEvents} events
            </Pill>
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FilterChips visible={visible} onToggle={toggleVisible} />
            <ActionButton tone="primary" icon={Plus} onClick={openCreate}>
              New task
            </ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* ── Left: groups + tasks ─────────────────────── */}
        <div className="space-y-5 xl:col-span-4">
          <GlassCard padding="p-5">
            <SectionHeader
              icon={Folder}
              title="Lists"
              subtitle="Organize tasks by group."
              accent="blue"
            />
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

          <GlassCard padding="p-5">
            <SectionHeader
              icon={CheckSquare}
              title={
                activeGroupId
                  ? groupById[activeGroupId]?.name || 'Tasks'
                  : 'All tasks'
              }
              subtitle={
                todoFilter === 'day'
                  ? `Showing ${fmtDayLong(selected)}`
                  : 'Recurring tasks expand into virtual occurrences.'
              }
              accent="blue"
              action={
                <div className="flex gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] p-0.5">
                  {[
                    { v: 'today', l: 'Today' },
                    { v: 'upcoming', l: 'Upcoming' },
                    { v: 'day', l: 'Day' },
                    { v: 'done', l: 'Done' },
                    { v: 'all', l: 'All' },
                  ].map((t) => (
                    <button
                      key={t.v}
                      type="button"
                      onClick={() => setTodoFilter(t.v)}
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold transition ${
                        todoFilter === t.v
                          ? 'bg-white/[0.08] text-white'
                          : 'text-gray-500 hover:text-gray-200'
                      }`}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
              }
            />

            {todoFilter === 'day' && !sameDay(selected, TODAY) && (
              <div className="mb-3 flex justify-end">
                <ActionButton
                  tone="ghost"
                  icon={X}
                  onClick={() => {
                    setSelected(new Date(TODAY));
                    setTodoFilter('today');
                  }}
                >
                  Back to today
                </ActionButton>
              </div>
            )}

            {filteredOccurrences.length === 0 ? (
              <EmptyState
                icon={Flag}
                title="Nothing here"
                description={
                  todoFilter === 'day'
                    ? 'No tasks or events for this day.'
                    : 'Create a task to get started.'
                }
                action={
                  <ActionButton tone="primary" icon={Plus} onClick={openCreate}>
                    New task
                  </ActionButton>
                }
              />
            ) : (
              <>
                <ul className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {pagedOccurrences.map((entry) => {
                      if (entry.kind === 'feed') {
                        return (
                          <li key={`feed-${entry.item.id}-${entry.dateKey}`}>
                            <FeedEntry item={entry.item} />
                          </li>
                        );
                      }
                      const { todo, dateKey: k } = entry;
                      const isDone = !!completions[todo.id]?.[k];
                      return (
                        <TodoOccurrenceItem
                          key={`todo-${todo.id}-${k}`}
                          occurrence={{ dateKey: k }}
                          todo={todo}
                          group={groupById[todo.groupId]}
                          isDone={isDone}
                          onToggle={toggleOccurrence}
                          onEdit={openEdit}
                          onDelete={requestDelete}
                        />
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  total={filteredOccurrences.length}
                  pageStart={pageStart}
                  pageEnd={Math.min(pageStart + pageSize, filteredOccurrences.length)}
                  pageSize={pageSize}
                  setPage={setPage}
                  setPageSize={setPageSize}
                />
              </>
            )}
          </GlassCard>
        </div>

        {/* ── Right: calendar + day detail ─────────────── */}
        <div className="space-y-5 xl:col-span-8">
          <GlassCard padding="p-5">
            <MonthCalendar
              monthAnchor={monthAnchor}
              setMonthAnchor={setMonthAnchor}
              selected={selected}
              setSelected={(d) => {
                setSelected(d);
                setTodoFilter('day');
              }}
              itemsByDay={itemsByDay}
              visible={visible}
            />
          </GlassCard>

        </div>
      </div>

      <TodoEditor
        open={editorOpen}
        initial={editing}
        groups={groups}
        defaultDateKey={selKey}
        onSave={saveTodo}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
      />

      <DeleteRecurringModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </PageShell>
  );
}
