'use client';

/**
 * Full-screen Google Calendar–style weekly time-grid modal.
 * Shows 24 hours × 7 days with timed events rendered as positioned blocks.
 * All-day / date-only items appear in a header strip above the grid.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { formatDateString, addDays, getTodayDateString, isTaskOnDate, fmt24, GCAL_COLOR_MAP, LAYER_DEFAULTS, PALETTE } from './utils';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Parse "HH:MM" → minutes-from-midnight. Returns null if not parseable. */
function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * The start-of-event wall clock ("HH:MM") for a task. Bootcamp deadlines keep
 * their available-from time in `startTime`; every other type (todos, personal
 * events, sessions, contests) keeps the scheduled start in `time`.
 */
function startClockField(t) {
  return t.feedCategory === 'task' ? t.startTime : t.time;
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
  if (blocks.length === 0) return [];

  // Sort by start time, longer duration first on tie — all block types participate.
  const sorted = [...blocks].sort((a, b) =>
    a.startMin !== b.startMin ? a.startMin - b.startMin : b.durationMin - a.durationMin
  );

  // Greedy side-by-side lane assignment: overlapping events go into adjacent lanes.
  const colEnds = [];
  const withCol = sorted.map((b) => {
    const end = b.startMin + b.durationMin;
    let col = colEnds.findIndex((e) => e <= b.startMin);
    if (col === -1) { col = colEnds.length; colEnds.push(end); }
    else colEnds[col] = end;
    return { ...b, col };
  });

  // totalCols = max lane among all blocks that overlap this one, + 1.
  return withCol.map((b, i) => {
    const end = b.startMin + b.durationMin;
    const maxCol = Math.max(...withCol
      .filter((o) => o.startMin < end && o.startMin + o.durationMin > b.startMin)
      .map((o) => o.col));
    return { ...b, totalCols: maxCol + 1, zOffset: i };
  });
}

