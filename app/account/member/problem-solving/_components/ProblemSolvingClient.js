/**
 * @file Problem-solving client — top-level layout and tab state.
 * Tabs, charts, and helpers live in sibling modules.
 * @module ProblemSolvingClient
 */

'use client';

import AddPlatformSection from './AddPlatformSection';
import ExtensionGuide from './ExtensionGuide';
import { useConnectHandle, useProblemSolving } from '@/app/_hooks/useProblemSolving';
import { getUpcomingContestsAction, getUserAllProblems } from '@/app/_lib/actions/problem-solving-actions';
import { PROBLEM_SOLVING_PLATFORMS, getAllPlatformConfigs } from '@/app/_lib/services/problem-solving-platforms';
import { PageHeader, PageShell, TabBar } from '@/app/account/_components/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Settings, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContestsTab } from './ContestsTab';
import { LeaderboardTab } from './LeaderboardTab';
import { OverviewTab } from './OverviewTab';
import { ProblemsTab } from './ProblemsTab';
import { ProfileTab } from './ProfileTab';
import { RecommendationsTab } from './RecommendationsTab';
import { SettingsModal } from './SettingsModal';
import { TopicsTab } from './TopicsTab';
import { DEFAULT_PROBLEM_SOLVING_DATA, ErrorState, LoadingState, TABS, TOAST_DURATION_MS, Toast, cn, getErrorMessage } from './ps-shared';


// Platforms that require the browser extension for submission sync
const EXTENSION_ONLY_PLATFORMS = new Set([
  'leetcode',
  'spoj',
  'toph',
  'cses',
  'hackerrank',
  'kattis',
  'uva',
  'lightoj',
  'vjudge',
  'beecrowd',
  'dmoj',
]);

