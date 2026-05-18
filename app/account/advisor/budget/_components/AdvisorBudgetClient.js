/**
 * @file Advisor budget client — full-page budget management view.
 *   StatCards summarise income/expenses/balance; entries list supports
 *   text search and type/status filters; pending entries can be
 *   approved inline. Uses the shared dark-glass primitives.
 *
 * @module AdvisorBudgetClient
 */

'use client';

import { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { approveBudgetEntryAction } from '@/app/_lib/advisor-actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  Pill,
  ActionButton,
  EmptyState,
  TabBar,
} from '../../../_components/ui/dashboard';

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
];

export default function AdvisorBudgetClient({
  budgetEntries = [],
  summary = {},
}) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleApprove = async (entryId) => {
    setSubmitting(true);
    setMessage(null);
    const fd = new FormData();
    fd.append('entryId', entryId);
    try {
      const result = await approveBudgetEntryAction(fd);
      if (result?.error) setMessage({ type: 'error', text: result.error });
      else setMessage({ type: 'success', text: result?.success ?? 'Approved' });
    } catch {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = useMemo(() => {
    return [...budgetEntries]
      .filter((e) => {
        const q = query.toLowerCase();
        const matchSearch =
          !q ||
          e.description?.toLowerCase().includes(q) ||
          e.events?.title?.toLowerCase().includes(q);
        const matchType = typeFilter === 'all' || e.entry_type === typeFilter;
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'pending' && !e.approved_at) ||
          (statusFilter === 'approved' && e.approved_at);
        return matchSearch && matchType && matchStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.transaction_date) - new Date(a.transaction_date)
      );
  }, [budgetEntries, query, typeFilter, statusFilter]);

  const balance = Number(summary.balance ?? 0);

  return (
    <PageShell>
      <PageHeader
        icon={Wallet}
        title="Budget"
        subtitle="Track income, expenses, and pending approvals"
        accent="emerald"
      />

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Total Income"
          value={`৳${Number(summary.totalIncome ?? 0).toLocaleString()}`}
          accent="emerald"
          sublabel="All time"
          delay={0}
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenses"
          value={`৳${Number(summary.totalExpenses ?? 0).toLocaleString()}`}
          accent="rose"
          sublabel="All time"
          delay={0.04}
        />
        <StatCard
          icon={Wallet}
          label="Balance"
          value={`৳${balance.toLocaleString()}`}
          accent={balance >= 0 ? 'blue' : 'amber'}
          sublabel={balance >= 0 ? 'Healthy' : 'Negative — review'}
          delay={0.08}
        />
      </div>

      <GlassCard padding="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by description or event…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pr-3 pl-10 text-sm text-white placeholder-gray-500 focus:border-emerald-500/40 focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Type
            </p>
            <TabBar
              tabs={TYPE_TABS}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Status
            </p>
            <TabBar
              tabs={STATUS_TABS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </GlassCard>

      {sorted.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={Wallet}
            title="No entries match"
            description={
              query || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try clearing the filters to see more entries.'
                : 'Budget entries created by the executive will appear here.'
            }
          />
        </GlassCard>
      ) : (
        <ul className="space-y-2">
          {sorted.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onApprove={handleApprove}
              submitting={submitting}
            />
          ))}
        </ul>
      )}
    </PageShell>
  );
}

function EntryRow({ entry, onApprove, submitting }) {
  const isPending = !entry.approved_at;
  const income = entry.entry_type === 'income';
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04] lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={income ? 'emerald' : 'rose'}>{entry.entry_type}</Pill>
          <span
            className={`text-xl font-bold ${income ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {income ? '+' : '−'}৳{Number(entry.amount).toLocaleString()}
          </span>
          {isPending ? (
            <Pill tone="amber" icon={Clock}>
              Pending
            </Pill>
          ) : (
            <Pill tone="emerald" icon={CheckCircle}>
              Approved
            </Pill>
          )}
        </div>
        <p className="mt-1.5 text-sm text-gray-200">{entry.description}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(entry.transaction_date).toLocaleDateString()}
          </span>
          {entry.events && <span>Event: {entry.events.title}</span>}
          {entry.users && <span>By: {entry.users.full_name}</span>}
        </div>
      </div>
      {isPending && (
        <ActionButton
          tone="emerald"
          icon={CheckCircle}
          onClick={() => onApprove(entry.id)}
          disabled={submitting}
        >
          {submitting ? 'Approving…' : 'Approve'}
        </ActionButton>
      )}
    </li>
  );
}
