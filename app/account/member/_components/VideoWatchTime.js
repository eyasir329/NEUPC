/**
 * @file Video watch time component
 * @module VideoWatchTime
 */

'use client';

import { useState } from 'react';
import { PlayCircle, Calendar, Clock } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const watchData = [
  {
    date: 'Mon',
    minutes: 45,
    videos: [
      {
        title: 'Intro to React Hooks',
        course: 'Frontend Development',
        minutes: 25,
      },
      {
        title: 'useState Deep Dive',
        course: 'Frontend Development',
        minutes: 20,
      },
    ],
  },
  {
    date: 'Tue',
    minutes: 120,
    videos: [
      {
        title: 'useEffect Patterns',
        course: 'Frontend Development',
        minutes: 45,
      },
      { title: 'Custom Hooks', course: 'Frontend Development', minutes: 40 },
      {
        title: 'Node.js Event Loop',
        course: 'Backend with Node.js',
        minutes: 35,
      },
    ],
  },
  {
    date: 'Wed',
    minutes: 80,
    videos: [
      {
        title: 'Express Middleware',
        course: 'Backend with Node.js',
        minutes: 50,
      },
      { title: 'REST API Design', course: 'Backend with Node.js', minutes: 30 },
    ],
  },
  {
    date: 'Thu',
    minutes: 150,
    videos: [
      { title: 'Context API', course: 'Frontend Development', minutes: 60 },
      {
        title: 'Performance Optimization',
        course: 'Frontend Development',
        minutes: 55,
      },
      { title: 'Big O Notation', course: 'DSA Mastery Track', minutes: 35 },
    ],
  },
  {
    date: 'Fri',
    minutes: 90,
    videos: [
      { title: 'Binary Search', course: 'DSA Mastery Track', minutes: 45 },
      { title: 'Linked Lists', course: 'DSA Mastery Track', minutes: 45 },
    ],
  },
  {
    date: 'Sat',
    minutes: 210,
    videos: [
      { title: 'Tree Traversal', course: 'DSA Mastery Track', minutes: 70 },
      { title: 'Graph Algorithms', course: 'DSA Mastery Track', minutes: 80 },
      {
        title: 'Dynamic Programming Intro',
        course: 'DSA Mastery Track',
        minutes: 60,
      },
    ],
  },
  {
    date: 'Sun',
    minutes: 60,
    videos: [
      {
        title: 'MongoDB Aggregation',
        course: 'Backend with Node.js',
        minutes: 35,
      },
      {
        title: 'Authentication Flows',
        course: 'Backend with Node.js',
        minutes: 25,
      },
    ],
  },
];

const timeFilters = [
  'Day',
  'Week',
  'Month',
  '6 Months',
  'Year',
  'All',
  'Custom',
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const { videos } = payload[0].payload;
  return (
    <div className="max-w-70 min-w-55 rounded-xl border border-white/10 bg-zinc-950 p-3 shadow-2xl">
      <p className="mb-2 text-[10px] tracking-widest text-zinc-500 uppercase">
        {label}
      </p>
      <div className="space-y-1.5">
        {videos.map((v, i) => (
          <div key={i} className="flex items-start justify-between gap-3">
            <span className="flex-1 text-xs leading-tight text-zinc-300">
              {v.title}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold whitespace-nowrap text-indigo-400">
              <Clock className="h-3 w-3" />
              {v.minutes}m
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
        <span className="text-[10px] tracking-widest text-zinc-500 uppercase">
          Total
        </span>
        <span className="text-xs font-bold text-zinc-100">
          {payload[0].value}m
        </span>
      </div>
    </div>
  );
}

export default function VideoWatchTime({ roadmaps }) {
  const [timeFilter, setTimeFilter] = useState('Week');
  const [trackFilter, setTrackFilter] = useState('All Tracks');

  const filteredData = watchData
    .map((day) => {
      if (trackFilter === 'All Tracks') return day;
      const videos = day.videos.filter((v) => v.course === trackFilter);
      return {
        ...day,
        videos,
        minutes: videos.reduce((s, v) => s + v.minutes, 0),
      };
    })
    .filter((day) => day.videos.length > 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Video Watch Time
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Time spent across video lessons
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="cursor-pointer rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 transition-colors focus:border-indigo-500 focus:outline-none"
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
          >
            <option value="All Tracks">All Tracks</option>
            {roadmaps.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          <div className="flex max-w-full overflow-x-auto rounded-lg border border-white/10 bg-zinc-950 p-1">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`rounded-md px-3 py-1 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase transition-colors ${
                  timeFilter === filter
                    ? 'bg-white/10 text-zinc-100'
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {timeFilter === 'Custom' && (
        <div className="mb-6 flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <Calendar className="h-4 w-4 text-zinc-400" />
          <input
            type="date"
            className="bg-transparent text-xs text-zinc-300 [color-scheme:dark] focus:outline-none"
            defaultValue="2026-05-01"
          />
          <span className="text-xs text-zinc-500">to</span>
          <input
            type="date"
            className="bg-transparent text-xs text-zinc-300 [color-scheme:dark] focus:outline-none"
            defaultValue="2026-05-16"
          />
        </div>
      )}

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: 'rgba(255,255,255,0.1)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMinutes)"
              activeDot={{
                r: 6,
                fill: '#6366f1',
                stroke: '#18181b',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
