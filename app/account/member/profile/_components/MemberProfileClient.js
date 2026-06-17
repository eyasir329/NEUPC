/**
 * @file Member profile client dashboard component.
 * Redesigned for FHD screens using high-fidelity glassmorphism and pre-loaded mock data.
 * Supports viewing the premium mock profile and toggling to the edit form.
 * @module MemberProfileClient
 */

'use client';

import { useState, useTransition, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Trophy,
  Pencil,
  Code2,
  Globe,
  Activity,
  Flame,
  Target,
} from 'lucide-react';
import { updateMemberProfileAction } from '@/app/_lib/actions/member-profile-actions';
import {
  GlassCard,
  SectionHeader,
  Avatar,
  PageShell,
} from '@/app/account/_components/ui';
import { MOCK_PROFILE } from '@/app/user/[username]/_components/mockData';

const HANDLE_PLATFORMS = [
  { id: 'codeforces', name: 'Codeforces', color: '#ef4444' },
  { id: 'atcoder', name: 'AtCoder', color: '#38bdf8' },
  { id: 'leetcode', name: 'LeetCode', color: '#fbbf24' },
  { id: 'codechef', name: 'CodeChef', color: '#fb923c' },
  { id: 'github', name: 'GitHub', color: '#e2e8f0' },
  { id: 'linkedin', name: 'LinkedIn', color: '#3b82f6' },
  { id: 'facebook', name: 'Facebook', color: '#60a5fa' },
];

