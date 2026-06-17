/**
 * @file Redesigned public profile component.
 * Targets FHD screens with a state-of-the-art glassmorphic design and rich mock data.
 * @module PublicProfileClient
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ExternalLink,
  Github,
  Linkedin,
  Facebook,
  Twitter,
  GraduationCap,
  Trophy,
  Code2,
  Flame,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Globe,
  Hash,
  BookOpen,
  Activity,
  User,
  Calendar,
  Briefcase,
  Award,
  MapPin,
  Phone,
  Mail,
  FileText,
  Download,
  Settings,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  FileCode,
  PenTool,
} from 'lucide-react';
import { MOCK_PROFILE } from './mockData';

// Custom UI Components
function SectionTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={16} className="text-[#B6F36B]" />}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">
        {label}
      </h3>
    </div>
  );
}

function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-[#0c0e16]/80 backdrop-blur-xl shadow-lg relative ${className}`}
    >
      {children}
    </div>
  );
}

export default function PublicProfileClient() {
  const profile = MOCK_PROFILE;

  // Handles state
  const [showAllHandles, setShowAllHandles] = useState(false);
  const [dsaPlatform, setDsaPlatform] = useState('leetcode');
  const [heatmapPlatform, setHeatmapPlatform] = useState('combined_all');
  const [heatmapRange, setHeatmapRange] = useState('12');

  // Heatmap helper calculations
  const gridCells = useMemo(() => {
    const cells = [];
    const today = new Date();
    const days = heatmapRange === '12' ? 364 : heatmapRange === '6' ? 182 : 30;
    const weeksNeeded = Math.ceil(days / 7);
    const totalCells = weeksNeeded * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalCells - 1));

    for (let i = 0; i < totalCells; i++) {
      const curr = new Date(startDate);
      curr.setDate(startDate.getDate() + i);
      const dateStr = curr.toISOString().split('T')[0];

      // Aggregate values based on selected platform
      let count = 0;
      if (heatmapPlatform === 'combined_all') {
        count = (profile.activity.leetcode[dateStr] || 0) +
                (profile.activity.codeforces[dateStr] || 0) +
                (profile.activity.codechef[dateStr] || 0) +
                (profile.activity.atcoder[dateStr] || 0) +
                (profile.activity.github[dateStr] || 0) +
                (profile.activity.todolist?.[dateStr] || 0) +
                (profile.activity.courseWatchTime?.[dateStr] || 0);
      } else if (heatmapPlatform === 'combined') {
        count = (profile.activity.leetcode[dateStr] || 0) +
                (profile.activity.codeforces[dateStr] || 0) +
                (profile.activity.codechef[dateStr] || 0) +
                (profile.activity.atcoder[dateStr] || 0);
      } else if (heatmapPlatform === 'github') {
        count = profile.activity.github[dateStr] || 0;
      } else {
        count = profile.activity[heatmapPlatform]?.[dateStr] || 0;
      }

      cells.push({
        dateStr,
        count,
        dayOfWeek: curr.getDay(),
        month: curr.toLocaleString('default', { month: 'short' }),
      });
    }
    return cells;
  }, [heatmapPlatform, heatmapRange]);

  const columns = useMemo(() => {
    const cols = [];
    for (let i = 0; i < gridCells.length; i += 7) {
      cols.push(gridCells.slice(i, i + 7));
    }
    return cols;
  }, [gridCells]);

  const totalHeatmapSubmissions = useMemo(() => {
    return gridCells.reduce((sum, c) => sum + c.count, 0);
  }, [gridCells]);

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.01]';
    if (count === 1) return 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-900/30';
    if (count === 2) return 'bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-700/30';
    if (count <= 4) return 'bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/30';
    return 'bg-emerald-400 border border-emerald-300/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]';
  };

  // Donut chart stroke calculations
  const dsaStats = profile.codingProfiles.find(p => p.platform.toLowerCase() === dsaPlatform) || profile.codingProfiles[0];
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const solvedPercentage = Math.min(100, Math.round((dsaStats.solved / 1000) * 100));
  const strokeOffset = circumference - (solvedPercentage / 100) * circumference;

  // Connected handles count
  const allHandles = profile.codingProfiles;
  const visibleHandles = showAllHandles ? allHandles : allHandles.slice(0, 4);

  return (
    <div className="min-h-screen pb-16 bg-[#030408] text-white selection:bg-[#7C5CFF]/30">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-6">

        {/* ── 1. COMPREHENSIVE MAIN IDENTITY HEADER ── */}
        <GlassCard className="relative overflow-hidden p-6 sm:p-8 lg:p-12">
          {/* Accent top lines */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B6F36B] via-[#7C5CFF] to-[#B6F36B] opacity-80" />

          {/* Ambient organic lights */}
          <div className="absolute -right-40 -top-40 h-[400px] w-[400px] rounded-full bg-[#7C5CFF]/10 blur-[130px] pointer-events-none" />
          <div className="absolute left-1/3 top-1/4 h-[350px] w-[350px] rounded-full bg-[#B6F36B]/5 blur-[120px] pointer-events-none" />

          <div className="relative flex flex-col xl:flex-row xl:items-start justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 w-full xl:w-auto">
              {/* Avatar Layout */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#B6F36B] to-[#7C5CFF] opacity-30 group-hover:opacity-60 blur-md transition duration-500" />
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-[#0c0a12] shadow-2xl transition duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-2 right-2 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-[3px] border-[#0c0a12]" />
                </span>
              </div>

              {/* Name & Academic Credentials */}
              <div className="flex flex-col space-y-4 flex-1 min-w-0 w-full text-center sm:text-left">
                <div>
                  <div className="flex flex-col sm:flex-row items-center sm:justify-start gap-3 w-full">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-1">
                      {profile.name}
                    </h1>
                    <span className="bg-[#B6F36B]/10 border border-[#B6F36B]/20 text-[#B6F36B] px-3 py-1 rounded-full text-[10px] font-extrabold font-mono tracking-widest inline-flex items-center gap-2 shadow-sm uppercase shrink-0">
                      <span className="h-2 w-2 rounded-full bg-[#B6F36B] animate-pulse" />
                      NEUPC MEMBER
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-sm text-neutral-400 w-full">
                    <span className="hover:text-[#B6F36B] transition flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                      <Mail size={14} className="text-[#7C5CFF]" />
                      {profile.email}
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                      <Phone size={14} className="text-[#7C5CFF]" />
                      <span>{profile.phone}</span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                      <MapPin size={14} className="text-[#B6F36B]" />
                      <span>{profile.location}</span>
                    </span>
                  </div>
                </div>

                {/* Academic Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="bg-white/[0.02] border border-white/[0.04] p-4 sm:p-5 hover:bg-white/[0.03] transition-colors rounded-2xl flex flex-col justify-center">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono font-bold text-neutral-400 mb-3 uppercase tracking-wider">
                      <GraduationCap size={14} className="text-[#7C5CFF]" />
                      Academic Profile
                    </div>
                    <div className="text-sm text-neutral-200 font-medium leading-relaxed">
                      {profile.degree} in {profile.department} <br />
                      <span className="text-neutral-400 mt-1 block">
                        {profile.university}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                      <span className="bg-white/[0.04] border border-white/[0.05] text-neutral-300 px-2.5 py-1 rounded-md font-mono text-xs font-semibold">
                        ID: {profile.studentId}
                      </span>
                      <span className="bg-[#B6F36B]/10 shadow-inner border border-[#B6F36B]/20 text-[#B6F36B] px-2.5 py-1 rounded-md font-mono text-xs font-bold">
                        CGPA: {profile.cgpa}
                      </span>
                      <span className="bg-white/[0.04] border border-white/[0.05] text-neutral-400 px-2.5 py-1 rounded-md font-mono text-xs">
                        Semester: {profile.semester} · Session: {profile.session}
                      </span>
                    </div>
                  </div>

                  {/* Connect and Download Actions */}
                  <div className="bg-white/[0.02] border border-white/[0.04] p-4 sm:p-5 flex flex-col justify-between rounded-2xl">
                    <div className="text-xs font-mono font-bold text-neutral-400 mb-3 uppercase tracking-wider flex items-center justify-center sm:justify-between">
                      <span>Connect Links</span>
                      <span className="hidden sm:inline-block text-[10px] bg-white/[0.04] border border-white/[0.05] text-neutral-400 px-2 py-0.5 rounded font-bold">
                        RESUME GENERATOR
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                      <a
                        href={profile.socials.github}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-neutral-350 hover:text-white transition-all border border-white/[0.02] hover:border-white/[0.1] text-xs font-mono"
                      >
                        <Github size={13} className="text-[#B6F36B]" />
                        <span>GitHub</span>
                      </a>
                      <a
                        href={profile.socials.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-neutral-350 hover:text-white transition-all border border-white/[0.02] hover:border-white/[0.1] text-xs font-mono"
                      >
                        <Linkedin size={13} className="text-[#B6F36B]" />
                        <span>LinkedIn</span>
                      </a>
                      <a
                        href={`https://facebook.com/${profile.socials.facebook}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-neutral-350 hover:text-white transition-all border border-white/[0.02] hover:border-white/[0.1] text-xs font-mono"
                      >
                        <Facebook size={13} className="text-[#B6F36B]" />
                        <span>Facebook</span>
                      </a>
                    </div>

                    {/* PDF CV Export Trigger Button */}
                    <button
                      onClick={() => alert('Feature pre-compiled: Opening PDF builder...')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7C5CFF] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white rounded-xl text-xs font-bold font-mono transition-all shadow-lg active:scale-98 cursor-pointer"
                    >
                      <FileText size={14} />
                      <span>Download Academic CV (PDF)</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── 2. QUICK STATS STRIP ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
            <Code2 size={20} className="text-[#B6F36B] mb-1.5" />
            <span className="text-2xl font-bold font-mono text-white">{profile.quickStats.totalSolved}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550">Solved Problems</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
            <Flame size={20} className="text-orange-500 mb-1.5" />
            <span className="text-2xl font-bold font-mono text-white">{profile.quickStats.currentStreak} Days</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550">Current Streak</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
            <Trophy size={20} className="text-yellow-500 mb-1.5" />
            <span className="text-2xl font-bold font-mono text-white">{profile.quickStats.longestStreak} Days</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550">Longest Streak</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
            <Target size={20} className="text-[#7C5CFF] mb-1.5" />
            <span className="text-2xl font-bold font-mono text-white">{profile.quickStats.totalContests}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550">Contests Rated</span>
          </div>
        </div>

        {/* ── 3. MAIN SECTION GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column (Details) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Competitive Handles */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle icon={Globe} label="Coding Handles" />
                <span className="text-[10px] font-mono font-bold text-[#B6F36B] bg-[#B6F36B]/10 px-2 py-0.5 rounded border border-[#B6F36B]/20">
                  {allHandles.length} Platforms
                </span>
              </div>
              <div className="space-y-3">
                {visibleHandles.map((h, i) => (
                  <a
                    key={i}
                    href={h.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-[#B6F36B]/30 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: h.color + '22', border: `1px solid ${h.color}44` }}
                      >
                        {h.platform.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400 font-semibold">{h.platform}</div>
                        <div className="text-sm font-bold text-neutral-200 group-hover:text-white truncate max-w-[130px]">
                          {h.handle}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold" style={{ color: h.color }}>{h.rating}</div>
                      <div className="text-[10px] text-zinc-550">{h.solved} solved</div>
                    </div>
                  </a>
                ))}
              </div>
              {allHandles.length > 4 && (
                <button
                  onClick={() => setShowAllHandles(prev => !prev)}
                  className="w-full mt-3 py-2 rounded-xl border border-white/[0.04] hover:border-[#B6F36B]/20 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-[#B6F36B] transition-all flex items-center justify-center gap-1 cursor-pointer font-mono"
                >
                  {showAllHandles ? 'Show Less' : 'Show All Platforms'}
                </button>
              )}
            </GlassCard>

            {/* Skills & Fields */}
            <GlassCard className="p-5">
              <SectionTitle icon={Code2} label="Key Technologies" />
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-mono rounded-lg bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 text-[#c4b5fd] uppercase hover:bg-[#7C5CFF]/25 hover:border-[#7C5CFF]/45 transition-all duration-150 cursor-default"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </GlassCard>

            {/* Fields of Interest */}
            <GlassCard className="p-5">
              <SectionTitle icon={BookOpen} label="Core Interests" />
              <div className="flex flex-wrap gap-2">
                {profile.areasOfInterest.map((interest, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#B6F36B]/5 border border-[#B6F36B]/15 text-[#B6F36B]/80 hover:bg-[#B6F36B]/10 hover:border-[#B6F36B]/30 transition-all duration-150"
                  >
                    {interest.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </GlassCard>

            {/* Academic Education */}
            <GlassCard className="p-5">
              <SectionTitle icon={GraduationCap} label="Academic Timeline" />
              <div className="space-y-4">
                {profile.education.map((edu, i) => (
                  <div key={i} className="relative pl-4 border-l border-white/[0.06] last:pb-0 pb-4 space-y-1">
                    <div className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#7C5CFF] border border-[#030408]" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-200">{edu.institution}</span>
                      <span className="text-zinc-550 font-mono">{edu.period}</span>
                    </div>
                    <div className="text-xs text-[#B6F36B] font-medium">{edu.degree}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{edu.result}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* References */}
            <GlassCard className="p-5">
              <SectionTitle icon={User} label="References" />
              <div className="space-y-4">
                {profile.references.map((ref, i) => (
                  <div key={i} className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl space-y-1.5 text-xs">
                    <div className="font-bold text-neutral-200">{ref.name}</div>
                    <div className="text-[10.5px] text-zinc-500 font-medium leading-snug">
                      {ref.designation} <br />
                      <span className="text-zinc-400">{ref.institution}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#7C5CFF] hover:underline cursor-pointer">
                      {ref.email}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>

          {/* Right Column (Analytics & Projects) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Career Objective / About */}
            <GlassCard className="p-6">
              <SectionTitle icon={User} label="About & Objectives" />
              <p className="text-sm text-zinc-300 leading-relaxed font-sans">{profile.careerObjective}</p>
            </GlassCard>

            {/* Donut Progress Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <SectionTitle icon={Code2} label="Problem Solving Metrics" />
                    <select
                      value={dsaPlatform}
                      onChange={(e) => setDsaPlatform(e.target.value)}
                      className="bg-[#110f15] hover:bg-[#1a1820] text-zinc-200 border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer font-mono font-bold tracking-wide"
                    >
                      <option value="leetcode">LeetCode</option>
                      <option value="codeforces">Codeforces</option>
                      <option value="codechef">CodeChef</option>
                      <option value="atcoder">AtCoder</option>
                    </select>
                  </div>

                  <div className="flex justify-center items-center my-4 relative h-36">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        className="stroke-neutral-800"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        className="stroke-[#B6F36B] transition-all duration-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col justify-center items-center text-center">
                      <span className="text-3xl font-extrabold font-mono text-neutral-100 tracking-tight">
                        {dsaStats.solved}
                      </span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-mono">Solved</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-4 text-center font-mono text-[10.5px]">
                  <div>
                    <span className="block text-zinc-500 uppercase text-[9px] mb-0.5">Easy</span>
                    <span className="text-emerald-400 font-bold">40% solved</span>
                  </div>
                  <div className="border-x border-white/[0.04]">
                    <span className="block text-zinc-500 uppercase text-[9px] mb-0.5">Medium</span>
                    <span className="text-amber-400 font-bold">50% solved</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 uppercase text-[9px] mb-0.5">Hard</span>
                    <span className="text-rose-500 font-bold">10% solved</span>
                  </div>
                </div>
              </GlassCard>

              {/* CV customization metadata options widget */}
              <GlassCard className="p-5 flex flex-col justify-between">
                <div>
                  <SectionTitle icon={FileText} label="Academic CV Customizer" />
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Modify properties of your export document. Pre-select what fields to contain in the academic resume build.
                  </p>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 text-neutral-350 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-white/[0.08] bg-white/[0.02]" />
                      <span>Include Publications</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-350 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-white/[0.08] bg-white/[0.02]" />
                      <span>Include References</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-350 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-white/[0.08] bg-white/[0.02]" />
                      <span>Include Work Experience</span>
                    </label>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between text-[10.5px] text-zinc-500">
                  <span>File type: PDF document</span>
                  <span className="text-[#B6F36B] font-bold font-mono">Jake's Resume Format</span>
                </div>
              </GlassCard>
            </div>

            {/* Submission Heatmap */}
            <GlassCard className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <SectionTitle icon={Activity} label="Activity Heatmap" />
                  <select
                    value={heatmapRange}
                    onChange={(e) => setHeatmapRange(e.target.value)}
                    className="bg-[#110f15] text-zinc-400 border border-white/[0.04] rounded-lg px-2 py-1 text-[10px] cursor-pointer font-mono font-bold"
                  >
                    <option value="12">12 Months</option>
                    <option value="6">6 Months</option>
                    <option value="1">30 Days</option>
                  </select>
                </div>

                <select
                  value={heatmapPlatform}
                  onChange={(e) => setHeatmapPlatform(e.target.value)}
                  className="bg-[#110f15] hover:bg-white/[0.03] text-zinc-200 border border-white/[0.04] rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer font-mono font-bold tracking-wide"
                >
                  <option value="combined_all">All Activity Combined</option>
                  <option value="combined">Coding Platforms Solve</option>
                  <option value="github">GitHub Contributions</option>
                  <option value="leetcode">LeetCode Activity</option>
                  <option value="codeforces">Codeforces Activity</option>
                </select>
              </div>

              {/* Heatmap Grid render */}
              <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                <div className="min-w-[640px] flex flex-col pt-2 pr-1">
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-[3px]">
                      {columns.map((col, colIdx) => (
                        <div key={colIdx} className="flex flex-col gap-[3px]">
                          {col.map((cell) => (
                            <div
                              key={cell.dateStr}
                              className={`w-[10px] h-[10px] rounded-sm transition-colors cursor-pointer ${getHeatmapColor(cell.count)}`}
                              title={`${cell.dateStr}: ${cell.count} submissions`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/[0.03] text-[10.5px] font-mono text-zinc-550">
                <div className="flex items-center gap-4">
                  <span>Total actions logged: <strong className="text-[#B6F36B]">{totalHeatmapSubmissions}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Less</span>
                  <div className="w-[10px] h-[10px] rounded-sm bg-white/[0.02]" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-emerald-950/70" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-emerald-850/80" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-emerald-600/90" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-emerald-400" />
                  <span>More</span>
                </div>
              </div>
            </GlassCard>

            {/* Projects */}
            <GlassCard className="p-6">
              <SectionTitle icon={Award} label="Computational Projects" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.projects.map((p, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white/[0.01] border border-white/[0.03] hover:border-[#B6F36B]/20 rounded-xl space-y-3 flex flex-col justify-between hover:bg-white/[0.02] transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-zinc-200">{p.title}</span>
                        <span className="text-[10px] font-mono font-bold text-yellow-500">★ {p.stars} stars</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{p.desc}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.02] text-[10px] font-mono">
                      <div className="flex gap-1">
                        {p.tags.map((t, idx) => (
                          <span key={idx} className="bg-white/[0.03] px-2 py-0.5 rounded text-zinc-500">{t}</span>
                        ))}
                      </div>
                      <a href={p.url} className="text-[#7C5CFF] hover:underline flex items-center gap-0.5">
                        <span>Source</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Contest list */}
            <GlassCard className="p-6">
              <SectionTitle icon={Trophy} label="Recent Rated Contests" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-zinc-500">
                      <th className="py-2 px-1 text-[9px] uppercase tracking-wider font-bold">Platform</th>
                      <th className="py-2 px-1 text-[9px] uppercase tracking-wider font-bold">Contest Title</th>
                      <th className="py-2 px-1 text-right text-[9px] uppercase tracking-wider font-bold">Rank</th>
                      <th className="py-2 px-1 text-right text-[9px] uppercase tracking-wider font-bold">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.contests.map((c, i) => (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                        <td className="py-2.5 px-1 font-bold text-zinc-350">{c.host}</td>
                        <td className="py-2.5 px-1 text-zinc-200">{c.name}</td>
                        <td className="py-2.5 px-1 text-right text-zinc-350">{c.rank}</td>
                        <td className="py-2.5 px-1 text-right text-emerald-400 font-bold">{c.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Offline Competitions & Participation */}
            <GlassCard className="p-6">
              <SectionTitle icon={Award} label="Offline Competitive Records" />
              <div className="space-y-4">
                {profile.offlineParticipation.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-200">{item.event}</span>
                        <span className="bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#c4b5fd] px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold">
                          {item.type}
                        </span>
                      </div>
                      <div className="text-zinc-500 text-[10.5px] leading-relaxed">
                        Role: {item.role} · Venue: {item.venue}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[#B6F36B] font-bold font-mono">{item.rank}</span>
                      <div className="text-[10px] text-zinc-550 font-mono mt-0.5">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Work Experience */}
            <GlassCard className="p-6">
              <SectionTitle icon={Briefcase} label="Professional History" />
              <div className="space-y-6">
                {profile.workExperience.map((exp, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div>
                        <span className="font-bold text-sm text-zinc-200">{exp.role}</span>
                        <span className="text-zinc-550 mx-1.5">@</span>
                        <span className="text-[#7C5CFF] font-semibold">{exp.company}</span>
                      </div>
                      <span className="text-zinc-500 font-mono">{exp.period}</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">{exp.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {exp.skills.map((s, idx) => (
                        <span key={idx} className="bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Research & Publications */}
            <GlassCard className="p-6">
              <SectionTitle icon={PenTool} label="Research Publications" />
              <div className="space-y-4">
                {profile.publications.map((pub, i) => (
                  <div key={i} className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-zinc-200">{pub.title}</span>
                      <span className="bg-emerald-500/10 border border-emerald-550/20 text-emerald-450 px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold">
                        {pub.status}
                      </span>
                    </div>
                    <div className="text-zinc-400 font-medium leading-relaxed font-mono">
                      Journal: {pub.journal} · Date: {pub.date}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>

        </div>

      </div>
    </div>
  );
}
