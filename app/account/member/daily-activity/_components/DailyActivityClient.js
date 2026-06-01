/**
 * @file Daily activity client component
 * @module DailyActivityClient
 */

'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
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
  X,
  Repeat,
  Folder,
  FolderPlus,
  ChevronDown,
  Check,
  Edit2,
  MapPin,
  Video,
  ClipboardCheck,
  LayoutGrid,
  Tag,
  ExternalLink,
  CalendarDays,
  Search,
  Star,
  Award,
  Play,
  Square,
  Send,
  GitPullRequest,
  AlertTriangle,
  Bookmark,
} from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  Pill,
  ActionButton,
  EmptyState,
  PageShell,
} from '@/app/account/_components/ui';
import {
  createTodoListAction,
  renameTodoListAction,
  deleteTodoListAction,
  saveTodoAction,
  deleteTodoAction,
  excludeOccurrenceAction,
  toggleCompletionAction,
  createTodoLabelAction,
  deleteTodoLabelAction,
  createTodoSectionAction,
  renameTodoSectionAction,
  deleteTodoSectionAction,
} from '@/app/_lib/actions/member-todo-actions';
import {
  disconnectGoogleCalendarAction,
  setGoogleCalendarSyncEnabledAction,
  syncTodosToCalendarAction,
} from '@/app/_lib/actions/google-calendar-actions';
import ActivityAnalytics from './ActivityAnalytics';

// ───────────────────────── Notes JSON Helpers ─────────────────────────
function parseTodoNotes(rawNotes) {
  if (!rawNotes) return { text: '', subtasks: [], comments: [], timeSpent: 0, dependencies: [], labels: [] };
  const trimmed = rawNotes.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const p = JSON.parse(trimmed);
      return {
        text: p.notes || p.text || '',
        subtasks: p.subtasks || [],
        comments: p.comments || [],
        timeSpent: p.timeSpent || 0,
        dependencies: p.dependencies || [],
        labels: p.labels || [],
      };
    } catch { /* fall through */ }
  }
  return { text: rawNotes, subtasks: [], comments: [], timeSpent: 0, dependencies: [], labels: [] };
}

function serializeTodoNotes(text, meta = {}) {
  return JSON.stringify({
    notes: text || '',
    subtasks: meta.subtasks || [],
    comments: meta.comments || [],
    timeSpent: meta.timeSpent || 0,
    dependencies: meta.dependencies || [],
    labels: meta.labels || [],
  });
}

function getTodayDateString() {
  return dateKey(new Date());
}

// ───────────────────────── Constants ─────────────────────────
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
  session: {
    label: 'Sessions',
    icon: Video,
    tone: 'teal',
    dot: 'bg-teal-400',
    chip: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  },
  task: {
    label: 'Tasks',
    icon: ClipboardCheck,
    tone: 'orange',
    dot: 'bg-orange-400',
    chip: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
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
  gcal: {
    label: 'Google Calendar',
    icon: CalendarDays,
    tone: 'sky',
    dot: 'bg-sky-400',
    chip: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  },
};

// Categories that actually appear on the calendar: the member's own tasks,
// plus the real events / contests / enrolled-bootcamp feed and (when connected)
// the member's own Google Calendar.
const LEGEND_CATEGORIES = [
  'todo',
  'event',
  'contest',
  'session',
  'task',
  'gcal',
];

const PRIORITY_DOT = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-white/[0.01]',
};

