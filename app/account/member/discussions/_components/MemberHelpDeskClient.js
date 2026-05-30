/**
 * @file Member help desk client component
 * @module MemberHelpDeskClient
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  PageShell,
  TabBar as UiTabBar,
  PageHeader,
} from '@/app/account/_components/ui';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Plus,
  CheckCircle2,
  Pin,
  Flame,
  Star,
  ArrowLeft,
  Clock,
  Share2,
  MoreHorizontal,
  Heart,
  ChevronRight,
  Eye,
  Code2,
  FileText,
  MessageCircle,
  ChevronLeft,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const CURRENT_USER_STATS = {
  threads: 14,
  replies: 86,
  solved: 12,
};

const TABS = [
  { id: 'All', label: 'All Posts', icon: MessageSquare },
  { id: 'Help', label: 'Help & Support', icon: Heart },
  { id: 'Discussion', label: 'Discussions', icon: MessageCircle },
  { id: 'Announcements', label: 'Announcements', icon: Flame },
  { id: 'Release Log', label: 'Release Log', icon: FileText },
  { id: 'Feature Requests', label: 'Feature Requests', icon: Star },
];

const OVERVIEW_STATS = {
  total: 128,
  open: 24,
  resolved: 92,
  pinned: 4,
};

const TOP_CONTRIBUTORS = [
  {
    id: 1,
    name: 'Marcus Chen',
    score: 1420,
    avatar: 'MC',
    color: 'bg-amber-500',
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    score: 1285,
    avatar: 'SJ',
    color: 'bg-violet-500',
  },
  {
    id: 3,
    name: 'Alex Rivera',
    score: 945,
    avatar: 'AR',
    color: 'bg-emerald-500',
  },
  {
    id: 4,
    name: 'Jordan Smith',
    score: 820,
    avatar: 'JS',
    color: 'bg-purple-500',
  },
  {
    id: 5,
    name: 'Priya Patel',
    score: 754,
    avatar: 'PP',
    color: 'bg-rose-500',
  },
];

const THREADS = [
  {
    id: 1,
    avatarText: 'AZ',
    avatarColor: 'bg-blue-600',
    tags: [
      { text: 'Help', color: 'blue' },
      { text: 'Hot', icon: Flame, color: 'orange' },
    ],
    title: 'Best practices for React Context API performance in 2024?',
    author: 'Ali Zafar',
    time: '5 minutes ago',
    replies: 24,
    views: 312,
  },
  {
    id: 2,
    avatarText: 'SJ',
    avatarColor: 'bg-violet-500',
    tags: [
      { text: 'Discussion', color: 'purple' },
      { text: 'Pinned', icon: Pin, color: 'slate' },
    ],
    title: 'RFC: Migrating our monorepo from Yarn to pnpm',
    author: 'Sarah Jenkins',
    time: '2 hours ago',
    replies: 56,
    views: 1205,
  },
  {
    id: 3,
    avatarText: 'MC',
    avatarColor: 'bg-amber-500',
    tags: [
      { text: 'Show & Tell', color: 'amber' },
      { text: 'Featured', icon: Star, color: 'amber' },
    ],
    title: 'Just open-sourced my new WebGL physics engine! 🚀',
    author: 'Marcus Chen',
    time: '4 hours ago',
    replies: 89,
    views: 2400,
  },
  {
    id: 4,
    avatarText: 'PP',
    avatarColor: 'bg-emerald-500',
    tags: [
      { text: 'Help', color: 'blue' },
      { text: 'Solved', icon: CheckCircle2, color: 'emerald' },
    ],
    title: 'How to properly type a generic forwardRef component?',
    author: 'Priya Patel',
    time: '5 hours ago',
    replies: 12,
    views: 280,
  },
  {
    id: 5,
    avatarText: 'Team',
    avatarColor: 'bg-rose-600',
    tags: [
      { text: 'Announce', color: 'rose' },
      { text: 'Pinned', icon: Pin, color: 'slate' },
    ],
    title: 'Q3 Hackathon Winners Announced! 🏆',
    author: 'Developer Relations',
    time: '1 day ago',
    replies: 124,
    views: 3500,
  },
  {
    id: 6,
    avatarText: 'AR',
    avatarColor: 'bg-teal-600',
    tags: [{ text: 'Help', color: 'blue' }],
    title: 'PostgreSQL index not being hit for JSONB text search',
    author: 'Alex Rivera',
    time: '1 day ago',
    replies: 8,
    views: 195,
  },
  {
    id: 7,
    avatarText: 'TK',
    avatarColor: 'bg-cyan-600',
    tags: [{ text: 'Show & Tell', color: 'amber' }],
    title: 'Built a CLI that converts Figma designs to Tailwind components',
    author: 'Tariq Khan',
    time: '2 days ago',
    replies: 42,
    views: 856,
  },
  {
    id: 8,
    avatarText: 'DK',
    avatarColor: 'bg-violet-600',
    tags: [{ text: 'Discussion', color: 'purple' }],
    title: "Is anyone else feeling the 'JS Framework Fatigue' again?",
    author: 'David Kim',
    time: '2 days ago',
    replies: 215,
    views: 4200,
  },
  {
    id: 9,
    avatarText: 'EW',
    avatarColor: 'bg-fuchsia-600',
    tags: [
      { text: 'Help', color: 'blue' },
      { text: 'Solved', icon: CheckCircle2, color: 'emerald' },
    ],
    title: "Docker build failing with 'out of memory' on latest Apple Silicon",
    author: 'Elena Weaver',
    time: '3 days ago',
    replies: 14,
    views: 450,
  },
  {
    id: 10,
    avatarText: 'JS',
    avatarColor: 'bg-sky-600',
    tags: [{ text: 'Feature Request', color: 'teal' }],
    title: 'Add dark mode support to the internal email templates',
    author: 'Jordan Smith',
    time: '3 days ago',
    replies: 31,
    views: 620,
  },
];

export default function MemberHelpDeskClient({
  initialDiscussions = [],
  initialStats = {},
  bootcamps = [],
  userId,
  userEmail,
}) {
  const [threads, setThreads] = useState(() => {
    // Merge real data if available with mock data for demonstration
    if (initialDiscussions && initialDiscussions.length > 0) {
      // Map real data to match the mock data structure
      const mapped = initialDiscussions.map((d) => ({
        id: d.id,
        avatarText: d.user?.name?.substring(0, 2).toUpperCase() || 'U',
        avatarColor: 'bg-violet-600',
        tags: d.tags
          ? d.tags.map((t) => ({ text: t, color: 'blue' }))
          : [{ text: 'Discussion', color: 'purple' }],
        title: d.title,
        author: d.user?.name || 'Unknown User',
        time: new Date(d.createdAt).toLocaleDateString(),
        replies: d.repliesCount || 0,
        views: d.viewsCount || 0,
        content: d.content,
        comments: d.replies || [],
      }));
      // Just for a rich demo, combine them
      return [...mapped, ...THREADS];
    }
    return THREADS;
  });
  const [activeTab, setActiveTab] = useState('All');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // latest | replies | views
  const [statusFilter, setStatusFilter] = useState('all'); // all | open | solved | pinned
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 7;
  const [likedThreads, setLikedThreads] = useState(new Set());
  const toggleLike = (id) =>
    setLikedThreads((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const togglePin = useCallback((id) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const hasPin = t.tags?.some((tag) => tag.text === 'Pinned');
          let newTags = [...(t.tags || [])];
          if (hasPin) {
            newTags = newTags.filter((tag) => tag.text !== 'Pinned');
          } else {
            newTags.push({ text: 'Pinned', icon: Pin, color: 'slate' });
          }
          return { ...t, tags: newTags };
        }
        return t;
      })
    );
  }, []);

  // Reset page whenever any filter changes
  const resetPage = useCallback(() => setCurrentPage(1), []);

  const currentUserStats = {
    threads: initialStats?.threadsCount || 0,
    replies: initialStats?.repliesCount || 0,
    solved: initialStats?.solvedCount || 0,
  };

  const overviewStats = {
    total: threads.length,
    open: threads.filter((t) => !t.tags?.some((tag) => tag.text === 'Solved'))
      .length,
    resolved: threads.filter((t) =>
      t.tags?.some((tag) => tag.text === 'Solved')
    ).length,
    pinned: threads.filter((t) => t.tags?.some((tag) => tag.text === 'Pinned'))
      .length,
  };

  const filteredThreads = useMemo(() => {
    let result = threads;

    // Tab filter
    if (activeTab === 'Announcements')
      result = result.filter((t) =>
        t.tags?.some((tag) => tag.text === 'Announce')
      );
    else if (activeTab === 'Feature Requests')
      result = result.filter((t) =>
        t.tags?.some((tag) => tag.text === 'Feature Request')
      );
    else if (activeTab !== 'All')
      result = result.filter((t) =>
        t.tags?.some((tag) => tag.text === activeTab)
      );

    // Status filter
    if (statusFilter === 'open')
      result = result.filter(
        (t) => !t.tags?.some((tag) => tag.text === 'Solved')
      );
    if (statusFilter === 'solved')
      result = result.filter((t) =>
        t.tags?.some((tag) => tag.text === 'Solved')
      );
    if (statusFilter === 'pinned')
      result = result.filter((t) =>
        t.tags?.some((tag) => tag.text === 'Pinned')
      );

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.author?.toLowerCase().includes(q)
      );
    }

    // Sort
    let sortedResult = [...result];
    if (sortBy === 'replies')
      sortedResult.sort((a, b) => (b.replies || 0) - (a.replies || 0));
    else if (sortBy === 'views')
      sortedResult.sort((a, b) => (b.views || 0) - (a.views || 0));
    // "latest" keeps insertion order (newest first by default)

    // Ensure pinned threads are always at the top
    sortedResult.sort((a, b) => {
      const aPinned = a.tags?.some((tag) => tag.text === 'Pinned') ? 1 : 0;
      const bPinned = b.tags?.some((tag) => tag.text === 'Pinned') ? 1 : 0;
      return bPinned - aPinned;
    });

    return sortedResult;
  }, [activeTab, threads, searchQuery, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredThreads.length / PAGE_SIZE));
  const paginatedThreads = filteredThreads.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const tabCounts = {
    All: threads.length,
    Help: threads.filter((t) => t.tags.some((tag) => tag.text === 'Help'))
      .length,
    Discussion: threads.filter((t) =>
      t.tags.some((tag) => tag.text === 'Discussion')
    ).length,
    Announcements: threads.filter((t) =>
      t.tags.some((tag) => tag.text === 'Announce')
    ).length,
    'Feature Requests': threads.filter((t) =>
      t.tags.some((tag) => tag.text === 'Feature Request')
    ).length,
  };
  const uiTabs = TABS.map((t) => ({
    value: t.id,
    label: t.label,
    icon: t.icon,
    count: tabCounts[t.id],
  }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      {!isCreatingThread && !selectedThreadId && (
        <>
          <PageHeader
            icon={MessageSquare}
            title="Help Desk"
            subtitle={`Join the conversation. ${threads.length} active threads right now.`}
            accent="violet"
            actions={
              <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
                    size={16}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      resetPage();
                    }}
                    placeholder="Search discussions..."
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2.5 pr-4 pl-9 text-sm text-gray-200 shadow-sm transition-all placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setIsCreatingThread(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 sm:w-auto"
                >
                  <Plus size={18} />
                  New thread
                </button>
              </div>
            }
          />
          <UiTabBar
            tabs={uiTabs}
            value={activeTab}
            onChange={(id) => {
              setActiveTab(id);
              setSelectedThreadId(null);
              setIsCreatingThread(false);
              resetPage();
            }}
          />
        </>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* Center content */}
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={
                isCreatingThread
                  ? 'create'
                  : selectedThreadId
                    ? `thread-${selectedThreadId}`
                    : 'list'
              }
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {isCreatingThread ? (
                <NewThread
                  onBack={() => setIsCreatingThread(false)}
                  onSubmit={(newThread) => {
                    setThreads([newThread, ...threads]);
                    setIsCreatingThread(false);
                    setSelectedThreadId(newThread.id);
                  }}
                />
              ) : selectedThreadId ? (
                <ThreadDetail
                  threadId={selectedThreadId}
                  threads={threads}
                  onBack={() => setSelectedThreadId(null)}
                  likedThreads={likedThreads}
                  onToggleLike={toggleLike}
                  onTogglePin={togglePin}
                  onAddComment={(tId, content) => {
                    setThreads((prev) =>
                      prev.map((t) => {
                        if (t.id === tId) {
                          const newComment = {
                            id: Math.floor(Math.random() * 10000) + 10000,
                            author: 'New Participant',
                            avatarText: 'NP',
                            avatarColor: 'bg-violet-600',
                            time: 'Just now',
                            content,
                            likes: 0,
                          };
                          const defaultComments = [
                            {
                              id: 101,
                              author: 'Jordan Smith',
                              avatarText: 'JS',
                              avatarColor: 'bg-purple-500',
                              time: '3 hours ago',
                              content:
                                "I usually stick to Context API until I hit a performance wall or the state logic becomes too complex to manage in a few files. Zustand has been my go-to lately because it's so lightweight and easy to set up compared to Redux.",
                              likes: 15,
                            },
                            {
                              id: 102,
                              author: 'Elena Weaver',
                              avatarText: 'EW',
                              avatarColor: 'bg-fuchsia-600',
                              time: '1 hour ago',
                              content:
                                "Great write-up! I definitely agree about the over-rendering issue with Context. Splitting your contexts (one for state, one for dispatch) can help mitigate it, but it's still a pain point once the app grows.",
                              likes: 7,
                            },
                            {
                              id: 103,
                              author: 'Alex Rivera',
                              avatarText: 'AR',
                              avatarColor: 'bg-teal-600',
                              time: '45 mins ago',
                              content:
                                "Signals look really promising. I've used them in SolidJS and bringing that mental model to React with things like Preact Signals or Jotai is a game changer for performance.",
                              likes: 24,
                            },
                          ];
                          const currentComments =
                            t.comments || (t.id <= 10 ? defaultComments : []);
                          return {
                            ...t,
                            comments: [...currentComments, newComment],
                            replies: (t.replies || 0) + 1,
                          };
                        }
                        return t;
                      })
                    );
                  }}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {/* ── Filter / Sort bar ──────────────────────────── */}
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/[0.06] pb-3">
                    {/* Status chips */}
                    <div className="flex flex-wrap items-center gap-1">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'open', label: 'Open' },
                        { id: 'solved', label: 'Solved' },
                        { id: 'pinned', label: 'Pinned' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setStatusFilter(s.id);
                            resetPage();
                          }}
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-all',
                            statusFilter === s.id
                              ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                              : 'border-white/[0.08] bg-white/[0.03] text-gray-500 hover:border-white/[0.15] hover:text-gray-300'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Sort dropdown */}
                    <div className="relative flex shrink-0 items-center gap-1.5">
                      <ArrowUpDown
                        size={12}
                        className="shrink-0 text-gray-500"
                      />
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value);
                          resetPage();
                        }}
                        className="cursor-pointer appearance-none rounded-lg border border-white/[0.08] bg-white/[0.03] py-1 pr-6 pl-2 text-[11px] font-medium text-gray-300 transition-all focus:border-violet-500 focus:outline-none"
                      >
                        <option
                          value="latest"
                          className="bg-gray-900 text-gray-300"
                        >
                          Latest
                        </option>
                        <option
                          value="replies"
                          className="bg-gray-900 text-gray-300"
                        >
                          Most Replies
                        </option>
                        <option
                          value="views"
                          className="bg-gray-900 text-gray-300"
                        >
                          Most Views
                        </option>
                      </select>
                      <ChevronRight
                        size={10}
                        className="pointer-events-none absolute right-1.5 rotate-90 text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Results count */}
                  <p className="text-xs font-medium text-gray-500">
                    {filteredThreads.length === 0
                      ? 'No threads found'
                      : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredThreads.length)} of ${filteredThreads.length} thread${filteredThreads.length !== 1 ? 's' : ''}`}
                  </p>

                  {/* Thread cards */}
                  {paginatedThreads.length > 0 ? (
                    <motion.div
                      key={`${activeTab}-${statusFilter}-${sortBy}-${searchQuery}-${currentPage}`}
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: { staggerChildren: 0.04 },
                        },
                      }}
                      initial="hidden"
                      animate="show"
                      className="flex flex-col gap-2"
                    >
                      {paginatedThreads.map((thread) => (
                        <motion.div
                          key={thread.id}
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            show: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                type: 'spring',
                                stiffness: 300,
                                damping: 24,
                              },
                            },
                          }}
                        >
                          <ThreadItem
                            onClick={() => setSelectedThreadId(thread.id)}
                            avatarText={thread.avatarText}
                            avatarColor={thread.avatarColor}
                            tags={thread.tags}
                            title={thread.title}
                            author={thread.author}
                            time={thread.time}
                            replies={thread.replies}
                            views={thread.views}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center">
                      <MessageSquare size={48} className="mb-4 text-gray-700" />
                      <h3 className="mb-1 text-lg font-medium text-gray-300">
                        No discussions found
                      </h3>
                      <p className="max-w-sm text-sm text-gray-500">
                        {searchQuery.trim() ? (
                          <>
                            No threads matching "
                            <span className="text-violet-400">
                              {searchQuery}
                            </span>
                            ".
                          </>
                        ) : (
                          <>
                            No threads in{' '}
                            <span className="text-violet-400">{activeTab}</span>{' '}
                            matching the selected filters. Be the first to start
                            a conversation!
                          </>
                        )}
                      </p>
                      <button
                        onClick={() => setIsCreatingThread(true)}
                        className="mt-6 flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-gray-200 shadow-sm transition-colors hover:bg-white/[0.07]"
                      >
                        <Plus size={16} />
                        New thread
                      </button>
                    </div>
                  )}

                  {/* ── Pagination ─────────────────────────────────── */}
                  {totalPages > 1 && (
                    <div className="mt-1 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
                      {/* Prev */}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-all hover:border-white/[0.15] hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronLeft size={13} />
                        <span className="hidden sm:inline">Prev</span>
                      </button>

                      {/* Windowed page numbers with ellipsis */}
                      <div className="flex min-w-0 items-center gap-0.5">
                        {(() => {
                          const items = [];
                          const delta = 1;
                          const rangeSet = new Set([
                            1,
                            totalPages,
                            ...Array.from(
                              { length: delta * 2 + 1 },
                              (_, i) => currentPage - delta + i
                            ).filter((p) => p >= 1 && p <= totalPages),
                          ]);
                          const sorted = Array.from(rangeSet).sort(
                            (a, b) => a - b
                          );
                          let prev = 0;
                          for (const p of sorted) {
                            if (p - prev > 1) {
                              items.push(
                                <span
                                  key={`el-${p}`}
                                  className="flex h-7 w-6 items-center justify-center text-xs text-gray-600 select-none"
                                >
                                  {String.fromCharCode(8230)}
                                </span>
                              );
                            }
                            items.push(
                              <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                className={cn(
                                  'h-7 min-w-[28px] shrink-0 rounded-md px-1 text-xs font-semibold transition-all',
                                  currentPage === p
                                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                                    : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-200'
                                )}
                              >
                                {p}
                              </button>
                            );
                            prev = p;
                          }
                          return items;
                        })()}
                      </div>

                      {/* Next */}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-all hover:border-white/[0.15] hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Fixed */}
        <div className="sticky top-6 hidden flex-col gap-6 lg:flex">
          {/* Your Stats */}
          <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]">
            <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-violet-500/5 blur-2xl transition-all group-hover:bg-violet-500/10"></div>

            <div className="relative z-10 mb-6 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">Your Impact</h3>
              <button className="rounded-md bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-400 transition-colors hover:text-violet-300">
                View Profile
              </button>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tight text-white transition-colors group-hover:text-amber-400">
                  {currentUserStats.threads}
                </span>
                <span className="mt-1 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  Threads
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tight text-white transition-colors group-hover:text-violet-400">
                  {currentUserStats.replies}
                </span>
                <span className="mt-1 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  Replies
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tight text-white transition-colors group-hover:text-emerald-400">
                  {currentUserStats.solved}
                </span>
                <span className="mt-1 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  Solved
                </span>
              </div>
            </div>

            {/* Empty state prompt */}
            {currentUserStats.threads === 0 &&
            currentUserStats.replies === 0 ? (
              <div className="border-white/[0.08]/80 relative z-10 mt-6 flex items-start gap-3 border-t pt-5 text-xs text-gray-400">
                <div className="mt-0.5 shrink-0 text-gray-500">
                  <MessageSquare size={16} />
                </div>
                <p>
                  You haven't participated yet. Jump in and help others or ask a
                  question to get started!
                </p>
              </div>
            ) : null}
          </div>

          {/* Top Contributors */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.1]">
            <h3 className="mb-4 text-sm font-semibold text-gray-200">
              Top contributors
            </h3>
            <div className="flex flex-col gap-4 text-sm">
              {TOP_CONTRIBUTORS.map((contributor, index) => (
                <ContributorRow
                  key={contributor.id}
                  rank={index + 1}
                  name={contributor.name}
                  score={contributor.score}
                  avatar={contributor.avatar}
                  color={contributor.color}
                />
              ))}
            </div>
          </div>

          {/* Overview */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.1]">
            <h3 className="mb-4 text-sm font-semibold text-gray-200">
              Overview
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Total threads</span>
                <span className="font-semibold text-gray-200 tabular-nums">
                  {overviewStats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Open</span>
                <span className="font-semibold text-blue-400 tabular-nums">
                  {overviewStats.open}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Resolved</span>
                <span className="font-semibold text-emerald-400 tabular-nums">
                  {overviewStats.resolved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Pinned</span>
                <span className="font-semibold text-gray-400 tabular-nums">
                  {overviewStats.pinned}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function TabItem({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium whitespace-nowrap transition-all ${
        active
          ? 'border-violet-500 text-white shadow-[0_2px_0_rgba(99,102,241,1)_inset]'
          : 'border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-200'
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            active
              ? 'bg-violet-500/20 text-violet-400'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ThreadItem({
  avatarText,
  avatarColor,
  tags,
  title,
  author,
  time,
  replies = 0,
  views = 0,
  onClick,
}) {
  const isSolved = tags.some((t) => t.text === 'Solved');

  const getTagColor = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-600/30';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group border bg-white/[0.03] hover:bg-white/[0.04] ${isSolved ? 'border-emerald-900/30' : 'border-white/[0.08] hover:border-white/[0.14]'} relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:flex-row`}
    >
      {isSolved && (
        <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500/50"></div>
      )}

      <div
        className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full font-bold text-white shadow-inner ${avatarColor}`}
      >
        <span className="px-1 text-center text-xs leading-none tracking-wide">
          {avatarText.length > 3 ? avatarText.substring(0, 2) : avatarText}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {tags.map((tag, idx) => {
            const Icon = tag.icon;
            return (
              <span
                key={idx}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors ${getTagColor(tag.color)}`}
              >
                {Icon && <Icon size={10} className="opacity-80" />}
                {tag.text}
              </span>
            );
          })}
        </div>
        <h3 className="mb-1 line-clamp-2 text-base leading-snug font-semibold text-gray-200 transition-colors group-hover:text-violet-400">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="text-gray-400 transition-colors hover:text-gray-300">
            {author}
          </span>
          <span className="h-1 w-1 rounded-full bg-gray-700"></span>
          <span>{time}</span>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center justify-between gap-4 border-t border-white/[0.06] pt-3 text-xs font-medium text-gray-500 sm:ml-4 sm:w-auto sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
        <div className="flex items-center gap-5 sm:flex-col sm:items-end sm:gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400 tabular-nums">
              {replies}
            </span>
            <MessageSquare size={14} className="opacity-60" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400 tabular-nums">
              {views}
            </span>
            <Eye size={14} className="opacity-60" />
          </div>
        </div>
        <div className="flex items-center font-bold text-violet-400 opacity-0 transition-opacity group-hover:opacity-100 sm:hidden">
          Reply &rarr;
        </div>
      </div>

      {/* Desktop hover action */}
      <div className="absolute top-1/2 right-6 hidden translate-x-4 -translate-y-1/2 items-center justify-center opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:flex">
        <button className="rounded-full bg-violet-600 p-2 text-white shadow-lg transition-colors hover:bg-violet-500">
          <ChevronRight size={16} />
        </button>
      </div>
      {/* Fade right edge when not hovering to hide the hidden button area slightly */}
      <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-16 rounded-r-2xl bg-linear-to-l from-gray-950/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:block"></div>
    </div>
  );
}

