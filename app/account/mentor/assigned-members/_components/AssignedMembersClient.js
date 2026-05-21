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
  adminGetStudentProgress,
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
    if (!lessonCache[student.user_id]) {
      setLessonCache(p => ({ ...p, [student.user_id]: { loading: true } }));
      try {
        const curriculum = await adminGetStudentProgress(student.bootcampId, student.user_id);
        setLessonCache(p => ({ ...p, [student.user_id]: { loading: false, curriculum } }));
      } catch {
        setLessonCache(p => ({ ...p, [student.user_id]: { loading: false, curriculum: null } }));
      }
    }
  };

  const allEnrollments = useMemo(() => {
    const list = [];
    bootcamps.forEach(bc => {
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
  }, [bootcamps, enrollmentMap]);

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
            <ActionButton tone="violet" icon={Plus} onClick={() => setEnrollOpen(true)}>
              Enroll
            </ActionButton>
            <ActionButton tone="ghost" onClick={() => fetchData(true)} disabled={refreshing} aria-label="Refresh">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </ActionButton>
          </>
        }
      />

      {/* Dynamic Statistics Cockpit */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          icon={Users}
          title="Total Mentees"
          value={allEnrollments.filter(e => e.status !== 'pending').length}
          tone="violet"
          description="Enrolled in active cohorts"
        />
        <StatCard
          icon={TrendingUp}
          title="Active Learning"
          value={allEnrollments.filter(e => e.status === 'active').length}
          tone="emerald"
          description="Actively pursuing tracks"
        />
        <StatCard
          icon={Award}
          title="Completed Tracks"
          value={allEnrollments.filter(e => e.status === 'completed').length}
          tone="fuchsia"
          description="Graduated track students"
        />
        <div className="relative">
          <StatCard
            icon={Clock}
            title="Awaiting Approval"
            value={allEnrollments.filter(e => e.status === 'pending').length}
            tone="amber"
            description="Pending cohort requests"
          />
          {allEnrollments.filter(e => e.status === 'pending').length > 0 && (
            <span className="absolute top-3 right-3 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </div>
      </div>

      {/* Bootcamp tabs */}
      <div className="flex flex-wrap gap-2 mt-6 p-2 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
        <FilterTab active={bootcampFilter === 'all'} onClick={() => setBootcampFilter('all')}>
          All bootcamps
        </FilterTab>
        {bootcamps.map(bc => {
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

      {/* Pending requests */}
      {pending.length > 0 && (
        <GlassCard className="mt-6 border border-white/[0.06] bg-[#0d0f14]/30" padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Pending Requests Inbox
                <span className="ml-2 text-[10px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                  {pending.length} new
                </span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map(req => {
              const name = req.users?.full_name || 'Candidate';
              return (
                <div key={req.id} className="relative rounded-2xl border border-white/[0.06] bg-[#0d0f14]/30 p-4 flex flex-col gap-3.5 transition-all hover:border-white/[0.12]">
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
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-300 text-[10px] font-bold uppercase tracking-wider py-2 transition duration-300 cursor-pointer"
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
        </GlassCard>
      )}

      {/* Search and Filters Ribbon */}
      <GlassCard padding="p-4" className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/[0.06] bg-[#0c0d12]/20">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student names, cohort titles, emails..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#0c0d12]/50 hover:bg-[#0c0d12]/80 pl-10 pr-4 py-2.5 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40 transition-all duration-300"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0c0d12]/50 hover:bg-[#0c0d12]/80 px-3.5 py-2.5 pr-8 text-xs text-gray-200 outline-none focus:border-violet-500/40 transition-all cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-500">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Student list */}
      <div className="mt-4">
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
            {students.map(student => (
              <StudentRow
                key={student.id}
                student={student}
                expanded={expandedId === student.id}
                lessons={lessonCache[student.user_id]}
                onExpand={() => expandRow(student)}
                onInspect={() => setDrawerStudent(student)}
                onRemove={(name) => handleRemove(student.id, name)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {drawerStudent && (
          <StudentDrawer
            student={drawerStudent}
            onClose={() => setDrawerStudent(null)}
            lessonProgressMap={lessonCache}
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
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
        active
          ? 'bg-violet-500/10 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.06)]'
          : 'bg-[#0c0d12]/20 border border-white/[0.06] text-gray-400 hover:text-gray-200 hover:bg-[#0c0d12]/60'
      }`}
    >
      {children}
      {typeof count === 'number' && (
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-mono ${active ? 'bg-violet-500/20 text-violet-300' : 'bg-white/[0.05] text-gray-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function StudentRow({ student, expanded, lessons, onExpand, onInspect, onRemove }) {
  const name = student.users?.full_name || 'Candidate';
  const completed = student.completed_lessons || 0;
  const total = student.totalLessons || 1;
  const pct = Math.min(100, Math.round((completed / total) * 100));
  const tone = STATUS_TONE[student.status] || 'gray';

  const flatLessons = lessons?.curriculum?.courses?.flatMap(c =>
    c.modules?.flatMap(m => m.lessons || []) || []
  ) || [];

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-md ${
      expanded 
        ? 'border-violet-500/30 bg-violet-500/[0.02] shadow-[0_0_20px_rgba(139,92,246,0.06)]' 
        : 'border-white/[0.06] bg-[#0d0f14]/30 hover:bg-[#0d0f14]/60 hover:border-white/[0.12]'
    }`}>
      {/* Active state stripe */}
      {expanded && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-violet-400 to-fuchsia-500" />
      )}

      <div
        onClick={onExpand}
        className="px-5 py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <Avatar name={name} src={student.users?.avatar_url} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-200 truncate">{name}</p>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">{student.users?.email}</p>
          </div>
        </div>

        <div className="hidden md:block min-w-0 max-w-[200px] shrink-0 text-left">
          <p className="text-xs font-bold text-violet-300 truncate">{student.bootcampTitle.split(':')[0]}</p>
          <p className="text-[9px] text-gray-500 flex items-center gap-1 mt-1 font-mono">
            <Clock className="w-2.5 h-2.5 text-gray-500" />
            Enrolled {new Date(student.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="w-full md:w-48 space-y-1.5 text-left shrink-0">
          <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider text-gray-500">
            <span>Cohort Progress</span>
            <span className="text-gray-300 font-bold tabular-nums">{pct}% · {completed}/{total} lessons</span>
          </div>
          <GradientBar value={pct} tone={student.status === 'completed' ? 'emerald' : 'violet'} height="h-1.5" />
        </div>

        <div className="flex items-center gap-3 justify-between md:justify-end shrink-0">
          <Pill tone={tone}>{student.status}</Pill>
          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-90 text-violet-400' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <div className="border-t border-white/[0.04] p-5 space-y-5 bg-black/[0.05]">
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#090b10] px-4 py-3 border border-white/[0.06] border-b-0 rounded-t-2xl text-[10px]">
                <span className="font-mono text-gray-400 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <span className="ml-1.5 font-bold uppercase tracking-widest text-slate-400">Curriculum Syllabus Logs</span>
                </span>
                <span className="text-[10px] text-violet-400 font-bold font-mono">
                  {completed}/{total} completed
                </span>
              </div>
              
              <div className="bg-[#090b10] p-4.5 rounded-b-2xl border border-white/[0.06]">
                {lessons?.loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                  </div>
                ) : flatLessons.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {flatLessons.map(l => {
                      const done = l.progress?.is_completed;
                      return (
                        <div key={l.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs transition hover:border-white/[0.08]">
                          {done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                          )}
                          <span className={`truncate font-mono ${done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                            {l.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic text-center py-4 font-mono">No lesson data available in cohort syllabus</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.04]">
              <ActionButton tone="violet" onClick={onInspect} className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl">
                View Performance Portfolio
              </ActionButton>
              <button
                onClick={() => onRemove(name)}
                className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-300 transition duration-300 cursor-pointer"
                title="Remove enrollment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
