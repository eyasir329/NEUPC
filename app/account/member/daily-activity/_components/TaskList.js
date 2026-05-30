/**
 * @file Task list component
 * @module TaskList
 */

import { format, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Clock,
  Repeat,
  Trophy,
  BookOpen,
  Presentation,
  Code2,
  Play,
} from 'lucide-react';

import { cn } from '@/app/account/member/daily-activity/lib/utils';
import { useState } from 'react';

const TYPE_ICONS = {
  problem: Code2,
  contest: Trophy,
  bootcamp: BookOpen,
  meeting: Presentation,
  general: CircleDashed,
};

// Assuming CircleDashed from lucide-react, I will import it.
import { CircleDashed } from 'lucide-react';

export function TaskList({ date, tasks }) {
  const [completedTaskIds, setCompletedTaskIds] = useState(
    new Set(tasks.filter((t) => t.status === 'done').map((t) => t.id))
  );

  const toggleTask = (taskId) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const isTodayDate = isToday(date);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          {isTodayDate ? "Today's Plan" : format(date, 'EEEE, MMM d')}
          <span className="rounded-full bg-gray-950 px-2 py-0.5 text-xs font-normal text-gray-400">
            {tasks.length} tasks
          </span>
        </h2>
        <div className="flex gap-2">
          <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-500">
            + Add Task
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.06] bg-gray-900/50 py-12 text-gray-400"
            >
              <CircleDashed size={32} className="mb-3 opacity-20" />
              <p>No tasks scheduled for this day.</p>
            </motion.div>
          ) : (
            tasks.map((task) => {
              const isDone = completedTaskIds.has(task.id);
              const Icon = TYPE_ICONS[task.type];

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'group flex items-center gap-4 rounded-xl border p-4 transition-all duration-300',
                    isDone
                      ? 'border-white/[0.06] bg-gray-950/30 opacity-60'
                      : 'cursor-pointer border-white/[0.06] bg-gray-900 hover:-translate-y-0.5 hover:border-white/[0.08] hover:shadow-xl'
                  )}
                  onClick={() => toggleTask(task.id)}
                >
                  {/* Custom Checkbox */}
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                      isDone
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-white/[0.06] group-hover:border-indigo-400'
                    )}
                  >
                    {isDone && (
                      <Check size={14} className="font-bold text-gray-400" />
                    )}
                  </div>

                  {/* Task Content */}
                  <div className="min-w-0 flex-1">
                    <h3
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isDone ? 'text-gray-400 line-through' : 'text-gray-400'
                      )}
                    >
                      {task.title}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {task.time} ({task.duration}m)
                      </span>
                      {task.recurrence && (
                        <span className="flex items-center gap-1">
                          <Repeat size={12} />
                          {task.recurrence}
                        </span>
                      )}
                      <span className="flex items-center gap-1 rounded-sm border border-white/[0.06] bg-gray-950 px-2 text-gray-300">
                        <Icon
                          size={10}
                          className={
                            task.type === 'contest'
                              ? 'text-amber-400'
                              : task.type === 'problem'
                                ? 'text-white'
                                : task.type === 'bootcamp'
                                  ? 'text-emerald-400'
                                  : ''
                          }
                        />
                        {task.group}
                      </span>
                    </div>
                  </div>

                  {/* XP Reward or Action Button */}
                  <div className="flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-400">
                      +{task.xpReward} XP
                    </span>
                    {!isDone && task.type !== 'meeting' && (
                      <button className="rounded-lg border border-indigo-500/30 bg-white/[0.05] p-2 text-white transition-colors hover:bg-indigo-500">
                        <Play size={14} className="ml-0.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
