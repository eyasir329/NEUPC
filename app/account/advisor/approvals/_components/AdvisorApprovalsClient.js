/**
 * @file Advisor approvals client — review queue for join requests,
 *   member profile updates, and budget entries. Uses the shared dark-
 *   glass primitives (PageShell / PageHeader / TabBar / GlassCard) so
 *   the advisor panel matches the member panel's design language.
 *
 * @module AdvisorApprovalsClient
 */

'use client';

import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
  approveMemberProfileAction,
  approveBudgetEntryAction,
} from '@/app/_lib/advisor-actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  TabBar,
  Pill,
  Avatar,
  ActionButton,
  EmptyState,
} from '../../../_components/ui/dashboard';

const TAB_DEFS = [
  { value: 'join-requests', label: 'Join Requests', icon: UserPlus },
  { value: 'member-profiles', label: 'Member Profiles', icon: UserCheck },
  { value: 'budget-entries', label: 'Budget Approvals', icon: DollarSign },
];

function Alert({ message }) {
  if (!message) return null;
  const ok = message.type === 'success';
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
        ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
      }`}
    >
      {ok ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span>{message.text}</span>
    </div>
  );
}

export default function AdvisorApprovalsClient({
  joinRequests = [],
  memberProfiles = [],
  budgetEntries = [],
}) {
  const [tab, setTab] = useState('join-requests');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const tabs = TAB_DEFS.map((t) => ({
    ...t,
    count:
      t.value === 'join-requests'
        ? joinRequests.length
        : t.value === 'member-profiles'
          ? memberProfiles.length
          : budgetEntries.length,
  }));

  const openReview = (item, type) => {
    setSelected({ ...item, _type: type });
    setReason('');
    setMessage(null);
  };

  const closeReview = () => {
    setSelected(null);
    setReason('');
    setMessage(null);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setSubmitting(true);
    setMessage(null);
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
      if (result?.error) setMessage({ type: 'error', text: result.error });
      else {
        setMessage({ type: 'success', text: result?.success ?? 'Approved' });
        setTimeout(closeReview, 800);
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!reason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a rejection reason.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const fd = new FormData();
    fd.append('requestId', selected.id);
    fd.append('reason', reason);
    try {
      const result = await rejectJoinRequestAction(fd);
      if (result?.error) setMessage({ type: 'error', text: result.error });
      else {
        setMessage({ type: 'success', text: result?.success ?? 'Rejected' });
        setTimeout(closeReview, 800);
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setSubmitting(false);
    }
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

  const totalPending =
    joinRequests.length + memberProfiles.length + budgetEntries.length;

  return (
    <PageShell>
      <PageHeader
        icon={ClipboardCheck}
        title="Approvals"
        subtitle={
          totalPending === 0
            ? 'Inbox zero — nothing waiting for your decision.'
            : `${totalPending} item${totalPending === 1 ? '' : 's'} awaiting your review`
        }
        accent="amber"
        meta={
          <>
            <Pill tone="amber">{joinRequests.length} join</Pill>
            <Pill tone="blue">{memberProfiles.length} profiles</Pill>
            <Pill tone="emerald">{budgetEntries.length} budget</Pill>
          </>
        }
      />

      <Alert message={message} />

      <GlassCard padding="p-4">
        <TabBar tabs={tabs} value={tab} onChange={setTab} />

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === 'join-requests'
                ? 'Search by name or email…'
                : tab === 'member-profiles'
                  ? 'Search by name, email, or student ID…'
                  : 'Search by description or event…'
            }
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pr-3 pl-10 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none"
          />
        </div>

        <div className="mt-4">
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

      {selected && (
        <ReviewModal
          item={selected}
          onClose={closeReview}
          onApprove={handleApprove}
          onReject={handleReject}
          reason={reason}
          setReason={setReason}
          submitting={submitting}
          message={message}
        />
      )}
    </PageShell>
  );
}

function JoinRequestsList({ items, onReview }) {
  if (items.length === 0)
    return (
      <EmptyState
        icon={UserPlus}
        title="No pending join requests"
        description="When prospective members apply, they'll appear here."
      />
    );
  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <li
          key={r.id}
          className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-amber-500/30 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={r.name ?? r.email ?? '?'} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{r.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {r.email}
                </span>
                {r.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {r.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <ActionButton tone="primary" onClick={() => onReview(r)}>
            Review
          </ActionButton>
        </li>
      ))}
    </ul>
  );
}

function MemberProfilesList({ items, onReview }) {
  if (items.length === 0)
    return (
      <EmptyState
        icon={UserCheck}
        title="No pending member profiles"
        description="Member profile changes that need approval will show up here."
      />
    );
  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li
          key={p.user_id}
          className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-blue-500/30 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={p.users?.full_name ?? '?'} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">
                {p.users?.full_name}
              </p>
              <p className="mt-1 truncate text-xs text-gray-500">
                {p.student_id} · {p.session} · {p.department}
              </p>
            </div>
          </div>
          <ActionButton tone="primary" onClick={() => onReview(p)}>
            Review
          </ActionButton>
        </li>
      ))}
    </ul>
  );
}

function BudgetEntriesList({ items, onReview }) {
  if (items.length === 0)
    return (
      <EmptyState
        icon={DollarSign}
        title="No pending budget entries"
        description="Budget items submitted for approval will appear here."
      />
    );
  return (
    <ul className="space-y-2">
      {items.map((e) => (
        <li
          key={e.id}
          className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Pill tone={e.entry_type === 'income' ? 'emerald' : 'rose'}>
                {e.entry_type}
              </Pill>
              <span className="text-lg font-semibold text-white">
                ৳{Number(e.amount).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-gray-200">
              {e.description}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
              {e.events && <span>Event: {e.events.title}</span>}
              <span>
                {new Date(e.transaction_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <ActionButton tone="primary" onClick={() => onReview(e)}>
            Review
          </ActionButton>
        </li>
      ))}
    </ul>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-2 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-white">{value ?? '—'}</span>
    </div>
  );
}

function ReviewModal({
  item,
  onClose,
  onApprove,
  onReject,
  reason,
  setReason,
  submitting,
  message,
}) {
  const isJoin = item._type === 'join-request';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl">
        <div className="sticky top-0 flex items-start justify-between border-b border-white/10 bg-gray-900/95 p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Review request
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 capitalize">
              {item._type.replace('-', ' ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <Alert message={message} />

          {item._type === 'join-request' && (
            <div className="space-y-1">
              <DetailRow label="Name" value={item.name} />
              <DetailRow label="Email" value={item.email} />
              {item.phone && <DetailRow label="Phone" value={item.phone} />}
              <DetailRow
                label="Requested"
                value={new Date(item.created_at).toLocaleDateString()}
              />
            </div>
          )}

          {item._type === 'member-profile' && (
            <div className="space-y-1">
              <DetailRow label="Name" value={item.users?.full_name} />
              <DetailRow label="Email" value={item.users?.email} />
              <DetailRow label="Student ID" value={item.student_id} />
              <DetailRow label="Session" value={item.session} />
              <DetailRow label="Department" value={item.department} />
            </div>
          )}

          {item._type === 'budget' && (
            <div className="space-y-1">
              <DetailRow label="Type" value={item.entry_type} />
              <DetailRow
                label="Amount"
                value={`৳${Number(item.amount).toLocaleString()}`}
              />
              <DetailRow label="Description" value={item.description} />
              {item.events && (
                <DetailRow label="Event" value={item.events.title} />
              )}
              <DetailRow
                label="Date"
                value={new Date(item.transaction_date).toLocaleDateString()}
              />
            </div>
          )}

          {isJoin && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Rejection reason{' '}
                <span className="text-gray-600">
                  (required to reject; optional to approve)
                </span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason if rejecting…"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <ActionButton
              tone="ghost"
              onClick={onClose}
              className="flex-1 justify-center"
            >
              Cancel
            </ActionButton>
            {isJoin && (
              <ActionButton
                tone="danger"
                icon={XCircle}
                onClick={onReject}
                disabled={submitting}
                className="flex-1 justify-center"
              >
                {submitting ? 'Working…' : 'Reject'}
              </ActionButton>
            )}
            <ActionButton
              tone="emerald"
              icon={CheckCircle}
              onClick={onApprove}
              disabled={submitting}
              className="flex-1 justify-center"
            >
              {submitting ? 'Working…' : 'Approve'}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
