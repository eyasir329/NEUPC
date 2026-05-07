/**
 * @file Member achievements client — earned badges, in-progress goals,
 *   and locked tiles. Restyled with shared `_ui` primitives.
 * @module MemberAchievementsClient
 */

'use client';

import { useMemo, useState } from 'react';
import {
  Award,
  Lock,
  Medal,
  Star,
  Trophy,
  Users,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  GlassCard,
  SectionHeader,
  GradientBar,
  EmptyState,
  Pill,
  TabBar,
} from '../../_components/_ui';
import { motion } from 'framer-motion';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const RESULT_TONE = {
  gold: { Icon: Trophy, gradient: 'from-amber-400 to-orange-600', tone: 'amber', label: 'Gold' },
  silver: { Icon: Medal, gradient: 'from-slate-300 to-slate-500', tone: 'gray', label: 'Silver' },
  bronze: { Icon: Award, gradient: 'from-orange-300 to-orange-600', tone: 'orange', label: 'Bronze' },
  badge: { Icon: Star, gradient: 'from-violet-400 to-fuchsia-600', tone: 'violet', label: 'Badge' },
};

function classify(result) {
  const v = (result || '').toLowerCase();
  if (/1st|first|champion|winner|gold/.test(v)) return RESULT_TONE.gold;
  if (/2nd|second|runner|silver/.test(v)) return RESULT_TONE.silver;
  if (/3rd|third|bronze/.test(v)) return RESULT_TONE.bronze;
  return RESULT_TONE.badge;
}

const PROGRESS_TONES = ['violet', 'amber', 'cyan', 'rose', 'emerald', 'blue'];

