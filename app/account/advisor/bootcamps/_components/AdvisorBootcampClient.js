'use client';

/**
 * @file Faculty Advisor Bootcamp Analytics Dashboard — premium dark-glass UI.
 * Provides read-only visibility into bootcamp cohort health:
 * - Summary stat cards (tracks, enrolments, revenue, completion)
 * - Searchable/filterable bootcamp track list with per-card cohort stats
 * - Student drill-down drawer via server action
 * - Recent enrollment activity feed
 *
 * @module AdvisorBootcampClient
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Users,
  BookOpen,
  Search,
  X,
  CheckCircle,
  Clock,
  ChevronDown,
  Star,
  DollarSign,
  Target,
  Layers,
  UserCheck,
  Activity,
  Eye,
} from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
  StatCard,
  Pill,
  GradientBar,
  TabBar,
  EmptyState,
  Avatar,
  StaggerList,
} from '@/app/account/_components/ui/dashboard';
import { getAdvisorBootcampStudents } from '@/app/_lib/actions/bootcamp-actions';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtBDT(n) {
  if (!n) return '৳0';
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(0)}k`;
  return `৳${n}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtRelative(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
}

const STATUS_CONFIG = {
  published: { label: 'Active', tone: 'emerald' },
  draft: { label: 'Draft', tone: 'amber' },
  archived: { label: 'Archived', tone: 'gray' },
};

const ENROLL_STATUS_CONFIG = {
  active: { label: 'Active', tone: 'emerald' },
  completed: { label: 'Completed', tone: 'blue' },
  pending: { label: 'Pending', tone: 'amber' },
  cancelled: { label: 'Cancelled', tone: 'rose' },
};

// ─── Student Drill-down Drawer ────────────────────────────────────────────────

function StudentDrawer({ bootcamp, onClose }) {
  const [students, setStudents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch on open
  useEffect(() => {
    getAdvisorBootcampStudents(bootcamp.id)
      .then(setStudents)
      .catch((e) => setError(e.message || 'Failed to load students'))
      .finally(() => setLoading(false));
  }, [bootcamp.id]);

  return (
    <AnimatePresence>
      <motion.div
        key="drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        key="drawer-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/[0.08] bg-gray-950 shadow-2xl"
      >
        {/* Drawer header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-6 py-5">
          <div className="min-w-0">
            <p className="mb-1 text-xs text-gray-500">Student Cohort</p>
            <h2 className="truncate text-lg font-bold text-white">
              {bootcamp.title}
            </h2>
            {bootcamp.batch_info && (
              <p className="mt-0.5 text-xs text-gray-500">
                {bootcamp.batch_info}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-gray-400 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]"
                />
              ))}
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {!loading && !error && students?.length === 0 && (
            <EmptyState
              icon={Users}
              title="No enrolled students"
              description="No active or completed students in this bootcamp yet."
              accent="gray"
            />
          )}
          {!loading && !error && students?.length > 0 && (
            <div className="space-y-3">
              <p className="mb-4 text-xs text-gray-500">
                {students.length} student{students.length !== 1 ? 's' : ''} •
                sorted by progress
              </p>
              {students.map((s, idx) => (
                <motion.div
                  key={s.enrollmentId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <GlassCard padding="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={s.fullName || '?'}
                        src={s.avatarUrl}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">
                            {s.fullName}
                          </p>
                          <Pill
                            tone={
                              ENROLL_STATUS_CONFIG[s.status]?.tone || 'gray'
                            }
                          >
                            {ENROLL_STATUS_CONFIG[s.status]?.label || s.status}
                          </Pill>
                        </div>
                        {s.email && (
                          <p className="truncate text-xs text-gray-500">
                            {s.email}
                          </p>
                        )}
                        <div className="mt-2.5">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">
                              {s.lessonsCompleted}/{s.totalLessons} lessons
                            </span>
                            <span className="text-[11px] font-medium text-gray-300">
                              {s.progressPercent}%
                            </span>
                          </div>
                          <GradientBar
                            value={s.progressPercent}
                            max={100}
                            tone={
                              s.progressPercent >= 80
                                ? 'emerald'
                                : s.progressPercent >= 40
                                  ? 'blue'
                                  : 'amber'
                            }
                            height="h-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div className="border-t border-white/[0.06] px-6 py-4">
          <p className="text-[11px] text-gray-600">
            Read-only view · Advisor access
          </p>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

// ─── Bootcamp Track Card ──────────────────────────────────────────────────────

function BootcampTrackCard({ bootcamp, onViewStudents }) {
  const sc = STATUS_CONFIG[bootcamp.status] || STATUS_CONFIG.draft;
  const pct = bootcamp.stats.avgProgress;
  const completionTone =
    bootcamp.stats.completionRate >= 70
      ? 'emerald'
      : bootcamp.stats.completionRate >= 40
        ? 'blue'
        : 'amber';
  const [showMentors, setShowMentors] = useState(false);
  const hasMentors = (bootcamp.mentors?.length || 0) > 0;

  return (
    <GlassCard hover padding="p-5" className="flex flex-col gap-4">
      {/* Track header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
          <GraduationCap className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">
              {bootcamp.title}
            </h3>
            {bootcamp.is_featured && (
              <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={sc.tone}>{sc.label}</Pill>
            {bootcamp.batch_info && (
              <Pill tone="gray">{bootcamp.batch_info}</Pill>
            )}
            {bootcamp.category && (
              <Pill tone="indigo">{bootcamp.category}</Pill>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-white">
            {bootcamp.price ? fmtBDT(bootcamp.price) : 'Free'}
          </p>
          <p className="text-[11px] text-gray-500">per student</p>
        </div>
      </div>

      {/* Enrollment stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          {
            label: 'Total',
            value: bootcamp.stats.totalEnrollments,
            color: 'text-white',
          },
          {
            label: 'Active',
            value: bootcamp.stats.active,
            color: 'text-emerald-400',
          },
          {
            label: 'Done',
            value: bootcamp.stats.completed,
            color: 'text-blue-400',
          },
          {
            label: 'Pending',
            value: bootcamp.stats.pending,
            color: 'text-amber-400',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-2 py-2 text-center"
          >
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Avg Progress bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Avg Student Progress
          </span>
          <span className="text-[11px] font-semibold text-gray-300">
            {pct}%
          </span>
        </div>
        <GradientBar value={pct} max={100} tone="indigo" height="h-1.5" />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[11px] text-gray-500">Revenue</p>
            <p className="text-sm font-bold text-emerald-400">
              {fmtBDT(bootcamp.stats.revenue)}
            </p>
          </div>
          <div className="h-8 w-px bg-white/[0.05]" />
          <div>
            <p className="text-[11px] text-gray-500">Completion</p>
            <p
              className={`text-sm font-bold ${completionTone === 'emerald' ? 'text-emerald-400' : completionTone === 'blue' ? 'text-blue-400' : 'text-amber-400'}`}
            >
              {bootcamp.stats.completionRate}%
            </p>
          </div>
        </div>
        <button
          onClick={() => onViewStudents(bootcamp)}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-all hover:border-indigo-500/30 hover:bg-indigo-500/20"
        >
          <Eye className="h-3.5 w-3.5" />
          Students
        </button>
      </div>

      {/* Mentor Roster */}
      {hasMentors && (
        <div className="border-t border-white/[0.04] pt-3">
          <button
            onClick={() => setShowMentors((v) => !v)}
            className="mb-2 flex w-full items-center justify-between text-[11px] text-gray-500 transition-colors hover:text-gray-300"
          >
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {bootcamp.mentors.length} Mentor
              {bootcamp.mentors.length !== 1 ? 's' : ''}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showMentors ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {showMentors && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  {bootcamp.mentors.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                    >
                      <Avatar
                        name={m.full_name || '?'}
                        src={m.avatar_url}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-gray-200">
                          {m.full_name || 'Unknown Mentor'}
                        </p>
                        {m.email && (
                          <p className="truncate text-[10px] text-gray-600">
                            {m.email}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <div className="text-center">
                          <p className="text-xs font-bold text-violet-400">
                            {m.sessionsCount}
                          </p>
                          <p className="text-[9px] text-gray-600">sessions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-cyan-400">
                            {m.menteesCount}
                          </p>
                          <p className="text-[9px] text-gray-600">mentees</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GlassCard>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

const TABS = [
  { value: 'all', label: 'All Tracks', icon: Layers },
  { value: 'published', label: 'Active', icon: Activity },
  { value: 'archived', label: 'Archived', icon: CheckCircle },
  { value: 'draft', label: 'Draft', icon: Clock },
];

export default function AdvisorBootcampClient({ analytics }) {
  const {
    summaryStats,
    bootcamps = [],
    recentEnrollments = [],
  } = analytics || {};
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [drawerBootcamp, setDrawerBootcamp] = useState(null);

  const filtered = useMemo(() => {
    return bootcamps.filter((b) => {
      if (tab !== 'all' && b.status !== tab) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          b.title?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          b.batch_info?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bootcamps, tab, search]);

  const tabsWithCount = TABS.map((t) => ({
    ...t,
    count:
      t.value === 'all'
        ? bootcamps.length
        : bootcamps.filter((b) => b.status === t.value).length,
  }));

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        icon={GraduationCap}
        accent="indigo"
        title="Bootcamp Analytics"
        subtitle="Read-only overview of all bootcamp cohorts, student performance, and program health."
        meta={
          <>
            <Pill tone="indigo" icon={BookOpen}>
              {summaryStats?.totalTracks ?? 0} Tracks
            </Pill>
            <Pill tone="emerald" icon={Users}>
              {summaryStats?.totalEnrollments ?? 0} Enrolled
            </Pill>
          </>
        }
      />

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={Layers}
          label="Total Tracks"
          value={summaryStats?.totalTracks ?? 0}
          accent="indigo"
          delay={0}
        />
        <StatCard
          icon={Activity}
          label="Active Cohorts"
          value={summaryStats?.activeTracks ?? 0}
          accent="emerald"
          delay={0.05}
        />
        <StatCard
          icon={CheckCircle}
          label="Archived"
          value={summaryStats?.archivedTracks ?? 0}
          accent="gray"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label="Total Enrolled"
          value={summaryStats?.totalEnrollments ?? 0}
          accent="blue"
          delay={0.15}
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={fmtBDT(summaryStats?.totalRevenue ?? 0)}
          accent="amber"
          delay={0.2}
        />
        <StatCard
          icon={Target}
          label="Avg Completion"
          value={`${summaryStats?.avgCompletionRate ?? 0}%`}
          accent="rose"
          delay={0.25}
        />
      </div>

      {/* Main content: track list + activity feed */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Track list */}
        <div className="flex flex-col gap-4">
          {/* Filters row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracks, categories, batches…"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pr-4 pl-9 text-sm text-gray-200 placeholder-gray-600 transition-all outline-none focus:border-indigo-500/30 focus:bg-white/[0.03] focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <TabBar tabs={tabsWithCount} value={tab} onChange={setTab} />

          {filtered.length === 0 ? (
            <GlassCard padding="p-10">
              <EmptyState
                icon={BookOpen}
                title="No tracks found"
                description={
                  search
                    ? 'Try adjusting your search.'
                    : 'No bootcamp tracks in this status.'
                }
                accent="indigo"
              />
            </GlassCard>
          ) : (
            <StaggerList delay={0.04}>
              {filtered.map((b) => (
                <BootcampTrackCard
                  key={b.id}
                  bootcamp={b}
                  onViewStudents={setDrawerBootcamp}
                />
              ))}
            </StaggerList>
          )}
        </div>

        {/* Recent enrollment feed */}
        <div>
          <GlassCard padding="p-5" className="sticky top-6">
            <SectionHeader
              icon={UserCheck}
              title="Recent Enrollments"
              subtitle="Latest student sign-ups across all tracks"
              accent="emerald"
            />
            {recentEnrollments.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No recent enrollments"
                accent="gray"
              />
            ) : (
              <div className="space-y-3">
                {recentEnrollments.map((e, idx) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-start gap-3"
                  >
                    <Avatar
                      name={e.student?.full_name || '?'}
                      src={e.student?.avatar_url}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-200">
                        {e.student?.full_name || 'Unknown Student'}
                      </p>
                      <p className="truncate text-[11px] text-gray-500">
                        {e.bootcampTitle}
                        {e.bootcampBatch && <> · {e.bootcampBatch}</>}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Pill
                        tone={ENROLL_STATUS_CONFIG[e.status]?.tone || 'gray'}
                      >
                        {ENROLL_STATUS_CONFIG[e.status]?.label || e.status}
                      </Pill>
                      <p className="mt-1 text-[10px] text-gray-600">
                        {fmtRelative(e.enrolledAt)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Student drill-down drawer */}
      {drawerBootcamp && (
        <StudentDrawer
          bootcamp={drawerBootcamp}
          onClose={() => setDrawerBootcamp(null)}
        />
      )}
    </PageShell>
  );
}
