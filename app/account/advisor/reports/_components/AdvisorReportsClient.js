/**
 * @file Advisor reports client — activity log, membership snapshot,
 *   events summary, and financial summary tabs with CSV export.
 *
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
} from '../../../_components/ui/dashboard';

const TABS = [
  { value: 'activity-logs', label: 'Activity Logs', icon: Activity },
  { value: 'membership', label: 'Membership', icon: Activity },
  { value: 'events', label: 'Events', icon: Calendar },
  { value: 'financial', label: 'Financial', icon: Wallet },
];

function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  const headers = Object.keys(data[0]).join(',');
  const rows = data
    .map((row) =>
      Object.values(row)
        .map((v) =>
          typeof v === 'string' && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
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
        })),
        'events-summary'
      );
    }
  };

  return (
    <PageShell>
      <PageHeader
        icon={FileText}
        title="Reports"
        subtitle="Operational insights and activity logs"
        accent="emerald"
        actions={
          <ActionButton tone="primary" icon={Download} onClick={handleExport}>
            Export CSV
          </ActionButton>
        }
      />

      <GlassCard padding="p-4">
        <TabBar tabs={TABS} value={tab} onChange={setTab} />

        {tab === 'activity-logs' && (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search logs by user, action, or entity…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pr-3 pl-10 text-sm text-white placeholder-gray-500 focus:border-emerald-500/40 focus:outline-none"
              />
            </div>
            {filteredLogs.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No activity logs"
                description="Recorded system activity will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {filteredLogs.slice(0, 50).map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
                {filteredLogs.length > 50 && (
                  <li className="text-center text-xs text-gray-500">
                    Showing first 50 of {filteredLogs.length} entries — export
                    CSV to see all.
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        {tab === 'membership' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Activity}
              label="Pending Member Approvals"
              value={dashboardMetrics.pendingMemberProfiles ?? 0}
              accent="amber"
            />
            <StatCard
              icon={Activity}
              label="Pending Join Requests"
              value={dashboardMetrics.pendingJoinRequests ?? 0}
              accent="blue"
            />
            <StatCard
              icon={Activity}
              label="Approved Members"
              value={platformStats.totalApprovedMembers ?? 0}
              accent="emerald"
            />
          </div>
        )}

        {tab === 'events' && (
          <div className="mt-4 space-y-2">
            {eventsWithStats.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No events"
                description="Events created on the platform will appear here."
              />
            ) : (
              eventsWithStats.slice(0, 10).map((e) => (
                <EventSummaryRow key={e.id} event={e} />
              ))
            )}
          </div>
        )}

        {tab === 'financial' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Wallet}
              label="Total Income"
              value={`৳${Number(budgetSummary.totalIncome ?? 0).toLocaleString()}`}
              accent="emerald"
            />
            <StatCard
              icon={Wallet}
              label="Total Expenses"
              value={`৳${Number(budgetSummary.totalExpenses ?? 0).toLocaleString()}`}
              accent="rose"
            />
            <StatCard
              icon={Wallet}
              label="Balance"
              value={`৳${Number(budgetSummary.balance ?? 0).toLocaleString()}`}
              accent={Number(budgetSummary.balance ?? 0) >= 0 ? 'blue' : 'amber'}
            />
          </div>
        )}
      </GlassCard>
    </PageShell>
  );
}

function LogRow({ log }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={log.users?.full_name ?? '?'} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm text-white">
            <span className="font-semibold">
              {log.users?.full_name || 'Unknown'}
            </span>{' '}
            <Pill tone="blue" className="ml-1">
              {log.action}
            </Pill>
          </p>
          <p className="text-xs text-gray-500">
            {log.entity_type && <span className="capitalize">{log.entity_type}</span>}
            {log.entity_id && <> #{log.entity_id}</>}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{new Date(log.created_at).toLocaleString()}</span>
      </div>
    </li>
  );
}

function EventSummaryRow({ event }) {
  const rate =
    event.registrationCount > 0
      ? Math.round((event.attendedCount / event.registrationCount) * 100)
      : 0;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{event.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {new Date(event.start_date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex shrink-0 gap-4 text-center">
        <div>
          <p className="text-base font-bold text-white">
            {event.registrationCount ?? 0}
          </p>
          <p className="text-[10px] text-gray-500">Registered</p>
        </div>
        <div>
          <p className="text-base font-bold text-white">
            {event.attendedCount ?? 0}
          </p>
          <p className="text-[10px] text-gray-500">Attended</p>
        </div>
        <div>
          <p className="text-base font-bold text-white">{rate}%</p>
          <p className="text-[10px] text-gray-500">Rate</p>
        </div>
      </div>
    </div>
  );
}
