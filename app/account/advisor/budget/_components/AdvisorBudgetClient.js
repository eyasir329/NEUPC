'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  X,
  FileText,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Loader,
  BookOpen,
} from 'lucide-react';
import { approveBudgetEntryAction } from '@/app/_lib/advisor-actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  Pill,
  EmptyState,
  TabBar,
  Avatar,
} from '../../../_components/ui/dashboard';
import toast from 'react-hot-toast';

const TYPE_TABS = [
  { value: 'all', label: 'All Types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

const STATUS_TABS = [
  { value: 'all', label: 'All Statuses' },
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
  const [selected, setSelected] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (entryId) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('entryId', entryId);
      try {
        const result = await approveBudgetEntryAction(fd);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(result?.success || 'Budget transaction approved!');
          setSelected(null);
          window.location.reload();
        }
      } catch {
        toast.error('An unexpected error occurred.');
      }
    });
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
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  }, [budgetEntries, query, typeFilter, statusFilter]);

  const balance = Number(summary.balance ?? 0);

  return (
    <PageShell>
      {/* Page Header */}
      <PageHeader
        icon={Wallet}
        title="Club Ledger"
        subtitle="Manage financial transactions, review income sheets, and approve executive expenses."
        accent="emerald"
      />

      {/* Financial Metrics Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 animate-fade-in select-none">
        <StatCard
          icon={TrendingUp}
          label="Total Income"
          value={`৳${Number(summary.totalIncome ?? 0).toLocaleString()}`}
          accent="emerald"
          sublabel="Accumulated inflows"
          delay={0}
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenses"
          value={`৳${Number(summary.totalExpenses ?? 0).toLocaleString()}`}
          accent="rose"
          sublabel="Accumulated outflows"
          delay={0.05}
        />
        <StatCard
          icon={Wallet}
          label="Net Balance"
          value={`৳${balance.toLocaleString()}`}
          accent={balance >= 0 ? 'blue' : 'amber'}
          sublabel={balance >= 0 ? 'Surplus / Healthy' : 'Deficit / Needs Review'}
          delay={0.1}
        />
      </div>

      {/* Advanced Control Filters Toolbar */}
      <GlassCard padding="p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by transaction description or associated event title…"
            className="w-full bg-white/3 border border-white/8 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 select-none">
              Transaction Class
            </label>
            <TabBar tabs={TYPE_TABS} value={typeFilter} onChange={setTypeFilter} />
          </div>
          <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 select-none">
              Approval Status
            </label>
            <TabBar tabs={STATUS_TABS} value={statusFilter} onChange={setStatusFilter} />
          </div>
        </div>
      </GlassCard>

      {/* Ledger Entries Render */}
      {sorted.length === 0 ? (
        <GlassCard padding="p-8">
          <EmptyState
            icon={Wallet}
            title="No ledger entries found"
            description={
              query || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try broadening your text search or adjusting your status filters.'
                : 'All financial updates logged by the Executive team will appear here.'
            }
            accent="emerald"
          />
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-white/8 bg-white/2 shadow-2xl backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-white/3 select-none text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Class</th>
                  <th className="py-4 px-5">Amount</th>
                  <th className="py-4 px-5">Description</th>
                  <th className="py-4 px-5">Attached Event</th>
                  <th className="py-4 px-5">Transaction Date</th>
                  <th className="py-4 px-5">Creator</th>
                  <th className="py-4 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {sorted.map((e) => {
                  const income = e.entry_type === 'income';
                  const isPendingRow = !e.approved_at;
                  const creatorName = e.users?.full_name || 'System';
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className="group cursor-pointer text-sm text-gray-300 transition-colors hover:bg-white/4"
                    >
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            income
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {income ? (
                            <ArrowUpRight className="h-2.5 w-2.5" />
                          ) : (
                            <ArrowDownRight className="h-2.5 w-2.5" />
                          )}
                          {e.entry_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold">
                        <span className={income ? 'text-emerald-400' : 'text-rose-400'}>
                          {income ? '+' : '-'}৳{Number(e.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-gray-200 truncate max-w-[200px]">
                        {e.description}
                      </td>
                      <td className="py-3.5 px-5 text-gray-400 max-w-[150px] truncate">
                        {e.events?.title || '—'}
                      </td>
                      <td className="py-3.5 px-5 text-gray-400 font-mono text-xs">
                        {new Date(e.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <Avatar name={creatorName} size="sm" src={e.users?.avatar_url} />
                          <span className="text-xs text-gray-300 truncate max-w-[100px]">
                            {creatorName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          {isPendingRow ? (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 font-sans">
                                <Clock className="h-2.5 w-2.5" /> Pending
                              </span>
                              <button
                                onClick={() => handleApprove(e.id)}
                                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-95"
                              >
                                Approve
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 font-sans">
                              <CheckCircle className="h-2.5 w-2.5" /> Approved
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid Layout */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {sorted.map((e) => {
              const income = e.entry_type === 'income';
              const isPendingCard = !e.approved_at;
              const creatorName = e.users?.full_name || 'System';
              return (
                <div
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="rounded-2xl border border-white/8 bg-white/2 p-4 transition-all hover:border-emerald-500/30 hover:bg-white/4 flex flex-col justify-between gap-4 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          income
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {income ? (
                          <ArrowUpRight className="h-2.5 w-2.5" />
                        ) : (
                          <ArrowDownRight className="h-2.5 w-2.5" />
                        )}
                        {e.entry_type}
                      </span>
                      <span className={`text-sm font-black ${income ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {income ? '+' : '-'}৳{Number(e.amount).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-3 text-xs font-semibold text-gray-200 line-clamp-1">
                      {e.description}
                    </p>

                    <div className="mt-2 flex flex-col gap-1 text-[10px] text-gray-500 font-mono">
                      {e.events?.title && <span className="truncate">Event: {e.events.title}</span>}
                      <span>Date: {new Date(e.transaction_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400 font-sans">
                        <Avatar name={creatorName} size="xs" src={e.users?.avatar_url} />
                        Logged by: {creatorName}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/6 pt-3 flex items-center justify-between" onClick={(ev) => ev.stopPropagation()}>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                        isPendingCard
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {isPendingCard ? <Clock className="h-2.5 w-2.5" /> : <CheckCircle className="h-2.5 w-2.5" />}
                      {isPendingCard ? 'Pending' : 'Approved'}
                    </span>

                    {isPendingCard && (
                      <button
                        onClick={() => handleApprove(e.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-95"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction Receipt Dialog */}
      {selected && (
        <ReviewModal
          entry={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          submitting={isPending}
        />
      )}
    </PageShell>
  );
}

// ── Receipt Review Modal ───────────────────────────────────────────────────
function ReviewModal({ entry, onClose, onApprove, submitting }) {
  const isIncome = entry.entry_type === 'income';
  const isPending = !entry.approved_at;
  const creatorName = entry.users?.full_name || 'System';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/8 bg-gray-900/90 shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/8 bg-white/3 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Transaction Review</h2>
            <p className="mt-1 text-[11px] text-emerald-400 font-mono uppercase tracking-wider">
              {`// transaction ref: CF-${entry.id.substring(0, 8)}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/8 hover:text-white active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Financial ledger Receipt style drawer */}
        <div className="p-6 space-y-5">
          <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 relative overflow-hidden font-mono text-xs">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -z-10" />

            <div className="text-center pb-4 border-b border-dashed border-white/10">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                Financial Transaction Ledger
              </span>
              <span className="text-2xl font-black text-white">
                {isIncome ? '+' : '-'}৳{Number(entry.amount).toLocaleString()}
              </span>
              <div className="mt-2.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                    isIncome
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {entry.entry_type}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-start gap-3">
                <span className="text-gray-500 flex items-center gap-1 shrink-0"><FileText className="h-3.5 w-3.5 text-gray-600" /> Reference</span>
                <span className="text-white font-semibold text-right break-all">CF-{entry.id}</span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-gray-500 flex items-center gap-1 shrink-0"><User className="h-3.5 w-3.5 text-gray-600" /> Logged By</span>
                <span className="text-white font-semibold text-right">{creatorName}</span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-gray-500 flex items-center gap-1 shrink-0"><BookOpen className="h-3.5 w-3.5 text-gray-600" /> Event</span>
                <span className="text-white font-semibold text-right max-w-[150px] truncate">{entry.events?.title || 'None / Maintenance'}</span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-gray-500 flex items-center gap-1 shrink-0"><Calendar className="h-3.5 w-3.5 text-gray-600" /> Record Date</span>
                <span className="text-white font-semibold text-right">{new Date(entry.transaction_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-white/10">
              <span className="text-[10px] font-bold text-gray-500 block mb-1">MEMO / DESCRIPTION:</span>
              <p className="text-gray-200 leading-relaxed font-sans text-xs bg-white/2 border border-white/6 rounded-lg p-2.5 break-words">
                {entry.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 border-t border-white/8 pt-5 mt-2">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 rounded-xl bg-white/5 border border-white/8 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              Cancel
            </button>
            {isPending ? (
              <button
                onClick={() => onApprove(entry.id)}
                type="button"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting && <Loader className="h-3.5 w-3.5 animate-spin" />}
                Approve Entry
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/10 py-2.5 text-xs font-bold text-emerald-400 select-none cursor-default"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Approved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
