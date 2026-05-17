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
      className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-lg -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 border border-rose-500/20 bg-rose-500/10 text-rose-400 flex items-center justify-center rounded-2xl shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Next Contest</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider bg-white/10 text-zinc-400 border border-white/10">
                {contest.platform}
              </span>
              {t?.isLive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  <Zap className="w-3 h-3" /> Starting soon
                </span>
              )}
              {!t && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <Zap className="w-3 h-3" /> Live now
                </span>
              )}
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-light text-zinc-100 mb-3 mt-4">{contest.title}</h2>
        
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {new Date(contest.startAt).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="py-1 px-3 rounded-lg border border-white/10 bg-white/5 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-lg ${contest.location.toLowerCase() === 'online' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
            {contest.location}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {contest.registered} going
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 w-full md:w-auto mt-4 md:mt-0">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-center">
          {t ? (
            <>
              {t.d > 0 && (
                <>
                  <CountdownBlock value={pad(t.d)} label="DAYS" />
                  <span className="text-zinc-500 font-mono text-2xl">:</span>
                </>
              )}
              <CountdownBlock value={pad(t.h)} label="HRS" />
              <span className="text-zinc-500 font-mono text-2xl">:</span>
              <CountdownBlock value={pad(t.m)} label="MIN" />
              <span className="text-zinc-500 font-mono text-2xl">:</span>
              <CountdownBlock value={pad(t.s)} label="SEC" textVariant={t.isImminent ? "amber" : "zinc"} />
            </>
          ) : (
            <div className="text-emerald-400 font-mono text-2xl tracking-widest font-bold">
              LIVE
            </div>
          )}
        </div>
        
        <Link 
          href={contest.href}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-tighter rounded-2xl border transition-colors shadow-lg shadow-black/40 ${
            t?.isLive || !t 
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
              : 'bg-gray-950 hover:bg-white/10 text-white border-white/10'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          {t?.isLive || !t ? 'Join now' : 'Open contest'}
        </Link>
      </div>
    </motion.div>
  );
}

function CountdownBlock({ value, label, textVariant = "zinc" }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-4xl font-light mb-1 tabular-nums ${textVariant === 'amber' ? 'text-amber-400' : 'text-zinc-100'}`}>
        {value}
      </div>
      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}
