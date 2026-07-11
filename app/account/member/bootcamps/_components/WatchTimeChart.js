/**
 * @file Watch-time bar chart with presets and custom range.
 * @module WatchTimeChart
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Clock, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CourseFilterMenu } from './CourseFilterMenu';
import { cn, formatWatchSeconds } from './bootcamps-shared';

const WATCH_PRESETS = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: '6month', label: '6 Mo' },
  { id: 'year', label: '1 Yr' },
  { id: 'custom', label: 'Custom' },
];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildWatchChartData(learningActivity, preset, customFrom, customTo) {
  const now = new Date();

  let from, to, groupBy;
  if (preset === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    groupBy = 'day';
  } else if (preset === 'month') {
    from = new Date(now);
    from.setDate(now.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    groupBy = 'week';
  } else if (preset === '6month') {
    from = new Date(now);
    from.setMonth(now.getMonth() - 5);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    groupBy = 'month';
  } else if (preset === 'year') {
    from = new Date(now);
    from.setMonth(now.getMonth() - 11);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    groupBy = 'month';
  } else {
    from = customFrom
      ? new Date(customFrom + 'T00:00:00')
      : new Date(now.getFullYear(), now.getMonth(), 1);
    to = customTo ? new Date(customTo + 'T23:59:59') : new Date(now);
    const diffDays = Math.ceil((to - from) / 86400000);
    groupBy = diffDays <= 31 ? 'day' : diffDays <= 120 ? 'week' : 'month';
  }

  const MONTH_ABBR = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build buckets
  const buckets = {};
  if (groupBy === 'day') {
    const cur = new Date(from);
    while (cur <= to) {
      buckets[toDateStr(cur)] = {
        name: DAY_ABBR[cur.getDay()],
        duration: 0,
        lessons: [],
      };
      cur.setDate(cur.getDate() + 1);
    }
  } else if (groupBy === 'week') {
    // Weeks: Mon-Sun buckets
    const cur = new Date(from);
    let weekNum = 0;
    while (cur <= to) {
      const key = `w${weekNum}`;
      const endOfWeek = new Date(cur);
      endOfWeek.setDate(cur.getDate() + 6);
      const label = `${cur.getDate()} ${MONTH_ABBR[cur.getMonth()]}`;
      buckets[key] = {
        name: label,
        start: new Date(cur),
        end: new Date(Math.min(endOfWeek, to)),
        duration: 0,
        lessons: [],
      };
      cur.setDate(cur.getDate() + 7);
      weekNum++;
    }
  } else {
    // Month buckets
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cur <= to) {
      const key = `${cur.getFullYear()}-${cur.getMonth()}`;
      buckets[key] = {
        name: MONTH_ABBR[cur.getMonth()],
        year: cur.getFullYear(),
        month: cur.getMonth(),
        duration: 0,
        lessons: [],
      };
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  // Fill buckets from learning_activity_daily rows.
  // Accumulate as seconds, convert to minutes at the end — otherwise rows with
  // <30s are silently rounded to 0 minutes and dropped.
  learningActivity.forEach((row) => {
    const d = new Date(row.activity_date + 'T00:00:00');
    if (d < from || d > to) return;
    const secs = Math.max(0, Number(row.watch_time) || 0);
    const lessons = row.completed_lessons || [];
    const addToBucket = (b) => {
      if (secs > 0) b.duration += secs;
      lessons.forEach((l) => {
        if (!b.lessons.some((x) => x.id === l.id)) b.lessons.push(l);
      });
    };
    if (groupBy === 'day') {
      const k = row.activity_date;
      if (buckets[k]) addToBucket(buckets[k]);
    } else if (groupBy === 'week') {
      for (const b of Object.values(buckets)) {
        if (d >= b.start && d <= b.end) {
          addToBucket(b);
          break;
        }
      }
    } else {
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (buckets[k]) addToBucket(buckets[k]);
    }
  });

  // `duration` is seconds — formatters and tooltip handle display.
  return Object.values(buckets);
}

function WatchTimeChart({ learningActivity, courses = [] }) {
  const [preset, setPreset] = useState('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const filteredActivity = useMemo(
    () =>
      courseFilter === 'all'
        ? learningActivity
        : learningActivity.filter((r) => r.bootcamp_id === courseFilter),
    [learningActivity, courseFilter]
  );
  const chartData = useMemo(
    () => buildWatchChartData(filteredActivity, preset, customFrom, customTo),
    [filteredActivity, preset, customFrom, customTo]
  );

  // chartData.duration is in SECONDS
  const totalSecs = chartData.reduce((s, d) => s + d.duration, 0);
  const activeDays = chartData.filter((d) => d.duration > 0).length;
  const avgSecs = activeDays > 0 ? Math.round(totalSecs / activeDays) : 0;
  const topBar = chartData.reduce((a, b) => (b.duration > a.duration ? b : a), {
    name: '-',
    duration: 0,
  });

  const presetLabel = {
    week: "This week's effort",
    month: 'Last 30 days',
    '6month': 'Last 6 months',
    year: 'Last 12 months',
    custom:
      customFrom && customTo
        ? `${customFrom} → ${customTo}`
        : 'Select date range',
  }[preset];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const { lessons = [] } = payload[0].payload;
    return (
      <div className="max-w-72 min-w-48 rounded-xl border border-white/10 bg-zinc-900 p-3 shadow-xl">
        <p className="mb-2 text-[10px] font-medium tracking-widest text-gray-500 uppercase">
          {label}
        </p>
        {lessons.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {lessons.map((l) => (
              <div
                key={l.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex min-w-0 items-start gap-1.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  <span className="text-xs leading-tight text-gray-300">
                    {l.title}
                  </span>
                </div>
                {l.watch_time > 0 && (
                  <span className="shrink-0 text-xs font-semibold whitespace-nowrap text-violet-400">
                    {formatWatchSeconds(l.watch_time)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <div
          className={`flex items-center justify-between gap-4 ${lessons.length > 0 ? 'border-t border-white/10 pt-2' : ''}`}
        >
          <span className="text-[10px] tracking-widest text-gray-500 uppercase">
            Watch time
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-violet-400">
            <Clock className="h-3 w-3" />
            {formatWatchSeconds(payload[0].value) || '0s'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/2 p-5 shadow-sm md:p-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Watch Time
          </h3>
          <p className="text-sm text-gray-500">{presetLabel}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-300">
            {formatWatchSeconds(totalSecs) || '0m'}
          </div>
          {courses.length > 0 && (
            <CourseFilterMenu
              courses={courses}
              value={courseFilter}
              onChange={setCourseFilter}
            />
          )}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                menuOpen
                  ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/10 hover:text-white'
              )}
            >
              <span>
                {WATCH_PRESETS.find((p) => p.id === preset)?.label || 'Range'}
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  menuOpen && 'rotate-180'
                )}
              />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute top-full right-0 z-20 mt-1.5 min-w-[140px] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl"
              >
                {WATCH_PRESETS.map((p) => {
                  const active = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        setPreset(p.id);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'text-violet-300'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span>{p.label}</span>
                      {active && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom date inputs */}
      {preset === 'custom' && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="min-w-[130px] flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:border-violet-500/40 focus:outline-none"
          />
          <span className="shrink-0 text-xs text-gray-600">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="min-w-[130px] flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:border-violet-500/40 focus:outline-none"
          />
        </div>
      )}

      <div className="min-h-[160px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            barSize={Math.max(
              8,
              Math.min(32, Math.floor(320 / Math.max(chartData.length, 1)))
            )}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#1e2535"
              opacity={0.8}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }}
              dy={10}
              interval={chartData.length > 12 ? 'preserveStartEnd' : 0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(v) =>
                v >= 60 ? `${Math.round(v / 60)}m` : `${v}s`
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(139,92,246,0.05)' }}
            />
            <Bar dataKey="duration" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.duration > 3600 ? '#a855f7' : '#8b5cf6'}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col rounded-xl border border-white/10 bg-white/2 p-3.5">
          <span className="mb-1 text-xs font-medium text-gray-500">
            Avg / active day
          </span>
          <span className="text-lg font-bold text-white">
            {formatWatchSeconds(avgSecs) || '0s'}
          </span>
        </div>
        <div className="flex flex-col rounded-xl border border-white/10 bg-white/2 p-3.5">
          <span className="mb-1 text-xs font-medium text-gray-500">
            Top Period
          </span>
          <span className="text-lg font-bold text-white">
            {topBar.duration > 0 ? topBar.name : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}


export { WatchTimeChart };
