/**
 * @file Todays plan component
 * @module TodaysPlan
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Circle } from 'lucide-react';

export default function TodaysPlan({ items = [] }) {
  const router = useRouter();
  const [checked, setChecked] = useState(new Set());

  const toggle = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const completedCount = items.filter((i) => checked.has(i.id)).length;

  const handleContainerClick = (href) => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-start justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Today's Plan
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {completedCount} of {items.length} done &middot; resets at
              midnight
            </p>
          </div>
        </div>
        <span className="mt-1 shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
          {items.length} tasks
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((task, i) => {
          const isDone = checked.has(task.id);
          return (
            <motion.div
              whileHover={{ scale: 1.02 }}
              key={task.id}
              onClick={() => handleContainerClick(task.href)}
              className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5'
              }`}
            >
              <button
                onClick={(e) => toggle(task.id, e)}
                className={`mt-0.5 shrink-0 transition-colors ${isDone ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-emerald-400'}`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
              <div>
                <h4
                  className={`mb-1 text-sm leading-tight font-bold transition-colors ${isDone ? 'text-zinc-400 line-through' : 'text-zinc-100 group-hover:text-emerald-400'}`}
                >
                  {task.title}
                </h4>
                <p className="text-xs leading-tight font-medium text-zinc-500">
                  {task.subtitle}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
