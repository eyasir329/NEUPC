'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Plus,
  Search,
  Terminal,
  LayoutGrid,
  LayoutList,
  Star,
  Zap,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const PAGE_SIZE = 12;
import RoadmapCard from './RoadmapCard';
import RoadmapTableRow from './RoadmapTableRow';
import RoadmapFormPanel from './RoadmapFormPanel';
import {
  sortRoadmaps,
  SORT_OPTIONS,
  CATEGORIES,
  DIFFICULTIES,
  getCategoryConfig,
  getDifficultyConfig,
} from './roadmapConfig';
import toast from 'react-hot-toast';
import { PageShell, PageHeader, StatCard, TabBar, EmptyState } from '@/app/account/_components/ui';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

export default function RoadmapManagementClient({ initialRoadmaps }) {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps ?? []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [sortKey, setSortKey] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [formModal, setFormModal] = useState(null); // null | { mode, roadmap? }
  const [page, setPage] = useState(1);

  // Sync server changes to local state
  useEffect(() => {
    setRoadmaps(initialRoadmaps ?? []);
  }, [initialRoadmaps]);

  const handleSaved = useCallback(() => {
    router.refresh();
    setFormModal(null);
  }, [router]);

  const stats = useMemo(() => ({
    total: roadmaps.length,
    published: roadmaps.filter((r) => r.status === 'published').length,
    draft: roadmaps.filter((r) => r.status === 'draft').length,
    featured: roadmaps.filter((r) => r.is_featured).length,
    totalViews: roadmaps.reduce((s, r) => s + (r.views ?? 0), 0),
  }), [roadmaps]);

  const filtered = useMemo(() => {
    let result = roadmaps.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchCategory = !categoryFilter || r.category === categoryFilter;
      const matchDifficulty = !difficultyFilter || r.difficulty === difficultyFilter;
      const matchSearch =
        !search ||
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchCategory && matchDifficulty && matchSearch;
    });
    return sortRoadmaps(result, sortKey);
  }, [roadmaps, statusFilter, categoryFilter, difficultyFilter, search, sortKey]);

  // Reset to page 1 when filters/sort change
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, difficultyFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusTabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.value === 'all' ? roadmaps.length : roadmaps.filter((r) => r.status === t.value).length,
  }));

  return (
    <>
      <PageShell>
        <PageHeader
          icon={Compass}
          title="Roadmap Management"
          subtitle={`${stats.total} learning paths · ${stats.totalViews.toLocaleString()} total views`}
          accent="blue"
          actions={
            <button
              onClick={() => setFormModal({ mode: 'create' })}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
            >
              <Plus className="h-4 w-4" />
              New Roadmap
            </button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Compass} label="Total Paths" value={stats.total} accent="blue" delay={0} />
          <StatCard icon={Zap} label="Published" value={stats.published} accent="emerald" delay={0.05} />
          <StatCard icon={Star} label="Featured" value={stats.featured} accent="amber" delay={0.1} />
          <StatCard icon={Eye} label="Total Views" value={stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews.toLocaleString()} accent="sky" delay={0.15} />
        </div>

        {/* Status Tabs */}
        <TabBar tabs={statusTabs} value={statusFilter} onChange={(v) => { setStatusFilter(v); }} />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roadmaps by title, description, category…"
              className="w-full bg-white/3 border border-white/8 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-gray-600 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters Select row */}
          <div className="flex items-center flex-wrap gap-2 sm:ml-auto">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-white/3 border border-white/8 text-white text-xs rounded-xl px-3 py-2.5 pr-8 outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryConfig(cat).short || cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
            </div>

            {/* Difficulty Filter */}
            <div className="relative">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="appearance-none bg-white/3 border border-white/8 text-white text-xs rounded-xl px-3 py-2.5 pr-8 outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">All Levels</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {getDifficultyConfig(d).label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
            </div>

            {/* Sorting */}
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="appearance-none bg-white/3 border border-white/8 text-white text-xs rounded-xl px-3 py-2.5 pr-8 outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                {SORT_OPTIONS.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white/3 border border-white/8 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                title="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Indicator / Reset */}
        {(search || statusFilter !== 'all' || categoryFilter || difficultyFilter) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              Showing <span className="text-white font-medium">{filtered.length}</span> of{' '}
              <span className="text-white font-medium">{roadmaps.length}</span> paths
            </span>
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter(''); setDifficultyFilter(''); }}
              className="ml-2 flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/8 bg-white/2 py-4">
            <EmptyState
              icon={Terminal}
              title={search || statusFilter !== 'all' || categoryFilter || difficultyFilter ? 'No paths found' : 'No roadmaps yet'}
              description={
                search || statusFilter !== 'all' || categoryFilter || difficultyFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first learning roadmap to guide members.'
              }
              action={
                search || statusFilter !== 'all' || categoryFilter || difficultyFilter ? (
                  <button
                    onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter(''); setDifficultyFilter(''); }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium underline underline-offset-2"
                  >
                    Clear all filters
                  </button>
                ) : (
                  <button
                    onClick={() => setFormModal({ mode: 'create' })}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Roadmap
                  </button>
                )
              }
            />
          </div>
        )}

        {/* Grid View */}
        {filtered.length > 0 && viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginated.map((r) => (
                <RoadmapCard
                  key={r.id}
                  roadmap={r}
                  onEdit={(selectedRoadmap) => setFormModal({ mode: 'edit', roadmap: selectedRoadmap })}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
          </>
        )}

        {/* List View */}
        {filtered.length > 0 && viewMode === 'list' && (
          <div className="rounded-2xl overflow-hidden border border-white/8 bg-white/2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Path</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Featured</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Views</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Duration</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {paginated.map((r) => (
                    <RoadmapTableRow
                      key={r.id}
                      roadmap={r}
                      onEdit={(selectedRoadmap) => setFormModal({ mode: 'edit', roadmap: selectedRoadmap })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/6 px-5 py-3 flex items-center justify-between gap-4">
              <span className="text-xs text-gray-500">
                {filtered.length} path{filtered.length !== 1 ? 's' : ''}
              </span>
              <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} compact />
            </div>
          </div>
        )}
      </PageShell>

      {formModal && (
        <RoadmapFormPanel
          roadmap={formModal.roadmap ?? null}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

function Pagination({ page, totalPages, total, onPage, compact = false }) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  // Build page numbers with ellipsis
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1 rounded-lg text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs text-gray-400 px-1">{page} / {totalPages}</span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-1 rounded-lg text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <span className="text-xs text-gray-500">
        Showing <span className="text-white font-medium">{start}–{end}</span> of{' '}
        <span className="text-white font-medium">{total}</span> paths
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-600 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`min-w-7.5 h-7.5 rounded-lg text-xs font-medium transition-all ${
                p === page
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
