import { format, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Clock, Repeat, Trophy, BookOpen, Presentation, Code2, Play } from 'lucide-react';

import { cn } from '../lib/utils';
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
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set(
    tasks.filter(t => t.status === 'done').map(t => t.id)
  ));

  const toggleTask = (taskId) => {
    setCompletedTaskIds(prev => {
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
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          {isTodayDate ? "Today's Plan" : format(date, 'EEEE, MMM d')}
          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-gray-950 text-gray-400">
            {tasks.length} tasks
          </span>
        </h2>
        <div className="flex gap-2">
          <button className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md transition-colors font-bold">
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
              className="py-12 flex flex-col items-center justify-center text-gray-400 border border-dashed border-white/[0.06] rounded-xl bg-gray-900/50"
            >
              <CircleDashed size={32} className="mb-3 opacity-20" />
              <p>No tasks scheduled for this day.</p>
            </motion.div>
          ) : (
            tasks.map(task => {
              const isDone = completedTaskIds.has(task.id);
              const Icon = TYPE_ICONS[task.type];
              
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                    isDone 
                      ? "bg-gray-950/30 border-white/[0.06] opacity-60" 
                      : "bg-gray-900 border-white/[0.06] hover:border-white/[0.08] hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                  )}
                  onClick={() => toggleTask(task.id)}
                >
                  {/* Custom Checkbox */}
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    isDone 
                      ? "bg-emerald-500 border-emerald-500" 
                      : "border-white/[0.06] group-hover:border-indigo-400"
                  )}>
                    {isDone && <Check size={14} className="text-gray-400 font-bold" />}
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "text-sm font-medium transition-colors",
                      isDone ? "text-gray-400 line-through" : "text-gray-400"
                    )}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
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
                      <span className="flex items-center gap-1 text-gray-300 bg-gray-950 px-2 rounded-sm border border-white/[0.06]">
                        <Icon size={10} className={
                          task.type === 'contest' ? "text-amber-400" :
                          task.type === 'problem' ? "text-white" :
                          task.type === 'bootcamp' ? "text-emerald-400" : ""
                        } />
                        {task.group}
                      </span>
                    </div>
                  </div>

                  {/* XP Reward or Action Button */}
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                      +{task.xpReward} XP
                    </span>
                    {!isDone && task.type !== 'meeting' && (
                      <button className="p-2 bg-white/[0.05] text-white hover:bg-indigo-500 text-white rounded-lg transition-colors border border-indigo-500/30">
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
