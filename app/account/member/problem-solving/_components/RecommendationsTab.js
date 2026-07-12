/**
 * @file Practice recommendations tab.
 * @module RecommendationsTab
 */

'use client';

import { Lightbulb, Sparkles, Target } from 'lucide-react';
import { useMemo } from 'react';

function RecommendationsTab({ submissions }) {
  // Build simple recommendations from weakest tags
  const recs = useMemo(() => {
    const tally = new Map();
    (submissions || []).forEach((s) => {
      const v = String(s.verdict || '').toUpperCase();
      const ac = v === 'OK' || v === 'AC' || v === 'ACCEPTED';
      (s.tags || []).forEach((t) => {
        if (!tally.has(t)) tally.set(t, { solves: 0, attempts: 0 });
        const e = tally.get(t);
        e.attempts += 1;
        if (ac) e.solves += 1;
      });
    });
    const weakest = Array.from(tally.entries())
      .filter(([, e]) => e.attempts >= 2)
      .sort((a, b) => a[1].solves / a[1].attempts - b[1].solves / b[1].attempts)
      .slice(0, 4)
      .map(([name]) => name);
    return weakest;
  }, [submissions]);

  if (recs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 py-20 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner">
          <Sparkles className="h-6 w-6 text-indigo-400" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-white">
          Not enough data yet
        </h3>
        <p className="text-sm font-medium text-zinc-400">
          Solve more problems to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-white">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Personalized Learning Path
          </h3>
          <p className="text-sm font-medium text-zinc-400">
            Based on your weakest topics
          </p>
        </div>
        <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30 sm:flex">
          <Target className="h-6 w-6 text-indigo-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {recs.map((topic, i) => (
          <div
            key={i}
            className="flex h-full flex-col rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl transition-transform hover:-translate-y-1"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <span className="self-start rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-indigo-400 uppercase shadow-sm">
                  Suggested Action
                </span>
                <h4 className="text-lg leading-tight font-bold text-white capitalize">
                  Practice <span className="text-indigo-400">{topic}</span>
                </h4>
              </div>
            </div>
            <div className="mb-2 flex-1 rounded-xl border border-white/5 bg-black/20 p-4 shadow-inner">
              <div className="mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
                  Why this?
                </span>
              </div>
              <p className="text-sm leading-relaxed font-medium text-zinc-400">
                Your acceptance rate on <strong>{topic}</strong> is below
                average. Focusing on this area can significantly lift your
                overall rating.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export { RecommendationsTab };
