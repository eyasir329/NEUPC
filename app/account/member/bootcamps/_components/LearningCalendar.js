/**
 * @file Learning activity calendar.
 * @module LearningCalendar
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseFilterMenu } from './CourseFilterMenu';
import { cn } from './bootcamps-shared';

function LearningCalendar({
  enrolledBootcamps,
  archivedBootcamps = [],
  courses = [],
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [courseFilter, setCourseFilter] = useState('all');

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const completedByDate = useMemo(() => {
    const map = {};
    const matches = (bootcampId) =>
      courseFilter === 'all' || bootcampId === courseFilter;
    // Active bootcamp completions — lessons are clickable
    enrolledBootcamps.forEach(({ bootcamp, enrollment }) => {
      if (!matches(bootcamp.id)) return;
      const progress = enrollment?.progressData?.lessonProgress || {};
      Object.values(progress).forEach((p) => {
        if (p.is_completed && p.completed_at) {
          const d = new Date(p.completed_at);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          if (!map[key]) map[key] = { count: 0, lessons: [] };
          map[key].count += 1;
          map[key].lessons.push({
            title: p.lesson_title || 'Lesson',
            bootcampTitle: bootcamp.title,
            href: `/account/member/bootcamps/${bootcamp.id}/${p.lesson_id}`,
          });
        }
      });
    });
    // Archived bootcamp completions — no lesson links (content inaccessible)
    archivedBootcamps.forEach(({ bootcamp, enrollment }) => {
      if (!matches(bootcamp.id)) return;
      const progress = enrollment?.progressData?.lessonProgress || {};
      Object.values(progress).forEach((p) => {
        if (p.is_completed && p.completed_at) {
          const d = new Date(p.completed_at);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          if (!map[key]) map[key] = { count: 0, lessons: [] };
          map[key].count += 1;
          map[key].lessons.push({
            title: p.lesson_title || 'Lesson',
            bootcampTitle: bootcamp.title,
            archived: true,
          });
        }
      });
    });
    return map;
  }, [enrolledBootcamps, archivedBootcamps, courseFilter]);

  const getIntensityClass = (count, isToday) => {
    if (count === 0)
      return isToday
        ? 'bg-violet-500/10 border-violet-500/40 text-violet-300 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]'
        : 'bg-white/5 border-transparent text-gray-600 hover:border-white/10 hover:bg-white/5';
    if (count === 1)
      return 'bg-violet-500/30 text-white border-violet-500/10 hover:bg-violet-500/40';
    if (count === 2)
      return 'bg-violet-500/60 text-white border-violet-500/20 hover:bg-violet-500/70';
    return 'bg-violet-500 text-white border-violet-500 shadow-[0_4px_10px_rgba(139,92,246,0.25)] hover:bg-violet-400';
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/2 p-5 shadow-sm md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Calendar className="h-5 w-5 text-violet-400" />
            Learning Activity
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Your monthly completion heatmap
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {courses.length > 0 && (
            <CourseFilterMenu
              courses={courses}
              value={courseFilter}
              onChange={setCourseFilter}
            />
          )}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-gray-500 transition-all hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="w-28 text-center text-sm font-semibold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-gray-500 transition-all hover:bg-white/5 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-3 grid grid-cols-7 gap-2 sm:gap-3">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold tracking-wider text-gray-600 uppercase"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="aspect-square rounded-xl" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
            const entry = completedByDate[key];
            const count = entry?.count || 0;
            const lessons = entry?.lessons || [];
            const isToday =
              new Date().toDateString() ===
              new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
              ).toDateString();
            return (
              <div
                key={i}
                className={cn(
                  'group relative flex aspect-square cursor-default items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-300',
                  getIntensityClass(count, isToday)
                )}
              >
                {day}
                {isToday && count === 0 && (
                  <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-violet-500/60" />
                )}
                {count > 0 && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 origin-bottom -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
                    <div className="max-w-[240px] min-w-[160px] rounded-xl border border-white/10 bg-zinc-800 p-3 text-xs text-white shadow-xl">
                      <p className="mb-2 font-semibold text-gray-400">
                        {count} lesson{count > 1 ? 's' : ''} completed
                      </p>
                      <ul className="space-y-1.5">
                        {lessons.map((l, li) => (
                          <li key={li}>
                            {l.archived ? (
                              <div className="flex items-start gap-1.5 text-gray-400">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-500" />
                                <span className="line-clamp-2 leading-snug">
                                  {l.title}
                                  {l.bootcampTitle && (
                                    <span className="mt-0.5 block text-[10px] text-gray-600">
                                      {l.bootcampTitle} · archived
                                    </span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <Link
                                href={l.href}
                                className="flex items-start gap-1.5 text-violet-300 transition-colors hover:text-violet-100"
                              >
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                                <span className="line-clamp-2 leading-snug">
                                  {l.title}
                                </span>
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="absolute top-full left-1/2 -mt-1 -translate-x-1/2 border-4 border-transparent border-t-[#1a1d27]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mx-auto mt-8 flex w-fit items-center justify-center gap-2 rounded-full border border-white/10 bg-white/2 px-4 py-2 text-xs font-medium text-gray-600">
          <span>Less</span>
          <div className="mx-1 flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded-sm border border-transparent bg-white/5" />
            <div className="h-3.5 w-3.5 rounded-sm border border-violet-500/10 bg-violet-500/30" />
            <div className="h-3.5 w-3.5 rounded-sm border border-violet-500/20 bg-violet-500/60" />
            <div className="h-3.5 w-3.5 rounded-sm border border-violet-500 bg-violet-500" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}


export { LearningCalendar };
