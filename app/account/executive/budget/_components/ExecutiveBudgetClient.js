/**
 * @file Executive budget client — full-page budget management view.
 *   Provides dynamic cards for summary metrics, text search/tab filter tools,
 *   and slide-in dialog modals to create, edit, and delete pending entries.
 *
 * @module ExecutiveBudgetClient
 */

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
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  execCreateBudgetEntryAction,
  execUpdateBudgetEntryAction,
  execDeleteBudgetEntryAction,
} from '@/app/_lib/actions/executive-actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  Pill,
  ActionButton,
  EmptyState,
  TabBar,
} from '@/app/account/_components/ui/dashboard';

const TYPE_TABS = [
  { value: 'all', label: 'All Types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

const CATEGORY_TABS = [
  { value: 'all', label: 'All Categories' },
  { value: 'event', label: 'Event Related' },
  { value: 'bootcamp', label: 'Bootcamp Related' },
  { value: 'maintenance', label: 'Maintenance' },
];

const STATUS_TABS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
];

export default function ExecutiveBudgetClient({
  initialSummary = {},
  initialEntries = [],
  events = [],
  bootcamps = [],
}) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isPendingAction, startTransition] = useTransition();
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntryId, setDeletingEntryId] = useState(null);

  // Bootcamps lookup map
  const bootcampMap = useMemo(() => {
    const map = {};
    bootcamps.forEach((b) => {
      map[b.id] = b.title;
    });
    return map;
  }, [bootcamps]);

  // Filters & sorting
  const filteredEntries = useMemo(() => {
    return [...initialEntries]
      .filter((e) => {
        const q = query.toLowerCase();

        // Resolve event & bootcamp details for search
        const eventTitle = e.events?.title?.toLowerCase() || '';
        let bootcampTitle = '';
        if (e.category?.startsWith('bootcamp:')) {
          const bId = e.category.split(':')[1];
          bootcampTitle = (bootcampMap[bId] || '').toLowerCase();
        }

        const matchSearch =
          !q ||
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          eventTitle.includes(q) ||
          bootcampTitle.includes(q);

        const matchType = typeFilter === 'all' || e.entry_type === typeFilter;

        // Status matching
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'pending' && !e.approved_at) ||
          (statusFilter === 'approved' && e.approved_at);

        // Category matching
        let matchCategory = true;
        if (categoryFilter !== 'all') {
          if (categoryFilter === 'event') {
            matchCategory = e.category === 'event';
          } else if (categoryFilter === 'bootcamp') {
            matchCategory = e.category?.startsWith('bootcamp:');
          } else if (categoryFilter === 'maintenance') {
            matchCategory = e.category === 'maintenance';
          }
        }

        return matchSearch && matchType && matchStatus && matchCategory;
      })
      .sort(
        (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
      );
  }, [
    initialEntries,
    query,
    typeFilter,
    categoryFilter,
    statusFilter,
    bootcampMap,
  ]);

  const balance = Number(initialSummary.balance ?? 0);

  // Actions
  const handleCreate = async (formData) => {
    startTransition(async () => {
      setNotification(null);
      const res = await execCreateBudgetEntryAction(formData);
      if (res?.error) {
        setNotification({ type: 'error', text: res.error });
      } else {
        setNotification({
          type: 'success',
          text: res.success || 'Budget entry submitted for review.',
        });
        setIsAddModalOpen(false);
      }
    });
  };

  const handleUpdate = async (formData) => {
    startTransition(async () => {
      setNotification(null);
      const res = await execUpdateBudgetEntryAction(formData);
      if (res?.error) {
        setNotification({ type: 'error', text: res.error });
      } else {
        setNotification({
          type: 'success',
          text: res.success || 'Budget entry updated successfully.',
        });
        setEditingEntry(null);
      }
    });
  };

  const handleDelete = async (entryId) => {
    startTransition(async () => {
      setNotification(null);
      const fd = new FormData();
      fd.append('entryId', entryId);
      const res = await execDeleteBudgetEntryAction(fd);
      if (res?.error) {
        setNotification({ type: 'error', text: res.error });
      } else {
        setNotification({
          type: 'success',
          text: res.success || 'Budget entry deleted.',
        });
        setDeletingEntryId(null);
      }
    });
  };

  return (
    <PageShell>
      <PageHeader
        icon={Wallet}
        title="Club Budget Tracker"
        subtitle="Manage finances, submit events/bootcamps expenses, and track advisor approval status"
        accent="blue"
        actions={
          <ActionButton
            tone="primary"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Budget Entry
          </ActionButton>
        }
      />

      {/* Dynamic Alerts */}
      {notification && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl border p-4 text-sm ${
            notification.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary StatCards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Total Income"
          value={`৳${Number(initialSummary.totalIncome ?? 0).toLocaleString()}`}
          accent="emerald"
          sublabel="All time income"
          delay={0}
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenses"
          value={`৳${Number(initialSummary.totalExpenses ?? 0).toLocaleString()}`}
          accent="rose"
          sublabel="Approved expenses"
          delay={0.04}
        />
        <StatCard
          icon={Wallet}
          label="Net Balance"
          value={`৳${balance.toLocaleString()}`}
          accent={balance >= 0 ? 'blue' : 'amber'}
          sublabel={balance >= 0 ? 'Surplus balance' : 'Deficit balance'}
          delay={0.08}
        />
      </div>

      {/* Search & Filters */}
      <GlassCard padding="p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description, event or bootcamp..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pr-4 pl-11 text-sm text-white placeholder-gray-500 focus:border-blue-500/40 focus:outline-none"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
              Entry Type
            </label>
            <TabBar
              tabs={TYPE_TABS}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
              Category
            </label>
            <TabBar
              tabs={CATEGORY_TABS}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
              Approval Status
            </label>
            <TabBar
              tabs={STATUS_TABS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </GlassCard>

      {/* Budget Entries Grid */}
      {filteredEntries.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={Wallet}
            title="No records found"
            description="No budget entries match your filter configuration. Create a new budget record or clear your active filters."
            action={
              query ||
              typeFilter !== 'all' ||
              categoryFilter !== 'all' ||
              statusFilter !== 'all' ? (
                <ActionButton
                  tone="ghost"
                  onClick={() => {
                    setQuery('');
                    setTypeFilter('all');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </ActionButton>
              ) : (
                <ActionButton
                  tone="primary"
                  icon={Plus}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Create First Entry
                </ActionButton>
              )
            }
          />
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const isApproved = Boolean(entry.approved_at);
            const isIncome = entry.entry_type === 'income';

            // Resolve categories display text
            let categoryLabel = 'Maintenance';
            let categoryDetails = null;

            if (entry.category === 'event') {
              categoryLabel = 'Event Related';
              categoryDetails = entry.events?.title
                ? `Event: ${entry.events.title}`
                : 'Associated Event';
            } else if (entry.category?.startsWith('bootcamp:')) {
              categoryLabel = 'Bootcamp Related';
              const bId = entry.category.split(':')[1];
              categoryDetails = bootcampMap[bId]
                ? `Bootcamp: ${bootcampMap[bId]}`
                : 'Associated Bootcamp';
            }

            return (
              <GlassCard
                key={entry.id}
                padding="p-4.5"
                className="flex flex-col gap-4 transition-all hover:bg-white/[0.01] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={isIncome ? 'emerald' : 'rose'}>
                      {entry.entry_type}
                    </Pill>
                    <Pill
                      tone={
                        entry.category?.startsWith('bootcamp:')
                          ? 'violet'
                          : entry.category === 'event'
                            ? 'blue'
                            : 'gray'
                      }
                    >
                      {categoryLabel}
                    </Pill>
                    {isApproved ? (
                      <Pill tone="emerald" icon={CheckCircle}>
                        Approved
                      </Pill>
                    ) : (
                      <Pill tone="amber" icon={Clock}>
                        Pending Review
                      </Pill>
                    )}
                    <span className="text-xs font-medium text-gray-500">
                      Submitted by: {entry.users?.full_name || 'Executive'}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-white">
                    {entry.title}
                  </h3>
                  {entry.description && (
                    <p className="mt-1 text-sm text-gray-400">
                      {entry.description}
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(entry.transaction_date).toLocaleDateString(
                        undefined,
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </span>
                    {categoryDetails && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                        {categoryDetails}
                      </span>
                    )}
                    {entry.receipt_url && (
                      <a
                        href={entry.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Receipt
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-row items-center justify-between gap-4 border-t border-white/[0.04] pt-3 sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
                  <span
                    className={`text-xl font-bold ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '−'}৳
                    {Number(entry.amount).toLocaleString()}
                  </span>

                  {!isApproved && (
                    <div className="flex gap-2">
                      <ActionButton
                        tone="ghost"
                        icon={Edit2}
                        onClick={() => setEditingEntry(entry)}
                        disabled={isPendingAction}
                      >
                        Edit
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        icon={Trash2}
                        onClick={() => setDeletingEntryId(entry.id)}
                        disabled={isPendingAction}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {isAddModalOpen && (
        <BudgetFormModal
          title="Create Budget Entry"
          events={events}
          bootcamps={bootcamps}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreate}
          loading={isPendingAction}
        />
      )}

      {/* EDIT MODAL */}
      {editingEntry && (
        <BudgetFormModal
          title="Edit Budget Entry"
          entry={editingEntry}
          events={events}
          bootcamps={bootcamps}
          onClose={() => setEditingEntry(null)}
          onSubmit={handleUpdate}
          loading={isPendingAction}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md border border-slate-700/60 bg-slate-900 p-6 shadow-2xl">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              Delete Budget Entry
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Are you sure you want to delete this pending budget entry? This
              action is permanent and cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingEntryId(null)}
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
                disabled={isPendingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingEntryId)}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                disabled={isPendingAction}
              >
                {isPendingAction ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </PageShell>
  );
}

// Reusable Modal Component
function BudgetFormModal({
  title,
  entry = null,
  events = [],
  bootcamps = [],
  onClose,
  onSubmit,
  loading = false,
}) {
  const isEdit = Boolean(entry);

  // Resolve base values for edit state
  const baseCategory =
    entry?.category === 'event'
      ? 'event'
      : entry?.category?.startsWith('bootcamp:')
        ? 'bootcamp'
        : 'maintenance';

  const baseBootcampId = entry?.category?.startsWith('bootcamp:')
    ? entry.category.split(':')[1]
    : '';

  const [entryType, setEntryType] = useState(entry?.entry_type ?? 'expense');
  const [category, setCategory] = useState(baseCategory);
  const [eventId, setEventId] = useState(entry?.event_id ?? '');
  const [bootcampId, setBootcampId] = useState(baseBootcampId);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.set('entry_type', entryType);
    fd.set('category', category);
    if (category === 'event') {
      fd.set('event_id', eventId);
    } else if (category === 'bootcamp') {
      fd.set('bootcamp_id', bootcampId);
    }
    onSubmit(fd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700/50 bg-slate-900 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <span>{isEdit ? '✏️' : '➕'}</span>
            <span>{title}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {isEdit && <input type="hidden" name="entryId" value={entry.id} />}

          {/* Entry Type Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Entry Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEntryType('expense')}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  entryType === 'expense'
                    ? 'border-rose-500 bg-rose-600/20 text-rose-300'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                }`}
              >
                💸 Expense (Cost)
              </button>
              <button
                type="button"
                onClick={() => setEntryType('income')}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  entryType === 'income'
                    ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                }`}
              >
                💰 Income (Revenue)
              </button>
            </div>
          </div>

          {/* Title & Amount */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                defaultValue={entry?.title ?? ''}
                placeholder="e.g. Server hosting, Banner printing..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Amount (৳) <span className="text-red-400">*</span>
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={entry?.amount ?? ''}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={entry?.description ?? ''}
              placeholder="Provide a detailed description of this transaction..."
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="maintenance">🔧 Maintenance Related</option>
              <option value="event">📅 Event Related</option>
              <option value="bootcamp">🎓 Bootcamp Related</option>
            </select>
          </div>

          {/* Conditional Dropdown for Event Related */}
          {category === 'event' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Select Event <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">— Select an Event —</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Dropdown for Bootcamp Related */}
          {category === 'bootcamp' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Select Bootcamp <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={bootcampId}
                onChange={(e) => setBootcampId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">— Select a Bootcamp —</option>
                {bootcamps.map((bc) => (
                  <option key={bc.id} value={bc.id}>
                    {bc.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Transaction Date & Receipt URL */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Transaction Date <span className="text-red-400">*</span>
              </label>
              <input
                name="transaction_date"
                type="date"
                required
                defaultValue={
                  entry?.transaction_date
                    ? new Date(entry.transaction_date)
                        .toISOString()
                        .split('T')[0]
                    : new Date().toISOString().split('T')[0]
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Receipt / Invoice URL
              </label>
              <input
                name="receipt_url"
                type="url"
                defaultValue={entry?.receipt_url ?? ''}
                placeholder="https://example.com/receipt.pdf"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-700/50 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {loading
                ? 'Submitting…'
                : isEdit
                  ? 'Update Entry'
                  : 'Submit Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
