/**
 * @file Calendar tab for Daily Activity — a month grid and weekly agenda
 *   over the member's todos plus the read-only activity feed. A side panel
 *   exposes toggleable "layers" (todos by project, events, contests by
 *   platform, bootcamp deadlines/sessions by bootcamp) and a day-detail
 *   list for the selected date. Double-clicking a day (or the "+" button on
 *   any cell) opens the full TaskDetailPane via onOpenCreatePane, with the
 *   clicked date pre-filled. Recurring tasks are expanded per day via
 *   {@link isTaskOnDate}; feed items render through {@link FeedItemCard}.
 *
 * @module daily-activity/CalendarView
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  ChevronLeft, ChevronRight, Calendar, Check, Plus, CalendarDays, CheckCircle2, RefreshCw, Info, Layers, LayoutGrid, ListTodo, Tag,
  X, Flag, Expand, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, getTodayDateString, formatDateString, addDays, getFeedMeta, isTaskOnDate, fmt24, GCAL_COLOR_MAP, LAYER_DEFAULTS, PALETTE } from './utils';
import FeedItemCard from './FeedItemCard';
import GoogleCalendarPanel from './GoogleCalendarPanel';
import ExpandedCalendarModal from './ExpandedCalendarModal';

// Per-bootcamp checkbox list shared by the Tasks and Sessions layers.
function BootcampSubFilters({ bootcamps, state, onToggle, accent, emptyLabel }) {
  const accentBox =
    accent === 'sky'
      ? 'bg-sky-500 border-sky-400 text-slate-950'
      : 'bg-violet-600 border-violet-500 text-white';

  if (bootcamps.length === 0) {
    return (
      <div className="pl-3.5 border-l border-slate-800 ml-2.5">
        <span className="text-[9px] text-slate-600 font-mono py-1 px-2 block">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className="pl-3.5 space-y-1.5 border-l border-slate-800 ml-2.5 flex flex-col gap-1">
      <span className="text-[7.5px] text-slate-500 font-mono tracking-widest uppercase block font-black mt-2">BOOTCAMPS</span>
      {bootcamps.map((bootcamp) => {
        const isChecked = state[bootcamp] !== false;
        return (
          <div
            key={`sublayer-bootcamp-${accent}-${bootcamp}`}
            onClick={() => onToggle(bootcamp)}
            className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/40 rounded-lg cursor-pointer transition select-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition ${isChecked ? accentBox : 'border-white/10 text-transparent'}`}>
                <Check className="w-2.5 h-2.5 stroke-[4.5]" />
              </div>
              <span className={`text-[10px] font-bold truncate ${isChecked ? 'text-slate-200' : 'text-slate-500'}`}>{bootcamp}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Per-sub-item row with its own colour swatch + inline palette picker.
 * Used for platforms (contests), projects (todos), bootcamps (tasks/sessions).
 */
