/**
 * @file My-learning tab: enrolled and completed courses.
 * @module MyLearningTab
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Archive, BookOpen, CheckCircle, Clock, PlayCircle, Search } from 'lucide-react';
import SafeImg from '@/app/_components/ui/SafeImg';
import { EmptyState, cn, formatDuration, timeAgo } from './bootcamps-shared';

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


export { MyLearningTab };
