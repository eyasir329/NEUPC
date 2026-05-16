'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, Play, FileText,
  CheckCircle2, BookOpen, Layers, GraduationCap, Trophy,
  Video, Lock, Search, X, Menu, Clock, CircleDot,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDurationSecs(seconds) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

// ─── Curriculum Rail (left sidebar) ───────────────────────────────────────────

function LessonItem({ lesson, bootcampId, lessonProgress, index, isResume, resumeRef, onNavigate }) {
  const progress = lessonProgress?.[lesson.id];
  const isCompleted = progress?.is_completed;
  const hasVideo = lesson.video_source && lesson.video_source !== 'none';
  const duration = formatDurationSecs(lesson.duration);

  return (
    <Link
      ref={isResume ? resumeRef : undefined}
      href={`/account/member/bootcamps/${bootcampId}/${lesson.id}`}
      onClick={onNavigate}
      className={`group flex items-start gap-3 rounded-lg px-2.5 py-2 border transition-colors ${
        isResume
          ? 'bg-emerald-500/[0.08] border-emerald-500/30'
          : 'border-transparent hover:bg-white/[0.04] hover:border-white/10'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : isResume ? (
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40 flex items-center justify-center">
            <Play className="w-2 h-2 fill-emerald-400 text-emerald-400" />
          </div>
        ) : (
          <div className={`w-4 h-4 rounded-full border border-white/15 flex items-center justify-center text-[8px] font-medium text-gray-600 group-hover:border-violet-500/40 group-hover:text-violet-400 transition-colors`}>
            {index + 1}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[12.5px] leading-snug flex items-start gap-1.5 ${
          isCompleted ? 'text-gray-500 line-through decoration-white/15'
          : isResume ? 'text-white font-medium'
          : 'text-gray-300 group-hover:text-white'
        }`}>
          <span className="line-clamp-2">{lesson.title}</span>
          {lesson.is_locked && <Lock className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-gray-500">
          {hasVideo ? <Video className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
          <span>{hasVideo ? 'Video' : 'Reading'}</span>
          {duration && <><span className="text-gray-700">·</span><span>{duration}</span></>}
        </div>
      </div>
    </Link>
  );
}

function ModuleGroup({ module, bootcampId, lessonProgress, resumeLessonId, resumeRef, onNavigate, forceOpen }) {
  const containsResume = module.lessons?.some((l) => l.id === resumeLessonId);
  const [userOpen, setUserOpen] = useState(containsResume);
  const open = forceOpen || userOpen;

  const total = module.lessons?.length || 0;
  const done = module.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed).length || 0;
  const allDone = total > 0 && done === total;

  return (
    <div className="ml-1.5">
      <button
        onClick={() => setUserOpen((o) => !o)}
        className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/[0.03] text-left group"
      >
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${open ? '' : '-rotate-90'}`} />
        <span className={`flex-1 text-[12px] font-medium truncate ${allDone ? 'text-gray-500' : 'text-gray-300'} group-hover:text-white`}>
          {module.title}
        </span>
        <span className={`text-[10px] tabular-nums shrink-0 ${allDone ? 'text-emerald-500' : 'text-gray-600'}`}>
          {done}/{total}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pl-4 pt-1 space-y-0.5">
              {module.lessons?.length > 0 ? module.lessons.map((lesson, i) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  bootcampId={bootcampId}
                  lessonProgress={lessonProgress}
                  index={i}
                  isResume={lesson.id === resumeLessonId}
                  resumeRef={resumeRef}
                  onNavigate={onNavigate}
                />
              )) : (
                <div className="px-2 py-2 text-[11px] text-gray-600">No lessons yet.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CourseGroup({ course, bootcampId, lessonProgress, courseIndex, resumeLessonId, resumeRef, onNavigate, forceOpen }) {
  const containsResume = course.modules?.some((m) => m.lessons?.some((l) => l.id === resumeLessonId));
  const [userOpen, setUserOpen] = useState(containsResume || courseIndex === 0);
  const open = forceOpen || userOpen;

  const total = course.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0;
  const done = course.modules?.reduce((s, m) => s + (m.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed).length || 0), 0) || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        onClick={() => setUserOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-3 hover:bg-white/[0.03] text-left group"
      >
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? '' : '-rotate-90'}`} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
            {course.title}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden max-w-[120px]">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] tabular-nums text-gray-500">{done}/{total}</span>
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pb-2 space-y-0.5">
              {course.modules?.map((module) => (
                <ModuleGroup
                  key={module.id}
                  module={module}
                  bootcampId={bootcampId}
                  lessonProgress={lessonProgress}
                  resumeLessonId={resumeLessonId}
                  resumeRef={resumeRef}
                  onNavigate={onNavigate}
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

function CurriculumRail({ bootcamp, lessonProgress, resumeLesson, resumeRef, onNavigate, totalLessons, completedCount, progressPercent }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return bootcamp?.courses || [];
    const q = query.trim().toLowerCase();
    return (bootcamp?.courses || [])
      .map((c) => {
        const modules = (c.modules || [])
          .map((m) => {
            const lessons = (m.lessons || []).filter((l) => l.title?.toLowerCase().includes(q));
            return m.title?.toLowerCase().includes(q) ? m : (lessons.length ? { ...m, lessons } : null);
          })
          .filter(Boolean);
        return c.title?.toLowerCase().includes(q) ? c : (modules.length ? { ...c, modules } : null);
      })
      .filter(Boolean);
  }, [bootcamp?.courses, query]);

  return (
    <div className="flex h-full flex-col">
      {/* Rail header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold tracking-wider uppercase text-gray-500">Course content</h2>
          <span className="text-[10px] tabular-nums text-gray-600">{completedCount}/{totalLessons}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-emerald-400">{progressPercent}%</span>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/5 text-gray-500"
              aria-label="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Course list (scrollable) */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {filtered.length > 0 ? (
          filtered.map((course, ci) => (
            <CourseGroup
              key={course.id}
              course={course}
              bootcampId={bootcamp.id}
              lessonProgress={lessonProgress}
              courseIndex={ci}
              resumeLessonId={query ? null : resumeLesson?.id}
              resumeRef={resumeRef}
              onNavigate={onNavigate}
              forceOpen={!!query}
            />
          ))
        ) : query ? (
          <div className="px-4 py-10 text-center">
            <Search className="mx-auto mb-2 w-5 h-5 text-gray-700" />
            <p className="text-[12px] text-gray-500">No matches for &ldquo;{query}&rdquo;</p>
            <button onClick={() => setQuery('')} className="mt-2 text-[11px] text-violet-400 hover:text-violet-300">Clear search</button>
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <BookOpen className="mx-auto mb-2 w-5 h-5 text-gray-700" />
            <p className="text-[12px] text-gray-500">No curriculum yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BootcampLearningClient({ bootcamp, lessonProgress = {} }) {
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
  const completedCount = allLessons.filter((l) => lessonProgress?.[l.id]?.is_completed).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isComplete = completedCount === totalLessons && totalLessons > 0;

  const resumeLesson = useMemo(
    () => allLessons.find((l) => !lessonProgress?.[l.id]?.is_completed) || allLessons[0],
    [allLessons, lessonProgress]
  );

  const resumeIndex = useMemo(
    () => (resumeLesson ? allLessons.findIndex((l) => l.id === resumeLesson.id) : -1),
    [allLessons, resumeLesson]
  );

  const coursesCount = bootcamp?.courses?.length || 0;
  const modulesCount = bootcamp?.courses?.reduce((s, c) => s + (c.modules?.length || 0), 0) || 0;

  const totalWatchedSecs = allLessons
    .filter((l) => lessonProgress?.[l.id]?.is_completed)
    .reduce((s, l) => s + (l.duration || 0), 0);
  const totalDurationSecs = allLessons.reduce((s, l) => s + (l.duration || 0), 0);

  const resumeRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Scroll the resume lesson into view inside the rail on first paint
  useEffect(() => {
    if (resumeRef.current) {
      resumeRef.current.scrollIntoView({ block: 'center' });
    }
  }, []);

  const ctaLabel = isComplete ? 'Review' : completedCount > 0 ? 'Resume' : 'Start learning';

  return (
    <div className="min-h-screen bg-[#080b11] text-white">
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080b11]/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 sm:px-5 h-14">
          <Link
            href="/account/member/bootcamps"
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Bootcamps</span>
          </Link>
          <span className="text-gray-700">/</span>
          <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white/90">{bootcamp?.title}</div>

          {/* Mobile: open curriculum drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Open curriculum"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden xs:inline">Lessons</span>
          </button>

          {resumeLesson && (
            <Link
              href={`/account/member/bootcamps/${bootcamp.id}/${resumeLesson.id}`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm shadow-emerald-500/20 transition-colors"
            >
              <Play className="h-3 w-3 fill-current" />
              {ctaLabel}
            </Link>
          )}
        </div>
      </header>

      {/* ── Body: rail + main ── */}
      <div className="flex">
        {/* Left rail — desktop */}
        <aside className="hidden lg:block w-[320px] xl:w-[360px] shrink-0 border-r border-white/[0.06] bg-[#0a0e15]"
               style={{ height: 'calc(100vh - 3.5rem)', position: 'sticky', top: '3.5rem' }}>
          <CurriculumRail
            bootcamp={bootcamp}
            lessonProgress={lessonProgress}
            resumeLesson={resumeLesson}
            resumeRef={resumeRef}
            totalLessons={totalLessons}
            completedCount={completedCount}
            progressPercent={progressPercent}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10">

            {/* Title + meta */}
            <div className="space-y-3">
              {bootcamp?.difficulty_level && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300 ring-1 ring-violet-500/20">
                  {bootcamp.difficulty_level}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{bootcamp?.title}</h1>
              {bootcamp?.description && (
                <p className="text-[14px] leading-relaxed text-gray-400 max-w-2xl">{bootcamp.description}</p>
              )}

              {/* Meta strip */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[12px] text-gray-500">
                {coursesCount > 0 && <span className="inline-flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {coursesCount} courses</span>}
                {modulesCount > 0 && <span className="inline-flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {modulesCount} modules</span>}
                {totalLessons > 0 && <span className="inline-flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> {totalLessons} lessons</span>}
                {totalDurationSecs > 0 && <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDurationSecs(totalDurationSecs)}</span>}
              </div>
            </div>

            {/* Continue card */}
            {resumeLesson && (
              <div className={`mt-7 rounded-2xl border ${isComplete ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent' : 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent'} p-5 sm:p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${isComplete ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {isComplete ? <><Trophy className="w-3 h-3" /> Bootcamp complete</> : <><CircleDot className="w-3 h-3" /> {completedCount > 0 ? 'Continue where you left off' : 'Ready to begin'}</>}
                    </div>
                    <h3 className="mt-1.5 text-lg font-semibold text-white truncate">{resumeLesson.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-[12px] text-gray-400">
                      <span>Lesson {resumeIndex + 1} of {totalLessons}</span>
                      {resumeLesson.duration > 0 && (
                        <><span className="text-gray-700">·</span><span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDurationSecs(resumeLesson.duration)}</span></>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/account/member/bootcamps/${bootcamp.id}/${resumeLesson.id}`}
                    className={`shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] ${
                      isComplete
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {ctaLabel}
                  </Link>
                </div>
              </div>
            )}

            {/* Progress overview */}
            <section className="mt-8">
              <h2 className="text-[11px] font-bold tracking-wider uppercase text-gray-500 mb-3">Your progress</h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10.5px] uppercase tracking-wider text-gray-500 font-semibold">Overall</div>
                  <div className="mt-1 text-2xl font-bold text-white tabular-nums">{progressPercent}<span className="text-base text-gray-500">%</span></div>
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10.5px] uppercase tracking-wider text-gray-500 font-semibold">Lessons</div>
                  <div className="mt-1 text-2xl font-bold text-white tabular-nums">{completedCount}<span className="text-base text-gray-500">/{totalLessons}</span></div>
                  <div className="mt-2 text-[11px] text-gray-500">{totalLessons - completedCount} remaining</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10.5px] uppercase tracking-wider text-gray-500 font-semibold">Watched</div>
                  <div className="mt-1 text-2xl font-bold text-white tabular-nums">{formatDurationSecs(totalWatchedSecs) || '0m'}</div>
                  <div className="mt-2 text-[11px] text-gray-500">of {formatDurationSecs(totalDurationSecs) || '—'}</div>
                </div>
              </div>
            </section>

            {/* About */}
            {bootcamp?.description && (
              <section className="mt-8">
                <h2 className="text-[11px] font-bold tracking-wider uppercase text-gray-500 mb-3">About this bootcamp</h2>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <p className="text-[14px] leading-relaxed text-gray-300 whitespace-pre-line">{bootcamp.description}</p>
                </div>
              </section>
            )}

            {/* What you'll learn */}
            {coursesCount > 0 && (
              <section className="mt-8">
                <h2 className="text-[11px] font-bold tracking-wider uppercase text-gray-500 mb-3">What you&apos;ll learn</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {bootcamp.courses.map((c) => (
                    <div key={c.id} className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[13px] text-gray-300 leading-snug">{c.title}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Spacer for mobile sticky CTA */}
            <div className="h-20 sm:h-6" />
          </div>
        </main>
      </div>

      {/* Mobile curriculum drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[88%] max-w-[360px] bg-[#0a0e15] border-r border-white/[0.06] flex flex-col"
            >
              <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
                <span className="text-[13px] font-semibold text-white">Course content</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-md hover:bg-white/[0.05] text-gray-400" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <CurriculumRail
                  bootcamp={bootcamp}
                  lessonProgress={lessonProgress}
                  resumeLesson={resumeLesson}
                  resumeRef={resumeRef}
                  onNavigate={() => setDrawerOpen(false)}
                  totalLessons={totalLessons}
                  completedCount={completedCount}
                  progressPercent={progressPercent}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile sticky CTA */}
      {resumeLesson && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[#080b11]/95 backdrop-blur-xl px-4 py-3">
          <Link
            href={`/account/member/bootcamps/${bootcamp.id}/${resumeLesson.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20"
          >
            <Play className="h-4 w-4 fill-current" />
            {ctaLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
