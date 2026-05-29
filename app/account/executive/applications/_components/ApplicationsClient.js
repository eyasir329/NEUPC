/**
 * @file Applications client component — unified panel for Membership
 *   Applications (join_requests) and Guest Access Applications (pending users).
 * @module ApplicationsClient
 */

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
  ChevronRight,
  ChevronLeft,
  Users,
  UserCheck,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import {
  approveMemberAction,
  rejectGuestAction,
} from '@/app/_lib/user-actions';

// Shared UI components
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
  IconChip,
  StatCard as StandardStatCard,
  Pill,
  TabBar,
  EmptyState,
  ActionButton,
  Avatar,
  StaggerList,
} from '../../_components/_ui';

// Static accent class maps matching dashboard.js token maps
const ACCENT_CARD_ACTIVE = {
  blue: 'border-blue-500/40 bg-white/[0.04] ring-1 ring-blue-500/20',
  emerald: 'border-emerald-500/40 bg-white/[0.04] ring-1 ring-emerald-500/20',
  amber: 'border-amber-500/40 bg-white/[0.04] ring-1 ring-amber-500/20',
  rose: 'border-rose-500/40 bg-white/[0.04] ring-1 ring-rose-500/20',
  violet: 'border-violet-500/40 bg-white/[0.04] ring-1 ring-violet-500/20',
  orange: 'border-orange-500/40 bg-white/[0.04] ring-1 ring-orange-500/20',
};

// ─── Interactive Stat Card ──────────────────────────────────────────────────
function InteractiveStatCard({ icon: Icon, label, value, accent = 'blue', active, onClick, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <button
        type="button"
        onClick={onClick}
        className={`flex h-full w-full flex-col text-left rounded-2xl border p-4 transition-all ${
          active
            ? ACCENT_CARD_ACTIVE[accent] ?? ACCENT_CARD_ACTIVE.blue
            : 'border-white/[0.08] bg-gray-900 hover:bg-white/[0.02] hover:border-white/[0.12]'
        }`}
      >
        <div className="flex min-h-9 items-start justify-between gap-3">
          <IconChip icon={Icon} accent={accent} />
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-400">{label}</div>
          <div className="mt-0.5 text-2xl font-bold text-white tabular-nums">{value}</div>
        </div>
      </button>
    </motion.div>
  );
}

