/**
 * @file Enrollments management tab for admin bootcamp detail page.
 * @module EnrollmentsTab
 *
 * Professional enrollment management with:
 * - Student list with search/filter
 * - Add enrollment modal with user search
 * - Status management (active, pending, cancelled, etc.)
 * - Progress tracking per student
 * - Export to CSV
 * - Bulk actions
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Download,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Calendar,
  TrendingUp,
  ChevronDown,
  X,
  Loader2,
  RefreshCw,
  Filter,
  ArrowUpDown,
  UserCheck,
  UserX,
  Award,
} from 'lucide-react';
import {
  getEnrollmentsWithProgress,
  getEnrollmentStats,
  searchUsersForEnrollment,
  adminAddEnrollment,
  adminUpdateEnrollmentStatus,
  adminRemoveEnrollment,
  adminApproveEnrollment,
  adminRejectEnrollment,
  exportEnrollmentsCSV,
  adminGetStudentProgress,
} from '@/app/_lib/bootcamp-actions';
import toast from 'react-hot-toast';
import { StatCard } from '../../../_components/_ui';

// Status configuration
const STATUS_CONFIG = {
  active: {
    label: 'Active',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
    dot: 'bg-emerald-400',
  },
  pending: {
    label: 'Pending',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Clock,
    dot: 'bg-amber-400',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
    dot: 'bg-red-400',
  },
  expired: {
    label: 'Expired',
    badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: AlertTriangle,
    dot: 'bg-gray-400',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    icon: Award,
    dot: 'bg-violet-400',
  },
};

const SORT_OPTIONS = [
  { value: 'enrolled_at_desc', label: 'Recently Enrolled' },
  { value: 'enrolled_at_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'progress_desc', label: 'Most Progress' },
  { value: 'progress_asc', label: 'Least Progress' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Students' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

export default function EnrollmentsTab({ bootcampId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('enrolled_at_desc');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch enrollments and stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [enrollmentData, statsData] = await Promise.all([
        getEnrollmentsWithProgress(bootcampId),
        getEnrollmentStats(bootcampId),
      ]);
      setEnrollments(enrollmentData.enrollments);
      setTotalLessons(enrollmentData.totalLessons);
      setStats(statsData);
    } catch (err) {
      toast.error('Failed to load enrollments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [bootcampId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort enrollments
  const filteredEnrollments = useMemo(() => {
    let result = [...enrollments];

    // Filter by status
    if (filterBy !== 'all') {
      result = result.filter((e) => e.status === filterBy);
    }

    // Search by name or email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.users?.full_name?.toLowerCase().includes(query) ||
          e.users?.email?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'enrolled_at_desc':
          return new Date(b.enrolled_at) - new Date(a.enrolled_at);
        case 'enrolled_at_asc':
          return new Date(a.enrolled_at) - new Date(b.enrolled_at);
        case 'name_asc':
          return (a.users?.full_name || '').localeCompare(
            b.users?.full_name || ''
          );
        case 'name_desc':
          return (b.users?.full_name || '').localeCompare(
            a.users?.full_name || ''
          );
        case 'progress_desc':
          return (b.progress_percent || 0) - (a.progress_percent || 0);
        case 'progress_asc':
          return (a.progress_percent || 0) - (b.progress_percent || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [enrollments, filterBy, searchQuery, sortBy]);

  // Handle status change
  const handleStatusChange = async (enrollmentId, newStatus) => {
    try {
      await adminUpdateEnrollmentStatus(enrollmentId, newStatus);
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === enrollmentId ? { ...e, status: newStatus } : e
        )
      );
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
    setActiveDropdown(null);
  };

  // Handle remove enrollment
  const handleRemove = async (enrollmentId) => {
    if (
      !confirm(
        'Are you sure? This will permanently delete the enrollment and all progress data.'
      )
    ) {
      return;
    }

    try {
      await adminRemoveEnrollment(enrollmentId);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
      toast.success('Enrollment removed');
      // Refresh stats
      const statsData = await getEnrollmentStats(bootcampId);
      setStats(statsData);
    } catch (err) {
      toast.error('Failed to remove enrollment');
    }
    setActiveDropdown(null);
  };

  // Handle approve pending enrollment
  const handleApprove = async (enrollmentId) => {
    try {
      const result = await adminApproveEnrollment(enrollmentId);
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, status: 'active' } : e))
      );
      toast.success(`${result.enrollment?.users?.full_name || 'Student'} approved`);
      const statsData = await getEnrollmentStats(bootcampId);
      setStats(statsData);
    } catch (err) {
      toast.error('Failed to approve enrollment');
    }
  };

  // Handle reject pending enrollment
  const handleReject = async (enrollmentId) => {
    if (!confirm('Reject this enrollment request? The member will be cancelled.')) return;
    try {
      await adminRejectEnrollment(enrollmentId);
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, status: 'cancelled' } : e))
      );
      toast.success('Enrollment request rejected');
      const statsData = await getEnrollmentStats(bootcampId);
      setStats(statsData);
    } catch (err) {
      toast.error('Failed to reject enrollment');
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const { csv, filename } = await exportEnrollmentsCSV(bootcampId);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error('Failed to export');
    }
  };

  // Handle bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEnrollments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEnrollments.map((e) => e.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const pendingEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === 'pending'),
    [enrollments]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/8 bg-[#0d1117] py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Total Enrolled" value={stats.total} icon={Users} accent="violet" />
          <StatCard label="Active" value={stats.active} icon={UserCheck} accent="emerald" />
          <StatCard label="This Week" value={stats.thisWeek} icon={TrendingUp} accent="blue" sublabel="new" />
          <StatCard label="This Month" value={stats.thisMonth} icon={Calendar} accent="amber" sublabel="new" />
          <StatCard label="Completed" value={stats.completed} icon={Award} accent="pink" />
        </div>
      )}

      {/* Pending Requests */}
      {pendingEnrollments.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 border-b border-amber-500/20 px-4 py-3">
            <Clock className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">Pending Requests</h3>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              {pendingEnrollments.length}
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {pendingEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center gap-3 px-4 py-3">
                {enrollment.users?.avatar_url ? (
                  <img src={enrollment.users.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-xs font-semibold text-gray-300">
                    {enrollment.users?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{enrollment.users?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 truncate">{enrollment.users?.email}</p>
                </div>
                <span className="text-xs text-gray-500 shrink-0 hidden sm:block">
                  {formatDate(enrollment.enrolled_at)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(enrollment.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-all"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(enrollment.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0d1117]">
        {/* Header */}
        <div className="border-b border-white/8 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">
                Enrolled Students
              </h3>
              <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                {filteredEnrollments.length} of {enrollments.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="h-8 w-48 rounded-lg border border-white/8 bg-white/4 pr-3 pl-8 text-xs text-white placeholder-gray-500 transition-all outline-none focus:border-white/20 focus:bg-white/6"
                />
              </div>

              {/* Filter */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="h-8 appearance-none rounded-lg border border-white/8 bg-white/4 px-3 pr-7 text-xs text-gray-400 transition-all outline-none focus:border-white/20 focus:bg-white/6"
                style={{ colorScheme: 'dark' }}
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 appearance-none rounded-lg border border-white/8 bg-white/4 px-3 pr-7 text-xs text-gray-400 transition-all outline-none focus:border-white/20 focus:bg-white/6"
                style={{ colorScheme: 'dark' }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Export */}
              <button
                onClick={handleExport}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 text-xs font-medium text-gray-400 transition-all hover:bg-white/8 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>

              {/* Add Student */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white transition-all hover:bg-violet-500"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Student
              </button>

              {/* Refresh */}
              <button
                onClick={fetchData}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-gray-400 transition-all hover:bg-white/8 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredEnrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-gray-700" />
            <p className="mt-3 text-sm text-gray-400">
              {searchQuery || filterBy !== 'all'
                ? 'No students match your filters'
                : 'No students enrolled yet'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-500"
            >
              <UserPlus className="h-4 w-4" />
              Add Your First Student
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === filteredEnrollments.length &&
                        filteredEnrollments.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/20"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                    Enrolled
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                    Last Active
                  </th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEnrollments.map((enrollment) => (
                  <EnrollmentRow
                    key={enrollment.id}
                    enrollment={enrollment}
                    totalLessons={totalLessons}
                    selected={selectedIds.has(enrollment.id)}
                    onSelect={() => toggleSelect(enrollment.id)}
                    onStatusChange={handleStatusChange}
                    onRemove={handleRemove}
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    formatDate={formatDate}
                    onRowClick={() => setSelectedStudent(enrollment)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Detail Drawer */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentProgressDrawer
            bootcampId={bootcampId}
            enrollment={selectedStudent}
            totalLessons={totalLessons}
            onClose={() => setSelectedStudent(null)}
            formatDate={formatDate}
          />
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddStudentModal
            bootcampId={bootcampId}
            onClose={() => setShowAddModal(false)}
            onSuccess={(newEnrollments) => {
              setEnrollments((prev) => [...newEnrollments, ...prev]);
              setShowAddModal(false);
              fetchData(); // Refresh stats
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EnrollmentRow({
  enrollment,
  totalLessons,
  selected,
  onSelect,
  onStatusChange,
  onRemove,
  activeDropdown,
  setActiveDropdown,
  formatDate,
  onRowClick,
}) {
  const sc = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.active;
  const StatusIcon = sc.icon;
  const isDropdownOpen = activeDropdown === enrollment.id;
  const buttonRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const handleToggleDropdown = (e) => {
    e.stopPropagation();
    if (!isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setActiveDropdown(isDropdownOpen ? null : enrollment.id);
  };

  return (
    <tr
      onClick={onRowClick}
      className={`cursor-pointer transition-colors hover:bg-white/5 ${selected ? 'bg-violet-500/5' : ''}`}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/20"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {enrollment.users?.avatar_url ? (
            <img
              src={enrollment.users.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-violet-500/20 to-pink-500/20 text-xs font-semibold text-white ring-1 ring-white/10">
              {enrollment.users?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-white">
              {enrollment.users?.full_name || 'Unknown User'}
            </p>
            <p className="flex items-center gap-1 text-[10px] text-gray-500">
              <Mail className="h-2.5 w-2.5" />
              {enrollment.users?.email || 'No email'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${sc.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-violet-500 to-pink-500 transition-all"
              style={{ width: `${enrollment.progress_percent || 0}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-gray-400">
            {enrollment.completed_lessons || 0}/{totalLessons}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-400">
          {formatDate(enrollment.enrolled_at)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-500">
          {enrollment.last_accessed_at
            ? formatDate(enrollment.last_accessed_at)
            : 'Never'}
        </span>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          ref={buttonRef}
          onClick={handleToggleDropdown}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/8 hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.1 }}
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
              className="fixed z-[9999] w-44 overflow-hidden rounded-xl border border-white/10 bg-[#161b22] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-white/5 p-1.5">
                <p className="px-2 py-1 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                  Change Status
                </p>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => onStatusChange(enrollment.id, status)}
                    disabled={enrollment.status === status}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all ${
                      enrollment.status === status
                        ? 'cursor-default bg-white/5 text-gray-400'
                        : 'text-gray-300 hover:bg-white/8'
                    }`}
                  >
                    <config.icon className="h-3.5 w-3.5" />
                    {config.label}
                    {enrollment.status === status && (
                      <CheckCircle2 className="ml-auto h-3 w-3 text-violet-400" />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => onRemove(enrollment.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-red-400 transition-all hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Enrollment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </td>
    </tr>
  );
}

function StudentProgressDrawer({ bootcampId, enrollment, totalLessons, onClose, formatDate }) {
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStudentProgress(bootcampId, enrollment.user_id)
      .then(setCurriculum)
      .catch(() => toast.error('Failed to load progress'))
      .finally(() => setLoading(false));
  }, [bootcampId, enrollment.user_id]);

  const sc = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.active;
  const user = enrollment.users;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0d1117] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-violet-500/20 to-pink-500/20 text-sm font-semibold text-white ring-1 ring-white/10">
                {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-white">{user?.full_name || 'Unknown'}</h3>
              <p className="text-[11px] text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/8 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/8 shrink-0">
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status</p>
            <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${sc.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Progress</p>
            <p className="mt-1 text-sm font-bold text-white">{enrollment.progress_percent || 0}%</p>
            <p className="text-[10px] text-gray-600">{enrollment.completed_lessons || 0}/{totalLessons} lessons</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Enrolled</p>
            <p className="mt-1 text-xs text-gray-300">{formatDate(enrollment.enrolled_at)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-3 border-b border-white/5 shrink-0">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-violet-500 to-pink-500 transition-all"
              style={{ width: `${enrollment.progress_percent || 0}%` }}
            />
          </div>
        </div>

        {/* Curriculum */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {curriculum?.courses?.map((course) => (
                <div key={course.id}>
                  {curriculum.courses.length > 1 && (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{course.title}</p>
                  )}
                  <div className="space-y-3">
                    {course.modules?.map((module) => (
                      <ModuleProgressBlock key={module.id} module={module} />
                    ))}
                  </div>
                  <CourseTotalWatchTime modules={course.modules || []} />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

function fmtTime(seconds) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function hasVideo(lesson) {
  return lesson.video_source && lesson.video_source !== 'none' && lesson.video_id;
}

function ModuleProgressBlock({ module }) {
  const lessons = module.lessons || [];
  const completed = lessons.filter((l) => l.progress?.is_completed).length;
  const videoLessons = lessons.filter(hasVideo);
  const totalWatched = videoLessons.reduce((sum, l) => sum + (l.progress?.watch_time || 0), 0);
  const totalDuration = videoLessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-white/2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-white/3 transition-colors"
      >
        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform shrink-0 ${open ? '' : '-rotate-90'}`} />
        <span className="flex-1 text-xs font-semibold text-gray-200 truncate">{module.title}</span>
        {videoLessons.length > 0 && totalWatched > 0 && (
          <span className="text-[10px] tabular-nums text-violet-400 shrink-0">
            {fmtTime(totalWatched)}
            {totalDuration > 0 && <span className="text-gray-600"> / {fmtTime(totalDuration)}</span>}
          </span>
        )}
        <span className="text-[10px] text-gray-500 shrink-0 ml-1">
          {completed}/{lessons.length}
        </span>
        {completed === lessons.length && lessons.length > 0 && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-white/5 border-t border-white/5">
          {lessons.map((lesson) => {
            const done = lesson.progress?.is_completed;
            const isVideo = hasVideo(lesson);
            const watchTime = isVideo ? (lesson.progress?.watch_time || 0) : 0;
            const duration = lesson.duration || 0;
            return (
              <div key={lesson.id} className="flex items-center gap-2.5 px-3 py-2">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                  {done ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                  )}
                </div>
                <span className={`flex-1 text-xs truncate ${done ? 'text-gray-300' : 'text-gray-500'}`}>
                  {lesson.title}
                </span>
                {isVideo && (
                  <span className="text-[10px] shrink-0 tabular-nums">
                    {watchTime > 0 ? (
                      <>
                        <span className="text-gray-400">{fmtTime(watchTime)}</span>
                        {duration > 0 && <span className="text-gray-700"> / {fmtTime(duration)}</span>}
                      </>
                    ) : duration > 0 ? (
                      <span className="text-gray-700">{fmtTime(duration)}</span>
                    ) : null}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CourseTotalWatchTime({ modules }) {
  const allLessons = modules.flatMap((m) => m.lessons || []);
  const videoLessons = allLessons.filter(hasVideo);
  if (videoLessons.length === 0) return null;

  const totalWatched = videoLessons.reduce((sum, l) => sum + (l.progress?.watch_time || 0), 0);
  const totalDuration = videoLessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  if (totalDuration === 0 && totalWatched === 0) return null;

  const pct = totalDuration > 0 ? Math.min(100, Math.round((totalWatched / totalDuration) * 100)) : 0;

  return (
    <div className="mt-2 rounded-xl border border-white/8 bg-white/2 px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Total Watch Time</span>
        <span className="text-[10px] tabular-nums text-gray-400">
          <span className="text-violet-400 font-medium">{fmtTime(totalWatched) || '0s'}</span>
          {totalDuration > 0 && <span className="text-gray-600"> / {fmtTime(totalDuration)}</span>}
          <span className="text-gray-600 ml-1.5">({pct}%)</span>
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-linear-to-r from-violet-500 to-pink-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AddStudentModal({ bootcampId, onClose, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const searchTimeout = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchUsersForEnrollment(bootcampId, searchQuery);
        // Only update if this is still the current search
        setSearchResults(results || []);
      } catch (err) {
        console.error('Search error:', err);
        toast.error('Search failed');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, bootcampId]);

  const handleSelectUser = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAddEnrollments = async () => {
    if (selectedUsers.length === 0) return;

    setAdding(true);
    try {
      const { enrollments } = await adminAddEnrollment(
        bootcampId,
        selectedUsers.map((u) => u.id)
      );
      toast.success(`${enrollments.length} student(s) enrolled`);
      onSuccess(enrollments);
    } catch (err) {
      toast.error(err.message || 'Failed to add enrollments');
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Add Students</h3>
            <p className="text-xs text-gray-500">
              Search and add students to this bootcamp
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/8 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-sm text-white placeholder-gray-500 transition-all outline-none focus:border-violet-500/50 focus:bg-white/8"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-violet-500" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-white/8 bg-white/3">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-all hover:bg-white/5"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-semibold text-violet-400">
                      {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white">
                      {user.full_name || 'Unknown'}
                    </p>
                    <p className="truncate text-[10px] text-gray-500">
                      {user.email}
                    </p>
                  </div>
                  <UserPlus className="h-4 w-4 text-gray-500" />
                </button>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 &&
            !searching &&
            searchResults.length === 0 && (
              <p className="mt-3 text-center text-xs text-gray-500">
                No users found matching "{searchQuery}"
              </p>
            )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                Selected ({selectedUsers.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/30 text-[8px] font-semibold text-violet-300">
                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className="text-xs text-violet-300">
                      {user.full_name || user.email}
                    </span>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-violet-400 transition-all hover:bg-violet-500/30 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-white/8 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-gray-400 transition-all hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleAddEnrollments}
            disabled={selectedUsers.length === 0 || adding}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                Add {selectedUsers.length > 0 ? selectedUsers.length : ''}{' '}
                Student{selectedUsers.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
