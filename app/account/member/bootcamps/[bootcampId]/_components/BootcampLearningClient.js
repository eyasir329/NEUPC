/**
 * @file Bootcamp learning client — top-level layout and state.
 * Panels and helpers live in sibling modules.
 * @module BootcampLearningClient
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ChevronLeft, Loader2, Menu, Play, Trophy } from 'lucide-react';
import { checkEnrollment, getLesson, getLessonContent, markLessonComplete, markLessonIncomplete, recordLearningActivity, saveLessonNotes, touchLessonAccess } from '@/app/_lib/actions/bootcamp-actions';
import { CurriculumRail } from './CurriculumRail';
import { LessonPanel, LessonSkeleton } from './LessonPanel';
import { OverviewPanel } from './OverviewPanel';
import { SCROLLBAR, getLessonIdFromUrl, getNativeHistory } from './learning-shared';

export default function BootcampLearningClient({
  bootcamp,
  lessonProgress: initialProgress = {},
  enrollment: initialEnrollment = {},
  currentUser = null,
}) {
  const [lessonProgress, setLessonProgress] = useState(initialProgress);
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  // activeLessonId: what the sidebar highlights (set immediately on click)
  const [activeLessonId, setActiveLessonId] = useState(null);
  // loadedLesson: what is actually rendered in the main panel
  const [loadedLesson, setLoadedLesson] = useState(null);
  const [loading, startLoading] = useTransition();
  const [loadError, setLoadError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [completing, startCompleting] = useTransition();
  const isArchived = bootcamp?.status === 'archived';

  const refreshEnrollment = useCallback(async () => {
    try {
      const res = await checkEnrollment(bootcamp?.id);
      if (res.enrolled && res.enrollment) {
        setEnrollment(res.enrollment);
      }
    } catch (err) {
      console.error('Failed to refresh enrollment:', err);
    }
  }, [bootcamp?.id]);

  useEffect(() => {
    if (Object.keys(lessonProgress).length > 0) {
      refreshEnrollment();
    }
  }, [lessonProgress, refreshEnrollment]);

  const lessonCacheRef = useRef({});
  const prefetchInflightRef = useRef(new Set());
  const navTokenRef = useRef(0);
  const activeLessonIdRef = useRef(null);
  // Sync ref on every render — no useEffect lag
  activeLessonIdRef.current = activeLessonId;

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
  const totalWeight = allLessons.reduce((s, l) => s + (l.weight ?? 1), 0);
  const totalPoints = allLessons.reduce((s, l) => s + (l.points ?? 10), 0);
  const completedCount = allLessons.filter(
    (l) => lessonProgress?.[l.id]?.is_completed
  ).length;
  const completedWeight = allLessons
    .filter((l) => lessonProgress?.[l.id]?.is_completed)
    .reduce((s, l) => s + (l.weight ?? 1), 0);
  const progressPercent =
    totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  const isComplete = totalWeight > 0 && completedWeight >= totalWeight;

  const resumeLesson = useMemo(() => {
    // Find the most recently accessed lesson (by updated_at)
    let lastAccessedLesson = null;
    let lastAccessedAt = null;
    for (const l of allLessons) {
      const p = lessonProgress?.[l.id];
      if (!p?.updated_at) continue;
      if (!lastAccessedAt || p.updated_at > lastAccessedAt) {
        lastAccessedAt = p.updated_at;
        lastAccessedLesson = l;
      }
    }
    if (lastAccessedLesson) return lastAccessedLesson;
    // No history: return first uncompleted lesson or first lesson
    return (
      allLessons.find((l) => !lessonProgress?.[l.id]?.is_completed) ||
      allLessons[0]
    );
  }, [allLessons, lessonProgress]);
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

  // Stable refs so all callbacks below can have [] deps
  const allLessonsRef = useRef(allLessons);
  allLessonsRef.current = allLessons; // sync inline, no useEffect needed

  const bootcampRef = useRef(bootcamp);
  bootcampRef.current = bootcamp;

  // These never recreate — they read everything through stable refs
  const loadFullLesson = useCallback(async (lessonId) => {
    const cached = lessonCacheRef.current[lessonId];
    if (cached && cached.content !== undefined) return cached;
    const stub = allLessonsRef.current.find((l) => l.id === lessonId);
    if (!stub) {
      const full = await getLesson(lessonId);
      lessonCacheRef.current[lessonId] = full;
      return full;
    }
    const content = await getLessonContent(lessonId);
    const merged = content ? { ...stub, ...content } : stub;
    lessonCacheRef.current[lessonId] = merged;
    return merged;
  }, []); // stable — only reads refs

  const prefetchLesson = useCallback((lesson) => {
    if (!lesson?.id) return;
    if (lessonCacheRef.current[lesson.id]?.content !== undefined) return;
    if (prefetchInflightRef.current.has(lesson.id)) return;
    prefetchInflightRef.current.add(lesson.id);
    const stub =
      allLessonsRef.current.find((l) => l.id === lesson.id) || lesson;
    getLessonContent(lesson.id)
      .then((content) => {
        lessonCacheRef.current[lesson.id] = content
          ? { ...stub, ...content }
          : stub;
      })
      .catch(() => {})
      .finally(() => {
        prefetchInflightRef.current.delete(lesson.id);
      });
  }, []); // stable — only reads refs

  // Core navigation. `mode`: 'push' (default — entering from overview / new entry),
  // 'replace' (lesson-to-lesson switch), 'none' (browser popstate — URL already set).
  // Fully stable ([] deps) — reads everything through refs.
  const navigateToLesson = useCallback(
    (lesson, mode = 'push') => {
      const token = ++navTokenRef.current;
      const bootcampId = bootcampRef.current?.id;
      const nativeHistory = getNativeHistory();
      const pushState = nativeHistory.pushState
        ? nativeHistory.pushState.bind(window.history)
        : window.history.pushState.bind(window.history);
      const replaceState = nativeHistory.replaceState
        ? nativeHistory.replaceState.bind(window.history)
        : window.history.replaceState.bind(window.history);

      if (!lesson) {
        setActiveLessonId(null);
        setLoadedLesson(null);
        setLoadError(null);
        if (mode !== 'none') {
          const url = `/account/member/bootcamps/${bootcampId}`;
          if (mode === 'replace') replaceState(null, '', url);
          else pushState(null, '', url);
        }
        return;
      }

      const url = `/account/member/bootcamps/${bootcampId}/${lesson.id}`;
      // Use History API directly to avoid Next.js server re-render on dynamic segment change
      if (mode === 'push') pushState(null, '', url);
      else if (mode === 'replace') replaceState(null, '', url);

      setActiveLessonId(lesson.id);
      setLoadError(null);

      // Fire-and-forget so resume tracking works for non-video lessons too
      touchLessonAccess(lesson.id, bootcampId).catch(() => {});
      // Optimistically update updated_at so resumeLesson re-computes in this session
      setLessonProgress((prev) => ({
        ...prev,
        [lesson.id]: {
          ...prev[lesson.id],
          updated_at: new Date().toISOString(),
        },
      }));

      // Fast path: already have full content in cache
      const cached = lessonCacheRef.current[lesson.id];
      if (cached && cached.content !== undefined) {
        setLoadedLesson(cached);
        return;
      }
      // Lesson object already carries content (e.g. SSR initial lesson passed directly)
      if (lesson.content !== undefined) {
        lessonCacheRef.current[lesson.id] = lesson;
        setLoadedLesson(lesson);
        return;
      }

      // Instant render: show stub immediately (title, video metadata available from
      // curriculum) so the header and video mount with zero wait. Content body
      // (markdown, attachments) streams in when the small content fetch resolves.
      const stub =
        allLessonsRef.current.find((l) => l.id === lesson.id) || lesson;
      const optimisticLesson = {
        ...stub,
        content: undefined,
        _pendingContent: true,
      };
      setLoadedLesson(optimisticLesson);

      startLoading(async () => {
        try {
          const full = await loadFullLesson(lesson.id);
          if (navTokenRef.current !== token) return;
          if (!full) {
            setLoadError('Lesson not found.');
            return;
          }
          setLoadedLesson(full);
        } catch {
          if (navTokenRef.current !== token) return;
          setLoadError('Failed to load lesson. Please try again.');
        }
      });
    },
    [] // stable — reads everything through refs
  );

  // Wrapper used by UI: smart-detect push vs replace, skip no-op.
  // Stable identity (reads everything via refs) so memoized children never re-render due to this.
  const selectLesson = useCallback(
    (lesson) => {
      const current = activeLessonIdRef.current;
      if (!lesson) {
        if (!current) return;
        return navigateToLesson(null, 'push');
      }
      if (lesson.id === current) return;
      if (lesson.is_locked) return;
      const bc = bootcampRef.current;
      const parentCourse = bc?.courses?.find((c) =>
        (c.modules || []).some((m) =>
          (m.lessons || []).some((l) => l.id === lesson.id)
        )
      );
      if (parentCourse?.is_locked) return;
      const parentModule = (parentCourse?.modules || []).find((m) =>
        (m.lessons || []).some((l) => l.id === lesson.id)
      );
      if (parentModule?.is_locked) return;
      const mode = current ? 'replace' : 'push';
      navigateToLesson(lesson, mode);
    },
    [navigateToLesson]
  );

  // On mount: if URL already contains a lessonId (direct link / page refresh),
  // navigate to it immediately client-side. The layout no longer passes SSR lesson data
  // since it's shared across all lesson URLs — the client fetches it.
  useEffect(() => {
    const lessonId = getLessonIdFromUrl();
    if (lessonId) {
      navigateToLesson({ id: lessonId }, 'none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefetch neighbors whenever the loaded lesson changes (reads allLessons via ref — stable dep)
  useEffect(() => {
    if (!loadedLesson?.id) return;
    const lessons = allLessonsRef.current;
    const idx = lessons.findIndex((l) => l.id === loadedLesson.id);
    if (idx < 0) return;
    const schedule = (cb) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(cb, { timeout: 1500 });
      } else {
        setTimeout(cb, 300);
      }
    };
    const neighbors = [
      lessons[idx - 1],
      lessons[idx + 1],
      lessons[idx + 2],
    ].filter(Boolean);
    neighbors.forEach((l) => schedule(() => prefetchLesson(l)));
  }, [loadedLesson?.id, prefetchLesson]);

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
      if (isArchived) return;
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
        refreshEnrollment();
      });
    },
    [bootcamp, moduleIndex, lessonProgress, refreshEnrollment, isArchived]
  );

  const handleMarkIncomplete = useCallback(
    (lessonId) => {
      if (isArchived) return;
      startCompleting(async () => {
        await markLessonIncomplete(lessonId, bootcamp?.id);
        setLessonProgress((prev) => ({
          ...prev,
          [lessonId]: { ...prev[lessonId], is_completed: false },
        }));
        refreshEnrollment();
      });
    },
    [bootcamp?.id, refreshEnrollment, isArchived]
  );

  const handleSaveNotes = useCallback(
    async (lessonId, notes) => {
      if (isArchived) return;
      await saveLessonNotes(lessonId, notes);
      setLessonProgress((prev) => ({
        ...prev,
        [lessonId]: { ...prev[lessonId], notes },
      }));
    },
    [isArchived]
  );

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950 text-white">
      <style dangerouslySetInnerHTML={{ __html: SCROLLBAR }} />

      {/* Topbar */}
      <header className="shrink-0 border-b border-white/10 bg-zinc-950/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
          {isLessonView ? (
            <button
              onClick={() => selectLesson(null)}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
          ) : (
            <Link
              href="/account/member/bootcamps"
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Bootcamps</span>
            </Link>
          )}

          <span className="text-gray-700">/</span>
          <div className="flex min-w-0 flex-1 items-center gap-2 truncate text-[13px] font-semibold text-white/90">
            <span className="truncate">
              {isLessonView
                ? pendingLessonStub?.title || loadedLesson?.title || 'Loading…'
                : bootcamp?.title}
            </span>
            {isSwitching && (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-400" />
            )}
          </div>

          {/* Points display */}
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-linear-to-r from-violet-500/10 to-pink-500/10 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/10">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="mr-0.5 hidden font-medium text-gray-400 sm:inline">
              Points:
            </span>
            <span className="text-white">{enrollment.score || 0}</span>
            <span className="font-medium text-gray-500">/{totalPoints}</span>
          </div>

          {/* Mobile: open curriculum drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
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
        <aside className="hidden h-full w-[320px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-zinc-900 lg:flex xl:w-[360px]">
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
                onProgressUpdate={setLessonProgress}
                onRefreshEnrollment={refreshEnrollment}
                isArchived={isArchived}
                currentUser={currentUser}
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
              enrollment={enrollment}
              isArchived={isArchived}
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
              className="fixed top-0 left-0 z-50 flex h-[100dvh] w-[88%] max-w-[360px] flex-col overflow-hidden border-r border-white/10 bg-zinc-900 lg:hidden"
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
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl sm:hidden">
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
