'use client';

import { useState } from 'react';
import { ClipboardList, Search, Plus, Edit2, Trash2, X, Link, Clock, ChevronDown, ChevronUp, Users } from 'lucide-react';
import {
  createWeeklyTaskAction,
  updateWeeklyTaskAction,
  deleteWeeklyTaskAction,
} from '@/app/_lib/mentor-actions';
import { useScrollLock } from '@/app/_lib/hooks';
import {
  PageShell, PageHeader, GlassCard, StatCard, Pill, ActionButton, EmptyState,
} from '@/app/account/mentor/_components/_ui';

const inDays = (d) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
const MOCK_MENTOR_ID = 'mock-mentor-id';

const MOCK_TASKS = [
  {
    id: 't1', title: 'Binary Search — Classic Problems Set', difficulty: 'easy',
    description: 'Solve 5 binary search problems: rotated array, peak element, search in matrix, first/last occurrence, and median of two arrays.',
    target_audience: 'all', deadline: inDays(3),
    problem_links: ['https://codeforces.com/problemset/problem/1690/D', 'https://codeforces.com/problemset/problem/702/C'],
    assigned_by: MOCK_MENTOR_ID,
  },
  {
    id: 't2', title: 'Graph BFS & DFS — Shortest Paths', difficulty: 'medium',
    description: 'Implement BFS on an unweighted graph, then solve two shortest-path problems: 0-1 BFS and multi-source BFS.',
    target_audience: 'batch-49', deadline: inDays(5),
    problem_links: ['https://codeforces.com/problemset/problem/1037/D', 'https://codeforces.com/problemset/problem/1307/D'],
    assigned_by: MOCK_MENTOR_ID,
  },
  {
    id: 't3', title: 'Dynamic Programming — LCS & Edit Distance', difficulty: 'medium',
    description: 'Classic DP: Longest Common Subsequence, Edit Distance, and one extension problem involving multiple sequences.',
    target_audience: 'all', deadline: inDays(7),
    problem_links: ['https://codeforces.com/problemset/problem/1446/B'],
    assigned_by: MOCK_MENTOR_ID,
  },
  {
    id: 't4', title: 'Segment Trees with Lazy Propagation', difficulty: 'hard',
    description: 'Implement a segment tree supporting range sum queries and range updates with lazy propagation. Then apply it to two competitive programming problems.',
    target_audience: 'advanced', deadline: inDays(10),
    problem_links: ['https://codeforces.com/problemset/problem/1398/D', 'https://codeforces.com/problemset/problem/1093/G'],
    assigned_by: MOCK_MENTOR_ID,
  },
  {
    id: 't5', title: 'Two Pointers & Sliding Window', difficulty: 'easy',
    description: 'Solve 4 problems using the two-pointer technique: pair sum, longest substring without repeat, container with most water, and trapping rain water.',
    target_audience: 'batch-50', deadline: inDays(4),
    problem_links: ['https://codeforces.com/problemset/problem/1547/F'],
    assigned_by: 'other-mentor',
  },
  {
    id: 't6', title: 'Greedy — Interval Scheduling & Huffman', difficulty: 'medium',
    description: 'Solve interval scheduling maximisation, activity selection, and implement Huffman encoding as a bonus challenge.',
    target_audience: 'all', deadline: inDays(6),
    problem_links: [],
    assigned_by: 'other-mentor',
  },
];

const DIFF_TONE = { easy: 'emerald', medium: 'amber', hard: 'rose' };

