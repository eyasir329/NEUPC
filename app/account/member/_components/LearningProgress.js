/**
 * @file Learning progress component
 * @module LearningProgress
 */

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
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Learning Progress
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Roadmaps and bootcamp tracks you've started
            </p>
          </div>
        </div>
        <Link
          href="/account/member/bootcamps"
          className="flex shrink-0 items-center gap-2 text-xs font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-100"
        >
          All Tracks <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {roadmaps.map((track) => {
          const classes = TONE_CLASSES[track.tone] || TONE_CLASSES.blue;
          return (
            <div key={track.name} className="group cursor-pointer">
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-100 transition-colors group-hover:text-indigo-400">
                  {track.name}
                </span>
                <span className={classes.text}>{track.progress}%</span>
              </div>
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-lg bg-white/10">
                <div
                  className={`h-full ${classes.bg} rounded-lg transition-all duration-1000`}
                  style={{ width: `${track.progress}%` }}
                ></div>
              </div>
              <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {track.completed} of {track.total} lessons
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
