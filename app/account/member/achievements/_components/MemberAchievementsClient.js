/**
 * @file Member achievements client — full-page view of earned badges,
 *   certificates, and progress bars towards unearned achievements.
 * @module MemberAchievementsClient
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Star,
  Download,
  ExternalLink,
  Search,
  X,
  ChevronDown,
  BadgeCheck,
  Users,
  User,
  Calendar,
  Tag,
  FileText,
  Shield,
  Clock,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtYear(y) {
  return y ?? '—';
}

// ─── Config ───────────────────────────────────────────────────────────────────

const RESULT_CONFIG = {
  '1st': {
    label: '1st Place',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    Icon: Trophy,
  },
  first: {
    label: '1st Place',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    Icon: Trophy,
  },
  champion: {
    label: 'Champion',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    Icon: Trophy,
  },
  winner: {
    label: 'Winner',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    Icon: Trophy,
  },
  '2nd': {
    label: '2nd Place',
    color: 'text-slate-300',
    bg: 'bg-slate-500/15',
    border: 'border-slate-400/30',
    Icon: Medal,
  },
  second: {
    label: '2nd Place',
    color: 'text-slate-300',
    bg: 'bg-slate-500/15',
    border: 'border-slate-400/30',
    Icon: Medal,
  },
  'runner-up': {
    label: 'Runner-up',
    color: 'text-slate-300',
    bg: 'bg-slate-500/15',
    border: 'border-slate-400/30',
    Icon: Medal,
  },
  '3rd': {
    label: '3rd Place',
    color: 'text-orange-300',
    bg: 'bg-orange-500/12',
    border: 'border-orange-500/25',
    Icon: Award,
  },
  third: {
    label: '3rd Place',
    color: 'text-orange-300',
    bg: 'bg-orange-500/12',
    border: 'border-orange-500/25',
    Icon: Award,
  },
};

function getResultConf(result) {
  if (!result)
    return {
      label: result || '—',
      color: 'text-blue-300',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      Icon: Star,
    };
  const key = result.toLowerCase().trim();
  for (const [k, v] of Object.entries(RESULT_CONFIG)) {
    if (key.includes(k)) return v;
  }
  return {
    label: result,
    color: 'text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    Icon: Star,
  };
}

const CERT_TYPE_CONFIG = {
  participation: {
    label: 'Participation',
    color: 'text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  completion: {
    label: 'Completion',
    color: 'text-green-300',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  achievement: {
    label: 'Achievement',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  appreciation: {
    label: 'Appreciation',
    color: 'text-purple-300',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
};

function certTypeConf(t) {
  return CERT_TYPE_CONFIG[t] || CERT_TYPE_CONFIG.participation;
}

// ─── Achievement Card ─────────────────────────────────────────────────────────

function AchievementCard({ item }) {
  const ach = item.achievements ?? item;
  const rc = getResultConf(ach.result);
  const ResultIcon = rc.Icon;

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/3 p-5 transition-all hover:border-white/15 hover:bg-white/5">
      {/* Year badge */}
      <div className="absolute top-4 right-4 rounded-full border border-white/8 bg-white/6 px-2.5 py-1 text-[10px] font-semibold text-gray-400">
        {fmtYear(ach.year)}
      </div>

      {/* Result badge */}
      <div
        className={`flex w-fit items-center gap-1.5 rounded-xl border px-3 py-1.5 ${rc.bg} ${rc.border}`}
      >
        <ResultIcon className={`h-3.5 w-3.5 ${rc.color}`} />
        <span className={`text-[11px] font-bold ${rc.color}`}>{rc.label}</span>
      </div>

      {/* Title */}
      <div className="min-w-0">
        <h3 className="line-clamp-2 pr-12 leading-snug font-bold text-white">
          {ach.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
          {ach.contest_name}
        </p>
      </div>

      {/* Description */}
      {ach.description && (
        <p className="line-clamp-2 text-[11px] text-gray-500">
          {ach.description}
        </p>
      )}

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {ach.category && (
          <span className="flex items-center gap-1 rounded-lg border border-white/6 bg-white/4 px-2 py-1 text-gray-400">
            <Tag className="h-2.5 w-2.5" /> {ach.category}
          </span>
        )}
        {ach.is_team ? (
          <span className="flex items-center gap-1 rounded-lg border border-purple-500/20 bg-purple-500/8 px-2 py-1 text-purple-300">
            <Users className="h-2.5 w-2.5" /> {ach.team_name || 'Team'}
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border border-blue-500/15 bg-blue-500/8 px-2 py-1 text-blue-300">
            <User className="h-2.5 w-2.5" /> Individual
          </span>
        )}
        {item.position && (
          <span className="flex items-center gap-1 rounded-lg border border-green-500/15 bg-green-500/8 px-2 py-1 text-green-300">
            <Medal className="h-2.5 w-2.5" /> {item.position}
          </span>
        )}
        {ach.achievement_date && (
          <span className="flex items-center gap-1 rounded-lg border border-white/6 bg-white/4 px-2 py-1 text-gray-500">
            <Calendar className="h-2.5 w-2.5" /> {fmtDate(ach.achievement_date)}
          </span>
        )}
      </div>

      {/* CTA */}
      {ach.contest_url && (
        <a
          href={ach.contest_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/4 py-2 text-[11px] font-medium text-gray-300 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View Contest
        </a>
      )}
    </div>
  );
}

