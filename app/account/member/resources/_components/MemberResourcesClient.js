/**
 * @file Member resources client — browsable library of learning
 *   materials, guides, and shared documents with category filters.
 * @module MemberResourcesClient
 */

'use client';

import {
  useState,
  useMemo,
  useTransition,
  useEffect,
  useCallback,
} from 'react';
import {
  BookOpen,
  Search,
  X,
  ChevronDown,
  Star,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  Tag,
  Filter,
  Layers,
  Clock,
  Zap,
  Video,
  FileText,
  GraduationCap,
  Wrench,
  BookMarked,
  Globe,
  Code2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { upvoteResourceAction } from '@/app/_lib/member-resources-actions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  article: {
    label: 'Article',
    Icon: FileText,
    color: 'text-blue-300',
    bg: 'bg-blue-500/12',
    border: 'border-blue-500/25',
  },
  video: {
    label: 'Video',
    Icon: Video,
    color: 'text-red-300',
    bg: 'bg-red-500/12',
    border: 'border-red-500/25',
  },
  course: {
    label: 'Course',
    Icon: GraduationCap,
    color: 'text-purple-300',
    bg: 'bg-purple-500/12',
    border: 'border-purple-500/25',
  },
  book: {
    label: 'Book',
    Icon: BookMarked,
    color: 'text-green-300',
    bg: 'bg-green-500/12',
    border: 'border-green-500/25',
  },
  tool: {
    label: 'Tool',
    Icon: Wrench,
    color: 'text-orange-300',
    bg: 'bg-orange-500/12',
    border: 'border-orange-500/25',
  },
  documentation: {
    label: 'Docs',
    Icon: Code2,
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/12',
    border: 'border-cyan-500/25',
  },
  other: {
    label: 'Other',
    Icon: Globe,
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
  },
};

const DIFFICULTY_CONFIG = {
  beginner: {
    label: 'Beginner',
    color: 'text-green-300',
    bg: 'bg-green-500/12',
    border: 'border-green-500/25',
  },
  intermediate: {
    label: 'Intermediate',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/12',
    border: 'border-yellow-500/25',
  },
  advanced: {
    label: 'Advanced',
    color: 'text-red-300',
    bg: 'bg-red-500/12',
    border: 'border-red-500/25',
  },
};

function typeConf(t) {
  return TYPE_CONFIG[t] || TYPE_CONFIG.other;
}
function diffConf(d) {
  return DIFFICULTY_CONFIG[d] || null;
}

// ─── Flash ────────────────────────────────────────────────────────────────────

function Flash({ msg, onClose }) {
  if (!msg) return null;
  const isErr = msg.type === 'error';
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
        isErr
          ? 'border-red-500/25 bg-red-500/8 text-red-300'
          : 'border-green-500/25 bg-green-500/8 text-green-300'
      }`}
    >
      {isErr ? (
        <AlertCircle className="h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      )}
      <span className="flex-1">{msg.text}</span>
      <button onClick={onClose}>
        <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
      </button>
    </div>
  );
}

// ─── Upvote Button ────────────────────────────────────────────────────────────

function UpvoteButton({ resourceId, initialCount, onFlash }) {
  const [pending, start] = useTransition();
  const [count, setCount] = useState(initialCount ?? 0);
  const [voted, setVoted] = useState(false);

  // Persist vote state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`upvoted_${resourceId}`);
    if (stored === '1') setVoted(true);
  }, [resourceId]);

  const handleUpvote = () => {
    if (voted) return;
    start(async () => {
      const res = await upvoteResourceAction(resourceId);
      if (res.error) {
        onFlash({ type: 'error', text: res.error });
      } else {
        setCount(res.newCount ?? count + 1);
        setVoted(true);
        localStorage.setItem(`upvoted_${resourceId}`, '1');
      }
    });
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={pending || voted}
      title={voted ? 'Already upvoted' : 'Upvote'}
      className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all ${
        voted
          ? 'cursor-default border border-blue-500/25 bg-blue-500/12 text-blue-300'
          : 'border border-white/8 bg-white/3 text-gray-500 hover:border-blue-500/25 hover:bg-blue-500/8 hover:text-blue-300 disabled:opacity-50'
      }`}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <ThumbsUp className="h-3 w-3" />
      )}
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

