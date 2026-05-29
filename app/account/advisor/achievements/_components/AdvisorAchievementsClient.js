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
} from '../../../_components/ui/dashboard';

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
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 animate-fade-in select-none">
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
            className="w-full bg-white/3 border border-white/8 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex gap-3 w-full md:w-auto shrink-0 select-none">
            <div className="flex flex-col gap-1 w-24">
              <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase font-mono mb-1">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-white/3 border border-white/8 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-amber-500/50 transition-all cursor-pointer appearance-none font-sans"
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
            <div className="flex flex-col gap-1 flex-1 md:w-44">
              <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase font-mono mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/3 border border-white/8 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-amber-500/50 transition-all cursor-pointer appearance-none font-sans"
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
          <div className="min-w-0 flex-1 w-full md:w-auto">
            <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase font-mono mb-1.5 select-none">
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
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StaggerList>
            {filtered.map((a) => (
              <PlaqueCard key={a.id} achievement={a} onClick={() => setSelected(a)} />
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
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/2 p-5 text-left transition-all hover:border-amber-500/30 hover:bg-white/4 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col justify-between h-[180px] w-full"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -z-10" />

      <div>
        <div className="flex flex-wrap gap-1.5 mb-2.5 select-none">
          <Pill tone="blue">{achievement.year}</Pill>
          {achievement.category && <Pill tone="violet">{achievement.category}</Pill>}
          <Pill tone={achievement.is_team ? 'emerald' : 'amber'}>
            {achievement.is_team ? 'Team' : 'Individual'}
          </Pill>
        </div>
        <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
          {achievement.title}
        </h3>
        {achievement.description && (
          <p className="mt-2 line-clamp-2 text-xs text-gray-500 font-sans">
            {achievement.description}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3 text-[10px] text-gray-500 font-mono select-none">
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/8 bg-gray-900/90 shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/8 bg-white/3 px-6 py-4 sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold text-white">Accolade Verification</h2>
            <p className="mt-1 text-[11px] text-amber-400 font-mono uppercase tracking-wider">
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
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-amber-500/10 to-transparent p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -z-10" />

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block font-mono">
                  Official Club Recognition
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1.5 leading-snug">
                  {achievement.title}
                </h3>
              </div>
              <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-1 shadow-sm select-none" />
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 select-none">
              <Pill tone="blue">{achievement.year}</Pill>
              {achievement.category && <Pill tone="violet">{achievement.category}</Pill>}
              <Pill tone={achievement.is_team ? 'emerald' : 'amber'}>
                {achievement.is_team ? 'Team Award' : 'Individual award'}
              </Pill>
            </div>

            <div className="mt-5 pt-4 border-t border-dashed border-white/10 text-xs space-y-2.5">
              {achievement.description && (
                <div>
                  <span className="text-[10px] font-bold text-gray-500 block mb-1">DESCRIPTION / RECOGNITION DETAILS:</span>
                  <p className="text-gray-200 leading-relaxed font-sans text-xs bg-white/2 border border-white/6 rounded-lg p-2.5">
                    {achievement.description}
                  </p>
                </div>
              )}
              {achievement.achievement_date && (
                <div className="flex justify-between items-center py-1 font-mono text-[11px]">
                  <span className="text-gray-500">Official Date:</span>
                  <span className="text-white font-semibold">
                    {new Date(achievement.achievement_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Member Earners List */}
          {memberCount > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase font-mono select-none">
                Earning Members ({memberCount})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {achievement.member_achievements.map((ma) => {
                  const memberName = ma.users?.full_name || 'Unknown';
                  return (
                    <div
                      key={ma.id}
                      className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/2 p-2.5"
                    >
                      <Avatar name={memberName} size="sm" src={ma.users?.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">
                          {memberName}
                        </p>
                        {ma.position && (
                          <p className="truncate text-[10px] text-gray-500 font-mono mt-0.5">
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
          <div className="space-y-1.5 border-t border-white/8 pt-4 text-[10px] font-mono text-gray-500 select-none">
            <div className="flex justify-between">
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> Logged By</span>
              <span className="text-gray-300 font-sans">{achievement.users?.full_name || 'System / Auto'}</span>
            </div>
            {achievement.created_at && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Registered Date</span>
                <span className="text-gray-300">{new Date(achievement.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
