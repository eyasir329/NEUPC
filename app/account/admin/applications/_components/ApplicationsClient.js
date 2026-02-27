'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  BookOpen,
  Hash,
  Code,
  Github,
  Loader2,
  Trash2,
  SquareCheck,
  Square,
  X,
  ChevronDown,
  AlertCircle,
  CalendarDays,
  Eye,
  RotateCcw,
} from 'lucide-react';
import ApplicationDetailModal from './ApplicationDetailModal';
import { getStatusConfig, ALL_STATUSES } from './applicationConfig';
import {
  approveApplicationAction,
  rejectApplicationAction,
  resetApplicationAction,
  deleteApplicationAction,
  bulkApproveApplicationsAction,
  bulkRejectApplicationsAction,
  bulkDeleteApplicationsAction,
} from '@/app/_lib/application-actions';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, colorClass, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left backdrop-blur-sm transition-all ${
        active
          ? 'border-white/20 bg-white/8 shadow-lg shadow-black/20'
          : 'border-white/8 bg-white/4 hover:border-white/12 hover:bg-white/6'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl leading-none font-bold text-white tabular-nums">
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-gray-500">{label}</p>
      </div>
    </button>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-white/12 text-white shadow-sm'
          : 'text-gray-500 hover:bg-white/6 hover:text-gray-300'
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
            active ? 'bg-white/15 text-white' : 'bg-white/6 text-gray-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkActionBar({
  selectedCount,
  onClear,
  onApprove,
  onReject,
  onDelete,
  isPending,
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reason, setReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3">
      <div className="flex items-center gap-2">
        <SquareCheck className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-semibold text-blue-300">
          {selectedCount} selected
        </span>
      </div>
      {showRejectInput ? (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Rejection reason (optional)"
            className="w-52 rounded-lg border border-red-500/20 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-red-500/30 focus:outline-none"
          />
          <button
            onClick={() => {
              setShowRejectInput(false);
              onReject(reason);
              setReason('');
            }}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            Confirm Reject
          </button>
          <button
            onClick={() => setShowRejectInput(false)}
            className="px-1 text-xs text-gray-500 transition-colors hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={onApprove}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-300 transition-colors hover:bg-green-500/20 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            Approve All
          </button>
          <button
            onClick={() => setShowRejectInput(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            <XCircle className="h-3 w-3" /> Reject All
          </button>
          {deleteConfirm ? (
            <>
              <span className="text-xs text-gray-400">
                Delete {selectedCount}?
              </span>
              <button
                onClick={() => {
                  setDeleteConfirm(false);
                  onDelete();
                }}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Confirm
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-1 text-xs text-gray-500 hover:text-gray-300"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
          <button
            onClick={onClear}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/8 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Application Row ──────────────────────────────────────────────────────────

function ApplicationRow({ req, selected, onToggleSelect, onOpen, onRefresh }) {
  const sc = getStatusConfig(req.status);
  const [statusOpen, setStatusOpen] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const dateStr = req.created_at
    ? new Date(req.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  async function quickApprove() {
    setStatusOpen(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', req.id);
      await approveApplicationAction(fd);
      onRefresh?.('approved');
    });
  }

  async function quickReject() {
    setStatusOpen(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', req.id);
      fd.set('rejection_reason', reason);
      await rejectApplicationAction(fd);
      setShowRejectInput(false);
      onRefresh?.('rejected');
    });
  }

  async function quickReset() {
    setStatusOpen(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', req.id);
      await resetApplicationAction(fd);
      onRefresh?.('pending');
    });
  }

  async function handleDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', req.id);
      await deleteApplicationAction(fd);
      onRefresh?.('deleted');
    });
  }

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-2xl border bg-white/3 px-4 py-4 transition-all duration-150 hover:bg-white/5 sm:items-center ${
        selected
          ? 'border-blue-500/25 bg-blue-500/5'
          : 'border-white/8 hover:border-white/12'
      } ${sc.rowHighlight}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleSelect(req.id)}
        className="mt-0.5 shrink-0 text-gray-500 transition-colors hover:text-blue-400 sm:mt-0"
      >
        {selected ? (
          <SquareCheck className="h-4 w-4 text-blue-400" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>

      {/* Main info — opens detail */}
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => onOpen(req)}
      >
        {/* Name + email */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-gray-500" />
            <span className="text-sm font-semibold text-white">{req.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0 text-gray-600" />
            <span className="truncate text-xs text-gray-400">{req.email}</span>
          </div>
        </div>

        {/* Batch + Dept + Student ID */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {req.student_id && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <Hash className="h-3 w-3" />
              {req.student_id}
            </span>
          )}
          {req.batch && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <CalendarDays className="h-3 w-3" />
              {req.batch}
            </span>
          )}
          {req.department && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <BookOpen className="h-3 w-3" />
              <span className="max-w-45 truncate">{req.department}</span>
            </span>
          )}
        </div>

        {/* Handles */}
        {(req.codeforces_handle || req.github) && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {req.codeforces_handle && (
              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                <Code className="h-3 w-3" />
                {req.codeforces_handle}
              </span>
            )}
            {req.github && (
              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                <Github className="h-3 w-3" />
                {req.github}
              </span>
            )}
          </div>
        )}

        {/* Date */}
        <p className="mt-2 text-[11px] text-gray-600">{dateStr}</p>
      </div>

      {/* Right — status badge + actions */}
      <div className="ml-2 flex shrink-0 flex-col items-end gap-2">
        {/* Inline reject input */}
        {showRejectInput ? (
          <div
            className="flex flex-col gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-44 rounded-lg border border-red-500/20 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
            />
            <div className="flex gap-1">
              <button
                onClick={quickReject}
                disabled={isPending}
                className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/15 px-2.5 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/25"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Confirm
              </button>
              <button
                onClick={() => setShowRejectInput(false)}
                className="px-1.5 text-[11px] text-gray-500 hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusOpen((v) => !v);
                }}
                disabled={isPending}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 ${sc.badgeClass}`}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <sc.icon className="h-3 w-3" />
                )}
                {sc.label}
                <ChevronDown
                  className={`h-2.5 w-2.5 transition-transform ${statusOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {statusOpen && (
                <div
                  className="absolute top-full right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/12 bg-gray-950 shadow-2xl"
                  onMouseLeave={() => setStatusOpen(false)}
                >
                  {req.status !== 'approved' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        quickApprove();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-gray-300 transition-colors hover:bg-white/6"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      Approve
                    </button>
                  )}
                  {req.status !== 'rejected' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusOpen(false);
                        setShowRejectInput(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-gray-300 transition-colors hover:bg-white/6"
                    >
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                      Reject
                    </button>
                  )}
                  {req.status !== 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        quickReset();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-gray-300 transition-colors hover:bg-white/6"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-yellow-400" />
                      Reset to Pending
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* View + delete */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(req);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/8 hover:text-white"
                title="View details"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              {deleteConfirm ? (
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="rounded border border-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10"
                  >
                    Del
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-0.5 text-[10px] text-gray-500 hover:text-gray-300"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(true);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }) {
  const msgs = {
    all: {
      title: 'No applications yet',
      sub: 'Join requests will appear here once submitted.',
    },
    pending: {
      title: 'No pending applications',
      sub: 'All applications have been reviewed.',
    },
    approved: { title: 'No approved applications', sub: '' },
    rejected: { title: 'No rejected applications', sub: '' },
  };
  const { title, sub } = msgs[tab] ?? msgs.all;
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/3 py-20 text-center">
      <GraduationCap className="mb-4 h-12 w-12 text-gray-700" />
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      {sub && <p className="mt-1 text-xs text-gray-600">{sub}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApplicationsClient({ initialRequests, adminId }) {
  const [requests, setRequests] = useState(initialRequests ?? []);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailReq, setDetailReq] = useState(null);
  const [bulkPending, startBulkTransition] = useTransition();
  const [flashMsg, setFlashMsg] = useState(null);

  function flash(msg, type = 'success') {
    setFlashMsg({ msg, type });
    setTimeout(() => setFlashMsg(null), 3000);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    }),
    [requests]
  );

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchesTab = activeTab === 'all' || r.status === activeTab;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.student_id?.toLowerCase().includes(q) ||
        r.batch?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.codeforces_handle?.toLowerCase().includes(q) ||
        r.github?.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, search]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const allSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id));

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : filtered.map((r) => r.id));
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // ── Row quick-action callback ──────────────────────────────────────────────
  function handleRowRefresh(id, newStatus) {
    if (newStatus === 'deleted') {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } else {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    }
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────
  function handleBulkApprove() {
    startBulkTransition(async () => {
      const fd = new FormData();
      fd.set('ids', JSON.stringify(selectedIds));
      const result = await bulkApproveApplicationsAction(fd);
      if (result?.error) {
        flash(result.error, 'error');
      } else {
        setRequests((prev) =>
          prev.map((r) =>
            selectedIds.includes(r.id) ? { ...r, status: 'approved' } : r
          )
        );
        setSelectedIds([]);
        flash(
          `${result.updated} application${result.updated > 1 ? 's' : ''} approved`
        );
      }
    });
  }

  function handleBulkReject(reason) {
    startBulkTransition(async () => {
      const fd = new FormData();
      fd.set('ids', JSON.stringify(selectedIds));
      fd.set('rejection_reason', reason || '');
      const result = await bulkRejectApplicationsAction(fd);
      if (result?.error) {
        flash(result.error, 'error');
      } else {
        setRequests((prev) =>
          prev.map((r) =>
            selectedIds.includes(r.id)
              ? { ...r, status: 'rejected', rejection_reason: reason }
              : r
          )
        );
        setSelectedIds([]);
        flash(
          `${result.updated} application${result.updated > 1 ? 's' : ''} rejected`
        );
      }
    });
  }

  function handleBulkDelete() {
    startBulkTransition(async () => {
      const fd = new FormData();
      fd.set('ids', JSON.stringify(selectedIds));
      const result = await bulkDeleteApplicationsAction(fd);
      if (result?.error) {
        flash(result.error, 'error');
      } else {
        setRequests((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
        setSelectedIds([]);
        flash(
          `${result.deleted} application${result.deleted > 1 ? 's' : ''} deleted`
        );
      }
    });
  }

  // ── Detail modal callbacks ─────────────────────────────────────────────────
  function handleDetailUpdate(updated) {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setDetailReq(updated);
  }

  function handleDetailDelete() {
    if (detailReq) {
      setRequests((prev) => prev.filter((r) => r.id !== detailReq.id));
      setSelectedIds((prev) => prev.filter((x) => x !== detailReq.id));
    }
    setDetailReq(null);
  }

  const STAT_CARDS = [
    {
      icon: GraduationCap,
      label: 'Total',
      value: stats.total,
      colorClass: 'bg-blue-500/15 text-blue-400',
      tab: 'all',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: stats.pending,
      colorClass: 'bg-yellow-500/15 text-yellow-400',
      tab: 'pending',
    },
    {
      icon: CheckCircle2,
      label: 'Approved',
      value: stats.approved,
      colorClass: 'bg-green-500/15 text-green-400',
      tab: 'approved',
    },
    {
      icon: XCircle,
      label: 'Rejected',
      value: stats.rejected,
      colorClass: 'bg-red-500/15 text-red-400',
      tab: 'rejected',
    },
  ];

  return (
    <>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Applications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage membership applications
          </p>
        </div>
        {stats.pending > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-3 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
            <span className="text-xs font-semibold text-yellow-300">
              {stats.pending} pending review
            </span>
          </div>
        )}
      </div>

      {/* ─── Flash ──────────────────────────────────────────────────────────── */}
      {flashMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            flashMsg.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-green-500/30 bg-green-500/10 text-green-300'
          }`}
        >
          {flashMsg.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {flashMsg.msg}
        </div>
      )}

      {/* ─── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_CARDS.map(({ icon, label, value, colorClass, tab }) => (
          <StatCard
            key={tab}
            icon={icon}
            label={label}
            value={value}
            colorClass={colorClass}
            active={activeTab === tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedIds([]);
            }}
          />
        ))}
      </div>

      {/* ─── Filters row ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="scrollbar-none flex items-center gap-1 overflow-x-auto rounded-xl border border-white/8 bg-white/3 p-1.5">
          <TabButton
            active={activeTab === 'all'}
            onClick={() => {
              setActiveTab('all');
              setSelectedIds([]);
            }}
            count={stats.total}
          >
            All
          </TabButton>
          <TabButton
            active={activeTab === 'pending'}
            onClick={() => {
              setActiveTab('pending');
              setSelectedIds([]);
            }}
            count={stats.pending}
          >
            Pending
          </TabButton>
          <TabButton
            active={activeTab === 'approved'}
            onClick={() => {
              setActiveTab('approved');
              setSelectedIds([]);
            }}
            count={stats.approved}
          >
            Approved
          </TabButton>
          <TabButton
            active={activeTab === 'rejected'}
            onClick={() => {
              setActiveTab('rejected');
              setSelectedIds([]);
            }}
            count={stats.rejected}
          >
            Rejected
          </TabButton>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search name, email, ID, batch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/4 py-2.5 pr-4 pl-9 text-sm text-white placeholder-gray-600 backdrop-blur-sm transition-all focus:border-white/20 focus:bg-white/6 focus:outline-none"
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
      </div>

      {/* ─── Bulk Action Bar ─────────────────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          onClear={() => setSelectedIds([])}
          onApprove={handleBulkApprove}
          onReject={handleBulkReject}
          onDelete={handleBulkDelete}
          isPending={bulkPending}
        />
      )}

      {/* ─── List header ─────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/3 px-2.5 py-1.5 text-xs text-gray-400 transition-all hover:bg-white/6 hover:text-gray-200"
            >
              {allSelected ? (
                <SquareCheck className="h-3.5 w-3.5 text-blue-400" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-xs text-gray-600">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* ─── List ────────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <ApplicationRow
              key={req.id}
              req={req}
              selected={selectedIds.includes(req.id)}
              onToggleSelect={toggleSelect}
              onOpen={setDetailReq}
              onRefresh={(newStatus) => handleRowRefresh(req.id, newStatus)}
            />
          ))}
        </div>
      )}

      {/* ─── Detail Modal ─────────────────────────────────────────────────────── */}
      {detailReq && (
        <ApplicationDetailModal
          request={detailReq}
          onClose={() => setDetailReq(null)}
          onUpdated={handleDetailUpdate}
          onDeleted={handleDetailDelete}
        />
      )}
    </>
  );
}