export default function MemberAchievementsClient({
  memberAchievements = [],
  certificates = [],
}) {
  const [filter, setFilter] = useState('all');

  const earned = memberAchievements.map((item) => {
    const a = item.achievements ?? item;
    return {
      id: item.id ?? a.id,
      title: a.title,
      description: a.description || a.contest_name,
      date: a.achievement_date,
      year: a.year,
      result: a.result,
      category: a.category,
      isTeam: a.is_team,
      teamName: a.team_name,
    };
  });

  const years = useMemo(
    () => [...new Set(earned.map((a) => a.year).filter(Boolean))].sort((a, b) => b - a),
    [earned]
  );
  const categories = useMemo(
    () => [...new Set(earned.map((a) => a.category).filter(Boolean))],
    [earned]
  );
  const teamCount = earned.filter((a) => a.isTeam).length;
  const goldCount = earned.filter((a) => classify(a.result) === RESULT_TONE.gold).length;

  const filtered = useMemo(() => {
    if (filter === 'all') return earned;
    if (filter === 'gold') return earned.filter((a) => classify(a.result) === RESULT_TONE.gold);
    if (filter === 'team') return earned.filter((a) => a.isTeam);
    if (filter === 'solo') return earned.filter((a) => !a.isTeam);
    return earned.filter((a) => a.category === filter);
  }, [earned, filter]);

  const progressItems = useMemo(() => {
    const counts = categories.map((category) => ({
      category,
      count: earned.filter((a) => a.category === category).length,
    }));
    return counts.slice(0, 4).map((item, index) => {
      const target = Math.max(5, item.count + 3);
      return {
        id: item.category,
        title: `${item.category} Master`,
        subtitle: `${target - item.count} more to unlock`,
        value: item.count,
        target,
        tone: PROGRESS_TONES[index % PROGRESS_TONES.length],
      };
    });
  }, [categories, earned]);

  const lockedItems = [
    { id: 'l1', title: 'World Finals Qualifier', subtitle: 'Reach top 4 in regionals', icon: '🌍' },
    { id: 'l2', title: '500 Problems Solved', subtitle: '182 to go', icon: '🎯' },
    { id: 'l3', title: 'Mentor Badge', subtitle: 'Help 10 juniors', icon: '🎓' },
    { id: 'l4', title: 'Open-Source Contributor', subtitle: '3 PRs merged', icon: '🌱' },
    { id: 'l5', title: 'Hackathon Hat-trick', subtitle: 'Win 3 hackathons', icon: '🚀' },
    { id: 'l6', title: 'Speedster', subtitle: 'Solve in under 5 min', icon: '⚡' },
    { id: 'l7', title: 'Marathon', subtitle: '24h coding stream', icon: '🏃' },
    { id: 'l8', title: 'Polyglot', subtitle: 'Solve in 5 languages', icon: '🗣️' },
  ];

  const tabs = [
    { value: 'all', label: 'All', count: earned.length },
    { value: 'gold', label: 'Gold', icon: Trophy, count: goldCount },
    { value: 'team', label: 'Team', icon: Users, count: teamCount },
    { value: 'solo', label: 'Solo', count: earned.length - teamCount },
    ...categories.map((c) => ({
      value: c,
      label: c,
      count: earned.filter((a) => a.category === c).length,
    })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Trophy}
        title="Achievements"
        subtitle="Badges, contest wins, milestones, and team highlights"
        accent="amber"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard
          icon={Trophy}
          label="Earned"
          value={earned.length}
          sublabel="All time"
          accent="amber"
          delay={0}
        />
        <StatCard
          icon={Medal}
          label="Gold Results"
          value={goldCount}
          sublabel="Top finishes"
          accent="orange"
          delay={0.05}
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={certificates.length}
          sublabel="Issued"
          accent="violet"
          href="/account/member/certificates"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label="Team Wins"
          value={teamCount}
          sublabel="Squad efforts"
          accent="cyan"
          delay={0.15}
        />
        <StatCard
          icon={Calendar}
          label="Active Years"
          value={years.length}
          sublabel={years.length ? `${Math.min(...years)} – ${Math.max(...years)}` : '—'}
          accent="emerald"
          delay={0.2}
        />
      </div>

      {tabs.length > 2 && <TabBar tabs={tabs} value={filter} onChange={setFilter} />}

      <GlassCard padding="p-5">
        <SectionHeader
          icon={Trophy}
          title="Earned Achievements"
          subtitle={`${filtered.length} shown · sorted by recency`}
          accent="amber"
        />
        {filtered.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No achievements yet"
            description="Contest results added by admins will appear here."
            accent="amber"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {filtered.map((ach, i) => {
              const t = classify(ach.result);
              const Icon = t.Icon;
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="group relative flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} shadow-lg ring-1 ring-white/10 transition-transform group-hover:scale-105`}
                  >
                    <Icon className="h-6 w-6 text-white drop-shadow" />
                  </div>
                  <p className="line-clamp-2 text-xs font-semibold text-white">
                    {ach.title}
                  </p>
                  {ach.result && (
                    <Pill tone={t.tone === 'gray' ? 'gray' : t.tone}>
                      {ach.result}
                    </Pill>
                  )}
                  <p className="line-clamp-2 text-[10px] text-gray-500">
                    {ach.description || `${t.label} result`}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-center gap-1 pt-1">
                    <span className="text-[10px] text-gray-600">
                      {ach.date ? fmtDate(ach.date) : ach.year}
                    </span>
                    {ach.isTeam && ach.teamName && (
                      <Pill tone="cyan" icon={Users}>
                        {ach.teamName}
                      </Pill>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard padding="p-5">
        <SectionHeader
          icon={Star}
          title="In Progress"
          subtitle="Keep pushing to unlock the next badge"
          accent="violet"
        />
        {progressItems.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No progress data"
            description="Earn achievements to see progress here."
            accent="violet"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {progressItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.1]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-500">{item.subtitle}</p>
                  </div>
                  <Pill tone={item.tone}>
                    {item.value} / {item.target}
                  </Pill>
                </div>
                <GradientBar value={item.value} max={item.target} tone={item.tone} />
                <p className="mt-1.5 text-right text-[10px] text-gray-500 tabular-nums">
                  {Math.round((item.value / item.target) * 100)}% complete
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard padding="p-5">
        <SectionHeader
          icon={Lock}
          title="Locked Achievements"
          subtitle="Goals waiting to be unlocked"
          accent="gray"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
          {lockedItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.025 }}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-3.5 text-center opacity-70 transition-all hover:opacity-100"
            >
              <div className="relative">
                <div className="text-2xl grayscale">{item.icon}</div>
                <Lock className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-gray-900 p-0.5 text-gray-400" />
              </div>
              <p className="line-clamp-2 text-[11px] font-medium text-gray-300">
                {item.title}
              </p>
              <p className="text-[9px] text-gray-500">{item.subtitle}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