// ─── Bookmark Button ──────────────────────────────────────────────────────────

function BookmarkButton({ resourceId, saved, onToggle }) {
  return (
    <button
      onClick={() => onToggle(resourceId)}
      title={saved ? 'Remove bookmark' : 'Bookmark'}
      className={`flex items-center justify-center rounded-lg p-1.5 transition-all ${
        saved
          ? 'border border-yellow-500/30 bg-yellow-500/12 text-yellow-400'
          : 'border border-white/8 bg-white/3 text-gray-500 hover:border-yellow-500/25 hover:bg-yellow-500/8 hover:text-yellow-300'
      }`}
    >
      {saved ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({ resource, saved, onToggleSave, onFlash, featured }) {
  const tc = typeConf(resource.resource_type);
  const dc = resource.difficulty ? diffConf(resource.difficulty) : null;
  const TypeIcon = tc.Icon;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border transition-all ${
        featured
          ? 'border-yellow-500/20 bg-yellow-500/4 hover:border-yellow-500/35'
          : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5'
      }`}
    >
      {/* Thumbnail / type header */}
      <div
        className={`relative flex h-28 items-center justify-center overflow-hidden ${
          resource.thumbnail ? '' : 'bg-linear-to-br from-gray-800 to-gray-900'
        }`}
      >
        {resource.thumbnail ? (
          <img
            src={resource.thumbnail}
            alt=""
            className="h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <TypeIcon className={`h-10 w-10 opacity-20 ${tc.color}`} />
        )}
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm ${tc.bg} ${tc.border} ${tc.color}`}
          >
            {tc.label}
          </span>
          {dc && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm ${dc.bg} ${dc.border} ${dc.color}`}
            >
              {dc.label}
            </span>
          )}
        </div>
        {featured && (
          <div className="absolute top-2 right-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow" />
          </div>
        )}
        {!resource.is_free && (
          <div className="absolute right-2 bottom-2 rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-300 backdrop-blur-sm">
            Premium
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-bold text-white">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
            {resource.description}
          </p>
        )}

        {/* Tags */}
        {resource.tags?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/6 bg-white/4 px-1.5 py-0.5 text-[9px] text-gray-500"
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-[9px] text-gray-700">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-600">
          <Clock className="h-2.5 w-2.5" />
          <span>{timeAgo(resource.created_at)}</span>
          {resource.category && (
            <>
              <span className="text-white/15">·</span>
              <span className="truncate">{resource.category}</span>
            </>
          )}
        </div>

        {/* Action row */}
        <div className="mt-3 flex items-center gap-2">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
              featured
                ? 'border-yellow-500/30 bg-yellow-500/12 text-yellow-300 hover:bg-yellow-500/22'
                : 'border-blue-500/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
            }`}
          >
            Open <ArrowUpRight className="h-3 w-3" />
          </a>
          <BookmarkButton
            resourceId={resource.id}
            saved={saved}
            onToggle={onToggleSave}
          />
          <UpvoteButton
            resourceId={resource.id}
            initialCount={resource.upvotes}
            onFlash={onFlash}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Category Quick-Pick ──────────────────────────────────────────────────────

const CAT_ICONS = {
  Programming: { Icon: Code2, color: 'text-blue-400', bg: 'bg-blue-500/12' },
  Design: { Icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-500/12' },
  'Data Science': {
    Icon: Layers,
    color: 'text-green-400',
    bg: 'bg-green-500/12',
  },
  'AI & ML': { Icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/12' },
  Mathematics: {
    Icon: Filter,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/12',
  },
  Default: { Icon: Globe, color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

function CatIcon(cat) {
  return CAT_ICONS[cat] || CAT_ICONS.Default;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MemberResourcesClient({ resources, userId }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [savedIds, setSavedIds] = useState(new Set());
  const [flash, setFlash] = useState(null);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('bookmarked_resources') || '[]'
      );
      setSavedIds(new Set(stored));
    } catch {}
  }, []);

  const toggleSave = useCallback((resourceId) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(resourceId)) next.delete(resourceId);
      else next.add(resourceId);
      localStorage.setItem('bookmarked_resources', JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Auto-hide flash
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(id);
  }, [flash]);

  // Derived lists
  const featured = useMemo(
    () => resources.filter((r) => r.is_featured),
    [resources]
  );
  const categories = useMemo(
    () => ['all', ...new Set(resources.map((r) => r.category).filter(Boolean))],
    [resources]
  );
  const types = useMemo(
    () => [
      'all',
      ...new Set(resources.map((r) => r.resource_type).filter(Boolean)),
    ],
    [resources]
  );
  const recentlyAdded = useMemo(
    () =>
      [...resources]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6),
    [resources]
  );

  const applyFilters = useCallback(
    (list) => {
      return list.filter((r) => {
        if (catFilter !== 'all' && r.category !== catFilter) return false;
        if (typeFilter !== 'all' && r.resource_type !== typeFilter)
          return false;
        if (diffFilter !== 'all' && r.difficulty !== diffFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q))
        );
      });
    },
    [catFilter, typeFilter, diffFilter, search]
  );

  const allFiltered = useMemo(
    () => applyFilters(resources),
    [resources, applyFilters]
  );
  const featuredFiltered = useMemo(
    () => applyFilters(featured),
    [featured, applyFilters]
  );
  const freeFiltered = useMemo(
    () => applyFilters(resources.filter((r) => r.is_free)),
    [resources, applyFilters]
  );
  const savedFiltered = useMemo(
    () => applyFilters(resources.filter((r) => savedIds.has(r.id))),
    [resources, savedIds, applyFilters]
  );

  const tabResources = {
    all: allFiltered,
    featured: featuredFiltered,
    free: freeFiltered,
    saved: savedFiltered,
  };
  const tabEmpty = {
    all: 'No resources match your filters',
    featured: 'No featured resources',
    free: 'No free resources',
    saved: "You haven't bookmarked any resources yet",
  };

  function TabBtn({ id, label, count, accent }) {
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-all ${
          activeTab === id
            ? 'bg-white/12 text-white shadow-sm'
            : 'text-gray-500 hover:bg-white/6 hover:text-gray-300'
        }`}
      >
        {label}
        {count !== undefined && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
              accent
                ? 'bg-yellow-500/20 text-yellow-400'
                : activeTab === id
                  ? 'bg-white/15 text-white'
                  : 'bg-white/6 text-gray-600'
            }`}
          >
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Resources
          </h1>
          <p className="text-sm text-gray-500">
            Curated materials to enhance your skills
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('saved')}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-3.5 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/8"
          >
            <BookmarkCheck className="h-3.5 w-3.5 text-yellow-400" />
            Saved{' '}
            <span className="text-gray-600 tabular-nums">{savedIds.size}</span>
          </button>
        </div>
      </div>

      {/* ── Flash ───────────────────────────────────────────────────────── */}
      {flash && <Flash msg={flash} onClose={() => setFlash(null)} />}

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: BookOpen,
            label: 'Total Resources',
            value: resources.length,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            icon: Star,
            label: 'Featured',
            value: featured.length,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
          },
          {
            icon: Globe,
            label: 'Free',
            value: resources.filter((r) => r.is_free).length,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
          {
            icon: BookmarkCheck,
            label: 'Saved',
            value: savedIds.size,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
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

      {/* ── Category Quick-Pick ─────────────────────────────────────────── */}
      {categories.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const { Icon, color, bg } = CatIcon(cat);
            const isActive = catFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'border-white/20 bg-white/12 text-white'
                    : 'border-white/6 bg-white/2 text-gray-500 hover:border-white/12 hover:bg-white/6 hover:text-gray-300'
                }`}
              >
                <div
                  className={`rounded-lg p-1 ${isActive ? 'bg-white/10' : bg}`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${isActive ? 'text-white' : color}`}
                  />
                </div>
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Search + Filters ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by title, category, tags…"
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
        <div className="flex flex-wrap gap-2">
          {/* Type */}
          <div className="relative">
            <Layers className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-36 appearance-none rounded-xl border border-white/10 bg-white/4 py-2.5 pr-7 pl-8 text-sm text-white focus:border-white/20 focus:outline-none [&>option]:bg-gray-900"
            >
              <option value="all">All Types</option>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          </div>
          {/* Difficulty */}
          <div className="relative">
            <Zap className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              className="w-36 appearance-none rounded-xl border border-white/10 bg-white/4 py-2.5 pr-7 pl-8 text-sm text-white focus:border-white/20 focus:outline-none [&>option]:bg-gray-900"
            >
              <option value="all">All Levels</option>
              {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </div>

      {/* ── Featured Hero (only on All tab, no active search) ───────────── */}
      {activeTab === 'all' && !search && featuredFiltered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-yellow-500/20 bg-yellow-500/4">
          <div className="flex items-center gap-2 border-b border-yellow-500/15 px-5 py-3">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-300">
              Featured Resources
            </span>
            <span className="ml-auto text-[10px] text-gray-600">
              {featuredFiltered.length} items
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredFiltered.slice(0, 3).map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                saved={savedIds.has(r.id)}
                onToggleSave={toggleSave}
                onFlash={setFlash}
                featured
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-xl border border-white/8 bg-white/3 p-1.5">
        <TabBtn id="all" label="All Resources" count={allFiltered.length} />
        <TabBtn
          id="featured"
          label="Featured"
          count={featuredFiltered.length}
          accent={featuredFiltered.length > 0}
        />
        <TabBtn id="free" label="Free" count={freeFiltered.length} />
        <TabBtn id="saved" label="Saved" count={savedFiltered.length} />
      </div>

      {/* ── Resource Grid ────────────────────────────────────────────────── */}
      {(tabResources[activeTab] ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/3 py-20 text-center">
          <BookOpen className="mb-3 h-12 w-12 text-gray-700" />
          <p className="text-sm font-medium text-gray-500">
            {tabEmpty[activeTab]}
          </p>
          {activeTab === 'saved' && (
            <button
              onClick={() => setActiveTab('all')}
              className="mt-3 text-xs text-blue-400 transition-colors hover:text-blue-300"
            >
              Browse all resources →
            </button>
          )}
          {(search ||
            typeFilter !== 'all' ||
            diffFilter !== 'all' ||
            catFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setDiffFilter('all');
                setCatFilter('all');
              }}
              className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              Clear filters <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(tabResources[activeTab] ?? []).map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              saved={savedIds.has(r.id)}
              onToggleSave={toggleSave}
              onFlash={setFlash}
              featured={false}
            />
          ))}
        </div>
      )}

      {/* ── Recently Added (only on All tab, bottom) ─────────────────────── */}
      {activeTab === 'all' &&
        !search &&
        catFilter === 'all' &&
        typeFilter === 'all' &&
        diffFilter === 'all' && (
          <div className="rounded-2xl border border-white/8 bg-white/3">
            <div className="flex items-center gap-2 border-b border-white/6 px-5 py-3.5">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">
                Recently Added
              </span>
            </div>
            <div className="divide-y divide-white/4">
              {recentlyAdded.map((r) => {
                const tc = typeConf(r.resource_type);
                const Icon = tc.Icon;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/3"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tc.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${tc.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-200">
                        {r.title}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {r.category} · {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.difficulty &&
                        (() => {
                          const d = diffConf(r.difficulty);
                          return d ? (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${d.bg} ${d.border} ${d.color}`}
                            >
                              {d.label}
                            </span>
                          ) : null;
                        })()}
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 text-[11px] text-gray-400 transition-colors hover:bg-white/8 hover:text-white"
                      >
                        Open <ArrowUpRight className="h-3 w-3" />
                      </a>
                      <BookmarkButton
                        resourceId={r.id}
                        saved={savedIds.has(r.id)}
                        onToggle={toggleSave}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </>
  );
}
