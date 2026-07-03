/**
 * @file Tasks tab for Daily Activity — the working task list. A left rail
 *   filters by project (space category) and label; the main column offers
 *   all/today/upcoming/completed pills, an inline search, a quick-add box,
 *   and two layouts: a date-grouped list and a kanban board (Inbox column
 *   plus per-section columns). Editable todos render with priority accent,
 *   complete/delete controls; read-only feed items render via
 *   {@link FeedItemCard}. Paginated at 15 items.
 *
 * @module daily-activity/TasksView
 */

'use client';

import { useState } from 'react';
import {
  Plus, List, Kanban, Check, Tag, Bookmark, ChevronRight, ArrowLeft, ArrowRight, Trash2, Edit2, Trash, Clipboard, Clock,
} from 'lucide-react';
import {
  Priority, isTaskOnDate, isTaskInDateRange, getFeedMeta,
  getTodayDateString, formatDateString, addDays,
} from './utils';
import FeedItemCard from './FeedItemCard';
import TodoistPanel from './TodoistPanel';

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
  onToast,
  onSynced,
}) {
  const [activeProjectId, setActiveProjectId] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeLayout, setActiveLayout] = useState('list');
  const [activeLabelName, setActiveLabelName] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [inlineSearch, setInlineSearch] = useState('');
  const [quickTitle, setQuickTitle] = useState('');

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
    const feedMeta = getFeedMeta(t);

    if (feedMeta) {
      return (
        <div
          key={`kanban-task-${t.id}`}
          onClick={() => onSelectTask(t.id)}
          className={`group relative cursor-pointer space-y-2 rounded-lg border p-3 transition select-none hover:brightness-110 ${feedMeta.accent}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1">
                <span className="text-[10px]">{feedMeta.emoji}</span>
                <span className="text-[9px] font-bold tracking-wider opacity-80">{feedMeta.label.toUpperCase()}</span>
              </div>
              <span className={`block truncate text-xs font-bold leading-snug ${feedMeta.title}`}>{t.title}</span>
            </div>
          </div>
          {t.description && <p className="line-clamp-2 text-[10px] leading-relaxed text-gray-400">{t.description}</p>}
        </div>
      );
    }

    return (
      <div
        key={`kanban-task-${t.id}`}
        onClick={() => onSelectTask(t.id)}
        className="group relative space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition cursor-pointer select-none hover:border-violet-400/30"
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
      <div className="relative bg-gray-900 rounded-3xl border border-white/[0.08] p-5 col-span-1 lg:col-span-3 h-full flex flex-col justify-between shadow-2xl shadow-slate-950/20 overflow-hidden" id="lists-sidebar-col">
        <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/[0.06] blur-[80px]" />
        <div className="relative z-10 space-y-6">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
              <span className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300 font-mono tracking-wider uppercase block font-black">CATEGORIES</span>
              <button onClick={handleAddNewList} className="p-1 hover:bg-white/[0.06] text-violet-400 hover:text-violet-300 rounded-lg transition" title="Create New List">
                <Plus className="w-4 h-4 text-violet-300" />
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
                    ? 'bg-violet-600/15 border border-violet-500/25 text-violet-300 shadow-sm'
                    : 'text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clipboard className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span>All Tasks</span>
                </div>
                <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.04] text-[9.5px] font-mono rounded font-black text-slate-300">
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
                        ? 'bg-violet-600/15 border border-violet-500/25 text-violet-300'
                        : 'text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.04] text-[9.5px] font-mono rounded font-black text-slate-300">
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
                      className="absolute right-8 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-white/[0.06] rounded-lg transition"
                      title="Delete List"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {labels.some((lbl) => lbl.name === activeLabelName || tasks.some((t) => !t.isArchived && !t.completed && t.labels?.includes(lbl.name))) && (
            <div>
              <div className="flex items-center gap-1.5 pb-3 border-b border-white/[0.06]">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 font-mono tracking-wider uppercase block font-black">LABELS</span>
              </div>

              <div className="mt-3.5 space-y-1">
                {labels
                  .filter((lbl) => lbl.name === activeLabelName || tasks.some((t) => !t.isArchived && !t.completed && t.labels?.includes(lbl.name)))
                  .map((lbl) => {
                    const count = tasks.filter((t) => !t.isArchived && !t.completed && t.labels?.includes(lbl.name)).length;
                    return (
                      <button
                        key={lbl.id}
                        onClick={() => {
                          setActiveLabelName(lbl.name === activeLabelName ? null : lbl.name);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl flex justify-between items-center transition duration-150 font-bold ${
                          activeLabelName === lbl.name
                            ? 'bg-violet-600/15 border border-violet-500/25 text-violet-300'
                            : 'text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Bookmark className="w-3 h-3 shrink-0" style={{ color: lbl.color }} />
                          <span className="truncate">@{lbl.name}</span>
                        </div>
                        <span className="px-1.5 py-0.5 text-[8.5px] text-slate-400 bg-white/[0.04] rounded font-mono font-bold">
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <TodoistPanel monthTasks={tasks} onToast={onToast} onSynced={onSynced} />
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-white/[0.06] text-[10px] text-slate-400 text-center font-mono uppercase tracking-wider flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400/80 to-slate-400 font-black">FOCUS ON PROGRESS, NOT PERFECTION.</span>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-9 flex flex-col justify-between" id="tasks-main-column">
        <div>
          <div className="relative bg-gray-900 rounded-3xl border border-white/[0.08] p-5 flex flex-col md:flex-row gap-4 justify-between items-center mb-6 shadow-xl shadow-slate-950/10 overflow-hidden" id="filters-header">
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-violet-500/[0.04] blur-[60px]" />
            <div className="relative z-10 flex flex-wrap gap-1.5 text-xs">
              {['all', 'today', 'upcoming', 'completed'].map((f) => (
                <button
                  key={`pill-filter-${f}`}
                  onClick={() => {
                    setActiveFilter(f);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 font-bold rounded-xl transition duration-150 text-xs capitalize tracking-wide cursor-pointer ${
                    activeFilter === f
                      ? 'bg-violet-600 text-white shadow shadow-violet-900/15'
                      : 'bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.04] text-slate-300 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All Tasks' : f}
                </button>
              ))}
            </div>

            <div className="relative z-10 flex items-center gap-3 w-full md:w-auto justify-end">
              <input
                type="text"
                placeholder="Lookup in list..."
                value={inlineSearch}
                onChange={(e) => {
                  setInlineSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-1.5 text-xs bg-white/[0.04] border border-white/[0.04] focus:border-violet-500 rounded-xl text-white focus:outline-none w-full md:w-44 font-bold placeholder:text-slate-500 transition-all duration-150"
              />

              <div className="flex bg-white/[0.04] border border-white/[0.04] rounded-xl p-0.5">
                <button
                  onClick={() => setActiveLayout('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${activeLayout === 'list' ? 'bg-gray-900 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="List Display Layout"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveLayout('board')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${activeLayout === 'board' ? 'bg-gray-900 text-white' : 'text-slate-400 hover:text-white'}`}
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
            className="relative bg-gray-900 rounded-3xl border border-white/[0.08] p-3.5 flex items-center gap-3.5 mb-6 group focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/10 transition-all duration-200 shadow-lg shadow-slate-950/10 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
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
                className="px-3.5 py-1.5 text-xs font-bold font-mono tracking-wider rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:hover:bg-violet-600 disabled:cursor-not-allowed shadow-md"
              >
                SPAWN
              </button>
            </div>
          </form>

          {activeLayout === 'list' ? (
            <div className="space-y-6" id="list-tasks-wrapper">
              {totalItems === 0 ? (
                <div className="relative bg-gray-900 rounded-3xl border border-white/[0.08] p-14 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 shadow-xl overflow-hidden">
                  <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-500/[0.06] blur-[60px]" />
                  <div className="relative z-10 p-3.5 bg-gradient-to-br from-violet-500/10 to-slate-900 border border-violet-500/10 rounded-2xl text-violet-400/50 mb-1">
                    <Clipboard className="w-8 h-8" />
                  </div>
                  <span className="relative z-10 text-sm font-bold text-white">No synchronized goals found!</span>
                  <span className="relative z-10 text-xs text-slate-500">Adjust your active navigation list categories, or tap &quot;+&quot; inline to spawn reminders.</span>
                </div>
              ) : (
                Object.keys(groupedTasks).map((groupName) => (
                  <div key={`group-${groupName}`} className="space-y-2.5">
                    <div className="flex items-center gap-2 pl-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <h4 className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-slate-300 uppercase tracking-widest font-mono">
                        {groupName} ({groupedTasks[groupName].length})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {groupedTasks[groupName].map((task) => {
                        if (getFeedMeta(task)) {
                          return (
                            <FeedItemCard
                              key={`task-list-card-${task.id}`}
                              task={task}
                              variant="row"
                              onSelect={onSelectTask}
                            />
                          );
                        }

                        return (
                          <div
                            key={`task-list-card-${task.id}`}
                            onClick={() => onSelectTask(task.id)}
                            className={`flex items-center justify-between p-3.5 bg-gray-900 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] rounded-2xl transition-all duration-200 cursor-pointer select-none gap-3 group relative ${task.completed ? 'opacity-40' : ''} ${getPriorityBorderClass(task.priority)}`}
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
                                    ? 'bg-violet-600 border-violet-400 text-white'
                                    : 'border-white/20 hover:border-violet-400 text-transparent hover:bg-violet-500/10'
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
                                      <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono text-[8.5px] font-black flex items-center gap-1 shrink-0">
                                        <Clock className="w-2.5 h-2.5 text-violet-400" />
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
                                <span className="px-1.5 py-0.5 bg-violet-500/15 border border-violet-500/30 text-violet-400 text-[9px] font-mono font-bold rounded-lg block shrink-0 max-w-[50px] truncate">
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
              <div className="flex gap-5 min-w-[800px]">
                <div className="bg-gray-900/60 border border-white/[0.08] rounded-3xl p-5 w-72 shrink-0 flex flex-col h-[500px] shadow-xl shadow-slate-950/10">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Inbox Column</span>
                    <span className="px-2 py-0.5 bg-white/[0.04] text-[10px] text-violet-400 font-mono font-bold rounded-full">
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
                    className="w-full mt-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] text-slate-300 hover:text-white text-[11px] font-bold rounded-lg border border-dashed border-white/10 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD ITEM</span>
                  </button>
                </div>

                {activeSections.map((sec) => {
                  const secTasks = paginatedTasks.filter((t) => t.sectionId === sec.id);

                  return (
                    <div key={`section-col-${sec.id}`} className="bg-gray-900/60 border border-white/[0.08] rounded-3xl p-5 w-72 shrink-0 flex flex-col h-[500px] relative group/col shadow-xl shadow-slate-950/10">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-display truncate max-w-[160px]">{sec.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-white/[0.04] text-[10px] text-violet-400 font-mono font-bold rounded-full mr-1">{secTasks.length}</span>

                          <button
                            onClick={() => {
                              const newName = prompt('Enter a new name for the section column:', sec.name);
                              if (newName && newName.trim()) {
                                onUpdateSection(sec.id, newName.trim());
                              }
                            }}
                            className="p-1 opacity-0 group-hover/col:opacity-100 hover:bg-white/[0.06] text-slate-400 rounded cursor-pointer transition"
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
                            className="p-1 opacity-0 group-hover/col:opacity-100 hover:bg-white/[0.06] text-red-400 rounded cursor-pointer transition"
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
                        className="w-full mt-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] text-slate-300 hover:text-white text-[11px] font-bold rounded-lg border border-dashed border-white/10 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD ITEM</span>
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={handleAddNewSection}
                  className="bg-gray-900/20 hover:bg-white/[0.04] border border-dashed border-white/10 hover:border-violet-500/30 rounded-3xl p-4 w-72 shrink-0 h-[500px] flex flex-col justify-center items-center text-slate-400 hover:text-violet-400 cursor-pointer transition-all duration-200 gap-2 font-mono font-bold text-xs"
                >
                  <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-violet-400 mb-1">
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </div>
                  <span className="text-[10px] tracking-widest">ADD COLUMN</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-3xl border border-white/[0.08] p-5 flex flex-col md:flex-row gap-4 justify-between items-center text-xs text-slate-300 mt-6 shadow-lg shadow-slate-950/10" id="pagination-footer">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span className="font-mono text-[10px] tracking-wider">Showing </span>
            <span className="font-bold text-white">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>
            <span className="font-mono text-[10px]"> – </span>
            <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
            <span className="font-mono text-[10px]"> of </span>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">{totalItems} items</span>
            {activeProjectId !== 'all' && (
              <span className="font-mono text-[10px]"> in <strong className="text-white">#{selectedProjectObj?.name}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-slate-500 tracking-widest font-black uppercase">PAGE {currentPage} OF {totalPages}</span>
            <div className="flex border border-white/[0.08] rounded-xl bg-slate-900/60 p-1 shadow-inner">
              <button
                disabled={currentPage === 1}
                onClick={prevPage}
                className="p-1.5 px-2.5 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded-lg cursor-pointer transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-5 bg-white/[0.06] my-auto" />
              <button
                disabled={currentPage === totalPages}
                onClick={nextPage}
                className="p-1.5 px-2.5 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded-lg cursor-pointer transition"
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
