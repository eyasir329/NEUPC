/**
 * @file Bootcamps overview tab.
 * @module OverviewTab
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Clock, Flame, PlayCircle, Sparkles } from 'lucide-react';
import SafeImg from '@/app/_components/ui/SafeImg';
import { LearningCalendar } from './LearningCalendar';
import { WatchTimeChart } from './WatchTimeChart';
import { EmptyState, cn, formatDuration, timeAgo } from './bootcamps-shared';

function OverviewTab({
  user,
  enrolledBootcamps,
  archivedBootcamps,
  totalLessonsCompleted,
  streak,
  availableBootcamps,
  learningActivity,
  onTab,
}) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const continueBootcamp =
    enrolledBootcamps.find((e) => {
      const total = e.bootcamp?.total_lessons || 0;
      const done = e.enrollment?.completed_lessons || 0;
      return total === 0 || done < total;
    }) || enrolledBootcamps[0];

  const courses = useMemo(() => {
    const seen = new Set();
    const list = [];
    [...enrolledBootcamps, ...archivedBootcamps].forEach(({ bootcamp }) => {
      if (!bootcamp?.id || seen.has(bootcamp.id)) return;
      seen.add(bootcamp.id);
      list.push({ id: bootcamp.id, title: bootcamp.title });
    });
    return list;
  }, [enrolledBootcamps, archivedBootcamps]);

  const stats = [
    {
      title: 'Enrolled Courses',
      value: String(enrolledBootcamps.length),
      icon: BookOpen,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    {
      title: 'Lessons Completed',
      value: String(totalLessonsCompleted),
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Current Streak',
      value: `${streak} ${streak === 1 ? 'Day' : 'Days'}`,
      icon: Flame,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
  ];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      initial="hidden"
      animate="show"
      className="space-y-8 p-1"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
          },
        }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-violet-300">{firstName}!</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base">
            {enrolledBootcamps.length === 0
              ? 'Pick a bootcamp from the catalog to get started.'
              : "You're making great progress. Keep up the momentum."}
          </p>
        </div>
        <button
          onClick={() => onTab('catalog')}
          className="flex w-fit items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition-all hover:border-violet-500/30 hover:bg-violet-500/20"
        >
          <Sparkles className="h-4 w-4" />
          Browse new bootcamps
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
          },
        }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20"
          >
            <div
              className={cn(
                'pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-70',
                stat.bg
              )}
            />
            <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
                {stat.title}
              </span>
              <div
                className={cn(
                  'rounded-lg border p-2 ring-1 ring-white/10',
                  stat.bg,
                  stat.border
                )}
              >
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>
            <div className="relative z-10 text-3xl font-bold text-white tabular-nums">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Calendar + Watch Time */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
          },
        }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <div className="flex h-full flex-col">
          <LearningCalendar
            enrolledBootcamps={enrolledBootcamps}
            archivedBootcamps={archivedBootcamps}
            courses={courses}
          />
        </div>
        <div className="flex h-full flex-col">
          <WatchTimeChart
            learningActivity={learningActivity}
            courses={courses}
          />
        </div>
      </motion.div>

      {/* Pick up where you left off */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
          },
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Pick up where you left off
          </h2>
          {enrolledBootcamps.length > 1 && (
            <button
              onClick={() => onTab('mylearning')}
              className="text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
            >
              View all
            </button>
          )}
        </div>

        {continueBootcamp ? (
          <Link
            href={`/account/member/bootcamps/${continueBootcamp.bootcamp.id}`}
            className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-2 shadow-lg shadow-black/30 backdrop-blur-xl transition-all hover:border-violet-500/40 hover:bg-zinc-900/70"
          >
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 opacity-60 blur-[80px] transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-0 bg-linear-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 flex flex-col gap-6 p-4 md:flex-row">
              <div className="relative hidden h-40 w-64 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-linear-to-br from-indigo-950 to-slate-900 md:block">
                {continueBootcamp.bootcamp.thumbnail ? (
                  <SafeImg
                    src={continueBootcamp.bootcamp.thumbnail}
                    alt={continueBootcamp.bootcamp.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    {continueBootcamp.bootcamp.difficulty_level && (
                      <span className="mb-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                        {continueBootcamp.bootcamp.difficulty_level}
                      </span>
                    )}
                    <span className="text-sm leading-tight font-bold text-white/90">
                      {continueBootcamp.bootcamp.title}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center space-y-5">
                <div>
                  <span className="mb-1 block text-xs font-semibold tracking-wide text-violet-400 uppercase">
                    {timeAgo(continueBootcamp.enrollment?.last_accessed_at)
                      ? `Last active: ${timeAgo(continueBootcamp.enrollment.last_accessed_at)}`
                      : 'Start learning'}
                  </span>
                  <h3 className="text-xl font-bold text-white transition-colors group-hover:text-violet-300 md:text-2xl">
                    {continueBootcamp.bootcamp.title}
                  </h3>
                </div>
                <div className="max-w-md space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-white">
                      {continueBootcamp.enrollment?.progress_percent || 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="relative h-full overflow-hidden rounded-full bg-violet-500 transition-all duration-500"
                      style={{
                        width: `${continueBootcamp.enrollment?.progress_percent || 0}%`,
                      }}
                    >
                      <div className="absolute inset-0 animate-pulse bg-white/20" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />{' '}
                      {continueBootcamp.enrollment?.completed_lessons || 0}/
                      {continueBootcamp.bootcamp?.total_lessons || 0} lessons
                    </span>
                    {continueBootcamp.bootcamp?.total_duration > 0 && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-gray-600" />
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />{' '}
                          {formatDuration(
                            continueBootcamp.bootcamp.total_duration
                          )}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-300 group-hover:bg-violet-500 group-hover:text-white">
                    <PlayCircle className="h-4 w-4" />
                    {(continueBootcamp.enrollment?.completed_lessons || 0) > 0
                      ? 'Resume Course'
                      : 'Start Course'}
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
              <button
                onClick={() => onTab('catalog')}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-violet-400"
              >
                <BookOpen className="h-3.5 w-3.5" /> Browse catalog
              </button>
            }
          />
        )}
      </motion.div>
    </motion.div>
  );
}


export { OverviewTab };