// =====================================================================
// Main Component
// =====================================================================
export default function ProblemSolvingClient({ userId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addPlatformOpen, setAddPlatformOpen] = useState(false);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [upcomingSyncing, setUpcomingSyncing] = useState(false);
  const upcomingLoadedRef = useRef(false);
  const [allProblems, setAllProblems] = useState(null);
  const [allProblemsLoading, setAllProblemsLoading] = useState(false);
  const allProblemsLoadedRef = useRef(false);
  const toastTimeoutRef = useRef(null);

  const {
    data,
    loading,
    error,
    syncing,
    syncingRating,
    syncingPlatform,
    sync,
    syncPlatform,
    syncContestHistory,
    syncRatingHistory,
    refetch,
  } = useProblemSolving();
  const {
    connect,
    disconnect,
    loading: isConnecting,
    error: connectError,
  } = useConnectHandle();

  const loadUpcomingContests = useCallback(async ({ refresh = false } = {}) => {
    setUpcomingSyncing(true);
    try {
      const result = await getUpcomingContestsAction(refresh);
      if (result?.success) {
        setUpcomingContests(result.data || []);
      }
      return result;
    } finally {
      setUpcomingSyncing(false);
    }
  }, []);

  // Lazy-load the upcoming-contests feed the first time the Contests tab opens.
  useEffect(() => {
    if (activeTab === 'contests' && !upcomingLoadedRef.current) {
      upcomingLoadedRef.current = true;
      loadUpcomingContests();
    }
  }, [activeTab, loadUpcomingContests]);

  // Lazy-load all problems the first time the Problems tab opens.
  useEffect(() => {
    if (activeTab === 'problems' && !allProblemsLoadedRef.current) {
      allProblemsLoadedRef.current = true;
      setAllProblemsLoading(true);
      getUserAllProblems()
        .then((result) => setAllProblems(result?.problems || []))
        .catch(() => setAllProblems([]))
        .finally(() => setAllProblemsLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  const handleSync = useCallback(async () => {
    showToast('Syncing all platforms...', 'info');
    try {
      const result = await sync(true);
      showToast(result?.message || 'Synced successfully!', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Sync failed'), 'error');
    }
  }, [sync, showToast]);

  const handleRefreshUpcoming = useCallback(async () => {
    showToast('Refreshing contest schedule...', 'info');
    try {
      const result = await loadUpcomingContests({ refresh: true });
      if (result?.success) {
        showToast('Contest schedule updated!', 'success');
      } else {
        showToast(result?.error || 'Failed to refresh contests', 'error');
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to refresh contests'), 'error');
    }
  }, [loadUpcomingContests, showToast]);

  const handleSyncContestHistory = useCallback(async () => {
    showToast('Refreshing contest history...', 'info');
    try {
      const result = await syncContestHistory(true);
      showToast(result?.message || 'Contest history updated!', 'success');
    } catch (err) {
      showToast(
        getErrorMessage(err, 'Failed to refresh contest history'),
        'error'
      );
    }
  }, [syncContestHistory, showToast]);

  const handleSyncRatingHistory = useCallback(async () => {
    showToast('Refreshing rating history...', 'info');
    try {
      const result = await syncRatingHistory();
      showToast(result?.message || 'Rating history updated!', 'success');
    } catch (err) {
      showToast(
        getErrorMessage(err, 'Failed to refresh rating history'),
        'error'
      );
    }
  }, [syncRatingHistory, showToast]);

  const handleSyncPlatform = useCallback(
    async (platform) => {
      if (!platform) return;
      if (EXTENSION_ONLY_PLATFORMS.has(platform.toLowerCase())) {
        setExtensionModalOpen(true);
        return;
      }
      showToast(`Syncing ${platform}...`, 'info');
      try {
        const result = await syncPlatform(platform, true);
        showToast(result?.message || `${platform} synced!`, 'success');
      } catch (err) {
        showToast(getErrorMessage(err, `Failed to sync ${platform}`), 'error');
      }
    },
    [syncPlatform, showToast]
  );

  const handleConnect = useCallback(
    async (platform, handle) => {
      if (!platform || !handle) return;
      try {
        await connect(platform, handle);
        showToast(`Connected ${handle} on ${platform}`, 'success');
        setAddPlatformOpen(false);
        refetch();
      } catch (err) {
        showToast(getErrorMessage(err, 'Failed to connect'), 'error');
      }
    },
    [connect, refetch, showToast]
  );

  const handleDisconnect = useCallback(
    async (platform) => {
      if (!platform) return;
      if (
        !confirm(
          `Are you sure you want to disconnect your ${platform} account?`
        )
      ) {
        return;
      }
      showToast(`Disconnecting ${platform}...`, 'info');
      try {
        const result = await disconnect(platform);
        if (result?.success) {
          showToast(`Disconnected ${platform} successfully!`, 'success');
          refetch();
        } else {
          showToast(
            result?.error || `Failed to disconnect ${platform}`,
            'error'
          );
        }
      } catch (err) {
        showToast(
          getErrorMessage(err, `Failed to disconnect ${platform}`),
          'error'
        );
      }
    },
    [disconnect, refetch, showToast]
  );

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const problemSolvingData = useMemo(
    () => ({ ...DEFAULT_PROBLEM_SOLVING_DATA, ...(data || {}) }),
    [data]
  );

  const {
    handles,
    statistics,
    recentSubmissions,
    dailyActivity,
    badges,
    leaderboard,
    ratingHistory,
    contestHistory,
  } = problemSolvingData;

  const unconnectedPlatforms = useMemo(() => {
    const connectedIds = (handles || []).map((h) => h.platform);
    return PROBLEM_SOLVING_PLATFORMS.filter(
      (p) => !connectedIds.includes(p.id)
    );
  }, [handles]);

  const renderTab = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} onRetry={refetch} />;

    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            statistics={statistics}
            dailyActivity={dailyActivity}
            recentSubmissions={recentSubmissions}
            handles={handles}
            onConnectClick={() => setAddPlatformOpen(true)}
            onSyncPlatform={handleSyncPlatform}
            syncingPlatform={syncingPlatform}
            onTabChange={handleTabChange}
          />
        );
      case 'problems':
        return (
          <ProblemsTab
            problems={allProblems}
            loading={allProblemsLoading}
            handles={handles}
            recentSubmissions={recentSubmissions}
          />
        );
      case 'contests':
        return (
          <ContestsTab
            ratingHistory={ratingHistory}
            contestHistory={contestHistory}
            upcomingContests={upcomingContests}
            onSync={handleRefreshUpcoming}
            syncing={upcomingSyncing}
            onSyncHistory={handleSyncContestHistory}
            syncingHistory={syncing}
            onSyncRating={handleSyncRatingHistory}
            syncingRating={syncingRating}
            handles={handles}
          />
        );
      case 'topics':
        return <TopicsTab submissions={recentSubmissions} />;
      case 'leaderboard':
        return (
          <LeaderboardTab leaderboard={leaderboard} currentUserId={userId} />
        );
      case 'recommended':
        return <RecommendationsTab submissions={recentSubmissions} />;
      case 'profile':
        return (
          <ProfileTab
            statistics={statistics}
            handles={handles}
            badges={badges}
            contestHistory={contestHistory}
            userId={userId}
            onConnectClick={() => setAddPlatformOpen(true)}
            onDisconnectClick={handleDisconnect}
          />
        );
      default:
        return null;
    }
  };

  const uiTabs = TABS.map((t) => ({
    value: t.id,
    label: t.label,
    icon: t.icon,
  }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <PageHeader
        icon={RefreshCw}
        title="Problem Solving"
        subtitle="Track your progress, contests, and recommendations"
        accent="violet"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 transition-colors hover:border-white/[0.14] hover:text-gray-200 disabled:opacity-50"
              aria-label="Sync"
            >
              <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 transition-colors hover:border-white/[0.14] hover:text-gray-200"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        }
      />
      <TabBar tabs={uiTabs} value={activeTab} onChange={handleTabChange} />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full space-y-8"
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Connect modal */}
      <AnimatePresence>
        {addPlatformOpen && (
          <AddPlatformSection
            availablePlatforms={unconnectedPlatforms}
            platformConfig={getAllPlatformConfigs()}
            onConnect={handleConnect}
            isConnecting={isConnecting}
            error={connectError}
            isExpanded={addPlatformOpen}
            onToggleExpanded={() => setAddPlatformOpen(!addPlatformOpen)}
            hasConnected={(handles || []).length > 0}
          />
        )}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </AnimatePresence>

      {/* Browser Extension modal for extension-only platforms */}
      <AnimatePresence>
        {extensionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setExtensionModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Browser Extension Required
                </h2>
                <button
                  onClick={() => setExtensionModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-y-auto p-5">
                <p className="mb-5 text-xs text-gray-500">
                  This platform doesn&apos;t support direct API sync. Use the
                  browser extension to automatically capture your solutions as
                  you submit.
                </p>
                <ExtensionGuide />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
