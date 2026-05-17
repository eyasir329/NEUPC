'use client';

import { useState, useMemo, useRef, useEffect, useCallback, useTransition, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, Play, FileText,
  CheckCircle2, BookOpen, Layers, GraduationCap, Trophy,
  Video, Lock, Search, X, Menu, Clock, CircleDot,
  ChevronRight, Circle, Download, StickyNote, List,
  Loader2, AlertCircle, ArrowLeft,
} from 'lucide-react';
import {
  getLesson,
  updateLessonProgress,
  markLessonComplete,
  markLessonIncomplete,
  saveLessonNotes,
} from '@/app/_lib/bootcamp-actions';
import VideoPlayer from '../[lessonId]/_components/VideoPlayer';
import LessonContentRenderer from '../[lessonId]/_components/LessonContentRenderer';

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
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SCROLLBAR = `
  .spa-scroll::-webkit-scrollbar { width: 5px; }
  .spa-scroll::-webkit-scrollbar-track { background: transparent; }
  .spa-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius:10px; }
  .spa-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
  .spa-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
`;

// ─── Curriculum Rail ──────────────────────────────────────────────────────────

const LessonRow = memo(function LessonRow({ lesson, isActive, isCompleted, onSelect, index }) {
  const hasVideo = lesson.video_source && lesson.video_source !== 'none';
  const duration = formatDurationSecs(lesson.duration);
  return (
    <button
      onClick={() => onSelect(lesson)}
      className={`group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 border text-left transition-colors ${
        isActive
          ? 'bg-emerald-500/[0.08] border-emerald-500/30'
          : 'border-transparent hover:bg-white/[0.04] hover:border-white/10'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : isActive ? (
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40 flex items-center justify-center">
            <Play className="w-2 h-2 fill-emerald-400 text-emerald-400" />
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full border border-white/15 flex items-center justify-center text-[8px] font-medium text-gray-600 group-hover:border-violet-500/40 group-hover:text-violet-400 transition-colors">
            {index + 1}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[12.5px] leading-snug flex items-start gap-1.5 ${
          isCompleted ? 'text-gray-500 line-through decoration-white/15'
          : isActive ? 'text-white font-medium'
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
    </button>
  );
});

function ModuleGroup({ module, lessonProgress, activeLessonId, resumeLessonId, onSelect, forceOpen }) {
  const containsActive = module.lessons?.some((l) => l.id === activeLessonId || l.id === resumeLessonId);
  const [open, setOpen] = useState(containsActive);

  const total = module.lessons?.length || 0;
  const done = module.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed).length || 0;
  const allDone = total > 0 && done === total;

  const isOpen = forceOpen || open;

  return (
    <div className="ml-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/[0.03] text-left group"
      >
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
        <span className={`flex-1 text-[12px] font-medium truncate ${allDone ? 'text-gray-500' : 'text-gray-300'} group-hover:text-white`}>
          {module.title}
        </span>
        <span className={`text-[10px] tabular-nums shrink-0 ${allDone ? 'text-emerald-500' : 'text-gray-600'}`}>
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
            <div className="pl-4 pt-1 space-y-0.5">
              {module.lessons?.map((lesson, i) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  isActive={lesson.id === activeLessonId}
                  isCompleted={lessonProgress?.[lesson.id]?.is_completed}
                  onSelect={onSelect}
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

function CourseGroup({ course, lessonProgress, activeLessonId, resumeLessonId, courseIndex, onSelect, forceOpen }) {
  const containsActive = course.modules?.some((m) => m.lessons?.some((l) => l.id === activeLessonId || l.id === resumeLessonId));
  const [open, setOpen] = useState(containsActive || courseIndex === 0);

  const total = course.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0;
  const done = course.modules?.reduce((s, m) => s + (m.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed).length || 0), 0) || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const isOpen = forceOpen || open;

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-3 hover:bg-white/[0.03] text-left group"
      >
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
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
        {isOpen && (
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
                  lessonProgress={lessonProgress}
                  activeLessonId={activeLessonId}
                  resumeLessonId={resumeLessonId}
                  onSelect={onSelect}
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

function CurriculumRail({ bootcamp, lessonProgress, activeLessonId, resumeLesson, onSelect, totalLessons, completedCount, progressPercent, onClose }) {
  const [query, setQuery] = useState('');
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) activeRef.current.scrollIntoView({ block: 'nearest' });
  }, [activeLessonId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return bootcamp?.courses || [];
    const q = query.trim().toLowerCase();
    return (bootcamp?.courses || [])
      .map((c) => {
        const modules = (c.modules || [])
          .map((m) => {
            const lessons = (m.lessons || []).filter((l) => l.title?.toLowerCase().includes(q));
            return m.title?.toLowerCase().includes(q) ? m : lessons.length ? { ...m, lessons } : null;
          })
          .filter(Boolean);
        return c.title?.toLowerCase().includes(q) ? c : modules.length ? { ...c, modules } : null;
      })
      .filter(Boolean);
  }, [bootcamp?.courses, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold tracking-wider uppercase text-gray-500">Course content</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tabular-nums text-gray-600">{completedCount}/{totalLessons}</span>
            {onClose && (
              <button onClick={onClose} className="p-1 rounded-md hover:bg-white/[0.05] text-gray-500 hover:text-white lg:hidden">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
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
            <button onClick={() => setQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/5 text-gray-500">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain spa-scroll">
        {filtered.length > 0 ? (
          filtered.map((course, ci) => (
            <CourseGroup
              key={course.id}
              course={course}
              lessonProgress={lessonProgress}
              activeLessonId={activeLessonId}
              resumeLessonId={query ? null : resumeLesson?.id}
              courseIndex={ci}
              onSelect={(lesson) => { onSelect(lesson); onClose?.(); }}
              forceOpen={!!query}
            />
          ))
        ) : query ? (
          <div className="px-4 py-10 text-center">
            <Search className="mx-auto mb-2 w-5 h-5 text-gray-700" />
            <p className="text-[12px] text-gray-500">No matches for &ldquo;{query}&rdquo;</p>
            <button onClick={() => setQuery('')} className="mt-2 text-[11px] text-violet-400 hover:text-violet-300">Clear</button>
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

// ─── Notes Panel ──────────────────────────────────────────────────────────────

function NotesPanel({ lessonId, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => { setNotes(initialNotes || ''); }, [initialNotes]);

  const handleSave = useCallback(() => {
    startSaving(async () => {
      await saveLessonNotes(lessonId, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }, [lessonId, notes]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5 text-yellow-400" />
          <h3 className="text-[13px] font-semibold text-white">My Notes</h3>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-gray-300 transition-all hover:bg-white/10 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Saved</> : 'Save'}
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Take notes while watching…"
        className="w-full resize-none bg-transparent px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none spa-scroll"
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
        if (!el.id) el.id = `h-${i}-${el.textContent.slice(0, 20).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}`;
        items.push({ id: el.id, text: el.textContent, level: parseInt(el.tagName.charAt(1)) });
      });
      setHeadings(items);
    }, 400);
    return () => clearTimeout(timer);
  }, [contentRef]);

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => { const v = entries.filter((e) => e.isIntersecting); if (v.length) setActiveId(v[0].target.id); },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    headings.forEach((h) => { const el = document.getElementById(h.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <div className="sticky top-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <List className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">On this page</span>
      </div>
      <nav>
        <ul className="space-y-0.5 border-l border-white/[0.08]">
          {headings.map((h) => {
            const isActive = activeId === h.id;
            const indent = h.level === 2 ? 'pl-3' : h.level === 3 ? 'pl-5' : 'pl-7';
            return (
              <li key={h.id}>
                <button
                  onClick={() => { document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveId(h.id); }}
                  className={`w-full text-left py-1.5 ${indent} text-[11px] leading-snug transition-all border-l-2 -ml-px truncate ${
                    isActive ? 'border-violet-500 text-violet-300 font-semibold' : 'border-transparent text-gray-600 hover:text-gray-400 hover:border-gray-600'
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

function OverviewPanel({ bootcamp, allLessons, lessonProgress, progressPercent, completedCount, totalLessons, totalWatchedSecs, totalDurationSecs, resumeLesson, resumeIndex, isComplete, onSelectLesson, coursesCount, modulesCount }) {
  const ctaLabel = isComplete ? 'Review' : completedCount > 0 ? 'Resume' : 'Start learning';

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
      {/* Title + meta */}
      <div className="space-y-3">
        {bootcamp?.difficulty_level && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300 ring-1 ring-violet-500/20">
            {bootcamp.difficulty_level}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{bootcamp?.title}</h1>
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
            <button
              onClick={() => onSelectLesson(resumeLesson)}
              className={`shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] ${
                isComplete
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {ctaLabel}
            </button>
          </div>
        </div>
      )}

      {/* Progress tiles */}
      <section className="mt-8">
        <h2 className="text-[11px] font-bold tracking-wider uppercase text-gray-500 mb-3">Your progress</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10.5px] uppercase tracking-wider text-gray-500 font-semibold">Overall</div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">{progressPercent}<span className="text-base text-gray-500">%</span></div>
            <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
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

      <div className="h-8" />
    </div>
  );
}

// ─── Lesson Panel ─────────────────────────────────────────────────────────────

function LessonPanel({ lesson, lessonProgress, allLessons, onSelectLesson, onMarkComplete, onMarkIncomplete, completing, isCompleted, currentIndex }) {
  const contentAreaRef = useRef(null);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const initialPosition = lessonProgress[lesson.id]?.last_position || 0;
  const [localCompleted, setLocalCompleted] = useState(isCompleted);

  useEffect(() => { setLocalCompleted(isCompleted); }, [isCompleted]);

  const handleProgress = useCallback(async (progressData) => {
    try {
      await updateLessonProgress(lesson.id, {
        watch_time: Math.floor(progressData.watchTime),
        last_position: Math.floor(progressData.currentTime),
        is_completed: false,
      });
    } catch {}
  }, [lesson.id]);

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

  const hasVideo = lesson.video_source && lesson.video_source !== 'none' && (lesson.video_id || lesson.video_url);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable content + TOC */}
      <div className="flex flex-1 overflow-hidden">
        <div ref={contentAreaRef} className="flex-1 min-w-0 overflow-y-auto spa-scroll">
          <div className="mx-auto max-w-5xl 2xl:max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8 pb-8">

            {/* Lesson title */}
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4 sm:p-5">
              <h1 className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight text-white lg:text-2xl">
                {lesson.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {lesson.duration > 0 && (
                  <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <Clock className="h-3.5 w-3.5" /> {formatDurationFull(lesson.duration)}
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

            {/* Video */}
            {hasVideo && (
              <VideoPlayer
                lesson={lesson}
                initialPosition={initialPosition}
                onProgress={handleProgress}
                onComplete={handleVideoComplete}
              />
            )}

            {/* Completion toggle */}
            <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border px-4 py-4 transition-all ${
              localCompleted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/[0.08] bg-white/[0.02]'
            }`}>
              <div className="flex items-center gap-3">
                {localCompleted
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  : <Circle className="h-5 w-5 text-gray-600 shrink-0" />
                }
                <div>
                  <p className={`text-sm font-semibold ${localCompleted ? 'text-emerald-300' : 'text-white'}`}>
                    {localCompleted ? 'Lesson complete!' : 'Mark as complete'}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {localCompleted ? 'Great work — keep going!' : 'Mark done when finished'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                disabled={completing}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-50 active:scale-95 ${
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
            {lesson.content && <LessonContentRenderer content={lesson.content} lessonId={lesson.id} />}

            {/* Attachments */}
            {lesson.attachments?.length > 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <Download className="h-4 w-4 text-purple-400" />
                  <h3 className="text-[13px] font-semibold text-white">Attachments</h3>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lesson.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs text-gray-300 transition-all hover:bg-white/5 hover:border-white/10"
                    >
                      <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="truncate">{att.name || `Attachment ${i + 1}`}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <NotesPanel lessonId={lesson.id} initialNotes={lessonProgress[lesson.id]?.notes} />
          </div>
        </div>

        {/* TOC (xl+) */}
        <div className="hidden xl:block w-64 shrink-0 border-l border-white/[0.06] overflow-y-auto spa-scroll p-4 pt-8">
          <TableOfContents contentRef={contentAreaRef} />
        </div>
      </div>

      {/* Lesson nav footer */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#080b11] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {prevLesson ? (
            <button
              onClick={() => onSelectLesson(prevLesson)}
              className="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 sm:px-4 py-2.5 text-[12px] sm:text-[13px] font-medium text-gray-400 transition-all hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline max-w-[200px] md:max-w-[300px] truncate">{prevLesson.title}</span>
              <span className="sm:hidden">Prev</span>
            </button>
          ) : <div />}

          <span className="text-[11px] text-gray-600 tabular-nums">
            {currentIndex + 1} / {allLessons.length}
          </span>

          {nextLesson ? (
            <button
              onClick={() => onSelectLesson(nextLesson)}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-3 sm:px-5 py-2.5 text-[12px] sm:text-[13px] font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-violet-600"
            >
              <span className="hidden sm:inline max-w-[200px] md:max-w-[300px] truncate">{nextLesson.title}</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              onClick={() => onSelectLesson(null)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 sm:px-5 py-2.5 text-[12px] sm:text-[13px] font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500"
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
}

// ─── Main SPA Shell ───────────────────────────────────────────────────────────

export default function BootcampLearningClient({ bootcamp, lessonProgress: initialProgress = {}, initialLessonId = null }) {
  const [lessonProgress, setLessonProgress] = useState(initialProgress);
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId);
  const [loadedLesson, setLoadedLesson] = useState(null);
  const [loading, startLoading] = useTransition();
  const [loadError, setLoadError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [completing, startCompleting] = useTransition();

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
  const totalWatchedSecs = allLessons.filter((l) => lessonProgress?.[l.id]?.is_completed).reduce((s, l) => s + (l.duration || 0), 0);
  const totalDurationSecs = allLessons.reduce((s, l) => s + (l.duration || 0), 0);

  const currentIndex = useMemo(
    () => (activeLessonId ? allLessons.findIndex((l) => l.id === activeLessonId) : -1),
    [allLessons, activeLessonId]
  );

  // Load initial lesson from URL if provided
  useEffect(() => {
    if (initialLessonId && !loadedLesson) {
      navigateToLesson({ id: initialLessonId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateToLesson = useCallback((lesson) => {
    if (!lesson) {
      // Go back to overview
      setActiveLessonId(null);
      setLoadedLesson(null);
      setLoadError(null);
      window.history.pushState({}, '', `/account/member/bootcamps/${bootcamp.id}`);
      return;
    }

    setActiveLessonId(lesson.id);
    setLoadError(null);

    // Update URL without navigation
    window.history.pushState({}, '', `/account/member/bootcamps/${bootcamp.id}/${lesson.id}`);

    // Check if we already have the full lesson data cached on the stub
    if (lesson.content !== undefined) {
      setLoadedLesson(lesson);
      return;
    }

    startLoading(async () => {
      try {
        const full = await getLesson(lesson.id);
        setLoadedLesson(full);
      } catch (e) {
        setLoadError('Failed to load lesson. Please try again.');
        setActiveLessonId(null);
      }
    });
  }, [bootcamp?.id]);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const match = path.match(/\/bootcamps\/[^/]+\/([^/]+)$/);
      if (match) {
        navigateToLesson({ id: match[1] });
      } else {
        setActiveLessonId(null);
        setLoadedLesson(null);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [navigateToLesson]);

  const handleMarkComplete = useCallback((lessonId) => {
    startCompleting(async () => {
      await markLessonComplete(lessonId);
      setLessonProgress((prev) => ({ ...prev, [lessonId]: { ...prev[lessonId], is_completed: true } }));
    });
  }, []);

  const handleMarkIncomplete = useCallback((lessonId) => {
    startCompleting(async () => {
      await markLessonIncomplete(lessonId);
      setLessonProgress((prev) => ({ ...prev, [lessonId]: { ...prev[lessonId], is_completed: false } }));
    });
  }, []);

  const ctaLabel = isComplete ? 'Review' : completedCount > 0 ? 'Resume' : 'Start learning';
  const isLessonView = !!activeLessonId;

  return (
    <div className="min-h-screen bg-[#080b11] text-white">
      <style dangerouslySetInnerHTML={{ __html: SCROLLBAR }} />

      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080b11]/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 sm:px-5 h-14">
          {isLessonView ? (
            <button
              onClick={() => navigateToLesson(null)}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
          ) : (
            <Link
              href="/account/member/bootcamps"
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Bootcamps</span>
            </Link>
          )}

          <span className="text-gray-700">/</span>
          <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white/90">
            {isLessonView && loadedLesson ? loadedLesson.title : bootcamp?.title}
          </div>

          {/* Mobile: open curriculum drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Open curriculum"
          >
            <Menu className="h-4 w-4" />
          </button>

          {!isLessonView && resumeLesson && (
            <button
              onClick={() => navigateToLesson(resumeLesson)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm shadow-emerald-500/20 transition-colors"
            >
              <Play className="h-3 w-3 fill-current" />
              {ctaLabel}
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-[320px] xl:w-[360px] shrink-0 border-r border-white/[0.06] bg-[#0a0e15] h-full">
          <CurriculumRail
            bootcamp={bootcamp}
            lessonProgress={lessonProgress}
            activeLessonId={activeLessonId}
            resumeLesson={activeLessonId ? null : resumeLesson}
            onSelect={navigateToLesson}
            totalLessons={totalLessons}
            completedCount={completedCount}
            progressPercent={progressPercent}
          />
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0 overflow-y-auto spa-scroll">
          <AnimatePresence mode="wait">
            {loading && !loadedLesson ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full min-h-[400px]"
              >
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-[13px]">Loading lesson…</span>
                </div>
              </motion.div>
            ) : loadError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full min-h-[400px]"
              >
                <div className="flex flex-col items-center gap-3 text-gray-500 text-center px-4">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <span className="text-[13px]">{loadError}</span>
                  <button
                    onClick={() => { setLoadError(null); setActiveLessonId(null); }}
                    className="text-[12px] text-violet-400 hover:text-violet-300"
                  >
                    Back to overview
                  </button>
                </div>
              </motion.div>
            ) : isLessonView && loadedLesson ? (
              <motion.div
                key={loadedLesson.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <LessonPanel
                  lesson={loadedLesson}
                  lessonProgress={lessonProgress}
                  allLessons={allLessons}
                  onSelectLesson={navigateToLesson}
                  onMarkComplete={handleMarkComplete}
                  onMarkIncomplete={handleMarkIncomplete}
                  completing={completing}
                  isCompleted={lessonProgress[loadedLesson.id]?.is_completed}
                  currentIndex={currentIndex}
                />
              </motion.div>
            ) : (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
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
                  onSelectLesson={navigateToLesson}
                  coursesCount={coursesCount}
                  modulesCount={modulesCount}
                />
              </motion.div>
            )}
          </AnimatePresence>
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
              <CurriculumRail
                bootcamp={bootcamp}
                lessonProgress={lessonProgress}
                activeLessonId={activeLessonId}
                resumeLesson={activeLessonId ? null : resumeLesson}
                onSelect={navigateToLesson}
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
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[#080b11]/95 backdrop-blur-xl px-4 py-3">
          <button
            onClick={() => navigateToLesson(resumeLesson)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20"
          >
            <Play className="h-4 w-4 fill-current" />
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}
