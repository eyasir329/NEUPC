/**
 * @file Bootcamp overview panel.
 * @module OverviewPanel
 */

'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, CheckSquare, CircleDot, Clock, GraduationCap, Layers, Play, Trophy, Users } from 'lucide-react';
import { getMemberBootcampSessions, getMemberBootcampTasks } from '@/app/_lib/actions/bootcamp-actions';
import { formatDurationSecs } from './learning-shared';

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
  enrollment,
}) {
  const ctaLabel = isComplete
    ? 'Review'
    : completedCount > 0
      ? 'Resume'
      : 'Start learning';

  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!bootcamp?.id) return;
    getMemberBootcampTasks(bootcamp.id)
      .then(setTasks)
      .catch(() => {});
    getMemberBootcampSessions(bootcamp.id)
      .then(setSessions)
      .catch(() => {});
  }, [bootcamp?.id]);

  const taskEarned = useMemo(() => {
    return tasks.reduce((sum, t) => {
      const sub = t.mySubmission;
      if (sub && sub.status === 'graded') {
        return sum + (sub.points_earned || 0);
      }
      return sum;
    }, 0);
  }, [tasks]);

  const taskMax = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.points || 0), 0);
  }, [tasks]);

  const sessionEarned = useMemo(() => {
    return sessions.reduce((sum, s) => {
      const myAtt = s.attendance_data?.find(
        (a) => a.user_id === enrollment?.user_id
      );
      return sum + (myAtt?.points || 0);
    }, 0);
  }, [sessions, enrollment?.user_id]);

  const sessionCount = useMemo(() => {
    return sessions.filter((s) =>
      s.attendance_data?.some(
        (a) => a.user_id === enrollment?.user_id && a.attended
      )
    ).length;
  }, [sessions, enrollment?.user_id]);

  const totalPoints = useMemo(() => {
    return allLessons.reduce((s, l) => s + (l.points ?? 10), 0);
  }, [allLessons]);

  const totalMaxPoints = totalPoints + taskMax;

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
          className={`mt-7 rounded-2xl border ${isComplete ? 'border-amber-500/20 bg-linear-to-br from-amber-500/[0.06] to-transparent' : 'border-emerald-500/20 bg-linear-to-br from-emerald-500/[0.06] to-transparent'} p-5 sm:p-6`}
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
                  ? 'bg-linear-to-r from-amber-500 to-amber-600 shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500'
                  : 'bg-linear-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500'
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-xl border border-white/10 bg-white/2 p-4">
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
          <div className="rounded-xl border border-white/10 bg-white/2 p-4">
            <div className="text-[10.5px] font-semibold tracking-wider text-gray-500 uppercase">
              Lessons
            </div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {completedCount}
              <span className="text-base text-gray-500">/{totalLessons}</span>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              {totalLessons - completedCount} left
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#161b22] p-4 ring-1 ring-violet-500/20">
            <div className="flex items-center gap-1 text-[10.5px] font-bold tracking-wider text-violet-400 uppercase">
              <Trophy className="h-3 w-3 text-amber-400" /> Score
            </div>
            <div className="mt-1 text-2xl font-black text-white tabular-nums">
              {enrollment?.score || 0}
              <span className="ml-1 text-[11px] font-semibold text-gray-500">
                /{totalMaxPoints} pts
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-linear-to-r from-violet-500 to-pink-500 transition-all duration-500"
                style={{
                  width: `${totalMaxPoints > 0 ? Math.min(100, Math.round(((enrollment?.score || 0) / totalMaxPoints) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/2 p-4">
            <div className="text-[10.5px] font-semibold tracking-wider text-gray-500 uppercase">
              Watched
            </div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {formatDurationSecs(totalWatchedSecs) || '0m'}
            </div>
            <div className="mt-2 truncate text-[11px] text-gray-500">
              of {formatDurationSecs(totalDurationSecs) || '—'}
            </div>
          </div>
        </div>
      </section>

      {/* Points & Performance Breakdown */}
      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
          Score Breakdown
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Curriculum Points */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/2 p-4.5 transition-all duration-300 hover:border-white/20">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-violet-400 uppercase">
                <BookOpen className="h-3.5 w-3.5" /> Curriculum
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                Points from video lessons, interactive practice exercises, and
                curriculum exams.
              </p>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white tabular-nums">
                {Math.max(
                  0,
                  (enrollment?.score || 0) - taskEarned - sessionEarned
                )}
                <span className="ml-1 text-xs font-semibold text-gray-500">
                  /{totalPoints} pts
                </span>
              </span>
              <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-400 ring-1 ring-violet-500/20">
                {totalPoints > 0
                  ? Math.round(
                      (Math.max(
                        0,
                        (enrollment?.score || 0) - taskEarned - sessionEarned
                      ) /
                        totalPoints) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>

          {/* Graded Task Points */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/2 p-4.5 transition-all duration-300 hover:border-white/20">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                <CheckSquare className="h-3.5 w-3.5" /> Weekly Tasks
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                Points earned from milestone homework assignments and reviewed
                programming tasks.
              </p>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white tabular-nums">
                {taskEarned}
                <span className="ml-1 text-xs font-semibold text-gray-500">
                  /{taskMax} pts
                </span>
              </span>
              <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/20">
                {taskMax > 0 ? Math.round((taskEarned / taskMax) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Sessions Attendance Points */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/2 p-4.5 transition-all duration-300 hover:border-white/20">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                <Users className="h-3.5 w-3.5" /> Live Sessions
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                Bonus attendance points earned from attending live mentorship
                and cohort group sessions.
              </p>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white tabular-nums">
                {sessionEarned}
                <span className="ml-1 text-xs font-semibold text-gray-500">
                  pts
                </span>
              </span>
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                {sessionCount} attended
              </span>
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
          <div className="rounded-xl border border-white/10 bg-white/2 p-5">
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
                className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/2 p-3"
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


export { OverviewPanel };
