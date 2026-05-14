import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from '../../../../_lib/utils';
import { Calendar, PlaySquare, BookOpenCheck, Info } from 'lucide-react';

function formatNumber(num) {
  return num.toString();
}

const HEATMAP_COLS = 53;
const HEATMAP_ROWS = 7;

// Generate dummy heatmap data
const generateHeatmap = () => {
  const cols = [];
  let total = 0;
  for (let i = 0; i < HEATMAP_COLS; i++) {
    const col = [];
    for (let j = 0; j < HEATMAP_ROWS; j++) {
      // higher probability of 0, then 1,2,3,4
      const rand = Math.random();
      let level = 0;
      if (rand > 0.8) level = 1;
      if (rand > 0.9) level = 2;
      if (rand > 0.95) level = 3;
      if (rand > 0.98) level = 4;
      
      const count = level > 0 ? Math.floor(Math.random() * 5 * level) + 1 : 0;
      total += count;
      col.push({ level, count });
    }
    cols.push(col);
  }
  return { cols, total };
};

const HeatmapCell = ({ level, count }) => {
  const colors = [
    'bg-white/[0.01]', // level 0
    'bg-emerald-500/20', // level 1
    'bg-emerald-500/40', // level 2
    'bg-emerald-500/70', // level 3
    'bg-emerald-400', // level 4
  ];

  return (
    <div
      title={count > 0 ? `${count} solves` : 'No activity'}
      className={cn("h-[10px] w-[10px] rounded-[2px] transition-colors", colors[level])}
    />
  );
};

// Dummy video data
const videoData = [
  { date: '08 May', value: 0.2 },
  { date: '09 May', value: 0.5 },
  { date: '10 May', value: 0.8 },
  { date: '11 May', value: 0.3 },
  { date: '12 May', value: 0.9 },
  { date: '13 May', value: 0.4 },
  { date: '14 May', value: 0.7 },
];

export function ActivityViz() {
  const grid = useMemo(() => generateHeatmap(), []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Module Finish Track */}
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-950 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] pb-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <BookOpenCheck className="h-5 w-5 text-indigo-400" />
              Module Finish Track
            </h3>
            <div className="flex items-center gap-3">
              <select className="bg-transparent text-sm text-gray-400 focus:outline-none border border-white/[0.06] rounded-md px-2 py-1 cursor-pointer hover:bg-white/[0.01] transition-colors">
                <option>May 2026</option>
                <option>Jun 2026</option>
              </select>
              <Info className="h-4 w-4 text-amber-500 cursor-pointer hover:text-amber-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {Array.from({ length: 31 }).map((_, i) => (
              <div 
                key={i} 
                className="flex aspect-square items-center justify-center rounded-lg bg-white/[0.01] text-sm font-medium text-gray-400 transition-colors hover:bg-indigo-500/20 hover:text-indigo-300 cursor-default"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Video Duration */}
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-950 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] pb-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <PlaySquare className="h-5 w-5 text-rose-400" />
              Video Duration
            </h3>
            <div className="flex items-center gap-3">
              <select className="bg-transparent text-sm text-gray-400 focus:outline-none border border-white/[0.06] rounded-md px-2 py-1 cursor-pointer hover:bg-white/[0.01] transition-colors">
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
              <Info className="h-4 w-4 text-amber-500 cursor-pointer hover:text-amber-400" />
            </div>
          </div>

          <div className="flex items-center gap-2 w-max rounded-md bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400 border border-violet-500/20">
            <PlaySquare className="h-3.5 w-3.5" />
            Total: 0 Hours and 0 Minutes.
          </div>

          <div className="h-[250px] w-full mt-6" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>
              <AreaChart data={videoData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.1)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  tickFormatter={(val) => `${val} m`}
                  domain={[0, 1]}
                  ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111114', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#4ade80' }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4ade80" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Activity Heatmap */}
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-950 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl w-full">
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] pb-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Calendar className="h-5 w-5 text-emerald-400" />
            Activity Heatmap
          </h3>
          <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
            365 Days
          </span>
        </div>
        
        <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 relative z-10 w-full overflow-x-auto pb-2">
          <div className="flex min-w-[720px] flex-col gap-2.5">
            <div className="flex pt-1 pl-8 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              {[
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ].map((m) => (
                <div key={m} style={{ flex: 1 }}>
                  {m}
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col justify-between py-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>
              <div className="flex flex-1 gap-[3px]">
                {grid.cols.map((col, i) => (
                  <div key={i} className="flex flex-col gap-[3px]">
                    {col.map((cell, j) => (
                      <HeatmapCell
                        key={j}
                        level={cell.level}
                        count={cell.count}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
          <span className="text-gray-400">
            Total: {formatNumber(grid.total)} solves
          </span>
          <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
              <HeatmapCell level={0} count={0} />
              <HeatmapCell level={1} count={1} />
              <HeatmapCell level={2} count={2} />
              <HeatmapCell level={3} count={3} />
              <HeatmapCell level={4} count={4} />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

    </div>
  );
}
