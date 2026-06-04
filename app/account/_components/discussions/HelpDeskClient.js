/**
 * @file Help Desk (discussions) client. Shared by every account panel
 *   (member, mentor, executive, advisor, admin); the active `panelRole`
 *   tailors the available thread categories.
 *
 * @module account/_components/discussions/HelpDeskClient
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageShell,
  TabBar as UiTabBar,
  PageHeader,
} from '@/app/account/_components/ui';
import { AnimatePresence, motion } from 'framer-motion';
import {
  createDiscussionAction,
  voteThreadAction,
  togglePinAction,
  fetchTopContributorsAction,
} from '@/app/_lib/actions/discussion-actions';
import {
  MessageSquare,
  Search,
  Plus,
  Pin,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
} from 'lucide-react';
import {
  cn,
  TABS,
  CATEGORY_TO_TYPE,
  avatarColorFor,
  initials,
  mapThreadToUi,
} from './utils';
import ThreadItem from './ThreadItem';
import ContributorRow from './ContributorRow';
import ThreadDetail from './ThreadDetail';
import NewThread from './NewThread';

export default function HelpDeskClient({
  initialDiscussions = [],
  initialStats = {},
  bootcamps = [],
  userRoles = [],
  panelRole = 'member',
}) {
  const router = useRouter();

  const allowedCategories = useMemo(() => {
    switch (panelRole) {
      case 'admin':
        return ['Announce', 'Release Log'];
      case 'advisor':
      case 'executive':
      case 'mentor':
        return ['Feature Request', 'Announce'];
      case 'member':
      default:
        return ['Help', 'Discussion', 'Feature Request'];
    }
  }, [panelRole]);
  const [threads, setThreads] = useState(() =>
    initialDiscussions.map(mapThreadToUi)
  );

  // Keep the list in sync with fresh server data after revalidation.
  useEffect(() => {
    setThreads(initialDiscussions.map(mapThreadToUi));
  }, [initialDiscussions]);

  const [activeTab, setActiveTab] = useState('All');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // latest | replies | views
  const [statusFilter, setStatusFilter] = useState('all'); // all | open | solved | pinned
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 7;
  const [likedThreads, setLikedThreads] = useState(new Set());
  const [topContributors, setTopContributors] = useState([]);

  useEffect(() => {
    let active = true;
    fetchTopContributorsAction({ limit: 5 }).then((res) => {
      if (active && res?.success) setTopContributors(res.contributors || []);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleLike = useCallback((id) => {
    let willLike = false;
    setLikedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        willLike = false;
      } else {
        next.add(id);
        willLike = true;
      }
      return next;
    });
    voteThreadAction({
      threadId: id,
      voteType: 'up',
      currentVote: willLike ? null : 'up',
    }).catch(() => {});
  }, []);

  const togglePin = useCallback(
    (id) => {
      let nowPinned = false;
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const hasPin = t.tags?.some((tag) => tag.text === 'Pinned');
            nowPinned = !hasPin;
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
      togglePinAction({ threadId: id, isPinned: nowPinned }).then((res) => {
        // Pinning is staff-only; revert to server truth on failure.
        if (res?.error) router.refresh();
      });
    },
    [router]
  );

  // Reset page whenever any filter changes
  const resetPage = useCallback(() => setCurrentPage(1), []);

  const currentUserStats = {
    threads: initialStats?.total || 0,
    replies: initialStats?.repliesCount || 0,
    solved: initialStats?.resolved || 0,
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
    'Release Log': threads.filter((t) =>
      t.tags.some((tag) => tag.text === 'Release Log')
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

  const handleCreateThread = useCallback(
    async ({ title, content, tag, bootcampId }) => {
      const result = await createDiscussionAction({
        title,
        content,
        type: CATEGORY_TO_TYPE[tag] || 'general_question',
        bootcampId: bootcampId || null,
        tags: tag === 'Release Log' ? ['Release Log'] : [],
      });
      if (result?.error) {
        alert(result.error);
        return;
      }
      if (result?.thread) {
        const mapped = mapThreadToUi(result.thread);
        setThreads((prev) => [mapped, ...prev]);
        setIsCreatingThread(false);
        setSelectedThreadId(mapped.id);
        router.refresh();
      }
    },
    [router]
  );

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
                  bootcamps={bootcamps}
                  onBack={() => setIsCreatingThread(false)}
                  onSubmit={handleCreateThread}
                  allowedCategories={allowedCategories}
                />
              ) : selectedThreadId ? (
                <ThreadDetail
                  threadId={selectedThreadId}
                  threads={threads}
                  onBack={() => setSelectedThreadId(null)}
                  likedThreads={likedThreads}
                  onToggleLike={toggleLike}
                  onTogglePin={togglePin}
                  onReplyPosted={() => router.refresh()}
                  userRoles={userRoles}
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
                            No threads matching &ldquo;
                            <span className="text-violet-400">
                              {searchQuery}
                            </span>
                            &rdquo;.
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
                  You haven&apos;t participated yet. Jump in and help others or
                  ask a question to get started!
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
              {topContributors.length > 0 ? (
                topContributors.map((contributor, index) => (
                  <ContributorRow
                    key={contributor.id}
                    rank={index + 1}
                    name={contributor.name}
                    score={contributor.score}
                    avatar={initials(contributor.name)}
                    color={avatarColorFor(contributor.id)}
                  />
                ))
              ) : (
                <p className="text-xs text-gray-500">No contributors yet.</p>
              )}
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
