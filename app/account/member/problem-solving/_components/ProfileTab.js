/**
 * @file Problem-solving profile tab.
 * @module ProfileTab
 */

'use client';

import { Trash2, Trophy } from 'lucide-react';
import { cn, formatNumber, getPlatformMeta } from './ps-shared';

function ProfileTab({
  statistics,
  handles,
  badges,
  contestHistory,
  userId,
  onConnectClick,
  onDisconnectClick,
}) {
  // Derive a display name from the first connected handle, fallback to 'Member'
  const displayName =
    (handles || [])[0]?.handle ||
    (typeof userId === 'string' ? userId.slice(0, 12) : 'Member');
  const avatarLetter = displayName.slice(0, 1).toUpperCase();

  const statItems = [
    {
      value: formatNumber(statistics?.total_solved),
      label: 'Solved',
      accent: 'text-violet-400',
    },
    {
      value: formatNumber(statistics?.weighted_score),
      label: 'Score',
      accent: 'text-sky-400',
    },
    {
      value: formatNumber((contestHistory || []).length),
      label: 'Contests',
      accent: 'text-amber-400',
    },
    {
      value: statistics?.global_rank ? `#${statistics.global_rank}` : '—',
      label: 'Global Rank',
      accent: 'text-emerald-400',
    },
    {
      value: statistics?.current_streak ? `${statistics.current_streak}d` : '—',
      label: 'Streak',
      accent: 'text-orange-400',
    },
  ];

  const hasHandles = (handles || []).length > 0;

  return (
    <div className="space-y-5">
      {/* ── Hero card ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900">
        {/* subtle gradient wash */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-violet-600/10 via-transparent to-sky-600/5" />
        {/* top strip accent */}
        <div className="h-1 w-full bg-linear-to-r from-violet-500 via-purple-500 to-sky-500" />

        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-violet-500 to-purple-600 text-3xl font-black text-white shadow-lg ring-4 ring-violet-500/20 sm:h-24 sm:w-24 sm:text-4xl">
              {avatarLetter}
            </div>
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {displayName}
              </h2>
              {hasHandles && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  Active
                </span>
              )}
            </div>

            {/* Platform handles row */}
            {hasHandles && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(handles || []).map((h) => {
                  const meta = getPlatformMeta(h.platform);
                  return (
                    <span
                      key={h.platform}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold',
                        meta.tagBg,
                        meta.tagText,
                        meta.tagBorder
                      )}
                    >
                      <span className="opacity-60">{meta.short}</span>
                      <span>@{h.handle}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Stats row */}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/[0.06] pt-5">
              {statItems.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span
                    className={cn(
                      'font-mono text-xl font-bold sm:text-2xl',
                      s.accent
                    )}
                  >
                    {s.value}
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Platform accounts ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-300">
            Connected Platforms
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={onConnectClick}
              className="flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Connect New
            </button>
            <span className="text-[11px] font-medium text-gray-500">
              {handles?.length || 0} account
              {(handles?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {!handles || handles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-b-2xl bg-gray-900 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-3xl">
              🔗
            </div>
            <p className="text-sm font-medium text-gray-400">
              No connected platforms yet
            </p>
            <p className="max-w-xs text-[12px] text-gray-600">
              Connect your competitive programming accounts to track your
              statistics, solves, and progress.
            </p>
            <button
              onClick={onConnectClick}
              className="mt-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500"
            >
              Connect a Platform
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
            {(handles || []).map((h, idx) => {
              const meta = getPlatformMeta(h.platform);
              const ps = statistics?.platform_stats?.[h.platform];
              const isLast = idx === handles.length - 1;
              return (
                <div
                  key={h.platform}
                  className={cn(
                    'flex flex-col gap-4 bg-gray-900 p-5 transition-colors hover:bg-white/[0.02]',
                    // round corners on last item when odd count fills last col
                    idx === 0 ? 'rounded-bl-none' : '',
                    isLast && handles.length % 3 !== 0 ? '' : ''
                  )}
                >
                  {/* Platform header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-gray-950',
                          meta.color
                        )}
                      >
                        {meta.short}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-200">
                          {meta.name}
                        </p>
                        <p className="font-mono text-[11px] text-gray-500">
                          @{h.handle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        Live
                      </span>
                      <button
                        onClick={() => onDisconnectClick(h.platform)}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-rose-400"
                        title="Disconnect platform"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 divide-x divide-white/[0.05] rounded-xl border border-white/[0.06] bg-black/20">
                    {[
                      { v: ps?.rating || '—', l: 'Rating' },
                      { v: ps?.max_rating || ps?.rating || '—', l: 'Peak' },
                      { v: formatNumber(ps?.solved_count), l: 'Solved' },
                    ].map((item) => (
                      <div
                        key={item.l}
                        className="flex flex-col items-center py-3"
                      >
                        <span className="font-mono text-base font-bold text-white">
                          {item.v}
                        </span>
                        <span className="mt-0.5 text-[9px] font-semibold tracking-widest text-gray-500 uppercase">
                          {item.l}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Achievements ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] bg-gray-900">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Trophy className="h-4 w-4 text-amber-400" />
            Achievements
          </h3>
          {(badges || []).length > 0 && (
            <span className="text-[11px] font-medium text-gray-500">
              {badges.length} earned
            </span>
          )}
        </div>

        {(badges || []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-3xl">
              🏆
            </div>
            <p className="text-sm font-medium text-gray-400">
              No achievements yet
            </p>
            <p className="max-w-xs text-[12px] text-gray-600">
              Keep solving problems and participating in contests to earn
              badges.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-white/[0.04] sm:grid-cols-2 xl:grid-cols-3">
            {badges.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-gray-900 p-5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-xl">
                  {b.icon || '🏆'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-gray-200">
                    {b.name || b.badge_name || 'Badge'}
                  </p>
                  {b.description && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500">
                      {b.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// React Fragment shim (avoid import bloat)

export { ProfileTab };
