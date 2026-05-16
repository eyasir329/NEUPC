'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import SafeImg from '@/app/_components/ui/SafeImg';
import {
  BookOpen, Clock, Play, Search, ArrowRight, Loader2,
  GraduationCap, Zap, Trophy, ChevronRight, Star,
  Sparkles, CheckCircle2, X, TrendingUp, Video,
  PlaySquare, BookOpenCheck, House, List, Flame, CheckCircle,
  Calendar, ChevronLeft, FileText, PlayCircle
} from 'lucide-react';
import { enrollUser } from '@/app/_lib/bootcamp-actions';
import { PageHeader } from '../../_components/_ui';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: House },
  { id: 'mylearning', label: 'My Learning', icon: GraduationCap },
  { id: 'catalog', label: 'Catalog', icon: BookOpen },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function timeAgo(iso) {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

// --- Empty States ---
function EmptyEnrolled({ onBrowse }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5 py-14 sm:py-20 text-center px-4">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/25">
        <GraduationCap className="h-8 w-8 text-violet-400" />
      </div>
      <p className="mb-1 text-[15px] font-bold text-white">No enrollments yet</p>
      <p className="mb-6 max-w-xs text-[13px] text-gray-500">
        Start learning by enrolling in a bootcamp below.
      </p>
      <button
        onClick={onBrowse}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30 active:scale-95"
      >
        <BookOpen className="h-4 w-4" />
        Browse Bootcamps
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptySearch({ query, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/6 py-12 text-center px-4">
      <Search className="mb-3 h-8 w-8 text-gray-700" />
      <p className="text-[13px] font-semibold text-gray-400">No results for &ldquo;{query}&rdquo;</p>
      <button onClick={onClear} className="mt-3 text-[12px] text-violet-400 hover:text-violet-300 transition-colors">
        Clear search
      </button>
    </div>
  );
}

// --- Dashboard Components ---

function LearningCalendar({ enrolledBootcamps }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const completedModules = useMemo(() => {
    const data = {};
    enrolledBootcamps.forEach(({ enrollment, bootcamp }) => {
      const progress = enrollment?.progressData?.progress || [];
      progress.forEach(p => {
        if (p.is_completed && p.completed_at) {
          const d = new Date(p.completed_at);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          if (!data[key]) data[key] = [];
          data[key].push({ title: `${bootcamp.title} Lesson`, type: 'video' });
        }
      });
    });
    return data;
  }, [enrolledBootcamps]);

  const getIntensityClass = (count, isToday) => {
    if (count === 0) return isToday ? 'bg-violet-500/10 border-violet-500/40 text-violet-500 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]' : 'bg-white/5 border-transparent text-gray-500 hover:border-white/10 hover:bg-white/10';
    if (count === 1) return 'bg-violet-500/30 text-white border-violet-500/10 hover:bg-violet-500/40';
    if (count === 2) return 'bg-violet-500/60 text-white border-violet-500/20 hover:bg-violet-500/70';
    if (count >= 3) return 'bg-violet-500 text-white border-violet-500 shadow-[0_4px_10px_rgba(139,92,246,0.25)] hover:bg-violet-500/90';
    return 'bg-white/5 border-transparent text-gray-500 hover:border-white/10';
  };

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-5 md:p-6 h-full flex flex-col shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-violet-400" />
            Learning Activity
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Your monthly completion heatmap</p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-28 text-center text-sm font-semibold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-3">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-xl" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const domNodeDate = i + 1;
            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${domNodeDate}`;
            const activities = completedModules[dateKey] || [];
            const count = activities.length;
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), domNodeDate).toDateString();

            return (
              <div 
                key={i} 
                className={`relative group aspect-square flex items-center justify-center rounded-xl border transition-all duration-300 font-semibold text-sm cursor-default ${getIntensityClass(count, isToday)}`}
              >
                {domNodeDate}
                {isToday && count === 0 && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-violet-500/60"></span>}
                
                {count > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-max max-w-[220px] z-50 mb-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none origin-bottom">
                    <div className="bg-gray-800 text-white text-xs rounded-xl p-3 shadow-xl border border-white/10">
                       <div className="font-bold mb-2 text-white/80 border-b border-white/10 pb-1.5">
                         {monthNames[currentDate.getMonth()]} {domNodeDate}, {currentDate.getFullYear()}
                       </div>
                       <div className="flex flex-col gap-1.5">
                         {activities.slice(0, 5).map((act, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-violet-400"></span>
                              <span className="truncate font-medium">{act.title}</span>
                            </div>
                         ))}
                         {activities.length > 5 && (
                           <div className="text-gray-400 text-[10px] italic">+{activities.length - 5} more lessons</div>
                         )}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-gray-500 font-medium bg-white/5 w-fit mx-auto px-4 py-2 rounded-full border border-white/10">
           <span>Less</span>
           <div className="flex items-center gap-1.5 mx-1">
             <div className="w-3.5 h-3.5 rounded-sm bg-white/5 border border-transparent"></div>
             <div className="w-3.5 h-3.5 rounded-sm bg-violet-500/30 border border-violet-500/10"></div>
             <div className="w-3.5 h-3.5 rounded-sm bg-violet-500/60 border border-violet-500/20"></div>
             <div className="w-3.5 h-3.5 rounded-sm bg-violet-500 border border-violet-500 shadow-sm"></div>
           </div>
           <span>More</span>
        </div>
      </div>
    </div>
  );
}

function WatchTimeChart({ enrolledBootcamps }) {
  if (enrolledBootcamps.length === 0) return null;

  function fmtMins(m) {
    if (!m || m <= 0) return '0m';
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0) return min > 0 ? `${h}h ${min}m` : `${h}h`;
    return `${min}m`;
  }

  const chartData = enrolledBootcamps.map(({ bootcamp, enrollment }) => ({
    name: bootcamp.title.length > 10 ? bootcamp.title.slice(0, 8) + '…' : bootcamp.title,
    fullTitle: bootcamp.title,
    duration: Math.round(((enrollment?.progress_percent || 0) / 100) * (bootcamp?.total_duration || 0)),
  }));

  const totalWatchedMins = chartData.reduce((s, d) => s + d.duration, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-white/10 p-3 rounded-xl shadow-xl shrink-0 outline-none">
          <p className="text-gray-400 text-xs font-medium mb-1">{data.fullTitle}</p>
          <p className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span>
            {fmtMins(data.duration)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-5 md:p-6 h-full flex flex-col shadow-sm">
      <div className="flex items-start justify-between mb-2">
         <div>
          <h3 className="text-xl font-semibold flex items-center gap-2 mb-1 text-white">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Watch Time
          </h3>
          <p className="text-sm text-gray-500">Total effort per bootcamp</p>
         </div>
         <div className="bg-violet-500/10 text-violet-400 px-3 py-1 rounded-lg text-sm font-semibold border border-violet-500/20">
           {fmtMins(totalWatchedMins)}
         </div>
      </div>
      
      <div className="flex-1 w-full min-h-[180px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={32}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#27272a" opacity={0.6} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 500 }} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#a1a1aa', fontSize: 11 }} 
              tickFormatter={(value) => `${value}m`}
            />
            <ReTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} />
            <Bar dataKey="duration" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.duration > 60 ? '#a855f7' : '#8b5cf6'} 
                  className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-1">Daily Avg</span>
          <span className="text-lg font-bold text-white">45 <span className="text-sm font-medium text-gray-500">min</span></span>
        </div>
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-1">Top Day</span>
          <span className="text-lg font-bold text-white">Saturday</span>
        </div>
      </div>
    </div>
  );
}

function HorizontalEnrolledCard({ bootcamp, enrollment }) {
  const progress = enrollment?.progress_percent || 0;
  const completedLessons = enrollment?.completed_lessons || 0;
  const totalLessons = bootcamp?.total_lessons || 0;
  const remainingLessons = totalLessons - completedLessons;
  const lastOpened = timeAgo(enrollment?.last_accessed_at);
  const duration = formatDuration(bootcamp?.total_duration);
  const isComplete = remainingLessons === 0 && totalLessons > 0;

  return (
    <Link 
      href={`/account/member/bootcamps/${bootcamp.id}`}
      className="group relative overflow-hidden bg-[#0d1117] border border-white/10 rounded-2xl p-1 transition-all hover:border-violet-500/50 cursor-pointer shadow-sm hover:shadow-md block"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex flex-col md:flex-row gap-6 p-4">
        <div className="hidden md:flex w-64 h-40 rounded-xl overflow-hidden border border-white/10 bg-gray-900 shrink-0 relative items-center justify-center">
          {bootcamp.thumbnail ? (
            <SafeImg src={bootcamp.thumbnail} alt={bootcamp.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
              {bootcamp.difficulty_level && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full mb-2 border border-emerald-400/20">
                  {bootcamp.difficulty_level.toUpperCase()}
                </span>
              )}
              <span className="font-bold text-base leading-tight text-white/90">{bootcamp.title}</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-5">
          <div>
            <span className="text-xs font-semibold text-violet-400 mb-1 block">LAST ACTIVE: {lastOpened?.toUpperCase() || 'NEVER'}</span>
            <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-2">
              {bootcamp.title}
            </h3>
          </div>
          
          <div className="space-y-2 max-w-md">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-400">Progress</span>
              <span className="text-white">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full relative overflow-hidden transition-all duration-500" style={{ width: `${progress}%` }}>
                 <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-400">
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {completedLessons}/{totalLessons} lessons</span>
              {duration && (
                <>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {duration} total</span>
                </>
              )}
            </div>
            <span className="flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-500 hover:text-white transition-all duration-300">
              <PlayCircle className="w-4 h-4" />
              {isComplete ? 'Review' : 'Resume Course'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ModuleTrackDots({ bootcamp, totalLessons, completedLessons }) {
  const modules = bootcamp?.modules || [
    { title: "Setup" },
    { title: "Basics" },
    { title: "Big O Notation" },
    { title: "Arrays" },
    { title: "Linked Lists" }
  ];

  const ratio = completedLessons / (totalLessons || 1);
  const completedDots = Math.floor(ratio * modules.length);

  return (
    <div className="pt-2">
      <p className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
        <CheckCircle className="w-3 h-3 text-emerald-500" /> Module Track
      </p>
      <div className="flex gap-2">
        {modules.slice(0, 4).map((mod, i) => {
          const isDone = i < completedDots;
          const isCurrent = i === completedDots;
          return (
            <div key={i} className={`flex flex-col gap-1.5 flex-1 group/track ${isDone ? '' : isCurrent ? '' : 'opacity-50'}`}>
              <div className={`h-1.5 w-full rounded-full ${isDone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : isCurrent ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)] relative overflow-hidden' : 'bg-white/10'}`}>
                {isCurrent && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
              </div>
              <span className={`text-[10px] truncate transition-colors font-medium ${isCurrent ? 'text-white font-bold' : isDone ? 'text-gray-400 group-hover/track:text-gray-200' : 'text-gray-500'}`}>
                {i + 1}. {mod.title}
              </span>
            </div>
          );
        })}
        {modules.length > 4 && (
          <div className="flex flex-col gap-1.5 flex-[0.5] group/track opacity-50">
            <div className="h-1.5 w-full bg-transparent flex items-center justify-end">
               <span className="text-[10px] font-bold tracking-widest leading-none text-gray-500">...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InProgressCard({ bootcamp, enrollment }) {
  const progress = enrollment?.progress_percent || 0;
  const completedLessons = enrollment?.completed_lessons || 0;
  const totalLessons = bootcamp?.total_lessons || 0;
  const remainingLessons = totalLessons - completedLessons;
  const lastOpened = timeAgo(enrollment?.last_accessed_at);

  return (
    <Link 
      href={`/account/member/bootcamps/${bootcamp.id}`}
      className="group relative overflow-hidden bg-[#0d1117] border border-white/10 rounded-xl p-1 transition-all hover:border-violet-500/50 cursor-pointer shadow-sm hover:shadow-md block"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex flex-col md:flex-row gap-6 p-5">
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-semibold text-white group-hover:text-violet-400 transition-colors">
              {bootcamp.title}
            </h3>
            <span className="text-xs font-medium text-violet-400">Last active: {lastOpened || 'Never'}</span>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/10">
             <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-emerald-500" /> <span className="font-medium text-white">{bootcamp.modules?.length || 11}</span> modules</div>
             <div className="flex items-center gap-1.5"><Video className="w-4 h-4 text-blue-500" /> <span className="font-medium text-white">{totalLessons}</span> lessons</div>
             <div className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-amber-500" /> <span className="font-medium text-white">{Math.max(1, Math.floor(totalLessons / 2))}</span> readings</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>{completedLessons}/{totalLessons} lessons completed</span>
              <span className="text-white font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full relative overflow-hidden transition-all duration-500" style={{ width: `${progress}%` }}>
                 <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          <ModuleTrackDots bootcamp={bootcamp} totalLessons={totalLessons} completedLessons={completedLessons} />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{remainingLessons} lessons left</span>
            </div>
            <span className="flex items-center gap-1.5 bg-white text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-violet-500 hover:text-white transition-colors">
              <PlayCircle className="w-4 h-4" />
              Resume
            </span>
          </div>
        </div>
        
        <div className="hidden md:flex w-[280px] h-40 rounded-lg overflow-hidden border border-white/10 bg-gray-900 shrink-0 relative items-center justify-center">
          {bootcamp.thumbnail ? (
            <SafeImg src={bootcamp.thumbnail} alt={bootcamp.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
              {bootcamp.difficulty_level && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full mb-2 border border-emerald-400/20">
                  {bootcamp.difficulty_level.toUpperCase()}
                </span>
              )}
              <span className="font-bold text-base leading-tight text-white/90">{bootcamp.title}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function CompletedCard({ bootcamp, enrollment }) {
  const completedDate = enrollment?.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : 'N/A';

  return (
    <Link 
      href={`/account/member/bootcamps/${bootcamp.id}`}
      className="group relative overflow-hidden bg-[#0d1117] border border-white/10 rounded-xl transition-all hover:border-violet-500/50 cursor-pointer shadow-sm block"
    >
      <div className="h-32 w-full bg-gray-900 relative border-b border-white/10">
        {bootcamp.thumbnail ? (
          <SafeImg src={bootcamp.thumbnail} alt={bootcamp.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
            {bootcamp.difficulty_level && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full mb-2 border border-emerald-400/20">
                {bootcamp.difficulty_level.toUpperCase()}
              </span>
            )}
            <span className="font-bold text-sm leading-tight text-white/90">{bootcamp.title}</span>
          </div>
        )}
      </div>
      <div className="p-5 space-y-4">
        <h3 className="font-semibold text-lg leading-tight text-white group-hover:text-violet-400 transition-colors line-clamp-2">
          {bootcamp.title}
        </h3>
        
        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
           <div className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-emerald-500/70" /> {bootcamp.modules?.length || 5} modules</div>
           <div className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-blue-500/70" /> {bootcamp.total_lessons || 0} lessons</div>
           <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-amber-500/70" /> {Math.max(1, Math.floor((bootcamp.total_lessons || 0) / 2))} readings</div>
        </div>

        <div className="flex items-center justify-between text-sm pt-2">
           <div className="flex items-center gap-1.5 text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
             <CheckCircle className="w-3.5 h-3.5" />
             Completed
           </div>
           <span className="text-gray-500 text-xs font-semibold">{completedDate}</span>
        </div>
      </div>
    </Link>
  );
}

function NewAvailableCard({ bootcamp, onEnroll, isEnrolling, colorIdx }) {
  const gradients = [
    'to-rose-950/50 text-rose-400 border-rose-400/20',
    'to-blue-950/50 text-blue-400 border-blue-400/20',
    'to-emerald-950/50 text-emerald-400 border-emerald-400/20',
    'to-amber-950/50 text-amber-400 border-amber-400/20',
    'to-violet-950/50 text-violet-400 border-violet-400/20',
  ];
  const style = gradients[colorIdx % gradients.length];
  const [bgClass, textClass, borderClass] = style.split(' ');

  return (
    <div className="group flex flex-col bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-colors">
      <div className={`h-48 bg-gradient-to-br from-slate-900 ${bgClass} border-b border-white/10 p-6 flex flex-col justify-center items-center text-center relative overflow-hidden`}>
        {bootcamp.thumbnail ? (
          <div className="absolute inset-0 opacity-40 mix-blend-overlay group-hover:opacity-60 transition-opacity">
            <SafeImg src={bootcamp.thumbnail} alt={bootcamp.title} className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-shimmer mix-blend-overlay"></div>
        {bootcamp.difficulty_level && (
          <span className={`text-[10px] font-bold ${textClass} bg-white/5 px-2 py-0.5 rounded-full mb-3 border border-white/10 backdrop-blur-md relative z-10`}>
            {bootcamp.difficulty_level.toUpperCase()}
          </span>
        )}
        <h3 className="font-bold text-lg leading-tight text-white/95 relative z-10">{bootcamp.title}</h3>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h4 className="font-semibold text-lg mb-1 text-white">{bootcamp.title}</h4>
        {bootcamp.category && (
          <span className={`text-xs font-semibold ${textClass} mb-4 block`}>{bootcamp.category}</span>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 mt-auto pt-4">
          <BookOpen className="w-4 h-4" />
          <span>{bootcamp.total_lessons || 0} lessons</span>
          {bootcamp.total_duration > 0 && (
            <>
              <span className="mx-1">·</span>
              <Clock className="w-4 h-4" />
              <span>{formatDuration(bootcamp.total_duration)}</span>
            </>
          )}
        </div>
        
        <div className="mt-auto">
          <button 
            onClick={() => onEnroll(bootcamp.id)}
            disabled={isEnrolling}
            className="w-full flex items-center justify-center gap-2 bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white border border-violet-500/20 hover:border-violet-500 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isEnrolling ? 'Enrolling...' : 'Enroll Free'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Tabs ---

function OverviewTab({
  user,
  enrolledBootcamps,
  totalLessonsCompleted,
  availableBootcamps,
  handleTabChange
}) {
  const firstName = user?.full_name?.split(' ')[0] || 'Member';

  const stats = [
    { title: 'Enrolled Courses', value: enrolledBootcamps.length, icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { title: 'Lessons Completed', value: totalLessonsCompleted, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { title: 'Current Streak', value: '3 Days', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, {firstName}!</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">You're making great progress. Keep up the momentum.</p>
        </div>
        <button 
          onClick={() => handleTabChange('catalog')}
          className="bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 hover:border-violet-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 w-fit"
        >
          <Sparkles className="w-4 h-4" />
          Browse new bootcamps
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="relative overflow-hidden group p-6 bg-[#0d1117] border border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-white/20 transition-all cursor-default">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl ${stat.bg} group-hover:opacity-100 opacity-50 transition-opacity`} />
            <div className="relative flex justify-between items-start">
              <div className="space-y-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.border} border`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-500 mt-1">{stat.title}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {enrolledBootcamps.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LearningCalendar enrolledBootcamps={enrolledBootcamps} />
          <WatchTimeChart enrolledBootcamps={enrolledBootcamps} />
        </motion.div>
      )}

      {enrolledBootcamps.length > 0 ? (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Pick up where you left off</h2>
            <button onClick={() => handleTabChange('mylearning')} className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors">
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {enrolledBootcamps.slice(0, 1).map(({ bootcamp, enrollment }) => (
              <HorizontalEnrolledCard key={bootcamp.id} bootcamp={bootcamp} enrollment={enrollment} />
            ))}
          </div>
        </motion.div>
      ) : (
        <EmptyEnrolled onBrowse={() => handleTabChange('catalog')} />
      )}
    </motion.div>
  );
}

function MyLearningTab({
  enrolledBootcamps,
  filteredEnrolled,
  search,
  setSearch,
  handleTabChange
}) {
  const inProgress = filteredEnrolled.filter(e => {
    const total = e.bootcamp?.total_lessons || 0;
    const completed = e.enrollment?.completed_lessons || 0;
    return total === 0 || completed < total;
  });

  const completed = filteredEnrolled.filter(e => {
    const total = e.bootcamp?.total_lessons || 0;
    const comps = e.enrollment?.completed_lessons || 0;
    return total > 0 && comps >= total;
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">My Learning</h1>
          <p className="text-gray-400 mt-1">{enrolledBootcamps.length} bootcamps enrolled · {completed.length} completed</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search my bootcamps..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full bg-[#0d1117] border border-white/10 rounded-md pl-9 pr-9 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {enrolledBootcamps.length === 0 ? (
        <EmptyEnrolled onBrowse={() => handleTabChange('catalog')} />
      ) : filteredEnrolled.length === 0 ? (
        <EmptySearch query={search} onClear={() => setSearch('')} />
      ) : (
        <>
          {inProgress.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight mb-4 text-white">In Progress</h2>
              <div className="flex flex-col gap-4">
                {inProgress.map(({ bootcamp, enrollment }) => (
                  <InProgressCard key={bootcamp.id} bootcamp={bootcamp} enrollment={enrollment} />
                ))}
              </div>
            </motion.div>
          )}

          {completed.length > 0 && (
            <motion.div variants={itemVariants} className="pt-6 space-y-4">
              <h2 className="text-xl font-semibold tracking-tight mb-4 text-white">Completed Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {completed.map(({ bootcamp, enrollment }) => (
                  <CompletedCard key={bootcamp.id} bootcamp={bootcamp} enrollment={enrollment} />
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}

function CatalogTab({
  availableBootcamps,
  filteredAvailable,
  search,
  setSearch,
  handleEnroll,
  enrollingId
}) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Bootcamp Catalog</h1>
          <p className="text-gray-400 mt-1">{availableBootcamps.length} available to enroll</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full bg-[#0d1117] border border-white/10 rounded-md pl-9 pr-9 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {filteredAvailable.length === 0 ? (
        <EmptySearch query={search} onClear={() => setSearch('')} />
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAvailable.map((bootcamp, i) => (
            <NewAvailableCard
              key={bootcamp.id}
              bootcamp={bootcamp}
              onEnroll={handleEnroll}
              isEnrolling={enrollingId === bootcamp.id}
              colorIdx={i}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// --- Main Component ---

export default function MemberBootcampsClient({ user, bootcamps = [], enrollmentMap = {} }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();
  const [enrollingId, setEnrollingId] = useState(null);
  const [localEnrollmentMap, setLocalEnrollmentMap] = useState(enrollmentMap);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearch('');
  };

  const { enrolledBootcamps, availableBootcamps } = useMemo(() => {
    const enrolled = [];
    const available = [];
    for (const b of bootcamps) {
      const enrollment = localEnrollmentMap[b.id];
      if (enrollment) enrolled.push({ bootcamp: b, enrollment });
      else available.push(b);
    }
    enrolled.sort(
      (a, b) =>
        new Date(b.enrollment?.last_accessed_at || b.enrollment?.enrolled_at || 0) -
        new Date(a.enrollment?.last_accessed_at || a.enrollment?.enrolled_at || 0)
    );
    return { enrolledBootcamps: enrolled, availableBootcamps: available };
  }, [bootcamps, localEnrollmentMap]);

  const filteredEnrolled = useMemo(() => {
    if (!search) return enrolledBootcamps;
    const q = search.toLowerCase();
    return enrolledBootcamps.filter((e) => e.bootcamp?.title?.toLowerCase().includes(q));
  }, [enrolledBootcamps, search]);

  const filteredAvailable = useMemo(() => {
    let list = [...availableBootcamps];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) => b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    return list;
  }, [availableBootcamps, search]);

  const totalLessonsCompleted = enrolledBootcamps.reduce(
    (sum, e) => sum + (e.enrollment?.completed_lessons || 0), 0
  );

  const handleEnroll = async (bootcampId) => {
    setEnrollingId(bootcampId);
    startTransition(async () => {
      try {
        const result = await enrollUser(bootcampId);
        if (result.success) {
          setLocalEnrollmentMap((prev) => ({
            ...prev,
            [bootcampId]: { ...result.enrollment, progress_percent: 0, completed_lessons: 0 },
          }));
        }
      } catch {
        // silently ignore
      } finally {
        setEnrollingId(null);
      }
    });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            user={user}
            enrolledBootcamps={enrolledBootcamps}
            totalLessonsCompleted={totalLessonsCompleted}
            availableBootcamps={availableBootcamps}
            handleTabChange={handleTabChange}
          />
        );
      case 'mylearning':
        return (
          <MyLearningTab
            enrolledBootcamps={enrolledBootcamps}
            filteredEnrolled={filteredEnrolled}
            search={search}
            setSearch={setSearch}
            handleTabChange={handleTabChange}
          />
        );
      case 'catalog':
        return (
          <CatalogTab
            availableBootcamps={availableBootcamps}
            filteredAvailable={filteredAvailable}
            search={search}
            setSearch={setSearch}
            handleEnroll={handleEnroll}
            enrollingId={enrollingId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full min-h-screen text-gray-300 selection:bg-violet-500/30 bg-[#080b11]">
      {/* ── Secondary left nav ───────────────────────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 border-r border-white/10 bg-[#0d1117] xl:flex xl:flex-col">
        <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'group/nav relative flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                    active
                      ? 'bg-violet-500/12 font-semibold text-violet-400 shadow-violet-500/10'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                  )}
                >
                  {active && (
                    <div className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-purple-600" />
                  )}
                  <Icon className="h-[17px] w-[17px] shrink-0" />
                  <span className="flex-1 text-left">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet horizontal tab bar */}
        <div className="sticky top-14 z-20 border-b border-white/10 bg-[#080b11]/90 backdrop-blur-xl xl:hidden">
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6">
            <nav className="scrollbar-none -mb-px flex items-center gap-4 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'flex shrink-0 items-center gap-2 border-b-2 py-3 text-[13px] font-medium transition-colors',
                      active
                        ? 'border-violet-500 text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', active ? 'text-violet-400' : '')} />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <main className="flex-1 p-4 pb-12 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-7xl"
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
