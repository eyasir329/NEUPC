/**
 * @file Advisor approvals client component
 * @module AdvisorApprovalsClient
 */

'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  UserCheck,
  UserPlus,
  DollarSign,
  CheckCircle,
  XCircle,
  Search,
  Mail,
  Phone,
  Calendar,
  X,
  AlertCircle,
  ClipboardCheck,
  Building,
  GraduationCap,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Award,
  BookOpen,
  Loader,
} from 'lucide-react';
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
  approveMemberProfileAction,
  approveBudgetEntryAction,
} from '@/app/_lib/actions/advisor-actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  TabBar,
  Pill,
  Avatar,
  EmptyState,
  StatCard,
} from '@/app/account/_components/ui';
import toast from 'react-hot-toast';

const TAB_DEFS = [
  { value: 'join-requests', label: 'Join Requests', icon: UserPlus },
  { value: 'member-profiles', label: 'Member Profiles', icon: UserCheck },
  { value: 'budget-entries', label: 'Budget Approvals', icon: DollarSign },
];

export default function AdvisorApprovalsClient({
  joinRequests = [],
  memberProfiles = [],
  budgetEntries = [],
}) {
  const [tab, setTab] = useState('join-requests');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const tabs = TAB_DEFS.map((t) => ({
    ...t,
    count:
      t.value === 'join-requests'
        ? joinRequests.length
        : t.value === 'member-profiles'
          ? memberProfiles.length
          : budgetEntries.length,
  }));

  const totalPending =
    joinRequests.length + memberProfiles.length + budgetEntries.length;

  const openReview = (item, type) => {
    setSelected({ ...item, _type: type });
    setReason('');
  };

  const closeReview = () => {
    setSelected(null);
    setReason('');
  };

  const handleApprove = () => {
    if (!selected) return;
    startTransition(async () => {
      const fd = new FormData();
      try {
        let result;
        if (selected._type === 'join-request') {
          fd.append('requestId', selected.id);
          result = await approveJoinRequestAction(fd);
        } else if (selected._type === 'member-profile') {
          fd.append('userId', selected.user_id);
          result = await approveMemberProfileAction(fd);
        } else {
          fd.append('entryId', selected.id);
          result = await approveBudgetEntryAction(fd);
        }

        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(result?.success || 'Approved successfully!');
          closeReview();
          window.location.reload();
        }
      } catch {
        toast.error('An unexpected error occurred.');
      }
    });
  };

  const handleReject = () => {
    if (!selected) return;
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append('requestId', selected.id);
      fd.append('reason', reason);
      try {
        const result = await rejectJoinRequestAction(fd);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(result?.success || 'Rejected join request.');
          closeReview();
          window.location.reload();
        }
      } catch {
        toast.error('An unexpected error occurred.');
      }
    });
  };

  const filteredJoin = useMemo(
    () =>
      joinRequests.filter(
        (r) =>
          !query ||
          r.name?.toLowerCase().includes(query.toLowerCase()) ||
          r.email?.toLowerCase().includes(query.toLowerCase())
      ),
    [joinRequests, query]
  );

  const filteredProfiles = useMemo(
    () =>
      memberProfiles.filter(
        (p) =>
          !query ||
          p.users?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
          p.users?.email?.toLowerCase().includes(query.toLowerCase()) ||
          p.student_id?.toLowerCase().includes(query.toLowerCase())
      ),
    [memberProfiles, query]
  );

  const filteredBudget = useMemo(
    () =>
      budgetEntries.filter(
        (e) =>
          !query ||
          e.description?.toLowerCase().includes(query.toLowerCase()) ||
          e.events?.title?.toLowerCase().includes(query.toLowerCase())
      ),
    [budgetEntries, query]
  );

  return (
    <PageShell>
      {/* Dynamic Shell Header */}
      <PageHeader
        icon={ClipboardCheck}
        title="Approvals Hub"
        subtitle={
          totalPending === 0
            ? 'Inbox zero — all pending requests review queue cleared.'
            : `${totalPending} items awaiting advisor review`
        }
        accent="amber"
      />

      {/* Overview StatCards */}
      <div className="animate-fade-in grid grid-cols-2 gap-3 select-none md:grid-cols-4">
        <StatCard
          icon={ClipboardCheck}
          label="Total Queue"
          value={totalPending}
          sublabel="Pending action"
          accent="amber"
          delay={0}
        />
        <StatCard
          icon={UserPlus}
          label="Join Requests"
          value={joinRequests.length}
          sublabel="New member applications"
          accent="orange"
          delay={0.05}
        />
        <StatCard
          icon={UserCheck}
          label="Member Profiles"
          value={memberProfiles.length}
          sublabel="Pending profile reviews"
          accent="blue"
          delay={0.1}
        />
        <StatCard
          icon={DollarSign}
          label="Budget Approvals"
          value={budgetEntries.length}
          sublabel="Unapproved budget items"
          accent="emerald"
          delay={0.15}
        />
      </div>

      {/* Main Review Layout */}
      <GlassCard padding="p-6">
        <TabBar
          tabs={tabs}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setQuery('');
          }}
        />

        {/* Toolbar Search bar */}
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === 'join-requests'
                ? 'Search by candidate name or email…'
                : tab === 'member-profiles'
                  ? 'Search by student name, email, or student ID…'
                  : 'Search by description or associated event…'
            }
            className="w-full rounded-xl border border-white/8 bg-white/3 py-2.5 pr-4 pl-11 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dynamic Card Lists */}
        <div className="mt-5">
          {tab === 'join-requests' && (
            <JoinRequestsList
              items={filteredJoin}
              onReview={(item) => openReview(item, 'join-request')}
            />
          )}
          {tab === 'member-profiles' && (
            <MemberProfilesList
              items={filteredProfiles}
              onReview={(item) => openReview(item, 'member-profile')}
            />
          )}
          {tab === 'budget-entries' && (
            <BudgetEntriesList
              items={filteredBudget}
              onReview={(item) => openReview(item, 'budget')}
            />
          )}
        </div>
      </GlassCard>

      {/* Review Dialog Drawer */}
      {selected && (
        <ReviewModal
          item={selected}
          onClose={closeReview}
          onApprove={handleApprove}
          onReject={handleReject}
          reason={reason}
          setReason={setReason}
          submitting={isPending}
        />
      )}
    </PageShell>
  );
}

