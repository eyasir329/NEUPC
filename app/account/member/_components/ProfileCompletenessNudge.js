/**
 * @file Profile completeness nudge component
 * @module ProfileCompletenessNudge
 */

'use client';

import { useEffect, useState } from 'react';
import { User, X, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const STORAGE_KEY = 'member-profile-nudge-dismissed-at';
const SHOW_AGAIN_AFTER_HOURS = 24;

export default function ProfileCompletenessNudge({ checklist }) {
  const total = checklist.length;
  const done = checklist.filter((c) => c.done).length;
  const pct = Math.round((done / total) * 100);

  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (pct >= 100) return;
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const hoursSince = (Date.now() - Number(dismissedAt)) / 3600000;
      if (hoursSince < SHOW_AGAIN_AFTER_HOURS) return;
    }
    setHidden(false);
  }, [pct]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setHidden(true);
  };

  if (pct >= 100 || hidden) return null;

  const next = checklist.find((c) => !c.done);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        className="overflow-hidden"
      >
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tighter text-zinc-100 uppercase">
                  Complete your profile
                </h3>
                <span className="mt-0.5 text-xs leading-none font-bold text-amber-400">
                  {pct}%
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {next ? `Next up: ${next.label}` : 'Almost there!'}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 lg:ml-8">
            {checklist.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-1.5 rounded-2xl border px-2 py-1 text-[10px] font-bold tracking-wider uppercase transition-colors ${
                  c.done
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-zinc-500'
                }`}
              >
                {c.done && <Check className="h-3 w-3" />}
                {c.label}
              </div>
            ))}
          </div>

          <div className="mt-2 flex shrink-0 items-center gap-3 shadow-lg shadow-black/40 lg:mt-0">
            <Link
              href="/account/member/profile"
              className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[10px] font-bold tracking-widest text-amber-300 uppercase transition-colors hover:bg-amber-500/20"
            >
              Finish setup
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-2xl border border-white/10 p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
