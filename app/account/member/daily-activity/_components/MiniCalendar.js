/**
 * @file Mini calendar component
 * @module MiniCalendar
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isToday,
} from 'date-fns';
import { cn } from '@/app/account/member/daily-activity/lib/utils';
import { MOCK_TASKS } from '@/app/account/member/daily-activity/data';

export function MiniCalendar({ selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const startDate = startOfWeek(startOfMonth(currentMonth));
  const endDate = endOfWeek(endOfMonth(currentMonth));

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Calculate task counts per day
  const getDayActivityLevel = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const tasks = MOCK_TASKS.filter((t) => t.date === dateStr);
    const count = tasks.length;
    if (count === 0) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    return 3;
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900 p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-medium text-gray-200">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-md p-1 text-gray-400 hover:bg-white/[0.04]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-md p-1 text-gray-400 hover:bg-white/[0.04]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-x-1 gap-y-1">
        {days.map((date, i) => {
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const level = getDayActivityLevel(date);
          const today = isToday(date);

          return (
            <button
              key={i}
              onClick={() => onSelectDate(date)}
              className={cn(
                'relative flex h-8 items-center justify-center rounded-lg border border-transparent text-sm transition-all',
                !isCurrentMonth && 'opacity-30',
                isSelected &&
                  'bg-indigo-500 font-bold text-gray-200 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
                !isSelected &&
                  isCurrentMonth &&
                  'text-gray-300 hover:border-white/[0.06] hover:bg-white/[0.04]',
                today && !isSelected && 'font-bold text-indigo-400'
              )}
            >
              <span>{format(date, 'd')}</span>

              {/* Activity indicators */}
              {!isSelected && level > 0 && (
                <div className="absolute bottom-1 flex gap-[2px]">
                  {Array.from({ length: level }).map((_, j) => (
                    <div
                      key={j}
                      className="h-1 w-1 rounded-full bg-indigo-500/60"
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
