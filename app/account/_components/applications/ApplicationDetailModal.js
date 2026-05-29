/**
 * @file Application Detail modal component
 * @module ApplicationDetailModal
 */

'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Phone,
  BookOpen,
  Code,
  Github,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Loader2,
  RotateCcw,
  Copy,
  ExternalLink,
  GraduationCap,
  Hash,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { getStatusConfig } from './applicationConfig';
import {
  approveApplicationAction,
  rejectApplicationAction,
  resetApplicationAction,
  deleteApplicationAction,
} from '@/app/_lib/application-actions';
import { useScrollLock } from '@/app/_lib/hooks';

// Shared UI components
import {
  GlassCard,
  Pill,
  Avatar,
} from '@/app/account/_components/ui';

function InfoItem({ icon: Icon, label, value, mono, href, copyable }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!value) return null;

  return (
    <div className="flex items-start gap-3.5 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.04] bg-white/5">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[9px] font-bold tracking-wider text-gray-500 uppercase">
          {label}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-semibold break-all text-violet-400 transition-colors hover:text-violet-300"
            >
              {value}
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </a>
          ) : (
            <p
              className={`text-sm font-semibold leading-relaxed break-all text-gray-200 ${mono ? 'font-mono' : ''}`}
            >
              {value}
            </p>
          )}
          {copyable && (
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded p-1 text-gray-500 hover:bg-white/5 transition-all hover:text-gray-300"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
          {copied && (
            <span className="shrink-0 text-[10px] font-semibold text-green-400">Copied!</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetailModal({
  request,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const [isPending, startTransition] = useTransition();
  useScrollLock();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(
    request.rejection_reason || ''
  );
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const sc = getStatusConfig(request.status);

  function showMsg(type, msg) {
    setActionMsg({ type, msg });
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function handleApprove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', request.id);
      const result = await approveApplicationAction(fd);
      if (result?.error) {
        showMsg('error', result.error);
      } else {
        onUpdated?.({ ...request, status: 'approved', rejection_reason: null });
      }
    });
  }

  async function handleReject() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', request.id);
      fd.set('rejection_reason', rejectionReason);
      const result = await rejectApplicationAction(fd);
      if (result?.error) {
        showMsg('error', result.error);
      } else {
        setShowRejectForm(false);
        onUpdated?.({
          ...request,
          status: 'rejected',
          rejection_reason: rejectionReason,
        });
      }
    });
  }

  async function handleReset() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', request.id);
      const result = await resetApplicationAction(fd);
      if (result?.error) {
        showMsg('error', result.error);
      } else {
        onUpdated?.({
          ...request,
          status: 'pending',
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
        });
      }
    });
  }

  async function handleDelete() {
    setDeletePending(true);
    const fd = new FormData();
    fd.set('id', request.id);
    const result = await deleteApplicationAction(fd);
    setDeletePending(false);
    if (result?.error) {
      showMsg('error', result.error);
    } else {
      onDeleted?.();
      onClose();
    }
  }

  const submittedAt = request.created_at
    ? new Date(request.created_at).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const reviewedAt = request.reviewed_at
    ? new Date(request.reviewed_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Parse interests
  const interests = request.interests
    ? request.interests
        .split(/[,\n|;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const getPillTone = (status) => {
    if (status === 'approved') return 'emerald';
    if (status === 'rejected') return 'rose';
    return 'amber';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-950/90 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-4.5">
          <div className="flex min-w-0 items-center gap-3.5">
            <Avatar name={request.name} src={request.avatar} size="md" />
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-white leading-tight">
                {request.name}
              </h2>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5 tracking-wider uppercase">
                Membership Request
              </p>
            </div>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-3">
            <Pill tone={getPillTone(request.status)} icon={sc.icon}>
              {sc.label}
            </Pill>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/4 text-gray-400 transition-all hover:bg-white/8 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action message */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pt-4"
            >
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${
                  actionMsg.type === 'error'
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-green-500/30 bg-green-500/10 text-green-300'
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {actionMsg.msg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 scrollbar-thin">
          {/* Visual multi-column grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Personal info */}
            <GlassCard className="border-white/[0.04] bg-white/[0.01] p-4.5 flex flex-col justify-between">
              <div>
                <h3 className="mb-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                  Personal Information
                </h3>
                <div className="divide-y divide-white/[0.04]">
                  <InfoItem icon={User} label="Full Name" value={request.name} />
                  <InfoItem
                    icon={Mail}
                    label="Email Address"
                    value={request.email}
                    copyable
                  />
                  <InfoItem icon={Phone} label="Phone Number" value={request.phone} />
                </div>
              </div>
              <a
                href={`mailto:${request.email}`}
                className="mt-4 flex w-fit items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
              >
                <Mail className="h-3.5 w-3.5" />
                Reply via Email
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </GlassCard>

            {/* Academic info */}
            <GlassCard className="border-white/[0.04] bg-white/[0.01] p-4.5">
              <h3 className="mb-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                Academic Details
              </h3>
              <div className="divide-y divide-white/[0.04]">
                <InfoItem
                  icon={Hash}
                  label="Student ID"
                  value={request.student_id}
                  mono
                  copyable
                />
                <InfoItem
                  icon={CalendarDays}
                  label="Academic Session"
                  value={request.batch}
                />
                <InfoItem
                  icon={BookOpen}
                  label="Department"
                  value={request.department}
                />
              </div>
            </GlassCard>
          </div>

          {/* Online presence */}
          {(request.codeforces_handle || request.github) && (
            <GlassCard className="border-white/[0.04] bg-white/[0.01] p-4.5">
              <h3 className="mb-2.5 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                Coding Profiles
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {request.codeforces_handle && (
                  <div className="rounded-xl border border-white/[0.04] bg-white/5 p-3">
                    <p className="text-[9px] font-bold tracking-wider text-gray-500 uppercase mb-1">
                      Codeforces Profile
                    </p>
                    <a
                      href={`https://codeforces.com/profile/${request.codeforces_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Code className="h-4 w-4 shrink-0 text-blue-400" />
                      {request.codeforces_handle}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                )}
                {request.github && (
                  <div className="rounded-xl border border-white/[0.04] bg-white/5 p-3">
                    <p className="text-[9px] font-bold tracking-wider text-gray-500 uppercase mb-1">
                      GitHub Profile
                    </p>
                    <a
                      href={
                        request.github.startsWith('http')
                          ? request.github
                          : `https://github.com/${request.github}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      <Github className="h-4 w-4 shrink-0 text-violet-400" />
                      {request.github.replace(/https?:\/\/(www\.)?github\.com\//, '')}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <GlassCard className="border-white/[0.04] bg-white/[0.01] p-4.5">
              <h3 className="mb-3 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                Stated Interests & Technical Fields
              </h3>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, i) => (
                  <Pill key={i} tone="violet" className="py-1 px-3">
                    {interest}
                  </Pill>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Reason */}
          {request.reason && (
            <GlassCard className="border-white/[0.04] bg-white/[0.01] p-4.5">
              <h3 className="mb-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                Platform Statement / Why do you want to join?
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-300 font-medium">
                &ldquo;{request.reason}&rdquo;
              </p>
            </GlassCard>
          )}

          {/* Meta & Audit */}
          <GlassCard className="border-white/[0.04] bg-white/[0.01] p-4.5">
            <h3 className="mb-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              Submission History & Audit Logs
            </h3>
            <div className="divide-y divide-white/[0.04]">
              <InfoItem
                icon={CalendarDays}
                label="Application Submitted At"
                value={submittedAt}
              />
              {reviewedAt && (
                <InfoItem
                  icon={CheckCircle2}
                  label="Application Reviewed At"
                  value={reviewedAt}
                />
              )}
            </div>
          </GlassCard>

          {/* Rejection notice */}
          {request.status === 'rejected' && request.rejection_reason && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <XCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-400" />
              <div>
                <p className="text-xs font-bold text-red-300 uppercase tracking-wider mb-1">
                  Rejection Cause & Comments
                </p>
                <p className="text-sm text-red-200 leading-relaxed font-semibold">
                  {request.rejection_reason}
                </p>
              </div>
            </div>
          )}

          {/* Reject form (inline) */}
          {showRejectForm && (
            <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4.5">
              <label className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-red-400" />
                Specify Rejection Reason (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Explain the reason for rejecting this application..."
                className="w-full resize-none rounded-xl border border-red-500/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/30 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Confirm Rejection
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="rounded-xl px-3 py-2 text-xs text-gray-500 transition-colors hover:text-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
          {/* Primary actions */}
          <div className="flex flex-wrap gap-2">
            {request.status !== 'approved' && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/15 px-4 py-2.5 text-sm font-bold text-green-300 transition-all hover:scale-[1.01] hover:bg-green-500/25 active:scale-95 disabled:opacity-50 shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Approve Request
              </button>
            )}
            {request.status !== 'rejected' && !showRejectForm && (
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-2.5 text-sm font-bold text-red-300 transition-all hover:scale-[1.01] hover:bg-red-500/25 active:scale-95 disabled:opacity-50 shadow-sm"
              >
                <XCircle className="h-4 w-4" />
                Reject Request
              </button>
            )}
            {request.status !== 'pending' && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-2.5 text-sm font-bold text-yellow-300 transition-all hover:scale-[1.01] hover:bg-yellow-500/20 active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Status
              </button>
            )}
          </div>

          {/* Delete + close */}
          <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  Permanently delete applicant?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deletePending}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                >
                  {deletePending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2 py-1.5 text-xs text-gray-500 transition-colors hover:text-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Application
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
