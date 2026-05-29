/**
 * @file Advisor reports client component
 * @module AdvisorReportsClient
 */

'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  Wallet,
  Download,
  Search,
  Clock,
  FileText,
  Users,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Sliders,
  X,
} from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  TabBar,
  StatCard,
  Pill,
  ActionButton,
  EmptyState,
  Avatar,
} from '@/app/account/_components/ui/dashboard';
import toast from 'react-hot-toast';

const TABS = [
  { value: 'activity-logs', label: 'Activity Logs', icon: Activity },
  { value: 'membership', label: 'Membership', icon: Users },
  { value: 'events', label: 'Events Metrics', icon: Calendar },
  { value: 'financial', label: 'Financial Ledger', icon: Wallet },
];

function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    toast.error('No data available to compile');
    return;
  }
  try {
    const headers = Object.keys(data[0]).join(',');
    const rows = data
      .map((row) =>
        Object.values(row)
          .map((v) =>
            typeof v === 'string' && /[",\n]/.test(v)
              ? `"${v.replace(/"/g, '""')}"`
              : v
          )
          .join(',')
      )
      .join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Successfully compiled and exported ${filename}.csv!`);
  } catch {
    toast.error('An error occurred during report compilation');
  }
}

export default function AdvisorReportsClient({
  activityLogs = [],
  dashboardMetrics = {},
  platformStats = {},
  budgetSummary = {},
  eventsWithStats = [],
}) {
  const [tab, setTab] = useState('activity-logs');
  const [query, setQuery] = useState('');

  const filteredLogs = useMemo(
    () =>
      activityLogs.filter(
        (l) =>
          !query ||
          l.action?.toLowerCase().includes(query.toLowerCase()) ||
          l.entity_type?.toLowerCase().includes(query.toLowerCase()) ||
          l.users?.full_name?.toLowerCase().includes(query.toLowerCase())
      ),
    [activityLogs, query]
  );

  const handleExport = () => {
    if (tab === 'activity-logs') {
      exportToCSV(
        filteredLogs.map((l) => ({
          timestamp: new Date(l.created_at).toLocaleString(),
          user: l.users?.full_name ?? 'Unknown',
          action: l.action,
          entity: l.entity_type,
        })),
        'activity-logs'
      );
    } else if (tab === 'events') {
      exportToCSV(
        eventsWithStats.map((e) => ({
          title: e.title,
          start_date: e.start_date,
          registered: e.registrationCount ?? 0,
          attended: e.attendedCount ?? 0,
          rate:
            e.registrationCount > 0
              ? `${Math.round((e.attendedCount / e.registrationCount) * 100)}%`
              : '0%',
        })),
        'events-metrics'
      );
    } else if (tab === 'membership') {
      exportToCSV(
        [
          {
            Metric: 'Pending Member Approvals',
            Count: dashboardMetrics.pendingMemberProfiles ?? 0,
          },
          {
            Metric: 'Pending Join Requests',
            Count: dashboardMetrics.pendingJoinRequests ?? 0,
          },
          {
            Metric: 'Approved Active Members',
            Count: platformStats.totalApprovedMembers ?? 0,
          },
        ],
        'membership-snapshot'
      );
    } else if (tab === 'financial') {
      exportToCSV(
        [
          {
            Metric: 'Total Received Income',
            Amount: `৳${Number(budgetSummary.totalIncome ?? 0).toLocaleString()}`,
          },
          {
            Metric: 'Total Spent Expenses',
            Amount: `৳${Number(budgetSummary.totalExpenses ?? 0).toLocaleString()}`,
          },
          {
            Metric: 'Current Ledger Balance',
            Amount: `৳${Number(budgetSummary.balance ?? 0).toLocaleString()}`,
          },
        ],
        'financial-ledger-summary'
      );
    }
  };

  const balance = Number(budgetSummary.balance ?? 0);

  return (
    <PageShell>
      {/* Page Header */}
      <PageHeader
        icon={FileText}
        title="Oversight Reports"
        subtitle="Access system operational logs, membership growth rates, and general financial ledgers."
        accent="emerald"
        actions={
          <div className="w-full sm:w-auto">
            <ActionButton tone="primary" icon={Download} onClick={handleExport}>
              Compile & Export CSV
            </ActionButton>
          </div>
        }
      />

      {/* Main Tabs Container */}
      <GlassCard padding="p-5">
        <TabBar tabs={TABS} value={tab} onChange={setTab} />

        {/* ── Activity Logs View ────────────────────────────────────────── */}
        {tab === 'activity-logs' && (
          <div className="mt-5 space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search audit logs by executive, transaction type, or specific action..."
                className="w-full rounded-xl border border-white/8 bg-white/3 py-2.5 pr-4 pl-11 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
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

            {filteredLogs.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No operational logs match"
                description="Recorded platform actions logged by executives will surface here."
                accent="emerald"
              />
            ) : (
              <div className="space-y-3">
                <ul className="space-y-2">
                  {filteredLogs.slice(0, 50).map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </ul>
                {filteredLogs.length > 50 && (
                  <p className="pt-2 text-center font-mono text-[10px] font-bold tracking-wide text-gray-500 uppercase select-none">
                    {`Showing first 50 of ${filteredLogs.length} audit entries. Export CSV to extract complete ledger.`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Membership Snapshot View ───────────────────────────────────── */}
        {tab === 'membership' && (
          <div className="mt-5 grid grid-cols-1 gap-3 select-none sm:grid-cols-3">
            <StatCard
              icon={Users}
              label="Pending Member Profiles"
              value={dashboardMetrics.pendingMemberProfiles ?? 0}
              accent="amber"
              sublabel="Identity verifications"
              delay={0}
            />
            <StatCard
              icon={Users}
              label="Pending Join Requests"
              value={dashboardMetrics.pendingJoinRequests ?? 0}
              accent="blue"
              sublabel="New candidate filings"
              delay={0.05}
            />
            <StatCard
              icon={CheckCircle}
              label="Verified Club Members"
              value={platformStats.totalApprovedMembers ?? 0}
              accent="emerald"
              sublabel="Total approved profiles"
              delay={0.1}
            />
          </div>
        )}

        {/* ── Events Metrics View ────────────────────────────────────────── */}
        {tab === 'events' && (
          <div className="mt-5 space-y-3">
            {eventsWithStats.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No club events recorded"
                description="Upcoming or past bootcamps and workshops will appear here."
                accent="emerald"
              />
            ) : (
              <div className="space-y-2">
                {eventsWithStats.slice(0, 10).map((e) => (
                  <EventSummaryRow key={e.id} event={e} />
                ))}
                {eventsWithStats.length > 10 && (
                  <p className="pt-2 text-center font-mono text-[10px] font-bold tracking-wide text-gray-500 uppercase select-none">
                    {`Showing top 10 recent events. Compile & Export CSV to extract all records.`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Financial Ledger View ──────────────────────────────────────── */}
        {tab === 'financial' && (
          <div className="mt-5 grid grid-cols-1 gap-3 select-none sm:grid-cols-3">
            <StatCard
              icon={TrendingUp}
              label="Total Income Inflow"
              value={`৳${Number(budgetSummary.totalIncome ?? 0).toLocaleString()}`}
              accent="emerald"
              sublabel="All received club budget"
              delay={0}
            />
            <StatCard
              icon={TrendingDown}
              label="Total Spent Outflow"
              value={`৳${Number(budgetSummary.totalExpenses ?? 0).toLocaleString()}`}
              accent="rose"
              sublabel="All approved transactions"
              delay={0.05}
            />
            <StatCard
              icon={Wallet}
              label="Net Operational Balance"
              value={`৳${balance.toLocaleString()}`}
              accent={balance >= 0 ? 'blue' : 'amber'}
              sublabel={
                balance >= 0 ? 'Surplus / Healthy' : 'Deficit — Review Ledger'
              }
              delay={0.1}
            />
          </div>
        )}
      </GlassCard>
    </PageShell>
  );
}

// ── Log Row Component ────────────────────────────────────────────────────────
function LogRow({ log }) {
  const creatorName = log.users?.full_name || 'System';
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/6 bg-white/2 p-3.5 transition-all hover:border-white/10 hover:bg-white/4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={creatorName} size="sm" src={log.users?.avatar_url} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-white">
            <span className="font-bold">{creatorName}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-black tracking-widest uppercase ${
                log.action === 'create'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : log.action === 'delete'
                    ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                    : 'border-blue-500/20 bg-blue-500/10 text-blue-400'
              }`}
            >
              {log.action}
            </span>
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-gray-500">
            {log.entity_type && (
              <span className="capitalize">{log.entity_type}</span>
            )}
            {log.entity_id && ` // ID: ${log.entity_id.substring(0, 8)}`}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 font-mono text-xs text-gray-500 select-none">
        <Clock className="h-3.5 w-3.5 text-gray-600" />
        <span>{new Date(log.created_at).toLocaleString()}</span>
      </div>
    </li>
  );
}

