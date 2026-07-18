/**
 * @file Curriculum sidebar: course/module groups and lesson rows.
 * @module CurriculumRail
 */

'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CheckCircle2, CheckSquare, ChevronDown, FileText, HelpCircle, Lock, PanelLeftClose, Play, Search, Video, X } from 'lucide-react';
import { formatDurationSecs } from './learning-shared';

const LessonRow = memo(function LessonRow({
  lesson,
  isActive,
  isCompleted,
  onSelect,
  onPrefetch,
  index,
  activeRef,
  moduleLocked,
}) {
  const hasVideo = lesson.video_source && lesson.video_source !== 'none';
  const duration = formatDurationSecs(lesson.duration);
  const effectiveLocked = moduleLocked || lesson.is_locked;

  return (
    <button
      ref={isActive ? activeRef : null}
      onClick={() => {
        if (effectiveLocked) return;
        onSelect(lesson);
      }}
      onMouseEnter={() => !effectiveLocked && onPrefetch?.(lesson)}
      onFocus={() => !effectiveLocked && onPrefetch?.(lesson)}
      className={`group flex w-full items-start gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors ${
        effectiveLocked
          ? 'cursor-not-allowed opacity-60'
          : isActive
            ? 'border-emerald-500/30 bg-emerald-500/[0.08]'
            : 'border-transparent hover:border-white/10 hover:bg-white/5'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {effectiveLocked ? (
          <Lock className="h-4 w-4 text-gray-600" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : isActive ? (
          lesson.type === 'practice' ? (
            <CheckSquare className="h-4 w-4 animate-pulse text-teal-400" />
          ) : lesson.type === 'exam' ? (
            <HelpCircle className="h-4 w-4 animate-pulse text-violet-400" />
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
              <Play className="h-2 w-2 fill-emerald-400 text-emerald-400" />
            </div>
          )
        ) : lesson.type === 'practice' ? (
          <CheckSquare className="h-4 w-4 text-teal-500/60 transition-colors group-hover:text-teal-400" />
        ) : lesson.type === 'exam' ? (
          <HelpCircle className="h-4 w-4 text-violet-500/60 transition-colors group-hover:text-violet-400" />
        ) : (
          <div className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[8px] font-medium text-gray-600 transition-colors group-hover:border-violet-500/40 group-hover:text-violet-400">
            {index + 1}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`flex items-start gap-1.5 text-[12.5px] leading-snug ${
            effectiveLocked
              ? 'text-gray-600'
              : isCompleted
                ? 'text-gray-500 line-through decoration-white/15'
                : isActive
                  ? 'font-medium text-white'
                  : 'text-gray-300 group-hover:text-white'
          }`}
        >
          <span className="line-clamp-2">{lesson.title}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-gray-500">
          {lesson.type === 'practice' ? (
            <CheckSquare className="h-2.5 w-2.5 text-teal-500" />
          ) : lesson.type === 'exam' ? (
            <HelpCircle className="h-2.5 w-2.5 text-violet-500" />
          ) : hasVideo ? (
            <Video className="h-2.5 w-2.5" />
          ) : (
            <FileText className="h-2.5 w-2.5" />
          )}
          <span>
            {lesson.type === 'practice'
              ? 'Practice'
              : lesson.type === 'exam'
                ? `Exam (${lesson.exam_type?.toUpperCase()})`
                : hasVideo
                  ? 'Video'
                  : 'Reading'}
          </span>
          {duration && (
            <>
              <span className="text-gray-700">·</span>
              <span>{duration}</span>
            </>
          )}
          {effectiveLocked && (
            <span className="ml-auto text-[10px] text-amber-600/80">
              Locked
            </span>
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
  courseLocked,
}) {
  const effectiveModuleLocked = courseLocked || module.is_locked;
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
        className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/5"
      >
        <ChevronDown
          className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <span
          className={`flex-1 truncate text-[12px] font-medium ${effectiveModuleLocked ? 'text-gray-600' : allDone ? 'text-gray-500' : 'text-gray-300'} group-hover:text-white`}
        >
          {module.title}
        </span>
        {effectiveModuleLocked ? (
          <Lock className="h-3 w-3 shrink-0 text-amber-600/70" />
        ) : (
          <span
            className={`shrink-0 text-[10px] tabular-nums ${allDone ? 'text-emerald-500' : 'text-gray-600'}`}
          >
            {done}/{total}
          </span>
        )}
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
                  moduleLocked={effectiveModuleLocked}
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
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-2.5 px-3 py-3 text-left hover:bg-white/5"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[13px] font-semibold transition-colors group-hover:text-violet-300 ${course.is_locked ? 'text-gray-500' : 'text-white'}`}
          >
            {course.title}
          </div>
          {course.is_locked ? (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600/80">
              <Lock className="h-2.5 w-2.5" /> Locked
            </div>
          ) : (
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
          )}
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
                  courseLocked={course.is_locked}
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
  onCollapse,
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
      <div className="shrink-0 border-b border-white/10 px-4 pt-4 pb-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            Course content
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 tabular-nums">
              {completedCount}/{totalLessons}
            </span>
            {onCollapse && (
              <button
                onClick={onCollapse}
                className="hidden rounded-md p-1 text-gray-500 transition-colors hover:bg-white/5 hover:text-white lg:flex"
                title="Collapse curriculum"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-white lg:hidden"
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
            className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pr-7 pl-8 text-[12px] text-white transition-colors placeholder:text-gray-600 focus:border-violet-500/40 focus:bg-white/5 focus:outline-none"
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
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12rem)',
        }}
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


export { CurriculumRail };
