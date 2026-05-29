/**
 * @file Submission detail modal — read-only overlay showing the full
 *   content of a contact submission with reply / status-change actions.
 * @module ExecutiveSubmissionDetailModal
 */

'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  X,
  User,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  Archive,
  Trash2,
  Loader2,
  Copy,
  ExternalLink,
  Globe,
  Monitor,
} from 'lucide-react';
import {
  updateContactStatusAction,
  deleteContactSubmissionAction,
} from '@/app/_lib/contact-actions';
import { getStatusConfig } from './contactConfig';

function InfoRow({ icon: Icon, label, value, copyable }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/[0.04]">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-bold tracking-wide text-gray-500 uppercase">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm leading-relaxed break-all text-gray-200 font-medium">
            {value}
          </p>
          {copyable && (
            <button
              onClick={handleCopy}
              className="shrink-0 rounded p-0.5 text-gray-500 transition-colors hover:text-gray-300"
              title="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
          {copied && (
            <span className="text-[10px] text-green-400 font-medium">Copied!</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubmissionDetailModal({
  submission,
  onClose,
  onUpdated,
}) {
  const [isPending, startTransition] = useTransition();
  const [deletePending, setDeletePending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const sc = getStatusConfig(submission.status);

  async function handleStatusChange(newStatus) {
    if (newStatus === submission.status) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', submission.id);
      fd.set('status', newStatus);
      const result = await updateContactStatusAction(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Marked as ${newStatus}`);
        onUpdated?.({ ...submission, status: newStatus });
      }
    });
  }

  async function handleDelete() {
    setDeletePending(true);
    const fd = new FormData();
    fd.set('id', submission.id);
    const result = await deleteContactSubmissionAction(fd);
    setDeletePending(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Submission deleted successfully');
      onClose();
    }
  }

  const dateFormatted = submission.created_at
    ? new Date(submission.created_at).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  const repliedAtFormatted = submission.replied_at
    ? new Date(submission.replied_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const STATUS_ACTIONS = [
    {
      value: 'read',
      label: 'Mark Read',
      icon: CheckCircle2,
      color: 'text-blue-400 hover:bg-blue-500/10 border-blue-500/20',
    },
    {
      value: 'replied',
      label: 'Mark Replied',
      icon: MessageSquare,
      color: 'text-green-400 hover:bg-green-500/10 border-green-500/20',
    },
    {
      value: 'archived',
      label: 'Archive',
      icon: Archive,
      color: 'text-yellow-400 hover:bg-yellow-500/10 border-yellow-500/20',
    },
    {
      value: 'new',
      label: 'Mark New',
      icon: Clock,
      color: 'text-purple-400 hover:bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.35 }}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 shadow-2xl shadow-black/80 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <MessageSquare className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-white leading-snug">
                {submission.subject || 'No Subject'}
              </h2>
              <p className="text-xs text-gray-400 font-medium">Submission Detail</p>
            </div>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${sc.badgeClass}`}
            >
              <sc.icon className="h-3 w-3 animate-pulse" />
              {sc.label}
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-white/8 hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 scrollbar-thin">
          {/* Sender Info Group */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-950/20 p-5">
            <h3 className="mb-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Sender Information
            </h3>
            <div className="divide-y divide-white/[0.04]">
              <InfoRow icon={User} label="Name" value={submission.name} />
              <InfoRow
                icon={Mail}
                label="Email"
                value={submission.email}
                copyable
              />
              <InfoRow icon={Clock} label="Submitted" value={dateFormatted} />
            </div>
            {/* Quick email reply CTA */}
            <a
              href={`mailto:${submission.email}?subject=Re: ${encodeURIComponent(submission.subject || 'Your inquiry')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/15"
            >
              <Mail className="h-4 w-4" />
              Reply via Email
              <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
            </a>
          </div>

          {/* Message Content Group */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-950/20 p-5">
            <h3 className="mb-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Message Content
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-200 font-medium">
              {submission.message}
            </p>
          </div>

          {/* Technical Metadata Group */}
          {(submission.ip_address || submission.user_agent) && (
            <div className="rounded-2xl border border-white/[0.06] bg-slate-950/20 p-5">
              <h3 className="mb-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Technical Details
              </h3>
              <div className="divide-y divide-white/[0.04]">
                {submission.ip_address && (
                  <InfoRow
                    icon={Globe}
                    label="IP Address"
                    value={submission.ip_address}
                    copyable
                  />
                )}
                {submission.user_agent && (
                  <InfoRow
                    icon={Monitor}
                    label="User Agent"
                    value={submission.user_agent}
                  />
                )}
              </div>
            </div>
          )}

          {/* Replied Banner */}
          {submission.status === 'replied' && repliedAtFormatted && (
            <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-green-400" />
              <p className="text-xs text-green-300 font-medium leading-relaxed">
                Replied on {repliedAtFormatted}
                {submission.replied_by_name && (
                  <>
                    {' '}
                    by{' '}
                    <span className="font-bold">
                      {submission.replied_by_name}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions Panel */}
        <div className="border-t border-white/[0.08] px-6 py-5 bg-slate-950/10">
          <p className="mb-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            Change Status
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUS_ACTIONS.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => handleStatusChange(value)}
                disabled={isPending || submission.status === value}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${color} ${
                  submission.status === value
                    ? 'cursor-default opacity-40'
                    : 'hover:scale-[1.02] active:scale-95'
                }`}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                {label}
              </button>
            ))}
          </div>

          {/* Delete & Close Operations */}
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Permanently delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deletePending}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/25 disabled:opacity-50"
                >
                  {deletePending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Submission
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] bg-white/5 px-5 py-1.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
