'use client';

import { useState } from 'react';
import { PlayCircle, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const watchData = [
  { date: 'Mon', minutes: 45, course: 'Frontend Development' },
  { date: 'Tue', minutes: 120, course: 'Frontend Development' },
  { date: 'Wed', minutes: 80, course: 'Backend with Node.js' },
  { date: 'Thu', minutes: 150, course: 'Frontend Development' },
  { date: 'Fri', minutes: 90, course: 'DSA Mastery Track' },
  { date: 'Sat', minutes: 210, course: 'DSA Mastery Track' },
  { date: 'Sun', minutes: 60, course: 'Backend with Node.js' },
];

const timeFilters = ['Day', 'Week', 'Month', '6 Months', 'Year', 'All', 'Custom'];

export default function VideoWatchTime({ roadmaps }) {
  const [timeFilter, setTimeFilter] = useState('Week');
  const [trackFilter, setTrackFilter] = useState('All Tracks');

  const filteredData = trackFilter === 'All Tracks' 
    ? watchData 
    : watchData.filter(d => d.course === trackFilter);

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">Video Watch Time</h3>
            <p className="text-xs text-zinc-500 mt-1">Time spent across video lessons</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
          >
            <option value="All Tracks">All Tracks</option>
            {roadmaps.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>

          <div className="flex bg-zinc-950 border border-white/10 rounded-lg p-1 overflow-x-auto max-w-full">
            {timeFilters.map(filter => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md whitespace-nowrap transition-colors ${
                  timeFilter === filter 
                    ? "bg-white/10 text-zinc-100" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {timeFilter === 'Custom' && (
        <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 p-3 rounded-xl w-fit">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <input type="date" className="bg-transparent text-xs text-zinc-300 focus:outline-none [color-scheme:dark]" defaultValue="2026-05-01" />
          <span className="text-zinc-500 text-xs">to</span>
          <input type="date" className="bg-transparent text-xs text-zinc-300 focus:outline-none [color-scheme:dark]" defaultValue="2026-05-16" />
        </div>
      )}

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: '#e4e4e7', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#a1a1aa', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="minutes" 
              stroke="#6366f1" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorMinutes)" 
              activeDot={{ r: 6, fill: "#6366f1", stroke: "#18181b", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
