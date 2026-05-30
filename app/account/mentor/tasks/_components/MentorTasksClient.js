/**
 * @file Mentor tasks client component
 * @module MentorTasksClient
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Link as LinkIcon,
  Clock,
  Award,
  BookOpen,
  Sparkles,
  ClipboardCheck,
  Paperclip,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { marked } from 'marked';

const MultiBlockEditor = dynamic(
  () => import('@/app/account/admin/bootcamps/_components/MultiBlockEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-xl border border-white/8 bg-white/3" />
    ),
  }
);

const LessonContentRenderer = dynamic(
  () =>
    import('@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer'),
  { ssr: false }
);

// Lightweight markdown renderer for task/session descriptions
const MD_DESC_STYLES = `
.md-desc{display:grid;grid-template-columns:1fr;gap:.5rem;line-height:1.6;color:#908fa0;font-size:.8125rem;}
.md-desc .md-h{font-weight:700;color:#d4e4fa;margin-top:.5rem;margin-bottom:-.25rem;}
.md-desc .md-p{line-height:1.65;word-break:break-word;}
.md-desc .md-strong{color:#d4e4fa;font-weight:600;}
.md-desc .md-em{font-style:italic;}
.md-desc .md-a{color:#8083ff;text-decoration:none;}.md-desc .md-a:hover{text-decoration:underline;}
.md-desc .md-ul,.md-desc .md-ol{padding-left:1.25rem;display:flex;flex-direction:column;gap:.15rem;}
.md-desc .md-ul .md-li{list-style-type:disc;}.md-desc .md-ol .md-li{list-style-type:decimal;}
.md-desc .md-li{padding-left:.2rem;}
.md-desc .md-inline-code{background:rgba(128,131,255,.1);color:#8083ff;padding:.1em .35em;border-radius:.3rem;font-size:.8em;font-family:monospace;}
.md-desc .md-bq{border-left:3px solid rgba(255,255,255,.12);padding:.4rem .75rem;background:rgba(255,255,255,.02);border-radius:0 .4rem .4rem 0;}
`;

function buildDescRenderer() {
  const r = new marked.Renderer();
  r.heading = function ({ tokens, depth }) {
    return `<h${depth} class="md-h md-h${depth}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
  };
  r.link = function ({ href, title, tokens }) {
    return `<a href="${href}" class="md-a"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener">${this.parser.parseInline(tokens)}</a>`;
  };
  r.code = ({ text }) =>
    `<pre class="md-inline-code" style="display:block;white-space:pre-wrap;padding:.5rem .75rem;border-radius:.4rem;margin:.25rem 0;">${text}</pre>`;
  return r;
}

const DESC_RENDERER = buildDescRenderer();

function MarkdownDesc({ text, className = '' }) {
  if (!text) return null;
  let html = '';
  try {
    html = marked.parse(text, {
      gfm: true,
      breaks: true,
      renderer: DESC_RENDERER,
    });
  } catch {
    html = `<p>${text}</p>`;
  }
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MD_DESC_STYLES }} />
      <div
        className={`md-desc ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}

import {
  createWeeklyTaskAction,
  updateWeeklyTaskAction,
  deleteWeeklyTaskAction,
  reviewTaskSubmissionAction,
} from '@/app/_lib/actions/mentor-actions';
import {
  getExamSubmissionsForMentor,
  reviewExamSubmission,
} from '@/app/_lib/actions/bootcamp-actions';
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
} from '@/app/account/_components/ui';

// Extract plain text from a MultiBlockEditor JSON string (or raw HTML fallback)
function descriptionPreview(desc) {
  if (!desc) return '';
  try {
    const blocks = JSON.parse(desc);
    if (Array.isArray(blocks)) {
      return blocks
        .map((b) => b.content || '')
        .join(' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  } catch {}
  return desc
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function resolveAttachmentUrl(url) {
  if (!url) return url;
  const m = url.match(/^\/api\/image\/([a-zA-Z0-9_-]+)$/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
  return url;
}

function AttachmentList({ files }) {
  if (!files?.length) return null;
  return (
    <ul className="space-y-1.5">
      {files.map((f, i) => (
        <li
          key={i}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
        >
          <Paperclip className="h-3 w-3 shrink-0 text-violet-400" />
          <a
            href={resolveAttachmentUrl(f.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-[12px] text-violet-300 hover:underline"
          >
            {f.name || `Attachment ${i + 1}`}
          </a>
          {f.size && (
            <span className="text-[10px] text-gray-500 tabular-nums">
              {formatBytes(f.size)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Step({ n, label, children }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
          {n}
        </span>
        <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

const REVIEW_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'late', label: 'Late' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'redo action required', label: 'Redo Required' },
  { value: 'bonus deserved', label: 'Bonus Deserved' },
];

const TASK_TYPES = [
  'Exercise',
  'Reading',
  'Project',
  'Quiz',
  'Research',
  'Other',
];

export default function MentorTasksClient({
  tasks: initialTasks = [],
  submissions: initialSubmissions = [],
  mentorId,
  bootcamps = [],
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [submissions, setSubmissions] = useState(initialSubmissions);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);
  const [taskDeskSubTab, setTaskDeskSubTab] = useState('submissions');

  const [examSubmissions, setExamSubmissions] = useState([]);
  const [examSubmissionsLoading, setExamSubmissionsLoading] = useState(false);
  const [activeExamSubmission, setActiveExamSubmission] = useState(null);
  const [examGradeInput, setExamGradeInput] = useState('');
  const [examRemarksInput, setExamRemarksInput] = useState('');
  const [submittingExamReview, setSubmittingExamReview] = useState(false);
  const [examBootcampFilter, setExamBootcampFilter] = useState('all');

  // Fetch all exam submissions for assigned bootcamps
  useEffect(() => {
    if (bootcamps.length > 0) {
      setExamSubmissionsLoading(true);
      Promise.all(
        bootcamps.map((b) =>
          getExamSubmissionsForMentor(b.id).catch((err) => {
            console.error(
              `[ExamSubmissions] Failed to fetch for bootcamp ${b.id} (${b.title}):`,
              err?.message || err
            );
            return [];
          })
        )
      )
        .then((results) => {
          const allSubs = results
            .flat()
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          console.log(
            `[ExamSubmissions] Loaded ${allSubs.length} total submissions from ${bootcamps.length} bootcamps`
          );
          setExamSubmissions(allSubs);
        })
        .catch((err) =>
          console.error('[ExamSubmissions] Unexpected error:', err)
        )
        .finally(() => setExamSubmissionsLoading(false));
    }
  }, [bootcamps]);

  // Sync state when active exam submission changes
  useEffect(() => {
    if (activeExamSubmission) {
      setExamGradeInput(
        activeExamSubmission.score != null
          ? String(activeExamSubmission.score)
          : ''
      );
      setExamRemarksInput(activeExamSubmission.mentor_feedback || '');
    } else {
      setExamGradeInput('');
      setExamRemarksInput('');
    }
  }, [activeExamSubmission]);

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
  const [reviewPointsInput, setReviewPointsInput] = useState('');

  // Task form state
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState(() =>
    JSON.stringify([{ id: crypto.randomUUID(), type: 'richText', content: '' }])
  );
  const [taskFormType, setTaskFormType] = useState('Exercise');
  const [taskFormDifficulty, setTaskFormDifficulty] = useState('medium');
  const [taskFormPoints, setTaskFormPoints] = useState(10);
  const [taskFormDueDate, setTaskFormDueDate] = useState('');
  const activeBootcamps = useMemo(
    () => bootcamps.filter((bc) => bc.status === 'published'),
    [bootcamps]
  );
  const [taskFormBootcamp, setTaskFormBootcamp] = useState(() => {
    const active = bootcamps.filter((bc) => bc.status === 'published');
    return active[0]?.id ?? '';
  });

  const [editingTask, setEditingTask] = useState(null);

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
      setReviewPointsInput(
        activeSubmission.points_earned != null
          ? String(activeSubmission.points_earned)
          : ''
      );
    } else {
      setReviewStatusInput('completed');
      setReviewFeedbackInput('');
      setReviewPointsInput('');
    }
  }, [activeSubmission]);

  // Build bootcamp lookup map for display
  const bootcampMap = useMemo(() => {
    const m = {};
    bootcamps.forEach((b) => {
      m[b.id] = b.title;
    });
    return m;
  }, [bootcamps]);

  // Filtered submissions queue
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchSearch =
        !searchQuery ||
        sub.users?.full_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        sub.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.weekly_tasks?.title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchTrack =
        homeworkTrackFilter === 'all' ||
        sub.weekly_tasks?.target_audience === homeworkTrackFilter;

      const matchTask =
        homeworkTaskFilter === 'all' || sub.task_id === homeworkTaskFilter;

      const matchStatus =
        homeworkStatusFilter === 'all' || sub.status === homeworkStatusFilter;

      return matchSearch && matchTrack && matchTask && matchStatus;
    });
  }, [
    submissions,
    searchQuery,
    homeworkTrackFilter,
    homeworkTaskFilter,
    homeworkStatusFilter,
  ]);

  // Stats aggregate
  const stats = useMemo(() => {
    const totalSub = submissions.length;
    const pendingReview = submissions.filter(
      (s) => s.status === 'pending' || s.status === 'late'
    ).length;
    const reviewed = submissions.filter(
      (s) =>
        s.status === 'completed' ||
        s.status === 'accepted' ||
        s.status === 'bonus deserved'
    ).length;
    const successRate =
      totalSub > 0 ? Math.round((reviewed / totalSub) * 100) : 100;

    return {
      totalTasks: tasks.length,
      pendingReview,
      reviewed,
      successRate,
    };
  }, [tasks, submissions]);

  const handleSimulateSubmission = () => {
    if (tasks.length === 0) {
      showToast(
        'Please create at least one task first before simulating submissions.',
        'error'
      );
      return;
    }

    const pool = [
      {
        studentName: 'Eyasir Ahamed',
        studentEmail: 'eyasir329@gmail.com',
        studentId: '202631024',
        avatarUrl: '',
        notes: 'Completed the task as required. Please review my submission.',
      },
      {
        studentName: 'Aisha Rahman',
        studentEmail: 'aisha.rahman@neu.edu',
        studentId: '202634891',
        avatarUrl: '',
        notes:
          'Finished the reading and summarized key points in the linked document.',
      },
      {
        studentName: 'Sabbir Rahman',
        studentEmail: 'sabbir.dsa@gmail.com',
        studentId: '202630514',
        avatarUrl: '',
        notes:
          'Project submitted with all required sections. Feedback welcome.',
      },
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
        member_profiles: [
          { student_id: student.studentId, academic_session: 'Spring 2026' },
        ],
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

    setSubmissions((prev) => [newSub, ...prev]);
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
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id === activeSubmission.id) {
            return {
              ...sub,
              status: reviewStatusInput,
              feedback: reviewFeedbackInput,
              points_earned:
                reviewPointsInput !== '' ? Number(reviewPointsInput) : null,
              reviewed_by: mentorId,
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
    if (reviewPointsInput !== '') fd.set('points_earned', reviewPointsInput);

    const result = await reviewTaskSubmissionAction(fd);
    setActionLoading(false);

    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast(result.success || 'Submission graded successfully!');
      // Update submissions state locally
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id === activeSubmission.id) {
            return {
              ...sub,
              status: reviewStatusInput,
              feedback: reviewFeedbackInput,
              points_earned:
                reviewPointsInput !== '' ? Number(reviewPointsInput) : null,
              reviewed_by: mentorId,
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
        setTasks((prev) => [result.data, ...prev]);
      } else {
        window.location.reload();
      }
      setTaskFormTitle('');
      setTaskFormDesc(
        JSON.stringify([
          { id: crypto.randomUUID(), type: 'richText', content: '' },
        ])
      );
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
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const openEditModal = (task) => {
    setEditingTask({
      ...task,
      deadlineFormatted: task.deadline ? task.deadline.slice(0, 16) : '',
    });
    setTaskDeskSubTab('assign');
  };

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
      setTasks((prev) =>
        prev.map((t) =>
          t.id !== editingTask.id
            ? t
            : {
                ...t,
                title: editingTask.title,
                description: editingTask.description,
                difficulty: editingTask.difficulty,
                task_type: editingTask.task_type,
                points: editingTask.points,
                deadline: new Date(editingTask.deadlineFormatted).toISOString(),
              }
        )
      );
      setEditingTask(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        icon={ClipboardList}
        title="Tasks & Reviews"
        subtitle="Assign tasks, review submissions, and give feedback to your bootcamp members."
        accent="violet"
        actions={
          <ActionButton
            tone="ghost"
            icon={Sparkles}
            onClick={handleSimulateSubmission}
          >
            Simulate
          </ActionButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Total Tasks"
          value={stats.totalTasks}
          accent="blue"
          sublabel="Created by you"
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={stats.pendingReview}
          accent="amber"
          sublabel="Awaiting grading"
          trend={stats.pendingReview > 0 ? { dir: 'up', value: 'New' } : null}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Reviewed"
          value={stats.reviewed}
          accent="emerald"
          sublabel="Graded submissions"
        />
        <StatCard
          icon={Award}
          label="Success Rate"
          value={`${stats.successRate}%`}
          accent="violet"
          sublabel="Approved on first pass"
        />
      </div>

      <div>
        <TabBar
          tabs={[
            {
              value: 'submissions',
              label: 'Submissions',
              icon: ClipboardCheck,
              count: stats.pendingReview,
            },
            {
              value: 'exams',
              label: 'Exams',
              icon: Award,
              count: examSubmissions.filter(
                (s) => s.lessons?.exam_type !== 'mcq' && s.status !== 'reviewed'
              ).length,
            },
            { value: 'assign', label: 'Create Task', icon: Plus },
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
            <GlassCard
              padding="p-4"
              className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-zinc-900/50"
            >
              <div className="flex flex-1 flex-wrap items-center gap-4">
                {/* Search filter input */}
                <div className="relative max-w-sm min-w-[200px] flex-1">
                  <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search student or task..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pr-3.5 pl-9 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                {/* Bootcamp filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    Track
                  </span>
                  <div className="relative">
                    <select
                      value={homeworkTrackFilter}
                      onChange={(e) => {
                        setHomeworkTrackFilter(e.target.value);
                        setHomeworkTaskFilter('all');
                        setActiveSubmission(null);
                      }}
                      className="cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 pr-8 text-xs text-gray-200 transition-all outline-none hover:bg-black/30 focus:border-violet-500/50"
                    >
                      <option value="all">All Bootcamps</option>
                      {bootcamps.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title.split(':')[0]}{' '}
                          {b.status !== 'published' ? '(Archived)' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-500">
                      <svg
                        className="h-3 w-3 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Task filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    Task
                  </span>
                  <div className="relative">
                    <select
                      value={homeworkTaskFilter}
                      onChange={(e) => {
                        setHomeworkTaskFilter(e.target.value);
                        setActiveSubmission(null);
                      }}
                      className="max-w-[150px] cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 pr-8 text-xs text-gray-200 transition-all outline-none hover:bg-black/30 focus:border-violet-500/50"
                    >
                      <option value="all">All Tasks</option>
                      {tasks
                        .filter(
                          (t) =>
                            homeworkTrackFilter === 'all' ||
                            t.target_audience === homeworkTrackFilter
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-500">
                      <svg
                        className="h-3 w-3 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    Status
                  </span>
                  <div className="relative">
                    <select
                      value={homeworkStatusFilter}
                      onChange={(e) => {
                        setHomeworkStatusFilter(e.target.value);
                        setActiveSubmission(null);
                      }}
                      className="cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 pr-8 text-xs text-gray-200 transition-all outline-none hover:bg-black/30 focus:border-violet-500/50"
                    >
                      <option value="all">All Statuses</option>
                      {REVIEW_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-500">
                      <svg
                        className="h-3 w-3 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="font-mono text-[10px] text-gray-500">
                Displaying {filteredSubmissions.length} submissions
              </div>
            </GlassCard>

            {/* Dual Column grid layout */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              {/* Left Queue: 5/12 widths */}
              <div className="max-h-162.5 space-y-3 overflow-y-auto pr-1 lg:col-span-5">
                {filteredSubmissions.map((sub) => {
                  const isSelected = activeSubmission?.id === sub.id;
                  const studentName =
                    sub.users?.full_name || 'Anonymous Student';
                  const avatar = sub.users?.avatar_url;
                  const taskTitle = sub.weekly_tasks?.title || 'Task';

                  const getStatusTone = (st) => {
                    switch (st) {
                      case 'completed':
                      case 'accepted':
                        return 'emerald';
                      case 'pending':
                        return 'amber';
                      case 'late':
                        return 'rose';
                      case 'redo action required':
                        return 'rose';
                      case 'bonus deserved':
                        return 'violet';
                      default:
                        return 'gray';
                    }
                  };

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setActiveSubmission(sub)}
                      className={`relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 text-left backdrop-blur-md transition-all duration-300 select-none ${
                        isSelected
                          ? 'border-violet-500/30 bg-violet-500/[0.05] shadow-[0_0_20px_rgba(139,92,246,0.06)]'
                          : 'border-white/10 bg-zinc-900/50 hover:border-white/20 hover:bg-zinc-900/70'
                      }`}
                    >
                      {/* Active vertical border indicator */}
                      {isSelected && (
                        <div className="absolute top-3.5 bottom-3.5 left-0 w-[3px] rounded-r-full bg-linear-to-b from-violet-400 to-fuchsia-500" />
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <Avatar src={avatar} name={studentName} size="sm" />
                            {sub.status === 'pending' && (
                              <span className="absolute -right-0.5 -bottom-0.5 flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">
                              {studentName}
                            </h4>
                            <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500">
                              <Clock className="h-2.5 w-2.5 text-gray-500" />
                              {sub.submitted_at
                                ? new Date(sub.submitted_at).toLocaleDateString(
                                    'en-US',
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )
                                : 'Just Now'}
                            </p>
                          </div>
                        </div>

                        <Pill tone={getStatusTone(sub.status)}>
                          {sub.status}
                        </Pill>
                      </div>

                      <div className="space-y-1">
                        <div className="truncate text-[11px] font-bold text-violet-300">
                          {taskTitle}
                        </div>
                        {sub.notes && (
                          <div className="line-clamp-1 font-mono text-[10px] text-slate-400 italic opacity-85">
                            {`"${descriptionPreview(sub.notes)}"`}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-2.5 text-[9px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-slate-500" />
                          {bootcampMap[
                            sub.weekly_tasks?.target_audience
                          ]?.split(':')[0] || 'General'}
                        </span>
                        <div className="flex items-center gap-2">
                          {sub.points_earned != null && (
                            <span className="font-bold text-amber-300 tabular-nums">
                              {sub.points_earned}/
                              {sub.weekly_tasks?.points ?? '?'} pts
                            </span>
                          )}
                          {sub.submission_url && (
                            <span className="flex items-center gap-0.5 font-mono font-bold text-violet-400 hover:underline">
                              <LinkIcon className="h-2.5 w-2.5" /> repo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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
              <GlassCard
                padding="p-6"
                className="min-h-125 text-left lg:col-span-7"
              >
                {!activeSubmission ? (
                  <div className="flex h-112.5 items-center justify-center">
                    <EmptyState
                      icon={BookOpen}
                      title="Select a submission"
                      description="Pick a submission from the list to review the work, leave feedback, and assign points."
                      accent="gray"
                    />
                  </div>
                ) : (
                  (() => {
                    const sub = activeSubmission;
                    const studentName =
                      sub.users?.full_name || 'Anonymous Student';
                    const studentEmail = sub.users?.email || '';
                    const studentId =
                      sub.users?.member_profiles?.[0]?.student_id || 'N/A';
                    const avatar = sub.users?.avatar_url;

                    return (
                      <div className="space-y-6">
                        {/* Inner Student details header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-linear-to-r from-violet-500/[0.04] to-fuchsia-500/[0.04] p-4.5">
                          <div className="flex items-center gap-3.5">
                            <Avatar src={avatar} name={studentName} size="md" />
                            <div>
                              <h3 className="text-sm font-bold text-slate-200">
                                {studentName}
                              </h3>
                              <span className="mt-0.5 block font-mono text-[10px] text-gray-500">
                                {studentEmail}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                                Student ID
                              </span>
                              <span className="font-mono text-xs font-bold text-violet-400">
                                {studentId}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveSubmission(null)}
                              className="cursor-pointer rounded-full border border-white/5 p-1.5 text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Assigned homework metadata */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="block text-[9px] font-bold tracking-widest text-gray-500 uppercase">
                                Task
                              </span>
                              <h4 className="mt-1 text-xs font-bold text-slate-200">
                                {sub.weekly_tasks?.title}
                              </h4>
                            </div>
                            <div className="shrink-0 text-right select-none">
                              <Pill
                                tone={
                                  sub.weekly_tasks?.difficulty === 'easy'
                                    ? 'emerald'
                                    : sub.weekly_tasks?.difficulty === 'hard'
                                      ? 'rose'
                                      : 'amber'
                                }
                              >
                                {sub.weekly_tasks?.difficulty || 'medium'}
                              </Pill>
                            </div>
                          </div>

                          {sub.weekly_tasks?.description && (
                            <div className="rounded-2xl border border-white/10 bg-white/2 p-4 text-xs">
                              <LessonContentRenderer
                                content={sub.weekly_tasks.description}
                                lessonId={sub.task_id}
                              />
                            </div>
                          )}
                        </div>

                        {/* Student's submission content */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-white/10 bg-zinc-950/80 px-4 py-3 text-[10px]">
                            <span className="flex items-center gap-2 font-mono font-bold text-gray-400">
                              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                              <span className="ml-1.5 font-bold tracking-widest text-slate-400 uppercase">
                                Submission
                              </span>
                            </span>
                            {sub.submission_url && (
                              <a
                                href={sub.submission_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-bold text-violet-400 transition-all hover:text-violet-300 hover:underline"
                              >
                                <LinkIcon className="h-3 w-3" /> Open submission
                              </a>
                            )}
                          </div>
                          <div className="space-y-4 rounded-b-2xl border border-white/10 bg-zinc-950/80 p-4.5 text-left">
                            {sub.notes ? (
                              <div className="font-mono text-xs leading-relaxed text-slate-300">
                                <LessonContentRenderer
                                  content={sub.notes}
                                  lessonId={`sub-${sub.id}`}
                                />
                              </div>
                            ) : (
                              <div className="py-4 text-center font-mono text-[10px] text-gray-500 italic">
                                No notes submitted.
                              </div>
                            )}
                            {Array.isArray(sub.attachments) &&
                              sub.attachments.length > 0 && (
                                <div className="space-y-2 border-t border-white/5 pt-4">
                                  <span className="block font-mono text-[9px] font-extrabold tracking-widest text-violet-300 uppercase">
                                    Attachments
                                  </span>
                                  <AttachmentList files={sub.attachments} />
                                </div>
                              )}
                          </div>
                        </div>

                        {/* EVALUATION FORM */}
                        <form
                          onSubmit={handlePublishReview}
                          className="space-y-5 rounded-2xl border border-white/10 bg-linear-to-b from-white/[0.02] to-transparent p-5 text-left"
                        >
                          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                            <Award className="h-4 w-4 text-violet-400" />
                            <h4 className="text-[10px] font-bold tracking-wider text-violet-400 uppercase">
                              Review
                            </h4>
                          </div>

                          {/* Quick feedback macros */}
                          <div className="space-y-2">
                            <span className="block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                              Quick presets
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewStatusInput('completed');
                                  setReviewFeedbackInput(
                                    'Well done! Task completed satisfactorily.'
                                  );
                                }}
                                className="cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-bold text-emerald-400 transition-all hover:bg-emerald-500/25"
                              >
                                Completed
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewStatusInput('bonus deserved');
                                  setReviewFeedbackInput(
                                    'Exceptional work — went beyond requirements. Bonus deserved!'
                                  );
                                }}
                                className="cursor-pointer rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-[9px] font-bold text-purple-400 transition-all hover:bg-purple-500/25"
                              >
                                Bonus Deserved
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewStatusInput('redo action required');
                                  setReviewFeedbackInput(
                                    'Please revise and resubmit — see remarks below.'
                                  );
                                }}
                                className="cursor-pointer rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[9px] font-bold text-rose-400 transition-all hover:bg-rose-500/25"
                              >
                                Redo Required
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                                Status
                              </label>
                              <div className="relative">
                                <select
                                  value={reviewStatusInput}
                                  onChange={(e) =>
                                    setReviewStatusInput(e.target.value)
                                  }
                                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 transition-all outline-none hover:bg-black/30 focus:border-violet-500/50"
                                >
                                  {REVIEW_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-gray-500">
                                  <svg
                                    className="h-3.5 w-3.5 fill-current"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                                Points
                                {sub.weekly_tasks?.points != null && (
                                  <span className="ml-1 font-normal text-gray-500">
                                    / {sub.weekly_tasks.points} max
                                  </span>
                                )}
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={sub.weekly_tasks?.points ?? undefined}
                                value={reviewPointsInput}
                                onChange={(e) =>
                                  setReviewPointsInput(e.target.value)
                                }
                                placeholder={
                                  sub.weekly_tasks?.points != null
                                    ? `0 – ${sub.weekly_tasks.points}`
                                    : 'Enter points'
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                              Mentor Remarks
                            </label>
                            <textarea
                              rows={3}
                              value={reviewFeedbackInput}
                              onChange={(e) =>
                                setReviewFeedbackInput(e.target.value)
                              }
                              placeholder="Provide diagnostic feedback, optimization tips, or correction instructions..."
                              className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                            />
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="flex-1 cursor-pointer rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 py-3 text-[10px] font-bold tracking-wider text-white uppercase shadow-[0_0_15px_rgba(139,92,246,0.15)] transition duration-300 hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {actionLoading
                                ? 'Publishing...'
                                : 'Publish Assessment'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSubmission(null)}
                              className="rounded-xl border border-white/10 px-5 py-3 text-xs font-bold tracking-wider text-gray-400 uppercase transition hover:bg-white/2 hover:text-white"
                            >
                              Dismiss
                            </button>
                          </div>
                        </form>
                      </div>
                    );
                  })()
                )}
              </GlassCard>
            </div>
          </div>
        )}
        {taskDeskSubTab === 'exams' && (
          <div className="space-y-6">
            {/* Main workspace container: split screen layout */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              {/* Left columns: filter and submissions inbox (5/12 width) */}
              <div className="space-y-4 lg:col-span-5">
                {/* Exam Filters Ribbon */}
                <GlassCard padding="p-4" className="border border-white/10">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        Select Bootcamp
                      </label>
                      <div className="relative">
                        <select
                          value={examBootcampFilter}
                          onChange={(e) => {
                            setExamBootcampFilter(e.target.value);
                            setActiveExamSubmission(null);
                          }}
                          className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-xs text-gray-200 transition-all outline-none hover:bg-black/30 focus:border-violet-500/50"
                        >
                          <option value="all">All Assigned Bootcamps</option>
                          {bootcamps.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.title}{' '}
                              {b.status !== 'published' ? '(Archived)' : ''}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-gray-500">
                          <svg
                            className="h-3.5 w-3.5 fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Exam Submissions List container */}
                <GlassCard
                  padding="p-0"
                  className="overflow-hidden border border-white/10"
                >
                  <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4.5 py-3.5 text-left">
                    <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-300 uppercase">
                      <ClipboardList className="h-4 w-4 text-violet-400" />
                      Exam Submissions Inbox
                    </h3>
                    {examSubmissionsLoading && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                    )}
                  </div>

                  <div className="spa-scroll max-h-[500px] divide-y divide-white/5 overflow-y-auto">
                    {(() => {
                      const filtered = examSubmissions.filter((sub) => {
                        if (
                          examBootcampFilter !== 'all' &&
                          sub.bootcamp_id !== examBootcampFilter
                        )
                          return false;
                        if (sub.lessons?.exam_type === 'mcq') return false;
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-12 text-center">
                            <EmptyState
                              icon={ClipboardList}
                              title="No exam submissions"
                              description="No student exam submissions match the current filter."
                              accent="gray"
                            />
                          </div>
                        );
                      }

                      return filtered.map((sub) => {
                        const isSelected = activeExamSubmission?.id === sub.id;
                        const studentName =
                          sub.users?.full_name || 'Anonymous Student';
                        const avatar = sub.users?.avatar_url;
                        const examTitle = sub.lessons?.title || 'Untitled Exam';
                        const isCQ = sub.lessons?.exam_type === 'cq';

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setActiveExamSubmission(sub)}
                            className={`flex w-full items-start gap-3 p-4 text-left transition-all ${
                              isSelected
                                ? 'border-l-2 border-violet-500 bg-violet-500/[0.08]'
                                : 'border-l-2 border-transparent hover:bg-white/[0.02]'
                            }`}
                          >
                            <Avatar
                              src={avatar}
                              name={studentName}
                              size="sm"
                              className="mt-0.5 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-bold text-slate-200">
                                  {studentName}
                                </span>
                                <span className="shrink-0 font-mono text-[9px] text-gray-500">
                                  {new Date(
                                    sub.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                                {examTitle}
                              </p>

                              <div className="mt-2.5 flex items-center justify-between">
                                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-gray-500 uppercase">
                                  {sub.lessons?.exam_type === 'hybrid'
                                    ? 'Hybrid Exam'
                                    : isCQ
                                      ? 'CQ Exam'
                                      : 'MCQ Exam'}
                                </span>
                                <Pill
                                  tone={
                                    sub.status === 'reviewed'
                                      ? 'emerald'
                                      : 'amber'
                                  }
                                >
                                  {sub.status === 'reviewed'
                                    ? 'Graded'
                                    : 'Awaiting Grading'}
                                </Pill>
                              </div>
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </GlassCard>
              </div>

              {/* Right columns: Workspace detail (7/12 width) */}
              <GlassCard
                padding="p-6"
                className="min-h-125 text-left lg:col-span-7"
              >
                {!activeExamSubmission ? (
                  <div className="flex h-112.5 items-center justify-center">
                    <EmptyState
                      icon={BookOpen}
                      title="Select an exam"
                      description="Pick an exam submission from the left inbox to view student solutions, award grades, and add mentor remarks."
                      accent="gray"
                    />
                  </div>
                ) : (
                  (() => {
                    const sub = activeExamSubmission;
                    const studentName =
                      sub.users?.full_name || 'Anonymous Student';
                    const studentEmail = sub.users?.email || '';
                    const studentId =
                      sub.users?.member_profiles?.[0]?.student_id || 'N/A';
                    const avatar = sub.users?.avatar_url;
                    const isCQ = sub.lessons?.exam_type === 'cq';
                    const isMcq = sub.lessons?.exam_type === 'mcq';
                    const isHybrid = sub.lessons?.exam_type === 'hybrid';

                    // Use the student's actual selected questions (respects random subsets)
                    // Fall back to lesson's full exam_questions if not stored
                    const examQuestions =
                      sub.submitted_answers?.selected_questions ||
                      sub.lessons?.exam_questions ||
                      [];
                    const cqQuestions = examQuestions.filter(
                      (q) => !Array.isArray(q.options) || q.options.length === 0
                    );
                    const mcqQuestions = examQuestions.filter(
                      (q) => Array.isArray(q.options) && q.options.length > 0
                    );
                    // For grading: mentor only grades the CQ portion
                    const cqMaxPoints = cqQuestions.reduce(
                      (acc, q) => acc + (q.points || 5),
                      0
                    );
                    const mcqMaxPoints = mcqQuestions.reduce(
                      (acc, q) => acc + (q.points || 5),
                      0
                    );
                    // maxPoints = what the mentor can award (CQ only for CQ/hybrid, full for MCQ)
                    const maxPoints = isMcq ? mcqMaxPoints : cqMaxPoints;

                    return (
                      <div className="space-y-6">
                        {/* Active Exam details header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-linear-to-r from-violet-500/[0.04] to-fuchsia-500/[0.04] p-4.5">
                          <div className="flex items-center gap-3.5">
                            <Avatar src={avatar} name={studentName} size="md" />
                            <div>
                              <h3 className="text-sm font-bold text-slate-200">
                                {studentName}
                              </h3>
                              <span className="mt-0.5 block font-mono text-[10px] text-gray-500">
                                {studentEmail}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                                Student ID
                              </span>
                              <span className="font-mono text-xs font-bold text-violet-400">
                                {studentId}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveExamSubmission(null)}
                              className="cursor-pointer rounded-full border border-white/5 p-1.5 text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Metadata block */}
                        <div className="space-y-2">
                          <span className="block text-[9px] font-bold tracking-widest text-gray-500 uppercase">
                            Curriculum Exam
                          </span>
                          <h4 className="text-sm font-bold text-slate-200">
                            {sub.lessons?.title || 'Untitled Exam'}
                          </h4>
                          {sub.lessons?.description && (
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">
                              {sub.lessons.description}
                            </p>
                          )}
                        </div>

                        {/* Exam Guidelines / Prompt content (highly requested by mentor to see actual questions) */}
                        {sub.lessons?.content && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                              <ClipboardList className="h-3.5 w-3.5 text-violet-400" />
                              <span className="text-[10px] font-bold tracking-wider text-violet-400 uppercase">
                                Exam Instructions & Questions
                              </span>
                            </div>
                            <div className="spa-scroll max-h-[300px] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.01] p-4 text-xs leading-relaxed text-gray-300">
                              <LessonContentRenderer
                                content={sub.lessons.content}
                                lessonId={`exam-prompt-${sub.id}`}
                              />
                            </div>
                          </div>
                        )}

                        {/* CQ Questions panel — shown for CQ & Hybrid exams */}
                        {(isCQ || isHybrid) &&
                          (() => {
                            const questions = sub.lessons?.exam_questions || [];
                            // Show only subjective/written questions — MCQ questions have an `options` array
                            const cqQuestions = questions.filter(
                              (q) =>
                                !Array.isArray(q.options) ||
                                q.options.length === 0
                            );
                            if (!cqQuestions.length) return null;
                            return (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                                  <span className="text-[10px] font-bold tracking-wider text-violet-400 uppercase">
                                    Exam Questions
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {cqQuestions.map((q, idx) => (
                                    <div
                                      key={q.id || idx}
                                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                                    >
                                      <div className="flex items-start gap-3">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                                          {idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs leading-relaxed text-slate-200">
                                            <MarkdownDesc
                                              text={q.question}
                                              className="text-slate-200 [&_p]:text-xs [&_p]:text-slate-200"
                                            />
                                          </div>
                                          {q.points != null && (
                                            <span className="mt-1.5 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                              {q.points} pts
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                        {/* Solutions View block */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-white/10 bg-zinc-950/80 px-4 py-3 text-[10px]">
                            <span className="flex items-center gap-2 font-mono font-bold text-gray-400">
                              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                              <span className="ml-1.5 font-bold tracking-widest text-slate-400 uppercase">
                                Student Solution
                              </span>
                            </span>
                          </div>

                          <div className="space-y-4 rounded-b-2xl border border-white/10 bg-zinc-950/80 p-5">
                            {(isMcq || isHybrid) && (
                              <div className="space-y-4 font-mono text-xs leading-relaxed text-slate-300">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                  <h5 className="mb-2 font-sans text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                                    Auto-Graded MCQ Questions
                                  </h5>
                                  <p className="font-sans text-xs font-semibold text-emerald-400">
                                    Student MCQ Score:{' '}
                                    {sub.submitted_answers?.mcq_score ??
                                      sub.score ??
                                      0}{' '}
                                    / {mcqMaxPoints} max points
                                  </p>
                                  <p className="mt-1 font-sans text-[10px] text-gray-500">
                                    Answers are recorded automatically upon
                                    submission.
                                  </p>
                                </div>
                              </div>
                            )}

                            {(isCQ || isHybrid) &&
                              (() => {
                                const cqData = isHybrid
                                  ? sub.submitted_answers?.cq
                                  : sub.submitted_answers;
                                const answersByQuestion =
                                  cqData?.answers_by_question || {};
                                const cqQuestions = (
                                  sub.lessons?.exam_questions || []
                                ).filter(
                                  (q) =>
                                    !Array.isArray(q.options) ||
                                    q.options.length === 0
                                );
                                const hasPerQuestion =
                                  Object.keys(answersByQuestion).length > 0;

                                return (
                                  <div className="space-y-4 text-left">
                                    {/* Per-question answers */}
                                    {hasPerQuestion &&
                                    cqQuestions.length > 0 ? (
                                      <div className="space-y-3">
                                        {cqQuestions.map((q, idx) => {
                                          const qId = q.id || String(idx);
                                          const answerText =
                                            answersByQuestion[qId] || '';
                                          return (
                                            <div
                                              key={qId}
                                              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01]"
                                            >
                                              {/* Question */}
                                              <div className="flex items-start gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3">
                                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                                                  {idx + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                  <div className="text-xs leading-relaxed font-semibold text-slate-200">
                                                    <MarkdownDesc
                                                      text={q.question}
                                                      className="text-slate-200 [&_p]:text-xs [&_p]:font-semibold [&_p]:text-slate-200"
                                                    />
                                                  </div>
                                                  {q.points != null && (
                                                    <span className="mt-1 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                                      {q.points} pts
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              {/* Student Answer */}
                                              <div className="px-4 py-3">
                                                <span className="mb-2 block text-[10px] font-bold tracking-wider text-emerald-400/70 uppercase">
                                                  Student Answer
                                                </span>
                                                {answerText ? (
                                                  <div className="text-xs leading-relaxed text-slate-300">
                                                    <LessonContentRenderer
                                                      content={answerText}
                                                      lessonId={`exam-cq-${sub.id}-${qId}`}
                                                    />
                                                  </div>
                                                ) : (
                                                  <p className="text-xs text-gray-600 italic">
                                                    No answer provided.
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : cqData?.answer ? (
                                      // Legacy fallback: single explanation block
                                      <div className="space-y-2">
                                        <h5 className="font-sans text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                          Written Explanation
                                        </h5>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.01] p-4 font-sans text-xs leading-relaxed text-slate-300">
                                          <LessonContentRenderer
                                            content={cqData.answer}
                                            lessonId={`exam-cq-${sub.id}`}
                                          />
                                        </div>
                                      </div>
                                    ) : null}

                                    {Array.isArray(cqData?.attachments) &&
                                      cqData.attachments.length > 0 && (
                                        <div className="space-y-2 border-t border-white/5 pt-4">
                                          <span className="block font-sans text-[10px] font-bold tracking-widest text-violet-300 uppercase">
                                            Attachments
                                          </span>
                                          <AttachmentList
                                            files={cqData.attachments}
                                          />
                                        </div>
                                      )}
                                  </div>
                                );
                              })()}
                          </div>
                        </div>

                        {/* CQ Exam Grading Form */}
                        {(isCQ || isHybrid) && (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (examGradeInput === '') {
                                toast.error(
                                  'Please assign points before submitting.'
                                );
                                return;
                              }

                              const numericScore = Number(examGradeInput);
                              if (
                                isNaN(numericScore) ||
                                numericScore < 0 ||
                                numericScore > maxPoints
                              ) {
                                toast.error(
                                  `Please assign a valid score between 0 and ${maxPoints}.`
                                );
                                return;
                              }

                              setSubmittingExamReview(true);
                              try {
                                await reviewExamSubmission(
                                  sub.id,
                                  numericScore,
                                  examRemarksInput,
                                  'reviewed'
                                );
                                setExamSubmissions((prev) =>
                                  prev.map((s) =>
                                    s.id === sub.id
                                      ? {
                                          ...s,
                                          score: numericScore,
                                          mentor_feedback: examRemarksInput,
                                          status: 'reviewed',
                                        }
                                      : s
                                  )
                                );
                                setActiveExamSubmission(null);
                                toast.success('Exam graded successfully!');
                              } catch (err) {
                                toast.error(
                                  err.message || 'Failed to submit review'
                                );
                              } finally {
                                setSubmittingExamReview(false);
                              }
                            }}
                            className="space-y-5 rounded-2xl border border-white/10 bg-linear-to-b from-white/[0.02] to-transparent p-5"
                          >
                            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                              <Award className="h-4 w-4 text-violet-400" />
                              <h4 className="text-[10px] font-bold tracking-wider text-violet-400 uppercase">
                                Review & Grade Submissions
                              </h4>
                            </div>

                            {/* Presets ribbon */}
                            <div className="space-y-2">
                              <span className="block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                                Score Presets
                              </span>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExamGradeInput(String(maxPoints));
                                    setExamRemarksInput(
                                      'Perfect! Outstanding implementation of all requirements.'
                                    );
                                  }}
                                  className="cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-bold text-emerald-400 transition-all hover:bg-emerald-500/25"
                                >
                                  100% Score
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExamGradeInput(
                                      String(Math.floor(maxPoints * 0.8))
                                    );
                                    setExamRemarksInput(
                                      'Very good work! Fulfills all criteria with minor room for improvement.'
                                    );
                                  }}
                                  className="cursor-pointer rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-[9px] font-bold text-purple-400 transition-all hover:bg-purple-500/25"
                                >
                                  80% Score
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExamGradeInput(
                                      String(Math.floor(maxPoints * 0.5))
                                    );
                                    setExamRemarksInput(
                                      'Satisfactory attempt, but please review the instructions and implement missing requirements.'
                                    );
                                  }}
                                  className="cursor-pointer rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[9px] font-bold text-rose-400 transition-all hover:bg-rose-500/25"
                                >
                                  50% Score
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                                  {isHybrid
                                    ? 'CQ Points Awarded'
                                    : 'Points Awarded'}
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={maxPoints}
                                  value={examGradeInput}
                                  onChange={(e) =>
                                    setExamGradeInput(e.target.value)
                                  }
                                  placeholder={`0 - ${maxPoints}`}
                                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                                  {isHybrid
                                    ? 'CQ Max Points'
                                    : 'Max Possible Points'}
                                </label>
                                <div className="w-full rounded-xl border border-white/10 bg-white/[0.01] px-3.5 py-3 text-xs text-gray-500 select-none">
                                  {maxPoints} pts
                                  {isHybrid
                                    ? ` (+ ${mcqMaxPoints} MCQ auto)`
                                    : ''}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                                Mentor Remarks
                              </label>
                              <textarea
                                value={examRemarksInput}
                                onChange={(e) =>
                                  setExamRemarksInput(e.target.value)
                                }
                                placeholder="Add your review feedback, tips or explanation here..."
                                rows={4}
                                className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                              <button
                                type="submit"
                                disabled={submittingExamReview}
                                className="flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-violet-700 px-5 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-violet-600 active:scale-95 disabled:opacity-50"
                              >
                                {submittingExamReview ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Award className="h-3.5 w-3.5" />
                                )}
                                Publish Grade
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveExamSubmission(null)}
                                className="rounded-xl border border-white/10 px-5 py-3 text-xs font-bold tracking-wider text-gray-400 uppercase transition hover:bg-white/2 hover:text-white"
                              >
                                Dismiss
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })()
                )}
              </GlassCard>
            </div>
          </div>
        )}
        {taskDeskSubTab === 'assign' && (
          <div className="grid grid-cols-1 items-start gap-6 text-left lg:grid-cols-12">
            {/* Create / Edit Task Form — same panel, mode toggled by editingTask */}
            <GlassCard
              padding="p-0"
              className="overflow-hidden border border-white/10 bg-zinc-900/50 lg:col-span-6"
            >
              <form
                onSubmit={
                  editingTask ? handleUpdateTaskSubmit : handlePublishTask
                }
              >
                <div className="flex items-center justify-between border-b border-white/10 bg-linear-to-r from-violet-500/[0.04] to-fuchsia-500/[0.04] px-5 py-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-black tracking-widest text-violet-400 uppercase">
                    <Sparkles className="h-3.5 w-3.5" />
                    {editingTask ? 'Edit Task' : 'Task Constructor'}
                  </h3>
                  {editingTask ? (
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="flex cursor-pointer items-center gap-1 font-mono text-[10px] font-bold text-gray-400 transition hover:text-white"
                    >
                      <X className="h-3 w-3" /> Cancel Edit
                    </button>
                  ) : (
                    <span className="font-mono text-[8px] font-bold tracking-widest text-gray-500">
                      MENTOR STUDIO
                    </span>
                  )}
                </div>

                <div className="space-y-6 p-6">
                  {/* Step 1: Target Track & Type */}
                  <Step n={1} label="Target Track & Type">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Bootcamp */}
                      {!editingTask && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                            Target Bootcamp Track
                          </label>
                          {activeBootcamps.length === 0 ? (
                            <p className="text-xs text-amber-400">
                              No active bootcamps assigned to you yet.
                            </p>
                          ) : (
                            <div className="relative">
                              <select
                                required
                                value={taskFormBootcamp}
                                onChange={(e) =>
                                  setTaskFormBootcamp(e.target.value)
                                }
                                className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                              >
                                {activeBootcamps.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.title}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-gray-500">
                                <svg
                                  className="h-3.5 w-3.5 fill-current"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Task Type selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                          Task Type Category
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {TASK_TYPES.map((t) => {
                            const chosen = editingTask
                              ? (editingTask.task_type || 'Exercise') === t
                              : taskFormType === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() =>
                                  editingTask
                                    ? setEditingTask({
                                        ...editingTask,
                                        task_type: t,
                                      })
                                    : setTaskFormType(t)
                                }
                                className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
                                  chosen
                                    ? 'border-violet-500/40 bg-violet-500/[0.06] text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.06)]'
                                    : 'border-white/10 bg-black/20 text-gray-400 hover:bg-black/30 hover:text-gray-200'
                                }`}
                              >
                                <span className="text-[10px] leading-none font-bold">
                                  {t}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Step>

                  {/* Step 2: Task Definition */}
                  <Step n={2} label="Task Definition">
                    <div className="space-y-4">
                      {/* Title */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                          Challenge Title
                        </label>
                        <input
                          type="text"
                          required
                          value={
                            editingTask ? editingTask.title : taskFormTitle
                          }
                          onChange={(e) =>
                            editingTask
                              ? setEditingTask({
                                  ...editingTask,
                                  title: e.target.value,
                                })
                              : setTaskFormTitle(e.target.value)
                          }
                          placeholder="e.g. Advanced Segment Trees & Bitmasks"
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                          Work Instructions
                        </label>
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                          <MultiBlockEditor
                            key={
                              editingTask ? `edit-${editingTask.id}` : 'create'
                            }
                            value={
                              editingTask
                                ? editingTask.description || ''
                                : taskFormDesc
                            }
                            onChange={
                              editingTask
                                ? (v) =>
                                    setEditingTask((prev) => ({
                                      ...prev,
                                      description: v,
                                    }))
                                : setTaskFormDesc
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </Step>

                  {/* Step 3: Grade Weights & Schedule */}
                  <Step n={3} label="Grade Weight & Schedule">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                          Difficulty Grade
                        </label>
                        <div className="relative">
                          <select
                            value={
                              editingTask
                                ? editingTask.difficulty
                                : taskFormDifficulty
                            }
                            onChange={(e) =>
                              editingTask
                                ? setEditingTask({
                                    ...editingTask,
                                    difficulty: e.target.value,
                                  })
                                : setTaskFormDifficulty(e.target.value)
                            }
                            className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 transition-all outline-none hover:bg-black/30 focus:border-violet-500/50"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-gray-500">
                            <svg
                              className="h-3.5 w-3.5 fill-current"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                          Max Score Weight
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={
                            editingTask
                              ? (editingTask.points ?? 10)
                              : taskFormPoints
                          }
                          onChange={(e) =>
                            editingTask
                              ? setEditingTask({
                                  ...editingTask,
                                  points: Number(e.target.value),
                                })
                              : setTaskFormPoints(Number(e.target.value))
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                          Due Deadline
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={
                            editingTask
                              ? editingTask.deadlineFormatted
                              : taskFormDueDate
                          }
                          onChange={(e) =>
                            editingTask
                              ? setEditingTask({
                                  ...editingTask,
                                  deadlineFormatted: e.target.value,
                                })
                              : setTaskFormDueDate(e.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-gray-200 scheme-dark transition-all duration-300 outline-none hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                    </div>
                  </Step>

                  <button
                    type="submit"
                    disabled={
                      actionLoading || (!editingTask && bootcamps.length === 0)
                    }
                    className="w-full cursor-pointer rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-[0_0_15px_rgba(139,92,246,0.15)] transition duration-300 hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {actionLoading
                      ? 'Saving...'
                      : editingTask
                        ? 'Save Changes'
                        : 'Publish Challenge'}
                  </button>
                </div>
              </form>
            </GlassCard>

            {/* Published Tasks list */}
            <GlassCard
              padding="p-6"
              className="space-y-5 border border-white/10 bg-zinc-900/50 text-left lg:col-span-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-black tracking-wider text-violet-400 uppercase">
                  Published Tasks
                </h4>
                <span className="rounded-full border border-white/5 bg-black/40 px-2.5 py-0.5 font-mono text-[9px] font-bold text-gray-400">
                  {tasks.length} total
                </span>
              </div>

              <div className="max-h-[640px] space-y-3.5 overflow-y-auto pr-1">
                {tasks.map((t) => {
                  const isDeleting = deletingTaskId === t.id;

                  return (
                    <div
                      key={t.id}
                      className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition-all duration-300 hover:bg-zinc-900/70"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-1.5 text-left">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-block rounded border border-white/5 bg-slate-900 px-2 py-0.5 font-mono text-[8px] font-bold text-gray-400">
                              {bootcampMap[t.target_audience]?.split(':')[0] ||
                                t.target_audience ||
                                'All'}
                            </span>
                            {t.task_type && (
                              <span className="inline-block rounded border border-violet-500/15 bg-violet-950/20 px-2 py-0.5 font-mono text-[8px] font-bold text-violet-400">
                                {t.task_type}
                              </span>
                            )}
                            <Pill
                              tone={
                                t.difficulty === 'easy'
                                  ? 'emerald'
                                  : t.difficulty === 'hard'
                                    ? 'rose'
                                    : 'amber'
                              }
                            >
                              {t.difficulty}
                            </Pill>
                          </div>

                          <h5 className="mt-1 truncate text-xs font-bold text-slate-100">
                            {t.title}
                          </h5>
                          <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-gray-400 opacity-80">
                            {descriptionPreview(t.description)}
                          </p>
                        </div>

                        <div className="ml-2 flex shrink-0 items-center gap-1 select-none">
                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-violet-400"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {confirmDeleteId === t.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                disabled={isDeleting}
                                className="cursor-pointer rounded-lg bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-400 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-50"
                              >
                                {isDeleting ? '...' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="cursor-pointer rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-400 transition-colors hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(t.id)}
                              disabled={isDeleting}
                              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[9px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-slate-500" />
                          By {t.users?.full_name?.split(' ')[0] || 'Self'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          Due{' '}
                          {t.deadline
                            ? new Date(t.deadline).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {tasks.length === 0 && (
                  <div className="p-8 text-center text-gray-500 italic">
                    No tasks published yet. Create one using the form.
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </PageShell>
  );
}
