/**
 * @file Contact submissions client — management interface for reviewing,
 *   filtering, and responding to user-submitted contact messages.
 * @module ContactSubmissionsClient
 */

'use client';

import { useState, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Mail,
  Search,
  Clock,
  Eye,
  Archive,
  CheckCircle2,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  SquareCheck,
  Square,
  X,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import SubmissionDetailModal from './SubmissionDetailModal';
import { getStatusConfig, ALL_STATUSES } from './contactConfig';
import {
  updateContactStatusAction,
  deleteContactSubmissionAction,
  bulkUpdateContactStatusAction,
  bulkDeleteContactSubmissionsAction,
  markContactReadAction,
} from '@/app/_lib/contact-actions';
import {
  PageShell,
  PageHeader,
  TabBar,
  GlassCard,
  EmptyState,
  ActionButton,
} from '@/app/account/_components/ui';

// ─── Custom Interactive Stat Card ──────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent = 'blue', active, onClick }) {
  const accentClasses = {
    blue: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      activeBorder: 'border-blue-500/40 bg-blue-500/10 ring-1 ring-blue-500/20 shadow-md shadow-blue-900/10',
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      activeBorder: 'border-purple-500/40 bg-purple-500/10 ring-1 ring-purple-500/20 shadow-md shadow-purple-900/10',
    },
    sky: {
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      activeBorder: 'border-sky-500/40 bg-sky-500/10 ring-1 ring-sky-500/20 shadow-md shadow-sky-900/10',
    },
    green: {
      bg: 'bg-green-500/10 text-green-400 border-green-500/20',
      activeBorder: 'border-green-500/40 bg-green-500/10 ring-1 ring-green-500/20 shadow-md shadow-green-900/10',
    },
    yellow: {
      bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      activeBorder: 'border-yellow-500/40 bg-yellow-500/10 ring-1 ring-yellow-500/20 shadow-md shadow-yellow-900/10',
    },
  };

  const style = accentClasses[accent] || accentClasses.blue;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left backdrop-blur-md transition-all duration-300 ${
        active
          ? `${style.activeBorder}`
          : 'border-white/[0.06] bg-slate-950/20 hover:border-white/[0.12] hover:bg-slate-900/40'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
          active ? style.bg : 'border-white/[0.08] bg-white/5 text-gray-400'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-400 font-medium tracking-wide uppercase">{label}</div>
        <div className="mt-0.5 text-2xl font-black text-white tabular-nums">{value}</div>
      </div>
    </button>
  );
}

// ─── Bulk Action Bar ───────────────────────────────────────────────────────────

