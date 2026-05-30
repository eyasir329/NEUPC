/**
 * @file Advisor achievements client component
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
  BookOpen,
  Sparkles,
  User,
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
} from '@/app/account/_components/ui/dashboard';

const TYPE_TABS = [
  { value: 'all', label: 'All Types' },
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
      {/* Page Header */}
      <PageHeader
        icon={Trophy}
        title="Recognition Ledger"
        subtitle="Review official academic certificates, programming contest accolades, and club team triumphs."
        accent="amber"
      />

      {/* KPI Stats Grid */}
      <div className="animate-fade-in grid grid-cols-2 gap-3 select-none lg:grid-cols-4">
        <StatCard
          icon={Trophy}
          label="Total Accolades"
          value={stats.total ?? 0}
          accent="blue"
          sublabel="All logged recognitions"
          delay={0}
        />
        <StatCard
          icon={Calendar}
          label="Logged This Year"
          value={stats.thisYear ?? 0}
          accent="emerald"
          sublabel="Current term accomplishments"
          delay={0.05}
        />
        <StatCard
          icon={Users}
          label="Team Triumphs"
          value={stats.team ?? 0}
          accent="violet"
          sublabel="Group accolades"
          delay={0.1}
        />
        <StatCard
          icon={Award}
          label="Individual Merits"
          value={stats.individual ?? 0}
          accent="amber"
          sublabel="Solo accomplishments"
          delay={0.15}
        />
      </div>

      {/* Advanced Filters Toolbar */}
      <GlassCard padding="p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accolades by title, contest keywords, or descriptions…"
            className="w-full rounded-xl border border-white/8 bg-white/3 py-2.5 pr-4 pl-11 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col items-end gap-4 md:flex-row">
          <div className="flex w-full shrink-0 gap-3 select-none md:w-auto">
            <div className="flex w-24 flex-col gap-1">
              <label className="mb-1 font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/8 bg-white/3 px-3 py-2 font-sans text-xs text-white transition-all outline-none focus:border-amber-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="all">All</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1 md:w-44">
              <label className="mb-1 font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/8 bg-white/3 px-3 py-2 font-sans text-xs text-white transition-all outline-none focus:border-amber-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="w-full min-w-0 flex-1 md:w-auto">
            <label className="mb-1.5 block font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase select-none">
              Classification
            </label>
            <TabBar tabs={TYPE_TABS} value={type} onChange={setType} />
          </div>
        </div>
      </GlassCard>

      {/* Plaques List Grid */}
      {filtered.length === 0 ? (
        <GlassCard padding="p-8">
          <EmptyState
            icon={Trophy}
            title="No matching accolades"
            description={
              query || year !== 'all' || category !== 'all' || type !== 'all'
                ? 'Try clearing your category filters or adjusting search queries.'
                : 'All achievements logged by the club will be recorded here.'
            }
            accent="amber"
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StaggerList>
            {filtered.map((a) => (
              <PlaqueCard
                key={a.id}
                achievement={a}
                onClick={() => setSelected(a)}
              />
            ))}
          </StaggerList>
        </div>
      )}

      {/* Recognition Details Certificate Modal */}
      {selected && (
        <DetailModal achievement={selected} onClose={() => setSelected(null)} />
      )}
    </PageShell>
  );
}