function TaskModal({ task, onClose, mentorId }) {
  const isEdit = !!task;
  useScrollLock();
  const [links, setLinks] = useState(task?.problem_links || ['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.target);
    fd.set('problem_links', JSON.stringify(links.filter(Boolean)));
    fd.set('assigned_by', mentorId);
    const result = isEdit ? await updateWeeklyTaskAction(fd) : await createWeeklyTaskAction(fd);
    if (result.error) { setError(result.error); setLoading(false); }
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{isEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="taskId" value={task.id} />}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Title *</label>
            <input name="title" required defaultValue={task?.title} placeholder="Task title" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Description</label>
            <textarea name="description" rows={3} defaultValue={task?.description} placeholder="Task description…" className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Difficulty</label>
              <select name="difficulty" defaultValue={task?.difficulty || 'medium'} className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Deadline</label>
              <input type="date" name="deadline" defaultValue={task?.deadline ? task.deadline.slice(0, 10) : ''} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Target Audience</label>
            <input name="target_audience" defaultValue={task?.target_audience || ''} placeholder="e.g. batch-49, all" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Problem Links</label>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input type="url" value={link} onChange={(e) => { const next = [...links]; next[i] = e.target.value; setLinks(next); }} placeholder="https://codeforces.com/…" className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none" />
                  <button type="button" onClick={() => setLinks(links.filter((_, j) => j !== i))} className="rounded-lg p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setLinks([...links, ''])} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
                <Plus className="h-3.5 w-3.5" /> Add link
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving…' : isEdit ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskSection({ title, tasks, expanded, setExpanded, onEdit, onDelete, deleting, showActions }) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">{title} ({tasks.length})</h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <GlassCard key={task.id} padding="p-0" className="overflow-hidden">
            <div className="flex cursor-pointer items-center justify-between p-4" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
              <div className="flex min-w-0 items-center gap-3">
                <Pill tone={DIFF_TONE[task.difficulty] ?? 'gray'}>{task.difficulty}</Pill>
                <h3 className="truncate text-sm font-medium text-white">{task.title}</h3>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                {task.deadline && (
                  <span className="hidden items-center gap-1 text-xs text-gray-500 sm:flex">
                    <Clock className="h-3 w-3" />
                    {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
                {showActions && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-blue-400"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} disabled={deleting === task.id} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                  </>
                )}
                {expanded === task.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </div>
            {expanded === task.id && (
              <div className="border-t border-white/6 p-4 pt-3">
                {task.description && <p className="mb-3 text-sm text-gray-400">{task.description}</p>}
                {task.target_audience && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-3.5 w-3.5" /><span>Target: {task.target_audience}</span>
                  </div>
                )}
                {Array.isArray(task.problem_links) && task.problem_links.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium tracking-wider text-gray-500 uppercase">Problem Links</p>
                    <div className="flex flex-wrap gap-2">
                      {task.problem_links.map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 hover:bg-blue-500/20">
                          <Link className="h-3 w-3" />Problem {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default function MentorTasksClient({ tasks: rawTasks = [], mentorId }) {
  const useMock = rawTasks.length === 0;
  const tasks = useMock ? MOCK_TASKS : rawTasks;
  const effectiveMentorId = useMock ? MOCK_MENTOR_ID : mentorId;
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('all');
  const [modalTask, setModalTask] = useState(undefined);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState(null);

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchDiff = filterDiff === 'all' || t.difficulty === filterDiff;
    return matchSearch && matchDiff;
  });

  const myTasks = filtered.filter((t) => t.assigned_by === effectiveMentorId);
  const otherTasks = filtered.filter((t) => t.assigned_by !== effectiveMentorId);

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setDeleting(taskId);
    const fd = new FormData();
    fd.set('taskId', taskId);
    const result = await deleteWeeklyTaskAction(fd);
    if (result.error) setMessage({ type: 'error', text: result.error });
    setDeleting(null);
  };

  return (
    <PageShell>
      <PageHeader
        icon={ClipboardList}
        title="Weekly Tasks"
        subtitle="Create and manage tasks for your mentees"
        accent="violet"
        actions={
          <button onClick={() => setModalTask(null)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Task
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: 'Total', value: tasks.length, accent: 'blue' },
          { label: 'My Tasks', value: tasks.filter((t) => t.assigned_by === effectiveMentorId).length, accent: 'emerald' },
          { label: 'Easy', value: tasks.filter((t) => t.difficulty === 'easy').length, accent: 'cyan' },
          { label: 'Hard', value: tasks.filter((t) => t.difficulty === 'hard').length, accent: 'rose' },
        ].map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} delay={i * 0.06} />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none" />
        </div>
        <select value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)} className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2.5 text-sm text-white focus:outline-none">
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {message && (
        <div className={`rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{message.text}</div>
      )}

      <TaskSection title="My Tasks" tasks={myTasks} expanded={expanded} setExpanded={setExpanded} onEdit={setModalTask} onDelete={handleDelete} deleting={deleting} showActions />
      {otherTasks.length > 0 && <TaskSection title="All Tasks" tasks={otherTasks} expanded={expanded} setExpanded={setExpanded} onEdit={setModalTask} onDelete={handleDelete} deleting={deleting} showActions={false} />}

      {filtered.length === 0 && (
        <GlassCard padding="py-16">
          <EmptyState icon={ClipboardList} title="No tasks found" accent="violet" />
        </GlassCard>
      )}

      {modalTask !== undefined && <TaskModal task={modalTask} onClose={() => setModalTask(undefined)} mentorId={effectiveMentorId} />}
    </PageShell>
  );
}
