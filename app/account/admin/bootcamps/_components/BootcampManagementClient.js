'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Plus,
  Search,
  Terminal,
  LayoutGrid,
  LayoutList,
  Users,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const PAGE_SIZE = 12;
import BootcampCard from './BootcampCard';
import BootcampFormModal from './BootcampFormModal';
import BootcampTableRow from './BootcampTableRow';
import { sortBootcamps, SORT_OPTIONS } from '@/app/account/_components/bootcamps/bootcampConfig';
import { deleteBootcamp, toggleBootcampFeatured } from '@/app/_lib/bootcamp-actions';
import toast from 'react-hot-toast';
import { PageShell, PageHeader, StatCard, TabBar, EmptyState } from '../../_components/_ui';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

export default function BootcampManagementClient({ initialBootcamps }) {
  const router = useRouter();
  const [bootcamps, setBootcamps] = useState(initialBootcamps ?? []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [formModal, setFormModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [page, setPage] = useState(1);

  useEffect(() => {
    setBootcamps((initialBootcamps ?? []).filter((b) => !deletedIds.has(b.id)));
  }, [initialBootcamps, deletedIds]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Permanently delete this bootcamp? This cannot be undone.')) return;
    setDeleteLoading(id);
    try {
      await deleteBootcamp(id);
      setDeletedIds((prev) => new Set(prev).add(id));
      setBootcamps((prev) => prev.filter((b) => b.id !== id));
      toast.success('Bootcamp deleted successfully');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to delete bootcamp');
    } finally {
      setDeleteLoading(null);
    }
  }, [router]);

  const handleToggleFeatured = useCallback(async (id) => {
    try {
      await toggleBootcampFeatured(id);
      setBootcamps((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_featured: !b.is_featured } : b))
      );
      toast.success('Featured status updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update featured status');
    }
  }, []);

  const handleSaved = useCallback(() => {
    router.refresh();
    setFormModal(null);
  }, [router]);

  const stats = useMemo(() => ({
    total: bootcamps.length,
    published: bootcamps.filter((b) => b.status === 'published').length,
    draft: bootcamps.filter((b) => b.status === 'draft').length,
    totalEnrollments: bootcamps.reduce((s, b) => s + (b.enrollment_count ?? 0), 0),
    totalLessons: bootcamps.reduce((s, b) => s + (b.total_lessons ?? 0), 0),
  }), [bootcamps]);

  const filtered = useMemo(() => {
    let result = bootcamps.filter((b) => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchSearch =
        !search ||
        b.title?.toLowerCase().includes(search.toLowerCase()) ||
        b.description?.toLowerCase().includes(search.toLowerCase()) ||
        b.batch_info?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
    return sortBootcamps(result, sortKey);
  }, [bootcamps, statusFilter, search, sortKey]);

  // Reset to page 1 when filters/sort change
  useEffect(() => { setPage(1); }, [search, statusFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusTabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.value === 'all' ? bootcamps.length : bootcamps.filter((b) => b.status === t.value).length,
  }));

  return (
    <>
      <PageShell>
        <PageHeader
          icon={GraduationCap}
          title="Bootcamp Management"
          subtitle={`${stats.total} learning tracks · ${stats.totalEnrollments} total enrollments`}
          accent="violet"
          actions={
            <button
              onClick={() => setFormModal({ mode: 'create' })}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,92,255,0.35)]"
            >
              <Plus className="h-4 w-4" />
              New Track
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={GraduationCap} label="Total Tracks" value={stats.total} accent="violet" delay={0} />
          <StatCard icon={Zap} label="Published" value={stats.published} accent="emerald" delay={0.05} />
          <StatCard icon={Users} label="Total Students" value={stats.totalEnrollments} accent="blue" delay={0.1} />
          <StatCard icon={BookOpen} label="Total Lessons" value={stats.totalLessons} accent="amber" delay={0.15} />
        </div>

        {/* Status tabs */}
        <TabBar tabs={statusTabs} value={statusFilter} onChange={(v) => { setStatusFilter(v); }} />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracks, descriptions, batches…"
              className="w-full bg-white/3 border border-white/8 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-gray-600 transition-all"
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

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="appearance-none bg-white/3 border border-white/8 text-white text-xs rounded-xl px-3 py-2.5 pr-8 outline-none focus:border-violet-500/50 transition-all cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                {SORT_OPTIONS.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1 bg-white/3 border border-white/8 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-gray-300'}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-gray-300'}`}
                title="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results summary */}
        {(search || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              Showing <span className="text-white font-medium">{filtered.length}</span> of{' '}
              <span className="text-white font-medium">{bootcamps.length}</span> tracks
            </span>
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="ml-2 flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/8 bg-white/2 py-4">
            <EmptyState
              icon={Terminal}
              title={search || statusFilter !== 'all' ? 'No tracks found' : 'No tracks yet'}
              description={
                search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first learning track to get started.'
              }
              action={
                search || statusFilter !== 'all' ? (
                  <button
                    onClick={() => { setSearch(''); setStatusFilter('all'); }}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium underline underline-offset-2"
                  >
                    Clear all filters
                  </button>
                ) : (
                  <button
                    onClick={() => setFormModal({ mode: 'create' })}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Track
                  </button>
                )
              }
            />
          </div>
        )}

        {/* Grid view */}
        {filtered.length > 0 && viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginated.map((b) => (
                <BootcampCard
                  key={b.id}
                  bootcamp={b}
                  onToggleFeatured={handleToggleFeatured}
                  onDelete={handleDelete}
                  deleteLoading={deleteLoading === b.id}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
          </>
        )}

        {/* List view */}
        {filtered.length > 0 && viewMode === 'list' && (
          <div className="rounded-2xl overflow-hidden border border-white/8 bg-white/2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Track</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Students</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Lessons</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {paginated.map((b) => (
                    <BootcampTableRow
                      key={b.id}
                      bootcamp={b}
                      onToggleFeatured={handleToggleFeatured}
                      onDelete={handleDelete}
                      deleteLoading={deleteLoading === b.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/6 px-5 py-3 flex items-center justify-between gap-4">
              <span className="text-xs text-gray-500">
                {filtered.length} track{filtered.length !== 1 ? 's' : ''}
              </span>
              <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} compact />
            </div>
          </div>
        )}
      </PageShell>

      {formModal && (
        <BootcampFormModal
          bootcamp={formModal.bootcamp ?? null}
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

  // Build page number list with ellipsis
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
        <span className="text-white font-medium">{total}</span> tracks
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
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
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
