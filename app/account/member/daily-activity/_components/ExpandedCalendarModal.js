'use client';

/**
 * Full-screen Google Calendar–style weekly time-grid modal.
 * Shows 24 hours × 7 days with timed events rendered as positioned blocks.
 * All-day / date-only items appear in a header strip above the grid.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, X, Calendar, Check, Trash2,
  Flag, Clock, Tag, MapPin, Link2, BookOpen, Flame, ShieldAlert, HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { formatDateString, addDays, getTodayDateString, isTaskOnDate, Priority, getFeedItemUrl, isFeedItem } from './utils';

// ── helpers ──────────────────────────────────────────────────────────────────

const GCAL_COLOR_MAP = {
  '1': '#d50000', '2': '#e67c73', '3': '#f4511e', '4': '#f6bf26',
  '5': '#33b679', '6': '#0b8043', '7': '#039be5', '8': '#3f51b5',
  '9': '#7986cb', '10': '#8e24aa', '11': '#616161',
};

const CATEGORY_COLOR = {
  todo:     '#7c3aed',
  personal: '#e11d48',
  events:   '#059669',
  contests: '#d97706',
  tasks:    '#6366f1',
  sessions: '#0ea5e9',
  gcal:     '#4285f4',
  gtask:    '#34a853',
};

function taskColor(task) {
  if (task.colorId && GCAL_COLOR_MAP[task.colorId]) return GCAL_COLOR_MAP[task.colorId];
  const cat = task.feedCategory || 'todo';
  return CATEGORY_COLOR[cat] || CATEGORY_COLOR.todo;
}

/** Parse "HH:MM" → minutes-from-midnight. Returns null if not parseable. */
function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/** Format minutes-from-midnight to "H:MM AM/PM". */
function fmtMin(min) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PX_PER_MIN = 1.2; // pixels per minute → 1h = 72px
const HOUR_H = PX_PER_MIN * 60; // px per hour row

/** Sunday of the week containing `date`. */
function weekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}


const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAME = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── sub-components ────────────────────────────────────────────────────────────

/**
 * Layout overlapping timed blocks into columns so they don't fully hide each other.
 * Returns each block with { col, totalCols } for width/offset calculation.
 */
function layoutBlocks(blocks) {
  // Combined priority score: startMin − durationMin.
  // Higher score = later start AND/OR shorter duration = higher z-index (in front).
  // Sort ascending: lowest score first (behind), highest score last (in front).
  const sorted = [...blocks].sort(
    (a, b) => (a.startMin - a.durationMin) - (b.startMin - b.durationMin)
  );
  return sorted.map((b, i) => ({ ...b, zOffset: i }));
}

/** A timed event block rendered inside the time-grid column. */
function TimedBlock({ task, color, startMin, durationMin, zOffset, isAllDay, onSelect }) {
  const top = startMin * PX_PER_MIN;
  const height = Math.max(durationMin * PX_PER_MIN, 18);
  const short = height < 36;

  return (
    <div
      onClick={() => onSelect?.(task)}
      title={task.title}
      style={{
        position: 'absolute',
        top,
        left: 2,
        right: 2,
        height,
        backgroundColor: isAllDay ? color + '55' : color + 'cc',
        borderLeft: `3px solid ${color}`,
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: isAllDay ? 1 : 2 + zOffset,
      }}
      className="flex flex-col justify-start px-1.5 py-0.5 hover:brightness-110 transition select-none"
    >
      <span className={`font-bold leading-tight truncate ${short ? 'text-[8px]' : 'text-[9px]'} ${isAllDay ? 'text-white/70' : 'text-white'}`}>
        {task.title}
      </span>
      {!short && !isAllDay && (
        <span className="text-[7.5px] text-white/70 font-mono mt-0.5 truncate">
          {fmtMin(startMin)} – {fmtMin(startMin + durationMin)}
        </span>
      )}
      {!short && isAllDay && (
        <span className="text-[7px] text-white/50 font-mono mt-0.5 truncate">all day</span>
      )}
    </div>
  );
}

/** Chip in the header strip. Pass timeLabel for timed items. */
function AllDayChip({ task, color, onSelect, timeLabel }) {
  return (
    <div
      onClick={() => onSelect?.(task)}
      title={task.title}
      style={{ backgroundColor: color + 'cc', borderLeft: `3px solid ${color}` }}
      className="text-[8.5px] font-bold text-white px-1.5 py-0.5 rounded-md truncate max-w-full cursor-pointer hover:brightness-110 transition select-none flex items-center gap-1"
    >
      {timeLabel && <span className="font-mono text-white/60 text-[7px] shrink-0">{timeLabel}</span>}
      <span className="truncate">{task.title}</span>
    </div>
  );
}

// ── Inline event/task panel ───────────────────────────────────────────────────

const GCAL_COLORS_LIST = [
  { id: null,  hex: '#4285f4', name: 'Default'  },
  { id: '1',   hex: '#d50000', name: 'Tomato'   },
  { id: '2',   hex: '#e67c73', name: 'Flamingo' },
  { id: '3',   hex: '#f4511e', name: 'Tangerine'},
  { id: '4',   hex: '#f6bf26', name: 'Banana'   },
  { id: '5',   hex: '#33b679', name: 'Sage'     },
  { id: '6',   hex: '#0b8043', name: 'Basil'    },
  { id: '7',   hex: '#039be5', name: 'Peacock'  },
  { id: '8',   hex: '#3f51b5', name: 'Blueberry'},
  { id: '9',   hex: '#7986cb', name: 'Lavender' },
  { id: '10',  hex: '#8e24aa', name: 'Grape'    },
  { id: '11',  hex: '#616161', name: 'Graphite' },
];

const PRIORITY_CFG = [
  { level: Priority.P1, label: 'Critical', Icon: Flame,       cls: 'text-rose-400 border-rose-500/30 bg-rose-500/10'   },
  { level: Priority.P2, label: 'Medium',   Icon: ShieldAlert, cls: 'text-amber-400 border-amber-500/30 bg-amber-500/10'},
  { level: Priority.P3, label: 'General',  Icon: HelpCircle,  cls: 'text-sky-400 border-sky-500/30 bg-sky-500/10'      },
];