// ─── Certificate Row ──────────────────────────────────────────────────────────

function CertificateRow({ cert }) {
  const tc = certTypeConf(cert.certificate_type);
  const linkedTo = cert.events?.title || cert.contests?.title || null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/2 px-4 py-3.5 transition-all hover:border-white/10 hover:bg-white/4">
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-yellow-500/15 bg-yellow-500/8">
        <FileText className="h-4 w-4 text-yellow-300" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-white">
            {cert.title}
          </p>
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${tc.bg} ${tc.border} ${tc.color}`}
          >
            {tc.label}
          </span>
          {cert.verified && (
            <span className="flex items-center gap-0.5 rounded-full border border-green-500/20 bg-green-500/8 px-2 py-0.5 text-[9px] font-bold text-green-300">
              <BadgeCheck className="h-2.5 w-2.5" /> Verified
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-0.5">
            <Shield className="h-2.5 w-2.5" /> #{cert.certificate_number}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" /> {fmtDate(cert.issue_date)}
          </span>
          {linkedTo && <span className="max-w-48 truncate">{linkedTo}</span>}
        </div>
        {cert.description && (
          <p className="mt-1 line-clamp-1 text-[11px] text-gray-600">
            {cert.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {cert.certificate_url && (
          <a
            href={cert.certificate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-[11px] font-semibold text-blue-300 transition-all hover:bg-blue-500/20"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/3 py-20 text-center">
      <Icon className="mb-3 h-12 w-12 text-gray-700" />
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && (
        <p className="mt-1 max-w-xs text-xs text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MemberAchievementsClient({
  memberAchievements,
  certificates,
}) {
  const [activeTab, setActiveTab] = useState('achievements');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [certTypeFilter, setCertTypeFilter] = useState('all');

  // Derived achievement stats
  const years = useMemo(
    () =>
      [
        ...new Set(
          memberAchievements.map((a) => a.achievements?.year).filter(Boolean)
        ),
      ].sort((a, b) => b - a),
    [memberAchievements]
  );
  const categories = useMemo(
    () => [
      ...new Set(
        memberAchievements.map((a) => a.achievements?.category).filter(Boolean)
      ),
    ],
    [memberAchievements]
  );
  const teamCount = memberAchievements.filter(
    (a) => a.achievements?.is_team
  ).length;
  const soloCount = memberAchievements.length - teamCount;

  // Filtered achievements
  const filteredAch = useMemo(() => {
    return memberAchievements.filter((item) => {
      const ach = item.achievements ?? {};
      if (catFilter !== 'all' && ach.category !== catFilter) return false;
      if (yearFilter !== 'all' && String(ach.year) !== yearFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        ach.title?.toLowerCase().includes(q) ||
        ach.contest_name?.toLowerCase().includes(q) ||
        ach.result?.toLowerCase().includes(q) ||
        ach.category?.toLowerCase().includes(q)
      );
    });
  }, [memberAchievements, catFilter, yearFilter, search]);

  // Filtered certificates
  const filteredCerts = useMemo(() => {
    return certificates.filter((c) => {
      if (certTypeFilter !== 'all' && c.certificate_type !== certTypeFilter)
        return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.certificate_number?.toLowerCase().includes(q) ||
        c.events?.title?.toLowerCase().includes(q) ||
        c.contests?.title?.toLowerCase().includes(q)
      );
    });
  }, [certificates, certTypeFilter, search]);

  function TabBtn({ id, label, count }) {
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
          activeTab === id
            ? 'bg-white/12 text-white shadow-sm'
            : 'text-gray-500 hover:bg-white/6 hover:text-gray-300'
        }`}
      >
        {label}
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
            activeTab === id
              ? 'bg-white/15 text-white'
              : 'bg-white/6 text-gray-600'
          }`}
        >
          {count}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          My Achievements
        </h1>
        <p className="text-sm text-gray-500">
          Your contest results and earned certificates.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: Trophy,
            label: 'Achievements',
            value: memberAchievements.length,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
          },
          {
            icon: FileText,
            label: 'Certificates',
            value: certificates.length,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            icon: Users,
            label: 'Team Results',
            value: teamCount,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
          },
          {
            icon: Calendar,
            label: 'Years Active',
            value: years.length,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}
            >
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-xl leading-none font-bold text-white tabular-nums">
                {value}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-600">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-xl border border-white/8 bg-white/3 p-1.5">
        <TabBtn
          id="achievements"
          label="Achievements"
          count={memberAchievements.length}
        />
        <TabBtn
          id="certificates"
          label="Certificates"
          count={certificates.length}
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={
              activeTab === 'achievements'
                ? 'Search achievements…'
                : 'Search certificates…'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/4 py-2.5 pr-8 pl-9 text-sm text-white placeholder-gray-600 focus:border-white/20 focus:bg-white/6 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {activeTab === 'achievements' && (
          <>
            {categories.length > 0 && (
              <div className="relative">
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="w-36 appearance-none rounded-xl border border-white/10 bg-white/4 py-2.5 pr-8 pl-3.5 text-sm text-white focus:border-white/20 focus:outline-none [&>option]:bg-gray-900"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {years.length > 0 && (
              <div className="relative">
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-28 appearance-none rounded-xl border border-white/10 bg-white/4 py-2.5 pr-8 pl-3.5 text-sm text-white focus:border-white/20 focus:outline-none [&>option]:bg-gray-900"
                >
                  <option value="all">All Years</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
        {activeTab === 'certificates' && (
          <div className="relative">
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <select
              value={certTypeFilter}
              onChange={(e) => setCertTypeFilter(e.target.value)}
              className="w-36 appearance-none rounded-xl border border-white/10 bg-white/4 py-2.5 pr-8 pl-3.5 text-sm text-white focus:border-white/20 focus:outline-none [&>option]:bg-gray-900"
            >
              <option value="all">All Types</option>
              <option value="participation">Participation</option>
              <option value="completion">Completion</option>
              <option value="achievement">Achievement</option>
              <option value="appreciation">Appreciation</option>
            </select>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
           TAB: ACHIEVEMENTS
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'achievements' && (
        <>
          {/* Timeline by year */}
          {filteredAch.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No achievements yet"
              subtitle="Contest results added by admins will appear here."
            />
          ) : (
            <div className="space-y-6">
              {/* Group by year */}
              {(() => {
                const byYear = filteredAch.reduce((acc, item) => {
                  const y = item.achievements?.year ?? 'Other';
                  if (!acc[y]) acc[y] = [];
                  acc[y].push(item);
                  return acc;
                }, {});
                return Object.keys(byYear)
                  .sort((a, b) => Number(b) - Number(a))
                  .map((year) => (
                    <div key={year}>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-7 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/6 text-xs font-bold text-white">
                          {year}
                        </div>
                        <div className="h-px flex-1 bg-white/6" />
                        <span className="text-[10px] text-gray-600">
                          {byYear[year].length} result
                          {byYear[year].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {byYear[year].map((item) => (
                          <AchievementCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  ));
              })()}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
           TAB: CERTIFICATES
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'certificates' && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Certificates</h2>
            <span className="ml-auto rounded-full border border-yellow-500/20 bg-yellow-500/8 px-2 py-0.5 text-[10px] font-medium text-yellow-300">
              {filteredCerts.length}
            </span>
          </div>
          {filteredCerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-gray-700" />
              <p className="text-sm font-medium text-gray-500">
                {certificates.length === 0
                  ? 'No certificates yet'
                  : 'No certificates match your filters'}
              </p>
              {certTypeFilter !== 'all' && (
                <button
                  onClick={() => setCertTypeFilter('all')}
                  className="mt-2 text-xs text-blue-400 transition-colors hover:text-blue-300"
                >
                  Clear filter ×
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCerts.map((cert) => (
                <CertificateRow key={cert.id} cert={cert} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