function SubItemList({ items, emptyLabel, getChecked, onToggle, getColor, onSetColor, defaultColor }) {
  const [openPicker, setOpenPicker] = useState(null);
  if (items.length === 0) {
    return (
      <div className="pl-3.5 border-l border-slate-800 ml-2.5">
        <span className="text-[9px] text-slate-600 font-mono py-1 px-2 block">{emptyLabel}</span>
      </div>
    );
  }
  return (
    <div className="pl-3.5 border-l border-slate-800 ml-2.5 space-y-1">
      {items.map((item) => {
        const isChecked = getChecked(item);
        const color = getColor(item);
        const pickerOpen = openPicker === item;
        return (
          <div key={`subitem-${item}`}>
            <div className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/40 rounded-lg transition select-none">
              <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={() => onToggle(item)}>
                <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition ${isChecked ? 'border-white/40 text-white' : 'border-white/10 text-transparent'}`}
                  style={isChecked ? { backgroundColor: color } : {}}>
                  <Check className="w-2.5 h-2.5 stroke-[4.5]" />
                </div>
                <span className={`text-[10px] font-bold truncate ${isChecked ? 'text-slate-200' : 'text-slate-500'}`}>{item}</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpenPicker(pickerOpen ? null : item); }}
                className="w-4 h-4 rounded-full border-2 transition cursor-pointer hover:scale-110 shrink-0 ml-2"
                style={{ backgroundColor: color, borderColor: pickerOpen ? 'white' : 'transparent' }}
                title="Pick colour"
              />
            </div>
            {pickerOpen && (
              <div className="flex flex-wrap gap-1.5 px-2 pb-1.5">
                {PALETTE.map((hex) => (
                  <button key={hex} type="button" title={hex}
                    onClick={(e) => { e.stopPropagation(); onSetColor(item, hex); setOpenPicker(null); }}
                    className={`w-4 h-4 rounded-full border-2 transition cursor-pointer hover:scale-110 ${color === hex ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <button type="button" title="Reset"
                  onClick={(e) => { e.stopPropagation(); onSetColor(item, defaultColor); setOpenPicker(null); }}
                  className="w-4 h-4 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[7px] text-slate-500 hover:text-white transition cursor-pointer"
                >↺</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CalendarView({ tasks, projects, labels = [], onToggleComplete, onSelectTask, onToast, onSynced, onCreatePersonal, onOpenCreatePane }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => getTodayDateString());
  const [viewMode, setViewMode] = useState('grid');

  const [expandedCalOpen, setExpandedCalOpen] = useState(false);

  const [showFilters, setShowFilters] = useState({
    todo: true,
    personal: true,
    events: true,
    contests: true,
    tasks: true,
    sessions: true,
  });

  const [layerColors, setLayerColors] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' && localStorage.getItem('calLayerColors');
      return saved ? { ...LAYER_DEFAULTS, ...JSON.parse(saved) } : { ...LAYER_DEFAULTS };
    } catch { return { ...LAYER_DEFAULTS }; }
  });

  const setLayerColor = useCallback((key, hex) => {
    setLayerColors((prev) => {
      const next = { ...prev, [key]: hex };
      try { localStorage.setItem('calLayerColors', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Per-sub-item custom colors: { 'platform:codeforces': '#hex', 'bootcamp:CS101': '#hex' }
  const [subItemColors, setSubItemColors] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' && localStorage.getItem('calSubItemColors');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const setSubItemColor = useCallback((key, hex) => {
    setSubItemColors((prev) => {
      const next = { ...prev, [key]: hex };
      try { localStorage.setItem('calSubItemColors', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const getSubItemColor = useCallback((type, name) => {
    return subItemColors[`${type}:${name}`] || null;
  }, [subItemColors]);

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showPlatformFilters, setShowPlatformFilters] = useState({});
  const [showProjectFilters, setShowProjectFilters] = useState({});
  const [showBootcampFilters, setShowBootcampFilters] = useState({});

  useEffect(() => {
    if (projects.length > 0) {
      setShowProjectFilters((prev) => {
        const next = { ...prev };
        let updated = false;
        projects.forEach((p) => {
          if (next[p.id] === undefined) {
            next[p.id] = true;
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  // Platforms actually present in the upcoming-contest feed (same data source
  // as the problem-solving "Upcoming Contests" — external_contests).
  const availablePlatforms = Array.from(
    new Set(
      tasks
        .filter((t) => t.isContest)
        .map((t) => (t.contestPlatform || 'other').toLowerCase())
    )
  ).sort();

  useEffect(() => {
    setShowPlatformFilters((prev) => {
      const next = { ...prev };
      let updated = false;
      availablePlatforms.forEach((p) => {
        if (next[p] === undefined) {
          next[p] = true;
          updated = true;
        }
      });
      return updated ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePlatforms.join(',')]);

  // Bootcamps present in the feed's task-deadline and session items, used to
  // drive the per-bootcamp sub-filters under the Tasks & Sessions layers.
  const availableBootcamps = Array.from(
    new Set(
      tasks
        .filter((t) => t.feedCategory === 'task' || t.feedCategory === 'session')
        .map((t) => t.bootcampTitle || 'Other')
    )
  ).sort();

  useEffect(() => {
    setShowBootcampFilters((prev) => {
      const next = { ...prev };
      let updated = false;
      availableBootcamps.forEach((b) => {
        if (next[b] === undefined) {
          next[b] = true;
          updated = true;
        }
      });
      return updated ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableBootcamps.join('|')]);


  const handleFilterToggle = (key) => {
    setShowFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrevMonth = () => {
    if (viewMode === 'grid') {
      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setCurrentMonth((prev) => addDays(prev, -7));
    }
  };

  const handleNextMonth = () => {
    if (viewMode === 'grid') {
      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else {
      setCurrentMonth((prev) => addDays(prev, 7));
    }
  };

  const handleSetToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    setSelectedDateStr(getTodayDateString());
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDaysCount = firstDayOfWeek;
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  const prevPadDays = [];
  for (let i = prevMonthDaysCount - 1; i >= 0; i--) {
    prevPadDays.push(new Date(year, month - 1, prevMonthLastDate - i));
  }

  const activeDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    activeDays.push(new Date(year, month, i));
  }

  const cellsNeeded = 42;
  const nextMonthDaysCount = cellsNeeded - (prevPadDays.length + activeDays.length);
  const nextPadDays = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    nextPadDays.push(new Date(year, month + 1, i));
  }

  const allGridDates = [...prevPadDays, ...activeDays, ...nextPadDays];

  const getWeeklyDates = () => {
    const currentDayOfWeek = currentMonth.getDay();
    const sundayOfThisWeek = addDays(currentMonth, -currentDayOfWeek);
    return Array.from({ length: 7 }, (_, i) => addDays(sundayOfThisWeek, i));
  };
  const weeklyDates = getWeeklyDates();

  const checkTaskMatchesFilters = (task) => {
    if (task.isContest) {
      if (!showFilters.contests) return false;
      const platform = task.contestPlatform?.toLowerCase() || 'other';
      return showPlatformFilters[platform] !== false;
    }

    // Bootcamp task deadlines & sessions — gated by their layer + per-bootcamp.
    if (task.feedCategory === 'task' || task.feedCategory === 'session') {
      const layerOn =
        task.feedCategory === 'task' ? showFilters.tasks : showFilters.sessions;
      if (!layerOn) return false;
      const bootcamp = task.bootcampTitle || 'Other';
      return showBootcampFilters[bootcamp] !== false;
    }

    // Personal events (user's own, syncs with Google Calendar).
    if (task.feedCategory === 'personal') return showFilters.personal;

    // Published events have their own layer.
    if (task.feedCategory === 'event') return showFilters.events;

    // Personal todos (no feed category).
    if (task.projectId && showProjectFilters[task.projectId] === false) {
      return false;
    }
    return showFilters.todo;
  };

  // Returns the display colour for a task. Per-item colorId always wins first.
  const getTaskColor = (task) => {
    // Specific color set on this individual item beats everything.
    if (task.colorId && GCAL_COLOR_MAP[task.colorId]) return GCAL_COLOR_MAP[task.colorId];

    if (task.isContest) {
      const platform = task.contestPlatform?.toLowerCase() || 'other';
      return getSubItemColor('platform', platform) || layerColors.contests;
    }
    if (task.feedCategory === 'task' || task.feedCategory === 'session') {
      const bootcamp = task.bootcampTitle || 'Other';
      const layerKey = task.feedCategory === 'task' ? 'tasks' : 'sessions';
      return getSubItemColor('bootcamp', bootcamp) || layerColors[layerKey];
    }
    if (task.feedCategory === 'personal') return layerColors.personal;
    if (task.feedCategory === 'event') return layerColors.events;
    // Regular todo — project sub-item override → project color → layer default
    const proj = projects.find((p) => p.id === task.projectId);
    if (proj) return getSubItemColor('project', proj.name) || proj.color;
    return layerColors.todo;
  };

  const getFilteredTasksForDate = (dateStr) => {
    return tasks.filter((t) => !t.isArchived && isTaskOnDate(t, dateStr) && checkTaskMatchesFilters(t));
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case Priority.P1:
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', raw: '#ef4444', label: 'High Priority' };
      case Priority.P2:
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', raw: '#f59e0b', label: 'Medium Priority' };
      case Priority.P3:
        return { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', raw: '#3b82f6', label: 'General Goal' };
      default:
        return { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-white/5', raw: '#64748b', label: 'Trivial Goal' };
    }
  };

  // Start-of-day minute for ordering the schedule. Bootcamp deadlines keep their
  // clock in startTime; every other type uses time. Untimed items sort to the end.
  const scheduleStartMin = (t) => {
    const clock = t.time || t.startTime;
    if (!clock) return Infinity;
    const [h, m] = clock.split(':').map(Number);
    return (isNaN(h) || isNaN(m)) ? Infinity : h * 60 + m;
  };
  const selectedDayTasks = getFilteredTasksForDate(selectedDateStr)
    .sort((a, b) => scheduleStartMin(a) - scheduleStartMin(b));
  // Completion reflects only completable goals — read-only feed items (contests,
  // events, sessions, deadlines, personal events) carry completed=false forever
  // and would otherwise drag the percentage down.
  const completableTasks = selectedDayTasks.filter((t) => !getFeedMeta(t));
  const completedCount = completableTasks.filter((t) => t.completed).length;
  const totalCount = completableTasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  // Day-detail panel summary state.
  const feedCount = selectedDayTasks.length - totalCount;
  const isSelectedToday = selectedDateStr === getTodayDateString();
  const allGoalsDone = totalCount > 0 && completedCount === totalCount;

  // Distinct items visible across the days currently shown in the grid — the
  // set "Sync now" pushes to Google. De-duped because recurring items appear
  // Distinct items visible in the current month grid — passed to GoogleCalendarPanel
  // for scoped push/pull. De-duped because recurring items appear on multiple days.
  const monthTasks = (() => {
    const seen = new Set();
    const out = [];
    for (const d of allGridDates) {
      for (const t of getFilteredTasksForDate(formatDateString(d))) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          out.push(t);
        }
      }
    }
    return out;
  })();

  // ISO range for the visible month grid (first cell → last cell).
  const monthTimeMin = new Date(allGridDates[0].getFullYear(), allGridDates[0].getMonth(), allGridDates[0].getDate()).toISOString();
  const monthTimeMax = new Date(allGridDates[allGridDates.length - 1].getFullYear(), allGridDates[allGridDates.length - 1].getMonth(), allGridDates[allGridDates.length - 1].getDate() + 1).toISOString();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative text-slate-200" id="calendar-view">
      <div className="bg-gray-900 rounded-3xl border border-white/[0.08] p-6 xl:col-span-8 xl:self-start flex flex-col justify-between shadow-2xl shadow-slate-950/20" id="calendar-main-grid">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 rounded-2xl border border-violet-500/20 text-violet-400">
              <Calendar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans text-white tracking-tight leading-none">
                {viewMode === 'grid'
                  ? `${monthNames[month]} ${year}`
                  : `Week of ${weeklyDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weeklyDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              </h2>
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase font-mono mt-1.5">
                {viewMode === 'grid' ? 'Month view' : 'Week view'} · Double-click a day to add a goal
              </p>
            </div>

            <button onClick={handleSetToday} className="px-3 py-1.5 text-[11px] font-mono font-black bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-white/5 rounded-xl text-violet-300 transition shrink-0 ml-3 shadow-md">
              TODAY
            </button>

            <button
              onClick={() => setExpandedCalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-black bg-violet-600/15 hover:bg-violet-600 border border-violet-500/30 hover:border-violet-500 rounded-xl text-violet-300 hover:text-white transition shrink-0 ml-1 shadow-md"
              title="Expand to full-screen calendar"
            >
              <Expand className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">EXTEND</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex bg-slate-900/60 border border-white/5 rounded-2xl p-1 shrink-0 text-xs text-slate-400 font-bold font-mono shadow-inner">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer ${viewMode === 'grid' ? 'bg-violet-600 text-white font-extrabold shadow-lg shadow-violet-600/20' : 'hover:text-white hover:bg-white/5'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>GRID</span>
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer ${viewMode === 'weekly' ? 'bg-violet-600 text-white font-extrabold shadow-lg shadow-violet-600/20' : 'hover:text-white hover:bg-white/5'}`}
              >
                <ListTodo className="w-4 h-4" />
                <span>WEEK</span>
              </button>
            </div>

            <div className="flex items-center bg-slate-900/60 border border-white/5 rounded-xl p-1 shrink-0 shadow-md">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition" title={viewMode === 'grid' ? 'Previous Month' : 'Previous Week'}>
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition" title={viewMode === 'grid' ? 'Next Month' : 'Next Week'}>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="flex flex-col mt-5 flex-1 select-none">
            <div className="grid grid-cols-7 gap-2.5 text-center py-2.5 text-[11px] font-mono tracking-widest font-black text-slate-400 uppercase border-b border-white/[0.05] mb-3">
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            <div className="grid grid-cols-7 gap-2.5 flex-1 min-h-[460px]" id="calendar-grid-cells">
              {allGridDates.map((dateObj, idx) => {
                const dateStr = formatDateString(dateObj);
                const isCurrentMonth = dateObj.getMonth() === month;
                const isToday = dateStr === getTodayDateString();
                const isSelected = dateStr === selectedDateStr;
                const dateTasks = getFilteredTasksForDate(dateStr);
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                return (
                  <div
                    key={`redesign-grid-date-${dateStr}-${idx}`}
                    onClick={() => setSelectedDateStr(dateStr)}
                    onDoubleClick={(e) => { e.stopPropagation(); onOpenCreatePane?.(dateStr); }}
                    className={`group relative p-2.5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 min-h-[90px] border ${
                      isSelected
                        ? 'bg-violet-600/[0.04] border-violet-500 shadow-xl shadow-violet-500/5 ring-1 ring-violet-500/20'
                        : isToday
                        ? 'bg-violet-500/[0.02] border-violet-400/40 hover:bg-slate-800/40'
                        : isCurrentMonth
                        ? isWeekend
                          ? 'bg-slate-900/20 border-white/5 hover:border-white/10 hover:bg-slate-800/20'
                          : 'bg-slate-900/10 border-white/5 hover:border-white/10 hover:bg-slate-800/10'
                        : 'opacity-25 bg-slate-950/20 border-transparent hover:opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[11px] font-mono font-black py-0.5 px-1.5 rounded-lg leading-none ${isToday ? 'text-white bg-violet-600 shadow-sm shadow-violet-600/30 font-black' : isCurrentMonth ? 'text-slate-100' : 'text-slate-500'}`}>
                        {dateObj.getDate()}
                        {dateObj.getDate() === 1 && <span className="text-[8px] uppercase tracking-wider ml-1 text-violet-400 font-extrabold">{monthNames[dateObj.getMonth()].slice(0, 3)}</span>}
                      </span>

                      {isCurrentMonth && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onOpenCreatePane?.(dateStr); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-violet-600 hover:text-white text-slate-400 rounded-lg transition duration-150 transform hover:scale-105" title="New Goal">
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3.5 space-y-1.5 flex-1 flex flex-col justify-end overflow-hidden max-h-[80px]">
                      {dateTasks.slice(0, 3).map((task) => {
                        const taskColor = getTaskColor(task);
                        if (getFeedMeta(task)) {
                          return <FeedItemCard key={`month-mini-t-${task.id}`} task={task} variant="chip" accentColor={taskColor} />;
                        }
                        return (
                          <div
                            key={`month-mini-t-${task.id}`}
                            style={{ borderLeftColor: taskColor, backgroundColor: taskColor + '18' }}
                            className={`text-[8.5px] font-bold font-mono truncate px-1.5 py-0.5 rounded-md leading-none bg-white/[0.04] hover:bg-white/[0.06] transition duration-150 flex items-center gap-1 border-l-2 ${task.completed ? 'text-slate-500 line-through opacity-50' : 'text-slate-300'}`}
                          >
                            <span className="truncate flex-1">{task.title}</span>
                          </div>
                        );
                      })}
                      {dateTasks.length > 3 && (
                        <span className="text-[8px] font-mono font-black text-violet-400 tracking-wider block text-right">
                          +{dateTasks.length - 3} GOAL{dateTasks.length - 3 > 1 ? 'S' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col mt-5 flex-1 select-none space-y-3" id="weekly-agenda-board">
            {weeklyDates.map((dateObj) => {
              const dateStr = formatDateString(dateObj);
              const isToday = dateStr === getTodayDateString();
              const isSelected = dateStr === selectedDateStr;
              const weekTasks = getFilteredTasksForDate(dateStr);
              const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

              return (
                <div
                  key={`weekly-row-${dateStr}`}
                  onClick={() => setSelectedDateStr(dateStr)}
                  onDoubleClick={(e) => { e.stopPropagation(); onOpenCreatePane?.(dateStr); }}
                  className={`flex flex-col md:flex-row items-stretch gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-violet-600/[0.04] border-violet-500 shadow-md shadow-violet-950/10'
                      : isToday
                      ? 'bg-white/[0.04] border-violet-400/30 hover:bg-white/[0.06]'
                      : isWeekend
                      ? 'bg-white/[0.02] border-dashed border-white/[0.04] hover:border-white/[0.08]'
                      : 'bg-white/[0.02] border-white/[0.03] hover:border-white/[0.06]'
                  }`}
                >
                  {/* Left Column: Date Info */}
                  <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center md:w-[130px] shrink-0 border-b md:border-b-0 md:border-r border-white/[0.05] pb-2 md:pb-0 md:pr-4">
                    <div className="space-y-0.5">
                      <span className={`text-[10px] font-bold font-mono tracking-widest block leading-none ${isToday ? 'text-violet-400 font-extrabold' : isWeekend ? 'text-rose-400' : 'text-slate-400'}`}>
                        {dayAbbr.toUpperCase()}
                      </span>
                      <span className={`text-xs font-black tracking-tight ${isToday ? 'text-white' : 'text-slate-200'}`}>
                        {dateObj.getDate()} {monthNames[dateObj.getMonth()].slice(0, 3)}
                      </span>
                    </div>

                    <button type="button" onClick={(e) => { e.stopPropagation(); onOpenCreatePane?.(dateStr); }} className="p-1 hover:bg-white/[0.06] text-slate-400 hover:text-violet-300 rounded-lg transition" title="New Goal">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right Column: Horizontally Listed Tasks */}
                  <div className="flex-1 flex flex-wrap gap-2 items-center min-w-0 py-1">
                    {weekTasks.map((t) => {
                      const taskColor = getTaskColor(t);
                      if (getFeedMeta(t)) {
                        return (
                          <div key={`weekly-row-feed-${t.id}`} className="max-w-[240px] shrink-0">
                            <FeedItemCard task={t} variant="chip" link onSelect={onSelectTask} accentColor={taskColor} />
                          </div>
                        );
                      }

                      const projColor = taskColor;

                      return (
                        <div
                          key={`weekly-row-task-${t.id}`}
                          onClick={(e) => { e.stopPropagation(); onSelectTask(t.id); }}
                          style={{ borderLeftColor: projColor, backgroundColor: projColor + '14' }}
                          className={`p-2 px-3 border-y border-r border-l-2 border-white/[0.02] rounded-xl cursor-pointer transition duration-150 flex items-center gap-2 max-w-[240px] shrink-0 ${t.completed ? 'opacity-35' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleComplete(t.id); }}
                            style={t.completed ? { backgroundColor: projColor, borderColor: projColor } : { borderColor: projColor + '80' }}
                            className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all shrink-0 cursor-pointer ${t.completed ? 'text-white shadow-sm' : 'text-transparent'}`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[4.5] text-white" />
                          </button>

                          <div className="min-w-0 flex flex-col">
                            <span className={`text-[10.5px] font-bold truncate leading-none ${t.completed ? 'line-through text-slate-500 font-medium' : 'text-slate-200'}`} title={t.title}>
                              {t.title}
                            </span>
                            {t.time && (
                              <span className="text-[8px] text-violet-400 font-mono font-black mt-0.5">
                                {t.time}{t.endTime ? ` – ${t.endTime}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {weekTasks.length === 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono select-none text-slate-500 border border-dashed border-white/[0.03] rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-700/60 stroke-[1.8]" />
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">rest day</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/[0.05] text-[10px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="hidden sm:inline">Tip: Double-click any calendar day cell to instantly block out dynamic task items.</span>
            <span className="sm:hidden">Double-click date to spawn tasks.</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-md shadow-rose-500/20" />
              <span>High (P1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-md shadow-amber-500/20" />
              <span>Med (P2)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 shadow-md shadow-sky-500/20" />
              <span>Low (P3)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 xl:col-span-4 flex flex-col justify-start" id="calendar-actions-panel">
        <div className="bg-gray-900 rounded-3xl border border-white/[0.08] p-5 space-y-4 shadow-xl" id="compact-controls-panel">
          <GoogleCalendarPanel
            monthTasks={monthTasks}
            timeMin={monthTimeMin}
            timeMax={monthTimeMax}
            onToast={onToast}
            onSynced={onSynced}
          />

          <div className="space-y-3 pt-1 border-t border-white/[0.05]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-gray-400 tracking-wider uppercase">
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                <span>Active Calendar Layers</span>
              </div>
              <button
                type="button"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="p-1 px-2.5 hover:bg-white/[0.06] text-violet-400 hover:text-violet-300 rounded-lg transition flex items-center gap-1 text-[10px] font-bold font-mono cursor-pointer select-none border border-white/[0.06] bg-white/[0.02]"
                title={filtersExpanded ? 'Collapse details' : 'Manage categories'}
              >
                <span>{filtersExpanded ? 'MINIMIZE' : 'EXPAND'}</span>
                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${filtersExpanded ? 'rotate-90' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-3 text-xs"
              >
                  {!filtersExpanded ? (
                    <div className="flex flex-wrap gap-1.5 animate-in fade-in duration-200" id="compact-filter-pills">
                      {[
                        { key: 'todo',     label: 'Todo',        activeStyle: 'bg-slate-800 text-slate-300 border-slate-600/30',       dot: 'bg-slate-400' },
                        { key: 'personal', label: '📌 Events',   activeStyle: 'bg-rose-500/10 text-rose-300 border-rose-500/25',       dot: 'bg-rose-400' },
                        { key: 'events',   label: '📣 Feed',     activeStyle: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25', dot: 'bg-emerald-400' },
                        { key: 'contests', label: '🏆 Contest',  activeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/25',    dot: 'bg-amber-400' },
                        { key: 'tasks',    label: '📅 Tasks',    activeStyle: 'bg-violet-500/10 text-violet-300 border-violet-500/25', dot: 'bg-violet-400' },
                        { key: 'sessions', label: '🎓 Sessions', activeStyle: 'bg-sky-500/10 text-sky-400 border-sky-500/25',          dot: 'bg-sky-400' },
                      ].map(({ key, label, activeStyle, dot }) => {
                        const checked = showFilters[key];
                        const handleClick = () => handleFilterToggle(key);
                        return (
                          <button
                            key={`compact-filter-pill-mini-${key}`}
                            type="button"
                            onClick={handleClick}
                            className={`px-3 py-1 rounded-xl text-[9px] font-black font-mono border transition duration-150 flex items-center gap-1.5 cursor-pointer select-none ${checked ? `${activeStyle} shadow-sm` : 'bg-slate-950/20 border-transparent text-slate-500 opacity-60 hover:opacity-100'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${checked ? dot : 'bg-slate-600'}`} />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in duration-200 text-xs max-h-[60vh] overflow-y-auto pr-1" id="hierarchical-layer-filters">
                      {/* Reusable inline colour picker strip */}
                      {(() => {
                        const ColorPicker = ({ layerKey }) => (
                          <div className="flex flex-wrap gap-1.5 pt-1.5 pl-1">
                            {PALETTE.map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                title={hex}
                                onClick={(e) => { e.stopPropagation(); setLayerColor(layerKey, hex); }}
                                className={`w-4 h-4 rounded-full border-2 transition cursor-pointer hover:scale-110 ${layerColors[layerKey] === hex ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                            <button
                              type="button"
                              title="Reset to default"
                              onClick={(e) => { e.stopPropagation(); setLayerColor(layerKey, LAYER_DEFAULTS[layerKey]); }}
                              className="w-4 h-4 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[7px] text-slate-500 hover:text-white transition cursor-pointer"
                            >↺</button>
                          </div>
                        );

                        return (
                          <>
                            {/* Contests */}
                            <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleFilterToggle('contests')}
                                  className={`flex-1 px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.contests ? 'bg-slate-900/60 border-white/10 text-slate-200' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layerColors.contests }} />
                                    <span className="truncate">🏆 CONTEST</span>
                                  </div>
                                  <span className="text-[8px] font-black opacity-60 font-mono">FEED</span>
                                </button>
                              </div>
                              {showFilters.contests && <ColorPicker layerKey="contests" />}
                              {showFilters.contests && (
                                <SubItemList
                                  items={availablePlatforms.length === 0 ? [] : availablePlatforms}
                                  emptyLabel="No upcoming contests"
                                  getChecked={(p) => showPlatformFilters[p] !== false}
                                  onToggle={(p) => setShowPlatformFilters((prev) => ({ ...prev, [p]: !( prev[p] !== false) }))}
                                  colorType="platform"
                                  getColor={(p) => getSubItemColor('platform', p) || layerColors.contests}
                                  onSetColor={(p, hex) => setSubItemColor(`platform:${p}`, hex)}
                                  defaultColor={layerColors.contests}
                                />
                              )}
                            </div>

                            {/* Todo */}
                            <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                              <button type="button" onClick={() => handleFilterToggle('todo')}
                                className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.todo ? 'bg-slate-900/60 border-white/10 text-slate-200' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layerColors.todo }} />
                                  <span className="truncate">✔ TODO</span>
                                </div>
                                <span className="text-[8px] font-black opacity-60 font-mono">GOALS</span>
                              </button>
                              {showFilters.todo && <ColorPicker layerKey="todo" />}
                              {showFilters.todo && projects.length > 0 && (
                                <SubItemList
                                  items={projects.map((p) => p.name)}
                                  emptyLabel="No lists"
                                  getChecked={(name) => {
                                    const p = projects.find((x) => x.name === name);
                                    return p ? showProjectFilters[p.id] !== false : true;
                                  }}
                                  onToggle={(name) => {
                                    const p = projects.find((x) => x.name === name);
                                    if (p) setShowProjectFilters((prev) => ({ ...prev, [p.id]: !(prev[p.id] !== false) }));
                                  }}
                                  colorType="project"
                                  getColor={(name) => {
                                    const p = projects.find((x) => x.name === name);
                                    return getSubItemColor('project', name) || (p ? p.color : layerColors.todo);
                                  }}
                                  onSetColor={(name, hex) => setSubItemColor(`project:${name}`, hex)}
                                  defaultColor={layerColors.todo}
                                />
                              )}
                            </div>

                            {/* Personal Events */}
                            <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                              <button type="button" onClick={() => handleFilterToggle('personal')}
                                className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.personal ? 'bg-slate-900/60 border-white/10 text-slate-200' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layerColors.personal }} />
                                  <span className="truncate">📌 EVENTS</span>
                                </div>
                                <span className="text-[8px] font-black opacity-60 font-mono">PERSONAL</span>
                              </button>
                              {showFilters.personal && <ColorPicker layerKey="personal" />}
                            </div>

                            {/* Feed Events */}
                            <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                              <button type="button" onClick={() => handleFilterToggle('events')}
                                className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.events ? 'bg-slate-900/60 border-white/10 text-slate-200' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layerColors.events }} />
                                  <span className="truncate">📣 EVENTS</span>
                                </div>
                                <span className="text-[8px] font-black opacity-60 font-mono">FEED</span>
                              </button>
                              {showFilters.events && <ColorPicker layerKey="events" />}
                            </div>

                            {/* Tasks (bootcamp deadlines) */}
                            <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                              <button type="button" onClick={() => handleFilterToggle('tasks')}
                                className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.tasks ? 'bg-slate-900/60 border-white/10 text-slate-200' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layerColors.tasks }} />
                                  <span className="truncate">📅 TASKS</span>
                                </div>
                                <span className="text-[8px] font-black opacity-60 font-mono">BOOTCAMP</span>
                              </button>
                              {showFilters.tasks && <ColorPicker layerKey="tasks" />}
                              {showFilters.tasks && (
                                <SubItemList
                                  items={availableBootcamps}
                                  emptyLabel="No bootcamp deadlines"
                                  getChecked={(b) => showBootcampFilters[b] !== false}
                                  onToggle={(b) => setShowBootcampFilters((prev) => ({ ...prev, [b]: !(prev[b] !== false) }))}
                                  colorType="bootcamp"
                                  getColor={(b) => getSubItemColor('bootcamp', b) || layerColors.tasks}
                                  onSetColor={(b, hex) => setSubItemColor(`bootcamp:${b}`, hex)}
                                  defaultColor={layerColors.tasks}
                                />
                              )}
                            </div>

                            {/* Sessions */}
                            <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                              <button type="button" onClick={() => handleFilterToggle('sessions')}
                                className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.sessions ? 'bg-slate-900/60 border-white/10 text-slate-200' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layerColors.sessions }} />
                                  <span className="truncate">🎓 SESSIONS</span>
                                </div>
                                <span className="text-[8px] font-black opacity-60 font-mono">BOOTCAMP</span>
                              </button>
                              {showFilters.sessions && <ColorPicker layerKey="sessions" />}
                              {showFilters.sessions && (
                                <SubItemList
                                  items={availableBootcamps}
                                  emptyLabel="No bootcamp sessions"
                                  getChecked={(b) => showBootcampFilters[b] !== false}
                                  onToggle={(b) => setShowBootcampFilters((prev) => ({ ...prev, [b]: !(prev[b] !== false) }))}
                                  colorType="bootcamp"
                                  getColor={(b) => getSubItemColor('bootcamp', b) || layerColors.sessions}
                                  onSetColor={(b, hex) => setSubItemColor(`bootcamp:${b}`, hex)}
                                  defaultColor={layerColors.sessions}
                                />
                              )}
                            </div>
                          </>
                        );
                      })()}

                    </div>
                  )}
                </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl border border-white/[0.08] p-5 flex flex-col flex-1 shadow-2xl" id="calendar-day-details" style={{ minHeight: '340px', maxHeight: '640px' }}>
          {/* Header */}
          <div className="flex justify-between items-start gap-3 pb-3.5 border-b border-white/[0.05] shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-violet-400 font-mono tracking-widest uppercase font-black">Schedule</span>
                {isSelectedToday && (
                  <span className="px-1.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[7.5px] font-black font-mono tracking-widest uppercase leading-none">Today</span>
                )}
              </div>
              <h4 className="text-[14px] font-extrabold text-white mt-1.5 truncate">
                {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h4>
              <p className="text-[9px] font-mono text-slate-500 mt-1">
                {totalCount + feedCount === 0
                  ? 'Nothing scheduled'
                  : [
                      totalCount > 0 ? `${totalCount} goal${totalCount > 1 ? 's' : ''}` : null,
                      feedCount > 0 ? `${feedCount} event${feedCount > 1 ? 's' : ''}` : null,
                    ].filter(Boolean).join(' · ')}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onCreatePersonal && (
                <button type="button" onClick={onCreatePersonal} title="New event" className="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/20 rounded-xl transition flex items-center justify-center cursor-pointer">
                  <CalendarDays className="w-3.5 h-3.5 stroke-2" />
                </button>
              )}
              <button type="button" onClick={() => onOpenCreatePane?.()} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-bold font-mono tracking-wider transition flex items-center gap-1 cursor-pointer shadow-lg shadow-violet-600/10 hover:scale-[1.01]">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>GOAL</span>
              </button>
            </div>
          </div>

          {/* Completion progress */}
          {totalCount > 0 && (
            <div className={`mt-3.5 p-3.5 rounded-2xl shrink-0 border transition-colors ${allGoalsDone ? 'bg-emerald-500/[0.07] border-emerald-500/25' : 'bg-slate-900/50 border-white/5'}`}>
              <div className="flex justify-between items-center text-[9px] font-mono mb-2">
                <span className={`font-black tracking-wider ${allGoalsDone ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {allGoalsDone ? '✓ ALL GOALS DONE' : 'GOAL PROGRESS'}
                </span>
                <span className="text-white font-black">{completedCount}/{totalCount} · {completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-full ${allGoalsDone ? 'bg-emerald-400' : 'bg-gradient-to-r from-violet-500 to-emerald-400'}`}
                />
              </div>
            </div>
          )}

          {/* Schedule list */}
          <div className="mt-4 flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1 space-y-2.5">
            {selectedDayTasks.length === 0 ? (
              <div className="h-full min-h-[170px] flex flex-col items-center justify-center text-center p-6">
                <div className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl text-slate-500 mb-3.5">
                  <CalendarDays className="w-5 h-5 stroke-[1.5]" />
                </div>
                <p className="text-[11px] font-bold text-slate-300">{isSelectedToday ? 'Your day is clear' : 'Nothing scheduled'}</p>
                <p className="text-[9px] font-mono text-slate-500 mt-1 mb-3.5">Plan a goal or block out an event.</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => onOpenCreatePane?.()} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[9.5px] font-black font-mono tracking-wider transition flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3 h-3 stroke-[2.5]" /> ADD GOAL
                  </button>
                  {onCreatePersonal && (
                    <button type="button" onClick={onCreatePersonal} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/20 rounded-xl text-[9.5px] font-black font-mono tracking-wider transition flex items-center gap-1 cursor-pointer">
                      <CalendarDays className="w-3 h-3" /> ADD EVENT
                    </button>
                  )}
                </div>
              </div>
            ) : (
              selectedDayTasks.map((t) => {
                if (getFeedMeta(t)) {
                  return (
                    <FeedItemCard
                      key={`agenda-feed-${t.id}`}
                      task={t}
                      variant="row"
                      onSelect={onSelectTask}
                      accentColor={getTaskColor(t)}
                    />
                  );
                }

                const tc = getTaskColor(t);
                return (
                  <div
                    key={`agenda-task-line-${t.id}`}
                    style={{ borderColor: tc + '2e', backgroundColor: tc + '0d' }}
                    className={`relative flex items-center gap-3 pl-4 pr-3 py-3 border rounded-2xl group select-none cursor-pointer transition-all duration-150 hover:translate-x-0.5 hover:brightness-110 ${t.completed ? 'opacity-60' : ''}`}
                    onClick={() => onSelectTask(t.id)}
                  >
                    {/* Left accent bar */}
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full" style={{ backgroundColor: tc }} />

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onToggleComplete(t.id); }}
                      title={t.completed ? 'Mark incomplete' : 'Mark complete'}
                      style={t.completed ? { backgroundColor: tc, borderColor: tc } : { borderColor: tc + '90' }}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition hover:scale-110 ${t.completed ? 'text-white' : 'text-transparent'}`}
                    >
                      {t.completed && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <span className={`block text-[11.5px] font-bold break-words tracking-tight leading-snug ${t.completed ? 'line-through text-slate-500' : 'text-slate-100'}`} title={t.title}>
                        {t.title}
                      </span>
                      {t.time && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[8.5px] font-mono font-black" style={{ color: tc }}>
                          <Clock className="w-2.5 h-2.5" />
                          {fmt24(t.time)}{t.endTime ? ` – ${fmt24(t.endTime)}` : ''}
                        </span>
                      )}
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ExpandedCalendarModal
        open={expandedCalOpen}
        tasks={tasks}
        projects={projects}
        onClose={() => setExpandedCalOpen(false)}
        onSelectTask={onSelectTask}
        onToggleComplete={onToggleComplete}
        onOpenCreatePane={onOpenCreatePane}
      />
    </div>
  );
}
