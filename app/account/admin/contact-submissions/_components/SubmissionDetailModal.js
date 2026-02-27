'use client';

import { useState, useTransition } from 'react';
import {
  X,
  User,
  Mail,
  MessageSquare,
  Clock,
  Shield,
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
    setTimeout(() => setCopied(false), 1500);
  }

  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-medium tracking-wide text-gray-500 uppercase">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm leading-relaxed break-all text-gray-200">
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
            <span className="text-[10px] text-green-400">Copied!</span>
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
  const [actionStatus, setActionStatus] = useState(null); // { type, message }

  const sc = getStatusConfig(submission.status);

  function showStatus(type, message) {
    setActionStatus({ type, message });
    setTimeout(() => setActionStatus(null), 2500);
  }

  async function handleStatusChange(newStatus) {
    if (newStatus === submission.status) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', submission.id);
      fd.set('status', newStatus);
      const result = await updateContactStatusAction(fd);
      if (result?.error) {
        showStatus('error', result.error);
      } else {
        showStatus('success', `Marked as ${newStatus}`);
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
      showStatus('error', result.error);
    } else {
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
      label: 'Mark as Read',
      icon: CheckCircle2,
      color: 'text-blue-400 hover:bg-blue-500/10 border-blue-500/20',
    },
    {
      value: 'replied',
      label: 'Mark as Replied',
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
      label: 'Mark as New',
      icon: Clock,
      color: 'text-purple-400 hover:bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-950 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
              <MessageSquare className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-white">
                {submission.subject || 'No Subject'}
              </h2>
              <p className="text-xs text-gray-500">Submission Detail</p>
            </div>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sc.badgeClass}`}
            >
              <sc.icon className="h-3 w-3" />
              {sc.label}
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/8 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status notification */}
        {actionStatus && (
          <div
            className={`mx-6 mt-4 rounded-xl border px-4 py-2.5 text-sm ${
              actionStatus.type === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-green-500/30 bg-green-500/10 text-green-300'
            }`}
          >
            {actionStatus.message}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {/* Sender Info */}
          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Sender Information
            </h3>
            <div className="divide-y divide-white/5">
              <InfoRow icon={User} label="Name" value={submission.name} />
              <InfoRow
                icon={Mail}
                label="Email"
                value={submission.email}
                copyable
              />
              <InfoRow icon={Clock} label="Submitted" value={dateFormatted} />
            </div>
            {/* Quick email button */}
            <a
              href={`mailto:${submission.email}?subject=Re: ${encodeURIComponent(submission.subject || 'Your inquiry')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/15"
            >
              <Mail className="h-3.5 w-3.5" />
              Reply via Email
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </a>
          </div>

          {/* Message */}
          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Message
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-200">
              {submission.message}
            </p>
          </div>

          {/* Technical Info */}
          {(submission.ip_address || submission.user_agent) && (
            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Technical Details
              </h3>
              <div className="divide-y divide-white/5">
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

          {/* Reply info */}
          {submission.status === 'replied' && repliedAtFormatted && (
            <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/8 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
              <p className="text-xs text-green-300">
                Replied on {repliedAtFormatted}
                {submission.replied_by_name && (
                  <>
                    {' '}
                    by{' '}
                    <span className="font-semibold">
                      {submission.replied_by_name}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/8 px-6 py-4">
          <p className="mb-3 text-xs font-medium text-gray-500">
            Change Status
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUS_ACTIONS.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => handleStatusChange(value)}
                disabled={isPending || submission.status === value}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${color} ${
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

          {/* Delete */}
          <div className="mt-4 flex items-center justify-between">
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deletePending}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                >
                  {deletePending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Yes, delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2 py-1.5 text-xs text-gray-500 transition-colors hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/15"
              >
                <Trash2 className="h-3 w-3" />
                Delete Submission
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
