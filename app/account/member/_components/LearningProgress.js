'use client';

import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const TONE_CLASSES = {
  blue: { bg: 'bg-blue-500', text: 'text-blue-400' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-400' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-400' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-400' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-400' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-400' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-400' },
};

export default function LearningProgress({ roadmaps }) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 rounded-2xl shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">Learning Progress</h3>
            <p className="text-xs text-zinc-500 mt-1">Roadmaps and bootcamp tracks you've started</p>
          </div>
        </div>
        <Link 
          href="/account/member/bootcamps"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 transition-colors shrink-0"
        >
          All Tracks <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
        {roadmaps.map((track) => {
          const classes = TONE_CLASSES[track.tone] || TONE_CLASSES.blue;
          return (
            <div key={track.name} className="group cursor-pointer">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-zinc-100 group-hover:text-indigo-400 transition-colors">{track.name}</span>
                <span className={classes.text}>{track.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-lg overflow-hidden mb-2">
                <div className={`h-full ${classes.bg} rounded-lg transition-all duration-1000`} style={{ width: `${track.progress}%` }}></div>
              </div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{track.completed} of {track.total} lessons</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
