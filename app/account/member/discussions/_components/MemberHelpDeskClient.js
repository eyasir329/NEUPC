'use client';
// UI aligned with platform glass-card design language (problem-solving page tokens)

import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Plus,
  CheckCircle2,
  Pin,
  Flame,
  Star,
  ArrowLeft,
  Clock,
  Share2,
  MoreHorizontal,
  Heart,
  ChevronRight,
  Eye,
  Code2,
  FileText,
  MessageCircle,
} from 'lucide-react';

const CURRENT_USER_STATS = {
  threads: 14,
  replies: 86,
  solved: 12,
};

const OVERVIEW_STATS = {
  total: 128,
  open: 24,
  resolved: 92,
  pinned: 4,
};

const TOP_CONTRIBUTORS = [
  { id: 1, name: "Marcus Chen", score: 1420, avatar: "MC", color: "bg-amber-500" },
  { id: 2, name: "Sarah Jenkins", score: 1285, avatar: "SJ", color: "bg-indigo-500" },
  { id: 3, name: "Alex Rivera", score: 945, avatar: "AR", color: "bg-emerald-500" },
  { id: 4, name: "Jordan Smith", score: 820, avatar: "JS", color: "bg-purple-500" },
  { id: 5, name: "Priya Patel", score: 754, avatar: "PP", color: "bg-rose-500" },
];

const THREADS = [
  {
    id: 1,
    avatarText: "AZ",
    avatarColor: "bg-blue-600",
    tags: [{ text: "Help", color: "blue" }, { text: "Hot", icon: Flame, color: "orange" }],
    title: "Best practices for React Context API performance in 2024?",
    author: "Ali Zafar",
    time: "5 minutes ago",
    replies: 24,
    views: 312,
  },
  {
    id: 2,
    avatarText: "SJ",
    avatarColor: "bg-indigo-500",
    tags: [{ text: "Discussion", color: "purple" }, { text: "Pinned", icon: Pin, color: "slate" }],
    title: "RFC: Migrating our monorepo from Yarn to pnpm",
    author: "Sarah Jenkins",
    time: "2 hours ago",
    replies: 56,
    views: 1205,
  },
  {
    id: 3,
    avatarText: "MC",
    avatarColor: "bg-amber-500",
    tags: [{ text: "Show & Tell", color: "amber" }, { text: "Featured", icon: Star, color: "amber" }],
    title: "Just open-sourced my new WebGL physics engine! 🚀",
    author: "Marcus Chen",
    time: "4 hours ago",
    replies: 89,
    views: 2400,
  },
  {
    id: 4,
    avatarText: "PP",
    avatarColor: "bg-emerald-500",
    tags: [{ text: "Help", color: "blue" }, { text: "Solved", icon: CheckCircle2, color: "emerald" }],
    title: "How to properly type a generic forwardRef component?",
    author: "Priya Patel",
    time: "5 hours ago",
    replies: 12,
    views: 280,
  },
  {
    id: 5,
    avatarText: "Team",
    avatarColor: "bg-rose-600",
    tags: [{ text: "Announce", color: "rose" }, { text: "Pinned", icon: Pin, color: "slate" }],
    title: "Q3 Hackathon Winners Announced! 🏆",
    author: "Developer Relations",
    time: "1 day ago",
    replies: 124,
    views: 3500,
  },
  {
    id: 6,
    avatarText: "AR",
    avatarColor: "bg-teal-600",
    tags: [{ text: "Help", color: "blue" }],
    title: "PostgreSQL index not being hit for JSONB text search",
    author: "Alex Rivera",
    time: "1 day ago",
    replies: 8,
    views: 195,
  },
  {
    id: 7,
    avatarText: "TK",
    avatarColor: "bg-cyan-600",
    tags: [{ text: "Show & Tell", color: "amber" }],
    title: "Built a CLI that converts Figma designs to Tailwind components",
    author: "Tariq Khan",
    time: "2 days ago",
    replies: 42,
    views: 856,
  },
  {
    id: 8,
    avatarText: "DK",
    avatarColor: "bg-violet-600",
    tags: [{ text: "Discussion", color: "purple" }],
    title: "Is anyone else feeling the 'JS Framework Fatigue' again?",
    author: "David Kim",
    time: "2 days ago",
    replies: 215,
    views: 4200,
  },
  {
    id: 9,
    avatarText: "EW",
    avatarColor: "bg-fuchsia-600",
    tags: [{ text: "Help", color: "blue" }, { text: "Solved", icon: CheckCircle2, color: "emerald" }],
    title: "Docker build failing with 'out of memory' on latest Apple Silicon",
    author: "Elena Weaver",
    time: "3 days ago",
    replies: 14,
    views: 450,
  },
  {
    id: 10,
    avatarText: "JS",
    avatarColor: "bg-sky-600",
    tags: [{ text: "Feature Request", color: "teal" }],
    title: "Add dark mode support to the internal email templates",
    author: "Jordan Smith",
    time: "3 days ago",
    replies: 31,
    views: 620,
  }
];

