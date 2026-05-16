'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, ChevronRight, ChevronUp, Play, FileText,
  CheckCircle2, Clock, BookOpen, Layers,
  GraduationCap, ArrowRight, Trophy, Zap,
  Video, TrendingUp, PlaySquare, BookOpenCheck, Lock, Unlock, MonitorPlay
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDurationMins(minutes) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function formatDurationSecs(seconds) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────

function LessonRow({ lesson, bootcampId, lessonProgress, index }) {
  const progress = lessonProgress?.[lesson.id];
  const isCompleted = progress?.is_completed;
  const hasVideo = lesson.video_source && lesson.video_source !== 'none';

  return (
    <Link
      href={`/account/member/bootcamps/${bootcampId}/${lesson.id}`}
      className="group flex items-center p-3 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-colors cursor-pointer mt-2"
    >
      <div className="mr-3 text-gray-500">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-medium group-hover:border-violet-500/50 group-hover:text-violet-400 transition-colors">
            {index + 1}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className={`text-sm font-medium transition-colors group-hover:text-violet-400 flex items-center gap-2 ${isCompleted ? 'text-gray-500 line-through decoration-white/20' : 'text-gray-300'}`}>
          {lesson.title}
          {lesson.is_locked && <Lock className="w-3 h-3 text-gray-600" />}
        </h5>
        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
          {hasVideo ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
          <span className="capitalize">{hasVideo ? 'video' : 'reading'}</span>
          {lesson.duration > 0 && (
            <>
              <span className="mx-1">·</span>
              <span>{formatDurationSecs(lesson.duration)}</span>
            </>
          )}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
        <Play className="w-4 h-4 text-violet-500 fill-current" />
      </div>
    </Link>
  );
}

// ─── Module Accordion ─────────────────────────────────────────────────────────

function ModuleAccordion({ module, bootcampId, lessonProgress, moduleIndex, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? moduleIndex === 0);

  const totalLessons = module.lessons?.length || 0;
  const completedCount = module.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed).length || 0;
  const allDone = completedCount === totalLessons && totalLessons > 0;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className={`bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden transition-all mb-3`}>
      <div 
        className="flex items-center p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center mr-4 ${allDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
          {allDone ? <CheckCircle2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate">{module.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {completedCount}/{totalLessons} completed · {totalLessons} lessons · {pct}%
          </p>
        </div>
        <div className="ml-4 text-gray-500">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
      
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 bg-black/20 border-t border-white/5">
              {module.lessons?.length > 0 ? (
                module.lessons.map((lesson, i) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    bootcampId={bootcampId}
                    lessonProgress={lessonProgress}
                    index={i}
                  />
                ))
              ) : (
                <p className="px-3 py-4 text-xs text-gray-600">No lessons yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Course Section ───────────────────────────────────────────────────────────

function CourseSection({ course, bootcampId, lessonProgress, courseIndex }) {
  const [open, setOpen] = useState(courseIndex === 0);

  const totalLessons = course.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0;
  const completedCount = course.modules?.reduce(
    (s, m) => s + (m.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed).length || 0), 0
  ) || 0;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent p-4 text-left transition-all hover:border-violet-500/30 hover:from-violet-500/10"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-500/10">
          <Layers className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-white truncate">{course.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            <span className="font-semibold text-violet-400">{completedCount}/{totalLessons}</span> completed
            <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
            <span>{course.modules?.length || 0} modules</span>
            <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
            <span>{pct}%</span>
          </p>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${open ? 'rotate-180 text-violet-400' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="ml-5 pl-5 border-l-2 border-violet-500/20 space-y-3 py-1">
              {course.modules?.map((module, mi) => (
                <ModuleAccordion
                  key={module.id}
                  module={module}
                  bootcampId={bootcampId}
                  lessonProgress={lessonProgress}
                  moduleIndex={mi}
                  defaultOpen={mi === 0 && courseIndex === 0}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Progress Ring (SVG) ──────────────────────────────────────────────────────

function ProgressRing({ percent, size = 80 }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
        <circle 
          cx="40" cy="40" r={radius} 
          stroke="currentColor" strokeWidth="6" 
          fill="transparent" 
          className="text-white/5" 
        />
        <circle 
          cx="40" cy="40" r={radius} 
          stroke="currentColor" strokeWidth="6" 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          className="text-violet-500 transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xl font-bold text-white tabular-nums">{percent}%</span>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 px-3 py-1 rounded-full text-xs font-medium">
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
  );
}

// ─── Watch Time Card (AreaChart — matches Daily Activity style) ──────────────────

function WatchTimeCard({ allLessons, lessonProgress }) {
  const totalSecs = allLessons.reduce((s, l) => s + (l.duration || 0), 0);
  const watchedSecs = allLessons
    .filter((l) => lessonProgress?.[l.id]?.is_completed)
    .reduce((s, l) => s + (l.duration || 0), 0);
  const remainingSecs = totalSecs - watchedSecs;

  function fmtSecs(s) {
    if (!s || s <= 0) return '0m';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    return `${m}m`;
  }

  // Build a 7-day area chart from recently-completed lessons
  // We use lesson index as a proxy for time (no timestamp on lessons)
  // Each data point represents a lesson bucket showing cumulative mins watched
  const chartData = useMemo(() => {
    // Group completed lessons into 7 equal buckets
    const completed = allLessons.filter((l) => lessonProgress?.[l.id]?.is_completed);
    if (completed.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({ label: `L${i + 1}`, mins: 0 }));
    }
    const buckets = 7;
    const size = Math.max(1, Math.ceil(allLessons.length / buckets));
    return Array.from({ length: buckets }, (_, b) => {
      const slice = allLessons.slice(b * size, (b + 1) * size);
      const mins = Math.round(
        slice.filter((l) => lessonProgress?.[l.id]?.is_completed)
          .reduce((s, l) => s + (l.duration || 0), 0) / 60
      );
      return { label: `§${b + 1}`, mins };
    });
  }, [allLessons, lessonProgress]);

  const maxMins = Math.max(...chartData.map((d) => d.mins), 1);

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-950 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl mb-4 sm:mb-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <PlaySquare className="h-4 w-4 text-rose-400" />
          Video Duration
        </h3>
        <div className="flex items-center gap-1 rounded-md bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-400 border border-violet-500/20">
          <PlaySquare className="h-3 w-3" />
          Total: {fmtSecs(watchedSecs)} / {fmtSecs(totalSecs)}
        </div>
      </div>

      <div className="h-[200px] w-full" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="bcGradMins" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }}
              tickFormatter={(v) => `${v}m`} domain={[0, maxMins]} />
            <ReTooltip
              contentStyle={{ backgroundColor: '#111114', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: 11 }}
              itemStyle={{ color: '#4ade80' }}
              labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
              formatter={(v) => [`${v}m`, 'Watched']}
            />
            <Area type="monotone" dataKey="mins" stroke="#4ade80" strokeWidth={2}
              fillOpacity={1} fill="url(#bcGradMins)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Module Track Section (calendar grid — matches Daily Activity style) ─────────

function ModuleTrackSection({ bootcamp, lessonProgress }) {
  const modules = useMemo(() => {
    const list = [];
    bootcamp?.courses?.forEach((course) => {
      if (course.is_published === false) return;
      course.modules?.forEach((mod) => {
        if (mod.is_published === false) return;
        const lessons = (mod.lessons || []).filter((l) => l.is_published !== false);
        const completed = lessons.filter((l) => lessonProgress?.[l.id]?.is_completed);
        list.push({
          id: mod.id,
          title: mod.title,
          courseName: course.title,
          lessons,
          completedIds: new Set(completed.map((l) => l.id)),
          total: lessons.length,
          completedCount: completed.length,
        });
      });
    });
    return list;
  }, [bootcamp, lessonProgress]);

  const [selectedModule, setSelectedModule] = useState(0);

  if (modules.length === 0) return null;

  const mod = modules[Math.min(selectedModule, modules.length - 1)];
  const { lessons, completedIds, total, completedCount } = mod;

  // Color levels matching ActivityViz
  const cellColor = (isCompleted) =>
    isCompleted ? 'bg-indigo-400' : 'bg-white/[0.04] hover:bg-indigo-500/20 hover:text-indigo-300';

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-950 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl mb-4 sm:mb-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <BookOpenCheck className="h-4 w-4 text-indigo-400" />
          Module Finish Track
        </h3>
        <div className="flex items-center gap-2">
          <select
            className="bg-transparent text-xs text-gray-400 focus:outline-none border border-white/[0.06] rounded-md px-2 py-1 cursor-pointer hover:bg-white/[0.01] transition-colors"
            value={selectedModule}
            onChange={(e) => setSelectedModule(Number(e.target.value))}
          >
            {modules.map((m, i) => (
              <option key={m.id} value={i}>{m.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-[11px] text-gray-500">
        <span className="font-semibold text-indigo-400">{completedCount}</span> of <span className="font-semibold text-white">{total}</span> lessons completed
        <span className="ml-2 text-gray-600">· {mod.courseName}</span>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
        {lessons.map((lesson, i) => {
          const done = completedIds.has(lesson.id);
          return (
            <div
              key={lesson.id}
              title={lesson.title}
              className={`flex aspect-square items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-default ${
                done
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'bg-white/[0.03] text-gray-600 hover:bg-white/[0.06]'
              }`}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> : i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function BootcampLearningClient({ bootcamp, lessonProgress = {} }) {
  const allLessons = useMemo(() => {
    const lessons = [];
    bootcamp?.courses?.forEach((c) => {
      if (c.is_published === false) return;
      c.modules?.forEach((m) => {
        if (m.is_published === false) return;
        m.lessons?.forEach((l) => {
          if (l.is_published === false) return;
          lessons.push(l);
        });
      });
    });
    return lessons;
  }, [bootcamp?.courses]);

  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => lessonProgress?.[l.id]?.is_completed).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isComplete = completedCount === totalLessons && totalLessons > 0;

  const resumeLesson = useMemo(
    () => allLessons.find((l) => !lessonProgress?.[l.id]?.is_completed) || allLessons[0],
    [allLessons, lessonProgress]
  );

  const totalDuration = bootcamp?.total_duration;
  const coursesCount = bootcamp?.courses?.length || 0;
  const modulesCount = bootcamp?.courses?.reduce((s, c) => s + (c.modules?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-[#080b11] text-white">
      {/* ── Topbar ── */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/6 bg-[#080b11]/95 px-4 py-3 backdrop-blur-xl">
        <Link
          href="/account/member/bootcamps"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-500 transition-colors hover:bg-white/6 hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Bootcamps</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <span className="text-gray-700">·</span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white/90">{bootcamp?.title}</span>
        {resumeLesson && (
          <Link
            href={`/account/member/bootcamps/${bootcamp.id}/${resumeLesson.id}`}
            className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-1.5 text-[11px] font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500 sm:flex"
          >
            <Play className="h-3 w-3 fill-current" />
            {completedCount > 0 ? 'Resume' : 'Start'}
          </Link>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ── Hero Card ── */}
        <div className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-black/40">
          {/* Abstract Background for Hero */}
          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950/50">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/cubes.png)' }} />
            {isComplete && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30 backdrop-blur-sm">
                <Trophy className="h-3 w-3" /> Course Complete!
              </div>
            )}
          </div>

          <div className="relative -mt-20 pt-12 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-end">
            <div className="flex-1 space-y-4">
              {bootcamp?.difficulty_level && (
                <span className="inline-block text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-sm border border-emerald-400/20">
                  {bootcamp.difficulty_level} Bootcamp
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                {bootcamp?.title}
              </h1>
              {bootcamp?.description && (
                <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">{bootcamp.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 pt-2">
                {coursesCount > 0 && <StatPill icon={Layers} label={`${coursesCount} courses`} />}
                {modulesCount > 0 && <StatPill icon={BookOpen} label={`${modulesCount} modules`} />}
                {totalLessons > 0 && <StatPill icon={GraduationCap} label={`${totalLessons} lessons`} />}
              </div>
            </div>
            
            <div className="w-full md:w-48 bg-[#080b11] border border-white/10 rounded-xl p-5 flex flex-col items-center shrink-0 shadow-lg relative z-10">
              <ProgressRing percent={progressPercent} size={80} />
              <div className="mt-3 text-center">
                <div className="text-sm font-semibold text-white">{progressPercent}% Completed</div>
                <div className="text-xs text-gray-500">{completedCount}/{totalLessons} lessons done</div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          {resumeLesson && (
            <div className="border-t border-white/5 bg-black/20 p-5 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                {completedCount > 0 ? 'Continue where you left off:' : 'Begin your learning journey:'}<br/>
                <span className="text-white font-medium">{resumeLesson.title}</span>
              </div>
              <Link
                href={`/account/member/bootcamps/${bootcamp.id}/${resumeLesson.id}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="fill-current w-4 h-4" />
                {completedCount > 0 ? 'Resume Learning' : 'Start Learning'}
              </Link>
            </div>
          )}
        </div>

        {/* ── 2-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left col: Module Track + Curriculum */}
          <div className="lg:col-span-2 space-y-8">
            <ModuleTrackSection bootcamp={bootcamp} lessonProgress={lessonProgress} />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-white">Course Curriculum</h2>
                  <p className="mt-0.5 text-[12px] text-gray-500">{completedCount}/{totalLessons} lessons completed</p>
                </div>
                {progressPercent > 0 && (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                    {progressPercent}% complete
                  </span>
                )}
              </div>

              {bootcamp?.courses?.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {bootcamp.courses.map((course, ci) => (
                    <CourseSection
                      key={course.id}
                      course={course}
                      bootcampId={bootcamp.id}
                      lessonProgress={lessonProgress}
                      courseIndex={ci}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-white/6 bg-gradient-to-br from-white/3 to-transparent py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                    <BookOpen className="h-8 w-8 text-gray-700" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">No curriculum yet</p>
                  <p className="mt-1.5 text-xs text-gray-600">The instructor hasn&apos;t published lessons yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right col: Sticky Sidebar */}
          <div>
            <div className="sticky top-24">
              <WatchTimeCard allLessons={allLessons} lessonProgress={lessonProgress} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

