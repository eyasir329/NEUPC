/**
 * @file Achievement management client — admin interface for listing,
 *   creating, editing, and awarding achievements and badges to members.
 * @module AdminAchievementManagementClient
 */

'use client';

import { useState, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import AchievementCard, { getPlatformBadge } from './AchievementCard';
import AchievementFormModal from './AchievementFormModal';
import MembersModal from './MembersModal';
import GalleryModal from './GalleryModal';
import ParticipationHistoryModal from './ParticipationHistoryModal';
import JourneyModal from './JourneyModal';
import {
  Trophy,
  Star,
  Users,
  User,
  Calendar,
  Tag,
  BarChart2,
  Search,
  Plus,
  ArrowLeft,
  Map as MapIcon,
  History,
  LayoutGrid,
  LayoutList,
  Rows3,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Image as ImageIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { deleteAchievementAction } from '@/app/_lib/achievement-actions';
import {
  getStatCards,
  getCategoryConfig,
  formatDate,
} from './achievementConfig';
import {
  PageShell,
  PageHeader,
  StatCard,
  TabBar,
  GlassCard,
  EmptyState,
  ActionButton,
} from '../../_components/_ui';

const TABS = [
  { id: 'all', label: 'All', icon: Trophy },
  { id: 'featured', label: 'Featured', icon: Star },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'individual', label: 'Individual', icon: User },
  { id: 'thisYear', label: 'This Year', icon: Calendar },
];

const STAT_MAPPING = {
  Total: { icon: Trophy, accent: 'amber' },
  [`${new Date().getFullYear()} Wins`]: { icon: Calendar, accent: 'violet' },
  Team: { icon: Users, accent: 'blue' },
  Individual: { icon: User, accent: 'emerald' },
  Categories: { icon: Tag, accent: 'rose' },
  'Years Active': { icon: BarChart2, accent: 'sky' },
};

const VIEW_MODES = [
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'category', label: 'Grouped', icon: Rows3 },
  { id: 'list', label: 'List', icon: LayoutList },
];

