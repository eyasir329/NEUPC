/**
 * @file Problem-solving overview tab.
 * @module OverviewTab
 */

'use client';

import ActivityHeatmap from './ActivityHeatmap';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, Crown, House, List, RefreshCw, Sparkles, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DifficultyDonut, TopicRadar } from './charts';
import { cn, formatNumber, getPaginationRange, getPlatformMeta, relativeTime } from './ps-shared';

function OverviewTab({
  statistics,
  dailyActivity,
  recentSubmissions,
  handles,
  onConnectClick,
  onSyncPlatform,
  syncingPlatform,
  onTabChange,
}) {
  const [platformPage, setPlatformPage] = useState(0);
  const PLATFORM_PAGE_SIZE = 5;

  const totalPlatformPages = Math.ceil(
    (handles?.length || 0) / PLATFORM_PAGE_SIZE
  );
  const visiblePlatforms = (handles || []).slice(
    platformPage * PLATFORM_PAGE_SIZE,
    (platformPage + 1) * PLATFORM_PAGE_SIZE
  );
  const platformPaginationRange = getPaginationRange(
    platformPage,
    totalPlatformPages
  );

  useEffect(() => {
    if (platformPage >= totalPlatformPages && totalPlatformPages > 0) {
      setPlatformPage(totalPlatformPages - 1);
    }
  }, [handles, totalPlatformPages, platformPage]);

  const stats = [
    {
      l: 'Total Solved',
      v: formatNumber(statistics?.total_solved),
      t: 'from-emerald-400 to-teal-500',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      sub: 'Problems mastered',
    },
    {
      l: 'Submissions',
      v: formatNumber(statistics?.total_submissions),
      t: 'from-blue-400 to-indigo-500',
      icon: <List className="h-5 w-5 text-blue-500" />,
      sub: 'Attempts made',
    },
    {
      l: 'Weighted Score',
      v: formatNumber(statistics?.weighted_score),
      t: 'from-fuchsia-400 to-purple-500',
      icon: <Crown className="h-5 w-5 text-fuchsia-500" />,
      sub: 'Based on diff',
    },
    {
      l: 'Active Streak',
      v: formatNumber(statistics?.current_streak),
      t: 'from-orange-400 to-amber-500',
      icon: (
        <svg
          className="h-5 w-5 text-orange-500"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C12 2 8 6 8 11C8 14.5 10 16 12 18C14 16 16 14.5 16 11C16 6 12 2 12 2Z" />
        </svg>
      ),
      sub: 'days in a row',
    },
  ];

  const tags = useMemo(() => {
    const tally = new Map();
    (recentSubmissions || []).forEach((s) => {
      (s.tags || []).forEach((t) => tally.set(t, (tally.get(t) || 0) + 1));
    });
    const max = Math.max(1, ...Array.from(tally.values()));
    return Array.from(tally.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, value: count / max }));
  }, [recentSubmissions]);

  const solved = Number(statistics?.total_solved || 0);
  const submissions = Number(statistics?.total_submissions || 0);
  const accuracy = submissions > 0 ? (solved / submissions) * 100 : 0;
  const accuracyDisplay = accuracy.toFixed(1);

  // Arc gauge geometry (semicircle, 180°)
  const ARC_R = 38;
  const ARC_CX = 56;
  const ARC_CY = 54;
  const ARC_C = Math.PI * ARC_R; // half circumference
  const arcFill = (accuracy / 100) * ARC_C;
  const arcColor =
    accuracy >= 70 ? '#34d399' : accuracy >= 45 ? '#fbbf24' : '#fb7185';
  const arcGlow =
    accuracy >= 70
      ? 'rgba(52,211,153,0.4)'
      : accuracy >= 45
        ? 'rgba(251,191,36,0.4)'
        : 'rgba(251,113,133,0.4)';
  const arcTextColor =
    accuracy >= 70
      ? 'text-emerald-400'
      : accuracy >= 45
        ? 'text-amber-400'
        : 'text-rose-400';

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-4 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20 sm:p-6"
          >
            <div
              className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-linear-to-br opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
              style={{ backgroundImage: `var(--tw-gradient-stops)` }}
            />

            <div className="relative z-10 mb-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase sm:text-xs">
                {s.l}
              </span>
              <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                {s.icon}
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-1">
              <span
                className={cn(
                  'bg-linear-to-r bg-clip-text text-3xl font-bold text-transparent',
                  s.t
                )}
              >
                {s.v}
              </span>
              {s.sub && (
                <span className="text-[11px] font-medium whitespace-nowrap text-zinc-500 sm:text-xs">
                  {s.sub}
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {/* Accuracy card */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="group relative col-span-1 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-4 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20 sm:col-span-2 sm:p-5 lg:col-span-1"
        >
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
            style={{ background: arcColor }}
          />

          <div className="relative z-10 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase sm:text-xs">
              Avg Accuracy
            </span>
            <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
              <Target className="h-5 w-5" style={{ color: arcColor }} />
            </div>
          </div>

          {/* Semicircle gauge */}
          <div className="relative z-10 flex flex-col items-center">
            <svg
              width="112"
              height="64"
              viewBox="0 0 112 64"
              className="overflow-visible"
            >
              {/* track */}
              <path
                d={`M ${ARC_CX - ARC_R} ${ARC_CY} A ${ARC_R} ${ARC_R} 0 0 1 ${ARC_CX + ARC_R} ${ARC_CY}`}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* fill */}
              <path
                d={`M ${ARC_CX - ARC_R} ${ARC_CY} A ${ARC_R} ${ARC_R} 0 0 1 ${ARC_CX + ARC_R} ${ARC_CY}`}
                fill="none"
                stroke={arcColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${arcFill} ${ARC_C}`}
                style={{ filter: `drop-shadow(0 0 6px ${arcGlow})` }}
              />
              {/* needle dot at tip */}
              {accuracy > 0 &&
                (() => {
                  const angle = Math.PI - (accuracy / 100) * Math.PI;
                  const nx = ARC_CX + Math.cos(angle) * ARC_R;
                  const ny = ARC_CY - Math.sin(angle) * ARC_R;
                  return (
                    <circle
                      cx={nx}
                      cy={ny}
                      r="4"
                      fill={arcColor}
                      style={{ filter: `drop-shadow(0 0 4px ${arcGlow})` }}
                    />
                  );
                })()}
            </svg>

            {/* value below gauge */}
            <div className="-mt-2 flex flex-col items-center">
              <span
                className={cn(
                  'text-3xl leading-none font-bold tabular-nums',
                  arcTextColor
                )}
              >
                {accuracyDisplay}%
              </span>
              <span className="mt-1 text-sm font-medium text-zinc-500">
                {formatNumber(solved)} / {formatNumber(submissions)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ActivityHeatmap data={dailyActivity} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TopicRadar topics={tags} />
        <DifficultyDonut statistics={statistics} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Recent Activity
            </h3>
            <button
              onClick={() => onTabChange('problems')}
              className="flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              See all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col pt-2">
            {(recentSubmissions || []).length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 rounded-full bg-white/5 p-4">
                  <List className="h-8 w-8 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-400">No submissions yet.</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Start solving to see history here!
                </p>
              </div>
            )}
            {(recentSubmissions || []).slice(0, 6).map((s, i) => {
              const verdict = String(s.verdict || '').toUpperCase();
              const isAc =
                verdict === 'OK' || verdict === 'AC' || verdict === 'ACCEPTED';
              const isWa = verdict.includes('WRONG') || verdict === 'WA';
              const dot = isAc
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : isWa
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                  : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
              const meta = getPlatformMeta(s.platform);
              return (
                <div
                  key={s.id || i}
                  className="group flex items-start gap-4 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-white/5 hover:bg-white/[0.02]"
                >
                  <div
                    className={cn(
                      'mt-2 h-2.5 w-2.5 shrink-0 rounded-full',
                      dot
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-zinc-200 transition-colors group-hover:text-indigo-300">
                        {s.problem_name || s.problem_id || 'Submission'}
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-zinc-500">
                        {relativeTime(s.submitted_at)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                          meta.tagBg,
                          meta.tagText,
                          meta.tagBorder
                        )}
                      >
                        {meta.short}
                      </span>
                      {s.difficulty_rating ? (
                        <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                          <Crown className="h-3 w-3" />
                          {s.difficulty_rating}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex h-fit flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <House className="h-5 w-5 text-indigo-400" />
              Platforms
            </h3>
            <button
              onClick={() => onConnectClick({ code: '', name: 'Platform' })}
              className="flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Add New
            </button>
          </div>
          <div className="flex flex-col gap-1.5 pt-2">
            {!handles || handles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-zinc-500">
                  No platforms connected yet.
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Connect your first platform to start tracking solves!
                </p>
              </div>
            ) : (
              <>
                {visiblePlatforms.map((h) => {
                  const code = h.platform;
                  const meta = getPlatformMeta(code);
                  const handleName = h.handle;
                  const ps = statistics?.platform_stats?.[code];
                  const isSyncing = syncingPlatform === code;
                  const syncStatus = ps?.sync_status || 'pending';
                  const hasError = !!ps?.error_message;
                  const rating = ps?.rating || 0;
                  const solvedCount = ps?.solved_count || 0;
                  const lastSynced = ps?.last_synced_at;

                  const statusBadge = isSyncing ? (
                    <span className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-indigo-400 uppercase">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                      Syncing
                    </span>
                  ) : hasError ? (
                    <span
                      className="flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-rose-400 uppercase"
                      title={ps.error_message}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      Error
                    </span>
                  ) : syncStatus === 'completed' || lastSynced ? (
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-400 uppercase">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      Synced
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-800/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-zinc-500 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                      Pending
                    </span>
                  );

                  return (
                    <div
                      key={code}
                      className="flex flex-col gap-2 rounded-xl border border-white/5 bg-zinc-950/50 p-3 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-zinc-900 shadow-inner',
                            meta.color
                          )}
                        >
                          {meta.short}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-zinc-200">
                            {meta.name}
                          </div>
                          <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">
                            @{handleName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusBadge}
                          <button
                            onClick={() => onSyncPlatform(code)}
                            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                            title={
                              lastSynced
                                ? `Last synced ${relativeTime(lastSynced)}`
                                : 'Sync now'
                            }
                            disabled={isSyncing}
                          >
                            <RefreshCw
                              className={cn(
                                'h-3.5 w-3.5',
                                isSyncing ? 'animate-spin text-indigo-400' : ''
                              )}
                            />
                          </button>
                        </div>
                      </div>

                      {(rating > 0 || solvedCount > 0) && (
                        <div className="flex items-center gap-3 border-t border-white/5 pt-2">
                          {rating > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                                Rating
                              </span>
                              <span
                                className={cn(
                                  'font-mono text-xs font-bold',
                                  meta.tagText
                                )}
                              >
                                {formatNumber(rating)}
                              </span>
                            </div>
                          )}
                          {rating > 0 && solvedCount > 0 && (
                            <span className="h-3 w-px bg-white/10" />
                          )}
                          {solvedCount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                                Solved
                              </span>
                              <span className="font-mono text-xs font-bold text-emerald-400">
                                {formatNumber(solvedCount)}
                              </span>
                            </div>
                          )}
                          {lastSynced && (
                            <>
                              <span className="ml-auto text-[10px] text-zinc-600">
                                {relativeTime(lastSynced)}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {hasError && (
                        <p
                          className="truncate rounded-lg bg-rose-500/5 px-2 py-1 text-[10px] text-rose-400"
                          title={ps.error_message}
                        >
                          {ps.error_message}
                        </p>
                      )}
                    </div>
                  );
                })}

                {totalPlatformPages > 1 && (
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <p className="text-[10px] font-medium text-zinc-500">
                      {platformPage * PLATFORM_PAGE_SIZE + 1}–
                      {Math.min(
                        (platformPage + 1) * PLATFORM_PAGE_SIZE,
                        (handles || []).length
                      )}{' '}
                      of {(handles || []).length}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setPlatformPage((p) => Math.max(0, p - 1))
                        }
                        disabled={platformPage === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      {platformPaginationRange.map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span
                              key={`dots-${idx}`}
                              className="flex h-7 w-7 items-center justify-center text-[10px] font-semibold text-zinc-600"
                            >
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setPlatformPage(p)}
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-semibold transition-colors',
                              p === platformPage
                                ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                                : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            {p + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() =>
                          setPlatformPage((p) =>
                            Math.min(totalPlatformPages - 1, p + 1)
                          )
                        }
                        disabled={platformPage === totalPlatformPages - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


export { OverviewTab };