// ── Event Summary Row Component ──────────────────────────────────────────────
function EventSummaryRow({ event }) {
  const rate =
    event.registrationCount > 0
      ? Math.round((event.attendedCount / event.registrationCount) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/6 bg-white/2 p-4 transition-all hover:bg-white/4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-white">{event.title}</p>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(event.start_date).toLocaleDateString()}
        </p>

        {/* Attendance conversion meter bar */}
        <div className="mt-3.5 max-w-xs">
          <div className="h-2 w-full overflow-hidden rounded-full border border-white/6 bg-white/5">
            <div
              className="h-full bg-linear-to-r from-blue-500 via-violet-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-5 text-center font-mono select-none">
        <div>
          <p className="text-sm font-black text-white">
            {event.registrationCount ?? 0}
          </p>
          <p className="mt-0.5 text-[9px] font-bold tracking-wide text-gray-500 uppercase">
            Registered
          </p>
        </div>
        <div className="h-8 border-l border-white/8" />
        <div>
          <p className="text-sm font-black text-white">
            {event.attendedCount ?? 0}
          </p>
          <p className="mt-0.5 text-[9px] font-bold tracking-wide text-gray-500 uppercase">
            Attended
          </p>
        </div>
        <div className="h-8 border-l border-white/8" />
        <div>
          <p className="text-sm font-black text-emerald-400">{rate}%</p>
          <p className="mt-0.5 text-[9px] font-bold tracking-wide text-gray-500 uppercase">
            Rate
          </p>
        </div>
      </div>
    </div>
  );
}