function FormField({ label, name, defaultValue, placeholder, textarea }) {
  const cls =
    'w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-white/[0.04] focus:ring-1 focus:ring-violet-500/50 transition';
  return (
    <div>
      <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.1em] text-gray-400 uppercase">
        {label}
      </label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

function EditProfileForm({ profile, onDone }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateMemberProfileAction(formData);
      if (result?.error) setError(result.error);
      else {
        setSuccess(true);
        setTimeout(onDone, 1200);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FormField
          label="Username"
          name="username"
          defaultValue={profile?.username ?? ''}
          placeholder="your_custom_handle"
        />
        <FormField
          label="Bio"
          name="bio"
          defaultValue={profile?.bio ?? ''}
          placeholder="Tell us about yourself…"
          textarea
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {HANDLE_PLATFORMS.map((p) => (
          <div key={p.id} className="space-y-1">
            <label className="block text-[10px] text-gray-400 font-mono uppercase">{p.name} Handle</label>
            <input
              name={`${p.id}_handle`}
              defaultValue={profile?.[`${p.id}_handle`] ?? ''}
              placeholder={`${p.id}_username`}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 font-mono text-[12px] text-white outline-none focus:border-violet-500/50"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-xs font-bold text-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-xl bg-violet-650 hover:bg-violet-600 text-white text-xs font-bold flex items-center gap-1.5"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}

export default function MemberProfileClient({ user, memberProfile }) {
  const [editing, setEditing] = useState(false);
  const [showAllHandles, setShowAllHandles] = useState(false);
  const [dsaPlatform, setDsaPlatform] = useState('leetcode');
  const [heatmapPlatform, setHeatmapPlatform] = useState('combined_all');
  const [heatmapRange, setHeatmapRange] = useState('12');

  const profile = MOCK_PROFILE;

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

      let count = 0;
      if (heatmapPlatform === 'combined_all') {
        count = (profile.activity.leetcode[dateStr] || 0) +
                (profile.activity.codeforces[dateStr] || 0) +
                (profile.activity.codechef[dateStr] || 0) +
                (profile.activity.atcoder[dateStr] || 0) +
                (profile.activity.github[dateStr] || 0);
      } else {
        count = profile.activity[heatmapPlatform]?.[dateStr] || 0;
      }

      cells.push({ dateStr, count });
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

  const dsaStats = profile.codingProfiles.find(p => p.platform.toLowerCase() === dsaPlatform) || profile.codingProfiles[0];
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const solvedPercentage = Math.min(100, Math.round((dsaStats.solved / 1000) * 100));
  const strokeOffset = circumference - (solvedPercentage / 100) * circumference;

  const allHandles = profile.codingProfiles;
  const visibleHandles = showAllHandles ? allHandles : allHandles.slice(0, 4);

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30 max-w-[1600px] mx-auto">
      {/* Identity Banner Card */}
      <GlassCard className="relative overflow-hidden p-6 sm:p-8 mb-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-sky-500" />
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Avatar user={user} size="xl" src={profile.avatarUrl} name={profile.name} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Verified Member
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-1">@{profile.username} · {profile.email}</p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Pencil size={13} />
              <span>Edit Profile Details</span>
            </button>
          )}
        </div>
      </GlassCard>

      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="p-6">
              <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-5">
                <SectionHeader
                  icon={Pencil}
                  title="Modify Profile Properties"
                  subtitle="Update details, platform handles, and custom bios"
                  accent="violet"
                />
                <button
                  onClick={() => setEditing(false)}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/[0.06] text-gray-400 hover:bg-white/[0.04] transition"
                >
                  <X size={15} />
                </button>
              </div>
              <EditProfileForm profile={memberProfile} onDone={() => setEditing(false)} />
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Stats counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
                <Code2 size={18} className="text-[#B6F36B] mb-1" />
                <span className="text-xl font-bold font-mono text-white">{profile.quickStats.totalSolved}</span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Solved</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
                <Flame size={18} className="text-orange-500 mb-1" />
                <span className="text-xl font-bold font-mono text-white">{profile.quickStats.currentStreak}d</span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Current Streak</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
                <Trophy size={18} className="text-yellow-500 mb-1" />
                <span className="text-xl font-bold font-mono text-white">{profile.quickStats.longestStreak}d</span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Max Streak</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
                <Target size={18} className="text-[#7C5CFF] mb-1" />
                <span className="text-xl font-bold font-mono text-white">{profile.quickStats.totalContests}</span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Contests</span>
              </div>
            </div>

            {/* Layout Grid columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column details */}
              <div className="lg:col-span-4 space-y-6">
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-bold text-zinc-400 font-mono">Linked Handles</span>
                    <span className="text-[10px] text-[#B6F36B] font-bold font-mono">{allHandles.length} Platforms</span>
                  </div>
                  <div className="space-y-2.5">
                    {visibleHandles.map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-xl text-xs">
                        <span className="font-bold text-zinc-200">{h.platform}</span>
                        <span className="text-zinc-400 font-mono">{h.handle}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <span className="block text-xs uppercase font-bold text-zinc-400 font-mono mb-3">Core Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 text-[#c4b5fd] font-mono text-[11px] uppercase">
                        {s}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Right Column details */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* DSA Solved and Custom CV widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassCard className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs uppercase font-bold text-zinc-400 font-mono">DSA Statistics</span>
                      <select
                        value={dsaPlatform}
                        onChange={(e) => setDsaPlatform(e.target.value)}
                        className="bg-[#110f15] text-zinc-200 border border-white/[0.06] rounded-lg px-2 py-1 text-xs outline-none"
                      >
                        <option value="leetcode">LeetCode</option>
                        <option value="codeforces">Codeforces</option>
                        <option value="codechef">CodeChef</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4 py-2">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="32" className="stroke-neutral-800" strokeWidth="6" fill="transparent" />
                        <circle cx="40" cy="40" r="32" className="stroke-[#B6F36B]" strokeWidth="6" fill="transparent" strokeDasharray={2 * Math.PI * 32} strokeDashoffset={2 * Math.PI * 32 - (solvedPercentage / 100) * 2 * Math.PI * 32} strokeLinecap="round" />
                      </svg>
                      <div>
                        <div className="text-2xl font-bold font-mono text-white">{dsaStats.solved}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Solved</div>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 flex flex-col justify-between">
                    <div>
                      <span className="block text-xs uppercase font-bold text-zinc-400 font-mono mb-2">Academic CV</span>
                      <p className="text-[11px] text-neutral-450 leading-relaxed">
                        Verify and export your credentials in standardized Jake's Resume LaTeX style format.
                      </p>
                    </div>
                    <button onClick={() => alert('PDF generation ready!')} className="w-full py-2 bg-[#7C5CFF] hover:bg-[#6D28D9] text-white font-mono text-xs font-bold rounded-xl transition-all">
                      Export Resume
                    </button>
                  </GlassCard>
                </div>

                {/* Heatmap Widget */}
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-xs uppercase font-bold text-zinc-400 font-mono">Submission Activity</span>
                    <select
                      value={heatmapPlatform}
                      onChange={(e) => setHeatmapPlatform(e.target.value)}
                      className="bg-[#110f15] text-zinc-250 border border-white/[0.04] rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="combined_all">All Combined</option>
                      <option value="leetcode">LeetCode</option>
                      <option value="codeforces">Codeforces</option>
                    </select>
                  </div>
                  <div className="overflow-x-auto pb-2">
                    <div className="min-w-[500px] flex gap-[2.5px]">
                      {columns.slice(-40).map((col, colIdx) => (
                        <div key={colIdx} className="flex flex-col gap-[2.5px]">
                          {col.map((cell, idx) => (
                            <div
                              key={idx}
                              className={`w-[9px] h-[9px] rounded-xs ${getHeatmapColor(cell.count)}`}
                              title={`${cell.dateStr}: ${cell.count}`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                {/* Computational Projects */}
                <GlassCard className="p-5">
                  <span className="block text-xs uppercase font-bold text-zinc-400 font-mono mb-4">Showcase Projects</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.projects.slice(0, 2).map((p, i) => (
                      <div key={i} className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
                          <span>{p.title}</span>
                          <span className="text-yellow-500">★ {p.stars}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
