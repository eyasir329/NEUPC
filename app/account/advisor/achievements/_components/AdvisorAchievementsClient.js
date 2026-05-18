/**
 * @file Advisor achievements client — comprehensive view with search,
 *   year/category/type filters, grid of cards, and a detail modal.
 *
 * @module AdvisorAchievementsClient
 */

'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  Trophy,
  Users,
  Search,
  X,
  Award,
} from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  TabBar,
  Pill,
  Avatar,
  EmptyState,
  StaggerList,
} from '../../../_components/ui/dashboard';

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'team', label: 'Team' },
  { value: 'individual', label: 'Individual' },
];

export default function AdvisorAchievementsClient({
  achievements = [],
  stats = {},
}) {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('all');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState(null);

  const years = stats.years ?? [];
  const categories = useMemo(
    () => [...new Set(achievements.map((a) => a.category).filter(Boolean))],
    [achievements]
  );

  const filtered = useMemo(() => {
    return achievements.filter((a) => {
      const matchSearch =
        !query ||
        a.title?.toLowerCase().includes(query.toLowerCase()) ||
        a.description?.toLowerCase().includes(query.toLowerCase());
      const matchYear = year === 'all' || String(a.year) === year;
      const matchCat = category === 'all' || a.category === category;
      const matchType =
        type === 'all' ||
        (type === 'team' && a.is_team) ||
        (type === 'individual' && !a.is_team);
      return matchSearch && matchYear && matchCat && matchType;
    });
  }, [achievements, query, year, category, type]);

  return (
    <PageShell>
      <PageHeader
        icon={Trophy}
        title="Achievements"
        subtitle="Club achievements and recognitions"
        accent="amber"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Trophy}
          label="Total Achievements"
          value={stats.total ?? 0}
          accent="blue"
          delay={0}
        />
        <StatCard
          icon={Calendar}
          label="This Year"
          value={stats.thisYear ?? 0}
          accent="emerald"
          delay={0.04}
        />
        <StatCard
          icon={Users}
          label="Team"
          value={stats.team ?? 0}
          accent="violet"
          delay={0.08}
        />
        <StatCard
          icon={Award}
          label="Individual"
          value={stats.individual ?? 0}
          accent="amber"
          delay={0.12}
        />
      </div>

      <GlassCard padding="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search achievements…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pr-3 pl-10 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Year
            </p>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white focus:border-amber-500/40 focus:outline-none"
            >
              <option value="all">All</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Category
            </p>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white focus:border-amber-500/40 focus:outline-none"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Type
            </p>
            <TabBar tabs={TYPE_TABS} value={type} onChange={setType} />
          </div>
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={Trophy}
            title="No achievements match"
            description={
              query || year !== 'all' || category !== 'all' || type !== 'all'
                ? 'Try clearing some filters.'
                : "When members earn achievements, they'll appear here."
            }
          />
        </GlassCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StaggerList>
            {filtered.map((a) => (
              <Card key={a.id} achievement={a} onClick={() => setSelected(a)} />
            ))}
          </StaggerList>
        </div>
      )}

      {selected && (
        <DetailModal
          achievement={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </PageShell>
  );
}

function Card({ achievement, onClick }) {
  const memberCount = achievement.member_achievements?.length ?? 0;
  return (
    <button
      onClick={onClick}
      className="group block w-full rounded-2xl border border-white/[0.08] bg-gray-900 p-4 text-left transition-all hover:border-amber-500/30 hover:bg-white/[0.02]"
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        <Pill tone="blue">{achievement.year}</Pill>
        {achievement.category && (
          <Pill tone="violet">{achievement.category}</Pill>
        )}
        <Pill tone={achievement.is_team ? 'emerald' : 'amber'}>
          {achievement.is_team ? 'Team' : 'Individual'}
        </Pill>
      </div>
      <h3 className="line-clamp-2 text-base font-semibold text-white transition-colors group-hover:text-amber-300">
        {achievement.title}
      </h3>
      {achievement.description && (
        <p className="mt-2 line-clamp-2 text-xs text-gray-500">
          {achievement.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
        {achievement.achievement_date && (
          <span>
            {new Date(achievement.achievement_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </button>
  );
}

function DetailModal({ achievement, onClose }) {
  const memberCount = achievement.member_achievements?.length ?? 0;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl"
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-white/10 bg-gray-900/95 p-5">
          <div className="flex-1 pr-3">
            <h2 className="text-xl font-bold text-white">
              {achievement.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="blue">{achievement.year}</Pill>
              {achievement.category && (
                <Pill tone="violet">{achievement.category}</Pill>
              )}
              <Pill tone={achievement.is_team ? 'emerald' : 'amber'}>
                {achievement.is_team ? 'Team' : 'Individual'}
              </Pill>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {achievement.description && (
            <div>
              <h3 className="mb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Description
              </h3>
              <p className="text-sm text-gray-200">{achievement.description}</p>
            </div>
          )}
          {achievement.achievement_date && (
            <div>
              <h3 className="mb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Achievement date
              </h3>
              <p className="text-sm text-gray-200">
                {new Date(achievement.achievement_date).toLocaleDateString(
                  'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </p>
            </div>
          )}
          {memberCount > 0 && (
            <div>
              <h3 className="mb-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Members ({memberCount})
              </h3>
              <ul className="space-y-2">
                {achievement.member_achievements.map((ma) => (
                  <li
                    key={ma.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <Avatar name={ma.users?.full_name ?? '?'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {ma.users?.full_name || 'Unknown'}
                      </p>
                      {ma.position && (
                        <p className="truncate text-xs text-gray-500">
                          {ma.position}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1 border-t border-white/[0.06] pt-3 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Created by</span>
              <span className="text-gray-300">
                {achievement.users?.full_name || 'Unknown'}
              </span>
            </div>
            {achievement.created_at && (
              <div className="flex justify-between">
                <span>Created at</span>
                <span className="text-gray-300">
                  {new Date(achievement.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
