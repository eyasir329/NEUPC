/**
 * @file Member bootcamps client component
 * @module MemberBootcampsClient
 */

'use client';

const DHAKA_TZ = 'Asia/Dhaka';

function fmtDhaka(iso, opts) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { timeZone: DHAKA_TZ, ...opts });
}

import {
  useState,
  useMemo,
  useTransition,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import SafeImg from '@/app/_components/ui/SafeImg';
import {
  BookOpen,
  Clock,
  Search,
  ArrowRight,
  Loader2,
  GraduationCap,
  Zap,
  CheckCircle2,
  X,
  House,
  Play,
  Trophy,
  Flame,
  TrendingUp,
  Sparkles,
  PlayCircle,
  CheckCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Video,
  FileText,
  ChevronDown,
  Check,
  Lock,
  HourglassIcon,
  Archive,
  ClipboardList,
  Send,
  Paperclip,
  Upload,
  Trash2,
  Layers,
  AlertCircle,
  Percent,
  MapPin,
  Crown,
  Award,
  Medal,
  Target,
} from 'lucide-react';
import {
  enrollUser,
  getMemberBootcampSessions,
  getMemberBootcampTasks,
  submitTaskAction,
  uploadTaskAttachmentAction,
  getBootcampsLeaderboardAction,
} from '@/app/_lib/actions/bootcamp-actions';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { PageShell, TabBar, PageHeader } from '@/app/account/_components/ui';
import dynamic from 'next/dynamic';

const MultiBlockEditor = dynamic(
  () => import('@/app/account/admin/bootcamps/_components/MultiBlockEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/5" />
    ),
  }
);

