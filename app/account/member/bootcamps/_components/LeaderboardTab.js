/**
 * @file Bootcamps leaderboard tab.
 * @module LeaderboardTab
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock, Crown, GraduationCap, Loader2, Search, Target, Trophy, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBootcampsLeaderboardAction } from '@/app/_lib/actions/bootcamp-actions';
import SafeImg from '@/app/_components/ui/SafeImg';
import { EmptyState, cn, formatWatchSeconds } from './bootcamps-shared';

function LeaderboardTab({ enrolledBootcamps, archivedBootcamps = [], user }) {
  const [leaderboard, setLeaderboard] = useState(null);
  const [bootcampFilter, setBootcampFilter] = useState('all');
  const [timeframeFilter, setTimeframeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState(null);
  const buttonRef = useRef(null);

  const selectedBootcampLabel = useMemo(() => {
    if (bootcampFilter === 'all') return 'Combined (All Bootcamps)';
    const active = enrolledBootcamps.find(
      ({ bootcamp }) => bootcamp.id === bootcampFilter
    );
    if (active) return active.bootcamp.title.split(':')[0].trim();
    const archived = archivedBootcamps.find(
      ({ bootcamp }) => bootcamp.id === bootcampFilter
    );
    if (archived)
      return `${archived.bootcamp.title.split(':')[0].trim()} (Archived)`;
    return 'Combined (All Bootcamps)';
  }, [bootcampFilter, enrolledBootcamps, archivedBootcamps]);

  const selectedBootcampEmoji = useMemo(() => {
    if (bootcampFilter === 'all') return '🏆';
    const active = enrolledBootcamps.some(
      ({ bootcamp }) => bootcamp.id === bootcampFilter
    );
    if (active) return '📖';
    return '📁';
  }, [bootcampFilter, enrolledBootcamps]);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBootcampsLeaderboardAction({
        bootcampId: bootcampFilter,
        timeframe: timeframeFilter,
      });
      if (res.success) {
        setLeaderboard(res.leaderboard || []);
      } else {
        toast.error(res.error || 'Failed to load leaderboard');
        setLeaderboard([]);
      }
    } catch (err) {
      toast.error('Failed to load leaderboard');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [bootcampFilter, timeframeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Keep rect in sync whenever dropdown opens
  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      setDropdownRect(buttonRef.current.getBoundingClientRect());
    }
  }, [dropdownOpen]);

  const filteredLeaderboard = useMemo(() => {
    if (!leaderboard) return [];
    if (!search.trim()) return leaderboard;
    const q = search.toLowerCase();
    return leaderboard.filter((entry) =>
      entry.userName.toLowerCase().includes(q)
    );
  }, [leaderboard, search]);

  // Top 3 Podium
  const podium = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return [];
    const top3 = leaderboard.slice(0, 3);
    const ordered = [];
    if (top3[1]) ordered.push(top3[1]); // 2nd
    if (top3[0]) ordered.push(top3[0]); // 1st
    if (top3[2]) ordered.push(top3[2]); // 3rd
    return ordered;
  }, [leaderboard]);

  // Find current user's rank
  const myRankEntry = useMemo(() => {
    if (!leaderboard || !user?.id) return null;
    return leaderboard.find((entry) => entry.userId === user.id) || null;
  }, [leaderboard, user]);

  const comparisonInfo = useMemo(() => {
    if (!leaderboard || !myRankEntry) return null;
    const myIndex = leaderboard.findIndex(
      (entry) => entry.userId === myRankEntry.userId
    );
    if (myIndex <= 0) {
      return {
        isFirst: myIndex === 0,
        gapPoints: 0,
        nextUser: null,
      };
    }
    const nextUser = leaderboard[myIndex - 1];
    const gapPoints = (nextUser.score || 0) - (myRankEntry.score || 0);
    return {
      isFirst: false,
      gapPoints,
      nextUser,
    };
  }, [leaderboard, myRankEntry]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[550px] space-y-8 p-1 pb-10 text-left"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-5 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <Trophy className="h-6 w-6 text-amber-400" />
            Bootcamp Leaderboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            See how you rank against other learners across all tasks, exams, and
            attendance.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member by name..."
            className="h-10 w-full rounded-xl border border-white/10 bg-black/30 pr-10 pl-10 text-[13px] text-white transition-all placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-500 transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters: Bootcamp Wise and Timeframe */}
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center">
        {/* Bootcamp select filter */}
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <span className="shrink-0 text-[10px] font-extrabold tracking-wider text-violet-400 uppercase">
            Cohort
          </span>

          <div className="relative flex-1 sm:flex-none">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => {
                const rect = buttonRef.current?.getBoundingClientRect();
                if (rect) setDropdownRect(rect);
                setDropdownOpen((prev) => !prev);
              }}
              className="relative flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/40 pr-10 pl-4 text-xs font-bold text-white shadow-inner transition-all select-none hover:border-white/20 focus:ring-2 focus:ring-violet-500/20 focus:outline-none sm:w-72"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="shrink-0 text-sm">
                  {selectedBootcampEmoji}
                </span>
                <span className="truncate">{selectedBootcampLabel}</span>
              </div>
              <ChevronDown
                className={cn(
                  'pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 transition-transform duration-300',
                  dropdownOpen ? 'rotate-180 text-white' : 'text-gray-400'
                )}
              />
            </button>

            {/* Portal dropdown — renders into document.body to escape all overflow/stacking contexts */}
            {typeof window !== 'undefined' &&
              createPortal(
                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      {/* Dismiss backdrop */}
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setDropdownOpen(false)}
                      />
                      {/* Menu */}
                      <motion.div
                        key="cohort-menu"
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                          position: 'fixed',
                          top: (dropdownRect?.bottom ?? 200) + 8,
                          left: dropdownRect?.left ?? 176,
                          width: Math.max(dropdownRect?.width ?? 288, 288),
                        }}
                        className="z-[9999] flex max-h-72 flex-col gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/98 p-2.5 shadow-2xl backdrop-blur-2xl select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        {/* Option: Combined */}
                        <button
                          type="button"
                          onClick={() => {
                            setBootcampFilter('all');
                            setDropdownOpen(false);
                          }}
                          className={cn(
                            'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-all hover:bg-white/5',
                            bootcampFilter === 'all'
                              ? 'border border-violet-500/20 bg-violet-600/10 text-amber-400'
                              : 'border border-transparent text-gray-300'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm">🏆</span>
                            <span>Combined (All Bootcamps)</span>
                          </span>
                          {bootcampFilter === 'all' && (
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
                          )}
                        </button>

                        {/* Active cohorts */}
                        {enrolledBootcamps.length > 0 && (
                          <div className="mt-1.5">
                            <div className="border-t border-white/5 px-3 py-1 pt-2 text-[8.5px] font-black tracking-widest text-gray-500 uppercase">
                              Active Cohorts
                            </div>
                            <div className="mt-1 flex flex-col gap-0.5">
                              {enrolledBootcamps.map(({ bootcamp }) => {
                                const active = bootcampFilter === bootcamp.id;
                                return (
                                  <button
                                    key={bootcamp.id}
                                    type="button"
                                    onClick={() => {
                                      setBootcampFilter(bootcamp.id);
                                      setDropdownOpen(false);
                                    }}
                                    className={cn(
                                      'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all hover:bg-white/5',
                                      active
                                        ? 'border border-violet-500/20 bg-violet-600/10 font-bold text-white'
                                        : 'border border-transparent text-gray-400'
                                    )}
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <span className="shrink-0 text-sm">
                                        📖
                                      </span>
                                      <span className="truncate">
                                        {bootcamp.title.split(':')[0].trim()}
                                      </span>
                                    </span>
                                    {active && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-md shadow-violet-400/50" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Archived cohorts */}
                        {archivedBootcamps.length > 0 && (
                          <div className="mt-1.5">
                            <div className="border-t border-white/5 px-3 py-1 pt-2 text-[8.5px] font-black tracking-widest text-gray-500 uppercase">
                              Archived Cohorts
                            </div>
                            <div className="mt-1 flex flex-col gap-0.5">
                              {archivedBootcamps.map(({ bootcamp }) => {
                                const active = bootcampFilter === bootcamp.id;
                                return (
                                  <button
                                    key={bootcamp.id}
                                    type="button"
                                    onClick={() => {
                                      setBootcampFilter(bootcamp.id);
                                      setDropdownOpen(false);
                                    }}
                                    className={cn(
                                      'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all hover:bg-white/5',
                                      active
                                        ? 'border border-violet-500/20 bg-violet-600/10 font-bold text-gray-200'
                                        : 'border border-transparent text-gray-500'
                                    )}
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <span className="shrink-0 text-sm">
                                        📁
                                      </span>
                                      <span className="truncate">
                                        {bootcamp.title.split(':')[0].trim()}
                                      </span>
                                    </span>
                                    {active && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-md" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>,
                document.body
              )}
          </div>
        </div>

        {/* Timeframe pills */}
        <div className="relative flex w-full items-center justify-center gap-1 overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-1 shadow-inner sm:w-auto sm:justify-start">
          {[
            ['all', 'All Time'],
            ['monthly', 'Monthly'],
            ['weekly', 'Weekly'],
          ].map(([v, label]) => {
            const active = timeframeFilter === v;
            return (
              <button
                key={v}
                onClick={() => setTimeframeFilter(v)}
                className={cn(
                  'relative flex-1 cursor-pointer rounded-xl px-5 py-2 text-center text-xs font-bold transition-colors duration-300 outline-none select-none sm:flex-none',
                  active ? 'text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeTimeframe"
                    className="absolute inset-0 -z-10 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 text-gray-500">
          <Loader2 className="mb-3.5 h-8 w-8 animate-spin text-violet-500" />
          <span className="text-sm font-semibold">
            Calculating ranks & achievements...
          </span>
        </div>
      ) : leaderboard?.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Leaderboard Empty"
          description="No student progress or scores found for the selected filters."
        />
      ) : (
        <>
          {/* Podium for top 3 */}
          {!search && leaderboard.length > 0 && (
            <div className="mx-auto grid max-w-4xl grid-cols-1 items-end gap-6 pt-6 pb-4 md:grid-cols-3">
              {podium.map((entry) => {
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;

                const theme = isFirst
                  ? {
                      borderColor:
                        'border-amber-500/30 hover:border-amber-400/50',
                      glowColor:
                        'shadow-[0_0_50px_-10px_rgba(245,158,11,0.15)]',
                      pedestalHeight: 'md:h-80',
                      pedestalBg:
                        'bg-linear-to-t from-amber-955/40 via-amber-900/10 to-zinc-900/30',
                      pedestalBorder: 'border-t-2 border-t-amber-500/30',
                      badgeBg:
                        'bg-amber-400 text-black shadow-amber-500/40 shadow-lg',
                      avatarBorder:
                        'ring-amber-400/60 ring-offset-zinc-950 ring-4',
                      accentText: 'text-amber-400',
                      title: '🏆 Champion',
                      delay: 0.1,
                      scale: 'md:scale-105 md:-translate-y-4',
                    }
                  : isSecond
                    ? {
                        borderColor:
                          'border-slate-400/20 hover:border-slate-300/40',
                        glowColor:
                          'shadow-[0_0_40px_-10px_rgba(148,163,184,0.1)]',
                        pedestalHeight: 'md:h-68',
                        pedestalBg:
                          'bg-linear-to-t from-slate-800/30 via-slate-900/10 to-zinc-900/30',
                        pedestalBorder: 'border-t-2 border-t-slate-400/20',
                        badgeBg:
                          'bg-slate-300 text-black shadow-slate-400/30 shadow-md',
                        avatarBorder:
                          'ring-slate-300/50 ring-offset-zinc-950 ring-4',
                        accentText: 'text-slate-300',
                        title: '🥈 Runner Up',
                        delay: 0.2,
                        scale: 'md:-translate-y-1',
                      }
                    : {
                        borderColor:
                          'border-amber-700/25 hover:border-amber-600/45',
                        glowColor:
                          'shadow-[0_0_40px_-10px_rgba(180,83,9,0.08)]',
                        pedestalHeight: 'md:h-60',
                        pedestalBg:
                          'bg-linear-to-t from-amber-950/20 via-amber-950/5 to-zinc-900/30',
                        pedestalBorder: 'border-t-2 border-t-amber-700/25',
                        badgeBg:
                          'bg-amber-700 text-white shadow-amber-700/30 shadow-md',
                        avatarBorder:
                          'ring-amber-700/50 ring-offset-zinc-950 ring-4',
                        accentText: 'text-amber-600',
                        title: '🥉 Third Place',
                        delay: 0.3,
                        scale: 'md:translate-y-2',
                      };

                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 100,
                      damping: 15,
                      delay: theme.delay,
                    }}
                    whileHover={{ y: -8 }}
                    className={cn(
                      'relative flex flex-col items-center justify-between overflow-hidden rounded-3xl border bg-zinc-900/40 backdrop-blur-xl transition-all duration-300',
                      theme.borderColor,
                      theme.glowColor,
                      theme.pedestalHeight,
                      theme.scale,
                      'p-5 pt-8'
                    )}
                  >
                    {/* Glowing background */}
                    <div
                      className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-current opacity-[0.03] blur-3xl"
                      style={{
                        color: isFirst
                          ? '#f59e0b'
                          : isSecond
                            ? '#cbd5e1'
                            : '#b45309',
                      }}
                    />

                    {/* Crown or special icon floating on top */}
                    {isFirst && (
                      <div className="absolute top-2 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center">
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 2.5,
                            ease: 'easeInOut',
                          }}
                        >
                          <Crown className="h-6 w-6 animate-pulse text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]" />
                        </motion.div>
                      </div>
                    )}

                    {/* Avatar structure */}
                    <div className="relative z-10 mt-2">
                      <div
                        className={cn(
                          'flex h-18 w-18 items-center justify-center overflow-hidden rounded-full bg-black/40 transition-transform',
                          theme.avatarBorder
                        )}
                      >
                        <SafeImg
                          src={entry.avatarUrl}
                          alt={entry.userName}
                          className="h-full w-full object-cover"
                          fallback={
                            <div className="from-violet-650/30 to-fuchsia-650/30 flex h-full w-full items-center justify-center bg-linear-to-br text-xl font-black text-white uppercase">
                              {entry.userName.slice(0, 2)}
                            </div>
                          }
                        />
                      </div>
                      <div
                        className={cn(
                          'absolute -right-1 -bottom-2 flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-black shadow-lg ring-3 ring-zinc-950',
                          theme.badgeBg
                        )}
                      >
                        {entry.rank}
                      </div>
                    </div>

                    {/* Member Name and subtitle */}
                    <div className="z-10 mt-4 space-y-0.5 text-center">
                      <p className="max-w-[180px] truncate text-[14px] font-black tracking-tight text-white">
                        {entry.userName}
                      </p>
                      <p
                        className={cn(
                          'text-[9px] font-extrabold tracking-widest uppercase',
                          theme.accentText
                        )}
                      >
                        {theme.title}
                      </p>
                    </div>

                    {/* Pedestal Section (staggered physical styling inside the card) */}
                    <div
                      className={cn(
                        'mt-4 flex w-full flex-1 flex-col justify-between rounded-2xl border border-white/5 p-3.5',
                        theme.pedestalBg,
                        theme.pedestalBorder
                      )}
                    >
                      {/* Grid Stats */}
                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="rounded-xl border border-white/[0.03] bg-white/[0.02] p-2">
                          <span className="text-gray-550 block text-[8px] font-bold tracking-wider uppercase">
                            Progress
                          </span>
                          <span className="font-mono text-xs font-black text-white">
                            {entry.progressPercent}%
                          </span>
                          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full bg-linear-to-r from-violet-500 to-indigo-500"
                              style={{ width: `${entry.progressPercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/[0.03] bg-white/[0.02] p-2">
                          <span className="text-gray-555 block text-[8px] font-bold tracking-wider uppercase">
                            Lessons
                          </span>
                          <div className="mt-0.5 flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                            <span className="font-mono text-xs font-black text-white">
                              {entry.lessonsCompleted}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Points badge */}
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-3 py-2">
                        <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                          Score
                        </span>
                        <span
                          className={cn(
                            'flex items-baseline gap-0.5 font-mono text-base font-black',
                            theme.accentText
                          )}
                        >
                          {entry.score}
                          <span className="font-sans text-[9px] font-bold text-gray-500">
                            PTS
                          </span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Current user's rank quick display */}
          {myRankEntry && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="group relative mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 overflow-hidden rounded-3xl border border-violet-500/20 bg-linear-to-r from-violet-500/[0.03] to-fuchsia-500/[0.03] p-5 shadow-xl backdrop-blur-xl sm:flex-row"
            >
              {/* Decorative side glows */}
              <div className="pointer-events-none absolute top-0 left-0 h-full w-24 bg-linear-to-r from-violet-500/10 to-transparent opacity-50 blur-xl transition-opacity group-hover:opacity-100" />
              <div className="pointer-events-none absolute top-0 right-0 h-full w-24 bg-linear-to-l from-fuchsia-500/10 to-transparent opacity-50 blur-xl transition-opacity group-hover:opacity-100" />

              <div className="z-10 flex w-full items-center gap-4 text-left sm:w-auto">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-400 shadow-inner">
                  <Trophy className="h-6 w-6 text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">
                    Your Standings
                  </span>
                  <p className="mt-1 flex flex-wrap items-baseline gap-1.5 text-[15px] font-black text-white">
                    Rank{' '}
                    <span className="font-mono text-xl font-black text-violet-400">
                      #{myRankEntry.rank}
                    </span>
                    <span className="font-sans text-xs font-bold text-gray-500">
                      out of {leaderboard.length} members
                    </span>
                  </p>

                  {comparisonInfo && (
                    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-300">
                      {comparisonInfo.isFirst ? (
                        <>
                          <Crown className="inline h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span>
                            You are leading the leaderboard! Keep up the
                            brilliant work!
                          </span>
                        </>
                      ) : comparisonInfo.nextUser ? (
                        <>
                          <Target className="inline h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>
                            You are only{' '}
                            <strong className="font-mono font-bold text-emerald-400">
                              {comparisonInfo.gapPoints} pts
                            </strong>{' '}
                            behind{' '}
                            <strong className="font-bold text-white">
                              {comparisonInfo.nextUser.userName}
                            </strong>{' '}
                            (Rank #{comparisonInfo.nextUser.rank})!
                          </span>
                        </>
                      ) : null}
                    </p>
                  )}
                </div>
              </div>

              <div className="z-10 flex w-full shrink-0 items-center justify-between gap-6 border-t border-white/5 pt-4 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="block text-[9px] font-extrabold tracking-widest text-gray-500 uppercase">
                    Total Score
                  </span>
                  <span className="font-mono text-2xl font-black text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
                    {myRankEntry.score}{' '}
                    <span className="font-sans text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                      pts
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Rankings Table */}
          <div className="bg-zinc-955/20 relative overflow-hidden rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/[0.01] to-transparent" />
            <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-extrabold tracking-widest text-gray-400 uppercase select-none">
                    <th className="w-20 px-6 py-5 text-center">Rank</th>
                    <th className="min-w-64 px-6 py-5">Member</th>
                    <th className="px-6 py-5 text-center">Lessons</th>
                    <th className="px-6 py-5 text-center">Practice</th>
                    <th className="px-6 py-5 text-center">Watch Time</th>
                    <th className="px-6 py-5 text-center">Sessions</th>
                    <th className="px-6 py-5 pr-10 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeaderboard.map((entry) => {
                    const isSelf = entry.userId === user?.id;
                    const isFirst = entry.rank === 1;
                    const isSecond = entry.rank === 2;
                    const isThird = entry.rank === 3;

                    return (
                      <tr
                        key={entry.userId}
                        className={cn(
                          'group transition-all duration-200',
                          isSelf
                            ? 'border-l-4 border-l-violet-500 bg-violet-500/[0.03] hover:bg-violet-500/[0.05]'
                            : 'hover:bg-white/[0.02]'
                        )}
                      >
                        {/* Rank Badge */}
                        <td className="px-6 py-4.5 text-center">
                          {isFirst ? (
                            <div className="inline-flex h-8 w-8 scale-105 items-center justify-center rounded-full bg-linear-to-br from-amber-300 to-amber-500 font-mono text-sm font-black text-black shadow-[0_2px_10px_rgba(245,158,11,0.4)]">
                              1
                            </div>
                          ) : isSecond ? (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-400 font-mono text-sm font-black text-black shadow-[0_2px_10px_rgba(148,163,184,0.3)]">
                              2
                            </div>
                          ) : isThird ? (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-amber-600 to-amber-800 font-mono text-sm font-black text-white shadow-[0_2px_10px_rgba(180,83,9,0.25)]">
                              3
                            </div>
                          ) : (
                            <span className="font-mono text-sm font-extrabold text-gray-400 transition-colors group-hover:text-white">
                              {entry.rank}
                            </span>
                          )}
                        </td>

                        {/* Profile Photo & Name */}
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-4">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40 shadow-md ring-2 ring-transparent transition-all group-hover:ring-violet-500/20">
                              <SafeImg
                                src={entry.avatarUrl}
                                alt={entry.userName}
                                className="h-full w-full object-cover"
                                fallback={
                                  <div className="from-violet-650/20 to-fuchsia-650/20 flex h-full w-full items-center justify-center bg-linear-to-br text-xs font-black text-violet-300 uppercase">
                                    {entry.userName.slice(0, 2)}
                                  </div>
                                }
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-2 truncate font-extrabold text-white">
                                <span className="transition-colors group-hover:text-violet-300">
                                  {entry.userName}
                                </span>
                                {isSelf && (
                                  <span className="rounded-md bg-linear-to-r from-violet-500/20 to-fuchsia-500/20 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-violet-300 uppercase ring-1 ring-violet-500/30">
                                    You
                                  </span>
                                )}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="shrink-0 text-[9px] font-extrabold tracking-wider text-gray-500 uppercase">
                                  Progress
                                </span>
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                                  <div
                                    className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-500"
                                    style={{
                                      width: `${entry.progressPercent}%`,
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-[9px] font-black text-gray-400">
                                  {entry.progressPercent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Completed Lessons */}
                        <td className="px-6 py-4.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/10 bg-violet-500/5 px-2.5 py-1 text-violet-300 shadow-sm">
                            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                            <span className="font-mono text-xs font-black">
                              {entry.lessonsCompleted}
                            </span>
                          </div>
                        </td>

                        {/* Solved Problems */}
                        <td className="px-6 py-4.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 text-emerald-300 shadow-sm">
                            <Target className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            <span className="font-mono text-xs font-black">
                              {entry.practiceSolved}
                            </span>
                          </div>
                        </td>

                        {/* Watch Time */}
                        <td className="px-6 py-4.5 text-center">
                          {entry.watchTime > 0 ? (
                            <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/10 bg-amber-500/5 px-2.5 py-1 font-mono text-xs font-black text-amber-300 shadow-sm">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                              {formatWatchSeconds(entry.watchTime)}
                            </div>
                          ) : (
                            <span className="font-extrabold text-gray-600">
                              —
                            </span>
                          )}
                        </td>

                        {/* Sessions */}
                        <td className="px-6 py-4.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-2.5 py-1 text-cyan-300 shadow-sm">
                            <Video className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                            <span className="font-mono text-xs font-black">
                              {entry.sessionsAttended}
                            </span>
                          </div>
                        </td>

                        {/* Points Badge */}
                        <td className="px-6 py-4.5 pr-10 text-right">
                          <span className="inline-flex items-center gap-1 font-mono text-[15px] font-black text-amber-400 drop-shadow-[0_1px_6px_rgba(245,158,11,0.15)] transition-transform group-hover:scale-105">
                            {entry.score}
                            <span className="font-sans text-[9.5px] font-extrabold tracking-widest text-gray-500 uppercase">
                              pts
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────


export { LeaderboardTab };
