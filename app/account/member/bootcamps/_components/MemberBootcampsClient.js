'use client';

import { useState, useMemo, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import SafeImg from '@/app/_components/ui/SafeImg';
import {
  BookOpen, Clock, Search, ArrowRight, Loader2,
  GraduationCap, Zap, CheckCircle2, X, House, Play, Trophy,
  Flame, TrendingUp, Sparkles, PlayCircle, CheckCircle, Calendar,
  ChevronLeft, ChevronRight, Video, FileText, ChevronDown, Check,
} from 'lucide-react';
import { enrollUser } from '@/app/_lib/bootcamp-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { PageShell, TabBar, PageHeader } from '../../_components/_ui';

function cn(...c) { return c.filter(Boolean).join(' '); }

const TABS = [
  { id: 'overview', label: 'Overview', icon: House },
  { id: 'mylearning', label: 'My Learning', icon: GraduationCap },
  { id: 'catalog', label: 'Catalog', icon: BookOpen },
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
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[11px] font-bold tracking-wider uppercase text-gray-500">{children}</h2>
      {action}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub, accent = 'text-violet-400' }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-gray-500 font-semibold">
        <Icon className={cn('w-3.5 h-3.5', accent)} />
        {label}
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-[11.5px] text-gray-500">{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, className = '' }) {
  return (
    <div className={cn('h-1.5 rounded-full bg-white/5 overflow-hidden', className)}>
      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}

function SearchInput({ value, onChange, placeholder, autoFocus }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-9 w-full bg-white/[0.03] border border-white/10 rounded-lg pl-9 pr-9 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-colors"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon = GraduationCap, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-14 text-center px-4">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
        <Icon className="h-6 w-6 text-violet-400" />
      </div>
      <p className="text-[14px] font-semibold text-white">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[12.5px] text-gray-500">{description}</p>}
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
    <div className={cn('relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-950 to-slate-900 ring-1 ring-white/10 shrink-0', sizes[size])}>
      {bootcamp.thumbnail ? (
        <SafeImg src={bootcamp.thumbnail} alt={bootcamp.title} className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
          <span className="font-semibold text-[12px] leading-snug text-white/80 line-clamp-3">{bootcamp.title}</span>
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
      className="group flex gap-4 sm:gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5 transition-colors hover:border-violet-500/30 hover:bg-white/[0.03]"
    >
      <Thumbnail bootcamp={bootcamp} size="sm" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] sm:text-base font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
              {bootcamp.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-[11.5px] text-gray-500">
              {bootcamp.difficulty_level && (
                <span className="text-violet-400 font-medium">{bootcamp.difficulty_level}</span>
              )}
              {bootcamp.difficulty_level && lastOpened && <span className="text-gray-700">·</span>}
              {lastOpened && <span>Last active {lastOpened.toLowerCase()}</span>}
            </div>
          </div>
          {isComplete ? (
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 ring-1 ring-amber-500/25 px-2.5 py-1 text-[10.5px] font-bold text-amber-300">
              <Trophy className="w-3 h-3" /> Complete
            </span>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11.5px] text-gray-500">
            <span>{completedLessons}/{totalLessons} lessons{duration ? ` · ${duration}` : ''}</span>
            <span className="tabular-nums text-emerald-400 font-semibold">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>

        {!compact && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11.5px] text-gray-500">
              {isComplete ? 'You finished this bootcamp' : `${remaining} lessons left`}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 group-hover:bg-emerald-400 px-3 py-1.5 text-[12px] font-bold text-white transition-colors shadow-sm shadow-emerald-500/20">
              <Play className="w-3 h-3 fill-current" />
              {cta}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function CompletedCard({ bootcamp, enrollment }) {
  const completedDate = enrollment?.completed_at ? new Date(enrollment.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  return (
    <Link
      href={`/account/member/bootcamps/${bootcamp.id}`}
      className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-colors hover:border-amber-500/30"
    >
      <Thumbnail bootcamp={bootcamp} size="md" />
      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="text-[14px] font-semibold text-white line-clamp-2 group-hover:text-amber-200 transition-colors">{bootcamp.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 ring-1 ring-amber-500/20 px-2 py-0.5 text-[10.5px] font-bold text-amber-300">
            <Trophy className="w-3 h-3" /> Complete
          </span>
          {completedDate && <span className="text-[11px] text-gray-500">{completedDate}</span>}
        </div>
      </div>
    </Link>
  );
}

function CatalogCard({ bootcamp, onEnroll, isEnrolling }) {
  return (
    <div className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-colors hover:border-violet-500/30">
      <Thumbnail bootcamp={bootcamp} size="lg" />
      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {bootcamp.difficulty_level && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-violet-300 bg-violet-500/10 ring-1 ring-violet-500/20 px-2 py-0.5 rounded">
                {bootcamp.difficulty_level}
              </span>
            )}
            {bootcamp.is_featured && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/20 px-2 py-0.5 rounded">
                Featured
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-semibold text-white line-clamp-2">{bootcamp.title}</h3>
          {bootcamp.description && (
            <p className="mt-1.5 text-[12.5px] text-gray-500 line-clamp-2">{bootcamp.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11.5px] text-gray-500">
          <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {bootcamp.total_lessons || 0} lessons</span>
          {bootcamp.total_duration > 0 && (
            <><span className="text-gray-700">·</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDuration(bootcamp.total_duration)}</span></>
          )}
        </div>

        <button
          onClick={() => onEnroll(bootcamp.id)}
          disabled={isEnrolling}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500 hover:bg-violet-400 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50 transition-colors shadow-sm shadow-violet-500/20"
        >
          {isEnrolling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {isEnrolling ? 'Enrolling…' : 'Enroll free'}
        </button>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function LearningCalendar({ enrolledBootcamps }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const completedByDate = useMemo(() => {
    const map = {};
    enrolledBootcamps.forEach(({ bootcamp, enrollment }) => {
      const progress = enrollment?.progressData?.lessonProgress || {};
      Object.values(progress).forEach((p) => {
        if (p.is_completed && p.completed_at) {
          const d = new Date(p.completed_at);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          if (!map[key]) map[key] = { count: 0, lessons: [] };
          map[key].count += 1;
          map[key].lessons.push({
            title: p.lesson_title || 'Lesson',
            href: `/account/member/bootcamps/${bootcamp.id}/${p.lesson_id}`,
          });
        }
      });
    });
    return map;
  }, [enrolledBootcamps]);

  const getIntensityClass = (count, isToday) => {
    if (count === 0) return isToday
      ? 'bg-violet-500/10 border-violet-500/40 text-violet-300 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]'
      : 'bg-white/[0.03] border-transparent text-gray-600 hover:border-white/10 hover:bg-white/[0.05]';
    if (count === 1) return 'bg-violet-500/30 text-white border-violet-500/10 hover:bg-violet-500/40';
    if (count === 2) return 'bg-violet-500/60 text-white border-violet-500/20 hover:bg-violet-500/70';
    return 'bg-violet-500 text-white border-violet-500 shadow-[0_4px_10px_rgba(139,92,246,0.25)] hover:bg-violet-400';
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 md:p-6 h-full flex flex-col shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-violet-400" />
            Learning Activity
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Your monthly completion heatmap</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 shrink-0">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white/[0.05] rounded-lg text-gray-500 hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-28 text-center text-sm font-semibold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white/[0.05] rounded-lg text-gray-500 hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-3">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-600 uppercase tracking-wider">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="aspect-square rounded-xl" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
            const entry = completedByDate[key];
            const count = entry?.count || 0;
            const lessons = entry?.lessons || [];
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
            return (
              <div key={i} className={cn('relative group aspect-square flex items-center justify-center rounded-xl border transition-all duration-300 font-semibold text-sm cursor-default', getIntensityClass(count, isToday))}>
                {day}
                {isToday && count === 0 && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-violet-500/60" />}
                {count > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-auto origin-bottom">
                    <div className="bg-[#1a1d27] border border-white/10 text-white text-xs rounded-xl p-3 shadow-xl min-w-[160px] max-w-[240px]">
                      <p className="font-semibold text-gray-400 mb-2">{count} lesson{count > 1 ? 's' : ''} completed</p>
                      <ul className="space-y-1.5">
                        {lessons.map((l, li) => (
                          <li key={li}>
                            <a href={l.href} className="flex items-start gap-1.5 text-violet-300 hover:text-violet-100 transition-colors">
                              <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-violet-400 mt-1.5" />
                              <span className="line-clamp-2 leading-snug">{l.title}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1a1d27]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-gray-600 font-medium bg-white/[0.02] w-fit mx-auto px-4 py-2 rounded-full border border-white/[0.06]">
          <span>Less</span>
          <div className="flex items-center gap-1.5 mx-1">
            <div className="w-3.5 h-3.5 rounded-sm bg-white/[0.03] border border-transparent" />
            <div className="w-3.5 h-3.5 rounded-sm bg-violet-500/30 border border-violet-500/10" />
            <div className="w-3.5 h-3.5 rounded-sm bg-violet-500/60 border border-violet-500/20" />
            <div className="w-3.5 h-3.5 rounded-sm bg-violet-500 border border-violet-500" />
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
    from = new Date(now); from.setDate(now.getDate() - 6); from.setHours(0, 0, 0, 0);
    to = new Date(now); to.setHours(23, 59, 59, 999);
    groupBy = 'day';
  } else if (preset === 'month') {
    from = new Date(now); from.setDate(now.getDate() - 29); from.setHours(0, 0, 0, 0);
    to = new Date(now); to.setHours(23, 59, 59, 999);
    groupBy = 'week';
  } else if (preset === '6month') {
    from = new Date(now); from.setMonth(now.getMonth() - 5); from.setDate(1); from.setHours(0, 0, 0, 0);
    to = new Date(now); to.setHours(23, 59, 59, 999);
    groupBy = 'month';
  } else if (preset === 'year') {
    from = new Date(now); from.setMonth(now.getMonth() - 11); from.setDate(1); from.setHours(0, 0, 0, 0);
    to = new Date(now); to.setHours(23, 59, 59, 999);
    groupBy = 'month';
  } else {
    from = customFrom ? new Date(customFrom + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), 1);
    to = customTo ? new Date(customTo + 'T23:59:59') : new Date(now);
    const diffDays = Math.ceil((to - from) / 86400000);
    groupBy = diffDays <= 31 ? 'day' : diffDays <= 120 ? 'week' : 'month';
  }

  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Build buckets
  const buckets = {};
  if (groupBy === 'day') {
    const cur = new Date(from);
    while (cur <= to) {
      buckets[toDateStr(cur)] = { name: DAY_ABBR[cur.getDay()], duration: 0 };
      cur.setDate(cur.getDate() + 1);
    }
  } else if (groupBy === 'week') {
    // Weeks: Mon-Sun buckets
    const cur = new Date(from);
    let weekNum = 0;
    while (cur <= to) {
      const key = `w${weekNum}`;
      const endOfWeek = new Date(cur); endOfWeek.setDate(cur.getDate() + 6);
      const label = `${cur.getDate()} ${MONTH_ABBR[cur.getMonth()]}`;
      buckets[key] = { name: label, start: new Date(cur), end: new Date(Math.min(endOfWeek, to)), duration: 0 };
      cur.setDate(cur.getDate() + 7);
      weekNum++;
    }
  } else {
    // Month buckets
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cur <= to) {
      const key = `${cur.getFullYear()}-${cur.getMonth()}`;
      buckets[key] = { name: MONTH_ABBR[cur.getMonth()], year: cur.getFullYear(), month: cur.getMonth(), duration: 0 };
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
    if (secs === 0) return;
    if (groupBy === 'day') {
      const k = row.activity_date;
      if (buckets[k]) buckets[k].duration += secs;
    } else if (groupBy === 'week') {
      for (const b of Object.values(buckets)) {
        if (d >= b.start && d <= b.end) { b.duration += secs; break; }
      }
    } else {
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (buckets[k]) buckets[k].duration += secs;
    }
  });

  // `duration` is seconds — formatters and tooltip handle display.
  return Object.values(buckets);
}

function WatchTimeChart({ learningActivity }) {
  const [preset, setPreset] = useState('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);
  const chartData = useMemo(
    () => buildWatchChartData(learningActivity, preset, customFrom, customTo),
    [learningActivity, preset, customFrom, customTo]
  );

  // chartData.duration is in SECONDS
  const totalSecs = chartData.reduce((s, d) => s + d.duration, 0);
  const activeDays = chartData.filter(d => d.duration > 0).length;
  const avgSecs = activeDays > 0 ? Math.round(totalSecs / activeDays) : 0;
  const topBar = chartData.reduce((a, b) => b.duration > a.duration ? b : a, { name: '-', duration: 0 });

  const presetLabel = {
    week: "This week's effort",
    month: 'Last 30 days',
    '6month': 'Last 6 months',
    year: 'Last 12 months',
    custom: customFrom && customTo ? `${customFrom} → ${customTo}` : 'Select date range',
  }[preset];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0e15] border border-white/[0.08] p-3 rounded-xl shadow-xl">
          <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
          <p className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            {formatWatchSeconds(payload[0].value) || '0s'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 md:p-6 h-full flex flex-col shadow-sm">
      <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-1 text-white">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Watch Time
          </h3>
          <p className="text-sm text-gray-500">{presetLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="bg-violet-500/10 text-violet-300 px-3 py-1 rounded-lg text-sm font-semibold border border-violet-500/20">
            {formatWatchSeconds(totalSecs) || '0m'}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all',
                menuOpen
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-gray-300 hover:text-white hover:border-white/10'
              )}
            >
              <span>{WATCH_PRESETS.find((p) => p.id === preset)?.label || 'Range'}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', menuOpen && 'rotate-180')} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1.5 z-20 min-w-[140px] bg-[#0a0e15] border border-white/[0.08] rounded-xl shadow-xl py-1"
              >
                {WATCH_PRESETS.map((p) => {
                  const active = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => { setPreset(p.id); setMenuOpen(false); }}
                      className={cn(
                        'w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs font-medium transition-colors',
                        active ? 'text-violet-300' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      )}
                    >
                      <span>{p.label}</span>
                      {active && <Check className="w-3.5 h-3.5" />}
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
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="flex-1 min-w-[130px] bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/40 [color-scheme:dark]"
          />
          <span className="text-gray-600 text-xs shrink-0">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="flex-1 min-w-[130px] bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/40 [color-scheme:dark]"
          />
        </div>
      )}

      <div className="flex-1 w-full min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={Math.max(8, Math.min(32, Math.floor(320 / Math.max(chartData.length, 1))))}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1e2535" opacity={0.8} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }} dy={10} interval={chartData.length > 12 ? 'preserveStartEnd' : 0} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => v >= 60 ? `${Math.round(v / 60)}m` : `${v}s`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.05)' }} />
            <Bar dataKey="duration" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.duration > 3600 ? '#a855f7' : '#8b5cf6'} className="hover:opacity-80 transition-opacity cursor-pointer" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-1">Avg / active day</span>
          <span className="text-lg font-bold text-white">{formatWatchSeconds(avgSecs) || '0s'}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-1">Top Period</span>
          <span className="text-lg font-bold text-white">{topBar.duration > 0 ? topBar.name : '-'}</span>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ user, enrolledBootcamps, totalLessonsCompleted, streak, availableBootcamps, learningActivity, onTab }) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const continueBootcamp = enrolledBootcamps.find((e) => {
    const total = e.bootcamp?.total_lessons || 0;
    const done = e.enrollment?.completed_lessons || 0;
    return total === 0 || done < total;
  }) || enrolledBootcamps[0];

  const stats = [
    { title: 'Enrolled Courses', value: String(enrolledBootcamps.length), icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { title: 'Lessons Completed', value: String(totalLessonsCompleted), icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { title: 'Current Streak', value: `${streak} ${streak === 1 ? 'Day' : 'Days'}`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  ];

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="show"
      className="p-1 space-y-8"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, <span className="text-violet-300">{firstName}!</span></h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            {enrolledBootcamps.length === 0 ? "Pick a bootcamp from the catalog to get started." : "You're making great progress. Keep up the momentum."}
          </p>
        </div>
        <button
          onClick={() => onTab('catalog')}
          className="bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 hover:border-violet-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 w-fit"
        >
          <Sparkles className="w-4 h-4" />
          Browse new bootcamps
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="relative overflow-hidden group p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl shadow-sm hover:shadow-md hover:border-white/10 transition-all cursor-default">
            <div className={cn('absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity', stat.bg)} />
            <div className="relative flex justify-between items-start">
              <div className="space-y-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', stat.bg, stat.border)}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-500 mt-1">{stat.title}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Calendar + Watch Time */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col h-full"><LearningCalendar enrolledBootcamps={enrolledBootcamps} /></div>
        <div className="flex flex-col h-full"><WatchTimeChart learningActivity={learningActivity} /></div>
      </motion.div>

      {/* Pick up where you left off */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Pick up where you left off</h2>
          {enrolledBootcamps.length > 1 && (
            <button onClick={() => onTab('mylearning')} className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors">
              View all
            </button>
          )}
        </div>

        {continueBootcamp ? (
          <Link
            href={`/account/member/bootcamps/${continueBootcamp.bootcamp.id}`}
            className="group relative overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-2 transition-all hover:border-violet-500/50 block shadow-sm hover:shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex flex-col md:flex-row gap-6 p-4">
              <div className="hidden md:block w-64 h-40 rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-950 to-slate-900 shrink-0 relative">
                {continueBootcamp.bootcamp.thumbnail ? (
                  <SafeImg src={continueBootcamp.bootcamp.thumbnail} alt={continueBootcamp.bootcamp.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    {continueBootcamp.bootcamp.difficulty_level && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full mb-2 border border-emerald-400/20 uppercase">{continueBootcamp.bootcamp.difficulty_level}</span>
                    )}
                    <span className="font-bold text-sm leading-tight text-white/90">{continueBootcamp.bootcamp.title}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-5">
                <div>
                  <span className="text-xs font-semibold text-violet-400 mb-1 block uppercase tracking-wide">
                    {timeAgo(continueBootcamp.enrollment?.last_accessed_at) ? `Last active: ${timeAgo(continueBootcamp.enrollment.last_accessed_at)}` : 'Start learning'}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-violet-300 transition-colors">{continueBootcamp.bootcamp.title}</h3>
                </div>
                <div className="space-y-2 max-w-md">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-white">{continueBootcamp.enrollment?.progress_percent || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full relative overflow-hidden transition-all duration-500" style={{ width: `${continueBootcamp.enrollment?.progress_percent || 0}%` }}>
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {continueBootcamp.enrollment?.completed_lessons || 0}/{continueBootcamp.bootcamp?.total_lessons || 0} lessons</span>
                    {continueBootcamp.bootcamp?.total_duration > 0 && (
                      <><span className="w-1 h-1 bg-gray-600 rounded-full" /><span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDuration(continueBootcamp.bootcamp.total_duration)}</span></>
                    )}
                  </div>
                  <span className="flex items-center justify-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                    <PlayCircle className="w-4 h-4" />
                    {(continueBootcamp.enrollment?.completed_lessons || 0) > 0 ? 'Resume Course' : 'Start Course'}
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
              <button onClick={() => onTab('catalog')} className="inline-flex items-center gap-2 rounded-lg bg-violet-500 hover:bg-violet-400 px-4 py-2 text-[13px] font-semibold text-white">
                <BookOpen className="w-3.5 h-3.5" /> Browse catalog
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
      className="group text-left flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-violet-500/30 hover:bg-white/[0.03]"
    >
      <Thumbnail bootcamp={bootcamp} size="sm" />
      <div className="min-w-0 flex-1">
        {bootcamp.difficulty_level && (
          <span className="inline-block text-[9.5px] font-bold uppercase tracking-wider text-violet-300 bg-violet-500/10 ring-1 ring-violet-500/20 px-1.5 py-0.5 rounded">
            {bootcamp.difficulty_level}
          </span>
        )}
        <h3 className="mt-1.5 text-[13.5px] font-semibold text-white line-clamp-2 group-hover:text-violet-300 transition-colors">
          {bootcamp.title}
        </h3>
        <div className="mt-2 text-[11px] text-gray-500 inline-flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> {bootcamp.total_lessons || 0} lessons
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
      className="group relative overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 transition-all hover:border-violet-500/50 block shadow-sm hover:shadow-md"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex flex-col md:flex-row gap-6 p-5">
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div className="flex justify-between items-start gap-3">
            <h3 className="text-xl font-semibold text-white group-hover:text-violet-300 transition-colors leading-tight">{bootcamp.title}</h3>
            <span className={cn('text-xs font-medium shrink-0', lastOpened ? 'text-violet-400' : 'text-gray-500')}>
              {lastOpened ? `Last active: ${lastOpened.toLowerCase()}` : 'Not started'}
            </span>
          </div>

          <div className="flex gap-4 text-sm text-gray-500 bg-white/[0.02] w-fit px-3 py-1.5 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-emerald-500" /> <span className="font-medium text-white">{totalLessons}</span> lessons</div>
            {duration && <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-sky-500" /> <span className="font-medium text-white">{duration}</span></div>}
            {bootcamp.difficulty_level && <div className="flex items-center gap-1.5"><span className="font-medium text-violet-400">{bootcamp.difficulty_level}</span></div>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{completedLessons}/{totalLessons} lessons completed</span>
              <span className="text-white font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full relative overflow-hidden transition-all duration-500" style={{ width: `${progress}%` }}>
                {!isComplete && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{isComplete ? 'All done!' : `${remaining} lessons left${duration ? ` · ${duration}` : ''}`}</span>
            </div>
            <span className="flex items-center gap-1.5 bg-white text-gray-900 px-5 py-2 rounded-lg text-sm font-semibold group-hover:bg-violet-500 group-hover:text-white transition-colors">
              <PlayCircle className="w-4 h-4" />
              {isComplete ? 'Review' : completedLessons > 0 ? 'Resume' : 'Start'}
            </span>
          </div>
        </div>

        <div className="hidden md:block w-[280px] h-40 rounded-lg overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-950 to-slate-900 shrink-0 relative">
          {bootcamp.thumbnail ? (
            <SafeImg src={bootcamp.thumbnail} alt={bootcamp.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              {bootcamp.difficulty_level && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full mb-2 border border-emerald-400/20 uppercase">{bootcamp.difficulty_level}</span>
              )}
              <span className="font-bold text-sm leading-tight text-white/90">{bootcamp.title}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function MyLearningTab({ enrolledBootcamps, filteredEnrolled, search, setSearch, onTab }) {
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
      className="p-1 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">My Learning</h1>
          <p className="text-gray-500 mt-1">{enrolledBootcamps.length} bootcamp{enrolledBootcamps.length !== 1 ? 's' : ''} enrolled · {allCompleted.length} completed</p>
        </div>
        {enrolledBootcamps.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my bootcamps..."
              className="h-9 w-full md:w-64 bg-white/[0.03] border border-white/10 rounded-md pl-9 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
        )}
      </div>

      {enrolledBootcamps.length === 0 ? (
        <EmptyState
          title="No enrollments yet"
          description="Enroll in a bootcamp to start tracking your progress."
          action={
            <button onClick={() => onTab('catalog')} className="inline-flex items-center gap-2 rounded-lg bg-violet-500 hover:bg-violet-400 px-4 py-2 text-[13px] font-semibold text-white">
              <BookOpen className="w-3.5 h-3.5" /> Browse catalog
            </button>
          }
        />
      ) : filteredEnrolled.length === 0 ? (
        <EmptyState icon={Search} title={`No matches for "${search}"`} action={
          <button onClick={() => setSearch('')} className="text-[12px] text-violet-400 hover:text-violet-300">Clear search</button>
        } />
      ) : (
        <>
          {inProgress.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-white">In Progress</h2>
              <div className="space-y-4">
                {inProgress.map(({ bootcamp, enrollment }) => (
                  <MyLearningEnrolledRow key={bootcamp.id} bootcamp={bootcamp} enrollment={enrollment} />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div className="pt-6 space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-white">Completed Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {completed.map(({ bootcamp, enrollment }) => (
                  <MyLearningCompletedCard key={bootcamp.id} bootcamp={bootcamp} enrollment={enrollment} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

function MyLearningCompletedCard({ bootcamp, enrollment }) {
  const completedDate = enrollment?.completed_at
    ? new Date(enrollment.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <Link
      href={`/account/member/bootcamps/${bootcamp.id}`}
      className="group relative overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-xl transition-all hover:border-violet-500/50 block cursor-pointer shadow-sm"
    >
      <div className="h-32 w-full bg-white/[0.02] relative border-b border-white/[0.06]">
        {bootcamp.thumbnail ? (
          <SafeImg src={bootcamp.thumbnail} alt={bootcamp.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
            {bootcamp.difficulty_level && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full mb-2 border border-emerald-400/20 uppercase">{bootcamp.difficulty_level}</span>
            )}
            <span className="font-bold text-sm leading-tight text-white/90">{bootcamp.title}</span>
          </div>
        )}
      </div>
      <div className="p-5 space-y-4">
        <h3 className="font-semibold text-lg leading-tight text-white group-hover:text-violet-300 transition-colors line-clamp-2">{bootcamp.title}</h3>

        <div className="flex gap-3 text-xs text-gray-500 mt-1">
          <div className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-emerald-500/70" /> {bootcamp.total_lessons || 0} lessons</div>
          {bootcamp.total_duration > 0 && <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-sky-500/70" /> {formatDuration(bootcamp.total_duration)}</div>}
        </div>

        <div className="flex items-center justify-between text-sm pt-2">
          <div className="flex items-center gap-1.5 text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </div>
          {completedDate && <span className="text-gray-500 text-xs font-semibold">{completedDate}</span>}
        </div>
      </div>
    </Link>
  );
}

function CatalogTab({ availableBootcamps, filteredAvailable, search, setSearch, handleEnroll, enrollingId }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Catalog</h1>
          <p className="mt-1 text-[13.5px] text-gray-500">
            {availableBootcamps.length} bootcamp{availableBootcamps.length === 1 ? '' : 's'} available to enroll
          </p>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search catalog…" />
      </div>

      {availableBootcamps.length === 0 ? (
        <EmptyState title="You're enrolled in everything" description="Check back later for new bootcamps." />
      ) : filteredAvailable.length === 0 ? (
        <EmptyState icon={Search} title={`No matches for "${search}"`} action={
          <button onClick={() => setSearch('')} className="text-[12px] text-violet-400 hover:text-violet-300">Clear search</button>
        }/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAvailable.map((b) => (
            <CatalogCard key={b.id} bootcamp={b} onEnroll={handleEnroll} isEnrolling={enrollingId === b.id} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MemberBootcampsClient({ user, bootcamps = [], enrollmentMap = {}, learningActivity = [] }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();
  const [enrollingId, setEnrollingId] = useState(null);
  const [localEnrollmentMap, setLocalEnrollmentMap] = useState(enrollmentMap);

  const handleTabChange = (tabId) => { setActiveTab(tabId); setSearch(''); };

  const { enrolledBootcamps, availableBootcamps } = useMemo(() => {
    const enrolled = [];
    const available = [];
    for (const b of bootcamps) {
      const enrollment = localEnrollmentMap[b.id];
      if (enrollment) enrolled.push({ bootcamp: b, enrollment });
      else available.push(b);
    }
    enrolled.sort(
      (a, b) =>
        new Date(b.enrollment?.last_accessed_at || b.enrollment?.enrolled_at || 0) -
        new Date(a.enrollment?.last_accessed_at || a.enrollment?.enrolled_at || 0)
    );
    return { enrolledBootcamps: enrolled, availableBootcamps: available };
  }, [bootcamps, localEnrollmentMap]);

  const filteredEnrolled = useMemo(() => {
    if (!search) return enrolledBootcamps;
    const q = search.toLowerCase();
    return enrolledBootcamps.filter((e) => e.bootcamp?.title?.toLowerCase().includes(q));
  }, [enrolledBootcamps, search]);

  const filteredAvailable = useMemo(() => {
    let list = [...availableBootcamps];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) => b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    return list;
  }, [availableBootcamps, search]);

  const totalLessonsCompleted = enrolledBootcamps.reduce(
    (sum, e) => sum + (e.enrollment?.completed_lessons || 0), 0
  );
  const streak = useMemo(() => computeStreak(enrolledBootcamps), [enrolledBootcamps]);

  const handleEnroll = async (bootcampId) => {
    setEnrollingId(bootcampId);
    startTransition(async () => {
      try {
        const result = await enrollUser(bootcampId);
        if (result.success) {
          setLocalEnrollmentMap((prev) => ({
            ...prev,
            [bootcampId]: { ...result.enrollment, progress_percent: 0, completed_lessons: 0 },
          }));
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
            filteredEnrolled={filteredEnrolled}
            search={search}
            setSearch={setSearch}
            onTab={handleTabChange}
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
          />
        );
      default:
        return null;
    }
  };

  const uiTabs = TABS.map((t) => ({ value: t.id, label: t.label, icon: t.icon }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <PageHeader icon={BookOpen} title="Bootcamps" subtitle="Your enrolled courses and available learning paths" accent="blue" />
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
