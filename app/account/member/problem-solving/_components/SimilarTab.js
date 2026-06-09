/**
 * @file Similar tab component
 * @module SimilarTab
 */

'use client';
import { TrendingUp, CheckCircle2, Lightbulb } from 'lucide-react';

export default function SimilarTab() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Previously solved section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Previously Solved</h2>
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Similar problems you've conquered
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/40 py-12 text-center">
          <p className="text-sm font-medium text-zinc-400">No similar solved problems detected yet.</p>
          <p className="text-xs text-zinc-600">Sync your platforms to populate this section.</p>
        </div>
      </section>

      {/* Recommended section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Recommended Next</h2>
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Strategically chosen practice problems
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/40 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
            <Lightbulb className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-zinc-400">Problem recommendations coming soon.</p>
          <p className="text-xs text-zinc-600">
            We'll suggest related problems based on your tag history once the feature is ready.
          </p>
        </div>
      </section>
    </div>
  );
}
