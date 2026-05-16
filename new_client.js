'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  BookOpen, 
  Video, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  MonitorPlay
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function Badge({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#27272a]/50 border border-[#27272a]/50 text-gray-400 px-3 py-1 rounded-full text-xs font-medium">
      <Icon className="w-3.5 h-3.5" />
      {text}
    </div>
  );
}

export default function BootcampLearningClient({
  bootcamp,
  lessonProgress = {},
}) {
  const [openModule, setOpenModule] = useState(null);

  const allLessons = useMemo(() => {
    const lessons = [];
    bootcamp?.courses?.forEach((c) => {
      if (c.is_published === false) return;
      c.modules?.forEach((m) => {
        if (m.is_published === false) return;
        m.lessons?.forEach((l) => {
          if (l.is_published === false) return;
          lessons.push(l);
        });
      });
    });
    return lessons;
  }, [bootcamp?.courses]);

  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter(
    (l) => lessonProgress?.[l.id]?.is_completed
  ).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  
  const resumeLesson = useMemo(() => allLessons.find((l) => !lessonProgress?.[l.id]?.is_completed) || allLessons[0], [allLessons, lessonProgress]);

  const coursesCount = bootcamp?.courses?.length || 0;
  const modulesCount = bootcamp?.courses?.reduce((s, c) => s + (c.modules?.length || 0), 0) || 0;

  // Flatten modules for the UI since the new UI design just lists modules flatly (or we can group them, let's keep them somewhat flat or organized by course)
  const uiModules = useMemo(() => {
    let mods = [];
    bootcamp?.courses?.forEach((c, courseIdx) => {
      if (c.is_published === false) return;
      c.modules?.forEach((m, modIdx) => {
        if (m.is_published === false) return;
        
        const mLessons = m.lessons?.filter(l => l.is_published !== false) || [];
        const mCompletedCount = mLessons.filter(l => lessonProgress?.[l.id]?.is_completed).length;
        const mTotal = mLessons.length;
        const mPercent = mTotal > 0 ? Math.round((mCompletedCount / mTotal) * 100) : 0;
        
        mods.push({
          id: m.id,
          title: m.title,
          courseTitle: c.title,
          completed: mCompletedCount,
          total: mTotal,
          percent: mPercent,
          items: mLessons.map(l => ({
            id: l.id,
            type: (l.video_source && l.video_source !== 'none') ? 'video' : 'reading',
            title: l.title,
            locked: l.is_locked,
            completed: !!lessonProgress?.[l.id]?.is_completed
          }))
        });
      });
    });
    return mods;
  }, [bootcamp?.courses, lessonProgress]);

  // Set default open module to the first one on mount if none selected
  React.useEffect(() => {
    if (uiModules.length > 0 && openModule === null) {
      setOpenModule(uiModules[0].id);
    }
  }, [uiModules]);

  // Determine active track for "Module Finish Track Mini"
  const activeTrackModule = uiModules.find(m => m.id === openModule) || uiModules[0];

  const chartData = [
    { name: 'L1', duration: 0 },
    { name: 'L2', duration: 1.5 },
    { name: 'L3', duration: 2.2 },
    { name: 'L4', duration: 0.8 },
    { name: 'L5', duration: 3.0 },
    { name: 'L6', duration: 1.1 },
    { name: 'L7', duration: 2.5 },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans antialiased">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto"
      >
        {/* Hero Section */}
        <div className="relative rounded-[1rem] overflow-hidden bg-[#18181b] border border-[#27272a]">
          {/* Abstract Background for Hero */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950/50">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          </div>
          
          <div className="relative pt-12 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-end">
            <div className="flex-1 space-y-4">
              <span className="inline-block text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-sm border border-emerald-400/20">
                {bootcamp?.difficulty_level || 'Bootcamp'}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                {bootcamp?.title}
              </h1>
              <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
                {bootcamp?.description}
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge icon={BookOpen} text={`${coursesCount} courses`} />
                <Badge icon={FileText} text={`${modulesCount} modules`} />
                <Badge icon={Video} text={`${totalLessons} lessons`} />
              </div>
            </div>
            
            <div className="w-full md:w-48 bg-[#09090b] border border-[#27272a] rounded-xl p-4 flex flex-col items-center justify-center shrink-0 shadow-lg relative z-10">
              <div className="relative flex items-center justify-center w-20 h-20 mb-2">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-[#27272a]" />
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" 
                    strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 - (progressPercent / 100) * 2 * Math.PI * 36}`} 
                    className="text-[#8b5cf6] transition-all duration-1000" />
                </svg>
                <span className="absolute text-xl font-bold">{progressPercent}%</span>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold">{progressPercent}%</div>
                <div className="text-xs text-gray-400">{completedCount}/{totalLessons} done</div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="border-t border-[#27272a] bg-[#09090b]/50 p-4 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              {completedCount > 0 ? "Resume your learning journey:" : "Begin your learning journey:"}<br/>
              <span className="text-[#fafafa] font-medium">{resumeLesson?.title}</span>
            </div>
            {resumeLesson && (
              <Link href={`/account/member/bootcamps/${bootcamp.id}/${resumeLesson.id}`} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                <Play className="fill-current w-4 h-4" />
                {completedCount > 0 ? "Resume Learning" : "Start Learning"}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* Module Finish Track Mini */}
            {activeTrackModule && (
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2 text-[#fafafa]">
                  <MonitorPlay className="w-5 h-5 text-[#8b5cf6]" />
                  Module Finish Track
                </h3>
                <select 
                  className="bg-[#27272a] border border-[#27272a] rounded-md px-3 py-1.5 text-xs text-[#fafafa] focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
                  value={openModule || ''}
                  onChange={(e) => setOpenModule(e.target.value)}
                >
                  {uiModules.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="text-sm mb-4">
                <span className="text-[#8b5cf6] font-medium">{activeTrackModule.completed}</span> <span className="text-gray-400">of {activeTrackModule.total} lessons completed · {activeTrackModule.title}</span>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {activeTrackModule.items.map((item, i) => (
                  <div key={item.id} className={`w-10 h-10 flex items-center justify-center rounded border font-medium text-sm transition-colors ${item.completed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#27272a]/50 border-[#27272a] text-gray-400'}`}>
                    {item.completed ? <CheckCircle2 className="w-5 h-5" /> : (i + 1)}
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Curriculum */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[#fafafa]">Course Curriculum</h3>
                <span className="text-sm text-gray-400">{completedCount}/{totalLessons} lessons completed</span>
              </div>

              <div className="space-y-3">
                {uiModules.map((mod, idx) => (
                  <div key={mod.id} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden transition-all">
                    <div 
                      className="flex items-center p-4 cursor-pointer hover:bg-[#27272a]/30 transition-colors"
                      onClick={() => setOpenModule(openModule === mod.id ? null : mod.id)}
                    >
                      <div className="w-10 h-10 shrink-0 bg-[#27272a] rounded-lg flex items-center justify-center mr-4">
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-[#fafafa]">{mod.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {mod.completed}/{mod.total} completed · {mod.percent}%
                        </p>
                      </div>
                      <div className="ml-4 text-gray-400">
                        {openModule === mod.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {openModule === mod.id && mod.items.length > 0 && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 bg-[#09090b]/30 border-t border-[#27272a]/50">
                            {mod.items.map((item, i) => (
                              <Link key={item.id} href={`/account/member/bootcamps/${bootcamp.id}/${item.id}`} className="flex items-center p-3 rounded-lg hover:bg-[#18181b] border border-transparent hover:border-[#27272a] transition-colors group cursor-pointer mt-2">
                                <div className="mr-3 text-gray-400">
                                  {item.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border border-gray-400/30 flex items-center justify-center text-[10px]">
                                      {i + 1}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium group-hover:text-[#8b5cf6] text-[#fafafa] transition-colors flex items-center gap-2">
                                    {item.title}
                                    {item.locked && <Lock className="w-3 h-3 text-gray-400" />}
                                  </h5>
                                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    {item.type === 'video' ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                    <span className="capitalize">{item.type}</span>
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="w-4 h-4 text-[#8b5cf6]" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            {/* Chart Wrapper to avoid hydration/width issues */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 sticky top-24">
              <h3 className="font-semibold flex items-center gap-2 mb-6 text-[#fafafa]">
                <Video className="w-5 h-5 text-[#8b5cf6]" />
                Video Duration
                <span className="ml-auto text-xs font-normal text-gray-400 bg-[#27272a] px-2 py-1 rounded">Total: 10m / 0m</span>
              </h3>
              
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 12 }} 
                      tickFormatter={(value) => `${value}m`}
                    />
                    <ReTooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#fafafa' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="duration" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorDuration)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