function cn(...c) {
  return c.filter(Boolean).join(' ');
}

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveAttachmentUrl(url) {
  if (!url) return url;
  const m = url.match(/^\/api\/image\/([a-zA-Z0-9_-]+)$/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
  return url;
}

function AttachmentList({ files, onRemove }) {
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
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="rounded p-0.5 text-gray-500 hover:bg-white/5 hover:text-rose-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function TaskDescriptionRenderer({ content }) {
  if (!content) return null;
  let html = '';
  try {
    const blocks = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(blocks)) {
      html = blocks.map((b) => b.content || '').join('');
    } else {
      html = content;
    }
  } catch {
    html = content;
  }
  if (!html) return null;
  return (
    <div
      className="tiptap-viewer-content text-[13px] text-gray-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: House },
  { id: 'mylearning', label: 'My Learning', icon: GraduationCap },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'sessions', label: 'Sessions', icon: Video },
  { id: 'catalog', label: 'Catalog', icon: BookOpen },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

// Format seconds with sub-minute precision so short sessions don't display as 0.
function formatWatchSeconds(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (s === 0) return null;
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function timeAgo(iso) {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// Compute current streak from enrollments' completed_at timestamps
function computeStreak(enrolledBootcamps) {
  const days = new Set();
  enrolledBootcamps.forEach(({ enrollment }) => {
    const progress = enrollment?.progressData?.lessonProgress || {};
    Object.values(progress).forEach((p) => {
      if (p.is_completed && p.completed_at) {
        const d = new Date(p.completed_at);
        days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });
  });
  if (days.size === 0) return 0;
  let streak = 0;
  const cur = new Date();
  while (true) {
    const key = `${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`;
    if (days.has(key)) {
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    } else if (streak === 0) {
      // allow skipping today if nothing today
      cur.setDate(cur.getDate() - 1);
      const key2 = `${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`;
      if (!days.has(key2)) break;
    } else break;
  }
  return streak;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionLabel({ children, action }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
        {children}
      </h2>
      {action}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'text-violet-400',
}) {
  const accentBg =
    {
      'text-violet-400': 'bg-violet-500/10 ring-violet-500/20',
      'text-emerald-400': 'bg-emerald-500/10 ring-emerald-500/20',
      'text-amber-400': 'bg-amber-500/10 ring-amber-500/20',
      'text-indigo-400': 'bg-indigo-500/10 ring-indigo-500/20',
      'text-rose-400': 'bg-rose-500/10 ring-rose-500/20',
      'text-blue-400': 'bg-blue-500/10 ring-blue-500/20',
      'text-fuchsia-400': 'bg-fuchsia-500/10 ring-fuchsia-500/20',
      'text-orange-400': 'bg-orange-500/10 ring-orange-500/20',
    }[accent] || 'bg-white/5 ring-white/10';
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-5 shadow-lg shadow-black/30 backdrop-blur-xl transition-colors hover:border-white/20"
    >
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-current opacity-5 blur-3xl transition-opacity group-hover:opacity-10"
        style={{ color: 'currentColor' }}
      />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
          {label}
        </span>
        <div className={cn('rounded-lg p-2 ring-1', accentBg)}>
          <Icon className={cn('h-4 w-4', accent)} />
        </div>
      </div>
      <div className="relative z-10 mt-3 text-3xl font-bold text-white tabular-nums">
        {value}
      </div>
      {sub && (
        <div className="relative z-10 mt-1 text-[12px] text-gray-500">
          {sub}
        </div>
      )}
    </motion.div>
  );
}

function ProgressBar({ value, className = '', tone = 'emerald' }) {
  const colors = {
    emerald: 'from-emerald-500 to-teal-400',
    violet: 'from-violet-500 to-fuchsia-400',
    amber: 'from-amber-500 to-orange-400',
    blue: 'from-blue-500 to-cyan-400',
  };
  return (
    <div
      className={cn(
        'relative h-1.5 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5',
        className
      )}
    >
      <motion.div
        className={cn(
          'h-full rounded-full bg-linear-to-r',
          colors[tone] || colors.emerald
        )}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function SearchInput({ value, onChange, placeholder, autoFocus }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pr-9 pl-9 text-[13px] text-white transition-colors placeholder:text-gray-600 focus:border-violet-500/40 focus:bg-white/5 focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon = GraduationCap,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/2 px-4 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
        <Icon className="h-6 w-6 text-violet-400" />
      </div>
      <p className="text-[14px] font-semibold text-white">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-[12.5px] text-gray-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Thumbnail({ bootcamp, size = 'md' }) {
  const sizes = {
    sm: 'w-20 h-20 sm:w-24 sm:h-24',
    md: 'w-full h-40',
    lg: 'w-full h-44',
  };
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg bg-linear-to-br from-indigo-950 to-slate-900 ring-1 ring-white/10',
        sizes[size]
      )}
    >
      {bootcamp.thumbnail ? (
        <SafeImg
          src={bootcamp.thumbnail}
          alt={bootcamp.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
          <span className="line-clamp-3 text-[12px] leading-snug font-semibold text-white/80">
            {bootcamp.title}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Bootcamp Cards ───────────────────────────────────────────────────────────

function EnrolledRow({ bootcamp, enrollment, compact }) {
  const progress = enrollment?.progress_percent || 0;
  const completedLessons = enrollment?.completed_lessons || 0;
  const totalLessons = bootcamp?.total_lessons || 0;
  const remaining = Math.max(0, totalLessons - completedLessons);
  const lastOpened = timeAgo(enrollment?.last_accessed_at);
  const duration = formatDuration(bootcamp?.total_duration);
  const isComplete = totalLessons > 0 && remaining === 0;
  const cta = isComplete ? 'Review' : completedLessons > 0 ? 'Resume' : 'Start';

  return (
    <Link
      href={`/account/member/bootcamps/${bootcamp.id}`}
      className="group flex gap-4 rounded-2xl border border-white/10 bg-white/2 p-4 transition-colors hover:border-violet-500/30 hover:bg-white/5 sm:gap-5 sm:p-5"
    >
      <Thumbnail bootcamp={bootcamp} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-white transition-colors group-hover:text-violet-300 sm:text-base">
              {bootcamp.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-[11.5px] text-gray-500">
              {bootcamp.difficulty_level && (
                <span className="font-medium text-violet-400">
                  {bootcamp.difficulty_level}
                </span>
              )}
              {bootcamp.difficulty_level && lastOpened && (
                <span className="text-gray-700">·</span>
              )}
              {lastOpened && (
                <span>Last active {lastOpened.toLowerCase()}</span>
              )}
            </div>
          </div>
          {isComplete ? (
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10.5px] font-bold text-amber-300 ring-1 ring-amber-500/25 sm:inline-flex">
              <Trophy className="h-3 w-3" /> Complete
            </span>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11.5px] text-gray-500">
            <span>
              {completedLessons}/{totalLessons} lessons
              {duration ? ` · ${duration}` : ''}
            </span>
            <span className="font-semibold text-emerald-400 tabular-nums">
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} />
        </div>

        {!compact && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11.5px] text-gray-500">
              {isComplete
                ? 'You finished this bootcamp'
                : `${remaining} lessons left`}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[12px] font-bold text-white shadow-sm shadow-emerald-500/20 transition-colors group-hover:bg-emerald-400">
              <Play className="h-3 w-3 fill-current" />
              {cta}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function CompletedCard({ bootcamp, enrollment }) {
  const completedDate = enrollment?.completed_at
    ? new Date(enrollment.completed_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
  return (
    <Link
      href={`/account/member/bootcamps/${bootcamp.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/2 transition-colors hover:border-amber-500/30"
    >
      <Thumbnail bootcamp={bootcamp} size="md" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[14px] font-semibold text-white transition-colors group-hover:text-amber-200">
          {bootcamp.title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-bold text-amber-300 ring-1 ring-amber-500/20">
            <Trophy className="h-3 w-3" /> Complete
          </span>
          {completedDate && (
            <span className="text-[11px] text-gray-500">{completedDate}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CatalogCard({ bootcamp, onEnroll, isEnrolling, pendingEnrollment }) {
  const isPending = pendingEnrollment?.status === 'pending';
  const needsApproval = bootcamp.enrollment_type === 'approval';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:border-violet-500/40 hover:bg-zinc-900/70"
    >
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/[0.08] opacity-0 blur-[60px] transition-opacity group-hover:opacity-100" />
      <Thumbnail bootcamp={bootcamp} size="lg" />
      <div className="relative z-10 flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            {bootcamp.difficulty_level && (
              <span className="inline-block rounded bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-violet-300 uppercase ring-1 ring-violet-500/20">
                {bootcamp.difficulty_level}
              </span>
            )}
            {bootcamp.is_featured && (
              <span className="inline-block rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase ring-1 ring-amber-500/20">
                Featured
              </span>
            )}
            {needsApproval && (
              <span className="inline-block rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase ring-1 ring-white/10">
                Approval Required
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 text-[15px] font-semibold text-white">
            {bootcamp.title}
          </h3>
          {bootcamp.description && (
            <p className="mt-1.5 line-clamp-2 text-[12.5px] text-gray-500">
              {bootcamp.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11.5px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> {bootcamp.total_lessons || 0}{' '}
            lessons
          </span>
          {bootcamp.total_duration > 0 && (
            <>
              <span className="text-gray-700">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />{' '}
                {formatDuration(bootcamp.total_duration)}
              </span>
            </>
          )}
        </div>

        {isPending ? (
          <div className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[13px] font-semibold text-amber-400">
            <HourglassIcon className="h-3.5 w-3.5" />
            Pending Approval
          </div>
        ) : (
          <button
            onClick={() => onEnroll(bootcamp.id)}
            disabled={isEnrolling}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-violet-500/20 transition-colors hover:bg-violet-400 disabled:opacity-50"
          >
            {isEnrolling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : needsApproval ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {isEnrolling
              ? needsApproval
                ? 'Requesting…'
                : 'Enrolling…'
              : needsApproval
                ? 'Request Access'
                : 'Enroll free'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function LearningCalendar({
  enrolledBootcamps,
  archivedBootcamps = [],
  courses = [],
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [courseFilter, setCourseFilter] = useState('all');

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const completedByDate = useMemo(() => {
    const map = {};
    const matches = (bootcampId) =>
      courseFilter === 'all' || bootcampId === courseFilter;
    // Active bootcamp completions — lessons are clickable
    enrolledBootcamps.forEach(({ bootcamp, enrollment }) => {
      if (!matches(bootcamp.id)) return;
      const progress = enrollment?.progressData?.lessonProgress || {};
      Object.values(progress).forEach((p) => {
        if (p.is_completed && p.completed_at) {
          const d = new Date(p.completed_at);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          if (!map[key]) map[key] = { count: 0, lessons: [] };
          map[key].count += 1;
          map[key].lessons.push({
            title: p.lesson_title || 'Lesson',
            bootcampTitle: bootcamp.title,
            href: `/account/member/bootcamps/${bootcamp.id}/${p.lesson_id}`,
          });
        }
      });
    });
    // Archived bootcamp completions — no lesson links (content inaccessible)
    archivedBootcamps.forEach(({ bootcamp, enrollment }) => {
      if (!matches(bootcamp.id)) return;
      const progress = enrollment?.progressData?.lessonProgress || {};
      Object.values(progress).forEach((p) => {
        if (p.is_completed && p.completed_at) {
          const d = new Date(p.completed_at);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          if (!map[key]) map[key] = { count: 0, lessons: [] };
          map[key].count += 1;
          map[key].lessons.push({
            title: p.lesson_title || 'Lesson',
            bootcampTitle: bootcamp.title,
            archived: true,
          });
        }
      });
    });
    return map;
  }, [enrolledBootcamps, archivedBootcamps, courseFilter]);

  const getIntensityClass = (count, isToday) => {
    if (count === 0)
      return isToday
        ? 'bg-violet-500/10 border-violet-500/40 text-violet-300 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]'
        : 'bg-white/5 border-transparent text-gray-600 hover:border-white/10 hover:bg-white/5';
    if (count === 1)
      return 'bg-violet-500/30 text-white border-violet-500/10 hover:bg-violet-500/40';
    if (count === 2)
      return 'bg-violet-500/60 text-white border-violet-500/20 hover:bg-violet-500/70';
    return 'bg-violet-500 text-white border-violet-500 shadow-[0_4px_10px_rgba(139,92,246,0.25)] hover:bg-violet-400';
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/2 p-5 shadow-sm md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Calendar className="h-5 w-5 text-violet-400" />
            Learning Activity
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Your monthly completion heatmap
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {courses.length > 0 && (
            <CourseFilterMenu
              courses={courses}
              value={courseFilter}
              onChange={setCourseFilter}
            />
          )}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-gray-500 transition-all hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="w-28 text-center text-sm font-semibold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-gray-500 transition-all hover:bg-white/5 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-3 grid grid-cols-7 gap-2 sm:gap-3">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold tracking-wider text-gray-600 uppercase"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="aspect-square rounded-xl" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
            const entry = completedByDate[key];
            const count = entry?.count || 0;
            const lessons = entry?.lessons || [];
            const isToday =
              new Date().toDateString() ===
              new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
              ).toDateString();
            return (
              <div
                key={i}
                className={cn(
                  'group relative flex aspect-square cursor-default items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-300',
                  getIntensityClass(count, isToday)
                )}
              >
                {day}
                {isToday && count === 0 && (
                  <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-violet-500/60" />
                )}
                {count > 0 && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 origin-bottom -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
                    <div className="max-w-[240px] min-w-[160px] rounded-xl border border-white/10 bg-zinc-800 p-3 text-xs text-white shadow-xl">
                      <p className="mb-2 font-semibold text-gray-400">
                        {count} lesson{count > 1 ? 's' : ''} completed
                      </p>
                      <ul className="space-y-1.5">
                        {lessons.map((l, li) => (
                          <li key={li}>
                            {l.archived ? (
                              <div className="flex items-start gap-1.5 text-gray-400">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-500" />
                                <span className="line-clamp-2 leading-snug">
                                  {l.title}
                                  {l.bootcampTitle && (
                                    <span className="mt-0.5 block text-[10px] text-gray-600">
                                      {l.bootcampTitle} · archived
                                    </span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <Link
                                href={l.href}
                                className="flex items-start gap-1.5 text-violet-300 transition-colors hover:text-violet-100"
                              >
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                                <span className="line-clamp-2 leading-snug">
                                  {l.title}
                                </span>
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="absolute top-full left-1/2 -mt-1 -translate-x-1/2 border-4 border-transparent border-t-[#1a1d27]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mx-auto mt-8 flex w-fit items-center justify-center gap-2 rounded-full border border-white/10 bg-white/2 px-4 py-2 text-xs font-medium text-gray-600">
          <span>Less</span>
          <div className="mx-1 flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded-sm border border-transparent bg-white/5" />
            <div className="h-3.5 w-3.5 rounded-sm border border-violet-500/10 bg-violet-500/30" />
            <div className="h-3.5 w-3.5 rounded-sm border border-violet-500/20 bg-violet-500/60" />
            <div className="h-3.5 w-3.5 rounded-sm border border-violet-500 bg-violet-500" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

const WATCH_PRESETS = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: '6month', label: '6 Mo' },
  { id: 'year', label: '1 Yr' },
  { id: 'custom', label: 'Custom' },
];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildWatchChartData(learningActivity, preset, customFrom, customTo) {
  const now = new Date();

  let from, to, groupBy;
  if (preset === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    groupBy = 'day';
  } else if (preset === 'month') {
    from = new Date(now);
    from.setDate(now.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    groupBy = 'week';
  } else if (preset === '6month') {
    from = new Date(now);
    from.setMonth(now.getMonth() - 5);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    groupBy = 'month';
  } else if (preset === 'year') {
    from = new Date(now);
    from.setMonth(now.getMonth() - 11);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    groupBy = 'month';
  } else {
    from = customFrom
      ? new Date(customFrom + 'T00:00:00')
      : new Date(now.getFullYear(), now.getMonth(), 1);
    to = customTo ? new Date(customTo + 'T23:59:59') : new Date(now);
    const diffDays = Math.ceil((to - from) / 86400000);
    groupBy = diffDays <= 31 ? 'day' : diffDays <= 120 ? 'week' : 'month';
  }

  const MONTH_ABBR = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build buckets
  const buckets = {};
  if (groupBy === 'day') {
    const cur = new Date(from);
    while (cur <= to) {
      buckets[toDateStr(cur)] = {
        name: DAY_ABBR[cur.getDay()],
        duration: 0,
        lessons: [],
      };
      cur.setDate(cur.getDate() + 1);
    }
  } else if (groupBy === 'week') {
    // Weeks: Mon-Sun buckets
    const cur = new Date(from);
    let weekNum = 0;
    while (cur <= to) {
      const key = `w${weekNum}`;
      const endOfWeek = new Date(cur);
      endOfWeek.setDate(cur.getDate() + 6);
      const label = `${cur.getDate()} ${MONTH_ABBR[cur.getMonth()]}`;
      buckets[key] = {
        name: label,
        start: new Date(cur),
        end: new Date(Math.min(endOfWeek, to)),
        duration: 0,
        lessons: [],
      };
      cur.setDate(cur.getDate() + 7);
      weekNum++;
    }
  } else {
    // Month buckets
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cur <= to) {
      const key = `${cur.getFullYear()}-${cur.getMonth()}`;
      buckets[key] = {
        name: MONTH_ABBR[cur.getMonth()],
        year: cur.getFullYear(),
        month: cur.getMonth(),
        duration: 0,
        lessons: [],
      };
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  // Fill buckets from learning_activity_daily rows.
  // Accumulate as seconds, convert to minutes at the end — otherwise rows with
  // <30s are silently rounded to 0 minutes and dropped.
  learningActivity.forEach((row) => {
    const d = new Date(row.activity_date + 'T00:00:00');
    if (d < from || d > to) return;
    const secs = Math.max(0, Number(row.watch_time) || 0);
    const lessons = row.completed_lessons || [];
    const addToBucket = (b) => {
      if (secs > 0) b.duration += secs;
      lessons.forEach((l) => {
        if (!b.lessons.some((x) => x.id === l.id)) b.lessons.push(l);
      });
    };
    if (groupBy === 'day') {
      const k = row.activity_date;
      if (buckets[k]) addToBucket(buckets[k]);
    } else if (groupBy === 'week') {
      for (const b of Object.values(buckets)) {
        if (d >= b.start && d <= b.end) {
          addToBucket(b);
          break;
        }
      }
    } else {
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (buckets[k]) addToBucket(buckets[k]);
    }
  });

  // `duration` is seconds — formatters and tooltip handle display.
  return Object.values(buckets);
}

function CourseFilterMenu({ courses, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const selected = courses.find((c) => c.id === value);
  const label = selected ? selected.title : 'All courses';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'inline-flex max-w-[160px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
          open
            ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
            : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/10 hover:text-white'
        )}
      >
        <Layers className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-1.5 max-h-64 max-w-[260px] min-w-[200px] overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl"
        >
          <button
            role="menuitemradio"
            aria-checked={value === 'all'}
            onClick={() => {
              onChange('all');
              setOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs font-medium transition-colors',
              value === 'all'
                ? 'text-violet-300'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <span className="truncate">All courses</span>
            {value === 'all' && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
          {courses.map((c) => {
            const active = value === c.id;
            return (
              <button
                key={c.id}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs font-medium transition-colors',
                  active
                    ? 'text-violet-300'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <span className="truncate">{c.title}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WatchTimeChart({ learningActivity, courses = [] }) {
  const [preset, setPreset] = useState('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const filteredActivity = useMemo(
    () =>
      courseFilter === 'all'
        ? learningActivity
        : learningActivity.filter((r) => r.bootcamp_id === courseFilter),
    [learningActivity, courseFilter]
  );
  const chartData = useMemo(
    () => buildWatchChartData(filteredActivity, preset, customFrom, customTo),
    [filteredActivity, preset, customFrom, customTo]
  );

  // chartData.duration is in SECONDS
  const totalSecs = chartData.reduce((s, d) => s + d.duration, 0);
  const activeDays = chartData.filter((d) => d.duration > 0).length;
  const avgSecs = activeDays > 0 ? Math.round(totalSecs / activeDays) : 0;
  const topBar = chartData.reduce((a, b) => (b.duration > a.duration ? b : a), {
    name: '-',
    duration: 0,
  });

  const presetLabel = {
    week: "This week's effort",
    month: 'Last 30 days',
    '6month': 'Last 6 months',
    year: 'Last 12 months',
    custom:
      customFrom && customTo
        ? `${customFrom} → ${customTo}`
        : 'Select date range',
  }[preset];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const { lessons = [] } = payload[0].payload;
    return (
      <div className="max-w-72 min-w-48 rounded-xl border border-white/10 bg-zinc-900 p-3 shadow-xl">
        <p className="mb-2 text-[10px] font-medium tracking-widest text-gray-500 uppercase">
          {label}
        </p>
        {lessons.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {lessons.map((l) => (
              <div
                key={l.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex min-w-0 items-start gap-1.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  <span className="text-xs leading-tight text-gray-300">
                    {l.title}
                  </span>
                </div>
                {l.watch_time > 0 && (
                  <span className="shrink-0 text-xs font-semibold whitespace-nowrap text-violet-400">
                    {formatWatchSeconds(l.watch_time)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <div
          className={`flex items-center justify-between gap-4 ${lessons.length > 0 ? 'border-t border-white/10 pt-2' : ''}`}
        >
          <span className="text-[10px] tracking-widest text-gray-500 uppercase">
            Watch time
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-violet-400">
            <Clock className="h-3 w-3" />
            {formatWatchSeconds(payload[0].value) || '0s'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/2 p-5 shadow-sm md:p-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Watch Time
          </h3>
          <p className="text-sm text-gray-500">{presetLabel}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-300">
            {formatWatchSeconds(totalSecs) || '0m'}
          </div>
          {courses.length > 0 && (
            <CourseFilterMenu
              courses={courses}
              value={courseFilter}
              onChange={setCourseFilter}
            />
          )}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                menuOpen
                  ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/10 hover:text-white'
              )}
            >
              <span>
                {WATCH_PRESETS.find((p) => p.id === preset)?.label || 'Range'}
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  menuOpen && 'rotate-180'
                )}
              />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute top-full right-0 z-20 mt-1.5 min-w-[140px] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl"
              >
                {WATCH_PRESETS.map((p) => {
                  const active = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        setPreset(p.id);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'text-violet-300'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span>{p.label}</span>
                      {active && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom date inputs */}
      {preset === 'custom' && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="min-w-[130px] flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:border-violet-500/40 focus:outline-none"
          />
          <span className="shrink-0 text-xs text-gray-600">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="min-w-[130px] flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:border-violet-500/40 focus:outline-none"
          />
        </div>
      )}

      <div className="min-h-[160px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            barSize={Math.max(
              8,
              Math.min(32, Math.floor(320 / Math.max(chartData.length, 1)))
            )}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#1e2535"
              opacity={0.8}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }}
              dy={10}
              interval={chartData.length > 12 ? 'preserveStartEnd' : 0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(v) =>
                v >= 60 ? `${Math.round(v / 60)}m` : `${v}s`
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(139,92,246,0.05)' }}
            />
            <Bar dataKey="duration" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.duration > 3600 ? '#a855f7' : '#8b5cf6'}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col rounded-xl border border-white/10 bg-white/2 p-3.5">
          <span className="mb-1 text-xs font-medium text-gray-500">
            Avg / active day
          </span>
          <span className="text-lg font-bold text-white">
            {formatWatchSeconds(avgSecs) || '0s'}
          </span>
        </div>
        <div className="flex flex-col rounded-xl border border-white/10 bg-white/2 p-3.5">
          <span className="mb-1 text-xs font-medium text-gray-500">
            Top Period
          </span>
          <span className="text-lg font-bold text-white">
            {topBar.duration > 0 ? topBar.name : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({
  user,
  enrolledBootcamps,
  archivedBootcamps,
  totalLessonsCompleted,
  streak,
  availableBootcamps,
  learningActivity,
  onTab,
}) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const continueBootcamp =
    enrolledBootcamps.find((e) => {
      const total = e.bootcamp?.total_lessons || 0;
      const done = e.enrollment?.completed_lessons || 0;
      return total === 0 || done < total;
    }) || enrolledBootcamps[0];

  const courses = useMemo(() => {
    const seen = new Set();
    const list = [];
    [...enrolledBootcamps, ...archivedBootcamps].forEach(({ bootcamp }) => {
      if (!bootcamp?.id || seen.has(bootcamp.id)) return;
      seen.add(bootcamp.id);
      list.push({ id: bootcamp.id, title: bootcamp.title });
    });
    return list;
  }, [enrolledBootcamps, archivedBootcamps]);

  const stats = [
    {
      title: 'Enrolled Courses',
      value: String(enrolledBootcamps.length),
      icon: BookOpen,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    {
      title: 'Lessons Completed',
      value: String(totalLessonsCompleted),
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Current Streak',
      value: `${streak} ${streak === 1 ? 'Day' : 'Days'}`,
      icon: Flame,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
  ];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      initial="hidden"
      animate="show"
      className="space-y-8 p-1"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
          },
        }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-violet-300">{firstName}!</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base">
            {enrolledBootcamps.length === 0
              ? 'Pick a bootcamp from the catalog to get started.'
              : "You're making great progress. Keep up the momentum."}
          </p>
        </div>
        <button
          onClick={() => onTab('catalog')}
          className="flex w-fit items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition-all hover:border-violet-500/30 hover:bg-violet-500/20"
        >
          <Sparkles className="h-4 w-4" />
          Browse new bootcamps
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
          },
        }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20"
          >
            <div
              className={cn(
                'pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-70',
                stat.bg
              )}
            />
            <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
                {stat.title}
              </span>
              <div
                className={cn(
                  'rounded-lg border p-2 ring-1 ring-white/10',
                  stat.bg,
                  stat.border
                )}
              >
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>
            <div className="relative z-10 text-3xl font-bold text-white tabular-nums">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Calendar + Watch Time */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
          },
        }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <div className="flex h-full flex-col">
          <LearningCalendar
            enrolledBootcamps={enrolledBootcamps}
            archivedBootcamps={archivedBootcamps}
            courses={courses}
          />
        </div>
        <div className="flex h-full flex-col">
          <WatchTimeChart
            learningActivity={learningActivity}
            courses={courses}
          />
        </div>
      </motion.div>

      {/* Pick up where you left off */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
          },
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Pick up where you left off
          </h2>
          {enrolledBootcamps.length > 1 && (
            <button
              onClick={() => onTab('mylearning')}
              className="text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
            >
              View all
            </button>
          )}
        </div>

        {continueBootcamp ? (
          <Link
            href={`/account/member/bootcamps/${continueBootcamp.bootcamp.id}`}
            className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-2 shadow-lg shadow-black/30 backdrop-blur-xl transition-all hover:border-violet-500/40 hover:bg-zinc-900/70"
          >
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 opacity-60 blur-[80px] transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-0 bg-linear-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 flex flex-col gap-6 p-4 md:flex-row">
              <div className="relative hidden h-40 w-64 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-linear-to-br from-indigo-950 to-slate-900 md:block">
                {continueBootcamp.bootcamp.thumbnail ? (
                  <SafeImg
                    src={continueBootcamp.bootcamp.thumbnail}
                    alt={continueBootcamp.bootcamp.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    {continueBootcamp.bootcamp.difficulty_level && (
                      <span className="mb-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                        {continueBootcamp.bootcamp.difficulty_level}
                      </span>
                    )}
                    <span className="text-sm leading-tight font-bold text-white/90">
                      {continueBootcamp.bootcamp.title}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center space-y-5">
                <div>
                  <span className="mb-1 block text-xs font-semibold tracking-wide text-violet-400 uppercase">
                    {timeAgo(continueBootcamp.enrollment?.last_accessed_at)
                      ? `Last active: ${timeAgo(continueBootcamp.enrollment.last_accessed_at)}`
                      : 'Start learning'}
                  </span>
                  <h3 className="text-xl font-bold text-white transition-colors group-hover:text-violet-300 md:text-2xl">
                    {continueBootcamp.bootcamp.title}
                  </h3>
                </div>
                <div className="max-w-md space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-white">
                      {continueBootcamp.enrollment?.progress_percent || 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="relative h-full overflow-hidden rounded-full bg-violet-500 transition-all duration-500"
                      style={{
                        width: `${continueBootcamp.enrollment?.progress_percent || 0}%`,
                      }}
                    >
                      <div className="absolute inset-0 animate-pulse bg-white/20" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />{' '}
                      {continueBootcamp.enrollment?.completed_lessons || 0}/
                      {continueBootcamp.bootcamp?.total_lessons || 0} lessons
                    </span>
                    {continueBootcamp.bootcamp?.total_duration > 0 && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-gray-600" />
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />{' '}
                          {formatDuration(
                            continueBootcamp.bootcamp.total_duration
                          )}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-300 group-hover:bg-violet-500 group-hover:text-white">
                    <PlayCircle className="h-4 w-4" />
                    {(continueBootcamp.enrollment?.completed_lessons || 0) > 0
                      ? 'Resume Course'
                      : 'Start Course'}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <EmptyState
            title="No enrollments yet"
            description="Browse the catalog and enroll in a bootcamp to start learning."
            action={
              <button
                onClick={() => onTab('catalog')}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-violet-400"
              >
                <BookOpen className="h-3.5 w-3.5" /> Browse catalog
              </button>
            }
          />
        )}
      </motion.div>
    </motion.div>
  );
}

function CatalogCardLite({ bootcamp, onTab }) {
  return (
    <button
      onClick={() => onTab('catalog')}
      className="group flex gap-3 rounded-xl border border-white/10 bg-white/2 p-3 text-left transition-colors hover:border-violet-500/30 hover:bg-white/5"
    >
      <Thumbnail bootcamp={bootcamp} size="sm" />
      <div className="min-w-0 flex-1">
        {bootcamp.difficulty_level && (
          <span className="inline-block rounded bg-violet-500/10 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider text-violet-300 uppercase ring-1 ring-violet-500/20">
            {bootcamp.difficulty_level}
          </span>
        )}
        <h3 className="mt-1.5 line-clamp-2 text-[13.5px] font-semibold text-white transition-colors group-hover:text-violet-300">
          {bootcamp.title}
        </h3>
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-gray-500">
          <BookOpen className="h-3 w-3" /> {bootcamp.total_lessons || 0} lessons
        </div>
      </div>
    </button>
  );
}

function MyLearningEnrolledRow({ bootcamp, enrollment }) {
  const progress = enrollment?.progress_percent || 0;
  const completedLessons = enrollment?.completed_lessons || 0;
  const totalLessons = bootcamp?.total_lessons || 0;
  const remaining = Math.max(0, totalLessons - completedLessons);
  const lastOpened = timeAgo(enrollment?.last_accessed_at);
  const duration = formatDuration(bootcamp?.total_duration);
  const isComplete = totalLessons > 0 && remaining === 0;

  return (
    <Link
      href={`/account/member/bootcamps/${bootcamp.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-1 shadow-lg shadow-black/30 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:bg-zinc-900/70"
    >
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/[0.08] opacity-0 blur-[60px] transition-opacity group-hover:opacity-100" />
      <div className="absolute inset-0 bg-linear-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative z-10 flex flex-col gap-6 p-5 md:flex-row">
        <div className="flex flex-1 flex-col justify-center space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl leading-tight font-semibold text-white transition-colors group-hover:text-violet-300">
              {bootcamp.title}
            </h3>
            <span
              className={cn(
                'shrink-0 text-xs font-medium',
                lastOpened ? 'text-violet-400' : 'text-gray-500'
              )}
            >
              {lastOpened
                ? `Last active: ${lastOpened.toLowerCase()}`
                : 'Not started'}
            </span>
          </div>

          <div className="flex w-fit gap-4 rounded-lg border border-white/10 bg-white/2 px-3 py-1.5 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-500" />{' '}
              <span className="font-medium text-white">{totalLessons}</span>{' '}
              lessons
            </div>
            {duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-sky-500" />{' '}
                <span className="font-medium text-white">{duration}</span>
              </div>
            )}
            {bootcamp.difficulty_level && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-violet-400">
                  {bootcamp.difficulty_level}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                {completedLessons}/{totalLessons} lessons completed
              </span>
              <span className="font-medium text-white">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="relative h-full overflow-hidden rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              >
                {!isComplete && (
                  <div className="absolute inset-0 animate-pulse bg-white/20" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                {isComplete
                  ? 'All done!'
                  : `${remaining} lessons left${duration ? ` · ${duration}` : ''}`}
              </span>
            </div>
            <span className="flex items-center gap-1.5 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-gray-900 transition-colors group-hover:bg-violet-500 group-hover:text-white">
              <PlayCircle className="h-4 w-4" />
              {isComplete
                ? 'Review'
                : completedLessons > 0
                  ? 'Resume'
                  : 'Start'}
            </span>
          </div>
        </div>

        <div className="relative hidden h-40 w-[280px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-linear-to-br from-indigo-950 to-slate-900 md:block">
          {bootcamp.thumbnail ? (
            <SafeImg
              src={bootcamp.thumbnail}
              alt={bootcamp.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              {bootcamp.difficulty_level && (
                <span className="mb-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                  {bootcamp.difficulty_level}
                </span>
              )}
              <span className="text-sm leading-tight font-bold text-white/90">
                {bootcamp.title}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function MyLearningTab({
  enrolledBootcamps,
  archivedBootcamps = [],
  filteredEnrolled,
  search,
  setSearch,
  onTab,
}) {
  const inProgress = filteredEnrolled.filter(({ bootcamp, enrollment }) => {
    const total = bootcamp?.total_lessons || 0;
    const done = enrollment?.completed_lessons || 0;
    return total === 0 || done < total;
  });
  const completed = filteredEnrolled.filter(({ bootcamp, enrollment }) => {
    const total = bootcamp?.total_lessons || 0;
    const done = enrollment?.completed_lessons || 0;
    return total > 0 && done >= total;
  });

  const allCompleted = enrolledBootcamps.filter(({ bootcamp, enrollment }) => {
    const total = bootcamp?.total_lessons || 0;
    const done = enrollment?.completed_lessons || 0;
    return total > 0 && done >= total;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-1"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            My Learning
          </h1>
          <p className="mt-1 text-gray-500">
            {enrolledBootcamps.length} bootcamp
            {enrolledBootcamps.length !== 1 ? 's' : ''} enrolled ·{' '}
            {allCompleted.length} completed
          </p>
        </div>
        {enrolledBootcamps.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my bootcamps..."
              className="h-9 w-full rounded-md border border-white/10 bg-white/5 pr-4 pl-9 text-sm text-white transition-all placeholder:text-gray-600 focus:border-transparent focus:ring-1 focus:ring-violet-500 focus:outline-none md:w-64"
            />
          </div>
        )}
      </div>

      {enrolledBootcamps.length === 0 ? (
        <EmptyState
          title="No enrollments yet"
          description="Enroll in a bootcamp to start tracking your progress."
          action={
            <button
              onClick={() => onTab('catalog')}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-violet-400"
            >
              <BookOpen className="h-3.5 w-3.5" /> Browse catalog
            </button>
          }
        />
      ) : filteredEnrolled.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No matches for "${search}"`}
          action={
            <button
              onClick={() => setSearch('')}
              className="text-[12px] text-violet-400 hover:text-violet-300"
            >
              Clear search
            </button>
          }
        />
      ) : (
        <>
          {inProgress.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                In Progress
              </h2>
              <div className="space-y-4">
                {inProgress.map(({ bootcamp, enrollment }) => (
                  <MyLearningEnrolledRow
                    key={bootcamp.id}
                    bootcamp={bootcamp}
                    enrollment={enrollment}
                  />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Completed Courses
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {completed.map(({ bootcamp, enrollment }) => (
                  <MyLearningCompletedCard
                    key={bootcamp.id}
                    bootcamp={bootcamp}
                    enrollment={enrollment}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Past / Archived Bootcamps */}
      {archivedBootcamps.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Past Bootcamps
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-600">
              {archivedBootcamps.length}
            </span>
          </div>
          <p className="-mt-2 text-sm text-gray-500">
            These batches have ended. Your progress is preserved but the content
            is no longer accessible.
          </p>
          <div className="space-y-3">
            {archivedBootcamps.map(({ bootcamp, enrollment }) => {
              const completedLessons = enrollment?.completed_lessons || 0;
              const totalLessons = bootcamp?.total_lessons || 0;
              const progress =
                totalLessons > 0
                  ? Math.round((completedLessons / totalLessons) * 100)
                  : 0;
              const enrolledDate = enrollment?.enrolled_at
                ? new Date(enrollment.enrolled_at).toLocaleDateString(
                    undefined,
                    { month: 'short', year: 'numeric' }
                  )
                : null;
              return (
                <div
                  key={bootcamp.id}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/2 p-4 opacity-75"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    {bootcamp.thumbnail ? (
                      <SafeImg
                        src={bootcamp.thumbnail}
                        alt={bootcamp.title}
                        className="h-full w-full object-cover grayscale"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Archive className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-gray-300">
                        {bootcamp.title}
                      </h3>
                      {bootcamp.batch_info && (
                        <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                          {bootcamp.batch_info}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>
                        {completedLessons}/{totalLessons} lessons
                      </span>
                      {enrolledDate && <span>· Enrolled {enrolledDate}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gray-600"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] text-gray-600">
                        {progress}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MyLearningCompletedCard({ bootcamp, enrollment }) {
  const completedDate = enrollment?.completed_at
    ? new Date(enrollment.completed_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/account/member/bootcamps/${bootcamp.id}`}
      className="group relative block cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/2 shadow-sm transition-all hover:border-violet-500/50"
    >
      <div className="relative h-32 w-full border-b border-white/10 bg-white/2">
        {bootcamp.thumbnail ? (
          <SafeImg
            src={bootcamp.thumbnail}
            alt={bootcamp.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-indigo-950 to-slate-900 p-4 text-center">
            {bootcamp.difficulty_level && (
              <span className="mb-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                {bootcamp.difficulty_level}
              </span>
            )}
            <span className="text-sm leading-tight font-bold text-white/90">
              {bootcamp.title}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-4 p-5">
        <h3 className="line-clamp-2 text-lg leading-tight font-semibold text-white transition-colors group-hover:text-violet-300">
          {bootcamp.title}
        </h3>

        <div className="mt-1 flex gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-emerald-500/70" />{' '}
            {bootcamp.total_lessons || 0} lessons
          </div>
          {bootcamp.total_duration > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-sky-500/70" />{' '}
              {formatDuration(bootcamp.total_duration)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 text-sm">
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-500">
            <CheckCircle className="h-3.5 w-3.5" />
            Completed
          </div>
          {completedDate && (
            <span className="text-xs font-semibold text-gray-500">
              {completedDate}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CatalogTab({
  availableBootcamps,
  filteredAvailable,
  search,
  setSearch,
  handleEnroll,
  enrollingId,
  enrollmentMap,
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Catalog
          </h1>
          <p className="mt-1 text-[13.5px] text-gray-500">
            {availableBootcamps.length} bootcamp
            {availableBootcamps.length === 1 ? '' : 's'} available to enroll
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search catalog…"
        />
      </div>

      {availableBootcamps.length === 0 ? (
        <EmptyState
          title="You're enrolled in everything"
          description="Check back later for new bootcamps."
        />
      ) : filteredAvailable.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No matches for "${search}"`}
          action={
            <button
              onClick={() => setSearch('')}
              className="text-[12px] text-violet-400 hover:text-violet-300"
            >
              Clear search
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAvailable.map((b) => (
            <CatalogCard
              key={b.id}
              bootcamp={b}
              onEnroll={handleEnroll}
              isEnrolling={enrollingId === b.id}
              pendingEnrollment={enrollmentMap?.[b.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

const DIFF_COLOR = {
  easy: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  hard: 'text-rose-400 bg-rose-500/10 ring-rose-500/20',
};

const SUB_STATUS_STYLE = {
  pending:
    'text-amber-400 bg-amber-500/10 ring-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]',
  completed:
    'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]',
  accepted:
    'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]',
  late: 'text-rose-400 bg-rose-500/10 ring-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.05)]',
  'redo action required':
    'text-orange-400 bg-orange-500/10 ring-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.05)]',
  'bonus deserved':
    'text-violet-400 bg-violet-500/10 ring-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.05)]',
};

function TaskStepper({ task, sub }) {
  const isAssigned = true;
  const isSubmitted = !!sub;
  const isGraded = sub?.points_earned != null || !!sub?.feedback;
  const isRedo = sub?.status === 'redo action required';

  const availableDate = task.start_time || task.created_at;
  const steps = [
    {
      label: 'Available',
      active: isAssigned,
      desc: availableDate
        ? fmtDhaka(availableDate, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : 'Active',
    },
    {
      label: isSubmitted ? 'Submitted' : 'Pending',
      active: isSubmitted,
      desc: sub?.submitted_at
        ? new Date(sub.submitted_at).toLocaleDateString()
        : 'Awaiting solution',
    },
    {
      label: isRedo ? 'Redo Required' : isGraded ? 'Graded' : 'Assessment',
      active: isGraded || isSubmitted,
      desc: isRedo
        ? 'Action needed'
        : isGraded
          ? `${sub.points_earned} pts`
          : isSubmitted
            ? 'Under Review'
            : 'Awaiting grading',
    },
  ];

  return (
    <div className="mb-5 rounded-2xl border border-white/5 bg-zinc-950/20 p-4.5 shadow-inner select-none">
      <div className="relative mx-auto flex max-w-lg items-center justify-between gap-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="group relative z-10 flex flex-1 flex-col items-center text-center"
          >
            {/* Connector Line */}
            {idx > 0 && (
              <div className="absolute top-4.5 right-1/2 -left-1/2 -z-10 h-0.5">
                <div
                  className={cn(
                    'h-full transition-all duration-700 ease-in-out',
                    steps[idx].active
                      ? 'bg-linear-to-r from-violet-500 to-indigo-500'
                      : 'bg-white/5'
                  )}
                />
              </div>
            )}

            {/* Step Node */}
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-all duration-500',
                step.active
                  ? idx === 2 && isRedo
                    ? 'text-rose-450 scale-105 border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'to-indigo-650 scale-105 border-violet-500 bg-linear-to-br from-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'border-white/10 bg-zinc-900 text-gray-600'
              )}
            >
              {idx === 0 ? (
                <Calendar className="h-4.5 w-4.5" />
              ) : idx === 1 ? (
                <Upload className="h-4.5 w-4.5" />
              ) : isRedo ? (
                <AlertCircle className="h-4.5 w-4.5 animate-pulse" />
              ) : isGraded ? (
                <Trophy className="h-4.5 w-4.5 text-amber-300" />
              ) : (
                <HourglassIcon className="h-4.5 w-4.5" />
              )}
            </div>

            {/* Labels */}
            <p
              className={cn(
                'mt-2.5 text-[10.5px] font-black tracking-wider uppercase transition-colors',
                step.active ? 'text-white' : 'text-gray-550'
              )}
            >
              {step.label}
            </p>
            <p className="mt-0.5 font-mono text-[9.5px] text-gray-500">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onSubmitted, focusId }) {
  const isFocused = focusId === `task-${task.id}`;
  const cardRef = useRef(null);
  const [open, setOpen] = useState(isFocused);
  const [content, setContent] = useState(
    () =>
      task.mySubmission?.notes ||
      JSON.stringify([
        { id: crypto.randomUUID(), type: 'richText', content: '' },
      ])
  );
  const [attachments, setAttachments] = useState(() =>
    Array.isArray(task.mySubmission?.attachments)
      ? task.mySubmission.attachments
      : []
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const sub = task.mySubmission;
  const isRedo = sub?.status === 'redo action required';
  const canSubmit = !sub || isRedo;
  const isPastDue = task.deadline && new Date(task.deadline) < new Date();

  // Scroll a deep-linked task into view once it mounts (after async load).
  useEffect(() => {
    if (!isFocused || !cardRef.current) return;
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(t);
  }, [isFocused]);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setError('');
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadTaskAttachmentAction(fd);
      if (res.error) {
        setError(res.error);
        continue;
      }
      uploaded.push({
        url: res.url,
        name: res.name,
        size: res.size,
        type: res.type,
      });
    }
    setAttachments((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData();
    fd.set('task_id', task.id);
    fd.set('submission_url', '');
    fd.set('notes', content);
    fd.set('attachments', JSON.stringify(attachments));
    const result = await submitTaskAction(fd);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSubmitted(task.id, result.data);
  };

  const diffAccent = {
    easy: {
      border: 'border-l-[3.5px] border-l-emerald-500/85',
      glow: 'hover:shadow-[0_4px_24px_rgba(16,185,129,0.04)] border-emerald-500/10',
    },
    medium: {
      border: 'border-l-[3.5px] border-l-amber-500/85',
      glow: 'hover:shadow-[0_4px_24px_rgba(245,158,11,0.04)] border-amber-500/10',
    },
    hard: {
      border: 'border-l-[3.5px] border-l-rose-500/85',
      glow: 'hover:shadow-[0_4px_24px_rgba(244,63,94,0.04)] border-rose-500/10',
    },
  };
  const activeDiff = diffAccent[task.difficulty] || {
    border: 'border-l-[3.5px] border-l-gray-500/50',
    glow: '',
  };

  return (
    <div
      ref={cardRef}
      id={`task-${task.id}`}
      className={cn(
        'relative scroll-mt-24 overflow-hidden rounded-2xl border bg-zinc-900/40 backdrop-blur-xl transition-all duration-300',
        open
          ? 'animate-none border-violet-500/30 bg-zinc-900/60 shadow-[0_0_24px_rgba(139,92,246,0.06)]'
          : cn(
              'border-white/5 hover:border-white/20 hover:bg-zinc-900/60',
              activeDiff.glow
            ),
        isFocused && 'ring-2 ring-violet-500/60 ring-offset-2 ring-offset-zinc-950',
        activeDiff.border
      )}
    >
      <button
        className="group flex w-full items-center gap-3.5 px-5 py-4.5 text-left select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={cn(
            'shrink-0 rounded px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest uppercase ring-1',
            DIFF_COLOR[task.difficulty] ??
              'text-gray-450 bg-white/5 ring-white/10'
          )}
        >
          {task.difficulty}
        </span>
        <span className="flex-1 truncate text-[14px] font-bold text-white/95 transition-colors group-hover:text-white">
          {task.title}
        </span>
        <span className="shrink-0 rounded border border-white/5 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest text-gray-500 uppercase">
          {task.bootcampTitle?.split(':')[0]}
        </span>
        {task.points != null && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10.5px] font-black text-amber-400">
            <Trophy className="h-3 w-3 text-amber-400" /> {task.points} pts
          </span>
        )}
        {task.start_time && (
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] font-semibold text-gray-600">
            <Calendar className="h-3 w-3 opacity-60" />
            {fmtDhaka(task.start_time, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
        {task.deadline && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-bold',
              isPastDue && !sub ? 'text-rose-400' : 'text-gray-500'
            )}
          >
            <Clock className="h-3.5 w-3.5 opacity-60" />
            {fmtDhaka(task.deadline, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
        {sub ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-black tracking-widest uppercase ring-1',
              SUB_STATUS_STYLE[sub.status] ??
                'bg-white/5 text-gray-400 ring-white/10'
            )}
          >
            {sub.status}
          </span>
        ) : (
          <span className="text-gray-550 shrink-0 rounded-full bg-white/2 px-2.5 py-0.5 font-mono text-[9px] font-black tracking-widest uppercase ring-1 ring-white/[0.05]">
            not submitted
          </span>
        )}
        <ChevronDown
          className={cn(
            'text-gray-555 h-4 w-4 shrink-0 transition-transform duration-300 group-hover:text-white',
            open ? 'rotate-180 text-violet-400 group-hover:text-violet-400' : ''
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 border-t border-white/5 bg-white/[0.01] px-6 pt-5 pb-6 text-left"
          >
            {/* Visual Lifecycle Stepper */}
            <TaskStepper task={task} sub={sub} />

            {task.description && (
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">
                  Task Details
                </p>
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4.5 text-[13px] leading-relaxed text-gray-300 shadow-inner">
                  <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-linear-to-b from-violet-500 to-indigo-500 opacity-60" />
                  <TaskDescriptionRenderer content={task.description} />
                </div>
              </div>
            )}

            {Array.isArray(task.problem_links) &&
              task.problem_links.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">
                    Problem Attachments
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                    {task.problem_links.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 rounded-xl border border-violet-500/10 bg-violet-500/[0.02] px-4 py-3 text-xs font-bold text-violet-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-violet-500/[0.08] active:scale-95"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 transition-all group-hover:scale-105">
                          <FileText className="h-4.5 w-4.5 text-violet-400" />
                        </div>
                        <span className="truncate">
                          Download Resource {i + 1}
                        </span>
                        <ArrowRight className="ml-auto h-3.5 w-3.5 text-violet-400/60 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {sub && (
              <div className="space-y-4 rounded-2xl border border-white/5 bg-black/20 p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <p className="text-[10.5px] font-extrabold tracking-widest text-gray-400 uppercase">
                      Your Submission
                    </p>
                  </div>
                  {sub.submitted_at && (
                    <span className="font-mono text-[10.5px] font-bold text-gray-500">
                      Submitted{' '}
                      {fmtDhaka(sub.submitted_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {sub.notes && (
                  <div className="rounded-xl border border-white/5 bg-black/35 p-4 text-[13px] leading-relaxed text-gray-300 shadow-inner">
                    <TaskDescriptionRenderer content={sub.notes} />
                  </div>
                )}
                {Array.isArray(sub.attachments) &&
                  sub.attachments.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9.5px] font-extrabold tracking-widest text-gray-500 uppercase">
                        Submitted Files
                      </p>
                      <AttachmentList files={sub.attachments} />
                    </div>
                  )}

                {/* Points earned — shown whenever the mentor has graded the submission */}
                {sub.points_earned != null && (
                  <div className="flex items-center gap-3.5 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] px-4.5 py-3.5 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 shadow-[0_2px_8px_rgba(245,158,11,0.05)] ring-1 ring-amber-500/20">
                      <Trophy
                        className="h-4.5 w-4.5 animate-bounce text-amber-400"
                        style={{ animationDuration: '3s' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-[9.5px] font-extrabold tracking-widest text-amber-500/80 uppercase">
                        Assessment Score
                      </p>
                      <p className="text-amber-350 mt-1 font-mono text-lg leading-none font-black">
                        {sub.points_earned}
                        {task.points != null && (
                          <span className="ml-1 text-[12px] font-bold text-amber-500/55">
                            / {task.points} max pts
                          </span>
                        )}
                      </p>
                    </div>
                    {task.points != null && sub.points_earned != null && (
                      <div className="shrink-0 rounded-xl border border-white/5 bg-white/2 px-3 py-1.5 text-right font-mono">
                        <p className="text-gray-550 text-[9px] font-extrabold tracking-widest uppercase">
                          Grade Pct
                        </p>
                        <p className="text-emerald-450 mt-0.5 text-[13px] font-black">
                          {Math.round((sub.points_earned / task.points) * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {sub.feedback && (
                  <div className="relative space-y-3 overflow-hidden rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] p-4.5 shadow-md">
                    <div className="bg-emerald-505 absolute top-0 bottom-0 left-0 w-0.5 opacity-40" />
                    {/* Header with mentor info */}
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-500/5 pb-2.5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-widest text-emerald-400 uppercase">
                        <Sparkles className="text-emerald-455 h-3.5 w-3.5 animate-pulse" />
                        Mentor Assessment Notes
                      </div>
                      {sub.reviewer && (
                        <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-950/20 px-2.5 py-1">
                          {sub.reviewer.avatar_url ? (
                            <img
                              src={sub.reviewer.avatar_url}
                              alt={sub.reviewer.full_name || 'Mentor'}
                              className="h-5 w-5 rounded-full object-cover ring-1 ring-emerald-500/30"
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                              {(sub.reviewer.full_name || 'M')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="max-w-[120px] truncate text-[10.5px] font-bold text-gray-300">
                            {sub.reviewer.full_name || 'Mentor'}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-350 text-[13px] leading-relaxed whitespace-pre-wrap">
                      {sub.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}

            {canSubmit && (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 border-t border-white/5 pt-4.5"
              >
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                    Your Solution / Explanatory Notes
                  </label>
                  <div className="bg-zinc-955/80 overflow-hidden rounded-xl border border-white/10 shadow-inner backdrop-blur-md transition-all focus-within:border-violet-500/35">
                    <MultiBlockEditor value={content} onChange={setContent} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                    Supporting Attachments
                  </label>
                  {attachments.length > 0 && (
                    <div className="mb-2 rounded-xl border border-white/5 bg-white/2 p-2.5">
                      <AttachmentList
                        files={attachments}
                        onRemove={(i) =>
                          setAttachments((prev) =>
                            prev.filter((_, j) => j !== i)
                          )
                        }
                      />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) =>
                      handleFiles(Array.from(e.target.files || []))
                    }
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-gray-350 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/2 px-4 py-4 text-[11.5px] font-bold transition-all duration-300 hover:border-violet-500/30 hover:bg-white/5 hover:text-white disabled:opacity-40"
                  >
                    {uploading ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-violet-400" />
                    ) : (
                      <Upload className="h-4.5 w-4.5 text-violet-400 transition-transform group-hover:-translate-y-0.5" />
                    )}
                    {uploading
                      ? 'Processing files…'
                      : 'Add Solution Files & Supporting Documents'}
                  </button>
                </div>
                {error && (
                  <p className="text-rose-455 text-[11.5px] font-semibold">
                    {error}
                  </p>
                )}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="from-violet-650 to-indigo-650 hover:from-violet-555 hover:to-indigo-555 flex items-center gap-2 rounded-xl bg-linear-to-r px-5.5 py-2.5 text-[12px] font-bold text-white shadow-md shadow-violet-600/10 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {loading
                      ? 'Submitting…'
                      : isRedo
                        ? 'Resubmit Solution'
                        : 'Submit Solution'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function TasksTab({ enrolledBootcamps, focusId }) {
  const [allTasks, setAllTasks] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [bootcampFilter, setBootcampFilter] = useState('all');

  useEffect(() => {
    if (!enrolledBootcamps.length) {
      setAllTasks([]);
      return;
    }
    Promise.all(
      enrolledBootcamps.map(({ bootcamp }) =>
        getMemberBootcampTasks(bootcamp.id)
          .then((tasks) =>
            tasks.map((t) => ({
              ...t,
              bootcampId: bootcamp.id,
              bootcampTitle: bootcamp.title,
            }))
          )
          .catch(() => [])
      )
    ).then((results) => {
      const flat = results.flat();
      flat.sort(
        (a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0)
      );
      setAllTasks(flat);
    });
  }, [enrolledBootcamps]);

  const handleSubmitted = (taskId, submissionData) => {
    setAllTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, mySubmission: submissionData } : t
      )
    );
  };

  const filtered = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter((t) => {
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
            ? !t.mySubmission
            : !!t.mySubmission;
      const matchBootcamp =
        bootcampFilter === 'all' || t.bootcampId === bootcampFilter;
      return matchStatus && matchBootcamp;
    });
  }, [allTasks, statusFilter, bootcampFilter]);

  const filteredTasksForStats = useMemo(() => {
    if (!allTasks) return [];
    return bootcampFilter === 'all'
      ? allTasks
      : allTasks.filter((t) => t.bootcampId === bootcampFilter);
  }, [allTasks, bootcampFilter]);

  if (allTasks === null)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="mb-3 h-7 w-7 animate-spin text-violet-500" />
        <span className="text-[13px] font-semibold">
          Loading assigned tasks…
        </span>
      </div>
    );

  if (enrolledBootcamps.length === 0)
    return (
      <div className="py-16 text-center text-[13px] text-gray-500">
        Enroll in a bootcamp to see tasks.
      </div>
    );

  const pendingCount = filteredTasksForStats.filter(
    (t) => !t.mySubmission
  ).length;
  const submittedCount = filteredTasksForStats.filter(
    (t) => t.mySubmission
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Tasks',
            value: filteredTasksForStats.length,
            color: 'text-white',
            icon: Layers,
            iconColor:
              'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]',
            bg: 'bg-zinc-950/25 border-white/5',
            glow: 'hover:shadow-[0_4px_24px_rgba(99,102,241,0.04)] hover:border-indigo-500/25',
          },
          {
            label: 'Not Submitted',
            value: pendingCount,
            color: 'text-rose-455',
            icon: AlertCircle,
            iconColor:
              'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]',
            bg: 'bg-zinc-950/25 border-white/5',
            glow: 'hover:shadow-[0_4px_24px_rgba(244,63,94,0.04)] hover:border-rose-500/25',
          },
          {
            label: 'Submitted',
            value: submittedCount,
            color: 'text-emerald-455',
            icon: CheckCircle2,
            iconColor:
              'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
            bg: 'bg-zinc-950/25 border-white/5',
            glow: 'hover:shadow-[0_4px_24px_rgba(16,185,129,0.04)] hover:border-emerald-500/25',
          },
        ].map(({ label, value, color, icon: Icon, iconColor, bg, glow }) => (
          <div
            key={label}
            className={cn(
              'relative flex items-center justify-between overflow-hidden rounded-2xl border p-5 shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5',
              bg,
              glow
            )}
          >
            <div className="space-y-1 text-left">
              <div className="text-gray-550 text-[10px] font-extrabold tracking-widest uppercase">
                {label}
              </div>
              <div
                className={cn(
                  'font-mono text-2xl leading-none font-black tracking-tight sm:text-3xl',
                  color
                )}
              >
                {value}
              </div>
            </div>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-350',
                iconColor
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Points analytics */}
      {(() => {
        const byBootcamp = {};
        for (const { bootcamp } of enrolledBootcamps) {
          if (bootcampFilter !== 'all' && bootcamp.id !== bootcampFilter)
            continue;
          byBootcamp[bootcamp.id] = {
            name: bootcamp.title.split(':')[0].trim(),
            earned: 0,
            max: 0,
          };
        }
        for (const t of filteredTasksForStats) {
          if (!byBootcamp[t.bootcampId]) continue;
          byBootcamp[t.bootcampId].max += t.points ?? 0;
          if (t.mySubmission?.points_earned != null)
            byBootcamp[t.bootcampId].earned += t.mySubmission.points_earned;
        }
        const chartData = Object.values(byBootcamp).filter(
          (d) => d.max > 0 || d.earned > 0
        );
        const totalEarned = filteredTasksForStats.reduce(
          (s, t) => s + (t.mySubmission?.points_earned ?? 0),
          0
        );
        const totalMax = filteredTasksForStats.reduce(
          (s, t) => s + (t.points ?? 0),
          0
        );
        return (
          <PointsStatsPanel
            chartData={chartData}
            totalEarned={totalEarned}
            totalMax={totalMax}
            label="Task Points"
          />
        );
      })()}

      {/* Glassy Filter Panel */}
      <div className="space-y-4.5 rounded-2xl border border-white/5 bg-zinc-950/25 p-4.5 backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="text-left">
            <h3 className="text-sm font-bold tracking-wider text-white uppercase">
              Assigned Task Ledger
            </h3>
            <p className="mt-0.5 text-[11.5px] text-gray-500">
              Solve, submit, and review grades for your tasks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-550 text-[11px] font-extrabold tracking-widest uppercase">
              Status
            </span>
            <div className="flex w-fit gap-1.5 rounded-xl border border-white/5 bg-white/2 p-1">
              {[
                { v: 'all', l: 'All', c: filteredTasksForStats.length },
                { v: 'pending', l: 'Pending', c: pendingCount },
                { v: 'submitted', l: 'Submitted', c: submittedCount },
              ].map((pill) => (
                <button
                  key={pill.v}
                  onClick={() => setStatusFilter(pill.v)}
                  className={cn(
                    'relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all duration-300',
                    statusFilter === pill.v
                      ? 'from-violet-650 to-indigo-650 shadow-violet-650/20 bg-linear-to-r text-white shadow-md'
                      : 'border border-transparent bg-transparent text-gray-400 hover:text-white'
                  )}
                >
                  {pill.l}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 font-mono text-[9px] font-black',
                      statusFilter === pill.v
                        ? 'bg-white/20 text-white'
                        : 'text-gray-550 bg-white/5'
                    )}
                  >
                    {pill.c}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bootcamp filters */}
        {enrolledBootcamps.length > 1 && (
          <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
            <button
              onClick={() => setBootcampFilter('all')}
              className={cn(
                'rounded-full border px-4 py-1.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300',
                bootcampFilter === 'all'
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/5'
                  : 'border-white/10 bg-white/2 text-gray-400 hover:border-white/20 hover:text-white'
              )}
            >
              All Bootcamps
            </button>
            {enrolledBootcamps.map(({ bootcamp }) => (
              <button
                key={bootcamp.id}
                onClick={() => setBootcampFilter(bootcamp.id)}
                className={cn(
                  'max-w-[220px] truncate rounded-full border px-4 py-1.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300',
                  bootcampFilter === bootcamp.id
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/5'
                    : 'border-white/10 bg-white/2 text-gray-400 hover:border-white/20 hover:text-white'
                )}
              >
                {bootcamp.title.split(':')[0].trim()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-14 text-center">
          <EmptyState
            icon={ClipboardList}
            title="No tasks found"
            description="Try selecting a different filter or adjusting your parameters."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSubmitted={handleSubmitted}
              focusId={focusId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Points Stats Panel (shared by Tasks + Sessions) ─────────────────────────

function RadialProgress({ pct, size = 80, stroke = 7, color = '#8b5cf6' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

function PointsStatsPanel({
  chartData,
  totalEarned,
  totalMax,
  label = 'Points',
}) {
  const score =
    totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : null;
  const hasAnyPoints = chartData.some((d) => d.earned > 0 || d.max > 0);
  if (!hasAnyPoints) return null;

  const CustomTooltip = ({ active, payload, label: l }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="min-w-44 rounded-2xl border border-white/10 bg-zinc-900 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-2 text-[9.5px] font-bold tracking-wider text-gray-500 uppercase">
          {l}
        </p>
        {payload.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between gap-4 py-0.5"
          >
            <span className="text-xs text-gray-400">{p.name}</span>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: p.name === 'Earned' ? '#f59e0b' : '#6b7280' }}
            >
              {p.value} pts
            </span>
          </div>
        ))}
        {payload.length === 2 && payload[1].value > 0 && (
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
            <span className="text-[10px] text-gray-500">Score</span>
            <span className="text-[11px] font-bold text-emerald-400">
              {Math.round((payload[0].value / payload[1].value) * 100)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 rounded-2xl border border-white/5 bg-zinc-950/30 p-5.5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[10.5px] font-bold tracking-widest text-gray-500 uppercase">
          <Trophy className="text-amber-550 h-4 w-4" />
          {label} Analytics
        </h3>
        {score !== null && (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ring-1',
              score >= 70
                ? 'bg-emerald-500/5 text-emerald-400 ring-emerald-500/20'
                : score >= 40
                  ? 'bg-amber-500/5 text-amber-400 ring-amber-500/20'
                  : 'bg-rose-500/5 text-rose-400 ring-rose-500/20'
            )}
          >
            {score >= 70
              ? 'Elite Performance'
              : score >= 40
                ? 'Passing Rank'
                : 'Needs Focus'}
          </span>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-4">
        <div className="col-span-1 flex items-center justify-center gap-4 border-b border-white/5 pb-4 sm:justify-start sm:border-r sm:border-b-0 sm:pr-4 sm:pb-0">
          <div className="relative shrink-0">
            <RadialProgress
              pct={score ?? 0}
              size={76}
              stroke={6}
              color={
                score !== null && score >= 70
                  ? '#10b981'
                  : score !== null && score >= 40
                    ? '#f59e0b'
                    : '#8b5cf6'
              }
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[14px] leading-none font-extrabold text-white tabular-nums">
                {score !== null ? `${score}%` : '—'}
              </span>
              <span className="mt-0.5 text-[8px] font-bold tracking-widest text-gray-500 uppercase">
                score
              </span>
            </div>
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              Progress
            </div>
            <div className="mt-0.5 text-sm font-bold text-white">
              {score !== null ? `${score}% Complete` : 'No points graded'}
            </div>
          </div>
        </div>

        <div className="col-span-3 grid grid-cols-3 gap-2.5 pl-0 sm:pl-2">
          {[
            {
              label: 'Earned Points',
              value: totalEarned,
              color: 'text-amber-400',
            },
            {
              label: 'Max Points',
              value: totalMax || '—',
              color: 'text-gray-400',
            },
            {
              label: 'Overall Score',
              value: score !== null ? `${score}%` : '—',
              color:
                score >= 70
                  ? 'text-emerald-400'
                  : score >= 40
                    ? 'text-amber-400'
                    : 'text-rose-400',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-white/5 bg-white/2 p-3 text-left"
            >
              <div className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                {label}
              </div>
              <div
                className={cn(
                  'mt-0.5 font-mono text-xl font-bold tracking-tight sm:text-2xl',
                  color
                )}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-bootcamp bar chart */}
      {chartData.length > 0 && (
        <div className="space-y-3 border-t border-white/5 pt-2">
          <p className="text-left text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            Per Bootcamp breakdown
          </p>
          <div
            className="w-full"
            style={{ height: Math.max(120, chartData.length * 48) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                barSize={10}
                barGap={4}
              >
                <defs>
                  <linearGradient id="earnedGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7} />
                    <stop
                      offset="100%"
                      stopColor="#d97706"
                      stopOpacity={0.95}
                    />
                  </linearGradient>
                  <linearGradient id="maxGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={false}
                  stroke="#1e2535"
                  opacity={0.3}
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 500 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  width={90}
                  tickFormatter={(v) =>
                    v.length > 14 ? v.slice(0, 13) + '…' : v
                  }
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.015)' }}
                />
                <Bar
                  dataKey="earned"
                  name="Earned"
                  radius={[0, 3, 3, 0]}
                  fill="url(#earnedGrad)"
                />
                {chartData.some((d) => d.max > 0) && (
                  <Bar
                    dataKey="max"
                    name="Max"
                    radius={[0, 3, 3, 0]}
                    fill="url(#maxGrad)"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sessions Tab ─────────────────────────────────────────────────────────────

const TARGET_LABEL = {
  'one-on-one': '1:1',
  'selected-group': 'Group',
  'all-bootcamp': 'Broadcast',
};

function useCountdown(targetDate, enabled) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!enabled || !targetDate) return;
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, done: true });
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        done: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate, enabled]);

  return timeLeft;
}

function CountdownBlock({ timeLeft, compact = false }) {
  if (!timeLeft) return null;
  if (timeLeft.done)
    return (
      <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
        Starting now!
      </span>
    );

  const imminent = timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m < 5;
  const units =
    timeLeft.d > 0
      ? [
          { v: timeLeft.d, l: 'd' },
          { v: timeLeft.h, l: 'h' },
          { v: timeLeft.m, l: 'm' },
        ]
      : [
          { v: timeLeft.h, l: 'h' },
          { v: timeLeft.m, l: 'm' },
          { v: timeLeft.s, l: 's' },
        ];

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ring-1 transition-all',
          imminent
            ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
            : 'bg-violet-500/10 text-violet-300 ring-violet-500/20'
        )}
      >
        <HourglassIcon className="h-3 w-3 shrink-0" />
        {units.map(({ v, l }) => `${String(v).padStart(2, '0')}${l}`).join(' ')}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4.5 backdrop-blur-md',
        imminent
          ? 'border-amber-500/25 bg-amber-500/[0.03] shadow-[0_4px_20px_rgba(245,158,11,0.02)]'
          : 'border-violet-500/20 bg-violet-500/[0.02] shadow-[0_4px_20px_rgba(139,92,246,0.02)]'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 animate-ping rounded-full',
            imminent ? 'bg-amber-400' : 'bg-violet-400'
          )}
        />
        <p
          className={cn(
            'text-[9px] font-bold tracking-wider uppercase',
            imminent ? 'text-amber-400' : 'text-violet-400'
          )}
        >
          {imminent ? '⚡ Imminent cohort start' : '⏳ Scheduled Room Timer'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {units.map(({ v, l }) => (
          <div key={l} className="flex items-center gap-1">
            <div className="rounded-xl border border-white/5 bg-black/30 px-3 py-2.5 shadow-inner">
              <span
                className={cn(
                  'font-mono text-2xl leading-none font-extrabold tracking-tight tabular-nums sm:text-3xl',
                  imminent
                    ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'text-white'
                )}
              >
                {String(v).padStart(2, '0')}
              </span>
            </div>
            <span
              className={cn(
                'pr-1 font-mono text-[10px] font-bold tracking-wider text-gray-500 uppercase',
                imminent ? 'text-amber-500/80' : 'text-violet-400/80'
              )}
            >
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
function SessionCard({ session: s, userId, focusId }) {
  const isFocused = focusId === `session-${s.id}`;
  const cardRef = useRef(null);
  const [open, setOpen] = useState(isFocused);
  const dt = new Date(s.scheduled_at || s.session_date);
  const isUpcoming = s.status === 'scheduled' && dt >= new Date();
  const dateStr = fmtDhaka(s.scheduled_at || s.session_date, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = fmtDhaka(s.scheduled_at || s.session_date, { hour: '2-digit', minute: '2-digit' });
  const mentorName = s.mentor?.full_name || '—';
  const timeLeft = useCountdown(s.scheduled_at || s.session_date, isUpcoming);

  // Find this user's attendance record for completed sessions
  const myAttendance = useMemo(() => {
    if (!userId || !Array.isArray(s.attendance_data)) return null;
    return s.attendance_data.find((a) => a.user_id === userId) || null;
  }, [userId, s.attendance_data]);
  const myPoints = myAttendance?.points ?? null;
  const attended = myAttendance?.attended ?? s.attended;

  // Scroll a deep-linked session into view once it mounts (after async load).
  useEffect(() => {
    if (!isFocused || !cardRef.current) return;
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(t);
  }, [isFocused]);

  const targetBadgeStyle = {
    'one-on-one':
      'text-cyan-405 bg-cyan-500/10 ring-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.05)]',
    'selected-group':
      'text-amber-405 bg-amber-500/10 ring-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]',
    'all-bootcamp':
      'text-violet-405 bg-violet-500/10 ring-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.05)]',
  };

  return (
    <div
      ref={cardRef}
      id={`session-${s.id}`}
      className={cn(
        'relative scroll-mt-24 overflow-hidden rounded-2xl border bg-zinc-900/40 text-left backdrop-blur-xl transition-all duration-300',
        open
          ? 'border-violet-500/30 bg-zinc-900/60 shadow-[0_0_24px_rgba(139,92,246,0.06)]'
          : isUpcoming
            ? 'border-violet-500/20 bg-violet-500/[0.01] hover:border-violet-500/40 hover:shadow-[0_4px_24px_rgba(139,92,246,0.04)]'
            : 'border-white/5 hover:border-white/20 hover:bg-zinc-900/60',
        isFocused && 'ring-2 ring-violet-500/60 ring-offset-2 ring-offset-zinc-950'
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-4 px-5 py-4.5 text-left select-none"
      >
        <div
          className={cn(
            'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
            isUpcoming
              ? 'border-violet-500/20 bg-violet-500/10 text-violet-400'
              : attended === true
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : attended === false
                  ? 'text-rose-455 border-rose-500/20 bg-rose-500/10'
                  : 'border-white/5 bg-white/2 text-gray-500'
          )}
        >
          {isUpcoming && (
            <span className="bg-violet-455 absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-ping rounded-full" />
          )}
          <Video className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-white/95 transition-colors group-hover:text-white">
            {s.topic || 'Mentorship Session'}
          </p>
          <p className="text-gray-450 mt-1 flex flex-wrap items-center gap-1.5 text-[11px] leading-none font-medium">
            {s.bootcampTitle && (
              <span className="font-mono text-[9px] font-extrabold tracking-wide text-violet-400 uppercase">
                {s.bootcampTitle?.split(':')[0]}
              </span>
            )}
            {s.bootcampTitle && (
              <span className="font-mono text-gray-700">·</span>
            )}
            <span className="font-mono font-bold text-gray-400">{dateStr}</span>
            {isUpcoming && <span className="font-mono text-gray-700">·</span>}
            {isUpcoming && (
              <span className="font-mono font-black text-violet-300">
                {timeStr}
              </span>
            )}
            <span className="font-mono text-gray-700">·</span>
            <span className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-gray-300">
              {s.duration ?? '—'} mins
            </span>
            <span className="font-mono text-gray-700">·</span>
            <span className="text-gray-450">
              Hosted by{' '}
              <span className="font-semibold text-white">{mentorName}</span>
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {s.target_type && (
            <span
              className={cn(
                'hidden rounded px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest uppercase ring-1 sm:inline-block',
                targetBadgeStyle[s.target_type] ||
                  'text-gray-450 bg-white/5 ring-white/10'
              )}
            >
              {TARGET_LABEL[s.target_type] ?? s.target_type}
            </span>
          )}
          {isUpcoming ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest text-violet-400 uppercase ring-1 ring-violet-500/20">
                upcoming
              </span>
              {timeLeft && <CountdownBlock timeLeft={timeLeft} compact />}
            </div>
          ) : attended === true ? (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest text-emerald-400 uppercase ring-1 ring-emerald-500/20">
              attended
            </span>
          ) : attended === false ? (
            <span className="text-rose-455 rounded-full bg-rose-500/10 px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest uppercase ring-1 ring-rose-500/20">
              missed
            </span>
          ) : (
            <span className="text-gray-450 rounded-full bg-gray-500/10 px-2.5 py-0.5 font-mono text-[9px] font-bold font-extrabold tracking-widest uppercase ring-1 ring-gray-500/20">
              done
            </span>
          )}
          <ChevronDown
            className={cn(
              'text-gray-555 h-4 w-4 transition-transform duration-300 group-hover:text-white',
              open
                ? 'rotate-180 text-violet-400 group-hover:text-violet-400'
                : ''
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 border-t border-white/5 bg-white/[0.01] px-6 pt-5 pb-6"
          >
            {/* Countdown timer for upcoming sessions */}
            {isUpcoming && timeLeft && <CountdownBlock timeLeft={timeLeft} />}

            {/* Points obtained for completed sessions */}
            {!isUpcoming && myAttendance && (
              <div className="flex items-center gap-3.5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.01] px-4.5 py-3.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 shadow-[0_2px_8px_rgba(245,158,11,0.05)] ring-1 ring-amber-500/20">
                  <Trophy className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[9.5px] font-extrabold tracking-widest text-amber-500/80 uppercase">
                    Attendance Session Points
                  </p>
                  <p className="text-amber-350 mt-1 font-mono text-lg leading-none font-black">
                    {myPoints != null ? myPoints : '—'}
                    <span className="ml-1 text-[11px] font-bold text-amber-500/60">
                      pts earned
                    </span>
                  </p>
                </div>
                <div className="shrink-0 rounded-xl border border-white/5 bg-white/2 px-3 py-1.5 text-right font-mono">
                  <p className="text-gray-550 text-[9px] font-extrabold tracking-widest uppercase">
                    Attendance Status
                  </p>
                  {attended ? (
                    <span className="text-emerald-450 mt-0.5 inline-flex items-center gap-1 text-[12px] font-black">
                      <CheckCircle className="h-3.5 w-3.5" /> Attended
                    </span>
                  ) : (
                    <span className="text-rose-455 mt-0.5 inline-flex items-center gap-1 text-[12px] font-black">
                      <X className="h-3.5 w-3.5" /> Absent
                    </span>
                  )}
                </div>
              </div>
            )}

            {s.description && (
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">
                  Description
                </p>
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4.5 text-[13px] leading-relaxed text-gray-300 shadow-inner">
                  <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-linear-to-b from-violet-500 to-indigo-500 opacity-60" />
                  <TaskDescriptionRenderer content={s.description} />
                </div>
              </div>
            )}

            {s.notes && (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20 text-left shadow-xl">
                <div className="flex items-center gap-1.5 border-b border-white/5 bg-white/2 px-4 py-2.5">
                  <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                  <span className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
                    Mentor Notes &amp; Guidelines
                  </span>
                </div>
                <div className="p-4.5">
                  <p className="text-gray-350 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                    {s.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              {s.location ? (
                <span
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-5 py-2.5 text-[12px] font-bold text-amber-300 shadow-sm"
                  title={s.location}
                >
                  <MapPin className="h-4 w-4 text-amber-400" />
                  In-person · {s.location}
                </span>
              ) : (
                s.meet_link && (
                  <a
                    href={s.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-5.5 py-2.5 text-[12px] font-bold text-white shadow-md shadow-emerald-600/10 transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-600/25 active:scale-[0.98]"
                  >
                    <Video className="h-4 w-4 transition-transform group-hover:scale-105" />
                    {isUpcoming
                      ? 'Join Live Google Meet Room'
                      : 'Open Google Meet Room'}
                    <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                  </a>
                )
              )}
              {s.recording_url && (
                <a
                  href={s.recording_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-5.5 py-2.5 text-[12px] font-bold text-violet-300 shadow-sm shadow-violet-500/5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-500/10 active:scale-[0.98]"
                >
                  <PlayCircle className="h-4 w-4 text-violet-400 transition-transform group-hover:scale-105" />
                  Watch Saved Session Recording
                  <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SessionsTab({ enrolledBootcamps, user, focusId }) {
  const [allSessions, setAllSessions] = useState(null);
  const [filter, setFilter] = useState('all');
  const [bootcampFilter, setBootcampFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!enrolledBootcamps.length) {
      setAllSessions([]);
      return;
    }
    Promise.all(
      enrolledBootcamps.map(({ bootcamp }) =>
        getMemberBootcampSessions(bootcamp.id)
          .then((sessions) =>
            sessions.map((s) => ({
              ...s,
              bootcampId: bootcamp.id,
              bootcampTitle: bootcamp.title.split(':')[0],
            }))
          )
          .catch(() => [])
      )
    ).then((results) => {
      const merged = results.flat();
      const seen = new Set();
      const deduped = merged.filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
      deduped.sort(
        (a, b) => new Date(b.session_date) - new Date(a.session_date)
      );
      setAllSessions(deduped);
    });
  }, [enrolledBootcamps]);

  const now = new Date();
  const filteredSessionsForStats = useMemo(() => {
    if (!allSessions) return [];
    return bootcampFilter === 'all'
      ? allSessions
      : allSessions.filter((s) => s.bootcampId === bootcampFilter);
  }, [allSessions, bootcampFilter]);

  const upcoming = filteredSessionsForStats.filter(
    (s) =>
      s.status === 'scheduled' &&
      new Date(s.scheduled_at || s.session_date) >= now
  );

  const pastSessions = filteredSessionsForStats.filter(
    (s) =>
      s.status !== 'scheduled' ||
      new Date(s.scheduled_at || s.session_date) < now
  );
  const attendedCount = pastSessions.filter((s) => {
    const myEntry = Array.isArray(s.attendance_data)
      ? s.attendance_data.find((a) => a.user_id === user?.id)
      : null;
    return myEntry ? myEntry.attended : s.attended;
  }).length;
  const pastCount = pastSessions.length;
  const attendanceRate =
    pastCount > 0 ? Math.round((attendedCount / pastCount) * 100) : 100;

  const visible = (allSessions || []).filter((s) => {
    const inFilter =
      filter === 'upcoming'
        ? s.status === 'scheduled' &&
          new Date(s.scheduled_at || s.session_date) >= now
        : filter === 'past'
          ? s.status !== 'scheduled' ||
            new Date(s.scheduled_at || s.session_date) < now
          : true;
    const inBootcamp =
      bootcampFilter === 'all' || s.bootcampId === bootcampFilter;
    const inSearch =
      !search.trim() ||
      s.topic?.toLowerCase().includes(search.toLowerCase()) ||
      s.bootcampTitle?.toLowerCase().includes(search.toLowerCase()) ||
      s.mentor?.full_name?.toLowerCase().includes(search.toLowerCase());
    return inFilter && inBootcamp && inSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-0.5"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-5 md:flex-row md:items-center">
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Mentorship Hub
          </h1>
          <p className="text-gray-450 mt-1 text-[12.5px]">
            Join live broadcasts and review past interactive sessions
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="text-gray-555 pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics, mentors..."
            className="placeholder:text-gray-650 h-10 w-full rounded-xl border border-white/10 bg-zinc-950/40 pr-10 pl-10 font-mono text-[13px] text-white transition-all focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-500 transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {allSessions === null ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <Loader2 className="mb-3 h-7 w-7 animate-spin text-violet-500" />
          <span className="text-sm font-semibold">
            Loading mentorship schedules…
          </span>
        </div>
      ) : allSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-14 text-center">
          <EmptyState
            icon={Video}
            title="No sessions scheduled"
            description="Your mentors have not created any virtual classrooms yet."
          />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              {
                label: 'Total Classrooms',
                value: filteredSessionsForStats.length,
                color: 'text-white',
                icon: Video,
                iconColor:
                  'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]',
                bg: 'bg-zinc-950/25 border-white/5',
                glow: 'hover:shadow-[0_4px_24px_rgba(99,102,241,0.04)] hover:border-indigo-500/25',
              },
              {
                label: 'Upcoming Scheduled',
                value: upcoming.length,
                color: 'text-violet-300',
                icon: Clock,
                iconColor:
                  'text-violet-400 bg-violet-500/10 border-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.1)]',
                bg: 'bg-zinc-950/25 border-white/5',
                glow: 'hover:shadow-[0_4px_24px_rgba(139,92,246,0.04)] hover:border-indigo-500/25',
              },
              {
                label: 'Attended Classrooms',
                value: `${attendedCount}/${pastCount}`,
                color: 'text-emerald-455',
                icon: CheckCircle,
                iconColor:
                  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
                bg: 'bg-zinc-950/25 border-white/5',
                glow: 'hover:shadow-[0_4px_24px_rgba(16,185,129,0.04)] hover:border-emerald-500/25',
              },
              {
                label: 'Attendance Rate',
                value: `${attendanceRate}%`,
                color: 'text-amber-350',
                icon: Percent,
                iconColor:
                  'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
                bg: 'bg-zinc-950/25 border-white/5',
                glow: 'hover:shadow-[0_4px_24px_rgba(245,158,11,0.04)] hover:border-amber-500/25',
              },
            ].map(
              ({ label, value, color, icon: Icon, iconColor, bg, glow }) => (
                <div
                  key={label}
                  className={cn(
                    'relative flex items-center justify-between overflow-hidden rounded-2xl border p-5 shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5',
                    bg,
                    glow
                  )}
                >
                  <div className="space-y-1 text-left">
                    <div className="text-gray-555 text-[10px] font-extrabold tracking-widest uppercase">
                      {label}
                    </div>
                    <div
                      className={cn(
                        'font-mono text-2xl leading-none font-black tracking-tight sm:text-3xl',
                        color
                      )}
                    >
                      {value}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-355',
                      iconColor
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              )
            )}
          </div>

          {/* Points analytics */}
          {(() => {
            const byBootcamp = {};
            for (const { bootcamp } of enrolledBootcamps) {
              if (bootcampFilter !== 'all' && bootcamp.id !== bootcampFilter)
                continue;
              byBootcamp[bootcamp.id] = {
                name: bootcamp.title.split(':')[0].trim(),
                earned: 0,
                max: 0,
              };
            }
            for (const s of filteredSessionsForStats) {
              if (!s.bootcampId || !byBootcamp[s.bootcampId]) continue;
              const isPast =
                s.status !== 'scheduled' ||
                new Date(s.scheduled_at || s.session_date) < now;
              if (isPast) {
                byBootcamp[s.bootcampId].max += 100;
              }
              const myEntry = Array.isArray(s.attendance_data)
                ? s.attendance_data.find((a) => a.user_id === user?.id)
                : null;
              if (myEntry?.points)
                byBootcamp[s.bootcampId].earned += myEntry.points;
            }
            const chartData = Object.values(byBootcamp).filter(
              (d) => d.max > 0 || d.earned > 0
            );
            const totalEarned = chartData.reduce((s, d) => s + d.earned, 0);
            const totalMax = chartData.reduce((s, d) => s + d.max, 0);
            return (
              <PointsStatsPanel
                chartData={chartData}
                totalEarned={totalEarned}
                totalMax={totalMax}
                label="Session Points"
              />
            );
          })()}

          {/* Glassy Filter Panel */}
          <div className="space-y-4.5 rounded-2xl border border-white/5 bg-zinc-950/25 p-4.5 backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                  Scheduled Classrooms
                </h3>
                <p className="text-gray-550 mt-0.5 text-[11.5px]">
                  Explore virtual workshops and guest presentations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-555 text-[11px] font-extrabold tracking-widest uppercase">
                  Schedules
                </span>
                <div className="flex w-fit gap-1.5 rounded-xl border border-white/5 bg-white/2 p-1">
                  {[
                    { v: 'all', l: 'All', c: filteredSessionsForStats.length },
                    { v: 'upcoming', l: 'Upcoming', c: upcoming.length },
                    { v: 'past', l: 'Past', c: pastSessions.length },
                  ].map((pill) => (
                    <button
                      key={pill.v}
                      onClick={() => setFilter(pill.v)}
                      className={cn(
                        'relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all duration-300',
                        filter === pill.v
                          ? 'from-violet-650 to-indigo-650 shadow-violet-650/20 bg-linear-to-r text-white shadow-md'
                          : 'border border-transparent bg-transparent text-gray-400 hover:text-white'
                      )}
                    >
                      {pill.l}
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 font-mono text-[9px] font-black',
                          filter === pill.v
                            ? 'bg-white/20 text-white'
                            : 'text-gray-555 bg-white/5'
                        )}
                      >
                        {pill.c}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bootcamp filters */}
            {enrolledBootcamps.length > 1 && (
              <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
                <button
                  onClick={() => setBootcampFilter('all')}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300',
                    bootcampFilter === 'all'
                      ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/5'
                      : 'border-white/10 bg-white/2 text-gray-400 hover:border-white/20 hover:text-white'
                  )}
                >
                  All Bootcamps
                </button>
                {enrolledBootcamps.map(({ bootcamp }) => (
                  <button
                    key={bootcamp.id}
                    onClick={() => setBootcampFilter(bootcamp.id)}
                    className={cn(
                      'max-w-[220px] truncate rounded-full border px-4 py-1.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300',
                      bootcampFilter === bootcamp.id
                        ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/5'
                        : 'border-white/10 bg-white/2 text-gray-400 hover:border-white/20 hover:text-white'
                    )}
                  >
                    {bootcamp.title.split(':')[0].trim()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-14 text-center">
              <EmptyState
                icon={Search}
                title="No classrooms matched"
                description="Try selecting a different timeframe or adjusting filters."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  userId={user?.id}
                  focusId={focusId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────

function LeaderboardTab({ enrolledBootcamps, archivedBootcamps = [], user }) {
  const [leaderboard, setLeaderboard] = useState(null);
  const [bootcampFilter, setBootcampFilter] = useState('all');
  const [timeframeFilter, setTimeframeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState(null);
  const buttonRef = useRef(null);

  const selectedBootcampLabel = useMemo(() => {
    if (bootcampFilter === 'all') return 'Combined (All Bootcamps)';
    const active = enrolledBootcamps.find(
      ({ bootcamp }) => bootcamp.id === bootcampFilter
    );
    if (active) return active.bootcamp.title.split(':')[0].trim();
    const archived = archivedBootcamps.find(
      ({ bootcamp }) => bootcamp.id === bootcampFilter
    );
    if (archived)
      return `${archived.bootcamp.title.split(':')[0].trim()} (Archived)`;
    return 'Combined (All Bootcamps)';
  }, [bootcampFilter, enrolledBootcamps, archivedBootcamps]);

  const selectedBootcampEmoji = useMemo(() => {
    if (bootcampFilter === 'all') return '🏆';
    const active = enrolledBootcamps.some(
      ({ bootcamp }) => bootcamp.id === bootcampFilter
    );
    if (active) return '📖';
    return '📁';
  }, [bootcampFilter, enrolledBootcamps]);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBootcampsLeaderboardAction({
        bootcampId: bootcampFilter,
        timeframe: timeframeFilter,
      });
      if (res.success) {
        setLeaderboard(res.leaderboard || []);
      } else {
        toast.error(res.error || 'Failed to load leaderboard');
        setLeaderboard([]);
      }
    } catch (err) {
      toast.error('Failed to load leaderboard');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [bootcampFilter, timeframeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Keep rect in sync whenever dropdown opens
  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      setDropdownRect(buttonRef.current.getBoundingClientRect());
    }
  }, [dropdownOpen]);

  const filteredLeaderboard = useMemo(() => {
    if (!leaderboard) return [];
    if (!search.trim()) return leaderboard;
    const q = search.toLowerCase();
    return leaderboard.filter((entry) =>
      entry.userName.toLowerCase().includes(q)
    );
  }, [leaderboard, search]);

  // Top 3 Podium
  const podium = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return [];
    const top3 = leaderboard.slice(0, 3);
    const ordered = [];
    if (top3[1]) ordered.push(top3[1]); // 2nd
    if (top3[0]) ordered.push(top3[0]); // 1st
    if (top3[2]) ordered.push(top3[2]); // 3rd
    return ordered;
  }, [leaderboard]);

  // Find current user's rank
  const myRankEntry = useMemo(() => {
    if (!leaderboard || !user?.id) return null;
    return leaderboard.find((entry) => entry.userId === user.id) || null;
  }, [leaderboard, user]);

  const comparisonInfo = useMemo(() => {
    if (!leaderboard || !myRankEntry) return null;
    const myIndex = leaderboard.findIndex(
      (entry) => entry.userId === myRankEntry.userId
    );
    if (myIndex <= 0) {
      return {
        isFirst: myIndex === 0,
        gapPoints: 0,
        nextUser: null,
      };
    }
    const nextUser = leaderboard[myIndex - 1];
    const gapPoints = (nextUser.score || 0) - (myRankEntry.score || 0);
    return {
      isFirst: false,
      gapPoints,
      nextUser,
    };
  }, [leaderboard, myRankEntry]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[550px] space-y-8 p-1 pb-10 text-left"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-5 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <Trophy className="h-6 w-6 text-amber-400" />
            Bootcamp Leaderboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            See how you rank against other learners across all tasks, exams, and
            attendance.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member by name..."
            className="h-10 w-full rounded-xl border border-white/10 bg-black/30 pr-10 pl-10 text-[13px] text-white transition-all placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-500 transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters: Bootcamp Wise and Timeframe */}
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center">
        {/* Bootcamp select filter */}
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <span className="shrink-0 text-[10px] font-extrabold tracking-wider text-violet-400 uppercase">
            Cohort
          </span>

          <div className="relative flex-1 sm:flex-none">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => {
                const rect = buttonRef.current?.getBoundingClientRect();
                if (rect) setDropdownRect(rect);
                setDropdownOpen((prev) => !prev);
              }}
              className="relative flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/40 pr-10 pl-4 text-xs font-bold text-white shadow-inner transition-all select-none hover:border-white/20 focus:ring-2 focus:ring-violet-500/20 focus:outline-none sm:w-72"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="shrink-0 text-sm">
                  {selectedBootcampEmoji}
                </span>
                <span className="truncate">{selectedBootcampLabel}</span>
              </div>
              <ChevronDown
                className={cn(
                  'pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 transition-transform duration-300',
                  dropdownOpen ? 'rotate-180 text-white' : 'text-gray-400'
                )}
              />
            </button>

            {/* Portal dropdown — renders into document.body to escape all overflow/stacking contexts */}
            {typeof window !== 'undefined' &&
              createPortal(
                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      {/* Dismiss backdrop */}
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setDropdownOpen(false)}
                      />
                      {/* Menu */}
                      <motion.div
                        key="cohort-menu"
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                          position: 'fixed',
                          top: (dropdownRect?.bottom ?? 200) + 8,
                          left: dropdownRect?.left ?? 176,
                          width: Math.max(dropdownRect?.width ?? 288, 288),
                        }}
                        className="z-[9999] flex max-h-72 flex-col gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/98 p-2.5 shadow-2xl backdrop-blur-2xl select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        {/* Option: Combined */}
                        <button
                          type="button"
                          onClick={() => {
                            setBootcampFilter('all');
                            setDropdownOpen(false);
                          }}
                          className={cn(
                            'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-all hover:bg-white/5',
                            bootcampFilter === 'all'
                              ? 'border border-violet-500/20 bg-violet-600/10 text-amber-400'
                              : 'border border-transparent text-gray-300'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm">🏆</span>
                            <span>Combined (All Bootcamps)</span>
                          </span>
                          {bootcampFilter === 'all' && (
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
                          )}
                        </button>

                        {/* Active cohorts */}
                        {enrolledBootcamps.length > 0 && (
                          <div className="mt-1.5">
                            <div className="border-t border-white/5 px-3 py-1 pt-2 text-[8.5px] font-black tracking-widest text-gray-500 uppercase">
                              Active Cohorts
                            </div>
                            <div className="mt-1 flex flex-col gap-0.5">
                              {enrolledBootcamps.map(({ bootcamp }) => {
                                const active = bootcampFilter === bootcamp.id;
                                return (
                                  <button
                                    key={bootcamp.id}
                                    type="button"
                                    onClick={() => {
                                      setBootcampFilter(bootcamp.id);
                                      setDropdownOpen(false);
                                    }}
                                    className={cn(
                                      'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all hover:bg-white/5',
                                      active
                                        ? 'border border-violet-500/20 bg-violet-600/10 font-bold text-white'
                                        : 'border border-transparent text-gray-400'
                                    )}
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <span className="shrink-0 text-sm">
                                        📖
                                      </span>
                                      <span className="truncate">
                                        {bootcamp.title.split(':')[0].trim()}
                                      </span>
                                    </span>
                                    {active && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-md shadow-violet-400/50" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Archived cohorts */}
                        {archivedBootcamps.length > 0 && (
                          <div className="mt-1.5">
                            <div className="border-t border-white/5 px-3 py-1 pt-2 text-[8.5px] font-black tracking-widest text-gray-500 uppercase">
                              Archived Cohorts
                            </div>
                            <div className="mt-1 flex flex-col gap-0.5">
                              {archivedBootcamps.map(({ bootcamp }) => {
                                const active = bootcampFilter === bootcamp.id;
                                return (
                                  <button
                                    key={bootcamp.id}
                                    type="button"
                                    onClick={() => {
                                      setBootcampFilter(bootcamp.id);
                                      setDropdownOpen(false);
                                    }}
                                    className={cn(
                                      'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all hover:bg-white/5',
                                      active
                                        ? 'border border-violet-500/20 bg-violet-600/10 font-bold text-gray-200'
                                        : 'border border-transparent text-gray-500'
                                    )}
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <span className="shrink-0 text-sm">
                                        📁
                                      </span>
                                      <span className="truncate">
                                        {bootcamp.title.split(':')[0].trim()}
                                      </span>
                                    </span>
                                    {active && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-md" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>,
                document.body
              )}
          </div>
        </div>

        {/* Timeframe pills */}
        <div className="relative flex w-full items-center justify-center gap-1 overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-1 shadow-inner sm:w-auto sm:justify-start">
          {[
            ['all', 'All Time'],
            ['monthly', 'Monthly'],
            ['weekly', 'Weekly'],
          ].map(([v, label]) => {
            const active = timeframeFilter === v;
            return (
              <button
                key={v}
                onClick={() => setTimeframeFilter(v)}
                className={cn(
                  'relative flex-1 cursor-pointer rounded-xl px-5 py-2 text-center text-xs font-bold transition-colors duration-300 outline-none select-none sm:flex-none',
                  active ? 'text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeTimeframe"
                    className="absolute inset-0 -z-10 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 text-gray-500">
          <Loader2 className="mb-3.5 h-8 w-8 animate-spin text-violet-500" />
          <span className="text-sm font-semibold">
            Calculating ranks & achievements...
          </span>
        </div>
      ) : leaderboard?.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Leaderboard Empty"
          description="No student progress or scores found for the selected filters."
        />
      ) : (
        <>
          {/* Podium for top 3 */}
          {!search && leaderboard.length > 0 && (
            <div className="mx-auto grid max-w-4xl grid-cols-1 items-end gap-6 pt-6 pb-4 md:grid-cols-3">
              {podium.map((entry) => {
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;

                const theme = isFirst
                  ? {
                      borderColor:
                        'border-amber-500/30 hover:border-amber-400/50',
                      glowColor:
                        'shadow-[0_0_50px_-10px_rgba(245,158,11,0.15)]',
                      pedestalHeight: 'md:h-80',
                      pedestalBg:
                        'bg-linear-to-t from-amber-955/40 via-amber-900/10 to-zinc-900/30',
                      pedestalBorder: 'border-t-2 border-t-amber-500/30',
                      badgeBg:
                        'bg-amber-400 text-black shadow-amber-500/40 shadow-lg',
                      avatarBorder:
                        'ring-amber-400/60 ring-offset-zinc-950 ring-4',
                      accentText: 'text-amber-400',
                      title: '🏆 Champion',
                      delay: 0.1,
                      scale: 'md:scale-105 md:-translate-y-4',
                    }
                  : isSecond
                    ? {
                        borderColor:
                          'border-slate-400/20 hover:border-slate-300/40',
                        glowColor:
                          'shadow-[0_0_40px_-10px_rgba(148,163,184,0.1)]',
                        pedestalHeight: 'md:h-68',
                        pedestalBg:
                          'bg-linear-to-t from-slate-800/30 via-slate-900/10 to-zinc-900/30',
                        pedestalBorder: 'border-t-2 border-t-slate-400/20',
                        badgeBg:
                          'bg-slate-300 text-black shadow-slate-400/30 shadow-md',
                        avatarBorder:
                          'ring-slate-300/50 ring-offset-zinc-950 ring-4',
                        accentText: 'text-slate-300',
                        title: '🥈 Runner Up',
                        delay: 0.2,
                        scale: 'md:-translate-y-1',
                      }
                    : {
                        borderColor:
                          'border-amber-700/25 hover:border-amber-600/45',
                        glowColor:
                          'shadow-[0_0_40px_-10px_rgba(180,83,9,0.08)]',
                        pedestalHeight: 'md:h-60',
                        pedestalBg:
                          'bg-linear-to-t from-amber-950/20 via-amber-950/5 to-zinc-900/30',
                        pedestalBorder: 'border-t-2 border-t-amber-700/25',
                        badgeBg:
                          'bg-amber-700 text-white shadow-amber-700/30 shadow-md',
                        avatarBorder:
                          'ring-amber-700/50 ring-offset-zinc-950 ring-4',
                        accentText: 'text-amber-600',
                        title: '🥉 Third Place',
                        delay: 0.3,
                        scale: 'md:translate-y-2',
                      };

                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 100,
                      damping: 15,
                      delay: theme.delay,
                    }}
                    whileHover={{ y: -8 }}
                    className={cn(
                      'relative flex flex-col items-center justify-between overflow-hidden rounded-3xl border bg-zinc-900/40 backdrop-blur-xl transition-all duration-300',
                      theme.borderColor,
                      theme.glowColor,
                      theme.pedestalHeight,
                      theme.scale,
                      'p-5 pt-8'
                    )}
                  >
                    {/* Glowing background */}
                    <div
                      className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-current opacity-[0.03] blur-3xl"
                      style={{
                        color: isFirst
                          ? '#f59e0b'
                          : isSecond
                            ? '#cbd5e1'
                            : '#b45309',
                      }}
                    />

                    {/* Crown or special icon floating on top */}
                    {isFirst && (
                      <div className="absolute top-2 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center">
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 2.5,
                            ease: 'easeInOut',
                          }}
                        >
                          <Crown className="h-6 w-6 animate-pulse text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]" />
                        </motion.div>
                      </div>
                    )}

                    {/* Avatar structure */}
                    <div className="relative z-10 mt-2">
                      <div
                        className={cn(
                          'flex h-18 w-18 items-center justify-center overflow-hidden rounded-full bg-black/40 transition-transform',
                          theme.avatarBorder
                        )}
                      >
                        <SafeImg
                          src={entry.avatarUrl}
                          alt={entry.userName}
                          className="h-full w-full object-cover"
                          fallback={
                            <div className="from-violet-650/30 to-fuchsia-650/30 flex h-full w-full items-center justify-center bg-linear-to-br text-xl font-black text-white uppercase">
                              {entry.userName.slice(0, 2)}
                            </div>
                          }
                        />
                      </div>
                      <div
                        className={cn(
                          'absolute -right-1 -bottom-2 flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-black shadow-lg ring-3 ring-zinc-950',
                          theme.badgeBg
                        )}
                      >
                        {entry.rank}
                      </div>
                    </div>

                    {/* Member Name and subtitle */}
                    <div className="z-10 mt-4 space-y-0.5 text-center">
                      <p className="max-w-[180px] truncate text-[14px] font-black tracking-tight text-white">
                        {entry.userName}
                      </p>
                      <p
                        className={cn(
                          'text-[9px] font-extrabold tracking-widest uppercase',
                          theme.accentText
                        )}
                      >
                        {theme.title}
                      </p>
                    </div>

                    {/* Pedestal Section (staggered physical styling inside the card) */}
                    <div
                      className={cn(
                        'mt-4 flex w-full flex-1 flex-col justify-between rounded-2xl border border-white/5 p-3.5',
                        theme.pedestalBg,
                        theme.pedestalBorder
                      )}
                    >
                      {/* Grid Stats */}
                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="rounded-xl border border-white/[0.03] bg-white/[0.02] p-2">
                          <span className="text-gray-550 block text-[8px] font-bold tracking-wider uppercase">
                            Progress
                          </span>
                          <span className="font-mono text-xs font-black text-white">
                            {entry.progressPercent}%
                          </span>
                          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full bg-linear-to-r from-violet-500 to-indigo-500"
                              style={{ width: `${entry.progressPercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/[0.03] bg-white/[0.02] p-2">
                          <span className="text-gray-555 block text-[8px] font-bold tracking-wider uppercase">
                            Lessons
                          </span>
                          <div className="mt-0.5 flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                            <span className="font-mono text-xs font-black text-white">
                              {entry.lessonsCompleted}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Points badge */}
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-3 py-2">
                        <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                          Score
                        </span>
                        <span
                          className={cn(
                            'flex items-baseline gap-0.5 font-mono text-base font-black',
                            theme.accentText
                          )}
                        >
                          {entry.score}
                          <span className="font-sans text-[9px] font-bold text-gray-500">
                            PTS
                          </span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Current user's rank quick display */}
          {myRankEntry && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="group relative mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 overflow-hidden rounded-3xl border border-violet-500/20 bg-linear-to-r from-violet-500/[0.03] to-fuchsia-500/[0.03] p-5 shadow-xl backdrop-blur-xl sm:flex-row"
            >
              {/* Decorative side glows */}
              <div className="pointer-events-none absolute top-0 left-0 h-full w-24 bg-linear-to-r from-violet-500/10 to-transparent opacity-50 blur-xl transition-opacity group-hover:opacity-100" />
              <div className="pointer-events-none absolute top-0 right-0 h-full w-24 bg-linear-to-l from-fuchsia-500/10 to-transparent opacity-50 blur-xl transition-opacity group-hover:opacity-100" />

              <div className="z-10 flex w-full items-center gap-4 text-left sm:w-auto">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-400 shadow-inner">
                  <Trophy className="h-6 w-6 text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">
                    Your Standings
                  </span>
                  <p className="mt-1 flex flex-wrap items-baseline gap-1.5 text-[15px] font-black text-white">
                    Rank{' '}
                    <span className="font-mono text-xl font-black text-violet-400">
                      #{myRankEntry.rank}
                    </span>
                    <span className="font-sans text-xs font-bold text-gray-500">
                      out of {leaderboard.length} members
                    </span>
                  </p>

                  {comparisonInfo && (
                    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-300">
                      {comparisonInfo.isFirst ? (
                        <>
                          <Crown className="inline h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span>
                            You are leading the leaderboard! Keep up the
                            brilliant work!
                          </span>
                        </>
                      ) : comparisonInfo.nextUser ? (
                        <>
                          <Target className="inline h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>
                            You are only{' '}
                            <strong className="font-mono font-bold text-emerald-400">
                              {comparisonInfo.gapPoints} pts
                            </strong>{' '}
                            behind{' '}
                            <strong className="font-bold text-white">
                              {comparisonInfo.nextUser.userName}
                            </strong>{' '}
                            (Rank #{comparisonInfo.nextUser.rank})!
                          </span>
                        </>
                      ) : null}
                    </p>
                  )}
                </div>
              </div>

              <div className="z-10 flex w-full shrink-0 items-center justify-between gap-6 border-t border-white/5 pt-4 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="block text-[9px] font-extrabold tracking-widest text-gray-500 uppercase">
                    Total Score
                  </span>
                  <span className="font-mono text-2xl font-black text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
                    {myRankEntry.score}{' '}
                    <span className="font-sans text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                      pts
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Rankings Table */}
          <div className="bg-zinc-955/20 relative overflow-hidden rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/[0.01] to-transparent" />
            <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-extrabold tracking-widest text-gray-400 uppercase select-none">
                    <th className="w-20 px-6 py-5 text-center">Rank</th>
                    <th className="min-w-64 px-6 py-5">Member</th>
                    <th className="px-6 py-5 text-center">Lessons</th>
                    <th className="px-6 py-5 text-center">Practice</th>
                    <th className="px-6 py-5 text-center">Watch Time</th>
                    <th className="px-6 py-5 text-center">Sessions</th>
                    <th className="px-6 py-5 pr-10 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeaderboard.map((entry) => {
                    const isSelf = entry.userId === user?.id;
                    const isFirst = entry.rank === 1;
                    const isSecond = entry.rank === 2;
                    const isThird = entry.rank === 3;

                    return (
                      <tr
                        key={entry.userId}
                        className={cn(
                          'group transition-all duration-200',
                          isSelf
                            ? 'border-l-4 border-l-violet-500 bg-violet-500/[0.03] hover:bg-violet-500/[0.05]'
                            : 'hover:bg-white/[0.02]'
                        )}
                      >
                        {/* Rank Badge */}
                        <td className="px-6 py-4.5 text-center">
                          {isFirst ? (
                            <div className="inline-flex h-8 w-8 scale-105 items-center justify-center rounded-full bg-linear-to-br from-amber-300 to-amber-500 font-mono text-sm font-black text-black shadow-[0_2px_10px_rgba(245,158,11,0.4)]">
                              1
                            </div>
                          ) : isSecond ? (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-400 font-mono text-sm font-black text-black shadow-[0_2px_10px_rgba(148,163,184,0.3)]">
                              2
                            </div>
                          ) : isThird ? (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-amber-600 to-amber-800 font-mono text-sm font-black text-white shadow-[0_2px_10px_rgba(180,83,9,0.25)]">
                              3
                            </div>
                          ) : (
                            <span className="font-mono text-sm font-extrabold text-gray-400 transition-colors group-hover:text-white">
                              {entry.rank}
                            </span>
                          )}
                        </td>

                        {/* Profile Photo & Name */}
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-4">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40 shadow-md ring-2 ring-transparent transition-all group-hover:ring-violet-500/20">
                              <SafeImg
                                src={entry.avatarUrl}
                                alt={entry.userName}
                                className="h-full w-full object-cover"
                                fallback={
                                  <div className="from-violet-650/20 to-fuchsia-650/20 flex h-full w-full items-center justify-center bg-linear-to-br text-xs font-black text-violet-300 uppercase">
                                    {entry.userName.slice(0, 2)}
                                  </div>
                                }
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-2 truncate font-extrabold text-white">
                                <span className="transition-colors group-hover:text-violet-300">
                                  {entry.userName}
                                </span>
                                {isSelf && (
                                  <span className="rounded-md bg-linear-to-r from-violet-500/20 to-fuchsia-500/20 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-violet-300 uppercase ring-1 ring-violet-500/30">
                                    You
                                  </span>
                                )}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="shrink-0 text-[9px] font-extrabold tracking-wider text-gray-500 uppercase">
                                  Progress
                                </span>
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                                  <div
                                    className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-500"
                                    style={{
                                      width: `${entry.progressPercent}%`,
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-[9px] font-black text-gray-400">
                                  {entry.progressPercent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Completed Lessons */}
                        <td className="px-6 py-4.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/10 bg-violet-500/5 px-2.5 py-1 text-violet-300 shadow-sm">
                            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                            <span className="font-mono text-xs font-black">
                              {entry.lessonsCompleted}
                            </span>
                          </div>
                        </td>

                        {/* Solved Problems */}
                        <td className="px-6 py-4.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 text-emerald-300 shadow-sm">
                            <Target className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            <span className="font-mono text-xs font-black">
                              {entry.practiceSolved}
                            </span>
                          </div>
                        </td>

                        {/* Watch Time */}
                        <td className="px-6 py-4.5 text-center">
                          {entry.watchTime > 0 ? (
                            <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/10 bg-amber-500/5 px-2.5 py-1 font-mono text-xs font-black text-amber-300 shadow-sm">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                              {formatWatchSeconds(entry.watchTime)}
                            </div>
                          ) : (
                            <span className="font-extrabold text-gray-600">
                              —
                            </span>
                          )}
                        </td>

                        {/* Sessions */}
                        <td className="px-6 py-4.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-2.5 py-1 text-cyan-300 shadow-sm">
                            <Video className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                            <span className="font-mono text-xs font-black">
                              {entry.sessionsAttended}
                            </span>
                          </div>
                        </td>

                        {/* Points Badge */}
                        <td className="px-6 py-4.5 pr-10 text-right">
                          <span className="inline-flex items-center gap-1 font-mono text-[15px] font-black text-amber-400 drop-shadow-[0_1px_6px_rgba(245,158,11,0.15)] transition-transform group-hover:scale-105">
                            {entry.score}
                            <span className="font-sans text-[9.5px] font-extrabold tracking-widest text-gray-500 uppercase">
                              pts
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MemberBootcampsClient({
  user,
  bootcamps = [],
  enrollmentMap = {},
  archivedEnrollmentMap = {},
  learningActivity = [],
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();
  const [enrollingId, setEnrollingId] = useState(null);
  const [localEnrollmentMap, setLocalEnrollmentMap] = useState(enrollmentMap);
  // Deep-link target: the id of a task/session card to scroll to + highlight,
  // taken from the URL hash (e.g. #task-<id> / #session-<id>) on first load.
  const [focusId, setFocusId] = useState(null);

  // Honour ?tab= and #hash deep links (used by the Daily Activity feed to jump
  // straight to a specific task or session). Done in an effect to avoid SSR
  // hydration mismatch.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) setFocusId(hash);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearch('');
  };

  const { enrolledBootcamps, availableBootcamps } = useMemo(() => {
    const enrolled = [];
    const available = [];
    for (const b of bootcamps) {
      const enrollment = localEnrollmentMap[b.id];
      // Only active/completed enrollments count as "enrolled" (show in My Learning)
      if (
        enrollment &&
        enrollment.status !== 'pending' &&
        enrollment.status !== 'cancelled'
      ) {
        enrolled.push({ bootcamp: b, enrollment });
      } else {
        available.push(b);
      }
    }
    enrolled.sort(
      (a, b) =>
        new Date(
          b.enrollment?.last_accessed_at || b.enrollment?.enrolled_at || 0
        ) -
        new Date(
          a.enrollment?.last_accessed_at || a.enrollment?.enrolled_at || 0
        )
    );
    return { enrolledBootcamps: enrolled, availableBootcamps: available };
  }, [bootcamps, localEnrollmentMap]);

  // Archived bootcamps — historical data only, no content access
  const archivedBootcamps = useMemo(
    () =>
      Object.values(archivedEnrollmentMap)
        .map((enrollment) => ({
          bootcamp: enrollment.bootcamps,
          enrollment,
        }))
        .sort(
          (a, b) =>
            new Date(b.enrollment?.enrolled_at || 0) -
            new Date(a.enrollment?.enrolled_at || 0)
        ),
    [archivedEnrollmentMap]
  );

  const filteredEnrolled = useMemo(() => {
    if (!search) return enrolledBootcamps;
    const q = search.toLowerCase();
    return enrolledBootcamps.filter((e) =>
      e.bootcamp?.title?.toLowerCase().includes(q)
    );
  }, [enrolledBootcamps, search]);

  const filteredAvailable = useMemo(() => {
    let list = [...availableBootcamps];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    return list;
  }, [availableBootcamps, search]);

  const totalLessonsCompleted = enrolledBootcamps.reduce(
    (sum, e) => sum + (e.enrollment?.completed_lessons || 0),
    0
  );
  const streak = useMemo(
    () => computeStreak(enrolledBootcamps),
    [enrolledBootcamps]
  );

  const handleEnroll = async (bootcampId) => {
    setEnrollingId(bootcampId);
    startTransition(async () => {
      try {
        const result = await enrollUser(bootcampId);
        if (result.success) {
          setLocalEnrollmentMap((prev) => ({
            ...prev,
            [bootcampId]: {
              ...result.enrollment,
              progress_percent: 0,
              completed_lessons: 0,
            },
          }));
          if (result.status === 'pending') {
            toast.success(
              'Enrollment request submitted! Waiting for admin approval.'
            );
          }
        } else {
          toast.error(result.error || 'Could not enroll');
        }
      } finally {
        setEnrollingId(null);
      }
    });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            user={user}
            enrolledBootcamps={enrolledBootcamps}
            archivedBootcamps={archivedBootcamps}
            totalLessonsCompleted={totalLessonsCompleted}
            streak={streak}
            availableBootcamps={availableBootcamps}
            learningActivity={learningActivity}
            onTab={handleTabChange}
          />
        );
      case 'mylearning':
        return (
          <MyLearningTab
            enrolledBootcamps={enrolledBootcamps}
            archivedBootcamps={archivedBootcamps}
            filteredEnrolled={filteredEnrolled}
            search={search}
            setSearch={setSearch}
            onTab={handleTabChange}
          />
        );
      case 'tasks':
        return (
          <TasksTab enrolledBootcamps={enrolledBootcamps} focusId={focusId} />
        );
      case 'sessions':
        return (
          <SessionsTab
            enrolledBootcamps={enrolledBootcamps}
            user={user}
            focusId={focusId}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardTab
            enrolledBootcamps={enrolledBootcamps}
            archivedBootcamps={archivedBootcamps}
            user={user}
          />
        );
      case 'catalog':
        return (
          <CatalogTab
            availableBootcamps={availableBootcamps}
            filteredAvailable={filteredAvailable}
            search={search}
            setSearch={setSearch}
            handleEnroll={handleEnroll}
            enrollingId={enrollingId}
            enrollmentMap={localEnrollmentMap}
          />
        );
      default:
        return null;
    }
  };

  const uiTabs = TABS.map((t) => ({
    value: t.id,
    label: t.label,
    icon: t.icon,
  }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <PageHeader
        icon={BookOpen}
        title="Bootcamps"
        subtitle="Your enrolled courses and available learning paths"
        accent="blue"
      />
      <TabBar tabs={uiTabs} value={activeTab} onChange={handleTabChange} />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>
    </PageShell>
  );
}
