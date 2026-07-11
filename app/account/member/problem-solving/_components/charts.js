/**
 * @file Problem-solving charts: difficulty donut, topic radar, rating line chart.
 * @module charts
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LineChart, Radar, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn, formatNumber, getPlatformMeta, getTooltipStyle } from './ps-shared';

function DifficultyDonut({ statistics }) {
  const easy = Number(statistics?.easy_solved || 0);
  const medium = Number(statistics?.medium_solved || 0);
  const hard =
    Number(statistics?.hard_solved || 0) +
    Number(statistics?.expert_solved || 0);
  const total = easy + medium + hard || 1;

  // SVG ring geometry
  const R = 54; // radius to stroke centre
  const CX = 70;
  const CY = 70;
  const C = 2 * Math.PI * R;
  const GAP = 3; // px gap between segments

  const tiers = [
    {
      label: 'Easy',
      count: easy,
      color: '#34d399',
      glow: 'rgba(52,211,153,0.35)',
      text: 'text-emerald-400',
      bar: 'bg-emerald-500',
    },
    {
      label: 'Medium',
      count: medium,
      color: '#fbbf24',
      glow: 'rgba(251,191,36,0.35)',
      text: 'text-amber-400',
      bar: 'bg-amber-400',
    },
    {
      label: 'Hard',
      count: hard,
      color: '#fb7185',
      glow: 'rgba(251,113,133,0.35)',
      text: 'text-rose-400',
      bar: 'bg-rose-500',
    },
  ];

  // Build dash offsets for each segment with a small gap
  let offset = 0;
  const segments = tiers.map((t) => {
    const len = (t.count / total) * C;
    const visLen = Math.max(0, len - GAP);
    const seg = { ...t, len: visLen, offset };
    offset += len;
    return seg;
  });

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900/60 p-6 shadow-lg backdrop-blur-xl">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-violet-500/[0.06] blur-[60px]" />

      {/* Header */}
      <div className="relative z-10 mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
          <SlidersHorizontal className="h-4 w-4 text-violet-400" />
          By Difficulty
        </h3>
        <span className="text-[11px] font-medium text-gray-500">
          {formatNumber(total)} solved
        </span>
      </div>

      {/* Donut + rows side by side */}
      <div className="relative z-10 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        {/* SVG donut */}
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {/* track */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="14"
            />
            {/* segments */}
            {segments.map((s) =>
              s.count > 0 ? (
                <circle
                  key={s.label}
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${s.len} ${C - s.len}`}
                  strokeDashoffset={-s.offset}
                  transform={`rotate(-90 ${CX} ${CY})`}
                  style={{ filter: `drop-shadow(0 0 6px ${s.glow})` }}
                />
              ) : null
            )}
          </svg>
          {/* centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl leading-none font-bold text-white tabular-nums">
              {formatNumber(total)}
            </span>
            <span className="mt-1 text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
              Total
            </span>
          </div>
        </div>

        {/* Tier rows */}
        <div className="flex w-full flex-col gap-3.5 sm:flex-1">
          {tiers.map((t) => {
            const pct = Math.round((t.count / total) * 100);
            return (
              <div key={t.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={cn('text-[12px] font-semibold', t.text)}>
                    {t.label}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-bold text-white tabular-nums">
                      {formatNumber(t.count)}
                    </span>
                    <span className="text-[10px] text-gray-600">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className={cn('h-full rounded-full', t.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Topic radar (SVG, simple polygon)
// =====================================================================
function TopicRadar({ topics }) {
  // topics: [{ name, value (0..1) }]
  const arr = (topics || []).slice(0, 6);
  while (arr.length < 6) {
    arr.push({ name: '', value: 0 });
  }
  const cx = 100;
  const cy = 100;
  const r = 70;
  const points = arr
    .map((t, i) => {
      const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
      const radius = r * Math.max(0, Math.min(1, t.value));
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      return `${x},${y}`;
    })
    .join(' ');
  const gridLevels = [0.25, 0.5, 0.75, 1];
  return (
    <div className="relative flex h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl transition-all hover:bg-zinc-900/80">
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-[80px]" />
      <h3 className="mb-2 flex shrink-0 items-center gap-2 text-base font-semibold text-white">
        <Radar className="h-4 w-4 text-violet-400" />
        Top Topics
      </h3>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {arr.every((t) => !t.name) ? (
          <div className="text-center text-sm text-zinc-500">
            No topic data yet
          </div>
        ) : (
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full max-w-[260px] drop-shadow-xl"
          >
            {gridLevels.map((lvl, i) => {
              const pts = arr
                .map((_, j) => {
                  const angle = (Math.PI * 2 * j) / arr.length - Math.PI / 2;
                  const x = cx + Math.cos(angle) * r * lvl;
                  const y = cy + Math.sin(angle) * r * lvl;
                  return `${x},${y}`;
                })
                .join(' ');
              return (
                <polygon
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              );
            })}
            <polygon
              points={points}
              fill="rgba(139,92,246,0.3)"
              stroke="#8b5cf6"
              strokeWidth="2"
              className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            />
            {arr.map((_, i) => {
              const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
              const innerX = cx + Math.cos(angle) * r * 0.1;
              const innerY = cy + Math.sin(angle) * r * 0.1;
              const outerX = cx + Math.cos(angle) * r;
              const outerY = cy + Math.sin(angle) * r;
              return (
                <line
                  key={`line-${i}`}
                  x1={innerX}
                  y1={innerY}
                  x2={outerX}
                  y2={outerY}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              );
            })}
            {arr.map((t, i) => {
              const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
              const x = cx + Math.cos(angle) * (r + 18);
              const y = cy + Math.sin(angle) * (r + 18);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="tracking-wider uppercase"
                >
                  {t.name}
                </text>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// Tabs
// =====================================================================

function RatingLineChart({
  ratingHistory,
  contestHistory,
  onSyncRating,
  syncingRating,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const boxRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create a map of contests by date+platform for quick lookup
  const contestMap = useMemo(() => {
    const map = new Map();
    (contestHistory || []).forEach((contest) => {
      const contestPlatform = contest.platform || contest.platforms?.code;
      const contestDateStr = contest.date || contest.contest_date;
      if (!contestDateStr || !contestPlatform) return;
      const contestDate = new Date(contestDateStr);
      const dateKey = contestDate.toISOString().split('T')[0];
      const key = `${contestPlatform.toLowerCase()}-${dateKey}`;
      map.set(key, contest);

      const newRating = contest.newRating || contest.new_rating;
      if (newRating) {
        const ratingKey = `${contestPlatform.toLowerCase()}-${newRating}`;
        if (!map.has(ratingKey)) {
          map.set(ratingKey, contest);
        }
      }
    });
    return map;
  }, [contestHistory]);

  // Enrich rating data with contest names and other metadata
  const enrichedRatingHistory = useMemo(() => {
    return (ratingHistory || []).map((rating) => {
      const ratingPlatform = (
        rating.platform ||
        rating.platforms?.code ||
        ''
      ).toLowerCase();
      const ratingDateStr = rating.date || rating.recorded_at;
      if (!ratingDateStr || !ratingPlatform) return rating;

      const ratingDate = new Date(ratingDateStr);
      const dateKey = ratingDate.toISOString().split('T')[0];
      const key = `${ratingPlatform}-${dateKey}`;

      let matchedContest = contestMap.get(key);

      // Fallback 1: match by rating value
      const ratingValue = rating.rating;
      if (!matchedContest && ratingValue) {
        const ratingKey = `${ratingPlatform}-${ratingValue}`;
        matchedContest = contestMap.get(ratingKey);
      }

      // Fallback 2: search through contest history for close date match
      if (!matchedContest) {
        matchedContest = (contestHistory || []).find((contest) => {
          const contestPlatform = (
            contest.platform ||
            contest.platforms?.code ||
            ''
          ).toLowerCase();
          if (contestPlatform !== ratingPlatform) return false;
          const contestDateStr = contest.date || contest.contest_date;
          if (!contestDateStr) return false;
          const contestDate = new Date(contestDateStr);
          const timeDiff = Math.abs(ratingDate - contestDate);

          const contestNewRating = contest.newRating || contest.new_rating;
          // Match if within 1.5 days and rating matches
          return timeDiff < 129600000 && contestNewRating === ratingValue;
        });
      }

      // Fallback 3: match by platform + rating change
      const ratingChange = rating.change || rating.rating_change;
      if (!matchedContest && ratingChange) {
        matchedContest = (contestHistory || []).find((contest) => {
          const contestPlatform = (
            contest.platform ||
            contest.platforms?.code ||
            ''
          ).toLowerCase();
          if (contestPlatform !== ratingPlatform) return false;

          const contestRatingChange =
            contest.ratingChange || contest.rating_change;
          const contestDateStr = contest.date || contest.contest_date;
          if (!contestDateStr) return false;
          const contestDate = new Date(contestDateStr);
          const timeDiff = Math.abs(ratingDate - contestDate);

          return timeDiff < 129600000 && contestRatingChange === ratingChange;
        });
      }

      // Prefer the row's own contest data (joined authoritatively via the
      // contest_id FK in transformRatingHistory); fall back to the heuristic
      // match only when the FK join was empty.
      const contestName =
        rating.contestName ||
        rating.contest_history?.contest_name ||
        matchedContest?.name ||
        matchedContest?.contest_name;
      const contestId =
        rating.contestId ||
        rating.contest_history?.external_contest_id ||
        matchedContest?.contestId ||
        matchedContest?.external_contest_id;
      const contestUrl =
        rating.contestUrl ||
        rating.contest_history?.contest_url ||
        matchedContest?.url ||
        matchedContest?.contest_url;
      const rank = rating.rank ?? matchedContest?.rank;
      const totalParticipants =
        rating.totalParticipants ??
        matchedContest?.totalParticipants ??
        matchedContest?.total_participants;
      const problemsSolved =
        rating.problemsSolved ??
        matchedContest?.solved ??
        matchedContest?.problems_solved;
      const problemsAttempted =
        rating.problemsAttempted ??
        matchedContest?.problemsAttempted ??
        matchedContest?.problems_attempted;

      // Derive the real contest size from the problems array (already fetched
      // by the sync and stored in problems_data → transformContestHistory sets
      // matchedContest.problems). The DB total_problems column often equals
      // problems_solved (a sync bug) so we can't trust it directly.
      const totalProblems = (() => {
        if (rating.totalProblems != null) return rating.totalProblems;
        const probs = matchedContest?.problems;
        if (Array.isArray(probs) && probs.length > 0) {
          const hasUnattempted = probs.some(
            (p) =>
              !p.solved && !p.solvedDuringContest && !p.upsolve && !p.attempted
          );
          if (hasUnattempted) return probs.length;
        }
        const dbTotal =
          matchedContest?.totalProblems ?? matchedContest?.total_problems;
        const solved = problemsSolved;
        return dbTotal && dbTotal > solved ? dbTotal : null;
      })();

      return {
        ...rating,
        platform: ratingPlatform,
        date: ratingDate.getTime(),
        rating: ratingValue,
        change: ratingChange,
        contestName,
        contestId,
        contestUrl,
        rank,
        totalParticipants,
        problemsSolved,
        problemsAttempted,
        totalProblems,
      };
    });
  }, [ratingHistory, contestHistory, contestMap]);

  // Group by platform code
  const grouped = useMemo(() => {
    const map = new Map();
    enrichedRatingHistory.forEach((r) => {
      if (!r.platform || r.rating == null) return;
      if (!map.has(r.platform)) map.set(r.platform, []);
      map.get(r.platform).push(r);
    });
    map.forEach((arr) => arr.sort((a, b) => a.date - b.date));
    return map;
  }, [enrichedRatingHistory]);

  const platforms = Array.from(grouped.keys());

  if (platforms.length === 0) {
    return (
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-indigo-500/5 blur-[100px]" />
        <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <LineChart className="h-4 w-4 text-indigo-400" />
              Rating History
            </h3>
            <p className="mt-1 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              Platform ratings over time
            </p>
          </div>
          {onSyncRating && (
            <button
              onClick={onSyncRating}
              disabled={syncingRating}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-white/5"
              title="Refresh Rating History"
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  syncingRating && 'animate-spin text-indigo-400'
                )}
              />
            </button>
          )}
        </div>
        <div className="relative z-10 flex h-72 w-full items-center justify-center text-sm font-medium text-zinc-500">
          No rating data yet
        </div>
      </div>
    );
  }

  // Find global min/max
  let minTime = Infinity;
  let maxTime = -Infinity;
  let minR = Infinity;
  let maxR = -Infinity;
  grouped.forEach((arr) => {
    arr.forEach((p) => {
      if (p.date < minTime) minTime = p.date;
      if (p.date > maxTime) maxTime = p.date;
      if (p.rating < minR) minR = p.rating;
      if (p.rating > maxR) maxR = p.rating;
    });
  });
  if (minR === maxR) {
    minR = minR - 100;
    maxR = maxR + 100;
  }

  const W = isMobile ? 380 : 800;
  const H = isMobile ? 220 : 280;
  const PAD = isMobile
    ? { l: 35, r: 15, t: 15, b: 25 }
    : { l: 50, r: 20, t: 20, b: 30 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const xOf = (t) =>
    PAD.l + ((t - minTime) / Math.max(1, maxTime - minTime)) * innerW;
  const yOf = (r) =>
    PAD.t + (1 - (r - minR) / Math.max(1, maxR - minR)) * innerH;

  const colors = {
    codeforces: '#f87171',
    leetcode: '#facc15',
    atcoder: '#60a5fa',
    codechef: '#c084fc',
    hackerrank: '#4ade80',
  };

  return (
    <div
      ref={boxRef}
      className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-indigo-500/5 blur-[100px]" />
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <LineChart className="h-4 w-4 text-indigo-400" />
            Rating History
          </h3>
          <p className="mt-1 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
            Platform ratings over time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            {platforms.map((p) => (
              <div
                key={p}
                className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
              >
                <span
                  className="h-2 w-2 rounded-[2px] shadow-sm"
                  style={{ backgroundColor: colors[p] || '#94a3b8' }}
                />
                {getPlatformMeta(p).name}
              </div>
            ))}
          </div>
          {onSyncRating && (
            <button
              onClick={onSyncRating}
              disabled={syncingRating}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-white/5"
              title="Refresh Rating History"
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  syncingRating && 'animate-spin text-indigo-400'
                )}
              />
            </button>
          )}
        </div>
      </div>
      <div
        className="relative z-10 w-full"
        style={{ aspectRatio: isMobile ? '16/8' : '16/5', minHeight: 200 }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          className="drop-shadow-sm"
        >
          {/* y-axis grid + labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = PAD.t + p * innerH;
            const val = Math.round(maxR - p * (maxR - minR));
            return (
              <g key={i}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={PAD.l - 8}
                  y={y + 4}
                  fill="#71717a"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}
          {/* x-axis date labels */}
          {(() => {
            const tickCount = isMobile ? 3 : 5;
            return Array.from({ length: tickCount }, (_, i) => {
              const t = minTime + (i / (tickCount - 1)) * (maxTime - minTime);
              const x = xOf(t);
              const label = new Date(t).toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit',
              });
              return (
                <text
                  key={i}
                  x={x}
                  y={H - 4}
                  fill="#52525b"
                  fontSize="10"
                  fontWeight="500"
                  textAnchor="middle"
                >
                  {label}
                </text>
              );
            });
          })()}
          {/* x-axis baseline */}
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={PAD.t + innerH}
            y2={PAD.t + innerH}
            stroke="rgba(255,255,255,0.06)"
          />
          {/* Areas + lines: non-interactive layer drawn first so a later
              platform's area fill never covers or steals hover from another
              platform's points. */}
          {platforms.map((p) => {
            const arr = grouped.get(p);
            if (!arr || arr.length < 1) return null;
            const pts = arr.map((pt) => ({
              x: xOf(pt.date),
              y: yOf(pt.rating),
            }));
            const path = pts
              .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
              .join(' ');
            const color = colors[p] || '#94a3b8';
            // area fill path
            const areaPath = `${path} L ${pts[pts.length - 1].x} ${PAD.t + innerH} L ${pts[0].x} ${PAD.t + innerH} Z`;
            return (
              <g key={p} className="pointer-events-none">
                {/* subtle area fill */}
                <path d={areaPath} fill={color} opacity={0.06} />
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Points: drawn on top of every area/line so each platform's data
              points stay visible and hoverable. */}
          {platforms.map((p) => {
            const arr = grouped.get(p);
            if (!arr || arr.length < 1) return null;
            const color = colors[p] || '#94a3b8';
            return (
              <g key={p}>
                {arr.map((pt, i) => {
                  const cx = xOf(pt.date);
                  const cy = yOf(pt.rating);
                  const isActive =
                    hoveredPoint?.date === pt.date &&
                    hoveredPoint?.platform === pt.platform;
                  return (
                    <g key={i}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isActive ? '5.5' : '3.5'}
                        fill={isActive ? color : '#18181b'}
                        stroke={color}
                        strokeWidth="2"
                        className="pointer-events-none transition-all duration-150"
                      />
                      {/* Invisible larger hit target so dense/middle points
                          are easy to hover. */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="11"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipPos({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                          setHoveredPoint(pt);
                        }}
                        onMouseLeave={() => {
                          setHoveredPoint(null);
                        }}
                        onClick={() => {
                          if (pt.contestUrl) {
                            window.open(
                              pt.contestUrl,
                              '_blank',
                              'noopener,noreferrer'
                            );
                          }
                        }}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence>
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-50 w-[260px] rounded-xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-md"
            style={getTooltipStyle(tooltipPos, boxRef.current)}
          >
            {(() => {
              const meta = getPlatformMeta(hoveredPoint.platform);
              const date = new Date(hoveredPoint.date).toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }
              );
              const changeFormatted =
                hoveredPoint.change > 0
                  ? `+${hoveredPoint.change}`
                  : hoveredPoint.change;
              const changeColor =
                hoveredPoint.change > 0
                  ? 'text-emerald-400'
                  : hoveredPoint.change < 0
                    ? 'text-rose-400'
                    : 'text-zinc-500';

              const getPercentile = (rank, total) => {
                if (!rank || !total || total <= 0) return null;
                const pct = (rank / total) * 100;
                return Math.max(0.01, Math.min(pct, 100));
              };

              const getRankPercentileColor = (percentile) => {
                if (percentile <= 1) return 'text-rose-400';
                if (percentile <= 5) return 'text-orange-400';
                if (percentile <= 10) return 'text-amber-400';
                if (percentile <= 25) return 'text-yellow-400';
                if (percentile <= 50) return 'text-emerald-400';
                if (percentile <= 75) return 'text-cyan-400';
                return 'text-blue-400';
              };

              const pct = getPercentile(
                hoveredPoint.rank,
                hoveredPoint.totalParticipants
              );

              return (
                <div className="flex flex-col gap-1.5 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                      <span
                        className={cn(
                          'text-[10px] font-bold tracking-wider uppercase',
                          meta.tagText
                        )}
                      >
                        {meta.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{date}</span>
                  </div>

                  {hoveredPoint.contestName ? (
                    <h4 className="max-w-[230px] text-xs leading-tight font-bold text-zinc-100">
                      {hoveredPoint.contestName}
                    </h4>
                  ) : (
                    <h4 className="text-xs font-semibold text-zinc-400 italic">
                      Platform Rating Update
                    </h4>
                  )}

                  <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/5 pt-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">New Rating</span>
                      <span className="font-mono font-bold text-zinc-200">
                        {hoveredPoint.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Change</span>
                      <span className={cn('font-mono font-bold', changeColor)}>
                        {hoveredPoint.change !== null &&
                        hoveredPoint.change !== undefined
                          ? changeFormatted
                          : '—'}
                      </span>
                    </div>

                    {hoveredPoint.rank !== null &&
                      hoveredPoint.rank !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Rank</span>
                          <span className="font-mono font-bold text-zinc-200">
                            {hoveredPoint.rank}
                            {hoveredPoint.totalParticipants ? (
                              <span className="text-[10px] font-normal text-zinc-500">
                                {' '}
                                / {hoveredPoint.totalParticipants}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      )}

                    {pct !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Percentile</span>
                        <span
                          className={cn(
                            'font-mono font-bold',
                            getRankPercentileColor(pct)
                          )}
                        >
                          Top {pct.toFixed(1)}%
                        </span>
                      </div>
                    )}

                    {hoveredPoint.problemsSolved !== null &&
                      hoveredPoint.problemsSolved !== undefined && (
                        <div className="col-span-2 flex items-center justify-between border-t border-white/[0.03] pt-1.5">
                          <span className="text-zinc-500">Solved</span>
                          <span className="font-mono font-semibold text-emerald-400">
                            {hoveredPoint.problemsSolved}
                            {hoveredPoint.totalProblems ? (
                              <span className="text-zinc-500">
                                {' '}
                                of {hoveredPoint.totalProblems} Problems
                              </span>
                            ) : (
                              ' Problems'
                            )}
                          </span>
                        </div>
                      )}
                  </div>
                  {hoveredPoint.contestUrl && (
                    <div className="mt-1.5 border-t border-white/5 pt-1.5 text-center text-[9px] text-zinc-500">
                      Click to view contest page
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export { DifficultyDonut, TopicRadar, RatingLineChart };