function ContributorRow({ rank, name, score, avatar, color }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-4 text-center text-xs font-bold ${rank <= 3 ? 'text-amber-400' : 'text-gray-500'}`}
      >
        {rank}
      </span>
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${color}`}
      >
        {avatar}
      </div>
      <span className="flex-1 cursor-pointer truncate text-gray-300 transition-colors hover:text-violet-400">
        {name}
      </span>
      <span className="font-medium text-gray-500">{score}</span>
    </div>
  );
}

function ThreadDetail({
  threadId,
  threads,
  onBack,
  onAddComment,
  likedThreads = new Set(),
  onToggleLike,
  onTogglePin,
}) {
  const [replyText, setReplyText] = useState('');

  const threadDetail = useMemo(() => {
    const base = threads.find((t) => t.id === threadId);
    if (!base) return null;
    return {
      ...base,
      content:
        base.content ||
        `I've been exploring this topic recently and wanted to share some thoughts and get feedback from the community.\n\nWhen we build large scale applications, managing state and ensuring performant rendering becomes quite challenging. I've been experimenting with several approaches:\n\n1. **Context API** - Great for simple global state, but can lead to over-rendering if not careful.\n2. **Zustand / Redux** - Fantastic for structured, predictable changes.\n3. **Signals** - A relatively new pattern in the React ecosystem that offers fine-grained reactivity.\n\nHere is a small example of what I'm looking at:\n\n\`\`\`typescript\ninterface AppState {\n  user: User | null;\n  theme: 'light' | 'dark';\n  setTheme: (theme: 'light' | 'dark') => void;\n}\n\`\`\`\n\nWhat are your thoughts on balancing simplicity with scalability? Have you found any specific threshold where you always switch from Context to a dedicated state manager?`,
      comments:
        base.comments ||
        (base.id <= 10
          ? [
              {
                id: 101,
                author: 'Jordan Smith',
                avatarText: 'JS',
                avatarColor: 'bg-purple-500',
                time: '3 hours ago',
                content:
                  "I usually stick to Context API until I hit a performance wall or the state logic becomes too complex to manage in a few files. Zustand has been my go-to lately because it's so lightweight and easy to set up compared to Redux.",
                likes: 15,
              },
              {
                id: 102,
                author: 'Elena Weaver',
                avatarText: 'EW',
                avatarColor: 'bg-fuchsia-600',
                time: '1 hour ago',
                content:
                  "Great write-up! I definitely agree about the over-rendering issue with Context. Splitting your contexts (one for state, one for dispatch) can help mitigate it, but it's still a pain point once the app grows.",
                likes: 7,
              },
              {
                id: 103,
                author: 'Alex Rivera',
                avatarText: 'AR',
                avatarColor: 'bg-teal-600',
                time: '45 mins ago',
                content:
                  "Signals look really promising. I've used them in SolidJS and bringing that mental model to React with things like Preact Signals or Jotai is a game changer for performance.",
                likes: 24,
              },
            ]
          : []),
    };
  }, [threadId, threads]);

  const handlePostReply = () => {
    if (!replyText.trim()) return;
    if (onAddComment) {
      onAddComment(threadId, replyText);
    }
    setReplyText('');
  };

  if (!threadDetail)
    return <div className="text-gray-400">Thread not found.</div>;

  const isPinned = threadDetail.tags?.some((t) => t.text === 'Pinned');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto flex max-w-4xl flex-col gap-6 duration-500">
      <button
        onClick={onBack}
        className="group flex w-fit items-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-200"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-1"
        />
        Back to discussions
      </button>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-sm">
        {/* Thread Header */}
        <div className="border-b border-white/[0.06] p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {threadDetail.tags.map((tag, idx) => {
              const Icon = tag.icon;
              return (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 rounded-md border border-white/[0.14] bg-gray-800/50 px-2.5 py-1 text-[11px] font-bold tracking-wider text-gray-300 uppercase"
                >
                  {Icon && (
                    <Icon size={12} className="text-current opacity-80" />
                  )}
                  {tag.text}
                </span>
              );
            })}
          </div>

          <h1 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {threadDetail.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner ${threadDetail.avatarColor}`}
              >
                {threadDetail.avatarText.length > 3
                  ? threadDetail.avatarText.substring(0, 2)
                  : threadDetail.avatarText}
              </div>
              <div>
                <div className="cursor-pointer font-semibold text-gray-200 transition-colors hover:text-violet-400">
                  {threadDetail.author}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Clock size={12} />
                  {threadDetail.time}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onTogglePin && onTogglePin(threadId)}
                className={`flex items-center gap-1.5 rounded-lg p-2 text-sm font-medium transition-colors ${isPinned ? 'bg-violet-500/10 text-violet-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                title={isPinned ? 'Unpin thread' : 'Pin thread'}
              >
                <Pin size={18} className={isPinned ? 'fill-violet-400' : ''} />
              </button>
              <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200">
                <Share2 size={18} />
              </button>
              <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Thread Content */}
        <div className="space-y-4 bg-white/[0.01] p-6 text-sm leading-relaxed font-medium text-gray-300 sm:p-8">
          {threadDetail.content
            .split('\n')
            .map((line, i) => {
              if (line.startsWith('```') || line.endsWith('```')) return null;
              if (/^\d+\.\s/.test(line))
                return (
                  <p
                    key={i}
                    className="border-l-2 border-violet-500/30 py-0.5 pl-4"
                  >
                    {line}
                  </p>
                );
              if (line.startsWith('**') && line.endsWith('**'))
                return (
                  <strong key={i} className="block text-white">
                    {line.replace(/\*\*/g, '')}
                  </strong>
                );
              if (line.trim() === '') return <div key={i} className="h-2" />;
              return <p key={i}>{line}</p>;
            })
            .filter(Boolean)}
        </div>

        {/* Thread Actions */}
        <div className="flex items-center gap-4 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4 sm:px-8">
          <button
            onClick={() => onToggleLike && onToggleLike(threadId)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              likedThreads.has(threadId)
                ? 'bg-rose-500/10 text-rose-400'
                : 'text-gray-400 hover:bg-rose-500/10 hover:text-rose-400'
            )}
          >
            <Heart
              size={18}
              className={likedThreads.has(threadId) ? 'fill-rose-400' : ''}
            />
            <span>{likedThreads.has(threadId) ? 'Liked' : 'Like'}</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-violet-500/10 hover:text-violet-400">
            <MessageSquare
              size={18}
              className="group-hover:fill-violet-400/20"
            />
            <span>Reply</span>
          </button>
        </div>
      </div>

      {/* Responses Section */}
      <div className="mt-4">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-200">
          Responses
          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-400">
            {threadDetail.comments.length}
          </span>
        </h3>

        <div className="flex flex-col gap-4">
          {threadDetail.comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm transition-colors hover:border-white/[0.1]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-inner ${comment.avatarColor}`}
                >
                  {comment.avatarText}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer text-sm font-semibold text-gray-300 transition-colors hover:text-violet-400">
                        {comment.author}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        • {comment.time}
                      </span>
                    </div>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-gray-300">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <button className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-rose-400">
                      <Heart size={14} />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-violet-400">
                      <MessageSquare size={14} />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Input */}
      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-sm">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
            NP
          </div>
          <div className="flex-1">
            <textarea
              placeholder="Write a reply..."
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-sm text-gray-200 shadow-sm transition-all placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
            ></textarea>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200">
                  <Code2 size={16} />
                </button>
                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200">
                  <FileText size={16} />
                </button>
              </div>
              <button
                disabled={!replyText.trim()}
                onClick={handlePostReply}
                className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Post Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewThread({ onBack, onSubmit }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('Help');
  const [bootcampName, setBootcampName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = [
      {
        text: tag,
        color:
          tag === 'Help'
            ? 'blue'
            : tag === 'Show & Tell'
              ? 'amber'
              : tag === 'Announce'
                ? 'rose'
                : tag === 'Feature Request'
                  ? 'teal'
                  : 'purple',
      },
    ];

    if (tag === 'Discussion' && bootcampName) {
      tags.push({ text: `Bootcamp: ${bootcampName}`, color: 'orange' });
    }

    const newThread = {
      id: Math.floor(Math.random() * 10000) + 100, // random id
      avatarText: 'NP',
      avatarColor: 'bg-violet-600',
      tags,
      title: title.trim(),
      author: 'New Participant', // we could use real user's name if we had auth
      time: 'Just now',
      replies: 0,
      views: 0,
      content: content.trim(),
      comments: [],
    };

    onSubmit(newThread);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto flex max-w-3xl flex-col gap-6 duration-500">
      <button
        onClick={onBack}
        className="group flex w-fit items-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-200"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-1"
        />
        Back to discussions
      </button>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-sm sm:p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Create a new thread
        </h1>
        <p className="mb-8 text-sm text-gray-400">
          Start a new discussion, ask a question, or share something with the
          community.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to structure a large React application?"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-gray-200 shadow-sm transition-all placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Category
            </label>
            <div className="mb-4 flex flex-wrap gap-3">
              {['Help', 'Discussion', 'Feature Request'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTag(cat)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    tag === cat
                      ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                      : 'border-white/[0.08] bg-white/[0.02] text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {tag === 'Discussion' && (
              <div className="animate-in fade-in slide-in-from-top-2 border-white/[0.14]/50 mt-4 rounded-xl border bg-gray-800/30 p-4 duration-300">
                <label
                  htmlFor="bootcamp"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Related Bootcamp (Optional)
                </label>
                <select
                  id="bootcamp"
                  value={bootcampName}
                  onChange={(e) => setBootcampName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-gray-200 shadow-sm transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="">None</option>
                  <option value="Spring '26 Bootcamp">
                    Spring '26 Bootcamp
                  </option>
                  <option value="Summer '26 Bootcamp">
                    Summer '26 Bootcamp
                  </option>
                  <option value="Advanced React Bootcamp">
                    Advanced React Bootcamp
                  </option>
                  <option value="Frontend Zero-to-Hero">
                    Frontend Zero-to-Hero
                  </option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="content"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your issue or share your thoughts here..."
              rows={8}
              className="min-h-[150px] w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-gray-200 shadow-sm transition-all placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
              required
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Post Thread
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
