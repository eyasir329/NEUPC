'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Circle } from 'lucide-react';

export default function TodaysPlan({ items = [] }) {
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
      window.location.href = href;
    }
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 rounded-2xl shrink-0">
             <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">Today's Plan</h3>
            <p className="text-xs text-zinc-500 mt-1">{completedCount} of {items.length} done &middot; resets at midnight</p>
          </div>
        </div>
        <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-white/5 border border-white/10 text-zinc-500 uppercase tracking-widest mt-1 shrink-0">
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
              className={`group flex items-start gap-3 p-4 rounded-2xl transition-colors cursor-pointer border ${
                isDone 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-white/5 border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5'
              }`}
            >
              <button 
                onClick={(e) => toggle(task.id, e)}
                className={`mt-0.5 transition-colors shrink-0 ${isDone ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-emerald-400'}`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>
              <div>
                <h4 className={`text-sm font-bold mb-1 transition-colors leading-tight ${isDone ? 'text-zinc-400 line-through' : 'text-zinc-100 group-hover:text-emerald-400'}`}>
                  {task.title}
                </h4>
                <p className="text-xs text-zinc-500 font-medium leading-tight">{task.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
