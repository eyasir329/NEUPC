/**
 * @file Problem-solving leaderboard tab.
 * @module LeaderboardTab
 */

'use client';

import { Crown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn, formatNumber } from './ps-shared';

function LeaderboardTab({ leaderboard, currentUserId }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // leaderboard might be just user rank object, not full list. Use defensive.
  const list = useMemo(() => {
    if (Array.isArray(leaderboard)) return leaderboard;
    if (Array.isArray(leaderboard?.entries)) return leaderboard.entries;
    return [];
  }, [leaderboard]);

  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  const podiumStyles = [
    {
      ring: 'border-amber-400/40 shadow-amber-400/10',
      bg: 'bg-amber-400/20 backdrop-blur-xl',
      avatar: 'bg-amber-400/30 border-amber-400/50',
      gradient: 'to-amber-500/10',
      label: 'text-amber-400',
      width: 'w-56',
      pad: 'pt-8 pb-8',
      transform: 'z-10',
      rank: '#1',
      icon: (
        <Crown className="absolute -top-16 h-8 w-8 fill-amber-500 text-amber-500 drop-shadow-md" />
      ),
    },
    {
      ring: 'border-zinc-400/40 shadow-zinc-400/10',
      bg: 'bg-zinc-400/20 backdrop-blur-xl',
      avatar: 'bg-zinc-400/30 border-zinc-400/50',
      gradient: 'to-zinc-500/10',
      label: 'text-zinc-400',
      width: 'w-48',
      pad: 'pt-5 pb-6',
      transform: 'translate-y-4',
      rank: '#2',
    },
    {
      ring: 'border-orange-400/40 shadow-orange-400/10',
      bg: 'bg-orange-400/20 backdrop-blur-xl',
      avatar: 'bg-orange-400/30 border-orange-400/50',
      gradient: 'to-orange-500/10',
      label: 'text-orange-400',
      width: 'w-48',
      pad: 'pt-5 pb-6',
      transform: 'translate-y-8',
      rank: '#3',
    },
  ];

  // Order: 2nd, 1st, 3rd visually on desktop; 1st, 2nd, 3rd on mobile
  const podiumOrder = isMobile
    ? top3.map((_, i) => i)
    : top3.length >= 3
      ? [1, 0, 2]
      : top3.map((_, i) => i);

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 py-20 text-center text-sm text-zinc-400 backdrop-blur-xl">
        <Crown className="mb-4 h-12 w-12 text-zinc-600" />
        Leaderboard data unavailable. Sync to refresh rankings.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {top3.length > 0 && (
        <div className="mx-auto mt-8 flex w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 md:h-72 md:flex-row md:items-end md:gap-4">
          {podiumOrder.map((idx) => {
            const user = top3[idx];
            if (!user) return null;
            const style = podiumStyles[idx];
            return (
              <div
                key={idx}
                className={cn(
                  'relative flex flex-col items-center border bg-black/40 bg-linear-to-t from-black/80',
                  style.ring,
                  style.gradient,
                  isMobile
                    ? 'mt-12 w-full max-w-[280px] rounded-3xl pt-6 pb-6'
                    : cn(
                        'rounded-t-3xl',
                        style.width,
                        style.pad,
                        style.transform
                      )
                )}
              >
                <div
                  className={cn(
                    'absolute -top-12 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-zinc-950 backdrop-blur-xl',
                    style.avatar
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.user_id || idx}&backgroundColor=transparent`}
                    alt={`${user.username || 'user'} avatar`}
                    className="h-full w-full scale-110 object-cover"
                  />
                </div>
                {style.icon}
                <span
                  className={cn(
                    'mt-6 mb-1 font-mono text-sm font-black drop-shadow-md',
                    style.label
                  )}
                >
                  {style.rank}
                </span>
                <span className="w-full truncate px-4 text-center text-lg font-bold text-white drop-shadow-md">
                  {user.username || user.handle || 'User'}
                </span>
                <div className="mt-4 text-center">
                  <div className="font-mono text-3xl font-black text-white/90 drop-shadow-md">
                    {formatNumber(user.total_score || user.score)}
                  </div>
                  <div className="mt-1 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                    Score
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-5">
          <div className="flex rounded-lg border border-white/10 bg-black/40 p-1 shadow-sm">
            <button className="rounded-md bg-white/10 px-4 py-1.5 text-[11px] font-bold tracking-widest text-white uppercase shadow-sm">
              All Time
            </button>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-white/10 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              <tr>
                <th className="w-20 px-5 py-4 text-center">Rank</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4 text-right">Total Solved</th>
                <th className="px-5 py-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-zinc-300">
              {rest.map((u, i) => {
                const self = u.user_id === currentUserId;
                return (
                  <tr
                    key={u.user_id || i}
                    className={cn(
                      'transition-colors hover:bg-white/[0.04]',
                      self && 'relative bg-indigo-500/10'
                    )}
                  >
                    {self && (
                      <td className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
                    )}
                    <td className="px-5 py-4 text-center font-mono font-semibold text-zinc-400">
                      {u.global_rank || i + 4}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username || u.user_id || i}&backgroundColor=transparent`}
                          alt={`${u.username || 'user'} avatar`}
                          className="h-10 w-10 rounded-full border border-white/10 bg-white/5 object-cover"
                        />
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-zinc-200">
                            {u.username || u.handle || 'User'}
                          </span>
                          {self && (
                            <span className="rounded-md border border-indigo-400/30 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono whitespace-nowrap text-zinc-400">
                      {formatNumber(u.total_solved)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold whitespace-nowrap text-zinc-200">
                      {formatNumber(u.total_score || u.score)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


export { LeaderboardTab };
