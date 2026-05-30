/**
 * @file Blog management client component
 * @module BlogManagementClient
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Star,
  Search,
  Eye,
  Heart,
  MessageSquare,
  FileEdit,
  CheckCircle2,
  LayoutGrid,
  LayoutList,
  Edit3,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ExternalLink,
} from 'lucide-react';
import BlogCard from './BlogCard';
import BlogFormPanel from './BlogFormPanel';
import CommentsModal from './CommentsModal';
import {
  getStatusConfig,
  getCategoryConfig,
  formatBlogDate,
  formatRelativeDate,
  CATEGORIES,
  SORT_OPTIONS,
  sortPosts,
} from './blogConfig';
import {
  PageShell,
  PageHeader,
  StatCard,
  TabBar,
  EmptyState,
} from '@/app/account/_components/ui';
import toast from 'react-hot-toast';
import {
  toggleBlogFeaturedAction,
  deleteBlogAction,
} from '@/app/_lib/actions/blog-actions';

const PAGE_SIZE = 12;

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'featured', label: 'Featured' },
];

function BlogTableRow({
  post,
  onEdit,
  onViewComments,
  onPostChange,
  onPostDelete,
}) {
  const router = useRouter();
  const [featuredPending, setFeaturedPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const sc = getStatusConfig(post.status);
  const cc = getCategoryConfig(post.category);
  const author = post.users;

  async function handleToggleFeatured(e) {
    e.preventDefault();
    e.stopPropagation();
    setFeaturedPending(true);
    const fd = new FormData();
    fd.set('id', post.id);
    fd.set('featured', String(!post.is_featured));
    const result = await toggleBlogFeaturedAction(fd);
    setFeaturedPending(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      onPostChange?.(post.id, { is_featured: !post.is_featured });
      toast.success(
        post.is_featured ? 'Removed from featured' : 'Marked as featured'
      );
    }
  }

  async function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    setDeletePending(true);
    const fd = new FormData();
    fd.set('id', post.id);
    const result = await deleteBlogAction(fd);
    setDeletePending(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      onPostDelete?.(post.id);
      toast.success('Post deleted successfully');
    }
  }

  return (
    <tr className="group cursor-pointer transition-colors hover:bg-white/[0.025]">
      {/* Blog Info */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-500/20 bg-blue-500/10 transition-colors group-hover:border-blue-500/40">
            {post.thumbnail ? (
              <img
                src={post.thumbnail}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl opacity-50 select-none">{cc.emoji}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white transition-colors group-hover:text-blue-300">
              {post.title}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-gray-500">
                {cc.emoji} {cc.short}
              </span>
              <span className="text-gray-700 select-none">•</span>
              <span className="text-[10px] text-gray-500">
                @{(author?.full_name ?? 'unknown').split(' ')[0].toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${sc.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </span>
      </td>

      {/* Featured */}
      <td className="px-5 py-3.5 text-center">
        <div className="flex items-center justify-center">
          {post.is_featured ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              <Star className="h-2.5 w-2.5 fill-current" />
              Featured
            </span>
          ) : (
            <span className="text-xs text-gray-600">—</span>
          )}
        </div>
      </td>

      {/* Views */}
      <td className="px-5 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-blue-400/60" />
          <span className="text-sm font-medium text-white tabular-nums">
            {(post.views ?? 0).toLocaleString()}
          </span>
        </div>
      </td>

      {/* Likes */}
      <td className="px-5 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-rose-400/60" />
          <span className="text-sm font-medium text-white tabular-nums">
            {post.likes ?? 0}
          </span>
        </div>
      </td>

      {/* Comments */}
      <td className="px-5 py-3.5 text-center">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onViewComments(post);
          }}
          className="mx-auto flex items-center justify-center gap-1.5 transition-colors hover:text-violet-400"
        >
          <MessageSquare className="h-3.5 w-3.5 text-violet-400/60" />
          <span className="text-sm font-medium text-white tabular-nums">
            {post.commentCount ?? 0}
          </span>
          {post.pendingComments > 0 && (
            <span className="ml-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] text-amber-400">
              !{post.pendingComments}
            </span>
          )}
        </button>
      </td>

      {/* Date */}
      <td className="px-5 py-3.5">
        <span
          className="font-mono text-xs text-gray-500"
          title={formatBlogDate(post.created_at)}
        >
          {formatRelativeDate(post.created_at)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(post);
            }}
            className="rounded-lg border border-transparent p-1.5 text-gray-500 transition-all hover:border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400"
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleToggleFeatured}
            disabled={featuredPending}
            className={`rounded-lg border border-transparent p-1.5 transition-all ${
              post.is_featured
                ? 'text-amber-400 hover:border-amber-500/20 hover:bg-amber-500/10'
                : 'text-gray-500 hover:border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-400'
            }`}
            title={post.is_featured ? 'Unfeature' : 'Feature'}
          >
            {featuredPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Star
                className={`h-3.5 w-3.5 ${post.is_featured ? 'fill-current' : ''}`}
              />
            )}
          </button>

          {post.status === 'published' && (
            <Link
              href={`/blogs/${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg border border-transparent p-1.5 text-gray-500 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400"
              title="Preview"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}

          {deleteConfirm ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDelete}
                disabled={deletePending}
                className="rounded bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-300 transition-all hover:bg-red-500/30"
              >
                Confirm
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteConfirm(false);
                }}
                className="px-1 text-[10px] text-gray-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteConfirm(true);
              }}
              className="rounded-lg border border-transparent p-1.5 text-gray-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function BlogManagementClient({ initialPosts }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts ?? []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [formModal, setFormModal] = useState(null); // null | { mode, post? }
  const [commentsModal, setCommentsModal] = useState(null); // post | null
  const [page, setPage] = useState(1);

  // Sync server changes to local state
  useEffect(() => {
    setPosts(initialPosts ?? []);
  }, [initialPosts]);

  const handleSaved = useCallback(() => {
    router.refresh();
    setFormModal(null);
  }, [router]);

  const handlePostChange = useCallback((postId, changes) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...changes } : p))
    );
  }, []);

  const handlePostDelete = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const stats = useMemo(
    () => ({
      total: posts.length,
      published: posts.filter((p) => p.status === 'published').length,
      draft: posts.filter((p) => p.status === 'draft').length,
      featured: posts.filter((p) => p.is_featured).length,
      totalViews: posts.reduce((s, p) => s + (p.views ?? 0), 0),
    }),
    [posts]
  );

  const filtered = useMemo(() => {
    let result = posts.filter((p) => {
      const matchesTab =
        statusFilter === 'all' ||
        (statusFilter === 'featured'
          ? p.is_featured
          : p.status === statusFilter);
      const matchesSearch =
        !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
        p.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = !categoryFilter || p.category === categoryFilter;
      return matchesTab && matchesSearch && matchesCat;
    });
    return sortPosts(result, sortBy);
  }, [posts, statusFilter, search, categoryFilter, sortBy]);

  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusTabs = STATUS_TABS.map((t) => ({
    ...t,
    count:
      t.value === 'all'
        ? posts.length
        : t.value === 'featured'
          ? posts.filter((p) => p.is_featured).length
          : posts.filter((p) => p.status === t.value).length,
  }));

  return (
    <>
      <PageShell>
        <PageHeader
          icon={BookOpen}
          title="Blog Management"
          subtitle={`${stats.total} post${stats.total !== 1 ? 's' : ''} · ${stats.totalViews.toLocaleString()} total views`}
          accent="blue"
          actions={
            <button
              onClick={() => setFormModal({ mode: 'create' })}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
            >
              <Plus className="h-4 w-4" />
              New Post
            </button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Total Posts"
            value={stats.total}
            accent="blue"
            delay={0}
          />
          <StatCard
            icon={CheckCircle2}
            label="Published"
            value={stats.published}
            accent="emerald"
            delay={0.05}
          />
          <StatCard
            icon={Star}
            label="Featured"
            value={stats.featured}
            accent="amber"
            delay={0.1}
          />
          <StatCard
            icon={Eye}
            label="Total Views"
            value={
              stats.totalViews >= 1000
                ? `${(stats.totalViews / 1000).toFixed(1)}k`
                : stats.totalViews.toLocaleString()
            }
            accent="sky"
            delay={0.15}
          />
        </div>

        {/* Status Tabs */}
        <TabBar
          tabs={statusTabs}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
          }}
        />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search bar */}
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts by title, excerpt, tag, author…"
              className="w-full rounded-xl border border-white/8 bg-white/3 py-2.5 pr-9 pl-10 text-sm text-white transition-all outline-none placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters Select row */}
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 pr-8 text-xs text-white transition-all outline-none focus:border-blue-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryConfig(cat).label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3 w-3 -translate-y-1/2 text-gray-500" />
            </div>

            {/* Sorting */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 pr-8 text-xs text-white transition-all outline-none focus:border-blue-500/50"
                style={{ colorScheme: 'dark' }}
              >
                {SORT_OPTIONS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3 w-3 -translate-y-1/2 text-gray-500" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-all ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-1.5 transition-all ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                title="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Indicator / Reset */}
        {(search || statusFilter !== 'all' || categoryFilter) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              Showing{' '}
              <span className="font-medium text-white">{filtered.length}</span>{' '}
              of <span className="font-medium text-white">{posts.length}</span>{' '}
              posts
            </span>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setCategoryFilter('');
              }}
              className="ml-2 flex items-center gap-1 font-medium text-blue-400 transition-colors hover:text-blue-300"
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
              icon={BookOpen}
              title={
                search || statusFilter !== 'all' || categoryFilter
                  ? 'No posts found'
                  : 'No posts yet'
              }
              description={
                search || statusFilter !== 'all' || categoryFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first blog post to share updates.'
              }
              action={
                search || statusFilter !== 'all' || categoryFilter ? (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('all');
                      setCategoryFilter('');
                    }}
                    className="text-xs font-medium text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
                  >
                    Clear all filters
                  </button>
                ) : (
                  <button
                    onClick={() => setFormModal({ mode: 'create' })}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Post
                  </button>
                )
              }
            />
          </div>
        )}

        {/* Grid View */}
        {filtered.length > 0 && viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map((post) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  onEdit={(p) => setFormModal({ mode: 'edit', post: p })}
                  onViewComments={(p) => setCommentsModal(p)}
                  onPostChange={handlePostChange}
                  onPostDelete={handlePostDelete}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={filtered.length}
              onPage={setPage}
            />
          </>
        )}

        {/* List View */}
        {filtered.length > 0 && viewMode === 'list' && (
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      Post
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      Featured
                    </th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      Views
                    </th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      Likes
                    </th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      Comments
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {paginated.map((post) => (
                    <BlogTableRow
                      key={post.id}
                      post={post}
                      onEdit={(p) => setFormModal({ mode: 'edit', post: p })}
                      onViewComments={(p) => setCommentsModal(p)}
                      onPostChange={handlePostChange}
                      onPostDelete={handlePostDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/6 px-5 py-3">
              <span className="text-xs text-gray-500">
                {filtered.length} post{filtered.length !== 1 ? 's' : ''}
              </span>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                onPage={setPage}
                compact
              />
            </div>
          </div>
        )}
      </PageShell>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {formModal && (
        <BlogFormPanel
          post={formModal.post ?? null}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}
      {commentsModal && (
        <CommentsModal
          post={commentsModal}
          onClose={() => setCommentsModal(null)}
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
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="rounded-lg p-1 text-gray-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="px-1 text-xs text-gray-400">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg p-1 text-gray-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <span className="text-xs text-gray-500">
        Showing{' '}
        <span className="font-medium text-white">
          {start}–{end}
        </span>{' '}
        of <span className="font-medium text-white">{total}</span> posts
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 text-xs text-gray-600 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`h-7.5 min-w-7.5 rounded-lg text-xs font-medium transition-all ${
                p === page
                  ? 'border border-blue-500/30 bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
