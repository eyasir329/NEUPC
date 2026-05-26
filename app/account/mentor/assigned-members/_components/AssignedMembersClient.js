'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, FileSpreadsheet, Calendar, X, Check,
  CheckCircle2, ChevronRight, Loader2, RefreshCw, Trash2, BookOpen,
  Clock, Award, TrendingUp,
} from 'lucide-react';
import {
  getEnrollmentsWithProgress,
  adminRemoveEnrollment,
  adminApproveEnrollment,
  adminRejectEnrollment,
  exportEnrollmentsCSV,
  getMentorStudentDetailedStats,
} from '@/app/_lib/bootcamp-actions';
import toast from 'react-hot-toast';
import {
  PageShell, PageHeader, GlassCard, Pill, EmptyState,
  ActionButton, Avatar, GradientBar, StatCard,
} from '@/app/account/mentor/_components/_ui';
import { EnrollModal } from './EnrollModal';
import { StudentDrawer } from './StudentDrawer';

const STATUS_TONE = {
  active: 'emerald',
  completed: 'violet',
  paused: 'amber',
  cancelled: 'rose',
  pending: 'amber',
};

export default function AssignedMembersClient({ bootcamps }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollmentMap, setEnrollmentMap] = useState({});
  const [bootcampFilter, setBootcampFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [drawerStudent, setDrawerStudent] = useState(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [lessonCache, setLessonCache] = useState({});

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const results = await Promise.all(
        bootcamps.map(async (bc) => {
          try {
            const data = await getEnrollmentsWithProgress(bc.id);
            return { bootcampId: bc.id, ...data };
          } catch {
            return { bootcampId: bc.id, enrollments: [], totalLessons: 0 };
          }
        })
      );
      const map = {};
      results.forEach(r => { map[r.bootcampId] = { enrollments: r.enrollments, totalLessons: r.totalLessons }; });
      setEnrollmentMap(map);
    } catch {
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bootcamps]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    const bcId = bootcampFilter === 'all' ? bootcamps[0]?.id : bootcampFilter;
    if (!bcId) return toast.error('No bootcamp to export');
    try {
      toast.loading('Preparing CSV…', { id: 'csv' });
      const { csv, filename } = await exportEnrollmentsCSV(bcId);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported', { id: 'csv' });
    } catch {
      toast.error('Export failed', { id: 'csv' });
    }
  };

  const handleApprove = async (id, name) => {
    try {
      toast.loading(`Approving ${name}…`, { id: 'approve' });
      await adminApproveEnrollment(id);
      toast.success(`${name} enrolled`, { id: 'approve' });
      fetchData(true);
    } catch {
      toast.error('Failed to approve', { id: 'approve' });
    }
  };

  const handleReject = async (id, name) => {
    if (!confirm(`Decline request from ${name}?`)) return;
    try {
      await adminRejectEnrollment(id);
      toast.success('Request declined');
      fetchData(true);
    } catch {
      toast.error('Failed to decline');
    }
  };

  const handleRemove = async (id, name) => {
    if (!confirm(`Remove ${name} from this bootcamp? This deletes their progress.`)) return;
    try {
      await adminRemoveEnrollment(id);
      toast.success('Enrollment removed');
      fetchData(true);
    } catch {
      toast.error('Failed to remove');
    }
  };

  const expandRow = async (student) => {
    if (expandedId === student.id) { setExpandedId(null); return; }
    setExpandedId(student.id);
    // Cache key is bootcampId+userId so different bootcamps don't collide
    const cacheKey = `${student.bootcampId}:${student.user_id}`;
    if (!lessonCache[cacheKey]) {
      setLessonCache(p => ({ ...p, [cacheKey]: { loading: true } }));
      try {
        const stats = await getMentorStudentDetailedStats(student.bootcampId, student.user_id);
        setLessonCache(p => ({ ...p, [cacheKey]: { loading: false, ...stats } }));
      } catch {
        setLessonCache(p => ({ ...p, [cacheKey]: { loading: false, curriculum: null } }));
      }
    }
  };

  const activeBootcamps = useMemo(() => bootcamps.filter(bc => bc.status === 'published'), [bootcamps]);
  const archivedBootcamps = useMemo(() => bootcamps.filter(bc => bc.status !== 'published'), [bootcamps]);

  const selectedBootcamp = useMemo(() => bootcamps.find(bc => bc.id === bootcampFilter), [bootcamps, bootcampFilter]);
  const isSelectedArchived = selectedBootcamp ? selectedBootcamp.status !== 'published' : false;

  const allEnrollments = useMemo(() => {
    const list = [];
    const targets = bootcampFilter === 'all' ? activeBootcamps : bootcamps;
    targets.forEach(bc => {
      const info = enrollmentMap[bc.id];
      if (!info) return;
      info.enrollments.forEach(e => list.push({
        ...e,
        bootcampId: bc.id,
        bootcampTitle: bc.title,
        totalLessons: info.totalLessons,
      }));
    });
    return list;
  }, [bootcamps, activeBootcamps, bootcampFilter, enrollmentMap]);

  const pending = useMemo(
    () => allEnrollments.filter(e => e.status === 'pending' && (bootcampFilter === 'all' || e.bootcampId === bootcampFilter)),
    [allEnrollments, bootcampFilter]
  );

  const students = useMemo(() => {
    return allEnrollments.filter(e => {
      if (e.status === 'pending') return false;
      if (bootcampFilter !== 'all' && e.bootcampId !== bootcampFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return e.users?.full_name?.toLowerCase().includes(q) ||
               e.users?.email?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allEnrollments, bootcampFilter, statusFilter, searchQuery]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
          <p className="text-sm text-gray-500">Loading members…</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        icon={Users}
        accent="violet"
        title="Assigned Members"
        subtitle="Manage students enrolled in your bootcamps"
        actions={
          <>
            <ActionButton tone="ghost" icon={FileSpreadsheet} onClick={handleExport}>
              Export CSV
            </ActionButton>
            {!isSelectedArchived && bootcampFilter !== 'all' && (
              <ActionButton tone="violet" icon={Plus} onClick={() => setEnrollOpen(true)}>
                Enroll
              </ActionButton>
            )}
            <ActionButton tone="ghost" onClick={() => fetchData(true)} disabled={refreshing} aria-label="Refresh">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </ActionButton>
          </>
        }
      />

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Mentees"
          value={allEnrollments.filter(e => e.status !== 'pending').length}
          accent="violet"
          sublabel="Enrolled in your cohorts"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Learners"
          value={allEnrollments.filter(e => e.status === 'active').length}
          accent="emerald"
          sublabel="Currently progressing"
        />
        <StatCard
          icon={Award}
          label="Completed"
          value={allEnrollments.filter(e => e.status === 'completed').length}
          accent="fuchsia"
          sublabel="Finished the track"
        />
        <div className="relative">
          <StatCard
            icon={Clock}
            label="Awaiting Approval"
            value={allEnrollments.filter(e => e.status === 'pending').length}
            accent="amber"
            sublabel="Pending requests"
          />
          {allEnrollments.filter(e => e.status === 'pending').length > 0 && (
            <span className="absolute top-3 right-3 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </span>
          )}
        </div>
      </div>

      {/* Bootcamp tabs */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-3 shadow-lg backdrop-blur-xl">
        {/* Active Cohorts Section */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 block mb-2 px-1">Active Cohorts</span>
          <div className="flex flex-wrap gap-1.5">
            <FilterTab active={bootcampFilter === 'all'} onClick={() => setBootcampFilter('all')}>
              All active bootcamps
            </FilterTab>
            {activeBootcamps.map(bc => {
              const info = enrollmentMap[bc.id] || { enrollments: [] };
              const count = info.enrollments.filter(e => e.status !== 'pending').length;
              return (
                <FilterTab
                  key={bc.id}
                  active={bootcampFilter === bc.id}
                  onClick={() => setBootcampFilter(bc.id)}
                  count={count}
                >
                  {bc.title.split(':')[0]}
                </FilterTab>
              );
            })}
          </div>
        </div>

        {/* Archived Cohorts Section */}
        {archivedBootcamps.length > 0 && (
          <div className="border-t border-white/5 pt-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-2 px-1">Archived Cohorts (Read-Only)</span>
            <div className="flex flex-wrap gap-1.5">
              {archivedBootcamps.map(bc => {
                const info = enrollmentMap[bc.id] || { enrollments: [] };
                const count = info.enrollments.filter(e => e.status !== 'pending').length;
                return (
                  <FilterTab
                    key={bc.id}
                    active={bootcampFilter === bc.id}
                    onClick={() => setBootcampFilter(bc.id)}
                    count={count}
                    tone="zinc"
                  >
                    🚫 {bc.title.split(':')[0]}
                  </FilterTab>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-5 shadow-lg backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/6 blur-[80px]" />
          <div className="relative z-10 mb-4 flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                Pending Requests
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                  {pending.length} new
                </span>
              </h2>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {pending.map(req => {
              const name = req.users?.full_name || 'Candidate';
              return (
                <div key={req.id} className="relative flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 transition-all hover:border-white/20 hover:bg-zinc-950/80">
                  <div className="flex items-start gap-3">
                    <Avatar name={name} src={req.users?.avatar_url} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-200 truncate">{name}</p>
                        <span className="text-[9px] text-gray-500 flex items-center gap-1 shrink-0 font-mono">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(req.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{req.users?.email}</p>
                      <Pill tone="violet" className="mt-2">
                        {req.bootcampTitle.split(':')[0]}
                      </Pill>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(req.id, name)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/2 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-300 text-[10px] font-bold uppercase tracking-wider py-2 transition duration-300 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      Decline
                    </button>
                    <button
                      onClick={() => handleApprove(req.id, name)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-wider text-emerald-300 py-2 transition duration-300 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-3 shadow-lg backdrop-blur-xl md:flex-row">
        <div className="group relative w-full md:flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-violet-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pr-4 pl-10 text-sm text-zinc-200 transition-all outline-none placeholder:text-zinc-600 focus:border-violet-500/50 focus:bg-zinc-900 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <div className="relative w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 pr-8 text-sm text-zinc-200 outline-none transition-all hover:bg-black/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-500">
              <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Student list */}
      <div>
        {students.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No students match"
            description="Adjust the filters or enroll a new candidate."
            action={
              (searchQuery || statusFilter !== 'all' || bootcampFilter !== 'all') && (
                <ActionButton tone="ghost" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setBootcampFilter('all'); }}>
                  Reset filters
                </ActionButton>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {students.map(student => {
              const bc = bootcamps.find(b => b.id === student.bootcampId);
              const isBcArchived = bc ? bc.status !== 'published' : false;
              const cacheKey = `${student.bootcampId}:${student.user_id}`;
              return (
                <StudentRow
                  key={student.id}
                  student={student}
                  expanded={expandedId === student.id}
                  detailedStats={lessonCache[cacheKey]}
                  onExpand={() => expandRow(student)}
                  onInspect={() => setDrawerStudent(student)}
                  onRemove={(name) => handleRemove(student.id, name)}
                  readOnly={isBcArchived}
                />
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {drawerStudent && (
          <StudentDrawer
            student={drawerStudent}
            onClose={() => setDrawerStudent(null)}
            detailedStats={lessonCache[`${drawerStudent.bootcampId}:${drawerStudent.user_id}`]}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {enrollOpen && (
          <EnrollModal
            bootcamps={bootcamps}
            onClose={() => setEnrollOpen(false)}
            onSuccess={() => { setEnrollOpen(false); fetchData(true); }}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}

function FilterTab({ active, onClick, count, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? 'bg-violet-500/15 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/30'
          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
      }`}
    >
      {children}
      {typeof count === 'number' && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${active ? 'bg-violet-500/20 text-violet-200' : 'bg-white/5 text-zinc-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function formatWatchSecs(s) {
  if (!s) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StudentRow({ student, expanded, detailedStats, onExpand, onInspect, onRemove, readOnly = false }) {
  const name = student.users?.full_name || 'Candidate';
  const completed = student.completed_lessons || 0;
  const total = student.totalLessons || 1;
  const pct = Math.min(100, Math.round((completed / total) * 100));
  const tone = STATUS_TONE[student.status] || 'gray';
  const score = student.score || 0;
  const watchTime = student.watch_time || 0;
  const taskPts = student.task_points || 0;
  const examPts = student.exam_points || 0;
  const sessionsAtt = student.sessions_attended || 0;

  const flatLessons = detailedStats?.curriculum?.courses?.flatMap(c =>
    c.modules?.flatMap(m => m.lessons || []) || []
  ) || [];

  return (
    <div className={`group relative overflow-hidden rounded-2xl border shadow-lg shadow-black/30 backdrop-blur-xl transition-all duration-300 ${
      expanded
        ? 'border-violet-500/30 bg-zinc-900/70 shadow-[0_0_24px_rgba(139,92,246,0.12)]'
        : 'border-white/10 bg-zinc-900/50 hover:border-white/20 hover:bg-zinc-900/70'
    }`}>
      <div className={`pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full blur-[80px] transition-opacity ${expanded ? 'bg-violet-500/15 opacity-100' : 'bg-violet-500/5 opacity-0 group-hover:opacity-100'}`} />
      {expanded && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-violet-400 to-fuchsia-500" />}

      <div onClick={onExpand} className="relative z-10 flex cursor-pointer flex-col justify-between gap-4 px-5 py-4 select-none md:flex-row md:items-center">
        {/* Identity */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <Avatar name={name} src={student.users?.avatar_url} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">{student.users?.email}</p>
          </div>
        </div>

        {/* Bootcamp + enrolled date */}
        <div className="hidden min-w-0 max-w-50 shrink-0 text-left md:block">
          <p className="truncate text-xs font-semibold text-violet-300">{student.bootcampTitle.split(':')[0]}</p>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
            <Clock className="h-3 w-3" />
            Enrolled {new Date(student.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Score + progress bar */}
        <div className="w-full shrink-0 space-y-2 md:w-52">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Award className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-300 tabular-nums">{score} pts</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
              {watchTime > 0 && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{formatWatchSecs(watchTime)}</span>}
              {sessionsAtt > 0 && <span className="text-sky-400 font-semibold">{sessionsAtt} sess</span>}
              {taskPts > 0 && <span className="text-emerald-400 font-semibold">{taskPts}t</span>}
              {examPts > 0 && <span className="text-fuchsia-400 font-semibold">{examPts}e</span>}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              <span>Progress</span>
              <span className="tabular-nums text-zinc-200">{pct}% · {completed}/{total}</span>
            </div>
            <GradientBar value={pct} tone={student.status === 'completed' ? 'emerald' : 'violet'} height="h-1.5" />
          </div>
        </div>

        {/* Status + chevron */}
        <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
          <Pill tone={tone}>
            <span className={`mr-1 h-1.5 w-1.5 rounded-full bg-current ${student.status === 'active' ? 'animate-pulse shadow-[0_0_6px_currentColor]' : ''}`} />
            {student.status}
          </Pill>
          <ChevronRight className={`h-4 w-4 text-zinc-500 transition-transform duration-300 ${expanded ? 'rotate-90 text-violet-400' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <div className="relative z-10 space-y-4 border-t border-white/5 bg-black/20 p-5">

            {/* Score breakdown mini-row */}
            {!detailedStats?.loading && detailedStats?.scoreBreakdown && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Lessons', value: detailedStats.scoreBreakdown.lesson, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                  { label: 'Tasks', value: detailedStats.scoreBreakdown.task, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'Exams', value: detailedStats.scoreBreakdown.exam, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
                  { label: 'Sessions', value: detailedStats.scoreBreakdown.session, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border ${s.bg} px-2 py-2.5 text-center`}>
                    <p className={`text-sm font-black tabular-nums ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Lesson list */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950/60">
              <div className="flex items-center justify-between border-b border-white/5 bg-white/2 px-4 py-3">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                  Lesson progress
                </h4>
                <span className="font-mono text-[11px] font-bold text-violet-300 tabular-nums">
                  {detailedStats?.lessonsCompleted ?? completed}/{total} done
                </span>
              </div>
              <div className="p-4">
                {detailedStats?.loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-violet-400" /></div>
                ) : flatLessons.length > 0 ? (
                  <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                    {flatLessons.map(l => {
                      const done = l.progress?.is_completed;
                      const exam = l.examSubmission;
                      return (
                        <div key={l.id} className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/2 px-3 py-2 text-xs transition hover:border-white/10">
                          {done
                            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            : <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />}
                          <span className={`truncate flex-1 ${done ? 'text-zinc-400' : 'text-zinc-200'}`}>{l.title}</span>
                          {exam?.status === 'graded' && (
                            <span className="shrink-0 text-[9px] font-bold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full px-1.5 py-0.5">{exam.score}pt</span>
                          )}
                          {done && l.progress?.watch_time > 0 && (
                            <span className="shrink-0 text-[9px] text-zinc-600 font-mono">{formatWatchSecs(l.progress.watch_time)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center text-xs text-zinc-500">No lessons available yet.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
              <ActionButton tone="violet" onClick={onInspect}>View full profile</ActionButton>
              {!readOnly && (
                <button onClick={() => onRemove(name)} className="cursor-pointer rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20" title="Remove enrollment">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
