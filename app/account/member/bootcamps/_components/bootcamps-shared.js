/**
 * @file Shared helpers and small UI bits for the member bootcamps experience.
 * @module bootcamps-shared
 */

'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { BookOpen, ClipboardList, Clock, GraduationCap, HourglassIcon, House, Loader2, Lock, Paperclip, Search, Trash2, Trophy, Video, X, Zap } from 'lucide-react';
import SafeImg from '@/app/_components/ui/SafeImg';

const DHAKA_TZ = 'Asia/Dhaka';

function fmtDhaka(iso, opts) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { timeZone: DHAKA_TZ, ...opts });
}

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


export { fmtDhaka, MultiBlockEditor, cn, AttachmentList, TaskDescriptionRenderer, TABS, formatDuration, formatWatchSeconds, timeAgo, computeStreak, ProgressBar, SearchInput, EmptyState, Thumbnail, CatalogCard };
