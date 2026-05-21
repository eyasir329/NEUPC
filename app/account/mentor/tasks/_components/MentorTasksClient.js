'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ClipboardList, Search, Plus, Edit2, Trash2, X, Link as LinkIcon,
  Clock, Award, BookOpen,
  Sparkles, ClipboardCheck, Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const MultiBlockEditor = dynamic(
  () => import('@/app/account/admin/bootcamps/_components/MultiBlockEditor'),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl border border-white/8 bg-white/3" /> }
);

const LessonContentRenderer = dynamic(
  () => import('@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer'),
  { ssr: false }
);

import {
  createWeeklyTaskAction,
  updateWeeklyTaskAction,
  deleteWeeklyTaskAction,
  reviewTaskSubmissionAction,
} from '@/app/_lib/mentor-actions';
// shared primitives from member panel UI context
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  TabBar,
  ActionButton,
  Pill,
  Avatar,
  EmptyState,
} from '@/app/account/mentor/_components/_ui';

// Shared form input style matching the member panel design language
const INPUT_CLS = 'w-full bg-gray-900/80 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition';
const LABEL_CLS = 'text-[11px] font-semibold uppercase tracking-wider text-gray-500';


// Extract plain text from a MultiBlockEditor JSON string (or raw HTML fallback)
function descriptionPreview(desc) {
  if (!desc) return '';
  try {
    const blocks = JSON.parse(desc);
    if (Array.isArray(blocks)) {
      return blocks
        .map(b => b.content || '')
        .join(' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  } catch {}
  return desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const REVIEW_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'late', label: 'Late' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'redo action required', label: 'Redo Required' },
  { value: 'bonus deserved', label: 'Bonus Deserved' },
];

const TASK_TYPES = ['Exercise', 'Reading', 'Project', 'Quiz', 'Research', 'Other'];

export default function MentorTasksClient({ tasks: initialTasks = [], submissions: initialSubmissions = [], mentorId, bootcamps = [] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [submissions, setSubmissions] = useState(initialSubmissions);

  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);
  useEffect(() => { setSubmissions(initialSubmissions); }, [initialSubmissions]);
  const [taskDeskSubTab, setTaskDeskSubTab] = useState('submissions');
  
  // Filtering and Searching states
  const [searchQuery, setSearchQuery] = useState('');
  const [homeworkTrackFilter, setHomeworkTrackFilter] = useState('all');
  const [homeworkTaskFilter, setHomeworkTaskFilter] = useState('all');
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState('all');

  // Active submission for grading panel
  const [activeSubmission, setActiveSubmission] = useState(null);
  
  // Evaluation inputs
  const [reviewStatusInput, setReviewStatusInput] = useState('completed');
  const [reviewFeedbackInput, setReviewFeedbackInput] = useState('');
  
  // Task form state
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState(
    () => JSON.stringify([{ id: crypto.randomUUID(), type: 'richText', content: '' }])
  );
  const [taskFormType, setTaskFormType] = useState('Exercise');
  const [taskFormDifficulty, setTaskFormDifficulty] = useState('medium');
  const [taskFormPoints, setTaskFormPoints] = useState(10);
  const [taskFormDueDate, setTaskFormDueDate] = useState('');
  const [taskFormBootcamp, setTaskFormBootcamp] = useState(bootcamps[0]?.id ?? '');

  // Edit Task modal state
  const [editingTask, setEditingTask] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Stable desc state for MultiBlockEditor — only reset when modal opens, not on every keystroke
  const [editingDesc, setEditingDesc] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const showToast = (message, type = 'success') => {
    if (type === 'error') toast.error(message);
    else toast.success(message);
  };

  // Sync state when active submission changes
  useEffect(() => {
    if (activeSubmission) {
      setReviewStatusInput(activeSubmission.status || 'completed');
      setReviewFeedbackInput(activeSubmission.feedback || '');
    } else {
      setReviewStatusInput('completed');
      setReviewFeedbackInput('');
    }
  }, [activeSubmission]);

  // Build bootcamp lookup map for display
  const bootcampMap = useMemo(() => {
    const m = {};
    bootcamps.forEach(b => { m[b.id] = b.title; });
    return m;
  }, [bootcamps]);

  // Filtered submissions queue
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchSearch = !searchQuery || 
        sub.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        sub.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.weekly_tasks?.title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTrack = homeworkTrackFilter === 'all' || 
        sub.weekly_tasks?.target_audience === homeworkTrackFilter;

      const matchTask = homeworkTaskFilter === 'all' || 
        sub.task_id === homeworkTaskFilter;

      const matchStatus = homeworkStatusFilter === 'all' || 
        sub.status === homeworkStatusFilter;

      return matchSearch && matchTrack && matchTask && matchStatus;
    });
  }, [submissions, searchQuery, homeworkTrackFilter, homeworkTaskFilter, homeworkStatusFilter]);

  // Stats aggregate
  const stats = useMemo(() => {
    const totalSub = submissions.length;
    const pendingReview = submissions.filter(s => s.status === 'pending' || s.status === 'late').length;
    const reviewed = submissions.filter(s => s.status === 'completed' || s.status === 'accepted' || s.status === 'bonus deserved').length;
    const successRate = totalSub > 0 ? Math.round((reviewed / totalSub) * 100) : 100;
    
    return {
      totalTasks: tasks.length,
      pendingReview,
      reviewed,
      successRate
    };
  }, [tasks, submissions]);

  const handleSimulateSubmission = () => {
    if (tasks.length === 0) {
      showToast('Please create at least one task first before simulating submissions.', 'error');
      return;
    }

    const pool = [
      { studentName: 'Eyasir Ahamed', studentEmail: 'eyasir329@gmail.com', studentId: '202631024', avatarUrl: '', notes: 'Completed the task as required. Please review my submission.' },
      { studentName: 'Aisha Rahman', studentEmail: 'aisha.rahman@neu.edu', studentId: '202634891', avatarUrl: '', notes: 'Finished the reading and summarized key points in the linked document.' },
      { studentName: 'Sabbir Rahman', studentEmail: 'sabbir.dsa@gmail.com', studentId: '202630514', avatarUrl: '', notes: 'Project submitted with all required sections. Feedback welcome.' },
    ];

    const student = pool[Math.floor(Math.random() * pool.length)];
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

    const newSub = {
      id: `sub-simulated-${Date.now()}`,
      task_id: randomTask.id,
      user_id: `user-simulated-${Date.now()}`,
      submission_url: 'https://github.com/sample/submission',
      code: null,
      notes: student.notes,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      feedback: null,
      reviewed_by: null,
      users: {
        id: `user-simulated-${Date.now()}`,
        full_name: student.studentName,
        email: student.studentEmail,
        avatar_url: student.avatarUrl,
        member_profiles: [{ student_id: student.studentId, academic_session: 'Spring 2026' }],
      },
      weekly_tasks: {
        id: randomTask.id,
        title: randomTask.title,
        difficulty: randomTask.difficulty,
        deadline: randomTask.deadline,
        target_audience: randomTask.target_audience,
        description: randomTask.description,
      },
    };

    setSubmissions(prev => [newSub, ...prev]);
    showToast(`Simulated submission from ${student.studentName}`);
  };

  // Grade review action handler
  const handlePublishReview = async (e) => {
    e.preventDefault();
    if (!activeSubmission) return;

    setActionLoading(true);
    const isSimulated = activeSubmission.id.startsWith('sub-simulated-');

    if (isSimulated) {
      // Local updates for simulator
      setSubmissions(prev => 
        prev.map(sub => {
          if (sub.id === activeSubmission.id) {
            return {
              ...sub,
              status: reviewStatusInput,
              feedback: reviewFeedbackInput,
              reviewed_by: mentorId
            };
          }
          return sub;
        })
      );
      showToast('Simulated submission updated successfully in state!');
      setActiveSubmission(null);
      setActionLoading(false);
      return;
    }

    // Call real Next.js server action
    const fd = new FormData();
    fd.set('submissionId', activeSubmission.id);
    fd.set('status', reviewStatusInput);
    fd.set('feedback', reviewFeedbackInput);

    const result = await reviewTaskSubmissionAction(fd);
    setActionLoading(false);

    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast(result.success || 'Submission graded successfully!');
      // Update submissions state locally
      setSubmissions(prev => 
        prev.map(sub => {
          if (sub.id === activeSubmission.id) {
            return {
              ...sub,
              status: reviewStatusInput,
              feedback: reviewFeedbackInput,
              reviewed_by: mentorId
            };
          }
          return sub;
        })
      );
      setActiveSubmission(null);
    }
  };

  // Publish Task action handler
  const handlePublishTask = async (e) => {
    e.preventDefault();
    if (!taskFormTitle.trim() || !taskFormDueDate) {
      showToast('Title and deadline are required.', 'error');
      return;
    }

    setActionLoading(true);
    const fd = new FormData();
    fd.set('title', taskFormTitle);
    fd.set('description', taskFormDesc);
    fd.set('difficulty', taskFormDifficulty);
    fd.set('deadline', taskFormDueDate);
    fd.set('target_audience', taskFormBootcamp);
    fd.set('task_type', taskFormType);
    fd.set('points', String(taskFormPoints));

    const result = await createWeeklyTaskAction(fd);
    setActionLoading(false);

    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast(result.success || 'Task created successfully!');
      if (result.data) {
        setTasks(prev => [result.data, ...prev]);
      } else {
        window.location.reload();
      }
      setTaskFormTitle('');
      setTaskFormDesc(JSON.stringify([{ id: crypto.randomUUID(), type: 'richText', content: '' }]));
      setTaskFormType('Exercise');
      setTaskFormDifficulty('medium');
      setTaskFormPoints(10);
      setTaskFormDueDate('');
    }
  };

  // Delete task action
  const handleDeleteTask = async (taskId) => {
    setConfirmDeleteId(null);
    setDeletingTaskId(taskId);
    const fd = new FormData();
    fd.set('id', taskId);

    const result = await deleteWeeklyTaskAction(fd);
    setDeletingTaskId(null);

    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast(result.success || 'Task deleted successfully.');
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const openEditModal = (task) => {
    setEditingTask({
      ...task,
      deadlineFormatted: task.deadline ? task.deadline.slice(0, 16) : '',
    });
    setEditingDesc(task.description || '');
    setIsEditModalOpen(true);
  };

  const handleEditDescChange = useCallback((v) => {
    setEditingDesc(v);
    setEditingTask(prev => ({ ...prev, description: v }));
  }, []);

  const handleUpdateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask?.title || !editingTask?.deadlineFormatted) {
      showToast('Title and deadline are required.', 'error');
      return;
    }

    setActionLoading(true);
    const fd = new FormData();
    fd.set('id', editingTask.id);
    fd.set('title', editingTask.title);
    fd.set('description', editingTask.description || '');
    fd.set('difficulty', editingTask.difficulty || 'medium');
    fd.set('deadline', editingTask.deadlineFormatted);
    fd.set('task_type', editingTask.task_type || 'Exercise');
    fd.set('points', String(editingTask.points ?? 10));

    const result = await updateWeeklyTaskAction(fd);
    setActionLoading(false);

    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast(result.success || 'Task updated successfully!');
      setTasks(prev =>
        prev.map(t => t.id !== editingTask.id ? t : {
          ...t,
          title: editingTask.title,
          description: editingTask.description,
          difficulty: editingTask.difficulty,
          task_type: editingTask.task_type,
          points: editingTask.points,
          deadline: new Date(editingTask.deadlineFormatted).toISOString(),
        })
      );
      setIsEditModalOpen(false);
      setEditingTask(null);
    }
  };

  return (
    <PageShell>
      
      {/* OPERATIONS HEADER BANNER (PageHeader Primitive) */}
      <PageHeader
        icon={ClipboardList}
        title="Tasks & Evaluation Workspace"
        subtitle="Assign tasks to bootcamp members, review submissions, and post feedback."
        accent="violet"
        actions={
          <ActionButton
            tone="emerald"
            icon={Sparkles}
            onClick={handleSimulateSubmission}
          >
            Simulate Submission
          </ActionButton>
        }
      />

      {/* Aggregate Stats Cards (StatCard Primitives) */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Total Tasks Given"
          value={`${stats.totalTasks} Challenges`}
          accent="blue"
        />
        <StatCard
          icon={Clock}
          label="Awaiting Evaluation"
          value={`${stats.pendingReview} Submissions`}
          accent="amber"
          trend={stats.pendingReview > 0 ? { dir: 'up', value: 'Needs Grade' } : null}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Reviewed Homework"
          value={`${stats.reviewed} Graded`}
          accent="emerald"
        />
        <StatCard
          icon={Award}
          label="Success Ratio"
          value={`${stats.successRate}% Passed`}
          accent="violet"
        />
      </div>

      {/* DUAL MODE WORKSPACE SWITCHER (TabBar Primitive) */}
      <div className="mt-5">
      <TabBar
        tabs={[
          { value: 'submissions', label: 'Received Submissions', icon: ClipboardCheck, count: stats.pendingReview },
          { value: 'tasks', label: 'All Tasks', icon: BookOpen, count: tasks.length },
          { value: 'assign', label: 'Issue New Task', icon: Plus }
        ]}
        value={taskDeskSubTab}
        onChange={setTaskDeskSubTab}
      />
      </div>

      <div className="mt-5">
      {/* TAB SUB-VIEW 1: SUBMISSIONS INBOX SCREEN */}
      {taskDeskSubTab === 'submissions' && (
        <div className="space-y-6">
          
          {/* Submissions Filters ribbon */}
          <GlassCard padding="p-4" className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              
              {/* Search filter input */}
              <div className="relative flex-1 min-w-50 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search student or task..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900/80 border border-white/8 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition"
                />
              </div>

              {/* Bootcamp filter */}
              <div className="flex items-center gap-2">
                <span className={LABEL_CLS}>Bootcamp</span>
                <select
                  value={homeworkTrackFilter}
                  onChange={(e) => {
                    setHomeworkTrackFilter(e.target.value);
                    setHomeworkTaskFilter('all');
                    setActiveSubmission(null);
                  }}
                  className="bg-gray-900/80 border border-white/8 rounded-lg px-2.5 py-2 text-sm text-gray-300 cursor-pointer focus:outline-none focus:border-violet-500/60 transition"
                >
                  <option value="all">All Bootcamps</option>
                  {bootcamps.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>

              {/* Task filter */}
              <div className="flex items-center gap-2">
                <span className={LABEL_CLS}>Task</span>
                <select
                  value={homeworkTaskFilter}
                  onChange={(e) => {
                    setHomeworkTaskFilter(e.target.value);
                    setActiveSubmission(null);
                  }}
                  className="bg-gray-900/80 border border-white/8 rounded-lg px-2.5 py-2 text-sm text-gray-300 cursor-pointer focus:outline-none focus:border-violet-500/60 transition max-w-50"
                >
                  <option value="all">All Tasks</option>
                  {tasks
                    .filter(t => homeworkTrackFilter === 'all' || t.target_audience === homeworkTrackFilter)
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))
                  }
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2">
                <span className={LABEL_CLS}>Status</span>
                <select
                  value={homeworkStatusFilter}
                  onChange={(e) => {
                    setHomeworkStatusFilter(e.target.value);
                    setActiveSubmission(null);
                  }}
                  className="bg-gray-900/80 border border-white/8 rounded-lg px-2.5 py-2 text-sm text-gray-300 cursor-pointer focus:outline-none focus:border-violet-500/60 transition"
                >
                  <option value="all">All Statuses</option>
                  {REVIEW_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="text-[10px] text-gray-500 font-mono">
              Displaying {filteredSubmissions.length} submissions
            </div>
          </GlassCard>

          {/* Dual Column grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Queue: 5/12 widths */}
            <div className="lg:col-span-5 space-y-3 max-h-162.5 overflow-y-auto pr-1">
              {filteredSubmissions.map((sub) => {
                const isSelected = activeSubmission?.id === sub.id;
                const studentName = sub.users?.full_name || 'Anonymous Student';
                const avatar = sub.users?.avatar_url;
                const taskTitle = sub.weekly_tasks?.title || 'Task';
                
                const getStatusTone = (st) => {
                  switch (st) {
                    case 'completed':
                    case 'accepted': return 'emerald';
                    case 'pending': return 'amber';
                    case 'late': return 'rose';
                    case 'redo action required': return 'rose';
                    case 'bonus deserved': return 'violet';
                    default: return 'gray';
                  }
                };

                return (
                  <GlassCard
                    key={sub.id}
                    hover
                    onClick={() => setActiveSubmission(sub)}
                    padding="p-4"
                    className={`cursor-pointer select-none text-left flex flex-col gap-3 border ${
                      isSelected 
                        ? 'border-violet-500/80 bg-violet-950/15 shadow-lg shadow-violet-500/5' 
                        : 'border-white/8 hover:border-white/12'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={avatar} name={studentName} size="sm" />
                        <div>
                          <h4 className="text-xs font-black text-slate-200">{studentName}</h4>
                          <p className="text-[9px] text-slate-500">
                            {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                          </p>
                        </div>
                      </div>

                      <Pill tone={getStatusTone(sub.status)}>
                        {sub.status}
                      </Pill>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-violet-450 truncate">{taskTitle}</div>
                      {sub.notes && (
                        <div className="text-[10px] text-slate-400 line-clamp-1 italic font-mono">
                          "{sub.notes}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-slate-500">
                      <span>Bootcamp: <span className="text-slate-350 font-bold">{bootcampMap[sub.weekly_tasks?.target_audience] || 'N/A'}</span></span>
                      {sub.submission_url && (
                        <span className="font-mono text-violet-400 font-bold hover:underline flex items-center gap-0.5">
                          <LinkIcon className="w-2.5 h-2.5" /> repo
                        </span>
                      )}
                    </div>
                  </GlassCard>
                );
              })}

              {filteredSubmissions.length === 0 && (
                <EmptyState
                  icon={ClipboardList}
                  title="No submissions found"
                  description="No student homework submissions matched the current filters."
                  accent="amber"
                  action={
                    <ActionButton
                      tone="ghost"
                      onClick={() => {
                        setHomeworkStatusFilter('all');
                        setHomeworkTrackFilter('all');
                        setHomeworkTaskFilter('all');
                      }}
                    >
                      Reset Filters
                    </ActionButton>
                  }
                />
              )}
            </div>

            {/* Right Workspace detail: 7/12 widths */}
            <GlassCard padding="p-6" className="lg:col-span-7 min-h-125 text-left">
              {!activeSubmission ? (
                <div className="h-112.5 flex items-center justify-center">
                  <EmptyState
                    icon={BookOpen}
                    title="Evaluation Workspace Empty"
                    description="Select a student card from the left homework queue to critique their solution code, inspect repository files, and write diagnostic feedbacks."
                    accent="gray"
                  />
                </div>
              ) : (() => {
                const sub = activeSubmission;
                const studentName = sub.users?.full_name || 'Anonymous Student';
                const studentEmail = sub.users?.email || '';
                const studentId = sub.users?.member_profiles?.[0]?.student_id || 'N/A';
                const avatar = sub.users?.avatar_url;
                
                return (
                  <div className="space-y-5">
                                      {/* Inner Student details header */}
                    <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-white/2 border border-white/6 rounded-2xl shadow-inner">
                      <div className="flex items-center gap-3">
                        <Avatar src={avatar} name={studentName} size="md" />
                        <div>
                          <h3 className="text-sm font-black text-slate-200">{studentName}</h3>
                          <span className="text-[10px] text-gray-500 font-mono block">{studentEmail}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-gray-500 block uppercase font-black">Student ID</span>
                        <span className="text-xs font-mono font-black text-violet-400">{studentId}</span>
                      </div>
                    </div>

                    {/* Assigned homework metadata */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase block">ASSIGNED HOMEWORK</span>
                          <h4 className="text-sm font-bold text-slate-100 mt-0.5">{sub.weekly_tasks?.title}</h4>
                        </div>
                        <div className="text-right shrink-0 select-none">
                          <Pill tone={sub.weekly_tasks?.difficulty === 'easy' ? 'emerald' : sub.weekly_tasks?.difficulty === 'hard' ? 'rose' : 'amber'}>
                            {sub.weekly_tasks?.difficulty || 'medium'}
                          </Pill>
                        </div>
                      </div>
                      
                      {sub.weekly_tasks?.description && (
                        <div className="bg-white/1 p-3 rounded-xl border border-white/6">
                          <LessonContentRenderer content={sub.weekly_tasks.description} lessonId={sub.task_id} />
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {sub.notes && (
                      <div className="space-y-1.5 p-3.5 bg-violet-950/10 border-l-4 border-violet-500/40 rounded-r-2xl">
                        <span className="text-[9px] font-extrabold text-violet-300 uppercase tracking-widest block font-mono">Student's Notes</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed font-semibold italic">
                          "{sub.notes}"
                        </p>
                      </div>
                    )}

                    {/* Submission content panel */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center bg-[#05080e]/80 px-4 py-2.5 border border-white/5 border-b-0 rounded-t-2xl text-[10px]">
                        <span className="font-mono text-gray-500 font-bold flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-violet-400" />
                          Submission
                        </span>
                        <div className="flex items-center gap-3">
                          {sub.submission_url && (
                            <a
                              href={sub.submission_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-0.5 hover:underline"
                            >
                              <LinkIcon className="w-3.5 h-3.5" /> Submission Link
                            </a>
                          )}
                          {sub.code && (
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(sub.code); showToast('Copied!'); }}
                              className="text-[10px] text-gray-400 hover:text-gray-250 font-bold"
                            >
                              Copy
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="bg-[#05080e]/95 p-4 rounded-b-2xl border border-white/5 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-60 leading-relaxed text-left">
                        {sub.code ? (
                          <pre className="whitespace-pre">{sub.code}</pre>
                        ) : (
                          <div className="text-gray-500 italic py-4 text-center">No inline content. Check the submission link above.</div>
                        )}
                      </div>
                    </div>

                    {/* EVALUATION FORM */}
                    <form onSubmit={handlePublishReview} className="bg-white/1 border border-white/6 rounded-2xl p-4 space-y-4 text-left">
                      <div className="flex items-center gap-1.5 border-b border-white/6 pb-2">
                        <Award className="w-4 h-4 text-violet-400" />
                        <h4 className="text-[10px] font-black uppercase text-violet-400 tracking-wider">Review & Feedback</h4>
                      </div>

                      {/* Quick feedback macros */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider block">Quick Macros</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => { setReviewStatusInput('completed'); setReviewFeedbackInput('Well done! Task completed satisfactorily.'); }}
                            className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-bold hover:bg-emerald-500/25 transition-all"
                          >
                            Completed
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReviewStatusInput('bonus deserved'); setReviewFeedbackInput('Exceptional work — went beyond requirements. Bonus deserved!'); }}
                            className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[9px] font-bold hover:bg-purple-500/25 transition-all"
                          >
                            Bonus
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReviewStatusInput('redo action required'); setReviewFeedbackInput('Please revise and resubmit — see remarks below.'); }}
                            className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[9px] font-bold hover:bg-rose-500/25 transition-all"
                          >
                            Redo
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className={LABEL_CLS}>Review Status</label>
                        <select
                          value={reviewStatusInput}
                          onChange={(e) => setReviewStatusInput(e.target.value)}
                          className={INPUT_CLS}
                        >
                          {REVIEW_STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className={LABEL_CLS}>Mentor Remarks</label>
                        <textarea
                          rows={3}
                          value={reviewFeedbackInput}
                          onChange={(e) => setReviewFeedbackInput(e.target.value)}
                          placeholder="Provide descriptive feedback, diagnostic tips, or correction guides..."
                          className={`${INPUT_CLS} resize-none`}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition cursor-pointer"
                        >
                          {actionLoading ? 'Publishing...' : 'Publish Evaluation'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSubmission(null)}
                          className="px-4 py-2 rounded-lg border border-white/8 text-gray-400 hover:text-white text-sm font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>

                    </form>

                  </div>
                );
              })()}
            </GlassCard>

          </div>
        </div>
      )}
      {/* TAB SUB-VIEW 2: ALL TASKS */}
      {taskDeskSubTab === 'tasks' && (
        <GlassCard padding="p-6" className="space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-white/6 pb-3">
            <h4 className="text-xs font-black uppercase text-violet-400 tracking-wider">All Published Tasks</h4>
            <span className="text-[9px] bg-[#05080e] border border-white/5 text-gray-400 px-2 py-0.5 rounded-full font-mono font-bold">
              {tasks.length} total
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1">
            {tasks.map(t => {
              const isDeleting = deletingTaskId === t.id;
              return (
                <GlassCard key={t.id} padding="p-4" className="bg-white/1 border-white/6 relative overflow-hidden group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 text-left flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[8px] font-mono font-bold text-gray-400 bg-slate-900 px-2 py-0.5 rounded border border-white/5 inline-block">
                          {bootcampMap[t.target_audience] || t.target_audience || 'All'}
                        </span>
                        {t.task_type && (
                          <span className="text-[8px] font-mono font-bold text-violet-400 bg-violet-950/20 px-2 py-0.5 rounded border border-violet-500/15 inline-block">
                            {t.task_type}
                          </span>
                        )}
                        <Pill tone={t.difficulty === 'easy' ? 'emerald' : t.difficulty === 'hard' ? 'rose' : 'amber'}>
                          {t.difficulty}
                        </Pill>
                      </div>
                      <h5 className="text-xs font-bold text-slate-100 truncate mt-1">{t.title}</h5>
                      <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-snug">
                        {descriptionPreview(t.description)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 select-none ml-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-white/4 hover:text-violet-400 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteId === t.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            disabled={isDeleting}
                            className="rounded-lg px-2 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isDeleting ? '...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg px-2 py-1 text-gray-400 hover:text-white text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(t.id)}
                          disabled={isDeleting}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500">
                    <span>By: <span className="text-slate-350 font-bold">{t.users?.full_name || 'Self'}</span></span>
                    <span className="text-amber-400 font-bold font-mono">{t.points ?? 0} pts</span>
                    <span>Due: <span className="text-slate-350 font-mono font-bold">{t.deadline ? new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span></span>
                  </div>
                </GlassCard>
              );
            })}

            {tasks.length === 0 && (
              <EmptyState
                icon={ClipboardList}
                title="No tasks published yet"
                description="Switch to Issue New Task to create your first task."
                accent="violet"
                action={
                  <ActionButton tone="ghost" onClick={() => setTaskDeskSubTab('assign')}>
                    Create Task
                  </ActionButton>
                }
              />
            )}
          </div>
        </GlassCard>
      )}

      {taskDeskSubTab === 'assign' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
          
          {/* Create Task Form */}
          <GlassCard padding="p-0" className="lg:col-span-6 overflow-hidden">
            <form onSubmit={handlePublishTask}>
              <div className="bg-white/5 px-5 py-4 border-b border-white/6 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-violet-400 tracking-widest">Assign New Task</h3>
                <span className="text-[8px] font-bold text-gray-500 tracking-widest font-mono">MENTOR WORKSPACE</span>
              </div>

              <div className="p-6 space-y-4">

                {/* Bootcamp */}
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Bootcamp <span className="text-rose-500">*</span></label>
                  {bootcamps.length === 0 ? (
                    <p className="text-xs text-amber-400">No bootcamps assigned to you yet.</p>
                  ) : (
                    <select
                      required
                      value={taskFormBootcamp}
                      onChange={(e) => setTaskFormBootcamp(e.target.value)}
                      className={INPUT_CLS}
                    >
                      {bootcamps.map(b => (
                        <option key={b.id} value={b.id}>{b.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Task Title <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={taskFormTitle}
                    onChange={(e) => setTaskFormTitle(e.target.value)}
                    placeholder="e.g. Read chapter 3 and summarize key concepts"
                    className={INPUT_CLS}
                  />
                </div>

                {/* Type, Difficulty, Points */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={LABEL_CLS}>Type</label>
                    <select
                      value={taskFormType}
                      onChange={(e) => setTaskFormType(e.target.value)}
                      className={INPUT_CLS}
                    >
                      {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={LABEL_CLS}>Difficulty</label>
                    <select
                      value={taskFormDifficulty}
                      onChange={(e) => setTaskFormDifficulty(e.target.value)}
                      className={INPUT_CLS}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={LABEL_CLS}>Points <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={taskFormPoints}
                      onChange={(e) => setTaskFormPoints(Number(e.target.value))}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Deadline <span className="text-rose-500">*</span></label>
                  <input
                    type="datetime-local"
                    required
                    value={taskFormDueDate}
                    onChange={(e) => setTaskFormDueDate(e.target.value)}
                    className={`${INPUT_CLS} scheme-dark`}
                  />
                </div>


                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Description <span className="text-rose-500">*</span></label>
                  <div className="rounded-xl overflow-hidden">
                    <MultiBlockEditor
                      value={taskFormDesc}
                      onChange={setTaskFormDesc}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || bootcamps.length === 0}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Publish Task'}
                </button>

              </div>
            </form>
          </GlassCard>

          {/* Published Tasks list */}
          <GlassCard padding="p-6" className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/6 pb-3">
              <h4 className="text-xs font-black uppercase text-violet-400 tracking-wider">Published Tasks</h4>
              <span className="text-[9px] bg-[#05080e] border border-white/5 text-gray-400 px-2 py-0.5 rounded-full font-mono font-bold">
                {tasks.length} total
              </span>
            </div>

            <div className="space-y-3 max-h-130 overflow-y-auto pr-1">
              {tasks.map(t => {
                const isDeleting = deletingTaskId === t.id;

                return (
                  <GlassCard key={t.id} padding="p-4" className="bg-white/1 border-white/6 relative overflow-hidden group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 text-left flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] font-mono font-bold text-gray-400 bg-slate-900 px-2 py-0.5 rounded border border-white/5 inline-block">
                            {bootcampMap[t.target_audience] || t.target_audience || 'All'}
                          </span>
                          {t.task_type && (
                            <span className="text-[8px] font-mono font-bold text-violet-400 bg-violet-950/20 px-2 py-0.5 rounded border border-violet-500/15 inline-block">
                              {t.task_type}
                            </span>
                          )}
                          <Pill tone={t.difficulty === 'easy' ? 'emerald' : t.difficulty === 'hard' ? 'rose' : 'amber'}>
                            {t.difficulty}
                          </Pill>
                        </div>

                        <h5 className="text-xs font-bold text-slate-100 truncate mt-1">{t.title}</h5>
                        <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-snug">
                          {descriptionPreview(t.description)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 select-none ml-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/4 hover:text-violet-400 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteId === t.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(t.id)}
                              disabled={isDeleting}
                              className="rounded-lg px-2 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isDeleting ? '...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg px-2 py-1 text-gray-400 hover:text-white text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(t.id)}
                            disabled={isDeleting}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>


                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500">
                      <span>By: <span className="text-slate-350 font-bold">{t.users?.full_name || 'Self'}</span></span>
                      <span>Due: <span className="text-slate-350 font-mono font-bold">{t.deadline ? new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span></span>
                    </div>
                  </GlassCard>
                );
              })}

              {tasks.length === 0 && (
                <div className="p-8 text-center text-gray-500 italic">No tasks published yet. Create one using the form.</div>
              )}
            </div>

          </GlassCard>

        </div>
      )}
      </div>

      {/* EDIT TASK MODAL */}
      <AnimatePresence>
        {isEditModalOpen && editingTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/8 bg-gray-950 shadow-2xl text-left overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                <h2 className="text-[15px] font-semibold text-white">Edit Challenge</h2>
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                  className="rounded-md p-1 text-gray-500 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-5">
              <form onSubmit={handleUpdateTaskSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Task Title <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Description</label>
                  <div className="rounded-xl overflow-hidden">
                    <MultiBlockEditor
                      value={editingTask.description || ''}
                      onChange={(v) => setEditingTask(prev => ({ ...prev, description: v }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={LABEL_CLS}>Type</label>
                    <select
                      value={editingTask.task_type || 'Exercise'}
                      onChange={(e) => setEditingTask({ ...editingTask, task_type: e.target.value })}
                      className={INPUT_CLS}
                    >
                      {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={LABEL_CLS}>Difficulty</label>
                    <select
                      value={editingTask.difficulty}
                      onChange={(e) => setEditingTask({ ...editingTask, difficulty: e.target.value })}
                      className={INPUT_CLS}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={LABEL_CLS}>Points <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editingTask.points ?? 10}
                      onChange={(e) => setEditingTask({ ...editingTask, points: Number(e.target.value) })}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Deadline <span className="text-rose-500">*</span></label>
                  <input
                    type="datetime-local"
                    required
                    value={editingTask.deadlineFormatted}
                    onChange={(e) => setEditingTask({ ...editingTask, deadlineFormatted: e.target.value })}
                    className={`${INPUT_CLS} scheme-dark`}
                  />
                </div>


                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition cursor-pointer"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                    className="px-4 py-2 rounded-lg border border-white/8 text-gray-400 hover:text-white text-sm font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </PageShell>
  );
}
