'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, FileSpreadsheet, Calendar, X, Check,
  CheckCircle2, ChevronRight, Loader2, RefreshCw, Trash2, BookOpen,
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
  ActionButton, Avatar, GradientBar,
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

      {/* Bootcamp tabs */}
      <div className="flex flex-wrap gap-2 mt-6">
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
        <GlassCard className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-gray-200">
                Pending requests
                <span className="ml-2 text-xs text-gray-500">({pending.length})</span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pending.map(req => {
              const name = req.users?.full_name || 'Candidate';
              return (
                <div key={req.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={name} src={req.users?.avatar_url} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white truncate">{name}</p>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" />
                          {new Date(req.enrolled_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{req.users?.email}</p>
                      <Pill tone="violet" className="mt-1.5">
                        {req.bootcampTitle.split(':')[0]}
                      </Pill>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(req.id, name)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 text-xs font-medium text-gray-400 py-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                    <button
                      onClick={() => handleApprove(req.id, name)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 py-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Filters */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/[0.02] border border-white/[0.08] text-gray-300 text-sm rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-violet-500/40"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

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
          <div className="space-y-2">
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
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active
          ? 'bg-violet-500/15 border border-violet-500/30 text-violet-200'
          : 'bg-white/[0.02] border border-white/[0.06] text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
      }`}
    >
      {children}
      {typeof count === 'number' && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-violet-500/20 text-violet-200' : 'bg-white/[0.05] text-gray-500'}`}>
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
    <div className={`rounded-xl border transition-all ${expanded ? 'border-violet-500/30 bg-white/[0.03]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'}`}>
      <div
        onClick={onExpand}
        className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar name={name} src={student.users?.avatar_url} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{student.users?.email}</p>
          </div>
        </div>

        <div className="hidden md:block min-w-0 max-w-[180px]">
          <p className="text-xs text-gray-400 truncate">{student.bootcampTitle.split(':')[0]}</p>
          <p className="text-[10px] text-gray-600">Enrolled {new Date(student.enrolled_at).toLocaleDateString()}</p>
        </div>

        <div className="w-full md:w-40 space-y-1">
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Progress</span>
            <span className="text-gray-300 font-medium">{pct}% · {completed}/{total}</span>
          </div>
          <GradientBar value={pct} tone={student.status === 'completed' ? 'emerald' : 'violet'} height="h-1.5" />
        </div>

        <div className="flex items-center gap-2 justify-between md:justify-end">
          <Pill tone={tone}>{student.status}</Pill>
          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-90 text-violet-400' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <div className="border-t border-white/[0.06] p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Lessons</h4>
                <span className="text-xs text-gray-500">{completed}/{total} complete</span>
              </div>
              {lessons?.loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                </div>
              ) : flatLessons.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {flatLessons.map(l => {
                    const done = l.progress?.is_completed;
                    return (
                      <div key={l.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-white/15 shrink-0" />
                        )}
                        <span className={`truncate ${done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                          {l.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-4">No lesson data</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
              <ActionButton tone="violet" onClick={onInspect}>
                View details
              </ActionButton>
              <button
                onClick={() => onRemove(name)}
                className="p-2 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-300 transition-colors"
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