// ── Plaque Card Component ───────────────────────────────────────────────────
function PlaqueCard({ achievement, onClick }) {
  const memberCount = achievement.member_achievements?.length ?? 0;
  return (
    <button
      onClick={onClick}
      className="group relative flex h-[180px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-white/8 bg-white/2 p-5 text-left transition-all hover:border-amber-500/30 hover:bg-white/4 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
    >
      <div className="absolute top-0 right-0 -z-10 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl" />

      <div>
        <div className="mb-2.5 flex flex-wrap gap-1.5 select-none">
          <Pill tone="blue">{achievement.year}</Pill>
          {achievement.category && (
            <Pill tone="violet">{achievement.category}</Pill>
          )}
          <Pill tone={achievement.is_team ? 'emerald' : 'amber'}>
            {achievement.is_team ? 'Team' : 'Individual'}
          </Pill>
        </div>
        <h3 className="line-clamp-2 text-sm font-bold text-white transition-colors group-hover:text-amber-400">
          {achievement.title}
        </h3>
        {achievement.description && (
          <p className="mt-2 line-clamp-2 font-sans text-xs text-gray-500">
            {achievement.description}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3 font-mono text-[10px] text-gray-500 select-none">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-gray-600" />
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
        {achievement.achievement_date && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-600" />
            {new Date(achievement.achievement_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Recognition Certificate Modal ──────────────────────────────────────────
function DetailModal({ achievement, onClose }) {
  const memberCount = achievement.member_achievements?.length ?? 0;
  return (
    <div
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-in fade-in zoom-in-95 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/8 bg-gray-900/90 shadow-2xl backdrop-blur-lg duration-200"
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-white/3 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Accolade Verification
            </h2>
            <p className="mt-1 font-mono text-[11px] tracking-wider text-amber-400 uppercase">
              {`// certificate ref: REC-${achievement.id.substring(0, 8)}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/8 hover:text-white active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Certificate Slates */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-amber-500/10 to-transparent p-5">
            <div className="absolute top-0 right-0 -z-10 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="block font-mono text-[9px] font-bold tracking-widest text-amber-400 uppercase">
                  Official Club Recognition
                </span>
                <h3 className="mt-1.5 text-lg leading-snug font-extrabold text-white">
                  {achievement.title}
                </h3>
              </div>
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-amber-400 shadow-sm select-none" />
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 select-none">
              <Pill tone="blue">{achievement.year}</Pill>
              {achievement.category && (
                <Pill tone="violet">{achievement.category}</Pill>
              )}
              <Pill tone={achievement.is_team ? 'emerald' : 'amber'}>
                {achievement.is_team ? 'Team Award' : 'Individual award'}
              </Pill>
            </div>

            <div className="mt-5 space-y-2.5 border-t border-dashed border-white/10 pt-4 text-xs">
              {achievement.description && (
                <div>
                  <span className="mb-1 block text-[10px] font-bold text-gray-500">
                    DESCRIPTION / RECOGNITION DETAILS:
                  </span>
                  <p className="rounded-lg border border-white/6 bg-white/2 p-2.5 font-sans text-xs leading-relaxed text-gray-200">
                    {achievement.description}
                  </p>
                </div>
              )}
              {achievement.achievement_date && (
                <div className="flex items-center justify-between py-1 font-mono text-[11px]">
                  <span className="text-gray-500">Official Date:</span>
                  <span className="font-semibold text-white">
                    {new Date(achievement.achievement_date).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Member Earners List */}
          {memberCount > 0 && (
            <div className="space-y-2.5">
              <h4 className="font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase select-none">
                Earning Members ({memberCount})
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {achievement.member_achievements.map((ma) => {
                  const memberName = ma.users?.full_name || 'Unknown';
                  return (
                    <div
                      key={ma.id}
                      className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/2 p-2.5"
                    >
                      <Avatar
                        name={memberName}
                        size="sm"
                        src={ma.users?.avatar_url}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">
                          {memberName}
                        </p>
                        {ma.position && (
                          <p className="mt-0.5 truncate font-mono text-[10px] text-gray-500">
                            {ma.position}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verification Audit metadata */}
          <div className="space-y-1.5 border-t border-white/8 pt-4 font-mono text-[10px] text-gray-500 select-none">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> Logged By
              </span>
              <span className="font-sans text-gray-300">
                {achievement.users?.full_name || 'System / Auto'}
              </span>
            </div>
            {achievement.created_at && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Registered Date
                </span>
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