const TABS = [
  { id: 'insights', label: 'Insights', icon: Award },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

const GROUP_TONES = [
  'blue',
  'emerald',
  'amber',
  'violet',
  'rose',
  'cyan',
  'pink',
];

const GROUP_DOT_CLASS = {
  blue: 'bg-blue-400 border-blue-400',
  emerald: 'bg-emerald-400 border-emerald-400',
  amber: 'bg-amber-400 border-amber-400',
  violet: 'bg-violet-400 border-violet-400',
  rose: 'bg-rose-400 border-rose-400',
  cyan: 'bg-cyan-400 border-cyan-400',
  pink: 'bg-pink-400 border-pink-400',
  gray: 'bg-gray-400 border-gray-400',
};

function TodoOccurrenceItem({
  occurrence,
  todo,
  onEdit,
  onToggle,
  onDelete,
  onSelectTask,
  isDone,
  isOverdue,
  group,
}) {
  const { dateKey } = occurrence;
  const isRecurring = Boolean(todo.recurrence);
  const recDesc = describeRecurrence(todo.recurrence);
  const priorityColors = {
    high: 'text-rose-400',
    medium: 'text-amber-400',
    low: 'text-sky-400',
  };
  const priorityBorder = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-blue-500',
  };
  const priorityDot = priorityColors[todo.priority] || 'text-gray-500';
  const accent = priorityBorder[todo.priority] || 'border-l-slate-500';
  const showOverdue = isOverdue && !isDone;
  const stateCls = isDone
    ? 'border-white/[0.04] bg-[#0e1424] opacity-40'
    : showOverdue
      ? `border-rose-500/20 ${accent} bg-rose-500/[0.05] hover:bg-rose-500/[0.08]`
      : `border-white/[0.04] ${accent} bg-[#0e1424] hover:border-white/[0.08] hover:bg-[#121930]`;
  return (
    <div
      className={`group flex items-center justify-between rounded-xl border border-l-4 px-3.5 py-3 transition-all duration-150 ${stateCls}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={() => onToggle(todo.id, dateKey)}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${isDone ? 'border-violet-500 bg-violet-500 text-white' : 'border-white/20 hover:border-violet-400 hover:bg-violet-500/10'}`}
        >
          {isDone && <Check className="h-3 w-3" />}
        </button>
        <div className="flex min-w-0 flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onSelectTask?.(todo.id)}
            className={`text-left text-[13px] leading-snug hover:underline ${isDone ? 'text-gray-500 line-through' : 'text-white'}`}
          >
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${group?.tone ? GROUP_DOT_CLASS[group.tone] : GROUP_DOT_CLASS['gray']}`}
            />
            {todo.title}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {showOverdue && (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-rose-300 uppercase">
                Overdue
              </span>
            )}
            {todo.time && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock className="h-3 w-3" />
                {todo.time}
              </span>
            )}
            {todo.priority && (
              <span
                className={`text-[10px] font-semibold tracking-wide uppercase ${priorityDot}`}
              >
                {todo.priority}
              </span>
            )}
            {isRecurring && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <Repeat className="h-3 w-3" />
                {recDesc}
              </span>
            )}
            {(() => {
              const parsed = parseTodoNotes(todo.notes);
              return (
                <>
                  {parsed.labels?.length > 0 && parsed.labels.map((l) => (
                    <span key={l} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">@{l}</span>
                  ))}
                  {parsed.subtasks?.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <CheckSquare className="h-3 w-3" />
                      {parsed.subtasks.filter(s => s.done).length}/{parsed.subtasks.length}
                    </span>
                  )}
                  {parsed.timeSpent > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      ⏱ {Math.floor(parsed.timeSpent / 60)}m
                    </span>
                  )}
                  {parsed.text && (
                    <span className="line-clamp-1 text-[11px] text-gray-500">{parsed.text}</span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pl-2">
        {group && (
          <span
            className={`hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex ${GROUP_DOT_CLASS[group.tone] ? `border-white/[0.06] bg-white/[0.02] text-gray-400` : 'text-gray-500'}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${GROUP_DOT_CLASS[group.tone]?.split(' ')[0]}`}
            />
            {group.name}
          </span>
        )}
        <button
          onClick={() => onEdit(todo)}
          className="rounded-md p-1 text-gray-500 opacity-0 transition group-hover:opacity-100 hover:text-white"
          title="Edit"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(todo, isRecurring ? dateKey : null)}
          className="rounded-md p-1 text-gray-500 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function TodoEditor({
  open,
  onClose,
  onSave,
  initial,
  groups = [],
  labels = [],
  sections = [],
  defaultDateKey,
}) {
  const [draft, setDraft] = useState({});
  const [title, setTitle] = useState('');
  const [notesText, setNotesText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [startKey, setStartKey] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [groupId, setGroupId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [selectedLabels, setSelectedLabels] = useState([]);

  // Recurrence options
  const [recFreq, setRecFreq] = useState('');
  const [recInterval, setRecInterval] = useState(1);
  const [recEndType, setRecEndType] = useState('none');
  const [recCount, setRecCount] = useState(10);
  const [recUntil, setRecUntil] = useState('');

  // Dropdown states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showLabelsPicker, setShowLabelsPicker] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setDraft(initial);
        setTitle(initial.title || '');
        const meta = parseTodoNotes(initial.notes);
        setNotesText(meta.text || '');
        setSelectedLabels(meta.labels || []);
        setPriority(initial.priority || 'medium');
        setStartKey(initial.startKey || '');
        setDueTime(initial.time || '');
        setGroupId(initial.groupId || groups?.[0]?.id || null);
        setSectionId(initial.sectionId || null);

        const rec = initial.recurrence;
        setRecFreq(rec?.freq || '');
        setRecInterval(rec?.interval || 1);
        if (rec?.end?.type === 'count') {
          setRecEndType('count');
          setRecCount(rec.end.count || 10);
        } else if (rec?.end?.type === 'until') {
          setRecEndType('until');
          setRecUntil(rec.end.untilKey || '');
        } else {
          setRecEndType('none');
        }
      } else {
        setDraft({});
        setTitle('');
        setNotesText('');
        setSelectedLabels([]);
        setPriority('medium');
        setStartKey(defaultDateKey || dateKey(new Date()));
        setDueTime('');
        setGroupId(groups?.[0]?.id || null);
        setSectionId(null);

        setRecFreq('');
        setRecInterval(1);
        setRecEndType('none');
        setRecCount(10);
        setRecUntil('');
      }

      // Close popups
      setShowDatePicker(false);
      setShowPriorityPicker(false);
      setShowProjectPicker(false);
      setShowLabelsPicker(false);
    }
  }, [open, initial, groups, defaultDateKey]);

  // Natural Language Auto-Parser helper
  const parseNaturalLanguage = (text) => {
    let cleaned = text;
    let newPriority = null;
    let newStartKey = null;
    let newGroupId = null;
    const extractedLabels = [];

    // 1. Parse Priority: p1 (high), p2 (medium), p3 (low), p4 (default)
    const words = cleaned.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const w = words[i].toLowerCase();
      if (w === 'p1') {
        newPriority = 'high';
        cleaned = cleaned.replace(/\bp1\b/i, '');
      } else if (w === 'p2') {
        newPriority = 'medium';
        cleaned = cleaned.replace(/\bp2\b/i, '');
      } else if (w === 'p3') {
        newPriority = 'low';
        cleaned = cleaned.replace(/\bp3\b/i, '');
      } else if (w === 'p4') {
        newPriority = 'low';
        cleaned = cleaned.replace(/\bp4\b/i, '');
      }
    }

    // 2. Parse Date Deadlines: tomorrow, today, next week
    if (/\btomorrow\b/i.test(cleaned)) {
      newStartKey = addDaysKey(dateKey(new Date()), 1);
      cleaned = cleaned.replace(/\btomorrow\b/i, '');
    } else if (/\btoday\b/i.test(cleaned)) {
      newStartKey = dateKey(new Date());
      cleaned = cleaned.replace(/\btoday\b/i, '');
    } else if (/\bnext week\b/i.test(cleaned)) {
      newStartKey = addDaysKey(dateKey(new Date()), 7);
      cleaned = cleaned.replace(/\bnext week\b/i, '');
    }

    // 3. Parse Project Hashtags: #project_name
    const projMatch = cleaned.match(/#(\w+)/);
    if (projMatch) {
      const nameKey = projMatch[1].toLowerCase();
      const matched = groups.find((g) => g.name.toLowerCase().includes(nameKey));
      if (matched) {
        newGroupId = matched.id;
        cleaned = cleaned.replace(projMatch[0], '');
      }
    }

    // 4. Parse Label Mentions: @label_name
    const labelMatch = cleaned.match(/@(\w+)/);
    if (labelMatch) {
      const nameKey = labelMatch[1].toLowerCase();
      const matched = labels.find((l) => l.name.toLowerCase().includes(nameKey));
      if (matched) {
        extractedLabels.push(matched.name);
        cleaned = cleaned.replace(labelMatch[0], '');
      }
    }

    return {
      cleanedText: cleaned.replace(/\s+/g, ' ').trim(),
      priority: newPriority,
      startKey: newStartKey,
      groupId: newGroupId,
      labels: extractedLabels,
    };
  };

  const applyNL = (val, endsWithSpace = false) => {
    const parsed = parseNaturalLanguage(val);
    let changed = false;

    if (parsed.priority) {
      setPriority(parsed.priority);
      changed = true;
    }
    if (parsed.startKey) {
      setStartKey(parsed.startKey);
      changed = true;
    }
    if (parsed.groupId) {
      setGroupId(parsed.groupId);
      setSectionId(null);
      changed = true;
    }
    if (parsed.labels.length > 0) {
      setSelectedLabels((prev) => [...new Set([...prev, ...parsed.labels])]);
      changed = true;
    }

    if (changed) {
      setTitle(parsed.cleanedText + (endsWithSpace ? ' ' : ''));
    }
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    if (val.endsWith(' ')) {
      applyNL(val, true);
    }
  };

  const handleBlur = () => {
    applyNL(title, false);
  };

  function buildRecurrence() {
    if (!recFreq) return null;
    const rec = {
      freq: recFreq,
      interval: Math.max(1, Number(recInterval) || 1),
    };
    if (recEndType === 'count')
      rec.end = { type: 'count', count: Math.max(1, Number(recCount) || 10) };
    else if (recEndType === 'until' && recUntil)
      rec.end = { type: 'until', untilKey: recUntil };
    else rec.end = null;
    return rec;
  }

  function handleSave() {
    if (!title.trim()) return;

    // Serialize description notes & labels
    const serializedNotes = serializeTodoNotes(notesText, {
      subtasks: draft._meta?.subtasks || [],
      comments: draft._meta?.comments || [],
      timeSpent: draft._meta?.timeSpent || 0,
      dependencies: draft._meta?.dependencies || [],
      labels: selectedLabels,
    });

    onSave({
      ...draft,
      title: title.trim(),
      notes: serializedNotes,
      priority,
      startKey,
      time: dueTime,
      groupId,
      sectionId,
      recurrence: buildRecurrence(),
    });
  }

  if (!open) return null;

  const activeProj = groups.find((g) => g.id === groupId) || groups[0];
  const projectSections = sections.filter((s) => s.listId === groupId);

  const inputCls =
    'w-full bg-gray-900/60 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:ring-0 transition';
  const labelCls =
    'text-[10px] font-bold tracking-widest text-gray-500 uppercase';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-gray-950 p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
            <h2 className="text-[14px] font-semibold text-white tracking-wide uppercase">
              {draft.id ? 'Edit Task Workspace' : 'Add New Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/[0.04] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="e.g. Draft proposal next week p1 #Personal"
            autoFocus
            className="w-full text-[14px] font-medium text-white placeholder-gray-600 bg-transparent border-none outline-none focus:ring-0 p-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // Ensure natural language tokens are parsed before saving
                const parsed = parseNaturalLanguage(title);
                let finalTitle = title;
                if (parsed.priority) setPriority(parsed.priority);
                if (parsed.startKey) setStartKey(parsed.startKey);
                if (parsed.groupId) {
                  setGroupId(parsed.groupId);
                  setSectionId(null);
                }
                if (parsed.labels.length > 0) {
                  setSelectedLabels((prev) => [...new Set([...prev, ...parsed.labels])]);
                }
                finalTitle = parsed.cleanedText;
                setTitle(finalTitle);

                // Call handleSave with latest values manually
                const serializedNotes = serializeTodoNotes(notesText, {
                  subtasks: draft._meta?.subtasks || [],
                  comments: draft._meta?.comments || [],
                  timeSpent: draft._meta?.timeSpent || 0,
                  dependencies: draft._meta?.dependencies || [],
                  labels: parsed.labels.length > 0 ? [...new Set([...selectedLabels, ...parsed.labels])] : selectedLabels,
                });
                onSave({
                  ...draft,
                  title: finalTitle.trim(),
                  notes: serializedNotes,
                  priority: parsed.priority || priority,
                  startKey: parsed.startKey || startKey,
                  time: dueTime,
                  groupId: parsed.groupId || groupId,
                  sectionId,
                  recurrence: buildRecurrence(),
                });
              }
            }}
          />
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Add description..."
            rows={2}
            className="w-full text-xs text-gray-400 placeholder-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none"
          />
        </div>

        {/* Visual Pill Badges */}
        <div className="flex flex-wrap gap-1.5 py-1">
          {startKey && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10.5px] font-medium">
              <CalendarIcon className="h-3 w-3" />
              <span>{startKey}</span>
              <button
                type="button"
                onClick={() => setStartKey('')}
                className="hover:text-rose-400 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {priority && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-medium border ${
              priority === 'high'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : priority === 'medium'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
            }`}>
              <Flag className="h-3 w-3 fill-current" />
              <span className="capitalize">{priority}</span>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className="hover:text-rose-400 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {groupId && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] text-gray-300 border border-white/[0.08] bg-white/[0.02]">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <span>{groups.find((g) => g.id === groupId)?.name || 'Project'}</span>
              {sectionId && (
                <>
                  <span className="text-gray-600 text-[10px]">/</span>
                  <span className="text-gray-400">{sections.find((s) => s.id === sectionId)?.name || 'Section'}</span>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setGroupId(null);
                  setSectionId(null);
                }}
                className="hover:text-rose-400 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedLabels.map((lbl) => {
            const lDef = labels.find((l) => l.name === lbl);
            return (
              <span
                key={lbl}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] text-gray-300 border border-white/[0.08] bg-white/[0.02]"
              >
                <Tag className="h-3 w-3 opacity-70" style={{ color: lDef?.color || '#9333ea' }} />
                <span>{lbl}</span>
                <button
                  type="button"
                  onClick={() => setSelectedLabels((prev) => prev.filter((x) => x !== lbl))}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>

        {/* Toolbar & Parameters Picker Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1">
            {/* Due date picker dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowPriorityPicker(false);
                  setShowProjectPicker(false);
                  setShowLabelsPicker(false);
                }}
                className={`p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer text-gray-400 flex items-center transition ${
                  startKey ? 'text-emerald-400 bg-emerald-500/10' : ''
                }`}
                title="Due Date"
              >
                <CalendarIcon className="h-4 w-4" />
              </button>

              {showDatePicker && (
                <div className="absolute z-30 left-0 mt-2 p-3 bg-gray-900 border border-white/[0.08] rounded-xl shadow-xl w-56 flex flex-col gap-2">
                  <span className={labelCls}>Due Date Options</span>
                  <div className="flex flex-col gap-1 text-[11.5px]">
                    <button
                      type="button"
                      onClick={() => {
                        setStartKey(dateKey(new Date()));
                        setShowDatePicker(false);
                      }}
                      className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-white/[0.04] text-emerald-400 font-semibold"
                    >
                      <span>Today</span>
                      <span className="text-[10px] text-gray-500 font-normal">Mon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartKey(addDaysKey(dateKey(new Date()), 1));
                        setShowDatePicker(false);
                      }}
                      className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-white/[0.04] text-amber-400 font-semibold"
                    >
                      <span>Tomorrow</span>
                      <span className="text-[10px] text-gray-500 font-normal">Tue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartKey(addDaysKey(dateKey(new Date()), 2));
                        setShowDatePicker(false);
                      }}
                      className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-white/[0.04] text-indigo-400"
                    >
                      <span>Later this week</span>
                      <span className="text-[10px] text-gray-500 font-normal">Wed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartKey(addDaysKey(dateKey(new Date()), 7));
                        setShowDatePicker(false);
                      }}
                      className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-white/[0.04] text-gray-300"
                    >
                      <span>Next week</span>
                      <span className="text-[10px] text-gray-500 font-normal">Next Mon</span>
                    </button>
                  </div>

                  <div className="border-t border-white/[0.06] pt-2 flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Custom Picker</span>
                    <input
                      type="date"
                      value={startKey || ''}
                      onChange={(e) => {
                        setStartKey(e.target.value);
                        setShowDatePicker(false);
                      }}
                      className="w-full text-xs p-1 bg-gray-950 border border-white/[0.08] rounded text-white [color-scheme:dark]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Priority picker dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowPriorityPicker(!showPriorityPicker);
                  setShowDatePicker(false);
                  setShowProjectPicker(false);
                  setShowLabelsPicker(false);
                }}
                className={`p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer text-gray-400 flex items-center transition ${
                  priority !== 'medium' ? 'bg-amber-500/10' : ''
                }`}
                title="Priority"
              >
                <Flag
                  className={`h-4 w-4 ${
                    priority === 'high' ? 'text-rose-500 fill-current' :
                    priority === 'medium' ? 'text-amber-500 fill-current' :
                    'text-sky-500 fill-current'
                  }`}
                />
              </button>

              {showPriorityPicker && (
                <div className="absolute z-30 left-0 mt-2 p-1.5 bg-gray-900 border border-white/[0.08] rounded-xl shadow-xl w-36 flex flex-col gap-0.5 text-[11.5px]">
                  <button
                    type="button"
                    onClick={() => {
                      setPriority('high');
                      setShowPriorityPicker(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-rose-500/10 text-rose-400 font-bold text-left"
                  >
                    <Flag className="h-3.5 w-3.5 fill-current text-rose-500" />
                    <span>High Priority</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority('medium');
                      setShowPriorityPicker(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-amber-500/10 text-amber-400 font-semibold text-left"
                  >
                    <Flag className="h-3.5 w-3.5 fill-current text-amber-500" />
                    <span>Medium Priority</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority('low');
                      setShowPriorityPicker(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-sky-500/10 text-sky-400 text-left"
                  >
                    <Flag className="h-3.5 w-3.5 fill-current text-sky-500" />
                    <span>Low Priority</span>
                  </button>
                </div>
              )}
            </div>

            {/* Project dropdown picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProjectPicker(!showProjectPicker);
                  setShowDatePicker(false);
                  setShowPriorityPicker(false);
                  setShowLabelsPicker(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer text-gray-400 flex items-center transition"
                title="Project List"
              >
                <Folder className="h-4 w-4" />
              </button>

              {showProjectPicker && (
                <div className="absolute z-30 left-0 mt-2 p-2 bg-gray-900 border border-white/[0.08] rounded-xl shadow-xl w-48 flex flex-col gap-1.5 text-[11.5px]">
                  <span className={labelCls}>Choose Project</span>
                  <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                    {groups.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setGroupId(p.id);
                          setSectionId(null);
                          const associatedSections = sections.filter((s) => s.listId === p.id);
                          if (associatedSections.length === 0) {
                            setShowProjectPicker(false);
                          }
                        }}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-white/[0.04] text-left truncate ${
                          p.id === groupId
                            ? 'bg-white/[0.06] font-semibold text-violet-400'
                            : 'text-gray-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  {projectSections.length > 0 && (
                    <div className="border-t border-white/[0.06] pt-1.5 mt-1.5">
                      <span className={labelCls}>Set Section</span>
                      <div className="max-h-24 overflow-y-auto flex flex-col gap-0.5 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSectionId(null);
                            setShowProjectPicker(false);
                          }}
                          className={`text-left px-2 py-1 rounded hover:bg-white/[0.04] ${
                            !sectionId ? 'text-violet-400 font-bold' : 'text-gray-500'
                          }`}
                        >
                          (No Section)
                        </button>
                        {projectSections.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSectionId(s.id);
                              setShowProjectPicker(false);
                            }}
                            className={`text-left px-2 py-1 rounded hover:bg-white/[0.04] truncate ${
                              s.id === sectionId ? 'text-violet-400 font-bold' : 'text-gray-500'
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Labels checklist picker dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowLabelsPicker(!showLabelsPicker);
                  setShowDatePicker(false);
                  setShowPriorityPicker(false);
                  setShowProjectPicker(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer text-gray-400 flex items-center transition"
                title="Labels"
              >
                <Tag className="h-4 w-4" />
              </button>

              {showLabelsPicker && (
                <div className="absolute z-30 left-0 mt-2 p-2 bg-gray-900 border border-white/[0.08] rounded-xl shadow-xl w-44 flex flex-col gap-1 text-[11.5px]">
                  <span className={labelCls}>Labels Tags</span>
                  {labels.length === 0 ? (
                    <span className="text-xs text-gray-500 text-center p-2">No labels configured</span>
                  ) : (
                    <div className="max-h-40 overflow-y-auto flex flex-col">
                      {labels.map((l) => {
                        const isSelected = selectedLabels.includes(l.name);
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedLabels((prev) => prev.filter((x) => x !== l.name));
                              } else {
                                setSelectedLabels((prev) => [...prev, l.name]);
                              }
                            }}
                            className="flex items-center justify-between px-2 py-1 rounded hover:bg-white/[0.04] text-gray-300"
                          >
                            <div className="flex items-center gap-2 text-left min-w-0">
                              <Tag className="h-3 h-3 shrink-0" style={{ color: l.color }} />
                              <span className="truncate text-xs">{l.name}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded border-white/10 bg-transparent text-violet-500 focus:ring-0 h-3 w-3 cursor-pointer"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recurrence Repeat Trigger */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/[0.06] ml-1">
              <select
                className="bg-transparent border-none outline-none text-[11px] text-gray-400 cursor-pointer p-0 focus:ring-0 font-medium"
                value={recFreq}
                onChange={(e) => setRecFreq(e.target.value)}
              >
                <option value="" className="bg-gray-900">No repeat</option>
                <option value="daily" className="bg-gray-900">Daily</option>
                <option value="weekly" className="bg-gray-900">Weekly</option>
                <option value="monthly" className="bg-gray-900">Monthly</option>
              </select>

              {recFreq && (
                <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] rounded-md px-1.5 py-0.5">
                  <span className="text-[10px] text-gray-500">Every</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="w-8 text-center bg-transparent border-none outline-none text-[11px] text-white p-0 focus:ring-0 font-bold"
                    value={recInterval}
                    onChange={(e) => setRecInterval(e.target.value)}
                  />
                  <span className="text-[10px] text-gray-500">
                    {recFreq === 'daily' ? 'day(s)' : recFreq === 'weekly' ? 'wk(s)' : 'mo(s)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Time Picker */}
          <div className="flex items-center gap-1.5">
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-gray-400 cursor-pointer p-0 focus:ring-0 font-semibold uppercase [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Extended End Recurrence option if repeat set */}
        {recFreq && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.01] text-[11.5px]">
            <div className="flex flex-col gap-1">
              <span className={labelCls}>Ends</span>
              <select
                className="bg-transparent border-none outline-none text-xs text-gray-300 cursor-pointer p-0 focus:ring-0"
                value={recEndType}
                onChange={(e) => setRecEndType(e.target.value)}
              >
                <option value="none" className="bg-gray-900">Never Ends</option>
                <option value="count" className="bg-gray-900">After Count</option>
                <option value="until" className="bg-gray-900">Until Date</option>
              </select>
            </div>

            {recEndType === 'count' && (
              <div className="flex flex-col gap-1 pl-3 border-l border-white/[0.06]">
                <span className={labelCls}>Count</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  className="w-12 bg-transparent border-none outline-none text-xs text-white p-0 focus:ring-0 font-bold"
                  value={recCount}
                  onChange={(e) => setRecCount(e.target.value)}
                />
              </div>
            )}

            {recEndType === 'until' && (
              <div className="flex flex-col gap-1 pl-3 border-l border-white/[0.06]">
                <span className={labelCls}>Until Date</span>
                <input
                  type="date"
                  className="bg-transparent border-none outline-none text-xs text-white p-0 focus:ring-0 [color-scheme:dark]"
                  value={recUntil}
                  onChange={(e) => setRecUntil(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-3">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-400 hover:bg-white/[0.04] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-1.5"
          >
            <span>Save Task</span>
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
        <h3 className="mb-4 text-lg font-medium text-white">Delete Mode</h3>
        <p className="mb-6 text-sm text-white/60">
          Do you want to delete this specific occurrence or the entire recurring
          series?
        </p>
        <div className="flex flex-col gap-2">
          {pending?.occKey && (
            <button
              onClick={() => onConfirm('one')}
              className="rounded bg-white/5 px-4 py-2 text-white transition hover:bg-white/10"
            >
              Delete this occurrence
            </button>
          )}
          <button
            onClick={() => onConfirm('all')}
            className="rounded bg-rose-500/20 px-4 py-2 text-rose-400 transition hover:bg-rose-500 hover:text-white"
          >
            Delete entire series
          </button>
          <button
            onClick={onClose}
            className="mt-2 px-4 py-2 text-white/50 transition hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

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
      base =
        interval === 1
          ? `Weekly on ${names}`
          : `Every ${interval} weeks on ${names}`;
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
  labels = [],
  labelFilter,
  setLabelFilter,
  labelCounts = {},
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
      <div className="mb-1 flex items-center justify-between border-b border-white/[0.06] pb-2">
        <span className="font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
          Categories
        </span>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[11px] font-medium text-gray-400 transition hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-gray-200"
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
        <span className="text-[10.5px] text-gray-400">
          {countsByGroup.__all || 0}
        </span>
      </button>

      {groups.map((g) => {
        const isActive = activeGroupId === g.id;
        const visible = groupVisible[g.id] !== false;

        if (deletingGroupId === g.id) {
          return (
            <div
              key={g.id}
              className="rounded-md border border-white/[0.06] bg-rose-500/10 p-2 text-center text-xs"
            >
              <p className="mb-2 text-rose-200">Delete &quot;{g.name}&quot;?</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setDeletingGroupId(null)}
                  className="px-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(g.id);
                    setDeletingGroupId(null);
                  }}
                  className="rounded bg-rose-500 px-2 py-1 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        }

        if (renamingGroupId === g.id) {
          return (
            <div
              key={g.id}
              className="flex flex-col gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.01] p-2"
            >
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(g.id)}
                className="w-full rounded bg-white/[0.04] px-2 py-1 text-[12.5px] font-medium text-white focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setRenamingGroupId(null)}
                  className="px-2 py-1 text-[11px] text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRename(g.id)}
                  className="rounded border border-white/10 bg-white/[0.02] px-2 py-1 text-[11px] text-white"
                >
                  Save
                </button>
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
              style={{
                color: isActive ? 'rgb(196 181 253)' : 'rgb(209 213 219)',
              }}
            >
              {g.name}
            </button>
            <span className="text-[10.5px] text-gray-400">
              {countsByGroup[g.id] || 0}
            </span>
            <div
              className={`flex items-center opacity-0 transition group-hover:opacity-100`}
            >
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

      {labels.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
            <Tag className="h-3.5 w-3.5 text-gray-500" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Labels
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {labels.map((lbl) => {
              const on = labelFilter === lbl.name;
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => setLabelFilter?.(on ? null : lbl.name)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                    on
                      ? 'border border-violet-500/25 bg-violet-600/15 text-violet-300'
                      : 'text-gray-300 hover:bg-[#121a2e]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Bookmark
                      className="h-3 w-3 shrink-0"
                      style={{ color: lbl.color }}
                    />
                    <span className="truncate">@{lbl.name}</span>
                  </span>
                  <span className="rounded bg-[#121a2e] px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-gray-400">
                    {labelCounts[lbl.name] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
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
    0
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
            className="px-1 py-1 text-center font-mono text-[10px] font-medium tracking-widest text-gray-400 uppercase"
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
            (it) => visible[it.category]
          );
          const dotCats = Array.from(
            new Set(dayItems.map((it) => it.category))
          ).slice(0, 4);

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
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/30 font-bold text-violet-300'
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
                      {it.recurring && (
                        <Repeat className="mt-px h-2.5 w-2.5 shrink-0 opacity-70" />
                      )}
                      <span className="wrap-break-word whitespace-normal">
                        {it.title}
                      </span>
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

const FEED_STATUS_TONE = {
  completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  late: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  'bonus deserved': 'border-violet-500/30 bg-violet-500/10 text-violet-300',
};

function FeedEntry({ item }) {
  const cat = CATEGORIES[item.category];
  const Icon = cat.icon;
  const online = !item.location && item.meetLink;
  const statusTone =
    FEED_STATUS_TONE[item.status] ||
    'border-white/[0.06] bg-white/[0.02] text-gray-400';
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div
        className={`mt-0.5 inline-flex shrink-0 rounded-md border p-1.5 ${cat.chip}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-white">
            {item.title}
          </p>
          {item.status && item.status !== 'scheduled' && (
            <span
              className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide uppercase ${statusTone}`}
            >
              {item.status}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.isDeadline && 'Due '}
            {fmtTime(item.start)}
            {item.durationMin ? ` · ${item.durationMin}m` : ''}
          </span>
          {item.location && (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              {item.location}
            </span>
          )}
          {online && <span className="text-emerald-400/80">Online</span>}
          {item.taskType && (
            <span className="text-gray-500">{item.taskType}</span>
          )}
          {item.difficulty && (
            <span className="text-gray-500 capitalize">{item.difficulty}</span>
          )}
          {typeof item.points === 'number' && (
            <span className="text-gray-500">
              {item.pointsEarned != null
                ? `${item.pointsEarned}/${item.points} pts`
                : `${item.points} pts`}
            </span>
          )}
          {item.bootcampTitle && (
            <span className="inline-flex items-center gap-1 truncate text-gray-500">
              <GraduationCap className="h-3 w-3" />
              {item.bootcampTitle}
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-1 line-clamp-1 text-[11px] text-gray-500">
            {item.description}
          </p>
        )}
        {(item.meetLink || item.recordingUrl || item.url || item.category === 'event' || item.category === 'session' || item.category === 'task') && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.meetLink && (
              <a
                href={item.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <Video className="h-3 w-3" /> Join
              </a>
            )}
            {item.recordingUrl && (
              <a
                href={item.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10.5px] font-semibold text-gray-300 transition hover:bg-white/[0.06]"
              >
                <PlaySquare className="h-3 w-3" /> Recording
              </a>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
              >
                <ExternalLink className="h-3 w-3" /> Open
              </a>
            )}
            {item.category === 'event' && (
              <a
                href={`/account/member/events?event=${item.id.replace(/^event-/, '')}`}
                className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-violet-300 transition hover:bg-violet-500/20"
              >
                <ExternalLink className="h-3 w-3" /> View event
              </a>
            )}
            {item.category === 'session' && (
              <a
                href={`/account/member/bootcamps?tab=sessions#${item.id}`}
                className="inline-flex items-center gap-1 rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-teal-300 transition hover:bg-teal-500/20"
              >
                <ExternalLink className="h-3 w-3" /> View session
              </a>
            )}
            {item.category === 'task' && (
              <a
                href={`/account/member/bootcamps?tab=tasks#${item.id}`}
                className="inline-flex items-center gap-1 rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-orange-300 transition hover:bg-orange-500/20"
              >
                <ExternalLink className="h-3 w-3" /> View task
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Google Calendar ─────────────────────────
function GoogleCalendarCard({
  status,
  onChange,
  monthLabel,
  monthTaskIds,
  monthFeedIds,
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const totalVisible = monthTaskIds.length + monthFeedIds.length;

  async function disconnect() {
    setBusy(true);
    setMsg(null);
    const res = await disconnectGoogleCalendarAction();
    setBusy(false);
    if (res?.error) return setMsg({ type: 'error', text: res.error });
    onChange({ connected: false, email: null, syncEnabled: false });
    setMsg({
      type: 'ok',
      text: 'Disconnected. Your tasks stay in NEUPC; reload to drop calendar events.',
    });
  }

  // One-time push of everything currently shown for the viewed month — tasks
  // plus the events/sessions/contests/deadlines feed. Works regardless of the
  // auto-mirror toggle (the action forces the push).
  async function syncNow() {
    setBusy(true);
    setMsg(null);
    const res = await syncTodosToCalendarAction({
      taskIds: monthTaskIds,
      feedIds: monthFeedIds,
    });
    setBusy(false);
    if (res?.error) return setMsg({ type: 'error', text: res.error });
    setMsg({
      type: 'ok',
      text: res.synced
        ? `Synced ${res.synced} item${res.synced === 1 ? '' : 's'} from ${monthLabel} to Google Calendar.`
        : `Nothing visible in ${monthLabel} to sync.`,
    });
  }

  async function toggleSync() {
    const next = !status.syncEnabled;
    setBusy(true);
    setMsg(null);
    const res = await setGoogleCalendarSyncEnabledAction(next);
    setBusy(false);
    if (res?.error) return setMsg({ type: 'error', text: res.error });
    onChange({ ...status, syncEnabled: next });
  }

  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={CalendarDays}
        accent="sky"
        title="Google Calendar"
        subtitle={
          status.connected
            ? status.email || 'Connected'
            : 'Two-way sync with your own calendar'
        }
      />
      {status.connected ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[12.5px] text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              Connected{status.email ? ` · ${status.email}` : ''}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSync}
            disabled={busy}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-[13px] text-gray-200 transition hover:bg-white/[0.04] disabled:opacity-50"
          >
            <span>
              Mirror my tasks to Google
              <span className="mt-0.5 block text-[11px] text-gray-500">
                New & edited tasks become calendar events
              </span>
            </span>
            <span
              className={`relative h-5 w-9 shrink-0 rounded-full transition ${status.syncEnabled ? 'bg-sky-500/70' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${status.syncEnabled ? 'left-[1.125rem]' : 'left-0.5'}`}
              />
            </span>
          </button>

          <div className="flex flex-wrap gap-2">
            <ActionButton
              tone="ghost"
              icon={Repeat}
              onClick={syncNow}
              disabled={busy || totalVisible === 0}
            >
              Sync {monthLabel} to Google
            </ActionButton>
            <ActionButton tone="danger" icon={X} onClick={disconnect} disabled={busy}>
              Disconnect
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] leading-relaxed text-gray-400">
            Connect your Google account to show your calendar here and mirror
            your NEUPC tasks back to Google Calendar.
          </p>
          <a
            href="/api/integrations/google-calendar/connect"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-all hover:border-sky-500/40 hover:bg-sky-500/20"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Connect Google Calendar
          </a>
        </div>
      )}
      {msg && (
        <p
          className={`mt-3 text-[11.5px] ${msg.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}
        >
          {msg.text}
        </p>
      )}
    </GlassCard>
  );
}

/**
 * Kanban board view of the task list. Columns are the member's lists
 * ("projects"). When a single list is active, columns become that list's
 * sections instead (plus a "No section" column), so a list can be organised
 * Todoist-style. Each card reuses TodoOccurrenceItem for consistent behaviour.
 */
function TaskBoard({
  groups,
  sections,
  occurrences,
  completions,
  groupById,
  todayKey,
  onToggle,
  onEdit,
  onDelete,
  onSelectTask,
  onCreateSection,
  onRenameSection,
  onDeleteSection,
  activeGroupId,
}) {
  const [addingSection, setAddingSection] = useState(false);
  const [sectionName, setSectionName] = useState('');

  // Only the latest occurrence of each task is shown on the board (the board is
  // task-centric, not date-centric), so a recurring task appears once.
  const byTask = new Map();
  occurrences
    .filter((e) => e.kind === 'todo')
    .forEach((e) => {
      const prev = byTask.get(e.todo.id);
      if (!prev || e.dateKey > prev.dateKey) byTask.set(e.todo.id, e);
    });
  const taskEntries = [...byTask.values()];

  // Build columns.
  let columns;
  if (activeGroupId) {
    // Section columns within the active list.
    const listSections = sections.filter((s) => s.listId === activeGroupId);
    columns = [
      ...listSections.map((s) => ({
        id: s.id,
        name: s.name,
        section: true,
        match: (t) => t.sectionId === s.id,
      })),
      {
        id: '__nosection',
        name: 'No section',
        section: false,
        match: (t) => !t.sectionId,
      },
    ];
  } else {
    // List columns across all lists.
    columns = [
      ...groups.map((g) => ({
        id: g.id,
        name: g.name,
        section: false,
        match: (t) => t.groupId === g.id,
      })),
      {
        id: '__nolist',
        name: 'No list',
        section: false,
        match: (t) => !t.groupId,
      },
    ];
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((col) => {
        const items = taskEntries.filter((e) => col.match(e.todo));
        return (
          <div
            key={col.id}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-white/[0.06] bg-white/[0.02]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.05] px-3 py-2">
              <span className="truncate text-[12px] font-semibold text-gray-200">
                {col.name}
                <span className="ml-1.5 text-[10px] font-normal text-gray-500">
                  {items.length}
                </span>
              </span>
              {col.section && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const next = window.prompt('Rename section', col.name);
                      if (next != null) onRenameSection(col.id, next);
                    }}
                    className="rounded p-0.5 text-gray-500 hover:text-gray-200"
                    aria-label="Rename section"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSection(col.id)}
                    className="rounded p-0.5 text-gray-500 hover:text-rose-400"
                    aria-label="Delete section"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 p-2">
              {items.length === 0 ? (
                <p className="px-1 py-3 text-center text-[11px] text-gray-600">
                  No tasks
                </p>
              ) : (
                items.map((entry) => (
                  <TodoOccurrenceItem
                    key={`board-${entry.todo.id}`}
                    occurrence={{ dateKey: entry.dateKey }}
                    todo={entry.todo}
                    group={groupById[entry.todo.groupId]}
                    isDone={!!completions[entry.todo.id]?.[entry.dateKey]}
                    isOverdue={
                      entry.dateKey < todayKey &&
                      !completions[entry.todo.id]?.[entry.dateKey]
                    }
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSelectTask={onSelectTask}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Add-section column (only meaningful inside a single list). */}
      {activeGroupId && (
        <div className="w-60 shrink-0">
          {addingSection ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
              <input
                autoFocus
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sectionName.trim()) {
                    onCreateSection(activeGroupId, sectionName.trim());
                    setSectionName('');
                    setAddingSection(false);
                  } else if (e.key === 'Escape') {
                    setAddingSection(false);
                    setSectionName('');
                  }
                }}
                placeholder="Section name"
                className="w-full rounded-md border border-white/[0.08] bg-gray-900/80 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-violet-500/60 focus:outline-none"
              />
              <div className="mt-1.5 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (sectionName.trim()) {
                      onCreateSection(activeGroupId, sectionName.trim());
                      setSectionName('');
                      setAddingSection(false);
                    }
                  }}
                  className="rounded-md bg-violet-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-violet-500"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingSection(false);
                    setSectionName('');
                  }}
                  className="rounded-md px-2 py-1 text-[11px] text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSection(true)}
              className="flex w-full items-center gap-1.5 rounded-xl border border-dashed border-white/[0.08] px-3 py-2.5 text-[12px] text-gray-400 transition hover:border-white/[0.15] hover:text-gray-200"
            >
              <Plus className="h-3.5 w-3.5" /> Add section
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Todoist-styled shell ─────────────────────────
// Local header / stat deck / tab bar matching the Todoist reference layout
// (deep-navy surfaces, icon-boxed stats, uppercase mono labels). Kept local
// so the shared account primitives stay untouched for other panels.

function ActivityHeader({ subtitle, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 border-b border-white/[0.04] pb-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
          Daily Activity
        </h1>
        <p className="font-mono text-[10px] tracking-[0.18em] text-gray-500 uppercase">
          {subtitle}
        </p>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </motion.div>
  );
}

const ACTIVITY_STAT_TONES = {
  blue: {
    chip: 'border-blue-500/20 bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
    value: 'text-white',
    border: 'hover:border-blue-500/30',
  },
  emerald: {
    chip: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
    value: 'text-emerald-400',
    border: 'hover:border-emerald-500/30',
  },
  violet: {
    chip: 'border-violet-500/20 bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
    value: 'text-violet-300',
    border: 'hover:border-violet-500/30',
  },
  rose: {
    chip: 'border-rose-500/20 bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20',
    value: 'text-rose-400',
    border: 'hover:border-rose-500/30',
  },
};

function ActivityStatCard({ icon: Icon, accent = 'blue', label, value, sublabel, delay = 0 }) {
  const tone = ACTIVITY_STAT_TONES[accent] || ACTIVITY_STAT_TONES.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`group flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-[#0e1424] p-5 transition-all duration-300 hover:scale-[1.01] hover:bg-[#121a2f] ${tone.border}`}
    >
      {Icon && (
        <div className={`rounded-xl border p-3 transition-all duration-200 ${tone.chip}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <span className="block font-mono text-[10px] font-bold tracking-wider text-gray-500 uppercase">
          {label}
        </span>
        <span className={`mt-1 block font-mono text-2xl font-black ${tone.value}`}>
          {value}
        </span>
        {sublabel && (
          <span className="block font-mono text-[10px] text-gray-500">{sublabel}</span>
        )}
      </div>
    </motion.div>
  );
}

function ActivityTabBar({ tabs, value, onChange }) {
  return (
    <div className="flex items-center justify-start gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.04] bg-[#0c1221] p-1.5 shadow-inner">
      {tabs.map((t) => {
        const active = t.value === value;
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-5 py-2.5 transition-all duration-200 ${
              active
                ? 'border border-violet-500/25 bg-violet-600/15 text-violet-300 shadow-md shadow-violet-950/20'
                : 'border border-transparent text-gray-400 hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="text-[11px] font-bold tracking-wider uppercase">
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────── Main ─────────────────────────
export default function DailyActivityClient({
  initialLists = [],
  initialTodos = [],
  initialCompletions = {},
  initialLabels = [],
  initialSections = [],
  feed: rawFeed = [],
  googleCalendar = { connected: false, email: null, syncEnabled: false },
}) {
  // Server-persisted state, seeded from props. Mutations update local state
  // optimistically and call server actions; on error the change is reverted.
  const [groups, setGroups] = useState(initialLists);
  const [todos, setTodos] = useState(initialTodos);
  // completions: { [todoId]: { [dateKey]: true } }
  const [completions, setCompletions] = useState(initialCompletions);

  // Real events/contests feed — convert ISO `start` strings to Date once.
  const feed = useMemo(
    () => (rawFeed || []).map((f) => ({ ...f, start: new Date(f.start) })),
    [rawFeed]
  );

  const [selected, setSelected] = useState(new Date(TODAY));
  const [monthAnchor, setMonthAnchor] = useState(new Date(TODAY));
  const [visible, setVisible] = useState(() =>
    Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, true]))
  );
  const [groupVisible, setGroupVisible] = useState({});
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [todoFilter, setTodoFilter] = useState('upcoming'); // upcoming | today | done | all
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('insights');
  const [gcal, setGcal] = useState(googleCalendar);
  const [gcalBanner, setGcalBanner] = useState(null);

  // ── New Todoist-inspired state (additive, no existing state touched) ──
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProductivity, setShowProductivity] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [taskMeta, setTaskMeta] = useState(() => {
    // Parse notes JSON for all initial todos to extract metadata
    const meta = {};
    initialTodos.forEach((t) => {
      meta[t.id] = parseTodoNotes(t.notes);
    });
    return meta;
  });
  // Labels + sections are server-persisted (seeded from props); karma stays in
  // localStorage (a local productivity gamification, not shared data).
  const [userLabels, setUserLabels] = useState(initialLabels);
  const [sections, setSections] = useState(initialSections);
  const [labelFilter, setLabelFilter] = useState(null); // label name or null
  const [taskView, setTaskView] = useState('list'); // 'list' | 'board'
  const [inlineSearch, setInlineSearch] = useState(''); // task list lookup box
  const [karma, setKarma] = useState({ score: 0, level: 'Beginner', dailyGoal: 5, weeklyGoal: 25, dailyStreak: 0, weeklyStreak: 0 });

  // Load karma from localStorage (labels now come from the DB via props).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedKarma = localStorage.getItem('neupc_todoist_karma');
      if (storedKarma) setKarma(JSON.parse(storedKarma));
    } catch { /* ignore */ }
  }, []);

  // ── Label CRUD (optimistic local update + persist; revert on failure) ──
  const createLabel = useCallback(async (name, color) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    setUserLabels((ls) => [...ls, { id, name: trimmed, color: color || '#9333ea' }]);
    const res = await createTodoLabelAction({ id, name: trimmed, color });
    if (res?.error) setUserLabels((ls) => ls.filter((l) => l.id !== id));
  }, []);

  const deleteLabel = useCallback(async (id) => {
    const prev = userLabels;
    setUserLabels((ls) => ls.filter((l) => l.id !== id));
    const res = await deleteTodoLabelAction({ id });
    if (res?.error) setUserLabels(prev);
  }, [userLabels]);

  // ── Section CRUD ──
  const createSection = useCallback(async (listId, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed || !listId) return;
    const id = crypto.randomUUID();
    setSections((ss) => [...ss, { id, listId, name: trimmed }]);
    const res = await createTodoSectionAction({ id, listId, name: trimmed });
    if (res?.error) setSections((ss) => ss.filter((s) => s.id !== id));
  }, []);

  const renameSection = useCallback(async (id, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    const prev = sections;
    setSections((ss) => ss.map((s) => (s.id === id ? { ...s, name: trimmed } : s)));
    const res = await renameTodoSectionAction({ id, name: trimmed });
    if (res?.error) setSections(prev);
  }, [sections]);

  const deleteSection = useCallback(async (id) => {
    const prevSections = sections;
    const prevTodos = todos;
    setSections((ss) => ss.filter((s) => s.id !== id));
    setTodos((ts) => ts.map((t) => (t.sectionId === id ? { ...t, sectionId: null } : t)));
    const res = await deleteTodoSectionAction({ id });
    if (res?.error) {
      setSections(prevSections);
      setTodos(prevTodos);
    }
  }, [sections, todos]);

  // Keyboard shortcuts: Q=Quick Add, S=Search, P=Productivity, Esc=close
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable) return;
      if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); setShowQuickAdd(true); }
      else if (e.key === 's' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShowSearch(true); }
      else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); setShowProductivity(true); }
      else if (e.key === 'Escape') {
        setShowQuickAdd(false); setShowSearch(false); setShowProductivity(false);
        setSelectedTaskId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Time tracking interval
  useEffect(() => {
    if (!activeTrackingId) return;
    const iv = setInterval(() => {
      setTaskMeta((prev) => {
        const cur = prev[activeTrackingId] || parseTodoNotes('');
        return { ...prev, [activeTrackingId]: { ...cur, timeSpent: (cur.timeSpent || 0) + 1 } };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [activeTrackingId]);

  // Toast helper
  const showToast = useCallback((message, undoAction = null) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToast({ id, message, undoAction });
    setTimeout(() => setToast((t) => t?.id === id ? null : t), 5000);
  }, []);

  // Karma helper
  const addKarma = useCallback((pts) => {
    setKarma((prev) => {
      const next = { ...prev, score: prev.score + pts };
      if (next.score >= 5000) next.level = 'Grandmaster';
      else if (next.score >= 2500) next.level = 'Expert';
      else if (next.score >= 1000) next.level = 'Professional';
      else if (next.score >= 500) next.level = 'Intermediate';
      else next.level = 'Beginner';
      localStorage.setItem('neupc_todoist_karma', JSON.stringify(next));
      return next;
    });
  }, []);

  // Selected task detail
  const activeTask = useMemo(() => {
    if (!selectedTaskId) return null;
    const t = todos.find((x) => x.id === selectedTaskId);
    if (!t) return null;
    const meta = taskMeta[t.id] || parseTodoNotes(t.notes);
    return { ...t, _meta: meta };
  }, [selectedTaskId, todos, taskMeta]);

  // Save task metadata back to DB
  const saveTaskMeta = useCallback(async (todoId, newMeta) => {
    setTaskMeta((prev) => ({ ...prev, [todoId]: newMeta }));
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const serialized = serializeTodoNotes(newMeta.text, newMeta);
    await saveTodoAction({ id: todoId, title: todo.title, notes: serialized, priority: todo.priority, startKey: todo.startKey, time: todo.time, recurrence: todo.recurrence, groupId: todo.groupId, sectionId: todo.sectionId });
  }, [todos]);

  // Surface the OAuth callback result (?gcal=connected|denied|error), then strip
  // the param so a refresh doesn't re-show the banner.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('gcal');
    if (!result) return;
    const messages = {
      connected: {
        type: 'ok',
        text: 'Google Calendar connected. Your events now appear here.',
      },
      denied: { type: 'error', text: 'Google Calendar connection cancelled.' },
      error: {
        type: 'error',
        text: 'Could not connect Google Calendar. Please try again.',
      },
    };
    setGcalBanner(messages[result] || null);
    params.delete('gcal');
    const qs = params.toString();
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${qs ? `?${qs}` : ''}`
    );
  }, []);

  function toggleGroupVisible(gid) {
    setGroupVisible((v) => ({ ...v, [gid]: v[gid] === false ? true : false }));
  }

  function toggleCategory(cat) {
    setVisible((v) => ({ ...v, [cat]: !v[cat] }));
  }

  // ── Group ops (optimistic local update + persist; revert on failure) ──
  async function createGroup(name, tone) {
    const id = crypto.randomUUID();
    setGroups((gs) => [...gs, { id, name, tone }]);
    const res = await createTodoListAction({ id, name, tone });
    if (res?.error) setGroups((gs) => gs.filter((g) => g.id !== id));
  }
  async function renameGroup(id, name) {
    const prev = groups;
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, name } : g)));
    const res = await renameTodoListAction({ id, name });
    if (res?.error) setGroups(prev);
  }
  async function deleteGroup(id) {
    const prevGroups = groups;
    const prevTodos = todos;
    // Tasks in this list become ungrouped (FK on delete set null).
    setGroups((gs) => gs.filter((g) => g.id !== id));
    setTodos((ts) =>
      ts.map((t) => (t.groupId === id ? { ...t, groupId: null } : t))
    );
    if (activeGroupId === id) setActiveGroupId(null);
    const res = await deleteTodoListAction({ id });
    if (res?.error) {
      setGroups(prevGroups);
      setTodos(prevTodos);
    }
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
  async function saveTodo(draft) {
    const prev = todos;
    const saved = draft.id ? draft : { ...draft, id: crypto.randomUUID() };
    if (draft.id) {
      setTodos((p) =>
        p.map((t) => (t.id === saved.id ? { ...t, ...saved } : t))
      );
    } else {
      setTodos((p) => [{ exclusions: [], ...saved }, ...p]);
    }
    setEditorOpen(false);
    setEditing(null);
    const res = await saveTodoAction(saved);
    if (res?.error) setTodos(prev);
  }

  function toggleOccurrence(todoId, dKey) {
    const prev = completions;
    const wasCompleted = !!completions[todoId]?.[dKey];
    const isCompleting = !wasCompleted;

    setCompletions((c) => {
      const cur = c[todoId] || {};
      const next = { ...cur };
      if (next[dKey]) delete next[dKey];
      else next[dKey] = true;
      return { ...c, [todoId]: next };
    });

    toggleCompletionAction({ todoId, occurrenceDate: dKey }).then((res) => {
      if (res?.error) setCompletions(prev);
    });

    // Karma + Toast with undo
    if (isCompleting) {
      addKarma(10);
      const todayKey2 = dateKey(TODAY);
      const todayDoneCount = Object.values(completions).reduce((acc, byDate) => acc + (byDate[todayKey2] ? 1 : 0), 0) + 1;
      const streakBonus = todayDoneCount === karma.dailyGoal ? ' 🔥 Daily goal reached! +50 XP bonus!' : '';
      if (streakBonus) addKarma(50);
      showToast(`Task completed! +10 XP.${streakBonus}`, () => {
        setCompletions(prev);
        addKarma(isCompleting ? -10 : 10);
        toggleCompletionAction({ todoId, occurrenceDate: dKey });
      });
    } else {
      addKarma(-10);
      showToast('Task set as incomplete. -10 XP.', () => {
        setCompletions(prev);
        addKarma(10);
        toggleCompletionAction({ todoId, occurrenceDate: dKey });
      });
    }
  }

  function requestDelete(todo, occKey) {
    if (!todo.recurrence) {
      // Single-instance: just remove with undo support.
      const prev = todos;
      setTodos((p) => p.filter((t) => t.id !== todo.id));
      if (selectedTaskId === todo.id) setSelectedTaskId(null);
      deleteTodoAction({ id: todo.id }).then((res) => {
        if (res?.error) setTodos(prev);
      });
      showToast('Task deleted.', () => {
        setTodos(prev);
        // Re-save to undo the delete on the server
        saveTodoAction(todo);
      });
      return;
    }
    setPendingDelete({ todo, occKey });
  }

  async function confirmDelete(scope) {
    const { todo, occKey } = pendingDelete;
    const prev = todos;
    if (scope === 'all') {
      setTodos((p) => p.filter((t) => t.id !== todo.id));
      const res = await deleteTodoAction({ id: todo.id });
      if (res?.error) setTodos(prev);
    } else if (scope === 'one') {
      setTodos((p) =>
        p.map((t) =>
          t.id === todo.id
            ? { ...t, exclusions: [...(t.exclusions || []), occKey] }
            : t
        )
      );
      const res = await excludeOccurrenceAction({
        id: todo.id,
        occurrenceDate: occKey,
      });
      if (res?.error) setTodos(prev);
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
    []
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

    feed.forEach((it) =>
      push(dateKey(it.start), { ...it, dateKey: dateKey(it.start) })
    );

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
  }, [todos, completions, monthRange, groupVisible, feed]);

  // Scope for the one-time "Sync this month to Google" push: everything
  // currently SHOWN in the viewed month. Tasks honor list visibility; feed
  // items (events/sessions/contests/deadlines) honor the category toggles.
  const monthTaskIds = useMemo(() => {
    const occ = expandOccurrences(monthRange.startKey, monthRange.endKey);
    return [
      ...new Set(
        occ
          .filter(({ todo }) => groupVisible[todo.groupId] !== false)
          .map(({ todo }) => todo.id)
      ),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, monthRange, groupVisible]);

  const monthFeedIds = useMemo(() => {
    return feed
      .filter((it) => visible[it.category])
      .filter((it) => {
        const k = dateKey(it.start);
        return k >= monthRange.startKey && k <= monthRange.endKey;
      })
      .map((it) => it.id);
  }, [feed, visible, monthRange]);

  const monthLabel = `${MONTH_NAMES[monthAnchor.getMonth()]} ${monthAnchor.getFullYear()}`;

  // Selected-day data.
  const selKey = dateKey(selected);

  const occurrencesAll = useMemo(
    () => expandOccurrences(listRange.startKey, listRange.endKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos, listRange]
  );

  // Combined task + calendar feed list.
  const filteredOccurrences = useMemo(() => {
    const todayKey = dateKey(TODAY);

    // Tasks (group-aware).
    const todoEntries =
      activeGroupId === '__contests'
        ? []
        : occurrencesAll
            .filter(
              ({ todo }) =>
                activeGroupId == null || todo.groupId === activeGroupId
            )
            .filter(({ todo }) => groupVisible[todo.groupId] !== false)
            .filter(({ todo }) => {
              if (!labelFilter) return true;
              const meta = taskMeta[todo.id];
              return (meta?.labels || []).includes(labelFilter);
            })
            .map(({ todo, dateKey: k }) => ({
              kind: 'todo',
              dateKey: k,
              sortTime: todo.time || '00:00',
              todo,
            }));

    // Calendar feed (category-aware via `visible`).
    const feedEntries =
      todoFilter === 'done' || labelFilter
        ? []
        : feed
            .filter((it) => activeGroupId === null && visible[it.category])
            .map((it) => ({
              kind: 'feed',
              dateKey: dateKey(it.start),
              sortTime: it.start.toTimeString().slice(0, 5),
              item: it,
            }));

    let list = [...todoEntries, ...feedEntries];

    if (todoFilter === 'today')
      list = list.filter((e) => e.dateKey === todayKey);
    else if (todoFilter === 'upcoming')
      list = list.filter((e) => e.dateKey >= todayKey);
    else if (todoFilter === 'done')
      list = list.filter(
        (e) => e.kind === 'todo' && !!completions[e.todo.id]?.[e.dateKey]
      );
    else if (todoFilter === 'contests')
      list = feed
        .filter((it) => it.category === 'contest')
        .map((it) => ({
          kind: 'feed',
          dateKey: dateKey(it.start),
          sortTime: it.start.toTimeString().slice(0, 5),
          item: it,
        }));

    if (inlineSearch.trim()) {
      const q = inlineSearch.trim().toLowerCase();
      list = list.filter((e) => {
        const title =
          e.kind === 'todo' ? e.todo.title : e.item.title || '';
        return title.toLowerCase().includes(q);
      });
    }

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
    visible,
    feed,
    labelFilter,
    taskMeta,
    inlineSearch,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOccurrences.length / pageSize)
  );
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pagedOccurrences = filteredOccurrences.slice(
    pageStart,
    pageStart + pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [todoFilter, activeGroupId, pageSize, labelFilter, inlineSearch]);

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

  const groupById = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g])),
    [groups]
  );

  // Open-occurrence count per label (next 30 days), for the sidebar chips.
  const labelCounts = useMemo(() => {
    const todayKey = dateKey(TODAY);
    const horizon = dateKey(offsetDate(30));
    const counts = {};
    occurrencesAll.forEach(({ todo, dateKey: k }) => {
      if (k < todayKey || k > horizon) return;
      if (completions[todo.id]?.[k]) return;
      (taskMeta[todo.id]?.labels || []).forEach((name) => {
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return counts;
  }, [occurrencesAll, completions, taskMeta]);

  // ── Header overview counts ──
  const summaryStats = useMemo(() => {
    const todayKey = dateKey(TODAY);
    const weekEnd = dateKey(offsetDate(7));
    const past30 = dateKey(offsetDate(-30));
    let dueToday = 0;
    let doneToday = 0;
    let totalToday = 0;
    let upcoming = 0;
    let overdue = 0;
    occurrencesAll.forEach(({ todo, dateKey: k }) => {
      const done = !!completions[todo.id]?.[k];
      if (k === todayKey) {
        totalToday++;
        if (done) doneToday++;
        else dueToday++;
      } else if (k > todayKey && k <= weekEnd) {
        if (!done) upcoming++;
      } else if (k < todayKey && k >= past30 && !done) {
        overdue++;
      }
    });
    return { dueToday, doneToday, totalToday, upcoming, overdue };
  }, [occurrencesAll, completions]);

  const renderTab = () => {
    switch (activeTab) {
      case 'insights': {
        return (
          <ActivityAnalytics
            todos={todos}
            completions={completions}
            karma={karma}
            setKarma={setKarma}
            onToggleTodo={toggleOccurrence}
            groupById={groupById}
          />
        );
      }
      case 'tasks': {
        // Group filtered occurrences by date for display.
        const todayKey2 = dateKey(TODAY);
        const grouped = [];
        let lastDateKey = null;
        let currentSep = null;
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
                : d.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
            currentSep = {
              type: 'separator',
              label,
              dateKey: entry.dateKey,
              isToday,
              count: 0,
            };
            grouped.push(currentSep);
          }
          if (currentSep) currentSep.count += 1;
          grouped.push({ type: 'item', entry });
        });

        return (
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Lists panel */}
            <div className="lg:col-span-3">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-white/[0.04] bg-[#0c1221] p-5">
                <GroupPanel
                  groups={groups}
                  activeGroupId={activeGroupId}
                  setActiveGroupId={(id) => {
                    setActiveGroupId(id);
                    if (id !== null) {
                      setTodoFilter('all');
                    }
                  }}
                  groupVisible={groupVisible}
                  toggleGroupVisible={toggleGroupVisible}
                  countsByGroup={countsByGroup}
                  onCreate={createGroup}
                  onRename={renameGroup}
                  onDelete={deleteGroup}
                  labels={userLabels}
                  labelFilter={labelFilter}
                  setLabelFilter={setLabelFilter}
                  labelCounts={labelCounts}
                />
                <div className="mt-6 border-t border-white/[0.04] pt-4 text-center font-mono text-[10px] tracking-wider text-gray-500 uppercase">
                  🔮 Focus on progress, not perfection.
                </div>
              </div>
            </div>

            {/* Right: Task list */}
            <div className="flex flex-col justify-between lg:col-span-9">
              <div>
                {/* Filter bar header */}
                <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.04] bg-[#0c1221] p-4 md:flex-row">
                  {/* Filter pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { v: 'all', l: 'All Tasks' },
                      { v: 'today', l: 'Today' },
                      { v: 'upcoming', l: 'Upcoming' },
                      { v: 'contests', l: 'Contests' },
                      { v: 'done', l: 'Completed' },
                    ]
                      .filter(
                        (t) => activeGroupId === null || t.v !== 'contests'
                      )
                      .map((t) => (
                        <button
                          key={t.v}
                          type="button"
                          onClick={() => setTodoFilter(t.v)}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold tracking-wide capitalize transition ${
                            todoFilter === t.v
                              ? 'bg-violet-600 text-white shadow shadow-violet-900/15'
                              : 'border border-white/[0.04] bg-[#121a2e] text-gray-300 hover:bg-[#16213a] hover:text-white'
                          }`}
                        >
                          {t.l}
                        </button>
                      ))}
                  </div>

                  {/* Inline search + layout toggle */}
                  <div className="flex w-full items-center justify-end gap-3 md:w-auto">
                    <input
                      type="text"
                      placeholder="Lookup in list..."
                      value={inlineSearch}
                      onChange={(e) => setInlineSearch(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.04] bg-[#121a2e] px-3.5 py-1.5 text-xs font-bold text-white placeholder:text-gray-500 transition focus:border-violet-500 focus:outline-none md:w-44"
                    />
                    <div className="flex rounded-xl border border-white/[0.04] bg-[#121a2e] p-0.5">
                      {[
                        { v: 'list', icon: CheckSquare, t: 'List layout' },
                        { v: 'board', icon: LayoutGrid, t: 'Board layout' },
                      ].map((v) => {
                        const VIcon = v.icon;
                        return (
                          <button
                            key={v.v}
                            type="button"
                            onClick={() => setTaskView(v.v)}
                            title={v.t}
                            className={`rounded-lg p-1.5 transition ${
                              taskView === v.v
                                ? 'bg-[#070b13] text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <VIcon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Task list */}
                {taskView === 'board' ? (
                  <TaskBoard
                    groups={groups}
                    sections={sections}
                    occurrences={filteredOccurrences}
                    completions={completions}
                    groupById={groupById}
                    todayKey={dateKey(TODAY)}
                    onToggle={toggleOccurrence}
                    onEdit={openEdit}
                    onDelete={requestDelete}
                    onSelectTask={setSelectedTaskId}
                    onCreateSection={createSection}
                    onRenameSection={renameSection}
                    onDeleteSection={deleteSection}
                    activeGroupId={activeGroupId}
                  />
                ) : filteredOccurrences.length === 0 ? (
                  <EmptyState
                    icon={Flag}
                    title="Nothing here"
                    description={
                      todoFilter === 'done'
                        ? 'No completed tasks yet. Check off tasks to see them here.'
                        : todoFilter === 'contests'
                          ? 'No upcoming contests in the next 30 days.'
                          : todoFilter === 'today'
                            ? 'Nothing scheduled for today. Add a task to get started.'
                            : 'No tasks match this filter.'
                    }
                    action={
                      todoFilter !== 'contests' && (
                        <ActionButton
                          tone="primary"
                          icon={Plus}
                          onClick={openCreate}
                        >
                          New task
                        </ActionButton>
                      )
                    }
                    accent="violet"
                  />
                ) : (
                  <>
                    <ul className="space-y-1">
                      <AnimatePresence initial={false}>
                        {grouped.map((row, idx) => {
                          if (row.type === 'separator') {
                            return (
                              <li
                                key={`sep-${row.dateKey}`}
                                className={`flex items-center gap-2 pt-4 pb-1 ${idx === 0 ? 'pt-0' : ''}`}
                              >
                                <span
                                  className={`font-mono text-[11px] font-black tracking-widest uppercase ${
                                    row.isToday
                                      ? 'text-violet-400'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {row.label} ({row.count})
                                </span>
                                <span className="h-px flex-1 bg-white/[0.04]" />
                              </li>
                            );
                          }
                          const entry = row.entry;
                          if (entry.kind === 'feed')
                            return (
                              <li
                                key={`feed-${entry.item.id}-${entry.dateKey}`}
                              >
                                <FeedEntry item={entry.item} />
                              </li>
                            );
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
                                isDone={
                                  !!completions[entry.todo.id]?.[entry.dateKey]
                                }
                                isOverdue={
                                  entry.dateKey < todayKey2 &&
                                  !completions[entry.todo.id]?.[entry.dateKey]
                                }
                                onToggle={toggleOccurrence}
                                onEdit={openEdit}
                                onDelete={requestDelete}
                                onSelectTask={setSelectedTaskId}
                              />
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  </>
                )}
              </div>

              {/* Pagination footer */}
              {taskView === 'list' && filteredOccurrences.length > 0 && (
                <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#111625] p-4 text-xs text-gray-300 md:flex-row">
                  <div>
                    <span>Showing </span>
                    <span className="font-bold text-white">
                      {filteredOccurrences.length > 0 ? pageStart + 1 : 0}
                    </span>
                    <span> - </span>
                    <span className="font-bold text-white">
                      {Math.min(pageStart + pageSize, filteredOccurrences.length)}
                    </span>
                    <span> of </span>
                    <span className="font-bold text-violet-400">
                      {filteredOccurrences.length} items
                    </span>
                    {activeGroupId && (
                      <span>
                        {' '}
                        in{' '}
                        <strong className="text-white">
                          #{groupById[activeGroupId]?.name}
                        </strong>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] tracking-wider text-gray-500">
                      PAGE {safePage} OF {totalPages}
                    </span>
                    <div className="flex rounded-lg border border-white/5 bg-[#182032] p-0.5">
                      <button
                        type="button"
                        disabled={safePage === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="rounded px-2 py-1 text-gray-400 transition hover:bg-[#0b0f19] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="h-4 w-px bg-white/5" />
                      <button
                        type="button"
                        disabled={safePage === totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="rounded px-2 py-1 text-gray-400 transition hover:bg-[#0b0f19] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'calendar': {
        const todayKeyLocal = dateKey(TODAY);
        const dayIsToday = selKey === todayKeyLocal;
        const dayTasks = occurrencesAll
          .filter(({ dateKey: k }) => k === selKey)
          .filter(({ todo }) => groupVisible[todo.groupId] !== false)
          .sort((a, b) =>
            (a.todo.time || '00:00').localeCompare(b.todo.time || '00:00')
          );
        const dayFeed = feed
          .filter((it) => dateKey(it.start) === selKey && visible[it.category])
          .sort((a, b) => a.start.getTime() - b.start.getTime());
        const dayEmpty = dayTasks.length === 0 && dayFeed.length === 0;

        return (
          <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-12">
            {/* Month grid */}
            <div className="xl:col-span-8">
              <GlassCard padding="p-5 sm:p-6" className="border-white/5 bg-[#111625]">
                <MonthCalendar
                  monthAnchor={monthAnchor}
                  setMonthAnchor={setMonthAnchor}
                  selected={selected}
                  setSelected={setSelected}
                  itemsByDay={itemsByDay}
                  visible={visible}
                />
              </GlassCard>
            </div>

            {/* Right rail: Google Calendar + legend + selected-day agenda */}
            <div className="flex flex-col gap-5 xl:col-span-4">
              <GoogleCalendarCard
                status={gcal}
                onChange={setGcal}
                monthLabel={monthLabel}
                monthTaskIds={monthTaskIds}
                monthFeedIds={monthFeedIds}
              />

              <GlassCard padding="p-5" className="border-white/5 bg-[#111625]">
                <SectionHeader
                  icon={Filter}
                  title="Show on calendar"
                  subtitle="Toggle what appears in the grid."
                />
                <div className="flex flex-col gap-1">
                  {LEGEND_CATEGORIES.map((key) => {
                    const cat = CATEGORIES[key];
                    const on = visible[key];
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleCategory(key)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-[13px] transition ${
                          on
                            ? 'border-white/[0.06] bg-white/[0.02] text-gray-200 hover:bg-white/[0.04]'
                            : 'border-transparent text-gray-600 hover:text-gray-400'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`h-2 w-2 rounded-full ${cat.dot} ${on ? '' : 'opacity-40'}`}
                          />
                          <CatIcon className="h-3.5 w-3.5" />
                          {cat.label}
                        </span>
                        {on ? (
                          <Check className="h-3.5 w-3.5 text-violet-400" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-gray-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </GlassCard>

              <GlassCard padding="p-5" className="border-white/5 bg-[#111625]">
                <SectionHeader
                  icon={CalendarIcon}
                  accent={dayIsToday ? 'violet' : 'gray'}
                  title={dayIsToday ? 'Today' : fmtDayLong(selected)}
                  subtitle={dayIsToday ? fmtDayLong(selected) : undefined}
                  action={
                    <ActionButton
                      tone="primary"
                      icon={Plus}
                      onClick={openCreate}
                    >
                      Add task
                    </ActionButton>
                  }
                />
                {dayEmpty ? (
                  <EmptyState
                    icon={Sparkles}
                    title="Nothing planned"
                    description="No tasks or events for this day yet."
                    accent="violet"
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {dayFeed.length > 0 && (
                      <ul className="space-y-1.5">
                        {dayFeed.map((it) => (
                          <li key={`dayfeed-${it.id}`}>
                            <FeedEntry item={it} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {dayTasks.length > 0 && (
                      <ul className="space-y-1">
                        {dayTasks.map(({ todo, dateKey: k }) => (
                          <li key={`daytask-${todo.id}-${k}`}>
                            <TodoOccurrenceItem
                              occurrence={{ dateKey: k }}
                              todo={todo}
                              group={groupById[todo.groupId]}
                              isDone={!!completions[todo.id]?.[k]}
                              isOverdue={
                                k < todayKeyLocal && !completions[todo.id]?.[k]
                              }
                              onToggle={toggleOccurrence}
                              onEdit={openEdit}
                              onDelete={requestDelete}
                              onSelectTask={setSelectedTaskId}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const uiTabs = TABS.map((t) => ({
    value: t.id,
    label: t.label,
    icon: t.icon,
  }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30 [&]:max-w-7xl">
      <ActivityHeader
        subtitle={`Synchronized workspace · ${getTodayDateString()}`}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowProductivity(true)}
              className="flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 font-mono text-[11px] font-bold tracking-wide text-violet-300 uppercase transition hover:scale-[1.02] hover:bg-violet-500/20 active:scale-[0.98]"
              title="Productivity (P)"
            >
              <Award className="h-3.5 w-3.5" />
              <span>{karma.score} XP · {karma.level}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="rounded-xl border border-white/[0.06] bg-[#0e1626] p-2 text-gray-400 transition hover:border-violet-500/20 hover:text-white"
              title="Search (S)"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#0e1626] px-4 py-2 font-mono text-[11px] font-bold tracking-wide text-gray-200 uppercase transition hover:border-violet-500/20 hover:text-white"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Quick Add</span>
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 font-mono text-[11px] font-black tracking-wide text-white uppercase shadow-md shadow-violet-600/15 transition hover:scale-[1.02] hover:bg-violet-500"
            >
              <Plus className="h-4 w-4 stroke-[3.5]" />
              <span>New Task</span>
            </button>
          </div>
        }
      />

      {gcalBanner && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-[13px] ${
            gcalBanner.type === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {gcalBanner.text}
          </span>
          <button
            type="button"
            onClick={() => setGcalBanner(null)}
            className="rounded-md p-1 text-current/70 transition hover:text-current"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActivityStatCard
          icon={CircleDot}
          accent="blue"
          label="Due today"
          value={summaryStats.dueToday}
          sublabel={`${summaryStats.totalToday} scheduled`}
          delay={0}
        />
        <ActivityStatCard
          icon={CheckCircle2}
          accent="emerald"
          label="Done today"
          value={`+${summaryStats.doneToday}`}
          sublabel={
            summaryStats.totalToday
              ? `${Math.round((summaryStats.doneToday / summaryStats.totalToday) * 100)}% complete`
              : 'Nothing scheduled'
          }
          delay={0.05}
        />
        <ActivityStatCard
          icon={CalendarIcon}
          accent="violet"
          label="Next 7 days"
          value={summaryStats.upcoming}
          sublabel="upcoming tasks"
          delay={0.1}
        />
        <ActivityStatCard
          icon={Flag}
          accent="rose"
          label="Overdue"
          value={summaryStats.overdue}
          sublabel="past 30 days"
          delay={0.15}
        />
      </div>

      <ActivityTabBar tabs={uiTabs} value={activeTab} onChange={setActiveTab} />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>

      <TodoEditor
        open={editorOpen}
        initial={editing}
        groups={groups}
        labels={userLabels}
        sections={sections}
        defaultDateKey={selKey}
        onSave={saveTodo}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
      />
      <DeleteRecurringModal
        open={!!pendingDelete}
        pending={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      {/* ── Task Detail Slide-over Pane ── */}
      <AnimatePresence>
        {activeTask && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTaskId(null)}>
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md border-l border-white/[0.06] bg-gray-950 shadow-2xl flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Task Details</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTrackingId === activeTask.id) { setActiveTrackingId(null); showToast('Timer paused'); }
                      else { setActiveTrackingId(activeTask.id); showToast('Timer started'); }
                    }}
                    className={`rounded-md border p-1.5 transition ${activeTrackingId === activeTask.id ? 'border-violet-500/40 bg-violet-500/10 text-violet-400 animate-pulse' : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-white'}`}
                    title={activeTrackingId === activeTask.id ? 'Pause timer' : 'Start timer'}
                  >
                    {activeTrackingId === activeTask.id ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  </button>
                  <button onClick={() => setSelectedTaskId(null)} className="rounded-md p-1.5 text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Title */}
                <h2 className="text-lg font-semibold text-white break-words">{activeTask.title}</h2>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Priority</span>
                    <span className={`font-medium capitalize ${activeTask.priority === 'high' ? 'text-rose-400' : activeTask.priority === 'medium' ? 'text-amber-400' : 'text-sky-400'}`}>{activeTask.priority}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Time Spent</span>
                    <span className="text-gray-300 font-mono">{Math.floor((activeTask._meta.timeSpent || 0) / 60)}m {(activeTask._meta.timeSpent || 0) % 60}s</span>
                  </div>
                  {activeTask.startKey && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">Due Date</span>
                      <span className="text-gray-300">{activeTask.startKey}</span>
                    </div>
                  )}
                  {activeTask.time && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">Time</span>
                      <span className="text-gray-300">{activeTask.time}</span>
                    </div>
                  )}
                </div>

                {/* Recurrence */}
                {activeTask.recurrence && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                    <Repeat className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-gray-300 font-medium">{describeRecurrence(activeTask.recurrence)}</span>
                  </div>
                )}

                {/* Group / Project */}
                {activeTask.groupId && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                    <Folder className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-gray-300 font-medium">{groups.find(g => g.id === activeTask.groupId)?.name || 'Unknown group'}</span>
                  </div>
                )}

                {/* Notes / Description */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Notes</span>
                  <textarea
                    value={activeTask._meta.text || ''}
                    onChange={(e) => saveTaskMeta(activeTask.id, { ...activeTask._meta, text: e.target.value })}
                    placeholder="Add notes or description..."
                    rows={3}
                    className="w-full rounded-md border border-white/[0.06] bg-gray-900/80 px-2.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 resize-none"
                  />
                </div>

                {/* Dependencies */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><GitPullRequest className="h-3 w-3" /> Blocker Dependency</span>
                  <select
                    value={activeTask._meta.dependencies?.[0] || ''}
                    onChange={(e) => {
                      const newMeta = { ...activeTask._meta, dependencies: e.target.value ? [e.target.value] : [] };
                      saveTaskMeta(activeTask.id, newMeta);
                    }}
                    className="w-full rounded-md border border-white/[0.06] bg-gray-900/80 px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-violet-500/60"
                  >
                    <option value="">No blocker</option>
                    {todos.filter(t => t.id !== activeTask.id).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>

                {/* Section (within the task's list) */}
                {activeTask.groupId && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><LayoutGrid className="h-3 w-3" /> Section</span>
                    <select
                      value={activeTask.sectionId || ''}
                      onChange={(e) => {
                        const nextSectionId = e.target.value || null;
                        setTodos((p) => p.map((t) => t.id === activeTask.id ? { ...t, sectionId: nextSectionId } : t));
                        saveTodoAction({
                          id: activeTask.id,
                          title: activeTask.title,
                          notes: serializeTodoNotes(activeTask._meta.text, activeTask._meta),
                          priority: activeTask.priority,
                          startKey: activeTask.startKey,
                          time: activeTask.time,
                          recurrence: activeTask.recurrence,
                          groupId: activeTask.groupId,
                          sectionId: nextSectionId,
                        });
                      }}
                      className="w-full rounded-md border border-white/[0.06] bg-gray-900/80 px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-violet-500/60"
                    >
                      <option value="">No section</option>
                      {sections.filter((s) => s.listId === activeTask.groupId).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Labels */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><Tag className="h-3 w-3" /> Labels</span>
                  <div className="flex flex-wrap gap-1.5">
                    {userLabels.map((l) => {
                      const attached = activeTask._meta.labels?.includes(l.name);
                      return (
                        <span key={l.id} className="group/lbl inline-flex items-center">
                          <button type="button" onClick={() => {
                            const newLabels = attached ? activeTask._meta.labels.filter(x => x !== l.name) : [...(activeTask._meta.labels || []), l.name];
                            saveTaskMeta(activeTask.id, { ...activeTask._meta, labels: newLabels });
                          }}
                          className="rounded-md border px-2 py-1 text-[11px] font-medium transition"
                          style={attached ? { backgroundColor: l.color, borderColor: 'transparent', color: '#fff' } : { borderColor: l.color, color: l.color }}
                          >@{l.name}</button>
                          <button type="button" title="Delete label" onClick={() => deleteLabel(l.id)} className="-ml-1 px-0.5 text-gray-600 opacity-0 group-hover/lbl:opacity-100 hover:text-rose-400"><X className="h-3 w-3" /></button>
                        </span>
                      );
                    })}
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const val = e.currentTarget.labelInput.value.trim();
                    if (!val) return;
                    createLabel(val, '#9333ea');
                    e.currentTarget.reset();
                  }} className="flex gap-1.5">
                    <input name="labelInput" type="text" placeholder="New label..." className="flex-1 rounded-md border border-white/[0.06] bg-gray-900/80 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60" />
                    <button type="submit" className="rounded-md border border-white/[0.08] px-2 py-1 text-[11px] text-gray-300 hover:bg-white/[0.04]">Add</button>
                  </form>
                </div>

                {/* Subtasks */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><CheckSquare className="h-3 w-3" /> Subtasks</span>
                    <span className="text-[10px] text-gray-500">{activeTask._meta.subtasks?.filter(s => s.done).length || 0}/{activeTask._meta.subtasks?.length || 0}</span>
                  </div>
                  {activeTask._meta.subtasks?.length > 0 && (
                    <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-violet-500 transition-all" style={{ width: `${((activeTask._meta.subtasks.filter(s => s.done).length) / activeTask._meta.subtasks.length) * 100}%` }} />
                    </div>
                  )}
                  <ul className="space-y-1">
                    {(activeTask._meta.subtasks || []).map((sub) => (
                      <li key={sub.id} className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 group/sub">
                        <label className="flex items-center gap-2 min-w-0 cursor-pointer">
                          <input type="checkbox" checked={sub.done} onChange={() => {
                            const updated = activeTask._meta.subtasks.map(s => s.id === sub.id ? { ...s, done: !s.done } : s);
                            saveTaskMeta(activeTask.id, { ...activeTask._meta, subtasks: updated });
                            if (!sub.done) { addKarma(2); showToast('Subtask done! +2 Karma'); }
                          }} className="rounded border-white/20 bg-transparent text-violet-500 focus:ring-0 h-3.5 w-3.5 cursor-pointer" />
                          <span className={`text-xs ${sub.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>{sub.title}</span>
                        </label>
                        <button type="button" onClick={() => {
                          const updated = activeTask._meta.subtasks.filter(s => s.id !== sub.id);
                          saveTaskMeta(activeTask.id, { ...activeTask._meta, subtasks: updated });
                        }} className="text-gray-600 opacity-0 group-hover/sub:opacity-100 hover:text-rose-400"><X className="h-3 w-3" /></button>
                      </li>
                    ))}
                  </ul>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const val = e.currentTarget.subInput.value.trim();
                    if (!val) return;
                    const newSub = { id: 'sub_' + Math.random().toString(36).slice(2, 9), title: val, done: false };
                    saveTaskMeta(activeTask.id, { ...activeTask._meta, subtasks: [...(activeTask._meta.subtasks || []), newSub] });
                    e.currentTarget.subInput.value = '';
                  }} className="flex gap-1.5">
                    <input name="subInput" type="text" placeholder="Add subtask..." className="flex-1 rounded-md border border-white/[0.06] bg-gray-900/80 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/60" />
                    <button type="submit" className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500/10">Add</button>
                  </form>
                </div>

                {/* Comments */}
                <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comments ({activeTask._meta.comments?.length || 0})</span>
                  {(activeTask._meta.comments || []).map((c) => (
                    <div key={c.id} className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2.5 group/comm">
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span className="font-semibold text-gray-300">{c.author}</span>
                        <div className="flex items-center gap-1">
                          <span>{new Date(c.at).toLocaleDateString()}</span>
                          <button type="button" onClick={() => {
                            saveTaskMeta(activeTask.id, { ...activeTask._meta, comments: activeTask._meta.comments.filter(x => x.id !== c.id) });
                          }} className="opacity-0 group-hover/comm:opacity-100 hover:text-rose-400"><X className="h-2.5 w-2.5" /></button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 break-words">{c.text}</p>
                    </div>
                  ))}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const val = e.currentTarget.commInput.value.trim();
                    if (!val) return;
                    const newComment = { id: 'c_' + Math.random().toString(36).slice(2, 9), author: 'You', text: val, at: new Date().toISOString() };
                    saveTaskMeta(activeTask.id, { ...activeTask._meta, comments: [...(activeTask._meta.comments || []), newComment] });
                    e.currentTarget.commInput.value = '';
                  }} className="flex flex-col gap-1.5">
                    <textarea name="commInput" placeholder="Add a comment..." rows={2} className="w-full rounded-md border border-white/[0.06] bg-gray-900/80 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-500/60 resize-none" />
                    <button type="submit" className="self-end rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 flex items-center gap-1"><Send className="h-3 w-3" />Comment</button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Quick Add Spotlight (Q) ── */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowQuickAdd(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-gray-950 shadow-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Quick Add · Natural Language</span>
                <button onClick={() => setShowQuickAdd(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <input type="text" autoFocus placeholder='e.g. "Review PR p1 tomorrow #Work @Urgent"'
                className="w-full rounded-lg border border-white/[0.08] bg-gray-900/80 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60"
                onKeyDown={async (e) => {
                  if (e.key !== 'Enter') return;
                  let text = e.currentTarget.value.trim();
                  if (!text) return;
                  let priority = 'medium';
                  let startKey = getTodayDateString();
                  let groupId = groups?.[0]?.id || null;

                  // Parse priority
                  const prioMatch = text.match(/\b(p1|p2|p3|p4)\b/i);
                  if (prioMatch) {
                    const tag = prioMatch[1].toLowerCase();
                    priority = tag === 'p1' ? 'high' : tag === 'p2' ? 'medium' : 'low';
                    text = text.replace(prioMatch[0], '');
                  }
                  // Parse project
                  const projMatch = text.match(/#(\w+)/);
                  if (projMatch) {
                    const match = groups.find(g => g.name.toLowerCase().includes(projMatch[1].toLowerCase()));
                    if (match) groupId = match.id;
                    text = text.replace(projMatch[0], '');
                  }
                  // Parse date
                  if (/\btomorrow\b/i.test(text)) { startKey = addDaysKey(getTodayDateString(), 1); text = text.replace(/\btomorrow\b/i, ''); }
                  else if (/\btoday\b/i.test(text)) { text = text.replace(/\btoday\b/i, ''); }
                  else if (/\bnext week\b/i.test(text)) { startKey = addDaysKey(getTodayDateString(), 7); text = text.replace(/\bnext week\b/i, ''); }

                  const title = text.replace(/@\w+/g, '').trim();
                  if (!title) return;

                  const draft = { title, priority, startKey, groupId, notes: '', time: '' };
                  const saved = { ...draft, id: crypto.randomUUID(), exclusions: [] };
                  setTodos(p => [saved, ...p]);
                  setShowQuickAdd(false);
                  const res = await saveTodoAction(saved);
                  if (res?.error) { setTodos(p => p.filter(t => t.id !== saved.id)); showToast('Failed: ' + res.error); }
                  else { addKarma(10); showToast(`Task "${title}" created! +10 Karma`); }
                }}
              />
              <div className="flex gap-2 text-[10px] text-gray-500">
                <span className="rounded border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5">P1-P4 → Priority</span>
                <span className="rounded border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5">#Name → Project</span>
                <span className="rounded border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5">tomorrow/today → Date</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Search Spotlight (S) ── */}
      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSearch(false)}>
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-gray-950 shadow-2xl overflow-hidden flex flex-col max-h-[400px]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <Search className="h-4 w-4 text-gray-400" />
                <input type="text" autoFocus placeholder="Search tasks..." className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-600"
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase().trim();
                    const box = document.getElementById('search-results-list');
                    if (!box) return;
                    if (!q) { box.innerHTML = '<p class="text-gray-500 text-xs text-center py-8">Start typing to search...</p>'; return; }
                    const matches = todos.filter(t => t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)));
                    if (!matches.length) { box.innerHTML = `<p class="text-gray-500 text-xs text-center py-8">No results for "${q}"</p>`; return; }
                    box.innerHTML = matches.map(m => `<div data-id="${m.id}" class="px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer flex justify-between items-center text-xs"><span class="text-gray-200 font-medium truncate">${m.title}</span><span class="text-gray-500 uppercase text-[10px]">${m.priority || ''}</span></div>`).join('');
                    box.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', () => { setSelectedTaskId(el.dataset.id); setShowSearch(false); }));
                  }}
                />
              </div>
              <div id="search-results-list" className="flex-1 overflow-y-auto min-h-[120px]">
                <p className="text-gray-500 text-xs text-center py-8">Start typing to search...</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Productivity / Karma Modal (P) ── */}
      <AnimatePresence>
        {showProductivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowProductivity(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-gray-950 shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Productivity Stats</span>
                <button onClick={() => setShowProductivity(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase block">Karma Score</span>
                  <span className="text-2xl font-bold text-violet-400 mt-1 block">{karma.score}</span>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase block">Level</span>
                  <span className="text-sm font-bold text-white mt-2 block">{karma.level}</span>
                </div>
              </div>
              <div className="space-y-3 border-t border-white/[0.06] pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-semibold">Daily Goal</span>
                  <span className="text-violet-400 font-mono">{karma.dailyGoal} tasks</span>
                </div>
                <input type="range" min={1} max={20} value={karma.dailyGoal} onChange={(e) => {
                  const val = Number(e.target.value);
                  setKarma(p => { const n = { ...p, dailyGoal: val }; localStorage.setItem('neupc_todoist_karma', JSON.stringify(n)); return n; });
                }} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-semibold">Weekly Goal</span>
                  <span className="text-violet-400 font-mono">{karma.weeklyGoal} tasks</span>
                </div>
                <input type="range" min={5} max={100} value={karma.weeklyGoal} onChange={(e) => {
                  const val = Number(e.target.value);
                  setKarma(p => { const n = { ...p, weeklyGoal: val }; localStorage.setItem('neupc_todoist_karma', JSON.stringify(n)); return n; });
                }} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500" />
              </div>
              <div className="text-[11px] text-gray-500 text-center pt-2">
                Press <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-gray-400 font-mono">P</kbd> anytime to open this panel
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 left-5 z-[60] rounded-xl border border-white/[0.08] bg-gray-900/95 backdrop-blur px-4 py-3 shadow-xl flex items-center gap-3 max-w-sm"
          >
            <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
            <span className="text-xs font-medium text-gray-200">{toast.message}</span>
            {toast.undoAction && (
              <button onClick={() => { toast.undoAction(); setToast(null); }}
                className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10px] font-bold text-violet-400 hover:bg-violet-500/10">UNDO</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </PageShell>
  );
}