export default function MemberHelpDeskClient({
  initialDiscussions = [],
  initialStats = {},
  bootcamps = [],
  userId,
  userEmail,
}) {
  const [threads, setThreads] = useState(THREADS);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const filteredThreads = useMemo(() => {
    if (activeTab === "All") return threads;
    if (activeTab === "Announcements") return threads.filter(t => t.tags.some(tag => tag.text === "Announce"));
    if (activeTab === "Feature Requests") return threads.filter(t => t.tags.some(tag => tag.text === "Feature Request"));
    return threads.filter(t => t.tags.some(tag => tag.text === activeTab));
  }, [activeTab, threads]);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8 xl:px-10 2xl:px-12 text-gray-300 font-sans text-sm">
      <main>
        <div>
            {isCreatingThread ? (
              <NewThread 
                onBack={() => setIsCreatingThread(false)} 
                onSubmit={(newThread) => {
                  setThreads([newThread, ...threads]);
                  setIsCreatingThread(false);
                  setSelectedThreadId(newThread.id);
                }} 
              />
            ) : selectedThreadId ? (
              <ThreadDetail 
                threadId={selectedThreadId} 
                threads={threads} 
                onBack={() => setSelectedThreadId(null)} 
                onAddComment={(tId, content) => {
                  setThreads(prev => prev.map(t => {
                    if (t.id === tId) {
                      const newComment = {
                        id: Math.floor(Math.random() * 10000) + 10000,
                        author: "New Participant",
                        avatarText: "NP",
                        avatarColor: "bg-indigo-600",
                        time: "Just now",
                        content,
                        likes: 0
                      };
                      const defaultComments = [
                        { id: 101, author: "Jordan Smith", avatarText: "JS", avatarColor: "bg-purple-500", time: "3 hours ago", content: "I usually stick to Context API until I hit a performance wall or the state logic becomes too complex to manage in a few files. Zustand has been my go-to lately because it's so lightweight and easy to set up compared to Redux.", likes: 15 },
                        { id: 102, author: "Elena Weaver", avatarText: "EW", avatarColor: "bg-fuchsia-600", time: "1 hour ago", content: "Great write-up! I definitely agree about the over-rendering issue with Context. Splitting your contexts (one for state, one for dispatch) can help mitigate it, but it's still a pain point once the app grows.", likes: 7 },
                        { id: 103, author: "Alex Rivera", avatarText: "AR", avatarColor: "bg-teal-600", time: "45 mins ago", content: "Signals look really promising. I've used them in SolidJS and bringing that mental model to React with things like Preact Signals or Jotai is a game changer for performance.", likes: 24 }
                      ];
                      const currentComments = t.comments || (t.id <= 10 ? defaultComments : []);
                      return { ...t, comments: [...currentComments, newComment], replies: (t.replies || 0) + 1 };
                    }
                    return t;
                  }));
                }}
              />
            ) : (
              <>
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                   <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                     <MessageSquare size={28} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight mb-1.5 flex items-center gap-3">
                      Help Desk
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Live
                      </span>
                    </h1>
                    <p className="text-sm text-slate-400">Join the conversation. {threads.length} active threads right now.</p>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search discussions..." 
                      className="w-full bg-[#161b22]/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-500 transition-all shadow-sm"
                    />
                  </div>
                  <button onClick={() => setIsCreatingThread(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/20 text-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0d1117]">
                     <Plus size={18} />
                     New thread
                  </button>
               </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-white/[0.06] mb-6 overflow-x-auto scrollbar-none">
              <TabItem label="All" count={threads.length} active={activeTab === "All"} onClick={() => setActiveTab("All")} />
              <TabItem label="Help" count={threads.filter(t => t.tags.some(tag => tag.text === "Help")).length} active={activeTab === "Help"} onClick={() => setActiveTab("Help")} />
              <TabItem label="Discussion" count={threads.filter(t => t.tags.some(tag => tag.text === "Discussion")).length} active={activeTab === "Discussion"} onClick={() => setActiveTab("Discussion")} />
              <TabItem label="Announcements" count={threads.filter(t => t.tags.some(tag => tag.text === "Announce")).length} active={activeTab === "Announcements"} onClick={() => setActiveTab("Announcements")} />
              <TabItem label="Release Log" active={activeTab === "Release Log"} onClick={() => setActiveTab("Release Log")} />
              <TabItem label="Feature Requests" count={threads.filter(t => t.tags.some(tag => tag.text === "Feature Request")).length} active={activeTab === "Feature Requests"} onClick={() => setActiveTab("Feature Requests")} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Thread List */}
               <div className="lg:col-span-2 flex flex-col gap-2">
                  {filteredThreads.length > 0 ? (
                    filteredThreads.map((thread) => (
                      <ThreadItem 
                         key={thread.id}
                         onClick={() => setSelectedThreadId(thread.id)}
                         avatarText={thread.avatarText}
                         avatarColor={thread.avatarColor}
                         tags={thread.tags}
                         title={thread.title}
                         author={thread.author}
                         time={thread.time}
                         replies={thread.replies}
                         views={thread.views}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-[#161b22]/50 border border-slate-800 border-dashed rounded-2xl text-center">
                       <MessageSquare size={48} className="text-slate-700 mb-4" />
                       <h3 className="text-lg font-medium text-slate-300 mb-1">No discussions found</h3>
                       <p className="text-sm text-slate-500 max-w-sm">There are currently no threads in the <span className="text-indigo-400">{activeTab}</span> category. Be the first to start a conversation!</p>
                       <button onClick={() => setIsCreatingThread(true)} className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#21262d] hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700 shadow-sm text-sm">
                          <Plus size={16} />
                          New thread
                       </button>
                    </div>
                  )}
               </div>

               {/* Right Sidebar */}
               <div className="flex flex-col gap-6">
                  {/* Your Stats */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 overflow-hidden relative group hover:border-white/[0.1] hover:bg-white/[0.04] transition-all">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-indigo-500/10 pointer-events-none"></div>
                     
                     <div className="flex items-center justify-between mb-6 relative z-10">
                       <h3 className="text-sm font-bold text-slate-200">Your Impact</h3>
                       <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2.5 py-1 rounded-md">View Profile</button>
                     </div>
                     
                     <div className="grid grid-cols-3 gap-4 relative z-10">
                        <div className="flex flex-col">
                           <span className="text-3xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">{CURRENT_USER_STATS.threads}</span>
                           <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase mt-1">Threads</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-3xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">{CURRENT_USER_STATS.replies}</span>
                           <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase mt-1">Replies</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-3xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">{CURRENT_USER_STATS.solved}</span>
                           <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase mt-1">Solved</span>
                        </div>
                     </div>
                     
                     {/* Empty state prompt */}
                     {CURRENT_USER_STATS.threads === 0 && CURRENT_USER_STATS.replies === 0 ? (
                       <div className="mt-6 pt-5 border-t border-slate-800/80 relative z-10 text-xs text-slate-400 flex items-start gap-3">
                          <div className="mt-0.5 text-slate-500 shrink-0">
                             <MessageSquare size={16} />
                          </div>
                          <p>You haven't participated yet. Jump in and help others or ask a question to get started!</p>
                       </div>
                     ) : null}
                  </div>

                  {/* Top Contributors */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
                     <h3 className="text-sm font-semibold text-gray-200 mb-4">Top contributors</h3>
                     <div className="flex flex-col gap-4 text-sm">
                        {TOP_CONTRIBUTORS.map((contributor, index) => (
                           <ContributorRow key={contributor.id} rank={index + 1} name={contributor.name} score={contributor.score} avatar={contributor.avatar} color={contributor.color} />
                        ))}
                     </div>
                  </div>

                  {/* Overview */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
                     <h3 className="text-sm font-semibold text-gray-200 mb-4">Overview</h3>
                     <div className="flex flex-col gap-3 text-sm">
                        <div className="flex justify-between items-center">
                           <span className="text-gray-500 font-medium">Total threads</span>
                           <span className="text-gray-200 font-semibold tabular-nums">{OVERVIEW_STATS.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-gray-500 font-medium">Open</span>
                           <span className="text-blue-400 font-semibold tabular-nums">{OVERVIEW_STATS.open}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-gray-500 font-medium">Resolved</span>
                           <span className="text-emerald-400 font-semibold tabular-nums">{OVERVIEW_STATS.resolved}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-gray-500 font-medium">Pinned</span>
                           <span className="text-gray-400 font-semibold tabular-nums">{OVERVIEW_STATS.pinned}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
              </>
            )}
          </div>
        </main>
    </div>
  );
}

function TabItem({ label, count, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 pb-4 px-1 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
      active 
        ? 'border-indigo-500 text-slate-100 shadow-[0_2px_0_rgba(99,102,241,1)_inset]' 
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
    }`}>
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          active 
            ? 'bg-indigo-500/20 text-indigo-400' 
            : 'bg-slate-800 text-slate-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ThreadItem({ 
  avatarText, avatarColor, tags, title, author, time, replies = 0, views = 0, onClick 
}) {
  const isSolved = tags.some(t => t.text === 'Solved');

  const getTagColor = (color) => {
    switch (color) {
       case 'blue': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
       case 'purple': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
       case 'amber': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
       case 'emerald': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
       case 'rose': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
       default: return 'bg-slate-600/20 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <div onClick={onClick} className={`group bg-[#161b22]/60 hover:bg-[#161b22] border ${isSolved ? 'border-emerald-900/30' : 'border-slate-800 hover:border-slate-700'} rounded-2xl p-5 flex flex-col sm:flex-row gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden`}>
      {isSolved && (
         <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
      )}
      
      <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-bold shrink-0 shadow-inner ${avatarColor}`}>
        <span className="text-sm tracking-wide">{avatarText}</span>
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {tags.map((tag, idx) => {
             const Icon = tag.icon;
             return (
               <span key={idx} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors ${getTagColor(tag.color)}`}>
                 {Icon && <Icon size={10} className="opacity-80" />}
                 {tag.text}
               </span>
             );
          })}
        </div>
        <h3 className="text-base font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors truncate mb-1">
          {title}
        </h3>
        <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
          <span className="text-slate-400 hover:text-slate-300 transition-colors">{author}</span>
          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
          <span>{time}</span>
        </div>
      </div>
      
      <div className="flex sm:flex-col sm:items-end justify-between items-center sm:justify-center gap-4 text-xs font-medium text-slate-500 sm:ml-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto">
         <div className="flex items-center gap-5 sm:gap-2 sm:flex-col sm:items-end">
             <div className="flex items-center gap-2">
                <span className="tabular-nums font-bold text-slate-400">{replies}</span>
                <MessageSquare size={14} className="opacity-60" />
             </div>
             <div className="flex items-center gap-2">
                <span className="tabular-nums font-bold text-slate-400">{views}</span>
                <Eye size={14} className="opacity-60" />
             </div>
         </div>
         <div className="sm:hidden flex items-center text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Reply &rarr;
         </div>
      </div>
      
      {/* Desktop hover action */}
      <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 items-center justify-center">
         <button className="bg-indigo-600 text-white rounded-full p-2 shadow-lg hover:bg-indigo-500 transition-colors">
            <ChevronRight size={16} />
         </button>
      </div>
      {/* Fade right edge when not hovering to hide the hidden button area slightly */}
      <div className="hidden sm:block absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-[#161b22] to-transparent opacity-0 group-hover:opacity-100 transition-opacity border-r border-transparent group-hover:border-slate-700 rounded-r-2xl pointer-events-none"></div>
    </div>
  );
}

function ContributorRow({ rank, name, score, avatar, color }) {
   return (
      <div className="flex items-center gap-3">
         <span className={`w-4 text-center text-xs font-bold ${rank <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>{rank}</span>
         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${color}`}>
            {avatar}
         </div>
         <span className="flex-1 text-slate-300 truncate hover:text-indigo-400 cursor-pointer transition-colors">{name}</span>
         <span className="text-slate-500 font-medium">{score}</span>
      </div>
   );
}

function ThreadDetail({ threadId, threads, onBack, onAddComment }) {
  const [replyText, setReplyText] = useState("");
  
  const threadDetail = useMemo(() => {
    const base = threads.find(t => t.id === threadId);
    if (!base) return null;
    return {
      ...base,
      content: base.content || `I've been exploring this topic recently and wanted to share some thoughts and get feedback from the community.\n\nWhen we build large scale applications, managing state and ensuring performant rendering becomes quite challenging. I've been experimenting with several approaches:\n\n1. **Context API** - Great for simple global state, but can lead to over-rendering if not careful.\n2. **Zustand / Redux** - Fantastic for structured, predictable changes.\n3. **Signals** - A relatively new pattern in the React ecosystem that offers fine-grained reactivity.\n\nHere is a small example of what I'm looking at:\n\n\`\`\`typescript\ninterface AppState {\n  user: User | null;\n  theme: 'light' | 'dark';\n  setTheme: (theme: 'light' | 'dark') => void;\n}\n\`\`\`\n\nWhat are your thoughts on balancing simplicity with scalability? Have you found any specific threshold where you always switch from Context to a dedicated state manager?`,
      comments: base.comments || (base.id <= 10 ? [
        {
           id: 101,
           author: "Jordan Smith",
           avatarText: "JS",
           avatarColor: "bg-purple-500",
           time: "3 hours ago",
           content: "I usually stick to Context API until I hit a performance wall or the state logic becomes too complex to manage in a few files. Zustand has been my go-to lately because it's so lightweight and easy to set up compared to Redux.",
           likes: 15
        },
        {
           id: 102,
           author: "Elena Weaver",
           avatarText: "EW",
           avatarColor: "bg-fuchsia-600",
           time: "1 hour ago",
           content: "Great write-up! I definitely agree about the over-rendering issue with Context. Splitting your contexts (one for state, one for dispatch) can help mitigate it, but it's still a pain point once the app grows.",
           likes: 7
        },
         {
           id: 103,
           author: "Alex Rivera",
           avatarText: "AR",
           avatarColor: "bg-teal-600",
           time: "45 mins ago",
           content: "Signals look really promising. I've used them in SolidJS and bringing that mental model to React with things like Preact Signals or Jotai is a game changer for performance.",
           likes: 24
        }
      ] : [])
    };
  }, [threadId, threads]);

  const handlePostReply = () => {
    if (!replyText.trim()) return;
    if (onAddComment) {
      onAddComment(threadId, replyText);
    }
    setReplyText("");
  };

  if (!threadDetail) return <div className="text-slate-400">Thread not found.</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors w-fit group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to discussions
      </button>

      <div className="bg-[#161b22]/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
        {/* Thread Header */}
        <div className="p-6 sm:p-8 border-b border-slate-800/80">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {threadDetail.tags.map((tag, idx) => {
               const Icon = tag.icon;
               return (
                 <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border border-slate-700 bg-slate-800/50 text-slate-300">
                   {Icon && <Icon size={12} className="opacity-80 text-current" />}
                   {tag.text}
                 </span>
               );
            })}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-6">
            {threadDetail.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-inner ${threadDetail.avatarColor}`}>
                {threadDetail.avatarText}
              </div>
              <div>
                <div className="font-semibold text-slate-200 hover:text-indigo-400 cursor-pointer transition-colors">
                  {threadDetail.author}
                </div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <Clock size={12} />
                  {threadDetail.time}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
                 <Share2 size={18} />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
                 <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Thread Content */}
        <div className="p-6 sm:p-8 bg-[#0d1117]/50 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
           {threadDetail.content}
        </div>

        {/* Thread Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-800/80 bg-[#161b22]/50 flex items-center gap-4">
           <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors font-medium text-sm group">
              <Heart size={18} className="group-hover:fill-rose-400/20" />
              <span>Like</span>
           </button>
           <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors font-medium text-sm group">
              <MessageSquare size={18} className="group-hover:fill-indigo-400/20" />
              <span>Reply</span>
           </button>
        </div>
      </div>

      {/* Responses Section */}
      <div className="mt-4">
        <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
          Responses
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">{threadDetail.comments.length}</span>
        </h3>

        <div className="flex flex-col gap-4">
          {threadDetail.comments.map(comment => (
            <div key={comment.id} className="bg-[#161b22]/40 border border-slate-800/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-inner text-sm ${comment.avatarColor}`}>
                  {comment.avatarText}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300 hover:text-indigo-400 cursor-pointer transition-colors text-sm">{comment.author}</span>
                      <span className="text-xs text-slate-500 font-medium">• {comment.time}</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors">
                      <Heart size={14} />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors">
                      <MessageSquare size={14} />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Input */}
      <div className="mt-8 bg-[#161b22]/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 bg-indigo-600">
            NP
          </div>
          <div className="flex-1">
             <textarea 
               placeholder="Write a reply..." 
               rows={3}
               value={replyText}
               onChange={(e) => setReplyText(e.target.value)}
               className="w-full bg-[#0d1117]/80 border border-slate-700/80 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-500 transition-all resize-none shadow-sm mb-3"
             ></textarea>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"><Code2 size={16} /></button>
                   <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"><FileText size={16} /></button>
                </div>
                <button 
                  disabled={!replyText.trim()}
                  onClick={handlePostReply}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/20 text-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:opacity-50 disabled:cursor-not-allowed">
                   Post Reply
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewThread({ onBack, onSubmit }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("Help");
  const [bootcampName, setBootcampName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = [{ text: tag, color: tag === "Help" ? "blue" : tag === "Show & Tell" ? "amber" : tag === "Announce" ? "rose" : tag === "Feature Request" ? "teal" : "purple" }];
    
    if (tag === "Discussion" && bootcampName) {
      tags.push({ text: `Bootcamp: ${bootcampName}`, color: "orange" });
    }

    const newThread = {
      id: Math.floor(Math.random() * 10000) + 100, // random id
      avatarText: "NP",
      avatarColor: "bg-indigo-600",
      tags,
      title: title.trim(),
      author: "New Participant", // we could use real user's name if we had auth
      time: "Just now",
      replies: 0,
      views: 0,
      content: content.trim(),
      comments: []
    };

    onSubmit(newThread);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors w-fit group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to discussions
      </button>

      <div className="bg-[#161b22]/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-2">
          Create a new thread
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Start a new discussion, ask a question, or share something with the community.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input 
              id="title"
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. How to structure a large React application?"
              className="w-full bg-[#0d1117]/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-500 transition-all shadow-sm"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <div className="flex flex-wrap gap-3 mb-4">
              {['Help', 'Discussion', 'Feature Request'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTag(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    tag === cat 
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                      : 'bg-[#0d1117]/80 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            {tag === "Discussion" && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-800/30 p-4 border border-slate-700/50 rounded-xl">
                <label htmlFor="bootcamp" className="block text-sm font-medium text-slate-300 mb-2">Related Bootcamp (Optional)</label>
                <select 
                  id="bootcamp"
                  value={bootcampName}
                  onChange={e => setBootcampName(e.target.value)}
                  className="w-full bg-[#0d1117]/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 transition-all shadow-sm"
                >
                  <option value="">None</option>
                  <option value="Spring '26 Bootcamp">Spring '26 Bootcamp</option>
                  <option value="Summer '26 Bootcamp">Summer '26 Bootcamp</option>
                  <option value="Advanced React Bootcamp">Advanced React Bootcamp</option>
                  <option value="Frontend Zero-to-Hero">Frontend Zero-to-Hero</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-300 mb-2">Content</label>
            <textarea 
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe your issue or share your thoughts here..."
              rows={8}
              className="w-full bg-[#0d1117]/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-500 transition-all shadow-sm resize-y min-h-[150px]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80 mt-2">
            <button 
              type="button" 
              onClick={onBack}
              className="px-5 py-2.5 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800 font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0d1117]"
            >
              Post Thread
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
