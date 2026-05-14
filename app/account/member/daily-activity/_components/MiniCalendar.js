import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  addMonths, subMonths, format, startOfMonth, startOfWeek, 
  endOfMonth, endOfWeek, isSameMonth, isSameDay, addDays, isToday
} from 'date-fns';
import { cn } from '../lib/utils';
import { MOCK_TASKS } from '../data';

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
    const tasks = MOCK_TASKS.filter(t => t.date === dateStr);
    const count = tasks.length;
    if (count === 0) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    return 3;
  };

  return (
    <div className="bg-gray-900 border border-white/[0.06] shadow-xl rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-200">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1 hover:bg-white/[0.04] rounded-md text-gray-400">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-white/[0.04] rounded-md text-gray-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 gap-x-1">
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
                "relative flex items-center justify-center h-8 rounded-lg text-sm transition-all border border-transparent",
                !isCurrentMonth && "opacity-30",
                isSelected && "bg-indigo-500 text-gray-200 font-bold shadow-[0_0_12px_rgba(99,102,241,0.5)]",
                !isSelected && isCurrentMonth && "hover:bg-white/[0.04] hover:border-white/[0.06] text-gray-300",
                today && !isSelected && "text-indigo-400 font-bold"
              )}
            >
              <span>{format(date, 'd')}</span>
              
              {/* Activity indicators */}
              {!isSelected && level > 0 && (
                <div className="absolute bottom-1 flex gap-[2px]">
                  {Array.from({ length: level }).map((_, j) => (
                    <div key={j} className="w-1 h-1 rounded-full bg-indigo-500/60" />
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
