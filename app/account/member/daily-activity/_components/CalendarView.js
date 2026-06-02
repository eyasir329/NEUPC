/**
 * @file Calendar tab for Daily Activity — a month grid and weekly agenda
 *   over the member's todos plus the read-only activity feed. A side panel
 *   exposes toggleable "layers" (todos by project, events, contests by
 *   platform, bootcamp deadlines/sessions by bootcamp) and a day-detail
 *   list for the selected date. Double-clicking a day (or the side "Spawn
 *   Goal" button) opens an inline add-task workbench with a natural-language
 *   command bar and a live preview. Recurring tasks are expanded per day via
 *   {@link isTaskOnDate}; feed items render through {@link FeedItemCard}.
 *
 * @module daily-activity/CalendarView
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, Check, Plus, CalendarDays, CheckCircle2, RefreshCw, Info, Layers, LayoutGrid, ListTodo, Tag, Sparkles,
  Compass, Flame, ShieldAlert, HelpCircle, X, Flag, Activity, GitPullRequest,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, getTodayDateString, formatDateString, addDays, getFeedMeta, parseNaturalLanguage, getFriendlyDate, isTaskOnDate } from './utils';
import FeedItemCard from './FeedItemCard';
import GoogleCalendarPanel from './GoogleCalendarPanel';

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

export default function CalendarView({ tasks, projects, sections = [], labels = [], onAddTask, onToggleComplete, onSelectTask, onToast }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => getTodayDateString());
  const [viewMode, setViewMode] = useState('grid');

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalDateStr, setModalDateStr] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalPriority, setModalPriority] = useState(Priority.P3);
  const [modalProjectId, setModalProjectId] = useState('');
  const [modalSectionId, setModalSectionId] = useState('');
  const [modalRecurrence, setModalRecurrence] = useState('none');
  const [modalLabelStr, setModalLabelStr] = useState('Personal');
  const [nlpCommand, setNlpCommand] = useState('');

  // Sections available for the currently selected modal project. Derived
  // after modalProjectId so it recomputes whenever the project changes.
  const activeSections = sections.filter((s) => s.projectId === modalProjectId);

  const [showFilters, setShowFilters] = useState({
    todo: true,
    events: true,
    contests: true,
    tasks: true,
    sessions: true,
  });

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showPlatformFilters, setShowPlatformFilters] = useState({});
  const [showProjectFilters, setShowProjectFilters] = useState({});
  const [showBootcampFilters, setShowBootcampFilters] = useState({});

  useEffect(() => {
    if (projects.length > 0) {
      if (!modalProjectId) {
        setModalProjectId(projects[0].id);
      }
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

    // Google Calendar items are not shown on the calendar.
    if (task.feedCategory === 'gcal') return false;

    // Published events have their own layer.
    if (task.feedCategory === 'event') return showFilters.events;

    // Personal todos (no feed category).
    if (task.projectId && showProjectFilters[task.projectId] === false) {
      return false;
    }
    return showFilters.todo;
  };

  const getFilteredTasksForDate = (dateStr) => {
    return tasks.filter((t) => !t.isArchived && isTaskOnDate(t, dateStr) && checkTaskMatchesFilters(t));
  };

  const openCustomAddTask = (e, dateStr) => {
    e.stopPropagation();
    setModalDateStr(dateStr);
    setModalTitle('');
    setModalDesc('');
    setModalPriority(Priority.P3);
    if (projects.length > 0) setModalProjectId(projects[0].id);
    setModalSectionId('');
    setModalRecurrence('none');
    setModalLabelStr('Personal');
    setNlpCommand('');
    setShowAddModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    onAddTask({
      title: modalTitle.trim(),
      description: modalDesc.trim() || 'Logged via Calendar layout planner.',
      priority: modalPriority,
      dueDate: modalDateStr,
      projectId: modalProjectId || projects[0]?.id || 'proj_personal',
      sectionId: modalSectionId || undefined,
      recurrence: modalRecurrence === 'none' ? undefined : modalRecurrence,
      labels: modalLabelStr.split(',').map((s) => s.trim().replace(/^@/, '')).filter(Boolean),
    });

    setModalTitle('');
    setModalDesc('');
    setModalSectionId('');
    setModalRecurrence('none');
    setNlpCommand('');
    setShowAddModal(false);
  };

  const handleNlpChange = (val) => {
    setNlpCommand(val);
    if (!val.trim()) return;

    // Use our ported parseNaturalLanguage helper
    const parsed = parseNaturalLanguage(val, projects, labels);

    if (parsed.cleanTitle && parsed.cleanTitle !== 'Untitled Task') {
      setModalTitle(parsed.cleanTitle);
    }
    if (parsed.dueDate) {
      setModalDateStr(parsed.dueDate);
    }
    if (parsed.priority) {
      // parseNaturalLanguage returns 4 for P4, which is equivalent to P3 or default in this calendar view. Let's map it safely.
      if (parsed.priority === Priority.P1) setModalPriority(Priority.P1);
      else if (parsed.priority === Priority.P2) setModalPriority(Priority.P2);
      else if (parsed.priority === Priority.P3) setModalPriority(Priority.P3);
      else if (parsed.priority === Priority.P4) setModalPriority(Priority.P3); // Fallback to P3 general
    }
    if (parsed.projectId) {
      setModalProjectId(parsed.projectId);
    }
    if (parsed.labels && parsed.labels.length > 0) {
      setModalLabelStr(parsed.labels.join(', '));
    }
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

  const selectedDayTasks = getFilteredTasksForDate(selectedDateStr);
  const completedCount = selectedDayTasks.filter((t) => t.completed).length;
  const totalCount = selectedDayTasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Distinct items visible across the days currently shown in the grid — the
  // set "Sync now" pushes to Google. De-duped because recurring items appear
  // on multiple days.
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
                    onDoubleClick={(e) => openCustomAddTask(e, dateStr)}
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
                        <button type="button" onClick={(e) => openCustomAddTask(e, dateStr)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-violet-600 hover:text-white text-slate-400 rounded-lg transition duration-150 transform hover:scale-105" title="Quick Add Goal">
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3.5 space-y-1.5 flex-1 flex flex-col justify-end overflow-hidden max-h-[80px]">
                      {dateTasks.slice(0, 3).map((task) => {
                        const prioInfo = getPriorityColor(task.priority);
                        if (getFeedMeta(task)) {
                          return <FeedItemCard key={`month-mini-t-${task.id}`} task={task} variant="chip" />;
                        }

                        const proj = projects.find((p) => p.id === task.projectId);
                        const projColor = proj ? proj.color : prioInfo.raw;

                        return (
                          <div
                            key={`month-mini-t-${task.id}`}
                            style={{ borderLeftColor: projColor }}
                            className={`text-[8.5px] font-bold font-mono truncate px-1.5 py-0.5 rounded-md leading-none bg-white/[0.04] hover:bg-white/[0.06] transition duration-150 flex items-center gap-1 border-l-2 ${task.completed ? 'text-slate-500 line-through opacity-50' : 'text-slate-300'}`}
                          >
                            <span className="truncate flex-1">{task.title}</span>
                            {task.time && <span className="text-[7.5px] text-violet-400 shrink-0 font-black">🕒{task.time}</span>}
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
                  onDoubleClick={(e) => openCustomAddTask(e, dateStr)}
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

                    <button onClick={(e) => { e.stopPropagation(); openCustomAddTask(e, dateStr); }} className="p-1 hover:bg-white/[0.06] text-slate-400 hover:text-violet-300 rounded-lg transition" title="Add Goal">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right Column: Horizontally Listed Tasks */}
                  <div className="flex-1 flex flex-wrap gap-2 items-center min-w-0 py-1">
                    {weekTasks.map((t) => {
                      const prioClass = getPriorityColor(t.priority);
                      if (getFeedMeta(t)) {
                        return (
                          <div key={`weekly-row-feed-${t.id}`} className="max-w-[240px] shrink-0">
                            <FeedItemCard task={t} variant="chip" link onSelect={onSelectTask} />
                          </div>
                        );
                      }

                      const proj = projects.find((p) => p.id === t.projectId);
                      const projColor = proj ? proj.color : prioClass.raw;

                      return (
                        <div
                          key={`weekly-row-task-${t.id}`}
                          onClick={(e) => { e.stopPropagation(); onSelectTask(t.id); }}
                          style={{ borderLeftColor: projColor }}
                          className={`p-2 px-3 bg-white/[0.04] hover:bg-white/[0.06] border-y border-r border-l-2 border-white/[0.02] rounded-xl cursor-pointer transition duration-150 flex items-center gap-2 max-w-[240px] shrink-0 ${t.completed ? 'opacity-35' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleComplete(t.id); }}
                            className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all shrink-0 cursor-pointer ${t.completed ? 'bg-violet-600 border-violet-400 text-slate-950 shadow-sm' : 'border-white/20 text-transparent hover:border-violet-400'}`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[4.5] text-white" />
                          </button>

                          <span className={`text-[10.5px] font-bold truncate leading-none ${t.completed ? 'line-through text-slate-500 font-medium' : 'text-slate-200'}`} title={t.title}>
                            {t.title}
                          </span>
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
          <GoogleCalendarPanel monthTasks={monthTasks} onToast={onToast} />

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
                      {Object.keys(showFilters).map((key) => {
                        const checked = showFilters[key];
                        let label = '';
                        let activeStyle = '';
                        if (key === 'todo') { label = 'Todo'; activeStyle = 'bg-slate-800 text-slate-300 border-slate-600/30'; }
                        if (key === 'events') { label = '📣 Events'; activeStyle = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'; }
                        if (key === 'contests') { label = '🏆 Contest'; activeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/25'; }
                        if (key === 'tasks') { label = '📅 Tasks'; activeStyle = 'bg-violet-500/10 text-violet-300 border-violet-500/25'; }
                        if (key === 'sessions') { label = '🎓 Sessions'; activeStyle = 'bg-sky-500/10 text-sky-400 border-sky-500/25'; }
                        if (!label) return null;
                        return (
                          <button
                            key={`compact-filter-pill-mini-${key}`}
                            type="button"
                            onClick={() => handleFilterToggle(key)}
                            className={`px-3 py-1 rounded-xl text-[9px] font-black font-mono border transition duration-150 flex items-center gap-1.5 cursor-pointer select-none ${checked ? `${activeStyle} shadow-sm` : 'bg-slate-950/20 border-transparent text-slate-500 opacity-60 hover:opacity-100'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${checked ? (key === 'todo' ? 'bg-slate-400' : key === 'events' ? 'bg-emerald-400' : key === 'contests' ? 'bg-amber-400' : key === 'tasks' ? 'bg-violet-400' : 'bg-sky-400') : 'bg-slate-600'}`} />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in duration-200 text-xs max-h-[60vh] overflow-y-auto pr-1" id="hierarchical-layer-filters">
                      {/* Contests */}
                      <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => handleFilterToggle('contests')}
                          className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.contests ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${showFilters.contests ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                            <span className="truncate">🏆 CONTEST</span>
                          </div>
                          <span className="text-[8px] font-black opacity-60 font-mono">FEED</span>
                        </button>
                        {showFilters.contests && (
                          <div className="pl-3.5 space-y-1.5 border-l border-slate-800 ml-2.5 flex flex-col gap-1">
                            {availablePlatforms.length === 0 ? (
                              <span className="text-[9px] text-slate-600 font-mono py-1 px-2">No upcoming contests</span>
                            ) : (
                              availablePlatforms.map((platform) => {
                                const isChecked = showPlatformFilters[platform] !== false;
                                return (
                                  <div
                                    key={`sublayer-platform-${platform}`}
                                    onClick={() => setShowPlatformFilters((prev) => ({ ...prev, [platform]: !isChecked }))}
                                    className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/40 rounded-lg cursor-pointer transition select-none"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition ${isChecked ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-white/10 text-transparent'}`}>
                                        <Check className="w-2.5 h-2.5 stroke-[4.5]" />
                                      </div>
                                      <span className={`text-[9.5px] font-bold capitalize truncate ${isChecked ? 'text-slate-200' : 'text-slate-500'}`}>{platform}</span>
                                    </div>
                                    <span className="px-1 rounded text-[8px] font-mono font-black border uppercase border-amber-500/20 bg-amber-500/10 text-amber-400">{platform}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {/* Todo (personal) */}
                      <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => handleFilterToggle('todo')}
                          className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.todo ? 'bg-slate-800 text-slate-300 border-slate-700/55' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${showFilters.todo ? 'bg-slate-300' : 'bg-slate-600'}`} />
                            <span className="truncate">✔ TODO</span>
                          </div>
                          <span className="text-[8px] font-black opacity-60 font-mono">PERSONAL</span>
                        </button>
                        {showFilters.todo && projects.length > 0 && (
                          <div className="pl-3.5 space-y-1.5 border-l border-slate-800 ml-2.5 flex flex-col gap-1">
                            <span className="text-[7.5px] text-slate-500 font-mono tracking-widest uppercase block font-black mt-2">LIST SUBCATEGORIES</span>
                            {projects.map((proj) => {
                              const isChecked = showProjectFilters[proj.id] !== false;
                              return (
                                <div
                                  key={`sublayer-project-${proj.id}`}
                                  onClick={() => setShowProjectFilters((prev) => ({ ...prev, [proj.id]: !isChecked }))}
                                  className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/40 rounded-lg cursor-pointer transition select-none"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all ${isChecked ? 'bg-violet-600 border-violet-500 text-white' : 'border-white/10 text-transparent'}`}>
                                      <Check className="w-2.5 h-2.5 stroke-[4.5]" />
                                    </div>
                                    <span className={`text-[10px] font-bold truncate ${isChecked ? 'text-slate-200' : 'text-slate-500'}`}>{proj.name}</span>
                                  </div>
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Events */}
                      <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => handleFilterToggle('events')}
                          className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.events ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${showFilters.events ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                            <span className="truncate">📣 EVENTS</span>
                          </div>
                          <span className="text-[8px] font-black opacity-60 font-mono">FEED</span>
                        </button>
                      </div>

                      {/* Tasks (bootcamp deadlines) */}
                      <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => handleFilterToggle('tasks')}
                          className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.tasks ? 'bg-violet-500/10 text-violet-300 border-violet-500/25' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${showFilters.tasks ? 'bg-violet-400 animate-pulse' : 'bg-slate-600'}`} />
                            <span className="truncate">📅 TASKS</span>
                          </div>
                          <span className="text-[8px] font-black opacity-60 font-mono">BOOTCAMP</span>
                        </button>
                        {showFilters.tasks && (
                          <BootcampSubFilters
                            bootcamps={availableBootcamps}
                            state={showBootcampFilters}
                            onToggle={(b) => setShowBootcampFilters((prev) => ({ ...prev, [b]: prev[b] === false }))}
                            accent="indigo"
                            emptyLabel="No bootcamp deadlines"
                          />
                        )}
                      </div>

                      {/* Sessions (bootcamp) */}
                      <div className="space-y-2 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => handleFilterToggle('sessions')}
                          className={`w-full px-3 py-2 text-[10px] font-black font-mono rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${showFilters.sessions ? 'bg-sky-500/10 text-sky-400 border-sky-500/25' : 'bg-slate-900/40 border-transparent text-slate-500'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${showFilters.sessions ? 'bg-sky-400' : 'bg-slate-600'}`} />
                            <span className="truncate">🎓 SESSIONS</span>
                          </div>
                          <span className="text-[8px] font-black opacity-60 font-mono">BOOTCAMP</span>
                        </button>
                        {showFilters.sessions && (
                          <BootcampSubFilters
                            bootcamps={availableBootcamps}
                            state={showBootcampFilters}
                            onToggle={(b) => setShowBootcampFilters((prev) => ({ ...prev, [b]: prev[b] === false }))}
                            accent="sky"
                            emptyLabel="No bootcamp sessions"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl border border-white/[0.08] p-5 flex flex-col flex-1 shadow-2xl" id="calendar-day-details" style={{ minHeight: '340px' }}>
          <div className="flex justify-between items-center pb-3 border-b border-white/[0.05] shrink-0">
            <div>
              <span className="text-[8px] text-violet-400 font-mono tracking-widest uppercase block font-black">ACTIVE TODAY SCHEDULE</span>
              <h4 className="text-[13px] font-extrabold text-white mt-1 truncate max-w-[170px]">
                {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h4>
            </div>

            <button onClick={(e) => openCustomAddTask(e, selectedDateStr)} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-bold font-mono tracking-wider transition flex items-center gap-1 cursor-pointer shadow-lg shadow-violet-600/10 hover:scale-[1.01]">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>SPAWN GOAL</span>
            </button>
          </div>

          {totalCount > 0 && (
            <div className="mt-3.5 p-3.5 bg-slate-900/50 border border-white/5 rounded-2xl shrink-0">
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mb-1.5">
                <span className="font-bold">COMPLETION INDICATOR</span>
                <span className="text-white font-black">{completedCount}/{totalCount} FINISHED ({completionPercentage}%)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${completionPercentage}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full" />
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {selectedDayTasks.length === 0 ? (
              <div className="h-full min-h-[170px] flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono text-[10px]">
                <div className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 mb-3 opacity-60">
                  <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
                </div>
                <span>No goals blocked out on this day.</span>
                <button type="button" onClick={(e) => openCustomAddTask(e, selectedDateStr)} className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 font-bold transition font-sans underline underline-offset-4 cursor-pointer">
                  Configure schedule now
                </button>
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
                    />
                  );
                }

                return (
                  <div
                    key={`agenda-task-line-${t.id}`}
                    className="flex justify-between items-center gap-3 p-3.5 bg-slate-900/50 hover:bg-slate-800 border border-white/5 hover:border-violet-500/20 rounded-2xl group select-none cursor-pointer duration-150 transition shadow-md"
                    onClick={() => onSelectTask(t.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(t.id); }}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${t.completed ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-white/20 hover:border-violet-400 text-transparent'}`}
                      >
                        {t.completed && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                      </button>
                      <span className={`text-[11.5px] font-black break-words tracking-tight leading-snug min-w-0 flex-1 ${t.completed ? 'line-through text-slate-500' : 'text-slate-100 font-semibold'}`}>{t.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {t.time && (
                        <span className="text-[9px] font-mono font-black text-slate-400">🕒 {t.time}</span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-gray-900 border border-white/[0.08] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden text-slate-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 text-left">
                {/* Left Column - Inputs Form (col-span-7) */}
                <div className="md:col-span-7 p-6 md:p-8 flex flex-col gap-6 border-r border-white/[0.05] max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-none">Add a goal</h3>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {getFriendlyDate(modalDateStr).text}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition duration-200 hover:scale-105"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                    {/* Quick-add: parses date/priority/#list/@label tokens from one line. */}
                    <div className="p-4 bg-white/[0.02] border border-violet-500/20 rounded-2xl flex flex-col gap-2.5 focus-within:border-violet-500/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-300">
                      <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-violet-400 font-semibold uppercase">
                        <span className="flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-violet-400" />
                          Quick add
                        </span>
                        <span className="text-[9px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-md font-mono border border-violet-500/20">Smart parse</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Solve 3 AVL problems tomorrow p1 #personal @practice"
                        value={nlpCommand}
                        onChange={(e) => handleNlpChange(e.target.value)}
                        className="w-full text-xs p-1 bg-transparent border-none outline-none focus:ring-0 text-white placeholder:text-slate-600 font-medium font-sans"
                      />
                      {nlpCommand.trim() && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04]">
                          <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase font-black mr-1 flex items-center">Detected:</span>
                          {modalTitle && (
                            <span className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded-md text-[8.5px] font-mono text-slate-300 truncate max-w-[150px]">
                              📝 &ldquo;{modalTitle}&rdquo;
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded-md text-[8.5px] font-mono text-emerald-400">
                            📅 {modalDateStr}
                          </span>
                          <span className={`px-2 py-0.5 bg-slate-900 border border-white/5 rounded-md text-[8.5px] font-mono ${modalPriority === Priority.P1 ? 'text-rose-400' : modalPriority === Priority.P2 ? 'text-amber-400' : 'text-sky-400'}`}>
                            🔥 P{modalPriority}
                          </span>
                          {modalProjectId && (
                            <span className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded-md text-[8.5px] font-mono text-violet-300">
                              📁 #{projects.find(p => p.id === modalProjectId)?.name?.replace(/\s+.*$/, '') || 'Space'}
                            </span>
                          )}
                          {modalLabelStr.trim() && modalLabelStr.split(',').map((lbl, idx) => (
                            <span key={`detected-lbl-${idx}`} className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded-md text-[8.5px] font-mono text-slate-400">
                              @{lbl.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Goal Title */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Goal Description Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Codechef dynamic greedy algorithms challenge"
                        value={modalTitle}
                        onChange={(e) => setModalTitle(e.target.value)}
                        className="w-full p-3.5 bg-slate-950/40 border border-white/[0.06] rounded-2xl focus:outline-none focus:border-violet-500/80 focus:bg-slate-950/80 text-white font-medium placeholder:text-slate-600 transition-all duration-200"
                        required
                      />
                    </div>

                    {/* Detailed context description */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Detailed context description (Optional)</label>
                      <textarea
                        placeholder="Add exact instructions, compiler dependencies or platform links..."
                        value={modalDesc}
                        onChange={(e) => setModalDesc(e.target.value)}
                        className="w-full p-3.5 bg-slate-950/40 border border-white/[0.06] rounded-2xl focus:outline-none focus:border-violet-500/80 focus:bg-slate-950/80 text-white font-medium placeholder:text-slate-600 h-16 resize-none transition-all duration-200"
                      />
                    </div>

                    {/* Visual Interactive Date Strip Picker & presets */}
                    <div className="space-y-2">
                      <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Scheduled Date Planning Block</label>
                      <div className="flex flex-col gap-2.5">
                        {/* 7 day slider */}
                        <div className="grid grid-cols-7 gap-1.5">
                          {Array.from({ length: 7 }, (_, i) => {
                            const d = addDays(new Date(), i);
                            const dStr = formatDateString(d);
                            const isSelected = dStr === modalDateStr;
                            const isToday = dStr === getTodayDateString();
                            return (
                              <button
                                key={`date-strip-${i}`}
                                type="button"
                                onClick={() => setModalDateStr(dStr)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 relative ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-violet-600 to-violet-600 border-violet-400 text-white font-extrabold shadow-[0_4px_18px_rgba(99,102,241,0.3)] scale-[1.03]'
                                    : 'bg-slate-950/40 border-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-slate-950/80 hover:border-white/10'
                                }`}
                              >
                                <span className="text-[8px] font-mono font-black tracking-wider uppercase block leading-none">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                <span className={`text-[11px] font-mono font-black mt-1.5 block leading-none ${isToday && !isSelected ? 'text-violet-400 font-black' : ''}`}>{d.getDate()}</span>
                                {isToday && (
                                  <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-violet-500'}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {/* Quick preset badges & manual input */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex gap-2">
                            {[
                              { label: 'TODAY', value: getTodayDateString() },
                              { label: 'TOMORROW', value: formatDateString(addDays(new Date(), 1)) },
                              { label: 'NEXT WEEK', value: formatDateString(addDays(new Date(), 7)) }
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setModalDateStr(preset.value)}
                                className={`px-3 py-1.5 text-[8.5px] font-black font-mono border rounded-xl transition-all duration-200 ${
                                  modalDateStr === preset.value
                                    ? 'bg-violet-500/15 border-violet-500 text-violet-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-slate-950/20 border-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 border border-white/[0.06] rounded-xl hover:border-white/10 transition duration-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                            <input
                              type="date"
                              value={modalDateStr}
                              onChange={(e) => e.target.value && setModalDateStr(e.target.value)}
                              className="bg-transparent border-none outline-none focus:ring-0 text-[10px] text-white p-0.5 w-[110px] text-right font-mono [color-scheme:dark]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Priority Classification */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Priority Classification</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { level: Priority.P1, text: 'CRITICAL (P1)', icon: Flame, color: 'border-rose-500/20 text-rose-400 bg-rose-500/5', activeColor: 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-black border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.01]' },
                          { level: Priority.P2, text: 'MEDIUM (P2)', icon: ShieldAlert, color: 'border-amber-500/20 text-amber-400 bg-amber-500/5', activeColor: 'bg-gradient-to-r from-amber-600 to-orange-600 text-slate-950 font-black border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.01]' },
                          { level: Priority.P3, text: 'GENERAL (P3)', icon: HelpCircle, color: 'border-violet-500/20 text-violet-400 bg-violet-500/5', activeColor: 'bg-gradient-to-r from-violet-600 to-violet-600 text-white font-black border-violet-500 shadow-lg shadow-violet-600/20 scale-[1.01]' },
                        ].map((p) => {
                          const IconComponent = p.icon;
                          const isActive = modalPriority === p.level;
                          return (
                            <button
                              key={p.level}
                              type="button"
                              onClick={() => setModalPriority(p.level)}
                              className={`py-2.5 px-2 text-[9px] font-black font-mono rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-300 ${
                                isActive ? p.activeColor : `${p.color} hover:bg-white/5`
                              }`}
                            >
                              <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
                              <span>{p.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Associated Space List Category */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Associated Space List Category</label>
                      <div className="flex flex-wrap gap-2 max-h-[85px] overflow-y-auto p-2 bg-slate-950/40 rounded-2xl border border-white/[0.06]">
                        {projects.map((p) => {
                          const isSelected = modalProjectId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setModalProjectId(p.id)}
                              className={`px-3 py-1.5 text-[9.5px] font-bold rounded-xl border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-violet-600/15 border-violet-500 text-white font-extrabold shadow-md shadow-violet-600/5'
                                  : 'bg-slate-900/40 border-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                              <span className="truncate">{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section & Recurrence Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Section Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Project Section</label>
                        <div className="flex items-center gap-1.5 bg-slate-950/40 p-2.5 border border-white/[0.06] rounded-2xl focus-within:border-violet-500/80 transition-all duration-200">
                          <GitPullRequest className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <select
                            value={modalSectionId}
                            onChange={(e) => setModalSectionId(e.target.value)}
                            disabled={activeSections.length === 0}
                            className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 text-zinc-300 w-full font-medium disabled:opacity-40"
                          >
                            <option value="" className="bg-slate-950 text-slate-300">(None)</option>
                            {activeSections.map((s) => (
                              <option key={s.id} value={s.id} className="bg-slate-950 text-slate-200">{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Recurrence Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Recurrence Block</label>
                        <div className="flex items-center gap-1.5 bg-slate-950/40 p-2.5 border border-white/[0.06] rounded-2xl focus-within:border-violet-500/80 transition-all duration-200">
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <select
                            value={modalRecurrence}
                            onChange={(e) => setModalRecurrence(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 text-zinc-300 w-full font-medium"
                          >
                            <option value="none" className="bg-slate-950 text-slate-300">No Recurrence</option>
                            <option value="daily" className="bg-slate-950 text-slate-200">Daily</option>
                            <option value="weekly" className="bg-slate-950 text-slate-200">Weekly</option>
                            <option value="monthly" className="bg-slate-950 text-slate-200">Monthly</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Custom tags (comma-separated) */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">Custom tags (comma-separated)</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. Dynamic-Greedy, Hackathon, High-XP"
                          value={modalLabelStr}
                          onChange={(e) => setModalLabelStr(e.target.value)}
                          className="w-full pl-9 pr-3 py-3 bg-slate-950/40 border border-white/[0.06] rounded-2xl focus:outline-none focus:border-violet-500/80 text-white font-mono placeholder:text-slate-600 transition-all duration-200"
                        />
                        <Tag className="w-3.5 h-3.5 absolute left-3 top-3.5 text-slate-500" />
                      </div>
                      
                      {/* Suggestion tags below */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        <span className="text-[8px] text-slate-500 font-mono tracking-wider font-bold">Suggestions:</span>
                        {['Study', 'Practice', 'Contest', 'Refactor', 'Urgent'].map((item) => (
                          <button
                            key={`tag-preset-${item}`}
                            type="button"
                            onClick={() => {
                              const existing = modalLabelStr.split(',').map(s => s.trim()).filter(Boolean);
                              if (!existing.some(e => e.toLowerCase() === item.toLowerCase())) {
                                setModalLabelStr([...existing, item].join(', '));
                              }
                            }}
                            className="px-2 py-0.5 bg-slate-950/40 border border-white/[0.04] rounded text-[8px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition duration-200"
                          >
                            +{item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.05] font-black font-mono">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition rounded-xl text-[10px]"
                      >
                        DISMISS
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition shadow-lg shadow-violet-600/25 hover:scale-[1.01] text-[10px] uppercase font-black tracking-wider"
                      >
                        SPAWN GOAL
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Column - Live Interactive Preview Panel (col-span-5) */}
                <div className="md:col-span-5 p-6 md:p-8 bg-slate-950/30 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-violet-400" />
                        Preview
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">How this goal will appear on your calendar and task list.</p>
                    </div>

                    {/* Dynamic card simulation */}
                    <div className="relative mt-2 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl shadow-2xl overflow-hidden group">
                      {/* Priority left colored block */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[4px]"
                        style={{
                          backgroundColor:
                            modalPriority === Priority.P1 ? '#ef4444' :
                            modalPriority === Priority.P2 ? '#f59e0b' : '#3b82f6',
                          boxShadow: `0 0 10px ${
                            modalPriority === Priority.P1 ? 'rgba(239,68,68,0.5)' :
                            modalPriority === Priority.P2 ? 'rgba(245,158,11,0.5)' : 'rgba(59,130,246,0.5)'
                          }`
                        }}
                      />

                      <div className="space-y-4">
                        <div className="flex justify-between items-start pl-1">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {/* Simulator custom checkbox */}
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
                                modalPriority === Priority.P1 ? 'border-rose-500/50 bg-rose-500/5' :
                                modalPriority === Priority.P2 ? 'border-amber-500/50 bg-amber-500/5' : 'border-sky-500/50 bg-sky-500/5'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            </div>
                            
                            <div className="min-w-0">
                              <span className="text-[11.5px] font-black text-slate-100 block break-words tracking-tight leading-snug">
                                {modalTitle.trim() || 'Untitled Goal'}
                              </span>
                              {modalDesc.trim() && (
                                <p className="text-[9px] text-slate-400 mt-2 block break-words font-medium leading-relaxed bg-slate-950/20 p-2.5 rounded-lg border border-white/[0.02]">
                                  {modalDesc}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badges details strip */}
                        <div className="flex flex-wrap gap-1.5 pl-7 border-t border-white/[0.03] pt-3">
                          {/* Friendly date string */}
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase flex items-center gap-1 border ${
                            getFriendlyDate(modalDateStr).isOverdue 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : modalDateStr === getTodayDateString() 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-900 text-slate-400 border-white/5'
                          }`}>
                            <CalendarDays className="w-2.5 h-2.5" />
                            <span>{getFriendlyDate(modalDateStr).text}</span>
                          </span>

                          {/* Space Project List category badge */}
                          {(() => {
                            const matchedProj = projects.find(p => p.id === modalProjectId);
                            if (!matchedProj) return null;
                            return (
                              <span
                                className="px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase flex items-center gap-1 border bg-slate-900 text-slate-300 border-white/5"
                              >
                                <span className="w-1.5 h-1 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: matchedProj.color, boxShadow: `0 0 6px ${matchedProj.color}` }} />
                                <span>{matchedProj.name?.replace(/\s+.*$/, '') || 'Space'}</span>
                              </span>
                            );
                          })()}

                          {/* Priority badge */}
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase flex items-center gap-1 border ${
                            modalPriority === Priority.P1 ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' :
                            modalPriority === Priority.P2 ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' : 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                          }`}>
                            <Flag className="w-2.5 h-2.5 fill-current" />
                            <span>{modalPriority === Priority.P1 ? 'CRITICAL' : modalPriority === Priority.P2 ? 'MEDIUM' : 'GENERAL'}</span>
                          </span>

                          {/* Section Badge */}
                          {(() => {
                            const matchedSec = sections.find(s => s.id === modalSectionId);
                            if (!matchedSec) return null;
                            return (
                              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase flex items-center gap-1 border bg-slate-900 text-violet-300 border-violet-500/10">
                                <GitPullRequest className="w-2.5 h-2.5" />
                                <span>{matchedSec.name}</span>
                              </span>
                            );
                          })()}

                          {/* Recurrence Badge */}
                          {modalRecurrence !== 'none' && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase flex items-center gap-1 border bg-slate-900 text-emerald-300 border-emerald-500/10">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
                              <span>{modalRecurrence}</span>
                            </span>
                          )}
                        </div>

                        {/* Labels Badges strip */}
                        {modalLabelStr.trim() && (
                          <div className="flex flex-wrap gap-1 pl-7">
                            {modalLabelStr.split(',').map((lbl, idx) => {
                              const clean = lbl.trim().replace(/^@/, '');
                              if (!clean) return null;
                              return (
                                <span key={`live-lbl-${idx}`} className="px-1.5 py-0.5 bg-slate-900 border border-white/[0.04] text-[7.5px] font-mono font-black uppercase tracking-wider text-slate-400 rounded-md">
                                  #{clean}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Field summary — the actual values this goal will be saved with. */}
                  <div className="mt-6 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05] space-y-2 text-[11px]">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block pb-2 border-b border-white/[0.04]">Summary</span>

                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-500">Title</span>
                      <span className="text-gray-200 truncate max-w-[170px] font-medium">{modalTitle || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-500">Date</span>
                      <span className="text-gray-200 font-medium">{modalDateStr || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-500">Priority</span>
                      <span className={`font-semibold ${modalPriority === Priority.P1 ? 'text-rose-400' : modalPriority === Priority.P2 ? 'text-amber-400' : 'text-sky-400'}`}>
                        {modalPriority === Priority.P1 ? 'Critical' : modalPriority === Priority.P2 ? 'Medium' : 'General'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-500">List</span>
                      <span className="text-gray-200 font-medium truncate max-w-[130px]">
                        {projects.find(p => p.id === modalProjectId)?.name || 'Inbox'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-500">Section</span>
                      <span className="text-violet-300 font-medium truncate max-w-[130px]">
                        {sections.find(s => s.id === modalSectionId)?.name || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-500">Recurrence</span>
                      <span className="text-gray-200 font-medium capitalize">
                        {modalRecurrence !== 'none' ? modalRecurrence : '—'}
                      </span>
                    </div>
                    {modalLabelStr.trim() && (
                      <div className="flex justify-between items-start gap-3 pt-1.5 border-t border-white/[0.04]">
                        <span className="text-gray-500 shrink-0">Labels</span>
                        <span className="text-gray-400 text-right truncate max-w-[150px]">{modalLabelStr}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