const PAGE_SIZE = 12;

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '…', total];
  if (current >= total - 2)
    return [1, '…', total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

const gridVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

// ── Category-wise grouped view ─────────────────────────────────────────────────
function CategoryView({ items, onEdit, onManageMembers, onManageGallery }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const a of items) {
      const key = a.category?.split(',')[0]?.trim() ?? 'Uncategorised';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 'Uncategorised') return 1;
      if (b === 'Uncategorised') return -1;
      return a.localeCompare(b);
    });
  }, [items]);

  return (
    <div className="space-y-8">
      {groups.map(([category, groupItems]) => {
        const catConf = getCategoryConfig(
          category === 'Uncategorised' ? null : category
        );
        return (
          <section key={category} className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${catConf.color}`}
              >
                {catConf.emoji} {category}
              </span>
              <span className="text-[11px] font-medium text-gray-500">
                {groupItems.length} achievement
                {groupItems.length !== 1 ? 's' : ''}
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {groupItems.map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  onEdit={onEdit}
                  onManageMembers={onManageMembers}
                  onManageGallery={onManageGallery}
                />
              ))}
            </motion.div>
          </section>
        );
      })}
    </div>
  );
}

// ── Table Row Component for List View ───────────────────────────────────────────
function AchievementTableRow({
  achievement,
  onEdit,
  onManageMembers,
  onManageGallery,
  onDelete,
  deleting,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cats = achievement.category
    ? achievement.category
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const primaryCat = cats[0] ?? 'Uncategorised';
  const catConf = getCategoryConfig(
    primaryCat === 'Uncategorised' ? null : primaryCat
  );
  const memberCount = achievement.member_achievements?.length ?? 0;

  return (
    <tr className="group border-b border-white/[0.04] bg-white/[0.01] transition-all hover:bg-white/[0.03]">
      <td className="px-5 py-3.5">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="max-w-[280px] truncate text-sm font-semibold text-white">
              {achievement.title}
            </span>
            {achievement.is_featured && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                ★ Featured
              </span>
            )}
          </div>
          <span className="max-w-[280px] truncate text-xs text-gray-400">
            {achievement.contest_name || 'Individual Milestone'}
          </span>
        </div>
      </td>

      <td className="shrink-0 px-5 py-3.5">
        {achievement.platform ? (
          <span className="inline-flex">
            {getPlatformBadge(achievement.platform)}
          </span>
        ) : (
          <span className="text-xs font-medium text-gray-500">—</span>
        )}
      </td>

      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${catConf.color}`}
        >
          {catConf.emoji} {primaryCat}
        </span>
      </td>

      <td className="px-5 py-3.5 text-xs font-medium whitespace-nowrap text-gray-400">
        {achievement.achievement_date
          ? formatDate(achievement.achievement_date)
          : 'No Date'}
      </td>

      <td className="px-5 py-3.5 text-center">
        <button
          onClick={() => onManageMembers(achievement)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-white/3 px-2 py-1 text-xs text-gray-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <Users className="h-3.5 w-3.5" />
          <span className="font-bold">{memberCount}</span>
        </button>
      </td>

      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onManageGallery(achievement)}
            title="Manage gallery photos"
            className="relative rounded-lg p-1.5 text-gray-400 transition-all hover:bg-white/5 hover:text-white"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {achievement.gallery_images?.length > 0 && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
            )}
          </button>

          <button
            onClick={() => onEdit(achievement)}
            title="Edit"
            className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-white/5 hover:text-white"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={async () => {
                  setConfirmDelete(false);
                  await onDelete(achievement.id);
                }}
                disabled={deleting}
                className="rounded border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-400 transition-all hover:bg-red-500/30"
              >
                {deleting ? '…' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-gray-300 transition-all hover:bg-white/10"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete"
              className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AchievementManagementClient({
  initialAchievements = [],
  stats,
  users = [],
  initialParticipations = [],
  initialJourney = [],
}) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [membersItem, setMembersItem] = useState(null);
  const [galleryItem, setGalleryItem] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'category' | 'list'
  const [page, setPage] = useState(1);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState(null);

  const currentYear = new Date().getFullYear();

  const handleDeleteAchievement = async (id) => {
    setDeletingId(id);
    const fd = new FormData();
    fd.set('id', id);
    const res = await deleteAchievementAction(fd);
    if (res?.error) {
      toast.error(res.error);
      setDeletingId(null);
    } else {
      toast.success('Achievement deleted successfully');
      startTransition(() => {
        router.refresh();
        setDeletingId(null);
      });
    }
  };

  // ── Derived insights ───────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const countsMap = {};
    for (const a of initialAchievements) {
      const cat = a.category?.split(',')[0]?.trim() ?? 'Uncategorised';
      countsMap[cat] = (countsMap[cat] || 0) + 1;
    }
    return Object.entries(countsMap).sort((a, b) => b[1] - a[1]);
  }, [initialAchievements]);

  const topCategory = categoryBreakdown[0] ? categoryBreakdown[0][0] : 'None';

  const yearBreakdown = useMemo(() => {
    const countsMap = {};
    for (const a of initialAchievements) {
      if (a.year) countsMap[a.year] = (countsMap[a.year] || 0) + 1;
    }
    return Object.entries(countsMap).sort((a, b) => b[1] - a[1]);
  }, [initialAchievements]);

  const peakYear = yearBreakdown[0] ? yearBreakdown[0][0] : 'None';
  const peakYearCount = yearBreakdown[0] ? yearBreakdown[0][1] : 0;

  const handleTabChange = (t) => {
    setTab(t);
    setPage(1);
  };
  const handleSearchChange = (s) => {
    setSearch(s);
    setPage(1);
  };
  const handleCategoryChange = (c) => {
    setCategoryFilter(c);
    setPage(1);
  };
  const handleYearChange = (y) => {
    setYearFilter(y);
    setPage(1);
  };
  const handleClear = () => {
    setCategoryFilter('');
    setYearFilter('');
    setSearch('');
    setPage(1);
  };

  // ── Derived filter options ─────────────────────────────────────────────────
  const allCategories = useMemo(
    () =>
      [
        ...new Set(
          initialAchievements.flatMap((a) =>
            a.category
              ? a.category
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : []
          )
        ),
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
      featured: initialAchievements.filter((a) => a.is_featured).length,
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

    if (tab === 'featured') items = items.filter((a) => a.is_featured);
    else if (tab === 'team') items = items.filter((a) => a.is_team);
    else if (tab === 'individual') items = items.filter((a) => !a.is_team);
    else if (tab === 'thisYear')
      items = items.filter((a) => a.year === currentYear);

    if (categoryFilter)
      items = items.filter((a) =>
        a.category
          ?.split(',')
          .map((s) => s.trim())
          .includes(categoryFilter)
      );
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
  }, [initialAchievements, tab, search, categoryFilter, yearFilter, currentYear]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const statCards = getStatCards(stats);
  const hasFilters = Boolean(categoryFilter || yearFilter || search);

  return (
    <PageShell>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        title="Achievements"
        subtitle={`${counts.all} contest wins, hackathons, placements & club milestones`}
        icon={Trophy}
        accent="amber"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton href="/account/admin" tone="ghost" icon={ArrowLeft}>
              Dashboard
            </ActionButton>
            <ActionButton
              onClick={() => setJourneyOpen(true)}
              tone="ghost"
              icon={MapIcon}
            >
              Journey
            </ActionButton>
            <ActionButton
              onClick={() => setHistoryOpen(true)}
              tone="ghost"
              icon={History}
            >
              History
            </ActionButton>
            <ActionButton
              onClick={() => setAddOpen(true)}
              tone="amber"
              icon={Plus}
            >
              Add Achievement
            </ActionButton>
          </div>
        }
      />

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => {
          const mapping =
            STAT_MAPPING[s.label] || { icon: Trophy, accent: 'amber' };
          return (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={mapping.icon}
              accent={mapping.accent}
            />
          );
        })}
      </div>

      {/* ── Unified control bar (tabs · filters · view · insights) ───────── */}
      <GlassCard
        padding="p-3"
        className="space-y-3 border border-white/[0.06] bg-slate-950/20 backdrop-blur-md"
      >
        {/* Row 1: tabs + view toggle */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <TabBar
              tabs={TABS.map((t) => ({
                value: t.id,
                label: t.label,
                count: counts[t.id],
                icon: t.icon,
              }))}
              value={tab}
              onChange={handleTabChange}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            {VIEW_MODES.map((m) => {
              const Icon = m.icon;
              const active = viewMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setViewMode(m.id)}
                  title={`${m.label} view`}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: search + filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search title, contest, result, team, participants…"
              className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] py-2 pr-10 pl-10 text-sm text-white placeholder-gray-500 transition-all focus:border-amber-500/20 focus:bg-white/5 focus:ring-1 focus:ring-amber-500/20 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-white/[0.05] bg-slate-900/60 py-2 pr-10 pl-3.5 text-sm text-gray-300 transition-all hover:bg-slate-900/80 focus:border-amber-500/20 focus:outline-none sm:w-[170px]"
            >
              <option value="" className="bg-slate-950 text-gray-400">
                All categories
              </option>
              {allCategories.map((c) => (
                <option key={c} value={c} className="bg-slate-950 text-gray-300">
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>

          {allYears.length > 0 && (
            <div className="relative shrink-0">
              <select
                value={yearFilter}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/[0.05] bg-slate-900/60 py-2 pr-10 pl-3.5 text-sm text-gray-300 transition-all hover:bg-slate-900/80 focus:border-amber-500/20 focus:outline-none sm:w-[120px]"
              >
                <option value="" className="bg-slate-950 text-gray-400">
                  All years
                </option>
                {allYears.map((y) => (
                  <option
                    key={y}
                    value={y}
                    className="bg-slate-950 text-gray-300"
                  >
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </div>
          )}

          {hasFilters && (
            <button
              onClick={handleClear}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-300 transition-all hover:border-amber-500/20 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          <button
            onClick={() => setInsightsOpen((o) => !o)}
            title="Insights & metrics"
            className={`flex shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
              insightsOpen
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Insights</span>
          </button>
        </div>
      </GlassCard>

      {/* ── Collapsible Insights Panel ───────────────────────────────────── */}
      <AnimatePresence>
        {insightsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <GlassCard className="my-1 grid grid-cols-1 gap-6 border border-white/8 bg-slate-950/20 p-5 backdrop-blur-md md:grid-cols-3">
              {/* Category distribution */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  <span>🏷️</span> Category Distribution
                </h4>
                <div className="no-scrollbar max-h-[180px] space-y-2 overflow-y-auto pr-1">
                  {categoryBreakdown.slice(0, 5).map(([cat, val]) => {
                    const percentage = counts.all
                      ? Math.round((val / counts.all) * 100)
                      : 0;
                    const conf = getCategoryConfig(cat);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium text-gray-300">
                          <span className="truncate">
                            {conf.emoji} {cat}
                          </span>
                          <span>
                            {val} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Collaboration mix */}
              <div className="flex flex-col justify-between space-y-3">
                <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  <span>👥</span> Collaboration Mix
                </h4>
                <div className="flex items-center gap-6 py-2">
                  <div className="relative flex h-18 w-18 shrink-0 items-center justify-center">
                    <svg className="h-full w-full -rotate-90">
                      <circle
                        cx="36"
                        cy="36"
                        r="30"
                        className="fill-none stroke-white/5"
                        strokeWidth="6"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r="30"
                        className="fill-none stroke-amber-500"
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 30}`}
                        strokeDashoffset={`${2 * Math.PI * 30 * (1 - counts.team / (counts.all || 1))}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-white">
                        {counts.all > 0
                          ? Math.round((counts.team / counts.all) * 100)
                          : 0}
                        %
                      </span>
                      <span className="text-[8px] font-semibold tracking-wider text-gray-500 uppercase">
                        Team
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 font-medium text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Team Events
                      </span>
                      <span className="font-bold text-white">{counts.team}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 font-medium text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-white/10" />
                        Individual
                      </span>
                      <span className="font-bold text-white">
                        {counts.individual}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed font-medium text-gray-500">
                  Team wins highlight collective milestones, while individual
                  wins track focused developer mastery.
                </p>
              </div>

              {/* Peak highlights */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  <span>⚡</span> Peak Highlights
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.01] px-3.5 py-2.5">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <div className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        Top Field
                      </div>
                      <div className="max-w-[160px] truncate text-xs font-bold text-gray-200">
                        {topCategory}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.01] px-3.5 py-2.5">
                    <span className="text-2xl">📈</span>
                    <div>
                      <div className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        Peak Year
                      </div>
                      <div className="text-xs font-bold text-gray-200">
                        {peakYear}{' '}
                        <span className="text-[10px] font-normal text-gray-400">
                          ({peakYearCount} wins)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main View Area ───────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No achievements found"
          description={
            hasFilters
              ? 'Try adjusting your filters or search terms.'
              : 'Add your first achievement to get started tracking victory milestones!'
          }
          icon={Trophy}
          accent="amber"
          action={
            !hasFilters ? (
              <ActionButton onClick={() => setAddOpen(true)} tone="amber">
                Add Achievement
              </ActionButton>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-medium text-gray-500">
            Showing{' '}
            {`${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)}`}{' '}
            of {filtered.length} achievements
          </p>

          {viewMode === 'category' ? (
            <CategoryView
              items={filtered}
              onEdit={(item) => setEditItem(item)}
              onManageMembers={(item) => setMembersItem(item)}
              onManageGallery={(item) => setGalleryItem(item)}
            />
          ) : (
            <>
              {viewMode === 'list' ? (
                <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-950/20 backdrop-blur-md">
                  <div className="no-scrollbar overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-900/10">
                          <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                            Achievement
                          </th>
                          <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                            Platform
                          </th>
                          <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                            Category
                          </th>
                          <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-5 py-3 text-center text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                            Members
                          </th>
                          <th className="px-5 py-3 text-right text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {paginatedItems.map((a) => (
                          <AchievementTableRow
                            key={a.id}
                            achievement={a}
                            onEdit={(item) => setEditItem(item)}
                            onManageMembers={(item) => setMembersItem(item)}
                            onManageGallery={(item) => setGalleryItem(item)}
                            onDelete={handleDeleteAchievement}
                            deleting={deletingId === a.id}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <motion.div
                  variants={gridVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {paginatedItems.map((a) => (
                    <AchievementCard
                      key={a.id}
                      achievement={a}
                      onEdit={(item) => setEditItem(item)}
                      onManageMembers={(item) => setMembersItem(item)}
                      onManageGallery={(item) => setGalleryItem(item)}
                    />
                  ))}
                </motion.div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 border-t border-white/[0.04] pt-4 sm:flex-row sm:justify-between">
                  <p className="text-xs font-medium text-gray-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(1)}
                      disabled={currentPage <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/3 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                      title="First page"
                    >
                      <ChevronLeft className="-mr-1.5 h-4 w-4" />
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="flex h-8 items-center justify-center gap-1 rounded-lg border border-white/[0.08] bg-white/3 px-2.5 text-xs text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Prev
                    </button>
                    <div className="flex items-center gap-1">
                      {getPageNumbers(currentPage, totalPages).map((p, i) =>
                        p === '…' ? (
                          <span
                            key={`e${i}`}
                            className="px-1.5 text-xs font-medium text-gray-600"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition-all ${
                              p === currentPage
                                ? 'border border-amber-500/30 bg-amber-500/20 text-amber-400 shadow-md shadow-amber-900/10'
                                : 'border border-white/[0.08] bg-white/3 text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="flex h-8 items-center justify-center gap-1 rounded-lg border border-white/[0.08] bg-white/3 px-2.5 text-xs text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={currentPage >= totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/3 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                      title="Last page"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <ChevronRight className="-ml-1.5 h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
      {galleryItem && (
        <GalleryModal
          achievement={galleryItem}
          onClose={() => setGalleryItem(null)}
        />
      )}
      {historyOpen && (
        <ParticipationHistoryModal
          initialParticipations={initialParticipations}
          users={users}
          achievements={initialAchievements}
          onClose={() => setHistoryOpen(false)}
        />
      )}
      {journeyOpen && (
        <JourneyModal
          initialItems={initialJourney}
          onClose={() => setJourneyOpen(false)}
        />
      )}
    </PageShell>
  );
}
