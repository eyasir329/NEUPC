/**
 * @file Contests tab with upcoming contests.
 * @module ContestsTab
 */

'use client';

import ContestHistory from './ContestHistory';
import { Bell, Calendar, ChevronLeft, ChevronRight, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { RatingLineChart } from './charts';
import { cn, formatContestDuration, formatContestStart, getPlatformMeta } from './ps-shared';

const UPCOMING_PAGE_SIZE = 7;

function ContestsTab({
  ratingHistory,
  contestHistory,
  upcomingContests,
  onSync,
  syncing,
  onSyncHistory,
  syncingHistory,
  onSyncRating,
  syncingRating,
  handles,
}) {
  const [upcomingPage, setUpcomingPage] = useState(0);

  const totalPages = Math.ceil(
    (upcomingContests?.length || 0) / UPCOMING_PAGE_SIZE
  );
  const pageContests = (upcomingContests || []).slice(
    upcomingPage * UPCOMING_PAGE_SIZE,
    (upcomingPage + 1) * UPCOMING_PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <RatingLineChart
        ratingHistory={ratingHistory}
        contestHistory={contestHistory}
        onSyncRating={onSyncRating}
        syncingRating={syncingRating}
      />

      <div className="flex flex-col gap-6">
        <div className="flex h-max flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-5">
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Calendar className="h-4 w-4 text-indigo-400" />
                Upcoming Contests
              </h3>
              <p className="mt-1 text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
                Sync to refresh schedule
              </p>
            </div>
            <button
              onClick={onSync}
              disabled={syncing}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-white/5"
              title="Refresh"
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  syncing && 'animate-spin text-indigo-400'
                )}
              />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center p-6 text-sm text-zinc-400">
            {!upcomingContests || upcomingContests.length === 0 ? (
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Calendar className="h-5 w-5 text-zinc-500" />
                </div>
                <p className="mb-6">
                  {syncing
                    ? 'Loading upcoming contests…'
                    : 'No upcoming contests right now. Refresh to pull the latest schedule from Codeforces, AtCoder, LeetCode, and CodeChef.'}
                </p>
                <button
                  onClick={onSync}
                  disabled={syncing}
                  className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  <Bell className="h-4 w-4 transition-transform group-hover:scale-110" />
                  {syncing ? 'Refreshing…' : 'Refresh Schedule'}
                </button>
              </>
            ) : (
              <div className="w-full text-left">
                <div className="divide-y divide-white/5">
                  {pageContests.map((c, i) => {
                    const meta = getPlatformMeta(c.platform);
                    return (
                      <div
                        key={c.id || i}
                        className="group -mx-4 flex items-center justify-between rounded-xl px-4 py-4 transition-colors hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm',
                              meta.tagBg,
                              meta.tagBorder
                            )}
                          >
                            <span className={cn('font-bold', meta.tagText)}>
                              {meta.short}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-zinc-200 transition-colors group-hover:text-indigo-400">
                              {c.name}
                            </h4>
                            <div className="mt-1 flex items-center gap-4 text-xs font-medium tracking-wide text-zinc-500">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />{' '}
                                {formatContestStart(c.startTime)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />{' '}
                                {formatContestDuration(c.durationSeconds)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-all hover:scale-105 hover:bg-white/10 hover:text-white"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                    <p className="text-xs font-medium text-zinc-500">
                      {upcomingPage * UPCOMING_PAGE_SIZE + 1}–
                      {Math.min(
                        (upcomingPage + 1) * UPCOMING_PAGE_SIZE,
                        upcomingContests.length
                      )}{' '}
                      of {upcomingContests.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setUpcomingPage((p) => p - 1)}
                        disabled={upcomingPage === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-zinc-400"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setUpcomingPage(i)}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-colors',
                            i === upcomingPage
                              ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                              : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setUpcomingPage((p) => p + 1)}
                        disabled={upcomingPage === totalPages - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-zinc-400"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <ContestHistory
          contestHistory={contestHistory}
          handles={handles}
          onSync={onSyncHistory}
          syncing={syncingHistory}
        />
      </div>
    </div>
  );
}


export { ContestsTab };
