/**
 * @file Ported verbatim from the Todoist reference app. Types stripped.
 * @module daily-activity/_todoist/TasksView
 */

'use client';

import { useState } from 'react';
import {
  Plus, List, Kanban, Check, Tag, Bookmark, ChevronRight, ArrowLeft, ArrowRight, Trash2, Edit2, Link, Trash, Clipboard, Clock,
} from 'lucide-react';
import { Priority, getPlatformClass, getFeedItemUrl, isTaskOnDate, isTaskInDateRange } from './utils';

export default function TasksView({
  tasks,
  projects,
  sections,
  labels,
  onAddTask,
  onOpenCreate,
  onToggleComplete,
  onDeleteTask,
  onUpdateTask,
  onSelectTask,
  onAddProject,
  onDeleteProject,
  onAddSection,
  onDeleteSection,
  onUpdateSection,
}) {
  const [activeProjectId, setActiveProjectId] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeLayout, setActiveLayout] = useState('list');
  const [activeLabelName, setActiveLabelName] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [inlineSearch, setInlineSearch] = useState('');
  const [quickTitle, setQuickTitle] = useState('');

  const getTodayDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const addDays = (date, days) => {
    const res = new Date(date);
    res.setDate(res.getDate() + days);
    return res;
  };

  const todayStr = getTodayDateString();

  const handleAddNewList = () => {
    const name = prompt('Enter a name for the new list (project):');
    if (name && name.trim()) {
      const colors = ['#db4c3f', '#2563eb', '#9333ea', '#059669', '#d97706', '#0284c7'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onAddProject(name.trim(), randomColor, false);
    }
  };

  const getFilteredTasks = () => {
    let result = tasks.filter((t) => !t.isArchived);

    if (activeProjectId !== 'all') {
      result = result.filter((t) => t.projectId === activeProjectId);
    }

    if (activeLabelName) {
      result = result.filter((t) => t.labels.includes(activeLabelName));
    }

    if (activeFilter === 'today') {
      result = result.filter((t) => isTaskOnDate(t, todayStr) || (t.dueDate && t.dueDate < todayStr && !t.completed));
    } else if (activeFilter === 'upcoming') {
      const d7 = formatDateString(addDays(new Date(), 7));
      result = result.filter((t) => isTaskInDateRange(t, todayStr, d7));
    } else if (activeFilter === 'contests') {
      result = result.filter((t) => t.isContest === true);
    } else if (activeFilter === 'completed') {
      result = result.filter((t) => t.completed === true);
    }

    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    return result;
  };

  const filteredTasks = getFilteredTasks();

  const selectedProjectObj = projects.find((p) => p.id === activeProjectId);

  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const prevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const getProjectIncompleteCount = (projId) => {
    if (projId === 'all') {
      return tasks.filter((t) => !t.isArchived && !t.completed).length;
    }
    return tasks.filter((t) => t.projectId === projId && !t.isArchived && !t.completed).length;
  };

  const getGroupedTasksForList = () => {
    const groups = {};

    paginatedTasks.forEach((t) => {
      let groupKey = 'Inbox (No due date)';
      if (t.dueDate) {
        if (isTaskOnDate(t, todayStr)) {
          groupKey = 'Today';
        } else if (t.dueDate < todayStr && !t.completed) {
          groupKey = 'Overdue / Inbox';
        } else {
          const valDate = new Date(t.dueDate + 'T12:00:00');
          groupKey = valDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
      }
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(t);
    });

    return groups;
  };

  const groupedTasks = getGroupedTasksForList();

  const getPriorityBorderClass = (p) => {
    switch (p) {
      case Priority.P1:
        return 'border-l-4 border-red-500';
      case Priority.P2:
        return 'border-l-4 border-amber-500';
      case Priority.P3:
        return 'border-l-4 border-blue-500';
      default:
        return 'border-l-4 border-slate-500';
    }
  };

  const handleAddNewSection = () => {
    if (activeProjectId === 'all') {
      alert('💬 Select an active list/project first to manage Kanban columns!');
      return;
    }
    const name = prompt('Enter a name for the new column (Section):');
    if (name && name.trim()) {
      onAddSection(activeProjectId, name.trim());
    }
  };

  const renderKanbanCard = (t) => {
    const isFeedItem = t.isContest || ['event', 'task', 'session'].includes(t.feedCategory);

    if (isFeedItem) {
      let kanbanStyle = 'border-white/5 bg-[#111625]';
      let emoji = '✔';
      let labelText = '';

      if (t.isContest) {
        kanbanStyle = 'border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50';
        emoji = '🏆';
        labelText = 'CONTEST';
      } else if (t.feedCategory === 'event') {
        kanbanStyle = 'border-emerald-500/30 bg-emerald-500/[0.03] hover:border-emerald-500/50';
        emoji = '📣';
        labelText = 'EVENT';
      } else if (t.feedCategory === 'task') {
        kanbanStyle = 'border-indigo-500/30 bg-indigo-500/[0.03] hover:border-indigo-500/50';
        emoji = '📅';
        labelText = 'DEADLINE';
      } else if (t.feedCategory === 'session') {
        kanbanStyle = 'border-sky-500/30 bg-sky-500/[0.03] hover:border-sky-500/50';
        emoji = '🎓';
        labelText = 'SESSION';
      }

      return (
        <div
          key={`kanban-task-${t.id}`}
          onClick={() => onSelectTask(t.id)}
          className={`p-3 border rounded-lg transition cursor-pointer select-none space-y-2 relative group ${kanbanStyle}`}
        >
          <div className="flex items-start gap-2 justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 mb-1 text-slate-300">
                <span className="text-[10px]">{emoji}</span>
                <span className="text-[7.5px] font-black font-mono tracking-wider opacity-80">{labelText}</span>
              </div>
              <span className="text-xs font-bold text-slate-100 leading-snug truncate block">{t.title}</span>
            </div>
          </div>
          {t.description && <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{t.description}</p>}
        </div>
      );
    }

    return (
      <div
        key={`kanban-task-${t.id}`}
        onClick={() => onSelectTask(t.id)}
        className="p-3 bg-[#111625] border border-white/5 rounded-lg hover:border-indigo-400/30 transition cursor-pointer select-none space-y-2 relative group"
      >
        <div className="flex items-start gap-2 justify-between">
          <span className={`text-xs font-bold leading-snug truncate block w-4/5 ${t.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>{t.title}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(t.id);
            }}
            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${t.completed ? 'bg-emerald-500 text-white border-transparent' : 'border-white/20'}`}
          >
            {t.completed && <Check className="w-2.5 h-2.5" />}
          </button>
        </div>
        {t.description && <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{t.description}</p>}
      </div>
    );
  };

  const activeSections = sections.filter((s) => s.projectId === activeProjectId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="tasks-layout-view">
      <div className="bg-[#0c1221] rounded-2xl border border-white/[0.04] p-5 col-span-1 lg:col-span-3 h-full flex flex-col justify-between" id="lists-sidebar-col">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
              <span className="text-[10px] text-slate-400 font-mono tracking-widest font-bold uppercase block">CATEGORIES</span>
              <button onClick={handleAddNewList} className="p-1 hover:bg-[#121a2e] text-indigo-400 hover:text-indigo-300 rounded-lg transition" title="Create New List">
                <Plus className="w-4 h-4 text-indigo-300" />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <button
                onClick={() => {
                  setActiveProjectId('all');
                  setActiveLabelName(null);
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-3 py-2 text-xs rounded-xl flex justify-between items-center transition duration-150 font-bold ${
                  activeProjectId === 'all' && !activeLabelName
                    ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-300 shadow-sm'
                    : 'text-slate-300 hover:bg-[#121a2e]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clipboard className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span>All Tasks</span>
                </div>
                <span className="px-2 py-0.5 bg-[#121a2e] border border-white/[0.04] text-[9.5px] font-mono rounded font-black text-slate-300">
                  {getProjectIncompleteCount('all')}
                </span>
              </button>

              {projects.map((p) => (
                <div key={p.id} className="group relative flex items-center">
                  <button
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setActiveLabelName(null);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 text-left px-3 py-2 text-xs rounded-xl flex justify-between items-center transition duration-150 font-bold truncate ${
                      activeProjectId === p.id && !activeLabelName
                        ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-300'
                        : 'text-slate-300 hover:bg-[#121a2e]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#121a2e] border border-white/[0.04] text-[9.5px] font-mono rounded font-black text-slate-300">
                      {getProjectIncompleteCount(p.id)}
                    </span>
                  </button>

                  {!['proj_work', 'proj_personal', 'proj_creative', 'proj_shopping'].includes(p.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete the list "${p.name}"?`)) {
                          onDeleteProject(p.id);
                        }
                      }}
                      className="absolute right-8 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-[#121a2e] rounded-lg transition"
                      title="Delete List"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-mono tracking-widest font-bold uppercase block">LABELS</span>
            </div>

            <div className="mt-3.5 space-y-1">
              {labels.map((lbl) => (
                <button
                  key={lbl.id}
                  onClick={() => {
                    setActiveLabelName(lbl.name === activeLabelName ? null : lbl.name);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl flex justify-between items-center transition duration-150 font-bold ${
                    activeLabelName === lbl.name
                      ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-300'
                      : 'text-slate-300 hover:bg-[#121a2e]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Bookmark className="w-3 h-3 shrink-0" style={{ color: lbl.color }} />
                    <span className="truncate">@{lbl.name}</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[8.5px] text-slate-400 bg-[#121a2e] rounded font-mono font-bold">
                    {tasks.filter((t) => !t.isArchived && !t.completed && t.labels.includes(lbl.name)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-white/[0.04] text-[10px] text-slate-400 text-center font-mono uppercase tracking-wider">
          🔮 FOCUS ON PROGRESS, NOT PERFECTION.
        </div>
      </div>

      <div className="col-span-1 lg:col-span-9 flex flex-col justify-between" id="tasks-main-column">
        <div>
          <div className="bg-[#0c1221] rounded-2xl border border-white/[0.04] p-4.5 flex flex-col md:flex-row gap-4 justify-between items-center mb-6 shadow-sm" id="filters-header">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['all', 'today', 'upcoming', 'completed'].map((f) => (
                <button
                  key={`pill-filter-${f}`}
                  onClick={() => {
                    setActiveFilter(f);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 font-bold rounded-xl transition duration-150 text-xs capitalize tracking-wide cursor-pointer ${
                    activeFilter === f
                      ? 'bg-indigo-600 text-white shadow shadow-indigo-900/15'
                      : 'bg-[#121a2e] hover:bg-[#16213a] border border-white/[0.04] text-slate-300 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All Tasks' : f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <input
                type="text"
                placeholder="Lookup in list..."
                value={inlineSearch}
                onChange={(e) => {
                  setInlineSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-1.5 text-xs bg-[#121a2e] border border-white/[0.04] focus:border-indigo-500 rounded-xl text-white focus:outline-none w-full md:w-44 font-bold placeholder:text-slate-500 transition-all duration-150"
              />

              <div className="flex bg-[#121a2e] border border-white/[0.04] rounded-xl p-0.5">
                <button
                  onClick={() => setActiveLayout('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${activeLayout === 'list' ? 'bg-[#070b13] text-white' : 'text-slate-400 hover:text-white'}`}
                  title="List Display Layout"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveLayout('board')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${activeLayout === 'board' ? 'bg-[#070b13] text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Kanban Board Layout"
                >
                  <Kanban className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Task Spawner */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!quickTitle.trim()) return;
              onOpenCreate(quickTitle.trim());
              setQuickTitle('');
            }}
            className="bg-[#0c1221] rounded-2xl border border-white/[0.04] p-3 flex items-center gap-3.5 mb-6 group focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/10 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder={
                activeProjectId === 'all'
                  ? "Quick add task to Inbox (Press Enter)..."
                  : `Quick add task to ${selectedProjectObj?.name || 'Category'} (Press Enter)...`
              }
              className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-100 placeholder:text-slate-500 text-xs md:text-sm font-bold min-w-0"
            />

            <div className="flex items-center gap-2.5 shrink-0 select-none">
              {activeProjectId === 'all' ? (
                <span className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-300 text-[10px] font-mono font-bold rounded-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  INBOX
                </span>
              ) : (
                <span
                  style={{
                    backgroundColor: `${selectedProjectObj?.color}15`,
                    borderColor: `${selectedProjectObj?.color}30`,
                    color: selectedProjectObj?.color,
                  }}
                  className="px-2.5 py-1 border text-[10px] font-mono font-bold rounded-lg flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: selectedProjectObj?.color }} />
                  {selectedProjectObj?.name?.toUpperCase()}
                </span>
              )}

              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="px-3.5 py-1.5 text-xs font-bold font-mono tracking-wider rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed shadow-md"
              >
                SPAWN
              </button>
            </div>
          </form>

          {activeLayout === 'list' ? (
            <div className="space-y-6" id="list-tasks-wrapper">
              {totalItems === 0 ? (
                <div className="bg-[#111625] rounded-xl border border-white/5 p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                  <Clipboard className="w-10 h-10 text-indigo-400/40" />
                  <span className="text-sm font-semibold text-white">No synchronized goals found!</span>
                  <span className="text-xs">Adjust your active navigation list categories, or tap &quot;+&quot; inline to spawn reminders.</span>
                </div>
              ) : (
                Object.keys(groupedTasks).map((groupName) => (
                  <div key={`group-${groupName}`} className="space-y-2">
                    <h4 className="text-xs font-black font-display text-slate-400 uppercase tracking-widest pl-1">
                      {groupName} ({groupedTasks[groupName].length})
                    </h4>

                    <div className="space-y-2">
                      {groupedTasks[groupName].map((task) => {
                        if (task.isContest) {
                          return (
                            <div
                              key={`task-list-card-${task.id}`}
                              className={`px-4 py-3 border border-l-4 hover:brightness-125 rounded-xl shadow-sm flex items-center justify-between select-none cursor-pointer transition gap-3 ${getPlatformClass(task.contestPlatform)}`}
                              onClick={() => onSelectTask(task.id)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-base shrink-0 leading-none">🏆</span>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-black leading-tight block truncate font-display">{task.title}</span>
                                  {task.description && <p className="text-[10px] opacity-80 truncate mt-0.5 leading-snug">{task.description}</p>}
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 items-center text-[9px] font-black mt-1 opacity-80">
                                    <span className={`px-1 rounded border capitalize ${getPlatformClass(task.contestPlatform)}`}>{task.contestPlatform}</span>
                                    <span>🕒 {task.contestTime}</span>
                                    <span>⏳ {task.contestDuration}</span>
                                  </div>
                                </div>
                              </div>

                              {getFeedItemUrl(task) && (
                                <a
                                  href={getFeedItemUrl(task)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 border border-white/20 hover:border-white/40 text-[10px] font-black rounded-lg flex items-center gap-1 transition"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link className="w-3 h-3" />
                                  <span>Open</span>
                                </a>
                              )}
                            </div>
                          );
                        }

                        if (task.feedCategory === 'event') {
                          return (
                            <div
                              key={`task-list-card-${task.id}`}
                              className="px-4 py-3 border border-emerald-500/30 hover:brightness-125 rounded-xl shadow-sm flex items-center justify-between select-none cursor-pointer transition gap-3 bg-emerald-500/10 text-white"
                              onClick={() => onSelectTask(task.id)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-base shrink-0 leading-none">📣</span>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-black leading-tight block truncate font-display text-emerald-300">{task.title}</span>
                                  {task.description && <p className="text-[10px] opacity-80 truncate mt-0.5 leading-snug">{task.description}</p>}
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 items-center text-[9px] font-black mt-1 opacity-80">
                                    <span className="px-1.5 py-0.5 rounded border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">📣 EVENT</span>
                                    {task.time && <span>🕒 {task.time}</span>}
                                  </div>
                                </div>
                              </div>

                              {getFeedItemUrl(task) && (
                                <a
                                  href={getFeedItemUrl(task)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-lg flex items-center gap-1 transition"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link className="w-3 h-3" />
                                  <span>Open</span>
                                </a>
                              )}
                            </div>
                          );
                        }

                        if (task.feedCategory === 'task') {
                          return (
                            <div
                              key={`task-list-card-${task.id}`}
                              className="px-4 py-3 border border-indigo-500/30 hover:brightness-125 rounded-xl shadow-sm flex items-center justify-between select-none cursor-pointer transition gap-3 bg-indigo-500/10 text-white"
                              onClick={() => onSelectTask(task.id)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-base shrink-0 leading-none">📅</span>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-black leading-tight block truncate font-display text-indigo-300">{task.title}</span>
                                  {task.description && <p className="text-[10px] opacity-80 truncate mt-0.5 leading-snug">{task.description}</p>}
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 items-center text-[9px] font-black mt-1 opacity-80">
                                    <span className="px-1.5 py-0.5 rounded border border-indigo-500/25 bg-indigo-500/10 text-indigo-400">📅 DEADLINE</span>
                                    {task.bootcampTitle && <span>{task.bootcampTitle}</span>}
                                    {task.time && <span>🕒 {task.time}</span>}
                                  </div>
                                </div>
                              </div>

                              {getFeedItemUrl(task) && (
                                <a
                                  href={getFeedItemUrl(task)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black rounded-lg flex items-center gap-1 transition"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link className="w-3 h-3" />
                                  <span>Open</span>
                                </a>
                              )}
                            </div>
                          );
                        }

                        if (task.feedCategory === 'session') {
                          return (
                            <div
                              key={`task-list-card-${task.id}`}
                              className="px-4 py-3 border border-sky-500/30 hover:brightness-125 rounded-xl shadow-sm flex items-center justify-between select-none cursor-pointer transition gap-3 bg-sky-500/10 text-white"
                              onClick={() => onSelectTask(task.id)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-base shrink-0 leading-none">🎓</span>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-black leading-tight block truncate font-display text-sky-300">{task.title}</span>
                                  {task.description && <p className="text-[10px] opacity-80 truncate mt-0.5 leading-snug">{task.description}</p>}
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 items-center text-[9px] font-black mt-1 opacity-80">
                                    <span className="px-1.5 py-0.5 rounded border border-sky-500/25 bg-sky-500/10 text-sky-400">🎓 SESSION</span>
                                    {task.bootcampTitle && <span>{task.bootcampTitle}</span>}
                                    {task.time && <span>🕒 {task.time}</span>}
                                  </div>
                                </div>
                              </div>

                              {getFeedItemUrl(task) && (
                                <a
                                  href={getFeedItemUrl(task)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10px] font-black rounded-lg flex items-center gap-1 transition"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link className="w-3 h-3" />
                                  <span>Open</span>
                                </a>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`task-list-card-${task.id}`}
                            onClick={() => onSelectTask(task.id)}
                            className={`flex items-center justify-between p-3.5 bg-[#0e1424] border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#121930] rounded-xl transition cursor-pointer select-none gap-3 group relative ${task.completed ? 'opacity-40' : ''} ${getPriorityBorderClass(task.priority)}`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleComplete(task.id);
                                }}
                                className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                  task.completed
                                    ? 'bg-indigo-600 border-indigo-400 text-white'
                                    : 'border-white/20 hover:border-indigo-400 text-transparent hover:bg-indigo-500/10'
                                }`}
                              >
                                {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              <div className="min-w-0 flex-1">
                                <span className={`text-xs font-bold leading-relaxed block truncate ${task.completed ? 'line-through text-slate-500 font-medium' : 'text-slate-100'}`}>
                                  {task.title}
                                </span>
                                {task.description && <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-snug">{task.description}</p>}
                                {((task.labels && task.labels.length > 0) || task.time) && (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    {task.time && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[8.5px] font-black flex items-center gap-1 shrink-0">
                                        <Clock className="w-2.5 h-2.5 text-indigo-400" />
                                        <span>{task.time}</span>
                                      </span>
                                    )}
                                    {task.labels && task.labels.map((lbl) => (
                                      <span key={lbl} className="px-1.5 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.04] text-slate-400 font-mono text-[8.5px] font-semibold flex items-center gap-0.5 shrink-0">
                                        <Tag className="w-2 h-2 text-slate-500" />
                                        <span>{lbl}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {task.priority === Priority.P1 && (
                                <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-mono font-bold rounded-lg block shrink-0">HIGH</span>
                              )}
                              {task.priority === Priority.P2 && (
                                <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono font-bold rounded-lg block shrink-0">MEDIUM</span>
                              )}
                              {task.priority === Priority.P3 && (
                                <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-mono font-bold rounded-lg block shrink-0">LOW</span>
                              )}

                              {task.projectId !== 'all' && (
                                <span className="px-1.5 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[9px] font-mono font-bold rounded-lg block shrink-0 max-w-[50px] truncate">
                                  {projects.find((p) => p.id === task.projectId)?.name.toUpperCase() || 'LIST'}
                                </span>
                              )}

                              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition shrink-0" />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this task?')) {
                                  onDeleteTask(task.id);
                                }
                              }}
                              className="absolute right-8 top-1/2 -translate-y-1/2 p-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-md transition opacity-0 group-hover:opacity-100 shadow"
                              title="Delete Task"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto pb-4" id="board-layout-wrapper">
              <div className="flex gap-4 min-w-[800px]">
                <div className="bg-[#111625]/40 border border-white/5 rounded-xl p-4 w-72 shrink-0 flex flex-col h-[500px]">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Inbox Column</span>
                    <span className="px-2 py-0.5 bg-[#182032] text-[10px] text-indigo-400 font-mono font-bold rounded-full">
                      {paginatedTasks.filter((t) => !t.sectionId).length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {paginatedTasks
                      .filter((t) => !t.sectionId)
                      .map((t) => renderKanbanCard(t))}
                  </div>

                  <button
                    onClick={() => {
                      const title = prompt('Enter task for inbox column:');
                      if (title && title.trim()) {
                        onAddTask({
                          title: title.trim(),
                          description: '',
                          priority: Priority.P3,
                          projectId: activeProjectId === 'all' ? projects[0]?.id || 'proj_personal' : activeProjectId,
                          labels: ['Personal'],
                        });
                      }
                    }}
                    className="w-full mt-2.5 py-1.5 bg-[#182032] hover:bg-[#1c263c] text-slate-300 hover:text-white text-[11px] font-bold rounded-lg border border-dashed border-white/10 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD ITEM</span>
                  </button>
                </div>

                {activeSections.map((sec) => {
                  const secTasks = paginatedTasks.filter((t) => t.sectionId === sec.id);

                  return (
                    <div key={`section-col-${sec.id}`} className="bg-[#111625]/40 border border-white/5 rounded-xl p-4 w-72 shrink-0 flex flex-col h-[500px] relative group/col">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-display truncate max-w-[160px]">{sec.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-[#182032] text-[10px] text-indigo-400 font-mono font-bold rounded-full mr-1">{secTasks.length}</span>

                          <button
                            onClick={() => {
                              const newName = prompt('Enter a new name for the section column:', sec.name);
                              if (newName && newName.trim()) {
                                onUpdateSection(sec.id, newName.trim());
                              }
                            }}
                            className="p-1 opacity-0 group-hover/col:opacity-100 hover:bg-[#182032] text-slate-400 rounded cursor-pointer transition"
                            title="Rename Section"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this column? Tasks inside will return to general area.')) {
                                onDeleteSection(sec.id);
                              }
                            }}
                            className="p-1 opacity-0 group-hover/col:opacity-100 hover:bg-[#182032] text-red-400 rounded cursor-pointer transition"
                            title="Delete Column"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {secTasks.map((t) => renderKanbanCard(t))}
                      </div>

                      <button
                        onClick={() => {
                          const title = prompt(`Enter task for column "${sec.name}":`);
                          if (title && title.trim()) {
                            onAddTask({
                              title: title.trim(),
                              description: '',
                              priority: Priority.P3,
                              projectId: activeProjectId,
                              sectionId: sec.id,
                              labels: ['Personal'],
                            });
                          }
                        }}
                        className="w-full mt-2.5 py-1.5 bg-[#182032] hover:bg-[#1c263c] text-slate-300 hover:text-white text-[11px] font-bold rounded-lg border border-dashed border-white/10 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD ITEM</span>
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={handleAddNewSection}
                  className="bg-[#111625]/20 hover:bg-[#111625]/40 border border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 w-72 shrink-0 h-[500px] flex flex-col justify-center items-center text-slate-400 hover:text-indigo-400 cursor-pointer transition gap-2 font-mono font-bold text-xs"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                  <span>ADD COLUMN</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#111625] rounded-xl border border-white/5 p-4 flex flex-col md:flex-row gap-4 justify-between items-center text-xs text-slate-300 mt-6" id="pagination-footer">
          <div>
            <span>Showing </span>
            <span className="font-bold text-white">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>
            <span> - </span>
            <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
            <span> of </span>
            <span className="font-bold text-indigo-400">{totalItems} items</span>
            {activeProjectId !== 'all' && (
              <span> in <strong className="text-white">#{selectedProjectObj?.name}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-slate-400 tracking-wider">PAGE {currentPage} OF {totalPages}</span>
            <div className="flex border border-white/5 rounded-lg bg-[#182032] p-0.5">
              <button
                disabled={currentPage === 1}
                onClick={prevPage}
                className="p-1 px-2 hover:bg-[#0b0f19] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded cursor-pointer transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-white/5" />
              <button
                disabled={currentPage === totalPages}
                onClick={nextPage}
                className="p-1 px-2 hover:bg-[#0b0f19] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded cursor-pointer transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