// ─── Shared: Flash Message ────────────────────────────────────────────────────
function FlashMsg({ msg, type }) {
  if (!msg) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${
        type === 'error'
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : 'border-green-500/30 bg-green-500/10 text-green-300'
      }`}
    >
      {type === 'error' ? (
        <AlertCircle className="h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      )}
      {msg}
    </motion.div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-3 pt-6 border-t border-white/[0.06] sm:flex-row sm:justify-between">
      <span className="text-xs text-gray-500">
        Showing{' '}
        <span className="font-semibold text-gray-300 tabular-nums">{from}–{to}</span>
        {' '}of{' '}
        <span className="font-semibold text-gray-300 tabular-nums">{totalItems}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-gray-600 select-none">
              …
            </span>
          ) : (
            <button
              type="button"
              key={page}
              onClick={() => onPageChange(page)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                currentPage === page
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'border border-white/6 bg-white/2 text-gray-400 hover:bg-white/5 hover:text-gray-300'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 backdrop-blur-md">
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
            className="w-52 rounded-lg border border-red-500/20 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:border-red-500/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              setShowRejectInput(false);
              onReject(reason);
              setReason('');
            }}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            Confirm Reject
          </button>
          <button
            type="button"
            onClick={() => setShowRejectInput(false)}
            className="px-1 text-xs text-gray-500 transition-colors hover:text-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ActionButton
            onClick={onApprove}
            tone="emerald"
            icon={isPending ? Loader2 : CheckCircle2}
            disabled={isPending}
          >
            Approve All
          </ActionButton>
          <ActionButton
            onClick={() => setShowRejectInput(true)}
            tone="danger"
            icon={XCircle}
            disabled={isPending}
          >
            Reject All
          </ActionButton>
          {deleteConfirm ? (
            <>
              <span className="text-xs text-gray-400">
                Delete {selectedCount}?
              </span>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm(false);
                  onDelete();
                }}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Confirm
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="px-1 text-xs text-gray-500 hover:text-gray-300 font-medium"
              >
                Cancel
              </button>
            </>
          ) : (
            <ActionButton
              onClick={() => setDeleteConfirm(true)}
              tone="danger"
              icon={Trash2}
              disabled={isPending}
            >
              Delete
            </ActionButton>
          )}
          <button
            type="button"
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

  const displayName = req.full_name || req.name || '—';

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

  // Pill tone logic matching STATUS_CONFIG
  const getPillTone = (status) => {
    if (status === 'approved') return 'emerald';
    if (status === 'rejected') return 'rose';
    return 'amber';
  };

  return (
    <div
      className={`group relative flex items-start gap-4 rounded-xl border bg-gray-900/40 p-4 transition-all duration-150 hover:bg-white/[0.02] sm:items-center ${
        selected
          ? 'border-blue-500/30 bg-blue-500/5'
          : 'border-white/[0.06] hover:border-white/[0.12]'
      } ${sc.rowHighlight}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggleSelect(req.id)}
        className="mt-1 shrink-0 text-gray-500 transition-colors hover:text-blue-400 sm:mt-0"
      >
        {selected ? (
          <SquareCheck className="h-4.5 w-4.5 text-blue-400" />
        ) : (
          <Square className="h-4.5 w-4.5" />
        )}
      </button>

      {/* Main info */}
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => onOpen(req)}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={displayName} src={req.avatar} size="sm" />
            <span className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0 text-gray-500" />
            <span className="truncate text-xs text-gray-400">{req.email}</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {req.student_id && (
            <Pill tone="gray" icon={Hash} className="py-0.5 px-2">
              {req.student_id}
            </Pill>
          )}
          {req.batch && (
            <Pill tone="gray" icon={CalendarDays} className="py-0.5 px-2">
              {req.batch}
            </Pill>
          )}
          {req.department && (
            <Pill tone="gray" icon={BookOpen} className="py-0.5 px-2 max-w-48 truncate">
              {req.department}
            </Pill>
          )}
        </div>

        {(req.codeforces_handle || req.github) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {req.codeforces_handle && (
              <Pill tone="blue" icon={Code} className="py-0.5 px-2">
                {req.codeforces_handle}
              </Pill>
            )}
            {req.github && (
              <Pill tone="violet" icon={Github} className="py-0.5 px-2">
                {req.github.replace(/https?:\/\/(www\.)?github\.com\//, '')}
              </Pill>
            )}
          </div>
        )}

        <p className="mt-2.5 text-[10px] font-medium text-gray-500">{dateStr}</p>
      </div>

      {/* Right — status badge + actions */}
      <div className="ml-2 flex shrink-0 flex-col items-end gap-2">
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
            <div className="flex gap-1 justify-end">
              <button
                type="button"
                onClick={quickReject}
                disabled={isPending}
                className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/25"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="px-1.5 text-[11px] text-gray-500 hover:text-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusOpen((v) => !v);
                }}
                disabled={isPending}
                className="hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50"
              >
                <Pill
                  tone={getPillTone(req.status)}
                  icon={isPending ? Loader2 : sc.icon}
                  className="py-1 px-3 text-xs font-semibold cursor-pointer border hover:border-white/10"
                >
                  <span className="flex items-center gap-1">
                    {sc.label}
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${statusOpen ? 'rotate-180' : ''}`}
                    />
                  </span>
                </Pill>
              </button>

              {statusOpen && (
                <div
                  className="absolute top-full right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-gray-950 shadow-2xl backdrop-blur-md"
                  onMouseLeave={() => setStatusOpen(false)}
                >
                  {req.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        quickApprove();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-gray-300 transition-colors hover:bg-white/5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      Approve
                    </button>
                  )}
                  {req.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusOpen(false);
                        setShowRejectInput(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-gray-300 transition-colors hover:bg-white/5"
                    >
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                      Reject
                    </button>
                  )}
                  {req.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        quickReset();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-gray-300 transition-colors hover:bg-white/5"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-yellow-400" />
                      Reset to Pending
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(req);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/8 hover:text-white"
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
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="rounded border border-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10 font-semibold"
                  >
                    Del
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="px-0.5 text-[10px] text-gray-500 hover:text-gray-300 font-medium"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(true);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
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

// ─── Guest Application Card ──────────────────────────────────────────────────
function GuestRow({ user, onApprove, onReject, onFlash }) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const isAppeal = user.accountStatus === 'rejected';

  const joinedStr = user.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const lastLoginStr = user.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  async function handleApprove() {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set('userId', user.id);
        await approveMemberAction(fd);
        onApprove(user.id);
        onFlash(`${user.name} approved as guest.`, 'success');
      } catch (err) {
        onFlash(err.message || 'Failed to approve.', 'error');
      }
    });
  }

  async function handleReject() {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set('userId', user.id);
        fd.set('reason', reason || 'Guest application rejected by executive');
        await rejectGuestAction(fd);
        onReject(user.id);
        onFlash(`${user.name}'s application rejected.`, 'success');
      } catch (err) {
        onFlash(err.message || 'Failed to reject.', 'error');
      }
    });
  }

  return (
    <GlassCard
      className={`group relative flex flex-col justify-between overflow-hidden border bg-gray-900/40 p-5 transition-all hover:border-white/[0.12] ${
        isAppeal
          ? 'border-orange-500/20 bg-orange-950/5'
          : 'border-white/[0.06]'
      }`}
    >
      <div>
        {isAppeal && (
          <div className="mb-3.5">
            <Pill tone="orange" icon={RotateCcw}>
              Appeal
            </Pill>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Avatar name={user.name} src={user.avatar} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">
              {user.name}
            </p>
            <p className="truncate text-xs text-gray-500 mt-0.5">{user.email}</p>
            <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
              {joinedStr && (
                <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                  <CalendarDays className="h-3 w-3" />
                  Joined {joinedStr}
                </span>
              )}
              {lastLoginStr && (
                <span className="text-[10px] text-gray-500 font-medium">
                  Last seen {lastLoginStr}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* User message */}
        {user.statusReason && user.statusChangedBy === user.id && (
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[9px] font-bold tracking-wider text-blue-400 uppercase">
                Message from user
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-300">
              {user.statusReason}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 border-t border-white/[0.06] pt-4">
        {showRejectInput ? (
          <div className="space-y-2">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rejection reason (optional)"
              className="w-full rounded-lg border border-red-500/20 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:border-red-500/30 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/15 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ThumbsDown className="h-3 w-3" />
                )}
                Confirm Reject
              </button>
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="px-3 text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              onClick={handleApprove}
              tone="emerald"
              icon={isPending ? Loader2 : ThumbsUp}
              disabled={isPending}
              className="justify-center py-2"
            >
              Approve
            </ActionButton>
            <ActionButton
              onClick={() => setShowRejectInput(true)}
              tone="danger"
              icon={ThumbsDown}
              disabled={isPending}
              className="justify-center py-2"
            >
              Reject
            </ActionButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const MEMBER_PAGE_SIZE = 15;
const GUEST_PAGE_SIZE = 12;

export default function ApplicationsClient({
  initialRequests,
  initialGuestApps,
  executiveId,
}) {
  const [panel, setPanel] = useState('membership'); // 'membership' | 'guest'
  const [flashMsg, setFlashMsg] = useState(null);

  function flash(msg, type = 'success') {
    setFlashMsg({ msg, type });
    setTimeout(() => setFlashMsg(null), 3500);
  }

  // ── MEMBERSHIP STATE ───────────────────────────────────────────────────────
  const [requests, setRequests] = useState(initialRequests ?? []);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailReq, setDetailReq] = useState(null);
  const [bulkPending, startBulkTransition] = useTransition();
  const [memberPage, setMemberPage] = useState(1);

  const memberStats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesTab = activeTab === 'all' || r.status === activeTab;
      const q = search.toLowerCase();
      const name = r.full_name || r.name || '';
      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.student_id?.toLowerCase().includes(q) ||
        r.batch?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.codeforces_handle?.toLowerCase().includes(q) ||
        r.github?.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, search]);

  const allSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((r) => selectedIds.includes(r.id));

  const totalMemberPages = Math.ceil(
    filteredRequests.length / MEMBER_PAGE_SIZE
  );
  const safeMemberPage = Math.min(memberPage, totalMemberPages || 1);
  const paginatedRequests = filteredRequests.slice(
    (safeMemberPage - 1) * MEMBER_PAGE_SIZE,
    safeMemberPage * MEMBER_PAGE_SIZE
  );

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : filteredRequests.map((r) => r.id));
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

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

  // ── GUEST ACCESS STATE ─────────────────────────────────────────────────────
  const [guestApps, setGuestApps] = useState(initialGuestApps ?? []);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestPage, setGuestPage] = useState(1);

  const guestStats = useMemo(
    () => ({
      total: guestApps.length,
      pending: guestApps.filter((u) => u.accountStatus === 'pending').length,
      appeals: guestApps.filter((u) => u.accountStatus === 'rejected').length,
    }),
    [guestApps]
  );

  const filteredGuests = useMemo(() => {
    if (!guestSearch) return guestApps;
    const q = guestSearch.toLowerCase();
    return guestApps.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [guestApps, guestSearch]);

  const totalGuestPages = Math.ceil(filteredGuests.length / GUEST_PAGE_SIZE);
  const safeGuestPage = Math.min(guestPage, totalGuestPages || 1);
  const paginatedGuests = filteredGuests.slice(
    (safeGuestPage - 1) * GUEST_PAGE_SIZE,
    safeGuestPage * GUEST_PAGE_SIZE
  );

  function handleGuestApproved(userId) {
    setGuestApps((prev) => prev.filter((u) => u.id !== userId));
  }

  function handleGuestRejected(userId) {
    setGuestApps((prev) => prev.filter((u) => u.id !== userId));
  }

  // ── TAB CONFIGS ────────────────────────────────────────────────────────────
  const panelTabs = [
    {
      value: 'membership',
      label: 'Membership Applications',
      count: memberStats.pending > 0 ? memberStats.pending : undefined,
      icon: GraduationCap,
    },
    {
      value: 'guest',
      label: 'Guest Access Reviews',
      count: guestStats.total > 0 ? guestStats.total : undefined,
      icon: ShieldCheck,
    },
  ];

  const membershipTabs = [
    { value: 'all', label: 'All Applications', count: memberStats.total, icon: GraduationCap },
    { value: 'pending', label: 'Pending', count: memberStats.pending, icon: Clock },
    { value: 'approved', label: 'Approved', count: memberStats.approved, icon: CheckCircle2 },
    { value: 'rejected', label: 'Rejected', count: memberStats.rejected, icon: XCircle },
  ];

  return (
    <PageShell>
      {/* Page Header */}
      <PageHeader
        icon={GraduationCap}
        title="Applications Review"
        subtitle="Review and manage student membership requests and guest access applications"
        accent="yellow"
        actions={
          <div className="flex items-center gap-2">
            <ActionButton href="/account/executive/users" tone="primary" icon={Users}>
              User Management
            </ActionButton>
            <ActionButton href="/account/executive/roles" tone="violet" icon={ShieldCheck}>
              Role Management
            </ActionButton>
            <ActionButton href="/account/executive" tone="ghost" icon={ArrowLeft}>
              Dashboard
            </ActionButton>
          </div>
        }
        meta={
          <div className="flex flex-wrap gap-2">
            {memberStats.pending > 0 && (
              <Pill tone="amber" icon={Clock}>
                {memberStats.pending} membership pending
              </Pill>
            )}
            {guestStats.pending > 0 && (
              <Pill tone="indigo" icon={ShieldCheck}>
                {guestStats.pending} guest pending
              </Pill>
            )}
          </div>
        }
      />

      {/* Top Level Panel Switcher TabBar */}
      <TabBar tabs={panelTabs} value={panel} onChange={setPanel} />

      {/* Flash Message */}
      <FlashMsg msg={flashMsg?.msg} type={flashMsg?.type} />

      {/* ── MEMBERSHIP APPLICATIONS PANEL ────────────────────────────────────── */}
      {panel === 'membership' && (
        <div className="space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InteractiveStatCard
              icon={GraduationCap}
              label="Total Applications"
              value={memberStats.total}
              accent="violet"
              active={activeTab === 'all'}
              onClick={() => {
                setActiveTab('all');
                setSelectedIds([]);
                setMemberPage(1);
              }}
              delay={0}
            />
            <InteractiveStatCard
              icon={Clock}
              label="Pending Applications"
              value={memberStats.pending}
              accent="amber"
              active={activeTab === 'pending'}
              onClick={() => {
                setActiveTab('pending');
                setSelectedIds([]);
                setMemberPage(1);
              }}
              delay={0.04}
            />
            <InteractiveStatCard
              icon={CheckCircle2}
              label="Approved Applications"
              value={memberStats.approved}
              accent="emerald"
              active={activeTab === 'approved'}
              onClick={() => {
                setActiveTab('approved');
                setSelectedIds([]);
                setMemberPage(1);
              }}
              delay={0.08}
            />
            <InteractiveStatCard
              icon={XCircle}
              label="Rejected Applications"
              value={memberStats.rejected}
              accent="rose"
              active={activeTab === 'rejected'}
              onClick={() => {
                setActiveTab('rejected');
                setSelectedIds([]);
                setMemberPage(1);
              }}
              delay={0.12}
            />
          </div>

          {/* Sub Filters Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabBar
              tabs={membershipTabs}
              value={activeTab}
              onChange={(v) => {
                setActiveTab(v);
                setSelectedIds([]);
                setMemberPage(1);
              }}
            />

            {/* Search applicant */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, email, student ID, department..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setMemberPage(1);
                }}
                className="w-full bg-white/3 border border-white/8 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-gray-600 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setMemberPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bulk Action Bar */}
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

          {/* List Toolbar / Header */}
          {filteredRequests.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
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
                <span className="text-xs text-gray-500 font-medium tabular-nums">
                  {filteredRequests.length > MEMBER_PAGE_SIZE
                    ? `${(safeMemberPage - 1) * MEMBER_PAGE_SIZE + 1}–${Math.min(safeMemberPage * MEMBER_PAGE_SIZE, filteredRequests.length)} of ${filteredRequests.length}`
                    : `${filteredRequests.length} result${filteredRequests.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          )}

          {/* List items */}
          {filteredRequests.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={search ? 'No applications match search' : 'No applications found'}
              description={search ? 'Try adjusting your search criteria.' : 'Submitted membership applications will appear here.'}
              accent="yellow"
            />
          ) : (
            <div className="space-y-3">
              <StaggerList delay={0.02}>
                {paginatedRequests.map((req) => (
                  <ApplicationRow
                    key={req.id}
                    req={req}
                    selected={selectedIds.includes(req.id)}
                    onToggleSelect={toggleSelect}
                    onOpen={setDetailReq}
                    onRefresh={(newStatus) => handleRowRefresh(req.id, newStatus)}
                  />
                ))}
              </StaggerList>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={safeMemberPage}
            totalPages={totalMemberPages}
            totalItems={filteredRequests.length}
            pageSize={MEMBER_PAGE_SIZE}
            onPageChange={setMemberPage}
          />

          {/* Detail Modal */}
          {detailReq && (
            <ApplicationDetailModal
              request={detailReq}
              onClose={() => setDetailReq(null)}
              onUpdated={handleDetailUpdate}
              onDeleted={handleDetailDelete}
            />
          )}
        </div>
      )}

      {/* ── GUEST ACCESS APPLICATIONS PANEL ──────────────────────────────────── */}
      {panel === 'guest' && (
        <div className="space-y-6">
          {/* Guest Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StandardStatCard
              icon={Users}
              label="Total Reviews"
              value={guestStats.total}
              accent="violet"
            />
            <StandardStatCard
              icon={Clock}
              label="Awaiting Review"
              value={guestStats.pending}
              accent="amber"
            />
            <StandardStatCard
              icon={RotateCcw}
              label="Rejection Appeals"
              value={guestStats.appeals}
              accent="orange"
            />
          </div>

          {/* Panel description card */}
          <GlassCard className="border-indigo-500/15 bg-indigo-950/10 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2.5">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-300">
                  Guest Access Applications
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  These are new users who registered via OAuth / Google sign-up and are awaiting executive authorization to access the guest panel.
                  Approving a user grants them restricted, guest-level platform exploration rights without core member privileges.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Filters & Search */}
          {guestApps.length > 0 && (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={guestSearch}
                onChange={(e) => {
                  setGuestSearch(e.target.value);
                  setGuestPage(1);
                }}
                className="w-full bg-white/3 border border-white/8 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-gray-600 transition-all"
              />
              {guestSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setGuestSearch('');
                    setGuestPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Awaiting Review Section */}
          {paginatedGuests.filter((u) => u.accountStatus === 'pending').length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Clock className="h-4.5 w-4.5 text-yellow-400" />
                <h3 className="text-sm font-bold text-white">Awaiting Review</h3>
                <Pill tone="amber" className="py-0.5 px-2 text-[10px]">
                  {guestStats.pending}
                </Pill>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StaggerList delay={0.02}>
                  {paginatedGuests
                    .filter((u) => u.accountStatus === 'pending')
                    .map((user) => (
                      <GuestRow
                        key={user.id}
                        user={user}
                        onApprove={handleGuestApproved}
                        onReject={handleGuestRejected}
                        onFlash={flash}
                      />
                    ))}
                </StaggerList>
              </div>
            </div>
          )}

          {/* Appeals Section */}
          {paginatedGuests.filter((u) => u.accountStatus === 'rejected').length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1 border-t border-white/[0.06] pt-6">
                <RotateCcw className="h-4.5 w-4.5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Rejection Appeals</h3>
                <Pill tone="orange" className="py-0.5 px-2 text-[10px]">
                  {guestStats.appeals}
                </Pill>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StaggerList delay={0.02}>
                  {paginatedGuests
                    .filter((u) => u.accountStatus === 'rejected')
                    .map((user) => (
                      <GuestRow
                        key={user.id}
                        user={user}
                        onApprove={handleGuestApproved}
                        onReject={handleGuestRejected}
                        onFlash={flash}
                      />
                    ))}
                </StaggerList>
              </div>
            </div>
          )}

          {/* Guest Pagination */}
          {filteredGuests.length > 0 && (
            <Pagination
              currentPage={safeGuestPage}
              totalPages={totalGuestPages}
              totalItems={filteredGuests.length}
              pageSize={GUEST_PAGE_SIZE}
              onPageChange={setGuestPage}
            />
          )}

          {/* Guest Access empty states */}
          {guestApps.length === 0 && (
            <EmptyState
              icon={ShieldCheck}
              title="No pending guest requests"
              description="New sign-ups awaiting guest dashboard authorization will appear here."
              accent="indigo"
            />
          )}

          {guestApps.length > 0 && filteredGuests.length === 0 && (
            <EmptyState
              icon={Search}
              title="No guest reviews match search"
              description={`No users found matching "${guestSearch}".`}
              accent="gray"
            />
          )}
        </div>
      )}
    </PageShell>
  );
}
