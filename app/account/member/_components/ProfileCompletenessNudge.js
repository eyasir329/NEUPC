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
        <div className="bg-zinc-900/50 backdrop-blur-xl p-6 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded-2xl shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tighter">Complete your profile</h3>
                <span className="text-amber-400 text-xs font-bold leading-none mt-0.5">{pct}%</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                {next ? `Next up: ${next.label}` : 'Almost there!'}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-wrap items-center gap-2 lg:ml-8">
            {checklist.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-2xl border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  c.done
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-white/5 border-white/10 text-zinc-500"
                }`}
              >
                {c.done && <Check className="w-3 h-3" />}
                {c.label}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-2 lg:mt-0 shadow-lg shadow-black/40 shrink-0">
            <Link
              href="/account/member/profile"
              className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-2xl hover:bg-amber-500/20 transition-colors"
            >
              Finish setup
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="text-zinc-500 border border-white/10 hover:bg-white/5 hover:text-zinc-400 p-1.5 rounded-2xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