// ── Join Requests List ──────────────────────────────────────────────────────
function JoinRequestsList({ items, onReview }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No pending join requests"
        description="When prospective student members apply, their applications will show up here."
        accent="orange"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((r) => (
        <div
          key={r.id}
          className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-white/8 bg-white/2 p-4 transition-all hover:border-orange-500/30 hover:bg-white/4"
        >
          <div className="flex items-start gap-3">
            <Avatar name={r.name || '?'} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-orange-400">
                {r.name}
              </p>
              <div className="mt-1.5 flex flex-col gap-1 font-mono text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  {r.email}
                </span>
                {r.phone && (
                  <span className="flex items-center gap-1.5 truncate">
                    <Phone className="h-3 w-3 shrink-0" />
                    {r.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onReview(r)}
            className="w-full rounded-xl border border-orange-500/20 bg-orange-600/10 py-2 text-center text-xs font-semibold text-orange-400 transition-all hover:bg-orange-600 hover:text-white active:scale-95"
          >
            Review Application
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Member Profiles List ────────────────────────────────────────────────────
function MemberProfilesList({ items, onReview }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={UserCheck}
        title="No pending profile updates"
        description="Member profile modifications that need approval will show up here."
        accent="blue"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((p) => {
        const fullName = p.users?.full_name || 'Unknown';
        return (
          <div
            key={p.user_id}
            className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-white/8 bg-white/2 p-4 transition-all hover:border-blue-500/30 hover:bg-white/4"
          >
            <div className="flex items-start gap-3">
              <Avatar name={fullName} size="md" src={p.users?.avatar_url} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-blue-400">
                  {fullName}
                </p>
                <div className="mt-1.5 flex flex-col gap-1 font-mono text-[11px] text-gray-500">
                  <span className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    {p.users?.email}
                  </span>
                  <span className="flex items-center gap-1.5 truncate">
                    <Award className="h-3 w-3 shrink-0" />
                    ID: {p.student_id || '—'}
                  </span>
                  <span className="flex items-center gap-1.5 truncate">
                    <Building className="h-3 w-3 shrink-0" />
                    {p.department || '—'} · {p.session || '—'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onReview(p)}
              className="w-full rounded-xl border border-blue-500/20 bg-blue-600/10 py-2 text-center text-xs font-semibold text-blue-400 transition-all hover:bg-blue-600 hover:text-white active:scale-95"
            >
              Review Updates
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Budget Entries List ──────────────────────────────────────────────────────
function BudgetEntriesList({ items, onReview }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No pending budget items"
        description="Budget sheets and transactions submitted for approval will appear here."
        accent="emerald"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((e) => {
        const isIncome = e.entry_type === 'income';
        return (
          <div
            key={e.id}
            className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-white/8 bg-white/2 p-4 transition-all hover:border-emerald-500/30 hover:bg-white/4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                      isIncome
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {isIncome ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {e.entry_type}
                  </span>
                </div>
                <span className="text-sm font-bold text-white transition-colors group-hover:text-emerald-400">
                  ৳{Number(e.amount).toLocaleString()}
                </span>
              </div>
              <p className="mt-2.5 line-clamp-1 text-xs font-medium text-gray-200">
                {e.description}
              </p>
              <div className="mt-1.5 flex flex-col gap-1 font-mono text-[10px] text-gray-500">
                {e.events?.title && (
                  <span className="truncate">Event: {e.events.title}</span>
                )}
                <span>
                  Date: {new Date(e.transaction_date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => onReview(e)}
              className="w-full rounded-xl border border-emerald-500/20 bg-emerald-600/10 py-2 text-center text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-600 hover:text-white active:scale-95"
            >
              Review Transaction
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  item,
  onClose,
  onApprove,
  onReject,
  reason,
  setReason,
  submitting,
}) {
  const isJoin = item._type === 'join-request';
  const isProfile = item._type === 'member-profile';
  const isBudget = item._type === 'budget';

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-lg overflow-hidden rounded-2xl border border-white/8 bg-gray-900/90 shadow-2xl backdrop-blur-lg duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/8 bg-white/3 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">
              {isJoin
                ? 'Review Join Application'
                : isProfile
                  ? 'Review Profile Verification'
                  : 'Review Financial Transaction'}
            </h2>
            <p className="mt-1 font-mono text-[11px] tracking-wider text-amber-400 uppercase">
              {`// review category: ${item._type.replace('-', ' ')}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/8 hover:text-white active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          {/* visual rendering: Join Application (Student Card) */}
          {isJoin && (
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-orange-500/10 to-transparent p-5">
              <div className="absolute top-0 right-0 -z-10 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
              <div className="flex items-center gap-4">
                <Avatar name={item.name || '?'} size="lg" />
                <div className="min-w-0 flex-1">
                  <span className="block font-mono text-[9px] font-bold tracking-widest text-orange-400 uppercase">
                    NEUPC Candidate Member
                  </span>
                  <p className="mt-1 truncate text-base font-bold text-white">
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {item.email}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 border-t border-white/6 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Phone className="h-3.5 w-3.5 text-gray-600" /> Phone
                  </span>
                  <span className="font-medium text-white">
                    {item.phone || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="h-3.5 w-3.5 text-gray-600" /> Apply
                    Date
                  </span>
                  <span className="font-medium text-white">
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* visual rendering: Member Profile Update (Identity ledger) */}
          {isProfile && (
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-blue-500/10 to-transparent p-5">
              <div className="absolute top-0 right-0 -z-10 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-center gap-4">
                <Avatar
                  name={item.users?.full_name || '?'}
                  size="lg"
                  src={item.users?.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <span className="block font-mono text-[9px] font-bold tracking-widest text-blue-400 uppercase">
                    Profile Verification Review
                  </span>
                  <p className="mt-1 truncate text-base font-bold text-white">
                    {item.users?.full_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {item.users?.email}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 border-t border-white/6 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Award className="h-3.5 w-3.5 text-gray-600" /> Student ID
                  </span>
                  <span className="font-mono font-medium text-white">
                    {item.student_id || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Building className="h-3.5 w-3.5 text-gray-600" />{' '}
                    Department
                  </span>
                  <span className="font-medium text-white">
                    {item.department || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <BookOpen className="h-3.5 w-3.5 text-gray-600" /> Academic
                    Session
                  </span>
                  <span className="font-medium text-white">
                    {item.session || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* visual rendering: Financial Budget Entry (Receipt slip) */}
          {isBudget && (
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-emerald-500/10 to-transparent p-5 font-mono text-xs">
              <div className="absolute top-0 right-0 -z-10 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="border-b border-dashed border-white/10 pb-4 text-center">
                <span className="mb-1 block text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
                  Financial Transaction Slip
                </span>
                <span className="text-2xl font-black text-white">
                  ৳{Number(item.amount).toLocaleString()}
                </span>
                <span
                  className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase ${
                    item.entry_type === 'income'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {item.entry_type}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Event Context:</span>
                  <span className="max-w-[200px] truncate text-right font-semibold text-white">
                    {item.events?.title || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Description:</span>
                  <span className="max-w-[200px] text-right font-semibold wrap-break-word text-white">
                    {item.description || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Entry Date:</span>
                  <span className="font-semibold text-white">
                    {new Date(item.transaction_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rejection input controls for join applications */}
          {isJoin && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase select-none">
                Rejection Reason{' '}
                <span className="text-gray-600">
                  (required to reject, optional to approve)
                </span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Specify rejection comments if declining this applicant..."
                className="w-full resize-none rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-4 sm:flex-row">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 rounded-xl border border-white/8 bg-white/5 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              Cancel
            </button>
            {isJoin && (
              <button
                onClick={handleReject}
                type="button"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                {submitting && <Loader className="h-3.5 w-3.5 animate-spin" />}
                Reject Application
              </button>
            )}
            <button
              onClick={onApprove}
              type="button"
              disabled={submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting && <Loader className="h-3.5 w-3.5 animate-spin" />}
              Approve Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
