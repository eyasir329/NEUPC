/**
 * @file Profile completeness nudge — only renders if score < 100.
 *   Dismissible per-session via localStorage.
 * @module ProfileCompletenessNudge
 */

'use client';

import { useEffect, useState } from 'react';
import { UserCheck, X, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientBar, IconChip, ActionButton } from './_ui';

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
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.07] via-amber-500/[0.04] to-transparent p-4">
          <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex items-start gap-3">
              <IconChip icon={UserCheck} accent="amber" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Complete your profile
                  </h3>
                  <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                    {pct}%
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-gray-500">
                  {next
                    ? `Next up: ${next.label}`
                    : 'A few small touches will unlock your full member view.'}
                </p>
              </div>
            </div>

            <div className="flex-1 sm:max-w-[280px]">
              <div className="mb-1.5 flex flex-wrap items-center gap-1">
                {checklist.map((c) => (
                  <span
                    key={c.id}
                    title={c.label}
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] whitespace-nowrap ${
                      c.done
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/[0.08] bg-white/[0.03] text-gray-500'
                    }`}
                  >
                    {c.done && <Check className="h-2.5 w-2.5" />}
                    {c.label}
                  </span>
                ))}
              </div>
              <GradientBar value={pct} tone="amber" height="h-1" />
            </div>

            <div className="flex items-center gap-1.5">
              <ActionButton
                tone="amber"
                icon={ArrowRight}
                href="/account/member/profile"
              >
                Finish setup
              </ActionButton>
              <button
                type="button"
                onClick={dismiss}
                title="Dismiss for 24 hours"
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/[0.05] hover:text-gray-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