function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkStatus,
  onBulkDelete,
  isPending,
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <SquareCheck className="h-4 w-4 text-amber-400 animate-pulse" />
        <span className="text-sm font-semibold text-amber-300">
          {selectedCount} selected
        </span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          onClick={() => onBulkStatus('read')}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-all hover:bg-blue-500/20 disabled:opacity-50"
        >
          <Eye className="h-3 w-3" /> Mark Read
        </button>
        <button
          onClick={() => onBulkStatus('replied')}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl border border-green-500/25 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300 transition-all hover:bg-green-500/20 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3 w-3" /> Mark Replied
        </button>
        <button
          onClick={() => onBulkStatus('archived')}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-300 transition-all hover:bg-yellow-500/20 disabled:opacity-50"
        >
          <Archive className="h-3 w-3" /> Archive
        </button>
        {deleteConfirm ? (
          <>
            <span className="text-xs text-rose-300 font-semibold">
              Delete {selectedCount}?
            </span>
            <button
              onClick={() => {
                setDeleteConfirm(false);
                onBulkDelete();
              }}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-500/25 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> Confirm
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="px-2 py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/15 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        )}
        <button
          onClick={onClearSelection}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/8 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Submission Row ───────────────────────────────────────────────────────────

function SubmissionRow({
  sub,
  selected,
  onToggleSelect,
  onOpen,
  onStatusChange,
  onDelete,
}) {
  const sc = getStatusConfig(sub.status);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dateStr = sub.created_at
    ? new Date(sub.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const timeStr = sub.created_at
    ? new Date(sub.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  function handleStatusChange(newStatus) {
    setStatusOpen(false);
    if (newStatus === sub.status) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', sub.id);
      fd.set('status', newStatus);
      await updateContactStatusAction(fd);
      onStatusChange?.();
      toast.success(`Status updated to ${newStatus}`);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', sub.id);
      await deleteContactSubmissionAction(fd);
      onDelete?.();
      toast.success('Submission deleted successfully');
    });
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } },
      }}
      className={`group relative flex items-start gap-4 rounded-2xl border bg-slate-950/20 px-4 py-4 transition-all duration-300 hover:border-white/12 hover:bg-slate-900/40 sm:items-center ${
        selected ? 'border-amber-500/30 bg-amber-500/[0.02]' : 'border-white/[0.06]'
      } ${sc.rowClass}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleSelect(sub.id)}
        className="mt-0.5 shrink-0 text-gray-500 transition-colors hover:text-amber-400 sm:mt-0"
      >
        {selected ? (
          <SquareCheck className="h-4 w-4 text-amber-500" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>

      {/* New dot */}
      {sub.status === 'new' && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400 sm:mt-0 animate-pulse shadow-md shadow-amber-500/50" />
      )}

      {/* Main content — clickable */}
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => onOpen(sub)}
      >
        {/* Top row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              {sub.name}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0 text-gray-500" />
            <span className="truncate text-xs text-gray-400">{sub.email}</span>
          </div>
        </div>

        {/* Subject */}
        {sub.subject && (
          <p className="mt-1 truncate text-sm font-semibold text-gray-300">
            {sub.subject}
          </p>
        )}

        {/* Message preview */}
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
          {sub.message}
        </p>

        {/* Date */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[11px] text-gray-500 font-medium">
            {dateStr} · {timeStr}
          </span>
        </div>
      </div>

      {/* Right side — badges + actions */}
      <div className="ml-2 flex shrink-0 flex-col items-end gap-2.5">
        {/* Status badge with dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStatusOpen((v) => !v);
            }}
            disabled={isPending}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:scale-[1.03] active:scale-95 ${sc.badgeClass}`}
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
              className="absolute top-full right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/12 bg-gray-950 shadow-2xl shadow-black/60"
              onMouseLeave={() => setStatusOpen(false)}
            >
              {ALL_STATUSES.map((st) => {
                const cfg = getStatusConfig(st);
                return (
                  <button
                    key={st}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(st);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-xs transition-colors hover:bg-white/6 ${
                      st === sub.status
                        ? 'font-semibold text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    <cfg.icon className="h-3 w-3" />
                    {cfg.label}
                    {st === sub.status && (
                      <CheckCircle2 className="ml-auto h-3 w-3 text-green-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete */}
        {deleteConfirm ? (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(false);
                handleDelete();
              }}
              disabled={isPending}
              className="rounded border border-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400 hover:bg-rose-500/10"
            >
              Confirm
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(false);
              }}
              className="rounded px-2 py-0.5 text-[10px] text-gray-500 hover:text-gray-300"
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
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Contact Page Live Info Panel ────────────────────────────────────────────

function ContactInfoPanel({ contactInfo, socialLinks, faqs }) {
  const [open, setOpen] = useState(false);

  const hasSocials = socialLinks && Object.values(socialLinks).some(Boolean);

  const SOCIAL_LABELS = {
    facebook: 'FB',
    linkedin: 'LI',
    github: 'GH',
    youtube: 'YT',
    twitter: 'X',
  };

  return (
    <GlassCard className="overflow-hidden !p-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <Globe className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
          Contact Page Live Info
          <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300">
            Public
          </span>
        </span>
        <div className="flex items-center gap-3">
          <a
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] text-gray-500 transition-colors hover:text-gray-300"
          >
            View page <ExternalLink className="h-3 w-3" />
          </a>
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] bg-slate-900/10 px-5 py-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {contactInfo?.email && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.04] bg-slate-950/20 px-3.5 py-3">
                    <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        Email
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-300">
                        {contactInfo.email}
                      </p>
                    </div>
                  </div>
                )}
                {contactInfo?.phone && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.04] bg-slate-950/20 px-3.5 py-3">
                    <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        Phone
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-300">
                        {contactInfo.phone}
                      </p>
                    </div>
                  </div>
                )}
                {contactInfo?.officeHours && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.04] bg-slate-950/20 px-3.5 py-3">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        Hours
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-300">
                        {contactInfo.officeHours}
                      </p>
                    </div>
                  </div>
                )}
                {contactInfo?.address && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.04] bg-slate-950/20 px-3.5 py-3">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        Address
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-300 leading-relaxed">
                        {contactInfo.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {(hasSocials || (faqs && faqs.length > 0)) && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.04]">
                  {hasSocials && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        Social links:
                      </span>
                      <div className="flex gap-1.5">
                        {Object.entries(socialLinks).map(([key, url]) =>
                          url ? (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-white/[0.08] bg-white/3 px-2 py-0.5 text-[10px] font-medium text-gray-400 transition-colors hover:border-white/15 hover:text-gray-200"
                            >
                              {SOCIAL_LABELS[key] ?? key}
                            </a>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                  {faqs && faqs.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="h-3 w-3 text-gray-500" />
                      <span className="text-[11px] text-gray-400">
                        {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''} published
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!contactInfo?.email &&
                !contactInfo?.phone &&
                !contactInfo?.address && (
                  <p className="text-xs text-gray-500">
                    No contact info configured yet.{' '}
                    <a
                      href={`/account/${role}/settings`}
                      className="text-amber-400 underline hover:text-amber-300"
                    >
                      Configure in Settings
                    </a>
                  </p>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function ContactSubmissionsClient({
  initialSubmissions,
  contactInfo,
  socialLinks,
  faqs,
  role = 'admin',
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions ?? []);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailSub, setDetailSub] = useState(null);
  const [bulkPending, startBulkTransition] = useTransition();

  // ── stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: submissions.length,
      new: submissions.filter((s) => s.status === 'new').length,
      read: submissions.filter((s) => s.status === 'read').length,
      replied: submissions.filter((s) => s.status === 'replied').length,
      archived: submissions.filter((s) => s.status === 'archived').length,
    }),
    [submissions]
  );

  // ── filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchesTab = activeTab === 'all' || s.status === activeTab;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.subject?.toLowerCase().includes(q) ||
        s.message?.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [submissions, activeTab, search]);

  // ── selection helpers ──────────────────────────────────────────────────────
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((s) => s.id));
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // ── Open detail (mark read) ────────────────────────────────────────────────
  async function openDetail(sub) {
    setDetailSub(sub);
    if (sub.status === 'new') {
      await markContactReadAction(sub.id);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: 'read' } : s))
      );
      setDetailSub((prev) => (prev ? { ...prev, status: 'read' } : null));
    }
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────
  function handleBulkStatus(status) {
    startBulkTransition(async () => {
      const fd = new FormData();
      fd.set('ids', JSON.stringify(selectedIds));
      fd.set('status', status);
      const result = await bulkUpdateContactStatusAction(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setSubmissions((prev) =>
          prev.map((s) => (selectedIds.includes(s.id) ? { ...s, status } : s))
        );
        setSelectedIds([]);
        toast.success(
          `${result.updated} submission${result.updated > 1 ? 's' : ''} marked as ${status}`
        );
      }
    });
  }

  function handleBulkDelete() {
    startBulkTransition(async () => {
      const fd = new FormData();
      fd.set('ids', JSON.stringify(selectedIds));
      const result = await bulkDeleteContactSubmissionsAction(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setSubmissions((prev) =>
          prev.filter((s) => !selectedIds.includes(s.id))
        );
        setSelectedIds([]);
        toast.success(
          `${result.deleted} submission${result.deleted > 1 ? 's' : ''} deleted`
        );
      }
    });
  }

  // ── After detail update ────────────────────────────────────────────────────
  function handleDetailUpdate(updated) {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    setDetailSub(updated);
  }

  const STAT_CARDS = [
    {
      icon: Mail,
      label: 'Total',
      value: stats.total,
      accent: 'blue',
      tab: 'all',
    },
    {
      icon: Clock,
      label: 'New',
      value: stats.new,
      accent: 'purple',
      tab: 'new',
    },
    {
      icon: Eye,
      label: 'Read',
      value: stats.read,
      accent: 'sky',
      tab: 'read',
    },
    {
      icon: CheckCircle2,
      label: 'Replied',
      value: stats.replied,
      accent: 'green',
      tab: 'replied',
    },
    {
      icon: Archive,
      label: 'Archived',
      value: stats.archived,
      accent: 'yellow',
      tab: 'archived',
    },
  ];

  return (
    <PageShell>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Contact Submissions"
        subtitle="Manage, organize, and follow up on inquiries from members and the public"
        icon={Mail}
        accent="purple"
        breadcrumbs={[
          { label: 'Dashboard', href: `/account/${role}` },
          { label: 'Submissions' },
        ]}
        actions={
          <ActionButton
            href={`/account/${role}`}
            tone="gray"
            className="text-xs font-semibold animate-pulse"
          >
            ← Dashboard
          </ActionButton>
        }
      />

      {/* ─── Contact Page Live Info ─────────────────────────────────────────── */}
      {(contactInfo || socialLinks || (faqs && faqs.length > 0)) && (
        <ContactInfoPanel
          contactInfo={contactInfo}
          socialLinks={socialLinks}
          faqs={faqs}
        />
      )}

      {/* ─── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map(({ icon, label, value, accent, tab }) => (
          <StatCard
            key={tab}
            icon={icon}
            label={label}
            value={value}
            accent={accent}
            active={activeTab === tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedIds([]);
            }}
          />
        ))}
      </div>

      {/* ─── Tabs & Filters Row ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabBar
            tabs={STAT_CARDS.map((tc) => ({
              value: tc.tab,
              label: tc.label,
              count: tc.value,
              icon: tc.icon,
            }))}
            value={activeTab}
            onChange={(val) => {
              setActiveTab(val);
              setSelectedIds([]);
            }}
          />

          {/* Search Glass Toolbar */}
          <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between !p-2 md:!p-1.5 md:bg-transparent md:border-none md:shadow-none" padding="p-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search sender, email, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-slate-950/40 py-2 pr-10 pl-10 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all hover:bg-slate-950/60 focus:border-amber-500/20 focus:ring-1 focus:ring-amber-500/10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Selection Details Header */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-950/20 px-3 py-1.5 text-[11px] font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                {allFilteredSelected ? (
                  <SquareCheck className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
                {allFilteredSelected ? 'Deselect all' : 'Select all'}
              </button>
              <span className="text-xs text-gray-500 font-medium">
                {filtered.length} matching submission{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bulk Action Bar ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <BulkActionBar
              selectedCount={selectedIds.length}
              onClearSelection={() => setSelectedIds([])}
              onBulkStatus={handleBulkStatus}
              onBulkDelete={handleBulkDelete}
              isPending={bulkPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Submissions List ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={
            activeTab === 'all' ? 'No submissions yet' :
            activeTab === 'new' ? 'No new messages' :
            activeTab === 'read' ? 'No read messages' :
            activeTab === 'replied' ? 'No replied messages' :
            'No archived messages'
          }
          description={
            search
              ? 'Try adjusting your search terms or filters.'
              : activeTab === 'all'
              ? 'All contact form messages will appear here.'
              : activeTab === 'new'
              ? 'All messages have been reviewed. Excellent!'
              : 'No messages found in this status.'
          }
          accent="purple"
        />
      ) : (
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filtered.map((sub) => (
            <SubmissionRow
              key={sub.id}
              sub={sub}
              selected={selectedIds.includes(sub.id)}
              onToggleSelect={toggleSelect}
              onOpen={openDetail}
              onStatusChange={() => {}}
              onDelete={() => {
                setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
                setSelectedIds((prev) => prev.filter((id) => id !== sub.id));
              }}
            />
          ))}
        </motion.div>
      )}

      {/* ─── Detail Modal ───────────────────────────────────────────────────── */}
      {detailSub && (
        <SubmissionDetailModal
          submission={detailSub}
          onClose={() => setDetailSub(null)}
          onUpdated={handleDetailUpdate}
        />
      )}
    </PageShell>
  );
}
