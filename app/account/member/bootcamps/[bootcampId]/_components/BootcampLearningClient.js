'use client';

import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useTransition,
  memo,
  Suspense,
  lazy,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronDown,
  Play,
  FileText,
  CheckCircle2,
  BookOpen,
  Layers,
  GraduationCap,
  Trophy,
  Video,
  Lock,
  Search,
  X,
  Menu,
  Clock,
  CircleDot,
  ChevronRight,
  Circle,
  Download,
  StickyNote,
  List,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  getLesson,
  getLessonContent,
  updateWatchTimeDelta,
  recordLearningActivity,
  markLessonComplete,
  markLessonIncomplete,
  saveLessonNotes,
} from '@/app/_lib/bootcamp-actions';
import VideoPlayer from '../[lessonId]/_components/VideoPlayer';

// Heavy chunk: lazy-load only the markdown/code-highlight renderer
const LessonContentRenderer = lazy(
  () => import('../[lessonId]/_components/LessonContentRenderer')
);

function ChunkFallback({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-8 text-gray-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      <span className="text-[12px]">{label}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDurationSecs(seconds) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function formatDurationFull(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SCROLLBAR = `
  .spa-scroll::-webkit-scrollbar { width: 5px; }
  .spa-scroll::-webkit-scrollbar-track { background: transparent; }
  .spa-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius:10px; }
  .spa-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
  .spa-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }

  @keyframes spa-indeterminate {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(20%); }
    100% { transform: translateX(120%); }
  }
  .spa-progress-bar {
    position: absolute;
    inset: 0;
    width: 40%;
    background: linear-gradient(90deg, transparent, rgb(16 185 129), transparent);
    animation: spa-indeterminate 1.1s ease-in-out infinite;
  }

  @keyframes spa-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .spa-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
    background-size: 800px 100%;
    animation: spa-shimmer 1.4s linear infinite;
  }

  @keyframes spa-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .spa-fade-in { animation: spa-fade-in 0.22s ease-out both; }
`;

// ─── Curriculum Rail ──────────────────────────────────────────────────────────

const LessonRow = memo(function LessonRow({
  lesson,
  isActive,
  isCompleted,
  onSelect,
  onPrefetch,
  index,
  activeRef,
}) {
  const hasVideo = lesson.video_source && lesson.video_source !== 'none';
  const duration = formatDurationSecs(lesson.duration);
  return (
    <button
      ref={isActive ? activeRef : null}
      onClick={() => onSelect(lesson)}
      onMouseEnter={() => onPrefetch?.(lesson)}
      onFocus={() => onPrefetch?.(lesson)}
      className={`group flex w-full items-start gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors ${
        isActive
          ? 'border-emerald-500/30 bg-emerald-500/[0.08]'
          : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : isActive ? (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
            <Play className="h-2 w-2 fill-emerald-400 text-emerald-400" />
          </div>
        ) : (
          <div className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[8px] font-medium text-gray-600 transition-colors group-hover:border-violet-500/40 group-hover:text-violet-400">
            {index + 1}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`flex items-start gap-1.5 text-[12.5px] leading-snug ${
            isCompleted
              ? 'text-gray-500 line-through decoration-white/15'
              : isActive
                ? 'font-medium text-white'
                : 'text-gray-300 group-hover:text-white'
          }`}
        >
          <span className="line-clamp-2">{lesson.title}</span>
          {lesson.is_locked && (
            <Lock className="mt-0.5 h-3 w-3 shrink-0 text-gray-600" />
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-gray-500">
          {hasVideo ? (
            <Video className="h-2.5 w-2.5" />
          ) : (
            <FileText className="h-2.5 w-2.5" />
          )}
          <span>{hasVideo ? 'Video' : 'Reading'}</span>
          {duration && (
            <>
              <span className="text-gray-700">·</span>
              <span>{duration}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
});

function ModuleGroup({
  module,
  lessonProgress,
  activeLessonId,
  resumeLessonId,
  onSelect,
  onPrefetch,
  activeRef,
  forceOpen,
}) {
  const containsActive = module.lessons?.some((l) => l.id === activeLessonId);
  const containsResume = module.lessons?.some((l) => l.id === resumeLessonId);
  const [open, setOpen] = useState(containsActive || containsResume);

  // Auto-open when active lesson enters this module
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const total = module.lessons?.length || 0;
  const done =
    module.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed)
      .length || 0;
  const allDone = total > 0 && done === total;

  const isOpen = forceOpen || open;

  return (
    <div className="ml-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/[0.03]"
      >
        <ChevronDown
          className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <span
          className={`flex-1 truncate text-[12px] font-medium ${allDone ? 'text-gray-500' : 'text-gray-300'} group-hover:text-white`}
        >
          {module.title}
        </span>
        <span
          className={`shrink-0 text-[10px] tabular-nums ${allDone ? 'text-emerald-500' : 'text-gray-600'}`}
        >
          {done}/{total}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pt-1 pl-4">
              {module.lessons?.map((lesson, i) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  isActive={lesson.id === activeLessonId}
                  isCompleted={lessonProgress?.[lesson.id]?.is_completed}
                  onSelect={onSelect}
                  onPrefetch={onPrefetch}
                  activeRef={activeRef}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CourseGroup({
  course,
  lessonProgress,
  activeLessonId,
  resumeLessonId,
  courseIndex,
  onSelect,
  onPrefetch,
  activeRef,
  forceOpen,
}) {
  const containsActive = course.modules?.some((m) =>
    m.lessons?.some((l) => l.id === activeLessonId)
  );
  const containsResume = course.modules?.some((m) =>
    m.lessons?.some((l) => l.id === resumeLessonId)
  );
  const [open, setOpen] = useState(
    containsActive || containsResume || courseIndex === 0
  );

  // Auto-open when active lesson enters this course
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const total =
    course.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0;
  const done =
    course.modules?.reduce(
      (s, m) =>
        s +
        (m.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed)
          .length || 0),
      0
    ) || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const isOpen = forceOpen || open;

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-2.5 px-3 py-3 text-left hover:bg-white/[0.03]"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-white transition-colors group-hover:text-violet-300">
            {course.title}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 max-w-[120px] flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 tabular-nums">
              {done}/{total}
            </span>
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-2">
              {course.modules?.map((module) => (
                <ModuleGroup
                  key={module.id}
                  module={module}
                  lessonProgress={lessonProgress}
                  activeLessonId={activeLessonId}
                  resumeLessonId={resumeLessonId}
                  onSelect={onSelect}
                  onPrefetch={onPrefetch}
                  activeRef={activeRef}
                  forceOpen={forceOpen}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CurriculumRail({
  bootcamp,
  lessonProgress,
  activeLessonId,
  resumeLesson,
  onSelect,
  onPrefetch,
  totalLessons,
  completedCount,
  progressPercent,
  onClose,
}) {
  const [query, setQuery] = useState('');
  const activeRef = useRef(null);

  useEffect(() => {
    if (!activeLessonId) return;
    // Wait for accordion expand animation (~180ms) before scrolling
    const t = setTimeout(() => {
      if (activeRef.current) {
        activeRef.current.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }, 220);
    return () => clearTimeout(t);
  }, [activeLessonId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return bootcamp?.courses || [];
    const q = query.trim().toLowerCase();
    return (bootcamp?.courses || [])
      .map((c) => {
        const modules = (c.modules || [])
          .map((m) => {
            const lessons = (m.lessons || []).filter((l) =>
              l.title?.toLowerCase().includes(q)
            );
            return m.title?.toLowerCase().includes(q)
              ? m
              : lessons.length
                ? { ...m, lessons }
                : null;
          })
          .filter(Boolean);
        return c.title?.toLowerCase().includes(q)
          ? c
          : modules.length
            ? { ...c, modules }
            : null;
      })
      .filter(Boolean);
  }, [bootcamp?.courses, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/[0.06] px-4 pt-4 pb-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            Course content
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 tabular-nums">
              {completedCount}/{totalLessons}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1 text-gray-500 hover:bg-white/[0.05] hover:text-white lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons..."
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pr-7 pl-8 text-[12px] text-white transition-colors placeholder:text-gray-600 focus:border-violet-500/40 focus:bg-white/[0.05] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 text-gray-500 hover:bg-white/5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom padding clears ChatFAB, mobile CTA bar, and iOS safe-area. */}
      <div
        className="spa-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12rem)' }}
      >
        {filtered.length > 0 ? (
          filtered.map((course, ci) => (
            <CourseGroup
              key={course.id}
              course={course}
              lessonProgress={lessonProgress}
              activeLessonId={activeLessonId}
              resumeLessonId={query ? null : resumeLesson?.id}
              courseIndex={ci}
              onSelect={(lesson) => {
                onSelect(lesson);
                onClose?.();
              }}
              onPrefetch={onPrefetch}
              activeRef={activeRef}
              forceOpen={!!query}
            />
          ))
        ) : query ? (
          <div className="px-4 py-10 text-center">
            <Search className="mx-auto mb-2 h-5 w-5 text-gray-700" />
            <p className="text-[12px] text-gray-500">
              No matches for &ldquo;{query}&rdquo;
            </p>
            <button
              onClick={() => setQuery('')}
              className="mt-2 text-[11px] text-violet-400 hover:text-violet-300"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <BookOpen className="mx-auto mb-2 h-5 w-5 text-gray-700" />
            <p className="text-[12px] text-gray-500">No curriculum yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notes Panel ──────────────────────────────────────────────────────────────

function NotesPanel({ lessonId, initialNotes, onSave }) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const lastSavedRef = useRef(initialNotes || '');
  const prevLessonRef = useRef(lessonId);
  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // On lesson change: flush unsaved diff for previous lesson, then load new
  useEffect(() => {
    const prevLessonId = prevLessonRef.current;
    if (prevLessonId && prevLessonId !== lessonId) {
      const pending = notesRef.current;
      if (pending !== lastSavedRef.current && onSave) {
        onSave(prevLessonId, pending).catch(() => {});
      }
    }
    prevLessonRef.current = lessonId;
    setNotes(initialNotes || '');
    lastSavedRef.current = initialNotes || '';
  }, [lessonId, initialNotes, onSave]);

  const handleSave = useCallback(() => {
    startSaving(async () => {
      try {
        if (onSave) await onSave(lessonId, notes);
        else await saveLessonNotes(lessonId, notes);
        lastSavedRef.current = notes;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {}
    });
  }, [lessonId, notes, onSave]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5 text-yellow-400" />
          <h3 className="text-[13px] font-semibold text-white">My Notes</h3>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-gray-300 transition-all hover:bg-white/10 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : saved ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Saved
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Take notes while watching…"
        className="spa-scroll w-full resize-none bg-transparent px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none"
        rows={4}
      />
    </div>
  );
}

// ─── Table of Contents ────────────────────────────────────────────────────────

function TableOfContents({ contentRef }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const container = contentRef?.current;
    if (!container) return;
    const timer = setTimeout(() => {
      const els = container.querySelectorAll('h2, h3, h4');
      const items = [];
      els.forEach((el, i) => {
        if (!el.id)
          el.id = `h-${i}-${el.textContent
            .slice(0, 20)
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase()}`;
        items.push({
          id: el.id,
          text: el.textContent,
          level: parseInt(el.tagName.charAt(1)),
        });
      });
      setHeadings(items);
    }, 400);
    return () => clearTimeout(timer);
  }, [contentRef]);

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const v = entries.filter((e) => e.isIntersecting);
        if (v.length) setActiveId(v[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <div className="sticky top-6">
      <div className="mb-3 flex items-center gap-2 px-1">
        <List className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">
          On this page
        </span>
      </div>
      <nav>
        <ul className="space-y-0.5 border-l border-white/[0.08]">
          {headings.map((h) => {
            const isActive = activeId === h.id;
            const indent =
              h.level === 2 ? 'pl-3' : h.level === 3 ? 'pl-5' : 'pl-7';
            return (
              <li key={h.id}>
                <button
                  onClick={() => {
                    document
                      .getElementById(h.id)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveId(h.id);
                  }}
                  className={`w-full py-1.5 text-left ${indent} -ml-px truncate border-l-2 text-[11px] leading-snug transition-all ${
                    isActive
                      ? 'border-violet-500 font-semibold text-violet-300'
                      : 'border-transparent text-gray-600 hover:border-gray-600 hover:text-gray-400'
                  }`}
                >
                  {h.text}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

const OverviewPanel = memo(function OverviewPanel({
  bootcamp,
  allLessons,
  lessonProgress,
  progressPercent,
  completedCount,
  totalLessons,
  totalWatchedSecs,
  totalDurationSecs,
  resumeLesson,
  resumeIndex,
  isComplete,
  onSelectLesson,
  coursesCount,
  modulesCount,
}) {
  const ctaLabel = isComplete
    ? 'Review'
    : completedCount > 0
      ? 'Resume'
      : 'Start learning';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      {/* Title + meta */}
      <div className="space-y-3">
        {bootcamp?.difficulty_level && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-violet-300 uppercase ring-1 ring-violet-500/20">
            {bootcamp.difficulty_level}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {bootcamp?.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[12px] text-gray-500">
          {coursesCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> {coursesCount} courses
            </span>
          )}
          {modulesCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> {modulesCount} modules
            </span>
          )}
          {totalLessons > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> {totalLessons} lessons
            </span>
          )}
          {totalDurationSecs > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />{' '}
              {formatDurationSecs(totalDurationSecs)}
            </span>
          )}
        </div>
      </div>

      {/* Continue card */}
      {resumeLesson && (
        <div
          className={`mt-7 rounded-2xl border ${isComplete ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent' : 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent'} p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="min-w-0 flex-1">
              <div
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase ${isComplete ? 'text-amber-300' : 'text-emerald-300'}`}
              >
                {isComplete ? (
                  <>
                    <Trophy className="h-3 w-3" /> Bootcamp complete
                  </>
                ) : (
                  <>
                    <CircleDot className="h-3 w-3" />{' '}
                    {completedCount > 0
                      ? 'Continue where you left off'
                      : 'Ready to begin'}
                  </>
                )}
              </div>
              <h3 className="mt-1.5 truncate text-lg font-semibold text-white">
                {resumeLesson.title}
              </h3>
              <div className="mt-1 flex items-center gap-3 text-[12px] text-gray-400">
                <span>
                  Lesson {resumeIndex + 1} of {totalLessons}
                </span>
                {resumeLesson.duration > 0 && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />{' '}
                      {formatDurationSecs(resumeLesson.duration)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => onSelectLesson(resumeLesson)}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] ${
                isComplete
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500'
              }`}
            >
              <Play className="h-4 w-4 fill-current" />
              {ctaLabel}
            </button>
          </div>
        </div>
      )}

      {/* Progress tiles */}
      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
          Your progress
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10.5px] font-semibold tracking-wider text-gray-500 uppercase">
              Overall
            </div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {progressPercent}
              <span className="text-base text-gray-500">%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10.5px] font-semibold tracking-wider text-gray-500 uppercase">
              Lessons
            </div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {completedCount}
              <span className="text-base text-gray-500">/{totalLessons}</span>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              {totalLessons - completedCount} remaining
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10.5px] font-semibold tracking-wider text-gray-500 uppercase">
              Watched
            </div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {formatDurationSecs(totalWatchedSecs) || '0m'}
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              of {formatDurationSecs(totalDurationSecs) || '—'}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      {bootcamp?.description && (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            About this bootcamp
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-[14px] leading-relaxed whitespace-pre-line text-gray-300">
              {bootcamp.description}
            </p>
          </div>
        </section>
      )}

      {/* What you'll learn */}
      {coursesCount > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            What you&apos;ll learn
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {bootcamp.courses.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-[13px] leading-snug text-gray-300">
                  {c.title}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="h-8" />
    </div>
  );
});

