'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import BlogCard from './BlogCard';
import BlogFormModal from './BlogFormModal';
import CommentsModal from './CommentsModal';
import { getStatusConfig, CATEGORIES, getCategoryConfig } from './blogConfig';

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
  const [posts, setPosts] = useState(initialPosts ?? []);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formModal, setFormModal] = useState(null); // null | { mode, post? }
  const [commentsModal, setCommentsModal] = useState(null); // post | null

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

  // ── filtered posts ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return posts.filter((p) => {
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
  }, [posts, activeTab, search, categoryFilter]);

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Blog Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {live.total} post{live.total !== 1 ? 's' : ''} · {live.published}{' '}
              published · {live.totalViews.toLocaleString()} total views
            </p>
          </div>
          <button
            onClick={() => setFormModal({ mode: 'create' })}
            className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-95"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New Post
          </button>
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

          <div className="flex gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts…"
                className="w-48 rounded-xl border border-white/8 bg-white/4 py-2 pr-3 pl-8 text-xs text-white placeholder-gray-600 transition-all outline-none focus:w-64 focus:border-white/20 focus:bg-white/6"
              />
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
        </div>

        {/* ── Post grid ─────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyState
            tab={activeTab}
            onCreateClick={() => setFormModal({ mode: 'create' })}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                onEdit={(p) => setFormModal({ mode: 'edit', post: p })}
                onViewComments={(p) => setCommentsModal(p)}
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
