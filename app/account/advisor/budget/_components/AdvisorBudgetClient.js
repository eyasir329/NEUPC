/**
 * @file Advisor budget client — detailed budget management interface
 *   with allocation tracking, expense history, and financial reports.
 * @module AdvisorBudgetClient
 */

'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { approveBudgetEntryAction } from '@/app/_lib/advisor-actions';

export default function AdvisorBudgetClient({
  budgetEntries,
  summary,
  advisorId,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleApprove = async (entryId) => {
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('entryId', entryId);

    try {
      const result = await approveBudgetEntryAction(formData);
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: result.success });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter entries
  const filteredEntries = budgetEntries?.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.events?.title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || entry.entry_type === filterType;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && !entry.approved_at) ||
      (filterStatus === 'approved' && entry.approved_at);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort by transaction date desc
  const sortedEntries = filteredEntries?.sort(
    (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Budget Management</h1>
        <p className="mt-1 text-gray-400">
          Track income, expenses, and approvals
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={TrendingUp}
          label="Total Income"
          value={`৳${summary.totalIncome || 0}`}
          color="green"
        />
        <SummaryCard
          icon={TrendingDown}
          label="Total Expenses"
          value={`৳${summary.totalExpenses || 0}`}
          color="red"
        />
        <SummaryCard
          icon={Wallet}
          label="Balance"
          value={`৳${summary.balance || 0}`}
          color={summary.balance >= 0 ? 'blue' : 'amber'}
        />
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`rounded-xl border p-4 ${
            message.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by description or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Type Filter */}
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  filterType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-white/10" />

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'pending', 'approved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entries List */}
      {sortedEntries && sortedEntries.length > 0 ? (
        <div className="space-y-3">
          {sortedEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onApprove={handleApprove}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
          <DollarSign className="mx-auto mb-4 h-16 w-16 text-gray-500" />
          <p className="text-lg text-gray-400">No budget entries found</p>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Budget entries will appear here'}
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    green:
      'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    amber:
      'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400',
  };

  return (
    <div
      className={`bg-linear-to-br backdrop-blur-xl ${colorClasses[color]} rounded-2xl border p-6`}
    >
      <Icon className="mb-4 h-8 w-8" />
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function EntryCard({ entry, onApprove, isSubmitting }) {
  const isPending = !entry.approved_at;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-colors hover:bg-white/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Main Info */}
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                entry.entry_type === 'income'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {entry.entry_type}
            </span>
            <span className="text-2xl font-bold text-white">
              ৳{entry.amount}
            </span>
            {isPending ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400">
                <Clock className="h-3 w-3" />
                Pending
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                <CheckCircle className="h-3 w-3" />
                Approved
              </span>
            )}
          </div>

          <p className="mb-2 font-medium text-white">{entry.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(entry.transaction_date).toLocaleDateString()}
              </span>
            </div>
            {entry.events && <span>Event: {entry.events.title}</span>}
            {entry.users && <span>Created by: {entry.users.full_name}</span>}
          </div>
        </div>

        {/* Approve Button */}
        {isPending && (
          <button
            onClick={() => onApprove(entry.id)}
            disabled={isSubmitting}
            className="rounded-xl bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600 disabled:bg-gray-600"
          >
            {isSubmitting ? 'Approving...' : 'Approve'}
          </button>
        )}
      </div>
    </div>
  );
}
