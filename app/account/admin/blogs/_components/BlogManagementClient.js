/**
 * @file Blog management client — full-featured admin interface for
 *   listing, filtering, creating, editing, publishing, and featuring
 *   blog posts with comment and engagement data.
 * @module AdminBlogManagementClient
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Star,
  Search,
  PlusCircle,
  Eye,
  Heart,
  MessageSquare,
  TrendingUp,
  FileEdit,
  CheckCircle2,
  Archive,
  Layers,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  Clock,
  User,
  ExternalLink,
  Edit3,
  Trash2,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import BlogCard from './BlogCard';
import BlogFormModal from './BlogFormModal';
import CommentsModal from './CommentsModal';
import {
  getStatusConfig,
  getCategoryConfig,
  formatBlogDate,
  formatRelativeDate,
  CATEGORIES,
  STATUSES,
  SORT_OPTIONS,
  sortPosts,
} from './blogConfig';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, colorClass, sub }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3.5 backdrop-blur-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl leading-none font-bold text-white tabular-nums">
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-gray-500">{label}</p>
        {sub && (
          <p className="mt-0.5 truncate text-[10px] text-gray-600">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab, onCreateClick }) {
  const msgs = {
    all: {
      icon: BookOpen,
      title: 'No posts yet',
      sub: 'Create your first blog post to get started.',
    },
    draft: {
      icon: FileEdit,
      title: 'No draft posts',
      sub: 'Drafts appear here when saved unpublished.',
    },
    published: { icon: CheckCircle2, title: 'No published posts', sub: '' },
    archived: { icon: Archive, title: 'No archived posts', sub: '' },
    featured: {
      icon: Star,
      title: 'No featured posts',
      sub: 'Star a post to feature it on the homepage.',
    },
  };
  const { icon: Icon, title, sub } = msgs[tab] ?? msgs.all;
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/3 py-20 text-center">
      <Icon className="mb-4 h-12 w-12 text-gray-700" />
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      {sub && <p className="mt-1 text-xs text-gray-600">{sub}</p>}
      {tab === 'all' && (
        <button
          onClick={onCreateClick}
          className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500"
        >
          <PlusCircle className="h-3.5 w-3.5" /> New Post
        </button>
      )}
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-white/12 text-white shadow-sm'
          : 'text-gray-500 hover:bg-white/6 hover:text-gray-300'
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${active ? 'bg-white/15 text-white' : 'bg-white/6 text-gray-600'}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export default function BlogManagementClient({ initialPosts, stats }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts ?? []);

  // Sync local state when server re-renders with fresh data (after router.refresh())
  useEffect(() => {
    setPosts(initialPosts ?? []);
  }, [initialPosts]);

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formModal, setFormModal] = useState(null); // null | { mode, post? }
  const [commentsModal, setCommentsModal] = useState(null); // post | null
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [sortOpen, setSortOpen] = useState(false);

  // ── state sync handlers ───────────────────────────────────────────────
  const handlePostChange = useCallback((postId, changes) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...changes } : p))
    );
  }, []);

  const handlePostDelete = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const handleSaved = useCallback(() => {
    // Refresh server data so local state picks up new/edited posts
    router.refresh();
    // Re-fetch fresh posts after a short delay for revalidation to complete
    const timer = setTimeout(() => {
      router.refresh();
    }, 500);
    return () => clearTimeout(timer);
  }, [router]);

  // ── derived stats ─────────────────────────────────────────────────────────
  const live = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    archived: posts.filter((p) => p.status === 'archived').length,
    featured: posts.filter((p) => p.is_featured).length,
    totalViews: posts.reduce((s, p) => s + (p.views ?? 0), 0),
    totalComments: posts.reduce((s, p) => s + (p.commentCount ?? 0), 0),
    pendingComments: posts.reduce((s, p) => s + (p.pendingComments ?? 0), 0),
  };

  // ── filtered + sorted posts ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const result = posts.filter((p) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'featured' ? p.is_featured : p.status === activeTab);
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
  }, [posts, activeTab, search, categoryFilter, sortBy]);

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-xl font-bold text-white sm:text-2xl">
              <BookOpen className="h-6 w-6 text-blue-400 sm:h-7 sm:w-7" />
              Blog Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {live.total} post{live.total !== 1 ? 's' : ''} · {live.published}{' '}
              published · {live.totalViews.toLocaleString()} total views
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/account/admin"
              className="rounded-xl bg-white/6 px-4 py-2.5 text-xs font-medium text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              ← Dashboard
            </Link>
            <button
              onClick={() => setFormModal({ mode: 'create' })}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-95"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Post
            </button>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={Layers}
            label="Total Posts"
            value={live.total}
            colorClass="bg-gray-700/50 text-gray-300"
          />
          <StatCard
            icon={CheckCircle2}
            label="Published"
            value={live.published}
            colorClass="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard
            icon={FileEdit}
            label="Drafts"
            value={live.draft}
            colorClass="bg-gray-600/20 text-gray-400"
          />
          <StatCard
            icon={Star}
            label="Featured"
            value={live.featured}
            colorClass="bg-amber-500/15 text-amber-400"
          />
          <StatCard
            icon={Eye}
            label="Total Views"
            value={
              live.totalViews >= 1000
                ? `${(live.totalViews / 1000).toFixed(1)}k`
                : live.totalViews
            }
            colorClass="bg-blue-500/15 text-blue-400"
          />
          <StatCard
            icon={MessageSquare}
            label="Comments"
            value={live.totalComments}
            colorClass="bg-violet-500/15 text-violet-400"
            sub={
              live.pendingComments > 0
                ? `${live.pendingComments} pending`
                : undefined
            }
          />
        </div>

        {/* ── Tabs + filters ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="scrollbar-hide flex gap-1 overflow-x-auto pb-1">
              <TabButton
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                count={live.total}
              >
                All
              </TabButton>
              <TabButton
                active={activeTab === 'published'}
                onClick={() => setActiveTab('published')}
                count={live.published}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{' '}
                Published
              </TabButton>
              <TabButton
                active={activeTab === 'draft'}
                onClick={() => setActiveTab('draft')}
                count={live.draft}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Draft
              </TabButton>
              <TabButton
                active={activeTab === 'archived'}
                onClick={() => setActiveTab('archived')}
                count={live.archived}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{' '}
                Archived
              </TabButton>
              <TabButton
                active={activeTab === 'featured'}
                onClick={() => setActiveTab('featured')}
                count={live.featured}
              >
                <Star className="h-3 w-3" /> Featured
              </TabButton>
            </div>

            {/* View mode toggle */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/8 bg-white/3 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/12 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white/12 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                Table
              </button>
            </div>
          </div>

          {/* Search + Sort + Category */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts by title, author, tag…"
                className="w-full rounded-xl border border-white/8 bg-white/4 py-2 pr-3 pl-8 text-xs text-white placeholder-gray-600 transition-all outline-none focus:border-white/20 focus:bg-white/6"
              />
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-gray-300 transition-colors hover:border-white/15 hover:text-white"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
                {SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? 'Sort'}
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              {sortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSortOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-2xl">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortBy(opt.key);
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-white/6 ${
                          sortBy === opt.key
                            ? 'bg-white/6 text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none rounded-xl border border-white/8 bg-white/4 py-2 pr-8 pl-3 text-xs text-gray-300 outline-none focus:border-white/20"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryConfig(cat).label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          {(search || categoryFilter || activeTab !== 'all') && (
            <p className="text-[11px] text-gray-600">
              Showing {filtered.length} of {posts.length} post
              {posts.length !== 1 ? 's' : ''}
              {search && (
                <span>
                  {' '}
                  matching &quot;
                  <span className="text-gray-400">{search}</span>&quot;
                </span>
              )}
            </p>
          )}
        </div>

        {/* ── Post grid / table ───────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyState
            tab={activeTab}
            onCreateClick={() => setFormModal({ mode: 'create' })}
          />
        ) : viewMode === 'table' ? (
          /* ── Table View ──────────────────────────────────────────────── */
          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/8 bg-white/4">
                  <th className="px-4 py-3 font-semibold text-gray-400">
                    Post
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-gray-400 md:table-cell">
                    Author
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-400">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-gray-400 lg:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-400">
                    Views
                  </th>
                  <th className="hidden px-4 py-3 text-right font-semibold text-gray-400 sm:table-cell">
                    Likes
                  </th>
                  <th className="hidden px-4 py-3 text-right font-semibold text-gray-400 sm:table-cell">
                    Comments
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-gray-400 lg:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((post) => {
                  const tsc = getStatusConfig(post.status);
                  const tcc = getCategoryConfig(post.category);
                  return (
                    <tr
                      key={post.id}
                      className="transition-colors hover:bg-white/3"
                    >
                      <td className="max-w-xs px-4 py-3">
                        <div className="flex items-center gap-3">
                          {post.thumbnail ? (
                            <img
                              src={post.thumbnail}
                              alt=""
                              className="hidden h-8 w-12 shrink-0 rounded-lg object-cover sm:block"
                            />
                          ) : (
                            <div
                              className={`hidden h-8 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br sm:flex ${tsc.gradient}`}
                            >
                              <span className="text-sm opacity-60">
                                {tcc.emoji}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {post.title}
                            </p>
                            {post.is_featured && (
                              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-amber-400">
                                <Star className="h-2.5 w-2.5 fill-current" />{' '}
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex items-center gap-2">
                          {post.users?.avatar_url ? (
                            <img
                              src={post.users.avatar_url}
                              alt=""
                              className="h-5 w-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-700">
                              <User className="h-3 w-3 text-gray-500" />
                            </div>
                          )}
                          <span className="truncate text-gray-400">
                            {post.users?.full_name ?? 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${tsc.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${tsc.dot}`}
                          />
                          {tsc.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        {post.category ? (
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${tcc.color}`}
                          >
                            {tcc.short}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 tabular-nums">
                        {(post.views ?? 0).toLocaleString()}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-gray-400 tabular-nums sm:table-cell">
                        {post.likes ?? 0}
                      </td>
                      <td className="hidden px-4 py-3 text-right sm:table-cell">
                        <span className="text-gray-400 tabular-nums">
                          {post.commentCount ?? 0}
                        </span>
                        {post.pendingComments > 0 && (
                          <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-400">
                            {post.pendingComments}
                          </span>
                        )}
                      </td>
                      <td
                        className="hidden px-4 py-3 text-gray-500 lg:table-cell"
                        title={formatBlogDate(post.created_at)}
                      >
                        {formatRelativeDate(post.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setFormModal({ mode: 'edit', post })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/8 hover:text-blue-400"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setCommentsModal(post)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/8 hover:text-violet-400"
                            title="Comments"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          {post.status === 'published' && (
                            <a
                              href={`/blogs/${post.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/8 hover:text-emerald-400"
                              title="View live"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Grid View ───────────────────────────────────────────────── */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((post) => (
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
        )}

        {/* ── Footer legend ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-white/6 bg-white/2 px-4 py-2.5 text-[11px] text-gray-600">
          <span className="font-semibold text-gray-500">Status Guide:</span>
          {[
            { dot: 'bg-gray-400', label: 'Draft – work in progress' },
            { dot: 'bg-emerald-400', label: 'Published – live on site' },
            { dot: 'bg-amber-400', label: 'Archived – hidden from public' },
          ].map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {formModal && (
        <BlogFormModal
          mode={formModal.mode}
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