function fmt24(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * Slide-in right panel inside the expanded modal.
 * mode = 'view' | 'edit' | 'create'
 */
function EventPanel({ panelState, projects, onClose, onSave, onDelete, onToggleComplete }) {
  const { mode, task, date, startMin: initStart } = panelState;
  const isReadOnly = mode === 'view' && task && isFeedItem(task);
  const isCreate   = mode === 'create';

  // ── draft state ──
  const [title,    setTitle]    = useState(() => isCreate ? '' : (task?.title || ''));
  const [desc,     setDesc]     = useState(() => task?.description || '');
  const [dueDate,  setDueDate]  = useState(() => task?.dueDate || date || getTodayDateString());
  const [time,     setTime]     = useState(() => task?.time || (initStart != null ? `${String(Math.floor(initStart / 60)).padStart(2,'0')}:${String(initStart % 60).padStart(2,'0')}` : ''));
  const [endTime,  setEndTime]  = useState(() => task?.endTime || '');
  const [priority, setPriority] = useState(() => task?.priority || Priority.P3);
  const [projectId,setProjectId]= useState(() => task?.projectId || projects[0]?.id || '');
  const [labels,   setLabels]   = useState(() => (task?.labels || []).join(', '));
  const [colorId,  setColorId]  = useState(() => task?.colorId || null);
  const [saving,   setSaving]   = useState(false);

  const accentColor = GCAL_COLOR_MAP[colorId] || taskColor(task || { feedCategory: 'todo', colorId });

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: desc.trim() || undefined,
      dueDate: dueDate || undefined,
      time: time || undefined,
      endTime: endTime || undefined,
      priority,
      projectId: projectId || undefined,
      labels: labels.split(',').map((s) => s.trim().replace(/^@/, '')).filter(Boolean),
      colorId: colorId || undefined,
    };
    await onSave(payload);
    setSaving(false);
  }

  // Read-only feed item view
  if (isReadOnly && task) {
    const catColors = {
      event:   { color: '#10b981', label: '📣 EVENT',    grad: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20' },
      task:    { color: '#6366f1', label: '📅 DEADLINE', grad: 'from-violet-500/10 to-purple-500/5 border-violet-500/20' },
      session: { color: '#0ea5e9', label: '🎓 SESSION',  grad: 'from-sky-500/10 to-blue-500/5 border-sky-500/20'         },
      contest: { color: '#d97706', label: '🏆 CONTEST',  grad: 'from-amber-500/10 to-yellow-500/5 border-amber-500/20'   },
    };
    const cfg = catColors[task.feedCategory] || catColors.contest;
    const feedUrl = getFeedItemUrl(task);

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
            <span className="text-[9px] font-black font-mono tracking-widest text-slate-400 uppercase">{cfg.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {feedUrl && (
              <a href={feedUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black font-mono bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition">
                <ExternalLink className="w-3 h-3" /><span>PORTAL</span>
              </a>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {/* Title card */}
          <div className={`p-4 rounded-2xl border bg-gradient-to-br ${cfg.grad}`}>
            <h2 className="text-sm font-extrabold text-white break-words leading-snug">{task.title}</h2>
            {task.bootcampTitle && (
              <span className="mt-1.5 inline-block text-[9px] font-black font-mono text-white/60 uppercase tracking-wider">{task.bootcampTitle}</span>
            )}
          </div>

          {task.description && (
            <div className="text-xs text-slate-300 bg-white/[0.02] border border-white/5 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
              {task.description}
            </div>
          )}

          {/* ── Bootcamp task fields ── */}
          {task.feedCategory === 'task' && (
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl space-y-2 text-[11px]">
              {task.availableFrom && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Available from</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(task.availableFrom + 'T12:00:00+06:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {task.startTime && <span className="text-slate-400 font-mono ml-1">{fmt24(task.startTime)}</span>}
                  </span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Deadline</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(
                      task.endTime ? `${task.dueDate}T${task.endTime}:00+06:00` : `${task.dueDate}T00:00:00+06:00`
                    ).toLocaleString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {task.difficulty && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Difficulty</span>
                  <span className="capitalize text-slate-200 font-bold">{task.difficulty}</span>
                </div>
              )}
              {typeof task.points === 'number' && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Points</span>
                  <span className="text-slate-200 font-bold">
                    {typeof task.pointsEarned === 'number' ? `${task.pointsEarned} / ${task.points}` : task.points}
                  </span>
                </div>
              )}
              {task.submissionStatus && task.submissionStatus !== 'pending' && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Submission</span>
                  <span className={`capitalize font-bold ${task.submissionStatus === 'accepted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {task.submissionStatus}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Session fields ── */}
          {task.feedCategory === 'session' && (
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl space-y-2 text-[11px]">
              {task.dueDate && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Date</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(task.dueDate + 'T12:00:00+06:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              {(task.time || task.endTime) && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Time</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {fmt24(task.time)}{task.endTime ? ` – ${fmt24(task.endTime)}` : ''}
                    {typeof task.durationMin === 'number' && (
                      <span className="text-slate-400 font-mono ml-1">
                        ({task.durationMin >= 60 ? `${Math.floor(task.durationMin / 60)}h${task.durationMin % 60 ? ` ${task.durationMin % 60}m` : ''}` : `${task.durationMin}m`})
                      </span>
                    )}
                  </span>
                </div>
              )}
              {task.location && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Location</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />{task.location}
                  </span>
                </div>
              )}
              {task.status && task.status !== 'scheduled' && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Status</span>
                  <span className="capitalize text-slate-200 font-bold">{task.status}</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {task.url && (
                  <a href={task.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black font-mono bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 rounded-lg transition">
                    <ExternalLink className="w-3 h-3" /><span>JOIN</span>
                  </a>
                )}
                {task.recordingUrl && (
                  <a href={task.recordingUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black font-mono bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-400 rounded-lg transition">
                    <ExternalLink className="w-3 h-3" /><span>RECORDING</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── Contest fields ── */}
          {task.feedCategory === 'contest' && (
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl space-y-2 text-[11px]">
              {task.contestPlatform && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Platform</span>
                  <span className="capitalize text-slate-200 font-bold">{task.contestPlatform}</span>
                </div>
              )}
              {(task.dueDate || task.contestTime) && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Date / Time</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {task.dueDate && new Date(task.dueDate + 'T12:00:00+06:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {task.contestTime && <span className="font-mono ml-1">{fmt24(task.contestTime)}</span>}
                  </span>
                </div>
              )}
              {task.contestDuration && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Duration</span>
                  <span className="text-slate-200 font-bold">{task.contestDuration}</span>
                </div>
              )}
              {task.location && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Location</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />{task.location}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Event / personal fields ── */}
          {(task.feedCategory === 'event' || task.feedCategory === 'personal') && (
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl space-y-2 text-[11px]">
              {task.dueDate && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Date</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(task.dueDate + 'T12:00:00+06:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {task.endDate && task.endDate !== task.dueDate && (
                      <span className="text-slate-400"> – {new Date(task.endDate + 'T12:00:00+06:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                  </span>
                </div>
              )}
              {(task.time || task.endTime) && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Time</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {fmt24(task.time)}{task.endTime ? ` – ${fmt24(task.endTime)}` : ''}
                  </span>
                </div>
              )}
              {task.location && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Location</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />{task.location}
                  </span>
                </div>
              )}
              {task.eventCategory && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Category</span>
                  <span className="capitalize text-slate-200 font-bold">{task.eventCategory}</span>
                </div>
              )}
              {task.url && (
                <div className="pt-1">
                  <a href={task.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black font-mono bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg transition w-fit">
                    <Link2 className="w-3 h-3" /><span>OPEN LINK</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Create / Edit form ──
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="text-[9px] font-black font-mono tracking-widest text-slate-400 uppercase">
            {isCreate ? 'NEW GOAL' : 'EDIT GOAL'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {!isCreate && task && (
            <>
              <button
                onClick={() => onToggleComplete?.(task.id)}
                title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                className={`p-1.5 rounded-lg transition ${task.completed ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-slate-400 hover:text-emerald-400'}`}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={() => onDelete?.(task.id)}
                className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {/* Title */}
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Goal title…"
          className="w-full bg-transparent border-b border-white/10 focus:border-violet-500 outline-none text-sm font-bold text-white placeholder:text-slate-600 py-1.5 transition"
        />

        {/* Description */}
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)…"
          rows={3}
          className="w-full bg-white/[0.02] border border-white/5 focus:border-violet-500/50 outline-none rounded-xl text-xs text-slate-300 placeholder:text-slate-600 p-2.5 resize-none transition"
        />

        {/* Date + time row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-lg text-[10px] text-white px-2 py-1.5 outline-none focus:border-violet-500/50 transition [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />Start time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-lg text-[10px] text-white px-2 py-1.5 outline-none focus:border-violet-500/50 transition [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />End time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 rounded-lg text-[10px] text-white px-2 py-1.5 outline-none focus:border-violet-500/50 transition [color-scheme:dark]"
          />
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Flag className="w-2.5 h-2.5" />Priority
          </label>
          <div className="flex gap-1.5">
            {PRIORITY_CFG.map(({ level, label, Icon, cls }) => (
              <button
                key={level}
                onClick={() => setPriority(level)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[9px] font-black font-mono transition ${priority === level ? cls : 'border-white/5 text-slate-500 hover:text-slate-300'}`}
              >
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Project */}
        {projects.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-2.5 h-2.5" />List
            </label>
            <div className="flex flex-wrap gap-1.5">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProjectId(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold border transition ${projectId === p.id ? 'border-violet-500/50 bg-violet-600/15 text-white' : 'border-white/5 text-slate-500 hover:text-slate-300'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Labels */}
        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />Labels
          </label>
          <input
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            placeholder="practice, contest, urgent…"
            className="w-full bg-white/[0.02] border border-white/5 rounded-lg text-[10px] text-white placeholder:text-slate-600 px-2.5 py-1.5 outline-none focus:border-violet-500/50 transition"
          />
        </div>

        {/* Colour swatch */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Colour</label>
          <div className="flex flex-wrap gap-1.5">
            {GCAL_COLORS_LIST.map(({ id, hex, name }) => (
              <button
                key={id ?? 'default'}
                onClick={() => setColorId(id)}
                title={name}
                style={{ backgroundColor: hex }}
                className={`w-5 h-5 rounded-full border-2 transition hover:scale-110 ${colorId === id ? 'border-white scale-110' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5 flex gap-2 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 py-2 text-[10px] font-black font-mono text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition border border-white/5"
        >
          CANCEL
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex-1 py-2 text-[10px] font-black font-mono bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition shadow-lg shadow-violet-600/20"
        >
          {saving ? 'SAVING…' : isCreate ? 'ADD GOAL' : 'SAVE'}
        </button>
      </div>
    </div>
  );
}

// ── layer config ─────────────────────────────────────────────────────────────

const LAYER_DEFAULTS = {
  todo:     '#7c3aed',
  personal: '#e11d48',
  events:   '#059669',
  contests: '#d97706',
  tasks:    '#6366f1',
  sessions: '#0ea5e9',
  gcal:     '#4285f4',
  gtask:    '#34a853',
};

const PALETTE = [
  '#4285f4','#d50000','#e67c73','#f4511e','#f6bf26',
  '#33b679','#0b8043','#039be5','#3f51b5','#7986cb',
  '#8e24aa','#616161','#f09300','#ad1457','#0097a7','#795548',
];

const LAYERS_CFG = [
  { key: 'todo',     label: 'Todos',    emoji: '✔' },
  { key: 'personal', label: 'Events',   emoji: '📌' },
  { key: 'events',   label: 'Feed',     emoji: '📣' },
  { key: 'contests', label: 'Contests', emoji: '🏆' },
  { key: 'tasks',    label: 'Tasks',    emoji: '📅' },
  { key: 'sessions', label: 'Sessions', emoji: '🎓' },
];

function resolveTaskColor(task, layerColors, subColors, projects) {
  if (task.colorId && GCAL_COLOR_MAP[task.colorId]) return GCAL_COLOR_MAP[task.colorId];
  if (task.isContest) {
    const platform = (task.contestPlatform || 'other').toLowerCase();
    return subColors[`platform:${platform}`] || layerColors.contests;
  }
  if (task.feedCategory === 'task') {
    const bc = task.bootcampTitle || 'Other';
    return subColors[`bootcamp:${bc}`] || layerColors.tasks;
  }
  if (task.feedCategory === 'session') {
    const bc = task.bootcampTitle || 'Other';
    return subColors[`bootcamp:${bc}`] || layerColors.sessions;
  }
  if (task.feedCategory === 'personal') return layerColors.personal;
  if (task.feedCategory === 'event')    return layerColors.events;
  if (task.feedCategory === 'gcal')     return layerColors.gcal   || LAYER_DEFAULTS.gcal;
  if (task.feedCategory === 'gtask')    return layerColors.gtask  || LAYER_DEFAULTS.gtask;
  // todo — per-project color
  const proj = (projects || []).find((p) => p.id === task.projectId);
  if (proj) return subColors[`project:${proj.name}`] || proj.color || layerColors.todo;
  return layerColors.todo;
}

function layerVisible(task, showLayers, subVis) {
  if (task.isContest) {
    if (showLayers.contests === false) return false;
    const platform = (task.contestPlatform || 'other').toLowerCase();
    return subVis[`platform:${platform}`] !== false;
  }
  if (task.feedCategory === 'task') {
    if (showLayers.tasks === false) return false;
    const bc = task.bootcampTitle || 'Other';
    return subVis[`bootcamp-task:${bc}`] !== false;
  }
  if (task.feedCategory === 'session') {
    if (showLayers.sessions === false) return false;
    const bc = task.bootcampTitle || 'Other';
    return subVis[`bootcamp-session:${bc}`] !== false;
  }
  if (task.feedCategory === 'personal') return showLayers.personal !== false;
  if (task.feedCategory === 'event')    return showLayers.events   !== false;
  // todo — per-project
  if (showLayers.todo === false) return false;
  if (task.projectId) return subVis[`project:${task.projectId}`] !== false;
  return true;
}

// ── main component ────────────────────────────────────────────────────────────

export default function ExpandedCalendarModal({
  open, tasks = [], projects = [],
  onClose,
  onAddTask, onUpdateTask, onDeleteTask, onToggleComplete,
}) {
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [anchor,   setAnchor]   = useState(() => weekStart(new Date()));
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const gridRef  = useRef(null);
  const [now, setNow] = useState(() => new Date());
  const [panelState, setPanelState] = useState(null);

  // Layer visibility + colors (persisted to localStorage)
  const [showLayers, setShowLayers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ecm_layers') || 'null') || {}; } catch { return {}; }
  });
  const [layerColors, setLayerColors] = useState(() => {
    try { return { ...LAYER_DEFAULTS, ...JSON.parse(localStorage.getItem('ecm_colors') || 'null') }; }
    catch { return { ...LAYER_DEFAULTS }; }
  });
  const [colorPickerOpen, setColorPickerOpen] = useState(null); // 'layer:todo' | 'sub:platform:cf' etc.
  // Sub-item colors: { 'platform:codeforces': '#hex', 'bootcamp:CS101': '#hex', 'project:Inbox': '#hex' }
  const [subColors, setSubColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ecm_sub_colors') || 'null') || {}; } catch { return {}; }
  });
  // Sub-item visibility: { 'platform:cf': false, 'bootcamp-task:CS': false, 'project:uuid': false }
  const [subVis, setSubVis] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ecm_sub_vis') || 'null') || {}; } catch { return {}; }
  });

  const setLayerColor = useCallback((key, hex) => {
    setLayerColors((prev) => {
      const next = { ...prev, [key]: hex };
      try { localStorage.setItem('ecm_colors', JSON.stringify(next)); } catch { /* */ }
      return next;
    });
  }, []);

  const setSubColor = useCallback((key, hex) => {
    setSubColors((prev) => {
      const next = { ...prev, [key]: hex };
      try { localStorage.setItem('ecm_sub_colors', JSON.stringify(next)); } catch { /* */ }
      return next;
    });
  }, []);

  const toggleSubVis = useCallback((key) => {
    setSubVis((prev) => {
      const next = { ...prev, [key]: !(prev[key] !== false) };
      try { localStorage.setItem('ecm_sub_vis', JSON.stringify(next)); } catch { /* */ }
      return next;
    });
  }, []);

  const toggleLayer = useCallback((key) => {
    setShowLayers((prev) => {
      const next = { ...prev, [key]: !(prev[key] !== false) };
      try { localStorage.setItem('ecm_layers', JSON.stringify(next)); } catch { /* */ }
      return next;
    });
  }, []);

  // Timer + scroll + esc + body-lock
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open || !gridRef.current) return;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    gridRef.current.scrollTop = Math.max(0, (nowMin - 60) * PX_PER_MIN);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const todayStr = getTodayDateString();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(anchor, i));

  // ── nav ──
  const prev = () => {
    if (viewMode === 'week')  setAnchor((d) => addDays(d, -7));
    else setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const next = () => {
    if (viewMode === 'week')  setAnchor((d) => addDays(d, 7));
    else setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const goToday = () => {
    const d = new Date();
    setAnchor(weekStart(d));
    setMonthAnchor(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // ── panel handlers ──
  const openTask   = useCallback((t) => setPanelState({ mode: isFeedItem(t) ? 'view' : 'edit', task: t, date: t.dueDate }), []);
  const closePanel = useCallback(() => setPanelState(null), []);

  const handlePanelSave = useCallback(async (payload) => {
    if (!panelState || !panelState.task) return;
    await onUpdateTask?.(panelState.task.id, payload);
    closePanel();
  }, [panelState, onUpdateTask, closePanel]);

  const handlePanelDelete = useCallback(async (taskId) => {
    await onDeleteTask?.(taskId); closePanel();
  }, [onDeleteTask, closePanel]);

  // ── derived sub-item lists ──
  const availablePlatforms = useMemo(() =>
    [...new Set(tasks.filter((t) => t.isContest).map((t) => (t.contestPlatform || 'other').toLowerCase()))].sort()
  , [tasks]);

  const availableBootcamps = useMemo(() =>
    [...new Set(tasks.filter((t) => t.feedCategory === 'task' || t.feedCategory === 'session').map((t) => t.bootcampTitle || 'Other'))].sort()
  , [tasks]);

  // ── filtered task resolution per day ──
  const getColor = useCallback((t) => resolveTaskColor(t, layerColors, subColors, projects), [layerColors, subColors, projects]);

  // Spanning tasks: cover multiple days → rendered as a single header chip, not per-column.
  const isSpanning = useCallback((t) => {
    if (t.feedCategory === 'task' && t.availableFrom && t.dueDate && t.availableFrom !== t.dueDate) return true;
    if (t.feedCategory === 'personal' && t.endDate && t.endDate > t.dueDate) return true;
    return false;
  }, []);

  // Compute spanning tasks visible in the current week.
  const weekSpanningTasks = useMemo(() => {
    const weekStartStr = formatDateString(weekDays[0]);
    const weekEndStr   = formatDateString(weekDays[6]);
    return tasks
      .filter((t) => !t.isArchived && isSpanning(t) && layerVisible(t, showLayers, subVis))
      .map((t) => {
        const spanStart = t.availableFrom || t.dueDate;
        const spanEnd   = t.endDate && t.endDate > t.dueDate ? t.endDate : t.dueDate;
        // Clamp to visible week
        const clampedStart = spanStart < weekStartStr ? weekStartStr : spanStart;
        const clampedEnd   = spanEnd   > weekEndStr   ? weekEndStr   : spanEnd;
        if (clampedStart > weekEndStr || clampedEnd < weekStartStr) return null;
        // findIndex by string comparison; fall back to boundary columns if not found
        const startCol = Math.max(0, weekDays.findIndex((d) => formatDateString(d) >= clampedStart));
        const endColIdx = weekDays.findLastIndex((d) => formatDateString(d) <= clampedEnd);
        const endCol = endColIdx === -1 ? 6 : endColIdx;
        return {
          task: t,
          startCol,
          endCol,
          clipsLeft:  spanStart < weekStartStr,
          clipsRight: spanEnd   > weekEndStr,
        };
      })
      .filter(Boolean);
  }, [tasks, showLayers, subVis, weekDays, isSpanning]);

  const dayTasksFiltered = useCallback((dateObj) => {
    const dateStr = formatDateString(dateObj);
    const matching = tasks.filter((t) =>
      !t.isArchived && !isSpanning(t) && isTaskOnDate(t, dateStr) && layerVisible(t, showLayers, subVis)
    );
    const timed = [], allDay = [];
    for (const t of matching) {
      const isTodo = !t.feedCategory && !t.isContest;
      // Bootcamp tasks store their start in startTime, not time (time is always null for tasks)
      const timeField = t.feedCategory === 'task' ? t.startTime : t.time;
      const startMin  = toMinutes(timeField);
      if (startMin !== null) {
        const endMin = toMinutes(t.endTime);
        const dur = endMin !== null && endMin > startMin ? endMin - startMin : (t.durationMin ?? 60);
        timed.push({ task: t, startMin, durationMin: Math.max(dur, 15), isAllDay: false });
      } else if (isTodo && t.dueDate) {
        timed.push({ task: t, startMin: 8 * 60, durationMin: 14 * 60, isAllDay: true });
      } else {
        allDay.push(t);
      }
    }
    return { timed: layoutBlocks(timed), allDay };
  }, [tasks, showLayers, subVis, isSpanning]);

  // ── month grid data ──
  const monthYear  = monthAnchor.getFullYear();
  const monthMonth = monthAnchor.getMonth();
  const firstDow   = new Date(monthYear, monthMonth, 1).getDay();
  const daysInMon  = new Date(monthYear, monthMonth + 1, 0).getDate();
  const prevLastDay = new Date(monthYear, monthMonth, 0).getDate();
  const monthGridDates = [
    ...Array.from({ length: firstDow }, (_, i) => new Date(monthYear, monthMonth - 1, prevLastDay - firstDow + i + 1)),
    ...Array.from({ length: daysInMon }, (_, i) => new Date(monthYear, monthMonth, i + 1)),
  ];
  while (monthGridDates.length % 7 !== 0) {
    monthGridDates.push(new Date(monthYear, monthMonth + 1, monthGridDates.length - firstDow - daysInMon + 1));
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = nowMin * PX_PER_MIN;

  const rangeLabel = viewMode === 'week'
    ? (() => { const s = weekDays[0], e = weekDays[6];
        return s.getMonth() === e.getMonth()
          ? `${MONTH_NAME[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
          : `${MONTH_NAME[s.getMonth()]} ${s.getDate()} – ${MONTH_NAME[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`; })()
    : `${MONTH_NAME[monthMonth]} ${monthYear}`;

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="expanded-cal-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="ecm-root fixed inset-0 z-200 flex flex-col bg-[#0d1117] text-slate-200 overflow-hidden"
          style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
          onClick={() => setColorPickerOpen(null)}
        >
          {/* ── Top bar ── */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-white/[0.07] shrink-0">
            <div className="flex items-center gap-1.5 mr-1">
              <div className="p-1.5 bg-violet-500/15 rounded-lg border border-violet-500/20 text-violet-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-[12px] font-extrabold text-white tracking-tight hidden sm:block">Calendar</span>
            </div>

            <button onClick={goToday} className="px-2.5 py-1 text-[9px] font-black font-mono bg-slate-800 hover:bg-slate-700 border border-white/6 rounded-lg text-violet-300 hover:text-white transition shrink-0">
              TODAY
            </button>

            <div className="flex items-center bg-slate-900 border border-white/6 rounded-lg overflow-hidden shrink-0">
              <button onClick={prev} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <div className="w-px h-3.5 bg-white/10" />
              <button onClick={next} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <span className="text-[11px] font-bold text-white/80 tracking-tight hidden md:block">{rangeLabel}</span>

            <div className="flex-1" />

            {/* ── Layer pills with sub-options ── */}
            <div className="hidden lg:flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {LAYERS_CFG.map(({ key, label, emoji }) => {
                const on = showLayers[key] !== false;
                const color = layerColors[key];
                const dropKey = `layer:${key}`;
                const dropOpen = colorPickerOpen === dropKey;

                // Sub-items for this layer
                const subItems = key === 'contests' ? availablePlatforms.map((p) => ({ id: `platform:${p}`, visKey: `platform:${p}`, colorKey: `platform:${p}`, label: p }))
                  : key === 'tasks'    ? availableBootcamps.map((b) => ({ id: `bc-t:${b}`, visKey: `bootcamp-task:${b}`, colorKey: `bootcamp:${b}`, label: b }))
                  : key === 'sessions' ? availableBootcamps.map((b) => ({ id: `bc-s:${b}`, visKey: `bootcamp-session:${b}`, colorKey: `bootcamp:${b}`, label: b }))
                  : key === 'todo'     ? projects.map((p) => ({ id: `proj:${p.id}`, visKey: `project:${p.id}`, colorKey: `project:${p.name}`, label: p.name, defaultColor: p.color }))
                  : [];

                return (
                  <div key={key} className="relative">
                    <div className={`flex items-center gap-0 rounded-lg border text-[8.5px] font-black font-mono transition overflow-visible ${on ? 'border-white/10' : 'border-transparent opacity-40'}`}
                      style={on ? { backgroundColor: color + '22' } : {}}>
                      {/* Toggle */}
                      <button onClick={() => toggleLayer(key)} className="px-2 py-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: on ? color : '#555' }} />
                        <span className={on ? 'text-slate-200' : 'text-slate-500'}>{emoji} {label}</span>
                      </button>
                      {/* Drop arrow */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setColorPickerOpen(dropOpen ? null : dropKey); }}
                        className="px-1.5 py-1 hover:bg-white/5 text-slate-400 hover:text-white transition flex items-center"
                        title="Options"
                      >
                        <svg className={`w-2.5 h-2.5 transition-transform ${dropOpen ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="none">
                          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>

                    {dropOpen && (
                      <div
                        className="absolute top-full mt-1 left-0 z-50 bg-[#1c2333] border border-white/10 rounded-xl shadow-2xl min-w-52 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Layer color row */}
                        <div className="p-2.5 border-b border-white/5">
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Layer colour</div>
                          <div className="flex flex-wrap gap-1.5">
                            {PALETTE.map((hex) => (
                              <button key={hex} onClick={() => setLayerColor(key, hex)}
                                style={{ backgroundColor: hex }}
                                className={`w-4 h-4 rounded-full border-2 transition hover:scale-110 ${layerColors[key] === hex ? 'border-white scale-110' : 'border-transparent'}`}
                              />
                            ))}
                            <button onClick={() => setLayerColor(key, LAYER_DEFAULTS[key])}
                              className="w-4 h-4 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[7px] text-slate-500 hover:text-white transition">↺</button>
                          </div>
                        </div>

                        {/* Sub-items */}
                        {subItems.length > 0 && (
                          <div className="p-2.5 max-h-56 overflow-y-auto no-scrollbar">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                              {key === 'todo' ? 'Lists' : key === 'contests' ? 'Platforms' : 'Bootcamps'}
                            </div>
                            <div className="space-y-0.5">
                              {subItems.map((si) => {
                                const siOn = subVis[si.visKey] !== false;
                                const siColor = subColors[si.colorKey] || si.defaultColor || color;
                                const siPickerKey = `sub:${si.colorKey}`;
                                const siPickerOpen = colorPickerOpen === siPickerKey;
                                return (
                                  <div key={si.id}>
                                    <div className="flex items-center justify-between py-0.5 px-1 hover:bg-white/5 rounded-lg">
                                      <button
                                        onClick={() => toggleSubVis(si.visKey)}
                                        className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                                      >
                                        <div className={`w-3 h-3 rounded border flex items-center justify-center transition shrink-0 ${siOn ? 'border-white/40' : 'border-white/10'}`}
                                          style={siOn ? { backgroundColor: siColor } : {}}>
                                          {siOn && <svg className="w-2 h-2" viewBox="0 0 8 8" fill="none"><path d="M1 4l2.5 2.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                                        </div>
                                        <span className={`text-[9px] font-bold truncate ${siOn ? 'text-slate-200' : 'text-slate-500'}`}>{si.label}</span>
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setColorPickerOpen(siPickerOpen ? dropKey : siPickerKey); }}
                                        className="w-3.5 h-3.5 rounded-full border-2 shrink-0 ml-1.5 transition hover:scale-110"
                                        style={{ backgroundColor: siColor, borderColor: siPickerOpen ? 'white' : 'transparent' }}
                                      />
                                    </div>
                                    {siPickerOpen && (
                                      <div className="flex flex-wrap gap-1 px-1 pb-1.5">
                                        {PALETTE.map((hex) => (
                                          <button key={hex} onClick={() => { setSubColor(si.colorKey, hex); setColorPickerOpen(dropKey); }}
                                            style={{ backgroundColor: hex }}
                                            className={`w-3.5 h-3.5 rounded-full border-2 transition hover:scale-110 ${subColors[si.colorKey] === hex ? 'border-white scale-110' : 'border-transparent'}`}
                                          />
                                        ))}
                                        <button onClick={() => { setSubColor(si.colorKey, si.defaultColor || color); setColorPickerOpen(dropKey); }}
                                          className="w-3.5 h-3.5 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[6px] text-slate-500 hover:text-white transition">↺</button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── View toggle ── */}
            <div className="flex bg-slate-900 border border-white/6 rounded-lg p-0.5 shrink-0 text-[9px] font-black font-mono">
              <button onClick={() => setViewMode('week')}
                className={`px-2.5 py-1 rounded-md transition ${viewMode === 'week' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                WEEK
              </button>
              <button onClick={() => setViewMode('month')}
                className={`px-2.5 py-1 rounded-md transition ${viewMode === 'month' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                MONTH
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition shrink-0" title="Close (Esc)">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Body (calendar + right panel) ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* ── Calendar area ── */}
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">

              {viewMode === 'week' ? (
                <>
                  {/* Week column headers + all-day */}
                  <div className="flex flex-col shrink-0 bg-[#161b22] border-b border-white/[0.07]">
                    {/* Day labels row */}
                    <div className="flex">
                      <div className="w-13 shrink-0 border-r border-white/6" />
                      {weekDays.map((d, idx) => {
                        const dStr = formatDateString(d);
                        const isToday = dStr === todayStr;
                        return (
                          <div key={`whdr-${idx}`} className="flex-1 min-w-0 border-r border-white/5 last:border-r-0">
                            <div className={`flex flex-col items-center py-1.5 ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>
                              <span className="text-[8px] font-black font-mono tracking-widest uppercase">{DAY_ABBR[d.getDay()]}</span>
                              <span className={`text-[14px] font-extrabold mt-0.5 leading-none ${isToday ? 'bg-violet-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''}`}>
                                {d.getDate()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Spanning multi-day tasks + single-day all-day chips */}
                    <div className="flex">
                      <div className="w-13 shrink-0 border-r border-white/6" />
                      {/* Grid overlay for spanning tasks — capped so total rows (spanning + chips) ≤ 5 */}
                      <div className="flex-1 grid grid-cols-7 relative pb-1">
                        {weekSpanningTasks.slice(0, 5).map(({ task: t, startCol, endCol, clipsLeft, clipsRight }) => {
                          const color = getColor(t);
                          const startLabel = t.startTime ? fmtMin(toMinutes(t.startTime)) : null;
                          const endLabel   = t.endTime   ? fmtMin(toMinutes(t.endTime))   : null;
                          return (
                            <div
                              key={`span-${t.id}`}
                              onClick={() => openTask(t)}
                              title={t.title}
                              style={{
                                gridColumn: `${startCol + 1} / ${endCol + 2}`,
                                backgroundColor: color + 'cc',
                                borderLeft:  clipsLeft  ? 'none' : `3px solid ${color}`,
                                borderRight: clipsRight ? 'none' : undefined,
                                borderRadius: `${clipsLeft ? 0 : 6}px ${clipsRight ? 0 : 6}px ${clipsRight ? 0 : 6}px ${clipsLeft ? 0 : 6}px`,
                              }}
                              className="mx-0.5 mt-0.5 px-1.5 py-0.5 cursor-pointer hover:brightness-110 transition select-none flex items-center justify-between gap-1 overflow-hidden min-w-0"
                            >
                              <span className="text-[8.5px] font-bold text-white truncate">{t.title}</span>
                              <span className="text-[7px] text-white/60 font-mono shrink-0 hidden sm:block">
                                {startLabel && endLabel ? `${startLabel}–${endLabel}` : startLabel || endLabel || ''}
                              </span>
                            </div>
                          );
                        })}
                        {/* All items per column — timed (sorted by startMin) + allDay */}
                        {weekDays.map((d, idx) => {
                          const dStr = formatDateString(d);
                          const { timed, allDay } = dayTasksFiltered(d);
                          // Same composite score as time grid: startMin − durationMin.
                          // Higher score = shorter + later = shown first (top of header list).
                          const timedSorted = [...timed].sort(
                            (a, b) => (b.startMin - b.durationMin) - (a.startMin - a.durationMin)
                          );
                          const allItems = [
                            ...timedSorted.map((b) => ({ task: b.task, timeLabel: fmtMin(b.startMin) })),
                            ...allDay.map((t) => ({ task: t, timeLabel: null })),
                          ];
                          // Count only the capped spanning bars for this column.
                          const spanCount = weekSpanningTasks.slice(0, 5).filter((s) => idx >= s.startCol && idx <= s.endCol).length;
                          if (!allItems.length) return null;
                          const MAX = Math.max(0, 5 - spanCount);
                          const hidden = allItems.length - MAX;
                          return (
                            <div key={`ad-col-${idx}`} style={{ gridColumn: `${idx + 1} / ${idx + 2}` }} className="px-0.5 space-y-0.5">
                              {allItems.slice(0, MAX).map(({ task: t, timeLabel }) => (
                                <AllDayChip key={`hdr-${t.id}-${dStr}`} task={t} color={getColor(t)} onSelect={openTask} timeLabel={timeLabel} />
                              ))}
                              {hidden > 0 && (
                                <button
                                  onClick={() => { setAnchor(weekStart(d)); }}
                                  title={`${hidden} more — view this day`}
                                  className="text-[7px] font-mono font-black text-violet-400 hover:text-violet-300 px-1 cursor-pointer transition"
                                >
                                  +{hidden} more
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Week time grid */}
                  <div ref={gridRef} className="flex flex-1 overflow-y-auto no-scrollbar overflow-x-hidden bg-[#0d1117]">
                    {/* Hour labels */}
                    <div className="w-13 shrink-0 relative border-r border-white/6">
                      {HOURS.map((h) => (
                        <div key={`hr-${h}`} style={{ height: HOUR_H }} className="relative flex items-start justify-end pr-2 pt-0.5">
                          {h > 0 && <span className="text-[9px] font-mono text-slate-500 leading-none -translate-y-1.25">{h % 12 || 12}{h < 12 ? 'am' : 'pm'}</span>}
                        </div>
                      ))}
                    </div>

                    {/* All 7 columns share a single relative container so spanning overlays can cross column boundaries */}
                    <div className="flex-1 relative" style={{ height: HOUR_H * 24 }}>
                      {/* Per-day column backgrounds + grid lines + timed blocks */}
                      {weekDays.map((d, ci) => {
                        const dStr = formatDateString(d);
                        const isToday = dStr === todayStr;
                        const { timed } = dayTasksFiltered(d);
                        const colLeft  = `${(ci / 7) * 100}%`;
                        const colWidth = `${(1 / 7) * 100}%`;
                        return (
                          <div
                            key={`dcol-${ci}`}
                            className="absolute top-0 bottom-0 border-r border-white/4"
                            style={{ left: colLeft, width: colWidth, zIndex: 10 }}
                          >
                            {HOURS.map((h) => (
                              <div key={`gl-${h}`} style={{ top: h * HOUR_H, height: HOUR_H }} className="absolute inset-x-0 border-t border-white/4">
                                <div className="absolute inset-x-0 top-1/2 border-t border-white/2" />
                              </div>
                            ))}
                            {isToday && <div className="absolute inset-0 bg-violet-500/2.5 pointer-events-none" />}
                            {isToday && (
                              <div style={{ top: nowTop }} className="absolute inset-x-0 z-50 pointer-events-none flex items-center">
                                <div className="w-2 h-2 rounded-full bg-red-500 -translate-x-1/2 shrink-0" />
                                <div className="h-px flex-1 bg-red-500" />
                              </div>
                            )}
                            {timed.map(({ task: t, startMin, durationMin, zOffset, isAllDay }) => (
                              <TimedBlock key={`tb-${t.id}-${dStr}`} task={t} color={getColor(t)}
                                startMin={startMin} durationMin={durationMin}
                                zOffset={zOffset} isAllDay={isAllDay}
                                onSelect={openTask}
                              />
                            ))}
                          </div>
                        );
                      })}

                      {/* Spanning multi-day task overlays — one segment per column so each
                          day can have the correct top/bottom edge independently:
                          • first column : startTime → midnight (bottom = 0)
                          • middle columns: midnight → midnight (full height)
                          • last column  : midnight → endTime  (top = 0)
                          Tasks are sorted longest→shortest (longer = behind = more transparent).
                          The topmost (shortest) task gets full opacity; deeper ones fade.        */}
                      {(() => {
                        const sorted = [...weekSpanningTasks].sort((a, b) => {
                          // Same composite score as single-day blocks:
                          // startMin − durationMin_equivalent (higher = shorter span + later start = in front).
                          // Convert day-columns to minutes so both are on the same scale.
                          const DAY_MINS = 24 * 60;
                          const scoreA = (toMinutes(a.task.startTime) ?? 0) - (a.endCol - a.startCol) * DAY_MINS;
                          const scoreB = (toMinutes(b.task.startTime) ?? 0) - (b.endCol - b.startCol) * DAY_MINS;
                          return scoreA - scoreB; // ascending: lowest score = behind
                        });
                        const total = sorted.length;
                        return sorted.flatMap(({ task: t, startCol, endCol, clipsLeft, clipsRight }, zIdx) => {
                        const color = getColor(t);
                        const TOTAL_MINS = 24 * 60;
                        const startMin = toMinutes(t.startTime) ?? 0;
                        const endMin   = toMinutes(t.endTime)   ?? TOTAL_MINS;
                        const colW     = 100 / 7;
                        const startLabel = t.startTime ? fmtMin(startMin) : null;
                        const endLabel   = t.endTime   ? fmtMin(endMin)   : null;
                        // Longest (behind) = most transparent; shortest (on top) = most opaque.
                        // zIdx 0 = longest/deepest, zIdx total-1 = shortest/topmost.
                        const alpha = total === 1 ? 0.50 : 0.20 + (zIdx / (total - 1)) * 0.35;

                        return Array.from({ length: endCol - startCol + 1 }, (_, i) => {
                          const col     = startCol + i;
                          const isFirst = col === startCol;
                          const isLast  = col === endCol;

                          // top edge: only the first column (if not clipped) starts mid-grid
                          const segTop = (isFirst && !clipsLeft) ? startMin * PX_PER_MIN : 0;
                          // bottom edge: only the last column (if not clipped) ends mid-grid
                          const segBottom = (isLast && !clipsRight) ? (TOTAL_MINS - endMin) * PX_PER_MIN : 0;

                          // Border: left accent only on first column; top/bottom caps on first/last
                          const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
                          const borderLeft   = (isFirst && !clipsLeft)  ? `3px solid ${color}` : 'none';
                          const borderTop    = (isFirst && !clipsLeft)  ? `1px solid ${color}${alphaHex}` : 'none';
                          const borderBottom = (isLast  && !clipsRight) ? `1px solid ${color}${alphaHex}` : 'none';
                          const rTL = (isFirst && !clipsLeft)  ? 6 : 0;
                          const rBL = (isFirst && !clipsLeft)  ? 6 : 0;
                          const rTR = (isLast  && !clipsRight) ? 6 : 0;
                          const rBR = (isLast  && !clipsRight) ? 6 : 0;

                          return (
                            <div
                              key={`grid-span-${t.id}-${col}`}
                              onClick={() => openTask(t)}
                              title={t.title}
                              style={{
                                position: 'absolute',
                                top: segTop,
                                bottom: segBottom,
                                left: `${(col / 7) * 100}%`,
                                width: `${colW}%`,
                                backgroundColor: `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`,
                                borderLeft,
                                borderTop,
                                borderBottom,
                                borderRadius: `${rTL}px ${rTR}px ${rBR}px ${rBL}px`,
                                zIndex: 1 + zIdx, // below column z-index (10); shorter/later span = higher within spanning layer
                                overflow: 'hidden',
                                cursor: 'pointer',
                              }}
                              className="px-1.5 py-1 hover:brightness-110 transition select-none flex flex-col justify-between"
                            >
                              {/* Title + start time on first segment only */}
                              {isFirst && (
                                <div>
                                  <div className="text-[8.5px] font-bold text-white truncate">{t.title}</div>
                                  {startLabel && !clipsLeft && (
                                    <div className="text-[7px] text-white/55 font-mono mt-0.5">▶ {startLabel}</div>
                                  )}
                                </div>
                              )}
                              {/* End time label anchored to bottom of last segment only */}
                              {isLast && endLabel && !clipsRight && (
                                <div className="text-[7px] text-white/55 font-mono self-start mt-auto">◀ {endLabel}</div>
                              )}
                            </div>
                          );
                        });
                        });
                      })()}
                    </div>
                  </div>
                </>
              ) : (
                /* ── Month view ── */
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Day-of-week header */}
                  <div className="grid grid-cols-7 bg-[#161b22] border-b border-white/[0.07] shrink-0">
                    {DAY_ABBR.map((d) => (
                      <div key={d} className="py-2 text-center text-[9px] font-black font-mono tracking-widest text-slate-500 uppercase">{d}</div>
                    ))}
                  </div>
                  {/* Grid cells */}
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: 'minmax(100px, 1fr)' }}>
                      {monthGridDates.map((dateObj, idx) => {
                        const dStr = formatDateString(dateObj);
                        const isThisMonth = dateObj.getMonth() === monthMonth;
                        const isToday = dStr === todayStr;
                        const { timed, allDay } = dayTasksFiltered(dateObj);
                        const allItems = [...allDay, ...timed.map((b) => b.task)];
                        const unique = [...new Map(allItems.map((t) => [t.id, t])).values()];
                        return (
                          <div
                            key={`mc-${idx}`}
                            className={`border-r border-b border-white/4 p-1.5 flex flex-col ${!isThisMonth ? 'opacity-30' : ''}`}
                          >
                            {/* Date number */}
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-[11px] font-extrabold leading-none font-mono ${isToday ? 'bg-violet-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : isThisMonth ? 'text-slate-300' : 'text-slate-600'}`}>
                                {dateObj.getDate()}
                              </span>
                            </div>
                            {/* Event chips */}
                            <div className="space-y-0.5 overflow-hidden flex-1">
                              {unique.slice(0, 5).map((t) => (
                                <div
                                  key={`mc-ev-${t.id}`}
                                  onClick={(e) => { e.stopPropagation(); openTask(t); }}
                                  title={t.title}
                                  style={{ backgroundColor: getColor(t) + 'cc', borderLeft: `2px solid ${getColor(t)}` }}
                                  className="text-[7.5px] font-bold text-white px-1 py-0.5 rounded truncate cursor-pointer hover:brightness-110 transition"
                                >
                                  {t.time && <span className="opacity-70 mr-0.5">{t.time}</span>}{t.title}
                                </div>
                              ))}
                              {unique.length > 5 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setAnchor(weekStart(dateObj)); setViewMode('week'); }}
                                  className="text-[7px] font-mono font-black text-violet-400 hover:text-violet-300 pl-1 cursor-pointer transition"
                                >
                                  +{unique.length - 5} more
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right panel ── */}
            <AnimatePresence>
              {panelState && (
                <motion.div
                  key="event-panel"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="w-85 shrink-0 bg-[#161b22] border-l border-white/8 flex flex-col overflow-hidden"
                >
                  <EventPanel
                    panelState={panelState}
                    projects={projects}
                    onClose={closePanel}
                    onSave={handlePanelSave}
                    onDelete={handlePanelDelete}
                    onToggleComplete={onToggleComplete}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
