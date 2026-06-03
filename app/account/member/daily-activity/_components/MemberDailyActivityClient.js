/**
 * @file Root client for the member Daily Activity page — a Todoist-style
 *   planner backed by Supabase. Loads the member's todos plus a read-only
 *   activity feed (events, contests, bootcamp sessions/deadlines, Google
 *   Calendar) and presents three tabs:
 *
 *     • Insights  — productivity standing, focus tasks, completion heatmap,
 *                   and velocity chart (InsightsView).
 *     • Tasks     — list / kanban board of editable todos with filters,
 *                   labels, sections, and pagination (TasksView).
 *     • Calendar  — month grid + weekly agenda with layer filters and an
 *                   inline add-task workbench (CalendarView).
 *
 *   Data flow: each piece of state maps to one API route —
 *     todos    → /api/member/daily-activity/todos     (CRUD, editable)
 *     feed     → /api/member/daily-activity/feed       (read-only)
 *     projects → /api/member/daily-activity/projects
 *     sections → /api/member/daily-activity/sections
 *     labels   → /api/member/daily-activity/labels
 *   Karma (XP / rank) is computed client-side from completed todos and is
 *   not persisted. Feed items are never editable.
 *
 * @module daily-activity/MemberDailyActivityClient
 */

'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Search, X, ChevronRight, TrendingUp, Activity, Info, RotateCcw,
  CheckCircle2, Calendar, Target, Award, ShieldAlert, CalendarDays, ListChecks,
} from 'lucide-react';

import {
  PageShell,
  PageHeader,
  StatCard,
  TabBar,
} from '@/app/account/_components/ui';
import { StatGrid } from '@/app/account/_components/ui/StatCard';

import {
  getTodayDateString,
  formatDateString,
  addDays,
  generateId,
  getKarmaLevel,
  isFeedItem,
} from './utils';

import InsightsView from './InsightsView';
import CalendarView from './CalendarView';
import TasksView from './TasksView';
import TaskDetailPane from './TaskDetailPane';
import ProductivityModal from './ProductivityModal';
import GoogleItemPane from './GoogleItemPane';