/** A timed event block rendered inside the time-grid column. */
function TimedBlock({ task, color, startMin, durationMin, zOffset, isAllDay, onSelect, col = 0, totalCols = 1, renderStart }) {
  const top = (renderStart ?? startMin) * PX_PER_MIN;
  const height = Math.max(durationMin * PX_PER_MIN, 18);
  const short = height < 36;
  const leftPct  = (col / totalCols) * 100;
  const widthPct = (1  / totalCols) * 100;

  return (
    <div
      onClick={() => onSelect?.(task)}
      title={task.title}
      style={{
        position: 'absolute',
        top,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        height,
        backgroundColor: isAllDay ? color + '55' : color + 'cc',
        borderLeft: `3px solid ${color}`,
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: isAllDay ? 1 : 2 + zOffset,
      }}
      className="flex flex-col justify-start px-1.5 py-0.5 hover:brightness-110 transition select-none pointer-events-auto"
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
  onSelectTask, onOpenCreatePane,
}) {
  const [viewMode, setViewMode] = useState('week'); // 'day' | 'week' | 'month'
  const [anchor,   setAnchor]   = useState(() => weekStart(new Date()));
  const [dayAnchor, setDayAnchor] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const gridRef  = useRef(null);
  const [now, setNow] = useState(() => new Date());

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
    if (viewMode === 'day')   setDayAnchor((d) => addDays(d, -1));
    else if (viewMode === 'week') setAnchor((d) => addDays(d, -7));
    else setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const next = () => {
    if (viewMode === 'day')   setDayAnchor((d) => addDays(d, 1));
    else if (viewMode === 'week') setAnchor((d) => addDays(d, 7));
    else setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const goToday = () => {
    const d = new Date();
    const today = new Date(d); today.setHours(0,0,0,0);
    setDayAnchor(today);
    setAnchor(weekStart(d));
    setMonthAnchor(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // ── task interaction ──
  const openTask = useCallback((t) => onSelectTask?.(t.id), [onSelectTask]);
  const openCreate = useCallback((dateStr) => onOpenCreatePane?.(dateStr), [onOpenCreatePane]);

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
      .filter(Boolean)
      .sort((a, b) => (b.endCol - b.startCol) - (a.endCol - a.startCol));
  }, [tasks, showLayers, subVis, weekDays, isSpanning]);

  const dayTasksFiltered = useCallback((dateObj) => {
    const dateStr = formatDateString(dateObj);
    const matching = tasks.filter((t) =>
      !t.isArchived && !isSpanning(t) && isTaskOnDate(t, dateStr) && layerVisible(t, showLayers, subVis)
    );
    const timed = [], allDay = [];
    for (const t of matching) {
      const isTodo = !t.feedCategory && !t.isContest;
      const startMin  = toMinutes(startClockField(t));
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

  const rangeLabel = viewMode === 'day'
    ? `${DAY_ABBR[dayAnchor.getDay()]}, ${MONTH_NAME[dayAnchor.getMonth()]} ${dayAnchor.getDate()}, ${dayAnchor.getFullYear()}`
    : viewMode === 'week'
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
              <button onClick={() => setViewMode('day')}
                className={`px-2.5 py-1 rounded-md transition ${viewMode === 'day' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                DAY
              </button>
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

              {viewMode === 'day' ? (() => {
                const dayStr = formatDateString(dayAnchor);
                const isToday = dayStr === todayStr;
                const { timed, allDay } = dayTasksFiltered(dayAnchor);

                // Spanning tasks that cover this day → header chips + time-grid overlays
                const daySpanning = tasks.filter((t) =>
                  !t.isArchived && isSpanning(t) && layerVisible(t, showLayers, subVis) && isTaskOnDate(t, dayStr)
                );

                // Spanning tasks with a start clock go into the time grid; date-only ones go to header.
                // Each day shows only its slice of the span: the start day runs from the start clock to
                // midnight, the end day from midnight to the end clock, and any middle day is full-height —
                // so the start and end edges land on the correct hour for the day being viewed.
                const spanningTimed = daySpanning
                  .filter((t) => toMinutes(startClockField(t)) !== null)
                  .map((t) => {
                    const spanStartDate = t.availableFrom || t.dueDate;
                    const spanEndDate = (t.endDate && t.endDate > t.dueDate) ? t.endDate : t.dueDate;
                    const sMin = toMinutes(startClockField(t));
                    const eMin = toMinutes(t.endTime);
                    const isStartDay = dayStr === spanStartDate;
                    const isEndDay = dayStr === spanEndDate;
                    const startMin = isStartDay ? sMin : 0;
                    const endMin = isEndDay ? (eMin ?? 24 * 60) : 24 * 60;
                    const dur = Math.max(endMin - startMin, 15);
                    return { task: t, startMin, durationMin: dur, isAllDay: false };
                  });
                const spanningAllDay = daySpanning.filter((t) => toMinutes(startClockField(t)) === null);

                const allTimedBlocks = layoutBlocks([...timed, ...spanningTimed]);
                const timedSorted = [...allTimedBlocks].sort((a, b) => (b.startMin - b.durationMin) - (a.startMin - a.durationMin));
                const allItems = [
                  ...timedSorted.filter((b) => b.isAllDay).map((b) => ({ task: b.task, timeLabel: null })),
                  ...allDay.map((t) => ({ task: t, timeLabel: null })),
                  ...spanningAllDay.map((t) => ({ task: t, timeLabel: null })),
                ];
                return (
                  <>
                    {/* Day header */}
                    <div className="flex flex-col shrink-0 bg-[#161b22] border-b border-white/[0.07]">
                      <div className="flex">
                        <div className="w-13 shrink-0 border-r border-white/6" />
                        <div className={`flex-1 flex items-center justify-between px-3 py-2 ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black font-mono tracking-widest uppercase">{DAY_ABBR[dayAnchor.getDay()]}</span>
                            <span className={`text-[18px] font-extrabold mt-0.5 leading-none ${isToday ? 'bg-violet-600 text-white w-9 h-9 rounded-full flex items-center justify-center' : ''}`}>
                              {dayAnchor.getDate()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openCreate(dayStr)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black font-mono bg-violet-600/20 hover:bg-violet-600 border border-violet-500/30 hover:border-violet-500 rounded-lg text-violet-300 hover:text-white transition"
                            title="New goal"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            <span>NEW GOAL</span>
                          </button>
                        </div>
                      </div>
                      {allItems.length > 0 && (
                        <div className="flex">
                          <div className="w-13 shrink-0 border-r border-white/6" />
                          <div className="flex-1 px-1 pb-1 flex flex-wrap gap-0.5">
                            {allItems.map(({ task: t, timeLabel }) => (
                              <AllDayChip key={`dhdr-${t.id}`} task={t} color={getColor(t)} onSelect={openTask} timeLabel={timeLabel} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Day time grid */}
                    <div ref={gridRef} className="flex flex-1 overflow-y-auto no-scrollbar overflow-x-hidden bg-[#0d1117]">
                      <div className="w-13 shrink-0 relative border-r border-white/6">
                        {HOURS.map((h) => (
                          <div key={`hr-${h}`} style={{ height: HOUR_H }} className="relative flex items-start justify-end pr-2 pt-0.5">
                            {h > 0 && <span className="text-[9px] font-mono text-slate-500 leading-none -translate-y-1.25">{h % 12 || 12}{h < 12 ? 'am' : 'pm'}</span>}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 relative" style={{ height: HOUR_H * 24 }}>
                        {HOURS.map((h) => (
                          <div key={`dgl-${h}`} style={{ top: h * HOUR_H, height: HOUR_H }} className="absolute inset-x-0 border-t border-white/4">
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
                        {allTimedBlocks.map(({ task: t, startMin, durationMin, zOffset, isAllDay, col, totalCols, renderStart }) => (
                          <TimedBlock key={`dtb-${t.id}`} task={t} color={getColor(t)}
                            startMin={startMin} durationMin={durationMin}
                            zOffset={zOffset} isAllDay={isAllDay}
                            col={col} totalCols={totalCols} renderStart={renderStart}
                            onSelect={openTask}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                );
              })() : viewMode === 'week' ? (
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
                          <div key={`whdr-${idx}`} className="flex-1 min-w-0 border-r border-white/5 last:border-r-0 group">
                            <div className={`flex flex-col items-center py-1.5 relative ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>
                              <span className="text-[8px] font-black font-mono tracking-widest uppercase">{DAY_ABBR[d.getDay()]}</span>
                              <span className={`text-[14px] font-extrabold mt-0.5 leading-none ${isToday ? 'bg-violet-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''}`}>
                                {d.getDate()}
                              </span>
                              <button
                                type="button"
                                onClick={() => openCreate(dStr)}
                                className="opacity-0 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-violet-600 text-slate-400 hover:text-white rounded-md transition"
                                title={`New goal on ${dStr}`}
                              >
                                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Spanning multi-day tasks + single-day all-day chips — hard-capped at 5 rows */}
                    {(() => {
                      const MAX_ROWS = 5;
                      const CHIP_H   = 18; // px per row
                      const ROW_GAP  = 2;  // px between rows

                      // Greedy row packing for spanning tasks (already sorted longest-first)
                      const rowOccupied = Array.from({ length: MAX_ROWS }, () => new Array(7).fill(false));
                      const spanRows = [];
                      for (const s of weekSpanningTasks) {
                        let assigned = -1;
                        for (let r = 0; r < MAX_ROWS; r++) {
                          let free = true;
                          for (let c = s.startCol; c <= s.endCol; c++) {
                            if (rowOccupied[r][c]) { free = false; break; }
                          }
                          if (free) {
                            for (let c = s.startCol; c <= s.endCol; c++) rowOccupied[r][c] = true;
                            assigned = r;
                            break;
                          }
                        }
                        if (assigned >= 0) spanRows.push({ ...s, row: assigned });
                      }

                      // Per-column chip assignments — skip rows already occupied by spanning bars
                      const colData = weekDays.map((d, colIdx) => {
                        const dStr = formatDateString(d);
                        const { timed, allDay } = dayTasksFiltered(d);
                        const timedSorted = [...timed].sort((a, b) => (b.startMin - b.durationMin) - (a.startMin - a.durationMin));
                        const allItems = [
                          ...timedSorted.map((b) => ({ task: b.task, timeLabel: fmtMin(b.startMin) })),
                          ...allDay.map((t) => ({ task: t, timeLabel: null })),
                        ];
                        // advance r past any spanning-occupied rows
                        const nextFreeRow = (from) => {
                          let r = from;
                          while (r < MAX_ROWS && rowOccupied[r][colIdx]) r++;
                          return r;
                        };
                        const visible = [];
                        let hidden = 0;
                        let r = nextFreeRow(0);
                        for (const item of allItems) {
                          if (r < MAX_ROWS) {
                            visible.push({ ...item, row: r });
                            r = nextFreeRow(r + 1);
                          } else {
                            hidden++;
                          }
                        }
                        return { colIdx, d, dStr, visible, hidden };
                      });

                      const hasOverflow = colData.some(c => c.hidden > 0);
                      const usedRows = Math.max(
                        spanRows.length > 0 ? Math.max(...spanRows.map(s => s.row)) + 1 : 0,
                        ...colData.map(c => c.visible.length > 0 ? Math.max(...c.visible.map(v => v.row)) + 1 : 0),
                      );
                      if (usedRows === 0 && !hasOverflow) return null;

                      // Build flat grid items list (no React.Fragment needed)
                      const gridItems = [];

                      for (const { task: t, startCol, endCol, clipsLeft, clipsRight, row } of spanRows) {
                        const color = getColor(t);
                        const startClock = startClockField(t);
                        const startLabel = startClock ? fmtMin(toMinutes(startClock)) : null;
                        const endLabel   = t.endTime   ? fmtMin(toMinutes(t.endTime))   : null;
                        gridItems.push(
                          <div
                            key={`span-${t.id}`}
                            onClick={() => openTask(t)}
                            title={t.title}
                            style={{
                              gridColumn: `${startCol + 1} / ${endCol + 2}`,
                              gridRow: row + 1,
                              backgroundColor: color + 'cc',
                              borderLeft:  clipsLeft  ? 'none' : `3px solid ${color}`,
                              borderRight: clipsRight ? 'none' : undefined,
                              borderRadius: `${clipsLeft ? 0 : 5}px ${clipsRight ? 0 : 5}px ${clipsRight ? 0 : 5}px ${clipsLeft ? 0 : 5}px`,
                            }}
                            className="mx-0.5 px-1.5 flex items-center justify-between gap-1 overflow-hidden cursor-pointer hover:brightness-110 transition select-none min-w-0"
                          >
                            <span className="text-[8.5px] font-bold text-white truncate">{t.title}</span>
                            <span className="text-[7px] text-white/60 font-mono shrink-0 hidden sm:block">
                              {startLabel && endLabel ? `${startLabel}–${endLabel}` : startLabel || endLabel || ''}
                            </span>
                          </div>
                        );
                      }

                      for (const { colIdx, d, dStr, visible, hidden } of colData) {
                        for (const { task: t, timeLabel, row } of visible) {
                          gridItems.push(
                            <div
                              key={`hdr-${t.id}-${dStr}`}
                              style={{ gridColumn: `${colIdx + 1} / ${colIdx + 2}`, gridRow: row + 1 }}
                              className="px-0.5 min-w-0"
                            >
                              <AllDayChip task={t} color={getColor(t)} onSelect={openTask} timeLabel={timeLabel} />
                            </div>
                          );
                        }
                        if (hidden > 0) {
                          gridItems.push(
                            <div
                              key={`more-${colIdx}`}
                              style={{ gridColumn: `${colIdx + 1} / ${colIdx + 2}`, gridRow: MAX_ROWS + 1 }}
                              className="px-0.5 flex items-center"
                            >
                              <button
                                onClick={() => { const day = new Date(d); day.setHours(0,0,0,0); setDayAnchor(day); setViewMode('day'); }}
                                className="text-[7px] font-mono font-black text-violet-400 hover:text-violet-300 px-1 transition"
                              >
                                +{hidden} more
                              </button>
                            </div>
                          );
                        }
                      }

                      const totalRows = usedRows + (hasOverflow ? 1 : 0);
                      return (
                        <div className="flex">
                          <div className="w-13 shrink-0 border-r border-white/6" />
                          <div
                            className="flex-1 grid grid-cols-7 pb-1"
                            style={{
                              gridTemplateRows: `repeat(${totalRows}, ${CHIP_H}px)`,
                              rowGap: ROW_GAP,
                            }}
                          >
                            {gridItems}
                          </div>
                        </div>
                      );
                    })()}
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
                            className="absolute top-0 bottom-0 border-r border-white/4 pointer-events-none"
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
                            {timed.map(({ task: t, startMin, durationMin, zOffset, isAllDay, col, totalCols, renderStart }) => (
                              <TimedBlock key={`tb-${t.id}-${dStr}`} task={t} color={getColor(t)}
                                startMin={startMin} durationMin={durationMin}
                                zOffset={zOffset} isAllDay={isAllDay}
                                col={col} totalCols={totalCols} renderStart={renderStart}
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
                          const scoreA = (toMinutes(startClockField(a.task)) ?? 0) - (a.endCol - a.startCol) * DAY_MINS;
                          const scoreB = (toMinutes(startClockField(b.task)) ?? 0) - (b.endCol - b.startCol) * DAY_MINS;
                          return scoreA - scoreB; // ascending: lowest score = behind
                        });
                        const total = sorted.length;
                        return sorted.flatMap(({ task: t, startCol, endCol, clipsLeft, clipsRight }, zIdx) => {
                        const color = getColor(t);
                        const TOTAL_MINS = 24 * 60;
                        const startClock = startClockField(t);
                        const startMin = toMinutes(startClock) ?? 0;
                        const endMin   = toMinutes(t.endTime)   ?? TOTAL_MINS;
                        const colW     = 100 / 7;
                        const startLabel = startClock ? fmtMin(startMin) : null;
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
                  <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: '1fr' }}>
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
                            onDoubleClick={() => isThisMonth && openCreate(dStr)}
                            className={`border-r border-b border-white/6 flex flex-col min-h-0 group ${!isThisMonth ? 'opacity-25' : ''}`}
                          >
                            {/* Date number + new goal button */}
                            <div className="px-2 pt-1.5 pb-1 shrink-0 flex items-center justify-between">
                              <button
                                onClick={(e) => { e.stopPropagation(); const d = new Date(dateObj); d.setHours(0,0,0,0); setDayAnchor(d); setViewMode('day'); }}
                                className={`text-[11px] font-extrabold font-mono leading-none transition hover:opacity-70 ${isToday ? 'bg-violet-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : isThisMonth ? 'text-slate-300' : 'text-slate-500'}`}
                              >
                                {dateObj.getDate()}
                              </button>
                              {isThisMonth && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openCreate(dStr); }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-violet-600 text-slate-500 hover:text-white rounded transition"
                                  title="New goal"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                </button>
                              )}
                            </div>
                            {/* Events — scrollable within fixed cell */}
                            <div className="flex-1 overflow-y-auto no-scrollbar px-1 pb-1 space-y-0.5 min-h-0">
                              {unique.map((t) => {
                                const c = getColor(t);
                                const timeStr = t.time ? fmt24(t.time) : (t.startTime ? fmt24(t.startTime) : null);
                                return (
                                  <div
                                    key={`mc-ev-${t.id}`}
                                    onClick={(e) => { e.stopPropagation(); openTask(t); }}
                                    title={t.title}
                                    style={{ backgroundColor: c + '22', borderLeft: `2px solid ${c}` }}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md cursor-pointer hover:brightness-125 transition select-none"
                                  >
                                    {timeStr && <span className="text-[7px] font-mono shrink-0" style={{ color: c }}>{timeStr}</span>}
                                    <span className="text-[8px] font-bold text-white truncate">{t.title}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>


          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
