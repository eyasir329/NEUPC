/**
 * @file Activity Heatmap Component
 * @module ActivityHeatmap
 *
 * GitHub-style activity heatmap with year navigation.
 * Displays a single full year of daily problem-solving activity
 * in the original simple dark card style, with interactive tooltips
 * and a year filter (prev/next buttons).
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Palette ──────────────────────────────────────────────────────────────────
const INTENSITY_COLORS = [
  'bg-white/[0.05]',   // Level 0 - empty
  'bg-emerald-900/60', // Level 1 - light
  'bg-emerald-600/70', // Level 2
  'bg-emerald-500/80', // Level 3
  'bg-emerald-400',    // Level 4 - intense
];

const INTENSITY_BORDERS = [
  'border-white/[0.06]',
  'border-emerald-700/50',
  'border-emerald-500/50',
  'border-emerald-400/50',
  'border-emerald-300/60',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad2 = (n) => String(n).padStart(2, '0');

const toDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const fromDateKey = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const getIntensity = (count) => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
};

const formatDate = (dateStr) =>
  fromDateKey(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const formatDateShort = (dateStr) =>
  fromDateKey(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ day, position, isMobile }) {
  if (!day || !position) return null;

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="fixed inset-x-4 bottom-4 z-50 rounded-xl border border-white/10 bg-gray-900/98 px-4 py-3 shadow-2xl backdrop-blur-md"
      >
        <p className="text-xs font-medium text-gray-400">{formatDateShort(day.date)}</p>
        <p className="mt-0.5 text-sm font-bold text-white">
          {day.count === 0 ? (
            <span className="text-gray-500">No activity</span>
          ) : (
            <>
              <span className="text-emerald-400">{day.count}</span>{' '}
              {day.count === 1 ? 'problem' : 'problems'} solved
            </>
          )}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      className="pointer-events-none fixed z-50 rounded-xl border border-white/10 bg-gray-900/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
      style={{
        left: Math.max(80, Math.min(position.x, window.innerWidth - 80)),
        top: position.y - 72,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="text-center">
        <p className="text-[10px] font-medium text-gray-400 sm:text-xs">{formatDate(day.date)}</p>
        <p className="mt-0.5 text-xs font-bold text-white sm:text-sm">
          {day.count === 0 ? (
            <span className="text-gray-500">No activity</span>
          ) : (
            <>
              <span className="text-emerald-400">{day.count}</span>{' '}
              {day.count === 1 ? 'problem' : 'problems'} solved
            </>
          )}
        </p>
      </div>
      <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-white/10 bg-gray-900/95" />
    </motion.div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend({ cellSize }) {
  const sz = Math.max(8, cellSize - 1);
  return (
    <div className="flex items-center gap-1 text-zinc-500">
      <span className="text-[10px] font-medium uppercase tracking-wider">Less</span>
      {INTENSITY_COLORS.map((color, i) => (
        <div
          key={i}
          className={`rounded-sm border ${color} ${INTENSITY_BORDERS[i]}`}
          style={{ width: sz, height: sz }}
        />
      ))}
      <span className="text-[10px] font-medium uppercase tracking-wider">More</span>
    </div>
  );
}

// ── Year Selector ─────────────────────────────────────────────────────────────
function YearSelector({ year, onChange, minYear, maxYear }) {
  const canGoPrev = year > minYear;
  const canGoNext = year < maxYear;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => canGoPrev && onChange(year - 1)}
        disabled={!canGoPrev}
        aria-label="Previous year"
        className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="flex min-w-[52px] items-center justify-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs font-bold text-white tabular-nums">
        <Calendar className="h-3 w-3 text-emerald-400" />
        {year}
      </span>
      <button
        onClick={() => canGoNext && onChange(year + 1)}
        disabled={!canGoNext}
        aria-label="Next year"
        className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ActivityHeatmap({ data = [], onDayClick }) {
  const currentYearNum = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYearNum);
  const [tooltip, setTooltip]           = useState({ day: null, position: null });
  const [containerWidth, setContainerWidth] = useState(0);
  const [isMobile, setIsMobile]         = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [selectedDay, setSelectedDay]   = useState(null);

  const containerRef = useRef(null);

  // Viewport tracking
  useEffect(() => {
    const update = () => {
      setViewportWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 640);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Container width via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Cell sizing
  const { cellSize, gap, showDayLabels } = useMemo(() => {
    const isTablet  = viewportWidth >= 640  && viewportWidth < 1024;
    const isLaptop  = viewportWidth >= 1024 && viewportWidth < 1280;
    const isDesktop = viewportWidth >= 1280 && viewportWidth < 1536;
    const isFhd     = viewportWidth >= 1536;

    const padding      = isMobile ? 24 : 48;
    const dayLabelW    = isMobile ? 0 : 32;
    const available    = containerWidth - padding - dayLabelW;
    const numWeeks     = 54;
    const gapRatio     = isMobile ? 0.12 : isTablet ? 0.14 : isLaptop ? 0.16 : 0.18;
    const raw          = available / (numWeeks + (numWeeks - 1) * gapRatio);
    const minSz        = isMobile ? 8 : isTablet ? 9 : 10;
    const maxSz        = isMobile ? 12 : isTablet ? 14 : isLaptop ? 16 : isDesktop ? 18 : isFhd ? 22 : 18;
    const clamped      = Math.max(minSz, Math.min(maxSz, raw));
    const calculatedGap = Math.max(1, Math.round(clamped * gapRatio));

    return {
      cellSize: Math.floor(clamped),
      gap: calculatedGap,
      showDayLabels: !isMobile,
    };
  }, [containerWidth, isMobile, viewportWidth]);

  // Min year from data
  const minYear = useMemo(() => {
    let min = currentYearNum - 2;
    data.forEach((item) => {
      if (item.problems_solved > 0) {
        const y = fromDateKey(item.activity_date).getFullYear();
        if (y < min) min = y;
      }
    });
    return min;
  }, [data, currentYearNum]);

  // Build calendar weeks for selected year
  const calendarData = useMemo(() => {
    const startDate = new Date(selectedYear, 0, 1);
    const endDate   = new Date(selectedYear, 11, 31);
    const today     = new Date();

    const activityMap = {};
    data.forEach((item) => { activityMap[item.activity_date] = item.problems_solved; });

    const weeks = [];
    let week = [];

    const startDay = startDate.getDay();
    for (let i = 0; i < startDay; i++) week.push(null);

    const cur = new Date(startDate);
    while (cur <= endDate) {
      if (cur > today) {
        week.push({ date: toDateKey(cur), count: 0, future: true });
      } else {
        const key = toDateKey(cur);
        week.push({ date: key, count: activityMap[key] || 0 });
      }
      if (week.length === 7) { weeks.push(week); week = []; }
      cur.setDate(cur.getDate() + 1);
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }, [data, selectedYear]);

  // Month label positions
  const monthLabels = useMemo(() => {
    const labels = [];
    const cellWithGap = cellSize + gap;
    for (let month = 0; month < 12; month++) {
      if (isMobile && month % 2 !== 0) continue;
      const first       = new Date(selectedYear, month, 1);
      const dayOfYear   = Math.floor((first - new Date(selectedYear, 0, 1)) / 86400000);
      const startOffset = new Date(selectedYear, 0, 1).getDay();
      const weekIndex   = Math.floor((dayOfYear + startOffset) / 7);
      labels.push({ month: MONTHS[month], position: weekIndex * cellWithGap });
    }
    return labels;
  }, [cellSize, gap, isMobile, selectedYear]);

  // Total solved for selected year
  const totalSolved = useMemo(() => {
    return data
      .filter((d) => fromDateKey(d.activity_date).getFullYear() === selectedYear)
      .reduce((sum, d) => sum + d.problems_solved, 0);
  }, [data, selectedYear]);

  // Event handlers
  const handleDayHover = useCallback((day, e) => {
    if (day.future || isMobile) return;
    const rect = e.target.getBoundingClientRect();
    setTooltip({ day, position: { x: rect.left + rect.width / 2, y: rect.top } });
  }, [isMobile]);

  const handleDayLeave = useCallback(() => {
    setTooltip({ day: null, position: null });
  }, []);

  const handleDayTap = useCallback((day, e) => {
    if (day.future) return;
    if (onDayClick) { onDayClick(day.date); return; }
    if (isMobile) {
      e.preventDefault();
      setSelectedDay(day);
      setTooltip({ day, position: { x: 0, y: 0 } });
      setTimeout(() => { setSelectedDay(null); setTooltip({ day: null, position: null }); }, 3000);
    }
  }, [isMobile, onDayClick]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white">
          <Calendar className="h-4 w-4 text-emerald-400" />
          Activity Heatmap
        </h3>
        <YearSelector
          year={selectedYear}
          onChange={setSelectedYear}
          minYear={minYear}
          maxYear={currentYearNum}
        />
      </div>

      {/* Heatmap body */}
      <div ref={containerRef} className="px-5 pb-4">
        {containerWidth > 0 && (
          <div className="flex flex-col">
            {/* Month labels */}
            <div
              className="relative mb-2 h-4"
              style={{ marginLeft: showDayLabels ? 32 + gap : gap }}
            >
              {monthLabels.map(({ month, position }, idx) => (
                <span
                  key={month + idx}
                  className="absolute text-[10px] font-medium text-zinc-500"
                  style={{ left: position }}
                >
                  {month}
                </span>
              ))}
            </div>

            {/* Grid row */}
            <div className="scrollbar-hide flex overflow-x-auto sm:overflow-visible">
              {/* Day labels */}
              {showDayLabels && (
                <div
                  className="hidden flex-col justify-between pr-2 sm:flex"
                  style={{
                    width: 32,
                    height: 7 * cellSize + 6 * gap,
                    paddingTop: cellSize * 0.1,
                    paddingBottom: cellSize * 0.1,
                  }}
                >
                  {DAYS.map((day, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-end text-[10px] font-medium text-zinc-600"
                      style={{ height: cellSize }}
                    >
                      {i % 2 === 1 ? day.slice(0, 3) : ''}
                    </div>
                  ))}
                </div>
              )}

              {/* Weeks */}
              <div className="flex flex-1" style={{ gap }}>
                {calendarData.map((week, wi) => (
                  <div key={wi} className="flex flex-col" style={{ gap }}>
                    {week.map((day, di) => {
                      if (!day) {
                        return (
                          <div key={`${wi}-${di}`} style={{ width: cellSize, height: cellSize }} />
                        );
                      }

                      const intensity    = day.future ? 0 : getIntensity(day.count);
                      const colorClass   = INTENSITY_COLORS[intensity];
                      const borderClass  = INTENSITY_BORDERS[intensity];
                      const isSelected   = selectedDay?.date === day.date;

                      return (
                        <motion.div
                          key={`${wi}-${di}`}
                          whileHover={day.future || isMobile ? {} : { scale: 1.2 }}
                          whileTap={day.future ? {} : { scale: 0.9 }}
                          onMouseEnter={(e) => handleDayHover(day, e)}
                          onMouseLeave={handleDayLeave}
                          onClick={(e) => handleDayTap(day, e)}
                          className={`rounded-sm border ${colorClass} ${borderClass} ${
                            day.future
                              ? 'cursor-default opacity-25'
                              : `cursor-pointer transition-all duration-150 ${
                                  isSelected
                                    ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-zinc-900'
                                    : 'hover:border-emerald-400/60 hover:shadow-sm hover:shadow-emerald-500/20'
                                }`
                          }`}
                          style={{ width: cellSize, height: cellSize }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
              <p className="text-[11px] font-medium text-zinc-500">
                Total:{' '}
                <span className="font-bold text-emerald-400">{totalSolved}</span>{' '}
                solve{totalSolved !== 1 ? 's' : ''}
              </p>
              <Legend cellSize={cellSize} />
            </div>

            {/* Mobile tap hint */}
            {isMobile && (
              <p className="mt-2 text-center text-[9px] text-zinc-600">
                Tap a cell to see details
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip.day && !tooltip.day.future && (
          <Tooltip day={tooltip.day} position={tooltip.position} isMobile={isMobile} />
        )}
      </AnimatePresence>
    </div>
  );
}
