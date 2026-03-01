/**
 * @file Achievement management client — admin interface for listing,
 *   creating, editing, and awarding achievements and badges to members.
 * @module AdminAchievementManagementClient
 */

'use client';

import { useState, useMemo } from 'react';
import AchievementCard from './AchievementCard';
import AchievementFormModal from './AchievementFormModal';
import MembersModal from './MembersModal';
import { getStatCards, ACHIEVEMENT_CATEGORIES } from './achievementConfig';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'team', label: '👥 Team' },
  { id: 'individual', label: '👤 Individual' },
  { id: 'thisYear', label: '📅 This Year' },
];

export default function AchievementManagementClient({
  initialAchievements = [],
  stats,
  users = [],
}) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [membersItem, setMembersItem] = useState(null);

  const currentYear = new Date().getFullYear();

  // ── Derived filter options ─────────────────────────────────────────────────
  const allCategories = useMemo(
    () =>
      [
        ...new Set(initialAchievements.map((a) => a.category).filter(Boolean)),
      ].sort(),
    [initialAchievements]
  );

  const allYears = useMemo(
    () =>
      [...new Set(initialAchievements.map((a) => a.year).filter(Boolean))].sort(
        (a, b) => b - a
      ),
    [initialAchievements]
  );

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      all: initialAchievements.length,
      team: initialAchievements.filter((a) => a.is_team).length,
      individual: initialAchievements.filter((a) => !a.is_team).length,
      thisYear: initialAchievements.filter((a) => a.year === currentYear)
        .length,
    }),
    [initialAchievements, currentYear]
  );

  // ── Filtered achievements ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...initialAchievements];

    if (tab === 'team') items = items.filter((a) => a.is_team);
    else if (tab === 'individual') items = items.filter((a) => !a.is_team);
    else if (tab === 'thisYear')
      items = items.filter((a) => a.year === currentYear);

    if (categoryFilter)
      items = items.filter((a) => a.category === categoryFilter);
    if (yearFilter) items = items.filter((a) => String(a.year) === yearFilter);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.contest_name?.toLowerCase().includes(q) ||
          a.result?.toLowerCase().includes(q) ||
          a.team_name?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.participants?.some((p) => p.toLowerCase().includes(q))
      );
    }

    return items;
  }, [
    initialAchievements,
    tab,
    search,
    categoryFilter,
    yearFilter,
    currentYear,
  ]);

  const statCards = getStatCards(stats);

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Achievement Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Track contest wins, hackathons, placements, and club milestones.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-amber-900/30 transition-colors hover:bg-amber-700"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Achievement
        </button>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`bg-linear-to-br ${s.color} flex flex-col gap-1 rounded-xl border p-3.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">{s.icon}</span>
              <span className={`text-xl font-bold ${s.text}`}>{s.value}</span>
            </div>
            <p className="truncate text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Year Timeline strip ───────────────────────────────────────────── */}
      {allYears.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-xs text-slate-500">Jump to year:</span>
          {allYears.map((y) => (
            <button
              key={y}
              onClick={() =>
                setYearFilter(yearFilter === String(y) ? '' : String(y))
              }
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                yearFilter === String(y)
                  ? 'border-amber-500 bg-amber-600 text-white'
                  : 'border-slate-700/40 bg-slate-800/60 text-slate-400 hover:border-amber-500/40 hover:text-amber-400'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, contest, result, team, participants…"
            className="w-full rounded-xl border border-slate-700/50 bg-slate-800/60 py-2 pr-4 pl-9 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Year filter */}
        {allYears.length > 0 && (
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">All years</option>
            {allYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {(categoryFilter || yearFilter || search) && (
          <button
            onClick={() => {
              setCategoryFilter('');
              setYearFilter('');
              setSearch('');
            }}
            className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex w-fit gap-1 overflow-x-auto rounded-xl border border-slate-700/40 bg-slate-800/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}{' '}
            <span
              className={`ml-1 text-xs ${tab === t.id ? 'text-amber-200' : 'text-slate-600'}`}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-3 text-5xl">🏆</div>
          <p className="font-medium text-slate-400">No achievements found</p>
          <p className="mt-1 text-sm text-slate-500">
            {search || categoryFilter || yearFilter
              ? 'Try adjusting your filters.'
              : 'Add your first achievement to get started.'}
          </p>
          {!search && !categoryFilter && !yearFilter && (
            <button
              onClick={() => setAddOpen(true)}
              className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Add Achievement
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {initialAchievements.length}{' '}
            achievements
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((a) => (
              <AchievementCard
                key={a.id}
                achievement={a}
                onEdit={(item) => setEditItem(item)}
                onManageMembers={(item) => setMembersItem(item)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {addOpen && <AchievementFormModal onClose={() => setAddOpen(false)} />}
      {editItem && (
        <AchievementFormModal
          achievement={editItem}
          onClose={() => setEditItem(null)}
        />
      )}
      {membersItem && (
        <MembersModal
          achievement={membersItem}
          users={users}
          onClose={() => setMembersItem(null)}
        />
      )}
    </div>
  );
}
