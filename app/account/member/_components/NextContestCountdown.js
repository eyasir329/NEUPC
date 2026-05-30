/**
 * @file Next contest countdown component
 * @module NextContestCountdown
 */

'use client';

import { useEffect, useState } from 'react';
import { Trophy, Clock, Users, ExternalLink, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

export default function NextContestCountdown({ contest }) {
  const [t, setT] = useState(() => (contest ? diff(contest.startAt) : null));

  useEffect(() => {
    if (!contest) return;
    const id = setInterval(() => setT(diff(contest.startAt)), 1000);
    return () => clearInterval(id);
  }, [contest]);

  if (!contest) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl md:flex-row md:items-center"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/2 rounded-lg bg-rose-500/5"></div>

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              Next Contest
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded-2xl border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                {contest.platform}
              </span>
              {t?.isLive && (
                <span className="flex items-center gap-1 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-rose-300 uppercase">
                  <Zap className="h-3 w-3" /> Starting soon
                </span>
              )}
              {!t && (
                <span className="flex items-center gap-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                  <Zap className="h-3 w-3" /> Live now
                </span>
              )}
            </div>
          </div>
        </div>

        <h2 className="mt-4 mb-3 text-2xl font-light text-zinc-100">
          {contest.title}
        </h2>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {new Date(contest.startAt).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1">
            <div
              className={`h-2 w-2 rounded-lg ${contest.location.toLowerCase() === 'online' ? 'bg-green-500' : 'bg-blue-500'}`}
            ></div>
            {contest.location}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {contest.registered} going
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex w-full flex-col items-center gap-8 sm:flex-row md:mt-0 md:w-auto">
        <div className="flex w-full items-center justify-center gap-4 sm:w-auto">
          {t ? (
            <>
              {t.d > 0 && (
                <>
                  <CountdownBlock value={pad(t.d)} label="DAYS" />
                  <span className="font-mono text-2xl text-zinc-500">:</span>
                </>
              )}
              <CountdownBlock value={pad(t.h)} label="HRS" />
              <span className="font-mono text-2xl text-zinc-500">:</span>
              <CountdownBlock value={pad(t.m)} label="MIN" />
              <span className="font-mono text-2xl text-zinc-500">:</span>
              <CountdownBlock
                value={pad(t.s)}
                label="SEC"
                textVariant={t.isImminent ? 'amber' : 'zinc'}
              />
            </>
          ) : (
            <div className="font-mono text-2xl font-bold tracking-widest text-emerald-400">
              LIVE
            </div>
          )}
        </div>

        <Link
          href={contest.href}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-xs font-bold tracking-tighter uppercase shadow-lg shadow-black/40 transition-colors sm:w-auto ${
            t?.isLive || !t
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
              : 'border-white/10 bg-gray-950 text-white hover:bg-white/10'
          }`}
        >
          <ExternalLink className="h-4 w-4" />
          {t?.isLive || !t ? 'Join now' : 'Open contest'}
        </Link>
      </div>
    </motion.div>
  );
}

function CountdownBlock({ value, label, textVariant = 'zinc' }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`mb-1 text-4xl font-light tabular-nums ${textVariant === 'amber' ? 'text-amber-400' : 'text-zinc-100'}`}
      >
        {value}
      </div>
      <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
        {label}
      </div>
    </div>
  );
}
