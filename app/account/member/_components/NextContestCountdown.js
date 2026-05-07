/**
 * @file Next contest countdown — live ticking timer for the soonest
 *   registered contest. Updates every second client-side.
 * @module NextContestCountdown
 */

'use client';

import { useEffect, useState } from 'react';
import { Trophy, Calendar, MapPin, Users, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard, Pill, IconChip, ActionButton } from './_ui';

function diff(target) {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
    isLive: total < 3600,
    isImminent: total < 86400,
  };
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function Cell({ value, label, accent }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`min-w-[44px] rounded-lg border px-2 py-1.5 text-center font-mono text-xl font-bold tabular-nums ${accent}`}
      >
        {pad(value)}
      </div>
      <span className="mt-1 text-[9px] tracking-wider text-gray-500 uppercase">
        {label}
      </span>
    </div>
  );
}

export default function NextContestCountdown({ contest }) {
  const [t, setT] = useState(() => (contest ? diff(contest.startAt) : null));

  useEffect(() => {
    if (!contest) return;
    const id = setInterval(() => setT(diff(contest.startAt)), 1000);
    return () => clearInterval(id);
  }, [contest]);

  if (!contest) return null;

  const cellAccent = !t
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
    : t.isLive
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
      : t.isImminent
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        : 'border-blue-500/20 bg-blue-500/10 text-blue-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <GlassCard padding="p-0" className="overflow-hidden">
        <div className="relative p-5">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="relative">
            <div className="mb-3 flex items-start gap-3">
              <IconChip icon={Trophy} accent="rose" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-medium tracking-wider text-rose-300/80 uppercase">
                    Next Contest
                  </span>
                  {t?.isLive && (
                    <Pill tone="rose" icon={Zap}>
                      Starting soon
                    </Pill>
                  )}
                  {!t && (
                    <Pill tone="emerald" icon={Zap}>
                      Live now
                    </Pill>
                  )}
                  <Pill tone="violet">{contest.platform}</Pill>
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {contest.title}
                </h3>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(contest.startAt).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {contest.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {contest.registered} going
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div className="flex items-center gap-2">
                {t ? (
                  <>
                    {t.d > 0 && <Cell value={t.d} label="days" accent={cellAccent} />}
                    <Cell value={t.h} label="hrs" accent={cellAccent} />
                    <Cell value={t.m} label="min" accent={cellAccent} />
                    <Cell value={t.s} label="sec" accent={cellAccent} />
                  </>
                ) : (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono text-sm font-bold text-emerald-200">
                    LIVE NOW
                  </div>
                )}
              </div>
              <ActionButton
                tone={t?.isLive || !t ? 'danger' : 'primary'}
                icon={ArrowRight}
                href={contest.href}
              >
                {t?.isLive || !t ? 'Join now' : 'Open contest'}
              </ActionButton>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