export default function MemberDailyActivityClient({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Client-side computed Karma state
  const [karma, setKarma] = useState({
    score: 100,
    level: 'Novice',
    dailyGoal: 5,
    weeklyGoal: 25,
    dailyStreak: 0,
    weeklyStreak: 0,
    history: [],
  });

  const [activeTab, setActiveTab] = useState('insights');
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [showProductivityModal, setShowProductivityModal] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showCreatePane, setShowCreatePane] = useState(false);
  const [createPrefillTitle, setCreatePrefillTitle] = useState('');
  const [createPrefillDate, setCreatePrefillDate] = useState(null);

  // Google item pane: { item, mode } where mode is 'view'|'create-event'
  const [googlePane, setGooglePane] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [toast, setToast] = useState(null);

  const todayStr = getTodayDateString();

  // Load all user data on mount
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [todosRes, projRes, labelsRes, secRes, feedRes] = await Promise.all([
          fetch('/api/member/daily-activity/todos'),
          fetch('/api/member/daily-activity/projects'),
          fetch('/api/member/daily-activity/labels'),
          fetch('/api/member/daily-activity/sections'),
          fetch('/api/member/daily-activity/feed'),
        ]);

        const [todosData, projData, labelsData, secData, feedData] = await Promise.all([
          todosRes.json(),
          projRes.json(),
          labelsRes.json(),
          secRes.json(),
          feedRes.json(),
        ]);

        // Combine user todos with the read-only activity feed (events,
        // contests, bootcamp sessions, deadlines, Google Calendar)
        const allTasks = [...(todosData || []), ...(feedData || [])];
        setTasks(allTasks);

        // Standardize list of projects/space categories
        setProjects(projData || []);
        setLabels(labelsData || []);
        setSections(secData || []);

        // Compute client Karma from completed tasks history
        const completedTasks = allTasks.filter(t => t.completed && t.completedAt);
        const score = 100 + (completedTasks.length * 10);
        const levelName = getKarmaLevel(score).level;

        // Group past 7 days completion
        const historyMap = {};
        for (let i = 4; i >= 1; i--) {
          const dStr = formatDateString(addDays(new Date(), -i));
          historyMap[dStr] = 0;
        }
        completedTasks.forEach(t => {
          const dStr = t.completedAt.substring(0, 10);
          if (historyMap[dStr] !== undefined) {
            historyMap[dStr]++;
          }
        });

        const history = Object.keys(historyMap).map(date => ({
          date,
          completedCount: historyMap[date],
        }));

        setKarma(curr => ({
          ...curr,
          score,
          level: levelName,
          history,
        }));
      } catch (err) {
        console.error('Failed to initialize Daily Activity data:', err);
        showToast('Error loading server data.', 'error');
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  const showToast = (text, type = 'info', actionLabel, onAction) => {
    const id = generateId();
    setToast({ id, text, type, actionLabel, onAction });
    setTimeout(() => {
      setToast((curr) => (curr && curr.id === id ? null : curr));
    }, 5500);
  };

  // Re-pull todos + feed (e.g. after a two-way Google sync changed completion
  // state server-side) and merge them back into the combined task list.
  const refreshTasks = async () => {
    try {
      const [todosRes, feedRes] = await Promise.all([
        fetch('/api/member/daily-activity/todos'),
        fetch('/api/member/daily-activity/feed'),
      ]);
      const [todosData, feedData] = await Promise.all([todosRes.json(), feedRes.json()]);
      setTasks([...(todosData || []), ...(feedData || [])]);
    } catch (err) {
      console.error('refreshTasks:', err);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      const response = await fetch('/api/member/daily-activity/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) throw new Error('Create failed');
      const createdTask = await response.json();

      setTasks((curr) => [createdTask, ...curr]);
      showToast('Goal spawned and stored.', 'success');

      // Create new labels if they weren't in catalog
      const newLabelsToRegister = (taskData.labels || []).filter(
        (lName) => !labels.some((l) => l.name.toLowerCase() === lName.toLowerCase())
      );

      if (newLabelsToRegister.length > 0) {
        for (const name of newLabelsToRegister) {
          const lblRes = await fetch('/api/member/daily-activity/labels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color: '#64748b' }),
          });
          if (lblRes.ok) {
            const newLabel = await lblRes.json();
            setLabels((curr) => [...curr, newLabel]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to add goal.', 'error');
      throw err;
    }
  };

  const isReadOnlyTask = (taskId) => {
    const t = tasks.find((x) => x.id === taskId);
    return isFeedItem(t);
  };

  const handleDeleteTask = async (taskId) => {
    if (isReadOnlyTask(taskId)) {
      showToast('Cannot delete read-only activity items.', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/member/daily-activity/todos?id=${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');

      setTasks((curr) => curr.filter((t) => t.id !== taskId));
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
      showToast('Goal deleted from DB.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete goal.', 'error');
    }
  };

  const handleUpdateTask = async (taskId, updatedFields) => {
    if (isReadOnlyTask(taskId)) {
      showToast('Cannot modify read-only activity items.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/member/daily-activity/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, ...updatedFields }),
      });
      if (!response.ok) throw new Error('Update failed');
      const updated = await response.json();

      setTasks((curr) => curr.map((t) => (t.id === taskId ? updated : t)));
      showToast('Goal updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update task.', 'error');
      throw err;
    }
  };

  const handleToggleComplete = async (taskId) => {
    if (isReadOnlyTask(taskId)) {
      showToast('Activity items cannot be completed here.', 'error');
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const nextCompleted = !task.completed;

    try {
      const response = await fetch('/api/member/daily-activity/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, completed: nextCompleted }),
      });

      if (!response.ok) throw new Error('Failed to toggle completion');
      const updated = await response.json();

      setTasks((curr) => curr.map((t) => (t.id === taskId ? updated : t)));

      // XP modifications (+10 on complete, -10 on reopen)
      const updatedScore = Math.max(0, karma.score + (nextCompleted ? 10 : -10));
      const levelName = getKarmaLevel(updatedScore).level;

      setKarma((curr) => ({ ...curr, score: updatedScore, level: levelName }));

      showToast(
        nextCompleted ? `Task complete! +10 XP earned.` : 'Task reopened. -10 XP.',
        nextCompleted ? 'success' : 'info'
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to toggle completion status.', 'error');
    }
  };

  const handleAddProject = async (name, color, isFavorite) => {
    try {
      const response = await fetch('/api/member/daily-activity/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
      if (!response.ok) throw new Error('Failed to create project');
      const newProj = await response.json();

      setProjects((curr) => [...curr, newProj]);
      showToast(`Category "${name}" created.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create category.', 'error');
    }
  };

  const handleDeleteProject = async (projId) => {
    try {
      const response = await fetch(`/api/member/daily-activity/projects?id=${projId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');

      setProjects((curr) => curr.filter((p) => p.id !== projId));
      setTasks((curr) => curr.filter((t) => t.projectId !== projId));
      setSections((curr) => curr.filter((s) => s.projectId !== projId));
      showToast(`Category deleted.`, 'error');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete category.', 'error');
    }
  };

  const handleAddSection = async (projectId, name) => {
    try {
      const response = await fetch('/api/member/daily-activity/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name }),
      });
      if (!response.ok) throw new Error('Failed to create section');
      const newSec = await response.json();

      setSections((curr) => [...curr, newSec]);
      showToast(`Section "${name}" added.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to add section.', 'error');
    }
  };

  const handleDeleteSection = async (secId) => {
    try {
      const response = await fetch(`/api/member/daily-activity/sections?id=${secId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');

      setSections((curr) => curr.filter((s) => s.id !== secId));
      setTasks((curr) => curr.map((t) => (t.sectionId === secId ? { ...t, sectionId: undefined } : t)));
    } catch (err) {
      console.error(err);
      showToast('Failed to delete section.', 'error');
    }
  };

  const handleUpdateSection = async (secId, name) => {
    try {
      const response = await fetch('/api/member/daily-activity/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: secId, name }),
      });
      if (!response.ok) throw new Error('Update failed');
      const updated = await response.json();

      setSections((curr) => curr.map((s) => (s.id === secId ? updated : s)));
    } catch (err) {
      console.error(err);
      showToast('Failed to update section.', 'error');
    }
  };

  const handleUpdateKarmaGoals = (newDailyGoal, newWeeklyGoal) => {
    setKarma((curr) => ({ ...curr, dailyGoal: newDailyGoal, weeklyGoal: newWeeklyGoal }));
    showToast('Goals updated.', 'success');
  };

  const getSearchSuggestions = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        !t.isArchived &&
        (t.title.toLowerCase().includes(query) ||
          (t.description || '').toLowerCase().includes(query) ||
          (t.labels || []).some((l) => l.toLowerCase().includes(query)))
    );
  };

  const searchResults = getSearchSuggestions();

  const handleSearchItemSelect = (t) => {
    setSelectedTaskId(t.id);
    setShowSearchOverlay(false);
    setSearchQuery('');
  };

  const openCreatePane = (prefillTitle = '', prefillDate = null) => {
    setCreatePrefillTitle(prefillTitle);
    setCreatePrefillDate(prefillDate);
    setSelectedTaskId(null);
    setShowCreatePane(true);
  };

  const handleSelectTask = (taskId) => {
    const t = tasks.find((x) => x.id === taskId);
    if (t?.feedCategory === 'personal') {
      setSelectedTaskId(null);
      setGooglePane({ item: t, mode: 'edit-personal' });
    } else {
      setGooglePane(null);
      setSelectedTaskId(taskId);
    }
  };

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || null;

  const dueTodayCount = tasks.filter(
    (t) => !t.isArchived && !t.completed && (t.dueDate === todayStr || (t.dueDate && t.dueDate < todayStr))
  ).length;
  const scheduledTodayCount = tasks.filter((t) => !t.isArchived && t.dueDate === todayStr).length;

  const completedTodayCount = tasks.filter(
    (t) => !t.isArchived && t.completed && t.completedAt && t.completedAt.substring(0, 10) === todayStr
  ).length;
  const todayGoalPercent = scheduledTodayCount > 0 ? Math.round((completedTodayCount / scheduledTodayCount) * 100) : 0;

  const d7LimitStr = formatDateString(addDays(new Date(), 7));
  const next7DaysCount = tasks.filter(
    (t) => !t.isArchived && !t.completed && t.dueDate && t.dueDate > todayStr && t.dueDate <= d7LimitStr
  ).length;

  const overdueCount = tasks.filter((t) => !t.isArchived && !t.completed && t.dueDate && t.dueDate < todayStr).length;

  const tabs = [
    { value: 'insights', label: 'Insights', icon: TrendingUp },
    { value: 'tasks', label: 'Tasks', icon: ListChecks },
    { value: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Loading your activity…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="select-none text-gray-100 animate-fadeIn" id="main-frame">
      <PageShell>
        <PageHeader
          icon={Activity}
          accent="violet"
          title="Daily Activity"
          subtitle={`Plan your day, track your goals, and keep your streak alive · ${todayStr}`}
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openCreatePane()}
                className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-600/10 hover:scale-[1.01]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New goal</span>
              </button>
              <button
                type="button"
                onClick={() => setShowProductivityModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
              >
                <Award className="h-3.5 w-3.5" />
                {karma.score} XP · {karma.level}
              </button>
            </div>
          }
        />

        <StatGrid cols={4}>
          <StatCard
            icon={Target}
            accent="blue"
            label="Due Today"
            value={dueTodayCount}
            sublabel={`${scheduledTodayCount} scheduled`}
          />
          <StatCard
            icon={CheckCircle2}
            accent="emerald"
            label="Done Today"
            value={completedTodayCount}
            sublabel={`${todayGoalPercent}% complete`}
            delay={0.05}
          />
          <StatCard
            icon={CalendarDays}
            accent="violet"
            label="Next 7 Days"
            value={next7DaysCount}
            sublabel="upcoming"
            delay={0.1}
          />
          <StatCard
            icon={ShieldAlert}
            accent="rose"
            label="Overdue"
            value={overdueCount}
            sublabel="past due"
            delay={0.15}
          />
        </StatGrid>

        <TabBar tabs={tabs} value={activeTab} onChange={setActiveTab} />

        <div id="viewport-workspace">
          {activeTab === 'insights' && (
            <InsightsView tasks={tasks} karma={karma} labels={labels} onSelectTask={handleSelectTask} onToggleComplete={handleToggleComplete} />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks.filter((t) => !t.readOnly && !t.feedCategory)}
              projects={projects}
              sections={sections}
              labels={labels}
              onAddTask={handleAddTask}
              onOpenCreate={openCreatePane}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
              onSelectTask={handleSelectTask}
              onAddProject={handleAddProject}
              onDeleteProject={handleDeleteProject}
              onAddSection={handleAddSection}
              onDeleteSection={handleDeleteSection}
              onUpdateSection={handleUpdateSection}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              projects={projects}
              sections={sections}
              labels={labels}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
              onSelectTask={handleSelectTask}
              onToast={showToast}
              onSynced={refreshTasks}
              onCreatePersonal={() => setGooglePane({ item: null, mode: 'create-personal' })}
              onOpenCreatePane={(date) => openCreatePane('', date || null)}
            />
          )}
        </div>
      </PageShell>

      <AnimatePresence>
        {showCreatePane && (
          <TaskDetailPane
            mode="create"
            initialTitle={createPrefillTitle}
            defaultProjectId={projects[0]?.id}
            defaultDueDate={createPrefillDate}
            onClose={() => { setShowCreatePane(false); setCreatePrefillDate(null); }}
            projects={projects}
            sections={sections}
            labels={labels}
            onCreateTask={handleAddTask}
          />
        )}

        {!showCreatePane && selectedTaskId && activeTask && (
          <TaskDetailPane
            key={selectedTaskId}
            task={activeTask}
            onClose={() => setSelectedTaskId(null)}
            projects={projects}
            sections={sections}
            labels={labels}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {googlePane && (
          <GoogleItemPane
            item={googlePane.item}
            mode={googlePane.mode}
            onClose={() => setGooglePane(null)}
            onSaved={refreshTasks}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearchOverlay && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] p-4 select-none">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gray-900 border border-white/8 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/6">
                <Search className="w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Search tasks, descriptions, labels..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 text-white placeholder:text-gray-600" autoFocus />
                <button onClick={() => setShowSearchOverlay(false)} className="hover:bg-white/5 p-1 rounded-md text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto p-2">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    {searchQuery.trim() ? 'No matching tasks found.' : 'Start typing to search your tasks.'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((t) => (
                      <div key={`spotlight-res-${t.id}`} onClick={() => handleSearchItemSelect(t)} className="p-2.5 w-full text-left rounded-lg bg-white/2 hover:bg-white/5 border border-transparent hover:border-white/8 transition flex justify-between items-center cursor-pointer">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-semibold text-gray-200 truncate">{t.title}</span>
                          {t.description && <span className="text-xs text-gray-500 block truncate">{t.description}</span>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProductivityModal && (
          <ProductivityModal karma={karma} tasks={tasks} onClose={() => setShowProductivityModal(false)} onUpdateKarmaGoals={handleUpdateKarmaGoals} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={`fixed bottom-6 left-6 z-55 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm max-w-sm backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
                : 'bg-gray-900 border-white/8 text-gray-200'
            }`}
          >
            <Info className="w-4 h-4 shrink-0 opacity-85" />
            <span className="font-medium shrink">{toast.text}</span>
            {toast.actionLabel && toast.onAction && (
              <button onClick={() => { toast.onAction?.(); setToast(null); }} className="ml-auto flex items-center gap-1 text-xs font-semibold bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition border border-white/10 shrink-0 cursor-pointer">
                <RotateCcw className="w-3 h-3" />
                <span>{toast.actionLabel}</span>
              </button>
            )}
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/5 rounded text-gray-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
