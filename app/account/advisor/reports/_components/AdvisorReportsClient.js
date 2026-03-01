/**
 * @file Advisor reports client — reporting dashboard with aggregated
 *   statistics, exportable summaries, and trend visualisations.
 * @module AdvisorReportsClient
 */

'use client';

import { useState } from 'react';
import {
  Activity,
  Users,
  Calendar,
  DollarSign,
  Download,
  Search,
  Filter,
  Clock,
} from 'lucide-react';

export default function AdvisorReportsClient({
  activityLogs = [],
  dashboardMetrics,
  platformStats,
  budgetSummary,
  eventsWithStats = [],
}) {
  const [activeTab, setActiveTab] = useState('activity-logs');
  const [searchQuery, setSearchQuery] = useState('');

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'activity-logs', label: 'Activity Logs' },
    { id: 'membership', label: 'Membership Snapshot' },
    { id: 'events', label: 'Events Summary' },
    { id: 'financial', label: 'Financial Summary' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="mt-1 text-gray-400">
            Operational insights and activity logs
          </p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'activity-logs') {
              exportToCSV(
                activityLogs.map((log) => ({
                  timestamp: new Date(log.created_at).toLocaleString(),
                  user: log.users?.full_name || 'Unknown',
                  action: log.action,
                  entity: log.entity_type,
                })),
                'activity-logs'
              );
            }
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        {/* Tab Headers */}
        <div className="flex overflow-x-auto border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-37.5 flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Activity Logs Tab */}
          {activeTab === 'activity-logs' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>

              {/* Logs Table */}
              <div className="space-y-2">
                {activityLogs
                  ?.filter(
                    (log) =>
                      !searchQuery ||
                      log.action
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      log.entity_type
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      log.users?.full_name
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                  .map((log) => (
                    <ActivityLogRow key={log.id} log={log} />
                  ))}
                {(!activityLogs || activityLogs.length === 0) && (
                  <div className="py-12 text-center">
                    <Activity className="mx-auto mb-4 h-16 w-16 text-gray-500" />
                    <p className="text-gray-400">No activity logs found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Membership Snapshot Tab */}
          {activeTab === 'membership' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <SnapshotCard
                  label="Pending Member Approvals"
                  value={dashboardMetrics?.pendingMemberProfiles || 0}
                  color="amber"
                />
                <SnapshotCard
                  label="Pending Join Requests"
                  value={dashboardMetrics?.pendingJoinRequests || 0}
                  color="blue"
                />
                <SnapshotCard
                  label="Approved Members"
                  value={platformStats?.totalApprovedMembers || 0}
                  color="green"
                />
              </div>
            </div>
          )}

          {/* Events Summary Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {eventsWithStats?.slice(0, 10).map((event) => (
                  <EventSummaryRow key={event.id} event={event} />
                ))}
                {(!eventsWithStats || eventsWithStats.length === 0) && (
                  <div className="py-12 text-center">
                    <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-500" />
                    <p className="text-gray-400">No events found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Summary Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <SnapshotCard
                  label="Total Income"
                  value={`৳${budgetSummary?.totalIncome || 0}`}
                  color="green"
                />
                <SnapshotCard
                  label="Total Expenses"
                  value={`৳${budgetSummary?.totalExpenses || 0}`}
                  color="red"
                />
                <SnapshotCard
                  label="Balance"
                  value={`৳${budgetSummary?.balance || 0}`}
                  color={budgetSummary?.balance >= 0 ? 'blue' : 'amber'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityLogRow({ log }) {
  return (
    <div className="rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-medium text-white">
              {log.users?.full_name || 'Unknown'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              {log.action}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {log.entity_type && (
              <span className="capitalize">{log.entity_type}</span>
            )}
            {log.entity_id && <span> #{log.entity_id}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{new Date(log.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function SnapshotCard({ label, value, color }) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  };

  return (
    <div className={`rounded-2xl border p-6 ${colorClasses[color]}`}>
      <p className="mb-2 text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function EventSummaryRow({ event }) {
  const attendanceRate =
    event.registrationCount > 0
      ? Math.round((event.attendedCount / event.registrationCount) * 100)
      : 0;

  return (
    <div className="rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-gray-400">
            {new Date(event.start_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-white">
              {event.registrationCount || 0}
            </p>
            <p className="text-xs text-gray-400">Registered</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">
              {event.attendedCount || 0}
            </p>
            <p className="text-xs text-gray-400">Attended</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{attendanceRate}%</p>
            <p className="text-xs text-gray-400">Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