// ─── Lesson Panel ─────────────────────────────────────────────────────────────

const LessonPanel = memo(function LessonPanel({
  lesson,
  lessonProgress,
  allLessons,
  onSelectLesson,
  onSaveNotes,
  onMarkComplete,
  onMarkIncomplete,
  completing,
  isCompleted,
  currentIndex,
  bootcampId,
}) {
  const contentAreaRef = useRef(null);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const initialPosition = lessonProgress[lesson.id]?.last_position || 0;
  const [localCompleted, setLocalCompleted] = useState(isCompleted);

  useEffect(() => {
    setLocalCompleted(isCompleted);
  }, [isCompleted]);

  // Reset scroll to top when switching lessons
  useEffect(() => {
    if (contentAreaRef.current) contentAreaRef.current.scrollTop = 0;
  }, [lesson.id]);

  // Serialize per-lesson ticks: if a previous save is still flying, queue this
  // delta onto it so we never read-modify-write the same row in parallel.
  const pendingSaveRef = useRef(Promise.resolve());
  const handleProgress = useCallback(
    (progressData) => {
      const delta = Math.floor(progressData.deltaSeconds || 0);
      const ct = progressData.currentTime;
      const pos = ct == null ? null : Math.floor(Number(ct) || 0);
      const lessonId = lesson.id;
      const bId = bootcampId;
      // Local-date string so the chart's local-day bucketing matches what gets
      // written. Without this, late-night sessions land on yesterday's UTC date.
      const d = new Date();
      const activityDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const next = pendingSaveRef.current
        .catch(() => {})
        .then(async () => {
          try {
            await Promise.all([
              updateWatchTimeDelta(lessonId, delta, pos, bId),
              delta > 0 && bId
                ? recordLearningActivity({ bootcampId: bId, deltaSeconds: delta, activityDate })
                : null,
            ]);
          } catch {
            // Swallow — next tick will retry the increment.
          }
        });
      pendingSaveRef.current = next;
      return next;
    },
    [lesson.id, bootcampId]
  );

  const handleVideoComplete = useCallback(async () => {
    if (!localCompleted) {
      setLocalCompleted(true);
      onMarkComplete(lesson.id);
    }
  }, [lesson.id, localCompleted, onMarkComplete]);

  const handleToggle = useCallback(() => {
    if (localCompleted) {
      setLocalCompleted(false);
      onMarkIncomplete(lesson.id);
    } else {
      setLocalCompleted(true);
      onMarkComplete(lesson.id);
    }
  }, [lesson.id, localCompleted, onMarkComplete, onMarkIncomplete]);

  const hasVideo =
    lesson.video_source &&
    lesson.video_source !== 'none' &&
    (lesson.video_id || lesson.video_url);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Scrollable content + TOC */}
      <div className="flex flex-1 overflow-hidden">
        <div
          ref={contentAreaRef}
          className="spa-scroll min-w-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-5xl space-y-5 p-4 pb-8 sm:p-6 lg:p-8 2xl:max-w-6xl">
            {/* Lesson title */}
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4 sm:p-5">
              <h1 className="text-lg leading-tight font-extrabold tracking-tight text-white sm:text-xl lg:text-2xl">
                {lesson.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {lesson.duration > 0 && (
                  <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <Clock className="h-3.5 w-3.5" />{' '}
                    {formatDurationFull(lesson.duration)}
                  </span>
                )}
                {hasVideo && (
                  <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <Play className="h-3.5 w-3.5" /> Video lesson
                  </span>
                )}
                {localCompleted && (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                  </span>
                )}
              </div>
            </div>

            {/* Video — keyed so it remounts cleanly between lessons */}
            {hasVideo && (
              <VideoPlayer
                key={lesson.id}
                lesson={lesson}
                initialPosition={initialPosition}
                onProgress={handleProgress}
                onComplete={handleVideoComplete}
              />
            )}

            {/* Completion toggle */}
            <div
              className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                localCompleted
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-3">
                {localCompleted ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-gray-600" />
                )}
                <div>
                  <p
                    className={`text-sm font-semibold ${localCompleted ? 'text-emerald-300' : 'text-white'}`}
                  >
                    {localCompleted ? 'Lesson complete!' : 'Mark as complete'}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {localCompleted
                      ? 'Great work — keep going!'
                      : 'Mark done when finished'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                disabled={completing}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                  localCompleted
                    ? 'border border-emerald-500/25 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500'
                }`}
              >
                {completing && <Loader2 className="h-4 w-4 animate-spin" />}
                {localCompleted ? '✓ Done' : 'Complete Lesson'}
              </button>
            </div>

            {/* Rich content */}
            {lesson.content ? (
              <Suspense fallback={<ChunkFallback label="Loading content…" />}>
                <LessonContentRenderer
                  key={lesson.id}
                  content={lesson.content}
                  lessonId={lesson.id}
                  onProgress={handleProgress}
                  onComplete={handleVideoComplete}
                />
              </Suspense>
            ) : lesson._pendingContent ? (
              <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="spa-skeleton h-3 w-full rounded" />
                <div className="spa-skeleton h-3 w-11/12 rounded" />
                <div className="spa-skeleton h-3 w-9/12 rounded" />
                <div className="spa-skeleton h-3 w-10/12 rounded" />
              </div>
            ) : null}

            {/* Attachments */}
            {lesson.attachments?.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <Download className="h-4 w-4 text-purple-400" />
                  <h3 className="text-[13px] font-semibold text-white">
                    Attachments
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {lesson.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs text-gray-300 transition-all hover:border-white/10 hover:bg-white/5"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-gray-500" />
                      <span className="truncate">
                        {att.name || `Attachment ${i + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <NotesPanel
              lessonId={lesson.id}
              initialNotes={lessonProgress[lesson.id]?.notes}
              onSave={onSaveNotes}
            />
          </div>
        </div>

        {/* TOC (xl+) */}
        <div className="spa-scroll hidden w-64 shrink-0 overflow-y-auto border-l border-white/[0.06] p-4 pt-8 xl:block">
          <TableOfContents contentRef={contentAreaRef} />
        </div>
      </div>

      {/* Lesson nav footer */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#080b11] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {prevLesson ? (
            <button
              onClick={() => onSelectLesson(prevLesson)}
              className="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[12px] font-medium text-gray-400 transition-all hover:border-white/15 hover:bg-white/[0.08] hover:text-white sm:px-4 sm:text-[13px]"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden max-w-[200px] truncate sm:inline md:max-w-[300px]">
                {prevLesson.title}
              </span>
              <span className="sm:hidden">Prev</span>
            </button>
          ) : (
            <div />
          )}

          <span className="text-[11px] text-gray-600 tabular-nums">
            {currentIndex + 1} / {allLessons.length}
          </span>

          {nextLesson ? (
            <button
              onClick={() => onSelectLesson(nextLesson)}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-3 py-2.5 text-[12px] font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-violet-600 sm:px-5 sm:text-[13px]"
            >
              <span className="hidden max-w-[200px] truncate sm:inline md:max-w-[300px]">
                {nextLesson.title}
              </span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              onClick={() => onSelectLesson(null)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2.5 text-[12px] font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500 sm:px-5 sm:text-[13px]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Finish Course</span>
              <span className="sm:hidden">Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Lesson Skeleton ──────────────────────────────────────────────────────────

function LessonSkeleton({ title, hasVideo }) {
  return (
    <div className="spa-fade-in mx-auto max-w-5xl space-y-5 p-4 pb-8 sm:p-6 lg:p-8 2xl:max-w-6xl">
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4 sm:p-5">
        {title ? (
          <h1 className="text-lg leading-tight font-extrabold tracking-tight text-white sm:text-xl lg:text-2xl">
            {title}
          </h1>
        ) : (
          <div className="spa-skeleton h-6 w-2/3 rounded-md" />
        )}
        <div className="mt-3 flex gap-3">
          <div className="spa-skeleton h-3 w-16 rounded" />
          <div className="spa-skeleton h-3 w-20 rounded" />
        </div>
      </div>
      {hasVideo !== false && (
        <div className="spa-skeleton aspect-video w-full rounded-2xl" />
      )}
      <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="spa-skeleton h-3 w-full rounded" />
        <div className="spa-skeleton h-3 w-11/12 rounded" />
        <div className="spa-skeleton h-3 w-9/12 rounded" />
        <div className="spa-skeleton h-3 w-10/12 rounded" />
      </div>
    </div>
  );
}

// ─── Main SPA Shell ───────────────────────────────────────────────────────────

export default function BootcampLearningClient({
  bootcamp,
  lessonProgress: initialProgress = {},
  initialLessonId = null,
  initialLesson = null,
}) {
  const router = useRouter();
  const [lessonProgress, setLessonProgress] = useState(initialProgress);
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId);
  const [loadedLesson, setLoadedLesson] = useState(initialLesson);
  const [loading, startLoading] = useTransition();
  const [loadError, setLoadError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [completing, startCompleting] = useTransition();

  useEffect(() => {
    setActiveLessonId(initialLessonId);
    if (initialLesson) {
      setLoadedLesson(initialLesson);
    }
  }, [initialLessonId, initialLesson]);

  const lessonCacheRef = useRef(
    initialLesson ? { [initialLesson.id]: initialLesson } : {}
  );
  const prefetchInflightRef = useRef(new Set());
  const navTokenRef = useRef(0);
  const activeLessonIdRef = useRef(activeLessonId);
  useEffect(() => {
    activeLessonIdRef.current = activeLessonId;
  }, [activeLessonId]);

  const allLessons = useMemo(() => {
    const out = [];
    bootcamp?.courses?.forEach((c) => {
      if (c.is_published === false) return;
      c.modules?.forEach((m) => {
        if (m.is_published === false) return;
        m.lessons?.forEach((l) => {
          if (l.is_published === false) return;
          out.push(l);
        });
      });
    });
    return out;
  }, [bootcamp?.courses]);

  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter(
    (l) => lessonProgress?.[l.id]?.is_completed
  ).length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isComplete = completedCount === totalLessons && totalLessons > 0;

  const resumeLesson = useMemo(
    () =>
      allLessons.find((l) => !lessonProgress?.[l.id]?.is_completed) ||
      allLessons[0],
    [allLessons, lessonProgress]
  );
  const resumeIndex = useMemo(
    () =>
      resumeLesson ? allLessons.findIndex((l) => l.id === resumeLesson.id) : -1,
    [allLessons, resumeLesson]
  );

  const coursesCount = bootcamp?.courses?.length || 0;
  const modulesCount =
    bootcamp?.courses?.reduce((s, c) => s + (c.modules?.length || 0), 0) || 0;
  const totalWatchedSecs = allLessons
    .filter((l) => lessonProgress?.[l.id]?.is_completed)
    .reduce((s, l) => s + (l.duration || 0), 0);
  const totalDurationSecs = allLessons.reduce(
    (s, l) => s + (l.duration || 0),
    0
  );

  // Index for Next/Prev — track what's actually rendered (loadedLesson),
  // not what's pending (activeLessonId may be ahead during async load).
  const currentIndex = useMemo(
    () =>
      loadedLesson?.id
        ? allLessons.findIndex((l) => l.id === loadedLesson.id)
        : -1,
    [allLessons, loadedLesson?.id]
  );

  const allLessonsRef = useRef(allLessons);
  useEffect(() => {
    allLessonsRef.current = allLessons;
  }, [allLessons]);

  // Merge stub metadata (from curriculum) with content-only delta from server.
  const mergeStubAndContent = useCallback((stub, content) => {
    if (!content) return stub;
    if (!stub) return content;
    return { ...stub, ...content };
  }, []);

  const loadFullLesson = useCallback(
    async (lessonId) => {
      const cached = lessonCacheRef.current[lessonId];
      if (cached) return cached;
      const stub = allLessonsRef.current.find((l) => l.id === lessonId);
      // Stub missing (deep link before curriculum loads, unlikely) → full fetch.
      if (!stub) {
        const full = await getLesson(lessonId);
        lessonCacheRef.current[lessonId] = full;
        return full;
      }
      const content = await getLessonContent(lessonId);
      const merged = mergeStubAndContent(stub, content);
      lessonCacheRef.current[lessonId] = merged;
      return merged;
    },
    [mergeStubAndContent]
  );

  const prefetchLesson = useCallback(
    (lesson) => {
      if (!lesson?.id) return;
      if (lessonCacheRef.current[lesson.id]) return;
      if (prefetchInflightRef.current.has(lesson.id)) return;
      prefetchInflightRef.current.add(lesson.id);
      const stub =
        allLessonsRef.current.find((l) => l.id === lesson.id) || lesson;
      getLessonContent(lesson.id)
        .then((content) => {
          lessonCacheRef.current[lesson.id] = mergeStubAndContent(stub, content);
        })
        .catch(() => {})
        .finally(() => {
          prefetchInflightRef.current.delete(lesson.id);
        });
    },
    [mergeStubAndContent]
  );

  // Core navigation. `mode`: 'push' (default — entering from overview / new entry),
  // 'replace' (lesson-to-lesson switch), 'none' (browser popstate — URL already set).
  const navigateToLesson = useCallback(
    (lesson, mode = 'push') => {
      const token = ++navTokenRef.current;

      if (!lesson) {
        setActiveLessonId(null);
        setLoadedLesson(null);
        setLoadError(null);
        if (mode !== 'none') {
          const url = `/account/member/bootcamps/${bootcamp.id}`;
          if (mode === 'replace') router.replace(url, { scroll: false });
          else router.push(url, { scroll: false });
        }
        return;
      }

      const url = `/account/member/bootcamps/${bootcamp.id}/${lesson.id}`;
      if (mode === 'push') router.push(url, { scroll: false });
      else if (mode === 'replace') router.replace(url, { scroll: false });

      setActiveLessonId(lesson.id);
      setLoadError(null);

      // Fast path: cached (full lesson with content)
      const cached = lessonCacheRef.current[lesson.id];
      if (cached && cached.content !== undefined) {
        setLoadedLesson(cached);
        return;
      }
      // Stub already has content (e.g. SSR-passed initial lesson)
      if (lesson.content !== undefined) {
        lessonCacheRef.current[lesson.id] = lesson;
        setLoadedLesson(lesson);
        return;
      }

      // Instant render path: show the stub immediately so the title bar,
      // video, and metadata render with zero wait. The body content (markdown,
      // attachments) streams in when the small content fetch resolves.
      const stub = allLessonsRef.current.find((l) => l.id === lesson.id) || lesson;
      setLoadedLesson({ ...stub, content: undefined, _pendingContent: true });

      // Async load — ignore result if user navigated again
      startLoading(async () => {
        try {
          const full = await loadFullLesson(lesson.id);
          if (navTokenRef.current !== token) return;
          if (!full) {
            setLoadError('Lesson not found.');
            return;
          }
          setLoadedLesson(full);
        } catch (e) {
          if (navTokenRef.current !== token) return;
          setLoadError('Failed to load lesson. Please try again.');
        }
      });
    },
    [bootcamp?.id, loadFullLesson]
  );

  // Wrapper used by UI: smart-detect push vs replace, skip no-op.
  // Stable identity (reads activeLessonId via ref) so memoized children don't re-render.
  const selectLesson = useCallback(
    (lesson) => {
      const current = activeLessonIdRef.current;
      if (!lesson) {
        if (!current) return;
        return navigateToLesson(null, 'push');
      }
      if (lesson.id === current) return;
      const mode = current ? 'replace' : 'push';
      navigateToLesson(lesson, mode);
    },
    [navigateToLesson]
  );

  // Initial hydration: if URL has a lessonId but no preloaded lesson, fetch it
  useEffect(() => {
    if (initialLessonId && !loadedLesson) {
      startLoading(async () => {
        try {
          const full = await loadFullLesson(initialLessonId);
          setLoadedLesson(full);
        } catch {
          setLoadError('Failed to load lesson. Please try again.');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefetch neighbor lessons when active lesson changes
  useEffect(() => {
    if (!loadedLesson?.id) return;
    const idx = allLessons.findIndex((l) => l.id === loadedLesson.id);
    if (idx < 0) return;
    const next = allLessons[idx + 1];
    const prev = allLessons[idx - 1];
    const schedule = (cb) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(cb, { timeout: 1500 });
      } else {
        setTimeout(cb, 300);
      }
    };
    const next2 = allLessons[idx + 2];
    if (next) schedule(() => prefetchLesson(next));
    if (prev) schedule(() => prefetchLesson(prev));
    if (next2) schedule(() => prefetchLesson(next2));
  }, [loadedLesson?.id, allLessons, prefetchLesson]);

  // Browser back/forward — DO NOT push, just sync state
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const match = path.match(/\/bootcamps\/[^/]+\/([^/]+)$/);
      if (match) {
        navigateToLesson({ id: match[1] }, 'none');
      } else {
        navigateToLesson(null, 'none');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [navigateToLesson]);

  const moduleIndex = useMemo(() => {
    const lessonToModule = {};
    const moduleLessons = {};
    bootcamp?.courses?.forEach((c) =>
      c.modules?.forEach((m) => {
        const ids = (m.lessons || []).map((l) => l.id);
        moduleLessons[m.id] = ids;
        ids.forEach((id) => {
          lessonToModule[id] = m.id;
        });
      })
    );
    return { lessonToModule, moduleLessons };
  }, [bootcamp]);

  const handleMarkComplete = useCallback(
    (lessonId) => {
      startCompleting(async () => {
        await markLessonComplete(lessonId, bootcamp?.id);
        const nextProgress = {
          ...lessonProgress,
          [lessonId]: { ...lessonProgress[lessonId], is_completed: true },
        };
        setLessonProgress(nextProgress);

        // Detect if this lesson's module just became fully complete.
        const moduleId = moduleIndex.lessonToModule[lessonId];
        let completedModuleId = null;
        if (moduleId) {
          const ids = moduleIndex.moduleLessons[moduleId] || [];
          const allDone =
            ids.length > 0 && ids.every((id) => nextProgress[id]?.is_completed);
          if (allDone) completedModuleId = moduleId;
        }
        if (bootcamp?.id) {
          const d = new Date();
          const activityDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          recordLearningActivity({
            bootcampId: bootcamp.id,
            completedLessonId: lessonId,
            completedModuleId,
            activityDate,
          }).catch(() => {});
        }
      });
    },
    [bootcamp, moduleIndex, lessonProgress]
  );

  const handleMarkIncomplete = useCallback((lessonId) => {
    startCompleting(async () => {
      await markLessonIncomplete(lessonId, bootcamp?.id);
      setLessonProgress((prev) => ({
        ...prev,
        [lessonId]: { ...prev[lessonId], is_completed: false },
      }));
    });
  }, []);

  const handleSaveNotes = useCallback(async (lessonId, notes) => {
    await saveLessonNotes(lessonId, notes);
    setLessonProgress((prev) => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], notes },
    }));
  }, []);

  const ctaLabel = isComplete
    ? 'Review'
    : completedCount > 0
      ? 'Resume'
      : 'Start learning';
  const isLessonView = !!activeLessonId;

  // Stub of the lesson currently being navigated to (used for instant skeleton
  // header while the full lesson body loads).
  const pendingLessonStub = useMemo(() => {
    if (!activeLessonId) return null;
    if (loadedLesson?.id === activeLessonId) return null;
    return allLessons.find((l) => l.id === activeLessonId) || null;
  }, [activeLessonId, loadedLesson?.id, allLessons]);
  const isSwitching = !!pendingLessonStub;

  const mainScrollRef = useRef(null);
  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [activeLessonId]);

  // Measure available height for the body row at runtime so the sidebar
  // and main scroll containers always have the exact remaining viewport
  // space, regardless of how many parent headers/topbars exist above us.
  const bodyRef = useRef(null);
  const [bodyHeight, setBodyHeight] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!bodyRef.current) return;
        const top = bodyRef.current.getBoundingClientRect().top;
        const available = window.innerHeight - top;
        setBodyHeight(Math.max(0, available));
      });
    };
    measure();
    // Re-measure after layout settles (fonts, images, parent collapses, etc.)
    const t = setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measure)
        : null;
    if (ro && bodyRef.current?.parentElement) {
      ro.observe(bodyRef.current.parentElement);
      ro.observe(document.body);
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      ro?.disconnect();
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#080b11] text-white">
      <style dangerouslySetInnerHTML={{ __html: SCROLLBAR }} />

      {/* Topbar */}
      <header className="shrink-0 border-b border-white/[0.06] bg-[#080b11]/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
          {isLessonView ? (
            <button
              onClick={() => selectLesson(null)}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
          ) : (
            <Link
              href="/account/member/bootcamps"
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Bootcamps</span>
            </Link>
          )}

          <span className="text-gray-700">/</span>
          <div className="flex min-w-0 flex-1 items-center gap-2 truncate text-[13px] font-semibold text-white/90">
            <span className="truncate">
              {isLessonView
                ? pendingLessonStub?.title ||
                  loadedLesson?.title ||
                  'Loading…'
                : bootcamp?.title}
            </span>
            {isSwitching && (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-400" />
            )}
          </div>

          {/* Mobile: open curriculum drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white lg:hidden"
            aria-label="Open curriculum"
          >
            <Menu className="h-4 w-4" />
          </button>

          {!isLessonView && resumeLesson && (
            <button
              onClick={() => selectLesson(resumeLesson)}
              className="hidden items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm shadow-emerald-500/20 transition-colors hover:bg-emerald-400 sm:inline-flex"
            >
              <Play className="h-3 w-3 fill-current" />
              {ctaLabel}
            </button>
          )}
        </div>
      </header>

      {/* Body — height measured at runtime so it always exactly fills
          remaining viewport space regardless of ancestor headers/footers. */}
      <div
        ref={bodyRef}
        className="flex min-h-0 flex-1 overflow-hidden"
        style={bodyHeight ? { height: `${bodyHeight}px` } : undefined}
      >
        {/* Desktop sidebar */}
        <aside
          className="hidden h-full w-[320px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#0a0e15] lg:flex xl:w-[360px]"
        >
          <CurriculumRail
            bootcamp={bootcamp}
            lessonProgress={lessonProgress}
            activeLessonId={activeLessonId}
            resumeLesson={activeLessonId ? null : resumeLesson}
            onSelect={selectLesson}
            onPrefetch={prefetchLesson}
            totalLessons={totalLessons}
            completedCount={completedCount}
            progressPercent={progressPercent}
          />
        </aside>

        {/* Main content area */}
        <main
          ref={mainScrollRef}
          className="spa-scroll h-full min-w-0 flex-1 overflow-y-auto"
        >
          {/* Inline loading bar while a lesson fetches */}
          {(loading || isSwitching) && (
            <div className="sticky top-0 z-20 h-0.5 w-full overflow-hidden bg-emerald-500/10">
              <div className="spa-progress-bar" />
            </div>
          )}
          {isSwitching ? (
            <LessonSkeleton
              title={pendingLessonStub?.title}
              hasVideo={
                pendingLessonStub?.video_source &&
                pendingLessonStub.video_source !== 'none'
              }
            />
          ) : loadError ? (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 px-4 text-center text-gray-500">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <span className="text-[13px]">{loadError}</span>
                <button
                  onClick={() => {
                    setLoadError(null);
                    setActiveLessonId(null);
                  }}
                  className="text-[12px] text-violet-400 hover:text-violet-300"
                >
                  Back to overview
                </button>
              </div>
            </div>
          ) : isLessonView && loadedLesson ? (
            <div key={loadedLesson.id} className="spa-fade-in h-full">
              <LessonPanel
                lesson={loadedLesson}
                lessonProgress={lessonProgress}
                allLessons={allLessons}
                onSelectLesson={selectLesson}
                onSaveNotes={handleSaveNotes}
                onMarkComplete={handleMarkComplete}
                onMarkIncomplete={handleMarkIncomplete}
                completing={completing}
                isCompleted={lessonProgress[loadedLesson.id]?.is_completed}
                currentIndex={currentIndex}
                bootcampId={bootcamp?.id}
              />
            </div>
          ) : (
            <OverviewPanel
              bootcamp={bootcamp}
              allLessons={allLessons}
              lessonProgress={lessonProgress}
              progressPercent={progressPercent}
              completedCount={completedCount}
              totalLessons={totalLessons}
              totalWatchedSecs={totalWatchedSecs}
              totalDurationSecs={totalDurationSecs}
              resumeLesson={resumeLesson}
              resumeIndex={resumeIndex}
              isComplete={isComplete}
              onSelectLesson={selectLesson}
              coursesCount={coursesCount}
              modulesCount={modulesCount}
            />
          )}
        </main>
      </div>

      {/* Mobile curriculum drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 left-0 z-50 flex h-[100dvh] w-[88%] max-w-[360px] flex-col overflow-hidden border-r border-white/[0.06] bg-[#0a0e15] lg:hidden"
            >
              <CurriculumRail
                bootcamp={bootcamp}
                lessonProgress={lessonProgress}
                activeLessonId={activeLessonId}
                resumeLesson={activeLessonId ? null : resumeLesson}
                onSelect={selectLesson}
                onPrefetch={prefetchLesson}
                totalLessons={totalLessons}
                completedCount={completedCount}
                progressPercent={progressPercent}
                onClose={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile sticky CTA (overview only) */}
      {!isLessonView && resumeLesson && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#080b11]/95 px-4 py-3 backdrop-blur-xl sm:hidden">
          <button
            onClick={() => selectLesson(resumeLesson)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
          >
            <Play className="h-4 w-4 fill-current" />
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}
