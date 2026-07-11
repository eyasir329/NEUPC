/**
 * @file Member bootcamps client — top-level layout and tab state.
 * Tabs and helpers live in sibling modules.
 * @module MemberBootcampsClient
 */

'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { enrollUser } from '@/app/_lib/actions/bootcamp-actions';
import { PageHeader, PageShell, TabBar } from '@/app/account/_components/ui';
import { CatalogTab } from './CatalogTab';
import { LeaderboardTab } from './LeaderboardTab';
import { MyLearningTab } from './MyLearningTab';
import { OverviewTab } from './OverviewTab';
import { SessionsTab } from './SessionsTab';
import { TasksTab } from './TasksTab';
import { TABS, computeStreak } from './bootcamps-shared';

export default function MemberBootcampsClient({
  user,
  bootcamps = [],
  enrollmentMap = {},
  archivedEnrollmentMap = {},
  learningActivity = [],
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();
  const [enrollingId, setEnrollingId] = useState(null);
  const [localEnrollmentMap, setLocalEnrollmentMap] = useState(enrollmentMap);
  // Deep-link target: the id of a task/session card to scroll to + highlight,
  // taken from the URL hash (e.g. #task-<id> / #session-<id>) on first load.
  const [focusId, setFocusId] = useState(null);

  // Honour ?tab= and #hash deep links (used by the Daily Activity feed to jump
  // straight to a specific task or session). Done in an effect to avoid SSR
  // hydration mismatch.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) setFocusId(hash);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearch('');
  };

  const { enrolledBootcamps, availableBootcamps } = useMemo(() => {
    const enrolled = [];
    const available = [];
    for (const b of bootcamps) {
      const enrollment = localEnrollmentMap[b.id];
      // Only active/completed enrollments count as "enrolled" (show in My Learning)
      if (
        enrollment &&
        enrollment.status !== 'pending' &&
        enrollment.status !== 'cancelled'
      ) {
        enrolled.push({ bootcamp: b, enrollment });
      } else {
        available.push(b);
      }
    }
    enrolled.sort(
      (a, b) =>
        new Date(
          b.enrollment?.last_accessed_at || b.enrollment?.enrolled_at || 0
        ) -
        new Date(
          a.enrollment?.last_accessed_at || a.enrollment?.enrolled_at || 0
        )
    );
    return { enrolledBootcamps: enrolled, availableBootcamps: available };
  }, [bootcamps, localEnrollmentMap]);

  // Archived bootcamps — historical data only, no content access
  const archivedBootcamps = useMemo(
    () =>
      Object.values(archivedEnrollmentMap)
        .map((enrollment) => ({
          bootcamp: enrollment.bootcamps,
          enrollment,
        }))
        .sort(
          (a, b) =>
            new Date(b.enrollment?.enrolled_at || 0) -
            new Date(a.enrollment?.enrolled_at || 0)
        ),
    [archivedEnrollmentMap]
  );

  const filteredEnrolled = useMemo(() => {
    if (!search) return enrolledBootcamps;
    const q = search.toLowerCase();
    return enrolledBootcamps.filter((e) =>
      e.bootcamp?.title?.toLowerCase().includes(q)
    );
  }, [enrolledBootcamps, search]);

  const filteredAvailable = useMemo(() => {
    let list = [...availableBootcamps];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    return list;
  }, [availableBootcamps, search]);

  const totalLessonsCompleted = enrolledBootcamps.reduce(
    (sum, e) => sum + (e.enrollment?.completed_lessons || 0),
    0
  );
  const streak = useMemo(
    () => computeStreak(enrolledBootcamps),
    [enrolledBootcamps]
  );

  const handleEnroll = async (bootcampId) => {
    setEnrollingId(bootcampId);
    startTransition(async () => {
      try {
        const result = await enrollUser(bootcampId);
        if (result.success) {
          setLocalEnrollmentMap((prev) => ({
            ...prev,
            [bootcampId]: {
              ...result.enrollment,
              progress_percent: 0,
              completed_lessons: 0,
            },
          }));
          if (result.status === 'pending') {
            toast.success(
              'Enrollment request submitted! Waiting for admin approval.'
            );
          }
        } else {
          toast.error(result.error || 'Could not enroll');
        }
      } finally {
        setEnrollingId(null);
      }
    });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            user={user}
            enrolledBootcamps={enrolledBootcamps}
            archivedBootcamps={archivedBootcamps}
            totalLessonsCompleted={totalLessonsCompleted}
            streak={streak}
            availableBootcamps={availableBootcamps}
            learningActivity={learningActivity}
            onTab={handleTabChange}
          />
        );
      case 'mylearning':
        return (
          <MyLearningTab
            enrolledBootcamps={enrolledBootcamps}
            archivedBootcamps={archivedBootcamps}
            filteredEnrolled={filteredEnrolled}
            search={search}
            setSearch={setSearch}
            onTab={handleTabChange}
          />
        );
      case 'tasks':
        return (
          <TasksTab enrolledBootcamps={enrolledBootcamps} focusId={focusId} />
        );
      case 'sessions':
        return (
          <SessionsTab
            enrolledBootcamps={enrolledBootcamps}
            user={user}
            focusId={focusId}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardTab
            enrolledBootcamps={enrolledBootcamps}
            archivedBootcamps={archivedBootcamps}
            user={user}
          />
        );
      case 'catalog':
        return (
          <CatalogTab
            availableBootcamps={availableBootcamps}
            filteredAvailable={filteredAvailable}
            search={search}
            setSearch={setSearch}
            handleEnroll={handleEnroll}
            enrollingId={enrollingId}
            enrollmentMap={localEnrollmentMap}
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
        icon={BookOpen}
        title="Bootcamps"
        subtitle="Your enrolled courses and available learning paths"
        accent="blue"
      />
      <TabBar tabs={uiTabs} value={activeTab} onChange={handleTabChange} />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>
    </PageShell>
  );
}
