/**
 * @file Reports client — redesigned executive reporting hub featuring a
 *   multi-tab workspace with real-time searches, database-driven metrics,
 *   financial ledger entries, role distributions, and a CSV spreadsheet exporter.
 * @module ExecutiveReportsClient
 */

'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  Users,
  Calendar,
  Wallet,
  BookOpen,
  Search,
  Download,
  Clock,
  TrendingUp,
  FileText,
  DollarSign,
  GraduationCap,
  Sparkles,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  TabBar,
  StatCard,
  Pill,
  GradientBar,
  EmptyState,
  ActionButton,
  Avatar,
  SectionHeader,
  StaggerList,
} from '@/app/account/_components/ui';

const WORKSPACE_TABS = [
  { value: 'overview-logs', label: 'Overview & Logs', icon: Activity },
  { value: 'directory', label: 'Member Directory', icon: Users },
  { value: 'events-contests', label: 'Events & Contests', icon: Calendar },
  { value: 'treasury', label: 'Treasury & Budget', icon: Wallet },
  { value: 'content-lms', label: 'Content & Learning', icon: BookOpen },
];

function downloadCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  const headers = Object.keys(data[0]).join(',');
  const rows = data
    .map((row) =>
      Object.values(row)
        .map((v) => {
          const stringVal = v === null || v === undefined ? '' : String(v);
          return stringVal.includes(',') ||
            stringVal.includes('"') ||
            stringVal.includes('\n')
            ? `"${stringVal.replace(/"/g, '""')}"`
            : stringVal;
        })
        .join(',')
    )
    .join('\n');
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsClient({
  userStats = {},
  platformStats = {},
  dashboardMetrics = {},
  budgetSummary = {},
  budgetEntries = [],
  eventsData = {},
  blogsData = {},
  activityLogs = [],
  rolesStats = [],
  bootcamps = [],
}) {
  const [tab, setTab] = useState('overview-logs');
  const [logQuery, setLogQuery] = useState('');
  const [budgetQuery, setBudgetQuery] = useState('');
  const [eventQuery, setEventQuery] = useState('');

  // Safe fallback resolver for Supabase rolesStats object/array mismatch
  const rolesList = useMemo(() => {
    if (Array.isArray(rolesStats)) return rolesStats;
    if (rolesStats && Array.isArray(rolesStats.roles)) return rolesStats.roles;
    return [];
  }, [rolesStats]);

  // 1. Logs Workspace Filters
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (!logQuery) return true;
      const q = logQuery.toLowerCase();
      return (
        log.action?.toLowerCase().includes(q) ||
        log.entity_type?.toLowerCase().includes(q) ||
        log.users?.full_name?.toLowerCase().includes(q) ||
        log.users?.email?.toLowerCase().includes(q)
      );
    });
  }, [activityLogs, logQuery]);

  // 2. Budget Workspace Filters
  const filteredBudget = useMemo(() => {
    return budgetEntries.filter((entry) => {
      if (!budgetQuery) return true;
      const q = budgetQuery.toLowerCase();
      return (
        entry.description?.toLowerCase().includes(q) ||
        entry.entry_type?.toLowerCase().includes(q) ||
        entry.events?.title?.toLowerCase().includes(q) ||
        entry.users?.full_name?.toLowerCase().includes(q)
      );
    });
  }, [budgetEntries, budgetQuery]);

  // 3. Events Workspace Filters
  const events = useMemo(() => eventsData.events || [], [eventsData.events]);
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!eventQuery) return true;
      const q = eventQuery.toLowerCase();
      return (
        e.title?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.status?.toLowerCase().includes(q) ||
        e.creatorName?.toLowerCase().includes(q)
      );
    });
  }, [events, eventQuery]);

  // CSV Spreadsheet Exporter Dispatcher
  const handleExport = () => {
    if (tab === 'overview-logs') {
      const data = filteredLogs.map((log) => ({
        Timestamp: new Date(log.created_at).toLocaleString(),
        OperatorName: log.users?.full_name ?? 'System',
        OperatorEmail: log.users?.email ?? 'N/A',
        Action: log.action ?? 'N/A',
        EntityType: log.entity_type ?? 'N/A',
        EntityID: log.entity_id ?? 'N/A',
        Details: JSON.stringify(log.details || {}),
      }));
      downloadCSV(data, 'system_activity_logs');
    } else if (tab === 'directory') {
      const roleData = rolesList.map((r) => ({
        RoleName: r.name,
        Priority: r.priority,
        UserCount: r.userCount ?? 0,
        PermissionsCount: r.permissionsCount ?? 0,
      }));
      downloadCSV(roleData, 'role_distribution_summary');
    } else if (tab === 'events-contests') {
      const data = filteredEvents.map((e) => ({
        EventTitle: e.title,
        Category: e.category ?? 'Uncategorized',
        Status: e.status,
        StartDate: e.start_date
          ? new Date(e.start_date).toLocaleDateString()
          : 'N/A',
        CreatedBy: e.creatorName,
        Registrations: e.registrationCount ?? 0,
        Attendees: e.attendedCount ?? 0,
        AttendanceRate:
          e.registrationCount > 0
            ? `${Math.round((e.attendedCount / e.registrationCount) * 100)}%`
            : '0%',
      }));
      downloadCSV(data, 'events_performance_report');
    } else if (tab === 'treasury') {
      const data = filteredBudget.map((entry) => ({
        TransactionDate: new Date(entry.transaction_date).toLocaleDateString(),
        Description: entry.description,
        Type: entry.entry_type,
        Amount: entry.amount,
        EventTitle: entry.events?.title ?? 'General/None',
        ApprovedBy: entry.users?.full_name ?? 'Pending/N/A',
      }));
      downloadCSV(data, 'treasury_ledger_history');
    } else if (tab === 'content-lms') {
      const blogData = (blogsData.posts || []).map((post) => ({
        ArticleTitle: post.title,
        Category: post.category ?? 'General',
        Status: post.status,
        Author: post.users?.full_name ?? 'Unknown',
        Views: post.views ?? 0,
        Likes: post.likes ?? 0,
        CommentsCount: post.commentCount ?? 0,
        PendingComments: post.pendingComments ?? 0,
        PublishedDate: post.published_at
          ? new Date(post.published_at).toLocaleDateString()
          : 'Draft',
      }));
      downloadCSV(blogData, 'content_blog_insights');
    }
  };

  return (
    <PageShell>
      {/* Premium Dashboard Header */}
      <PageHeader
        icon={TrendingUp}
        title="Reports & Analytics"
        subtitle="Live platform metrics, treasury logs, learning records, and activity tracking"
        accent="violet"
        actions={
          <ActionButton tone="primary" icon={Download} onClick={handleExport}>
            Export Spreadsheet
          </ActionButton>
        }
      />

      {/* Tabs Switcher Navigation */}
      <GlassCard
        padding="p-4"
        className="border-white/[0.08] bg-white/[0.01] backdrop-blur-xl"
      >
        <TabBar tabs={WORKSPACE_TABS} value={tab} onChange={setTab} />

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & SYSTEM LOGS */}
        {/* ========================================================================= */}
        {tab === 'overview-logs' && (
          <div className="mt-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label="Total Platform Accounts"
                value={platformStats.totalUsers ?? 0}
                sublabel={`${platformStats.approvedMembers ?? 0} approved members`}
                accent="blue"
              />
              <StatCard
                icon={Calendar}
                label="Active Events & Contests"
                value={platformStats.totalEvents ?? 0}
                sublabel={`${platformStats.totalContests ?? 0} competitive contests`}
                accent="violet"
              />
              <StatCard
                icon={DollarSign}
                label="Budget Net Balance"
                value={`৳${Number(budgetSummary.balance ?? 0).toLocaleString()}`}
                sublabel={`${budgetEntries.length} logged ledger entries`}
                accent={
                  Number(budgetSummary.balance ?? 0) >= 0 ? 'emerald' : 'amber'
                }
              />
              <StatCard
                icon={Sparkles}
                label="Action Log Size"
                value={activityLogs.length}
                sublabel="Live system operations"
                accent="cyan"
              />
            </div>

            {/* Audit Logs Table Panel */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
                  Real-time System Audit Ledger
                </h3>
                {/* Search Bar */}
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={logQuery}
                    onChange={(e) => setLogQuery(e.target.value)}
                    placeholder="Search logs by action, user or category..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pr-3 pl-10 text-sm text-white placeholder-gray-500 focus:border-violet-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No system activity logs found"
                  description="System actions performed by members, mentors, or executives will appear here."
                />
              ) : (
                <GlassCard
                  padding="p-4"
                  className="overflow-hidden border-white/[0.05] bg-white/[0.02]"
                >
                  <ul className="divide-y divide-white/[0.04]">
                    <StaggerList>
                      {filteredLogs.map((log) => {
                        // Action styling
                        const isApproval =
                          log.action?.toLowerCase().includes('approve') ||
                          log.action?.toLowerCase().includes('create');
                        const isDanger =
                          log.action?.toLowerCase().includes('delete') ||
                          log.action?.toLowerCase().includes('ban') ||
                          log.action?.toLowerCase().includes('suspend');
                        const pillTone = isApproval
                          ? 'emerald'
                          : isDanger
                            ? 'rose'
                            : 'blue';

                        return (
                          <li
                            key={log.id}
                            className="flex flex-col gap-3 py-3 transition-colors hover:bg-white/[0.01] sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={log.users?.full_name ?? '?'}
                                src={log.users?.avatar_url}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                  {log.users?.full_name ?? 'System Action'}
                                  <Pill
                                    tone={pillTone}
                                    className="ml-2 font-mono uppercase"
                                  >
                                    {log.action}
                                  </Pill>
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  Entity Type:{' '}
                                  <span className="font-semibold text-gray-400 capitalize">
                                    {log.entity_type || 'General'}
                                  </span>
                                  {log.entity_id &&
                                    ` | Reference ID: #${log.entity_id.slice(0, 8)}`}
                                  {log.details?.description &&
                                    ` | ${log.details.description}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 sm:self-center">
                              <Clock className="h-3.5 w-3.5 text-gray-600" />
                              <span>
                                {new Date(log.created_at).toLocaleString()}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </StaggerList>
                  </ul>
                  {filteredLogs.length > 50 && (
                    <div className="pt-3 text-center text-xs text-gray-500">
                      Showing first 50 logged activities. Export to spreadsheet
                      to view all logs.
                    </div>
                  )}
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MEMBER & DIRECTORY INSIGHTS */}
        {/* ========================================================================= */}
        {tab === 'directory' && (
          <div className="mt-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label="Registered Profiles"
                value={userStats.total ?? 0}
                sublabel="Total accounts on database"
                accent="blue"
              />
              <StatCard
                icon={CheckCircle2}
                label="Active Status Accounts"
                value={userStats.active ?? 0}
                sublabel="Unrestricted access users"
                accent="emerald"
              />
              <StatCard
                icon={Clock}
                label="Awaiting Profile Approval"
                value={
                  (userStats.pending ?? 0) +
                  (dashboardMetrics.pendingMemberApprovals ?? 0)
                }
                sublabel="Requires Executive sign-off"
                accent="amber"
              />
              <StatCard
                icon={XCircle}
                label="Suspended or Banned Accounts"
                value={(userStats.suspended ?? 0) + (userStats.banned ?? 0)}
                sublabel="Access restrictions active"
                accent="rose"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Account Status Distributions */}
              <GlassCard
                padding="p-5"
                className="space-y-5 border-white/[0.05] bg-white/[0.02] lg:col-span-5"
              >
                <SectionHeader
                  icon={Users}
                  title="Account Status Proportions"
                  accent="violet"
                />

                {[
                  {
                    label: 'Active Users',
                    count: userStats.active ?? 0,
                    max: userStats.total || 1,
                    tone: 'emerald',
                  },
                  {
                    label: 'Pending Approvals',
                    count: userStats.pending ?? 0,
                    max: userStats.total || 1,
                    tone: 'amber',
                  },
                  {
                    label: 'Suspended Accounts',
                    count: userStats.suspended ?? 0,
                    max: userStats.total || 1,
                    tone: 'rose',
                  },
                  {
                    label: 'Banned / Blocked',
                    count: userStats.banned ?? 0,
                    max: userStats.total || 1,
                    tone: 'red',
                  },
                  {
                    label: 'Inactive Profiles',
                    count: userStats.inactive ?? 0,
                    max: userStats.total || 1,
                    tone: 'gray',
                  },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-300">
                        {item.label}
                      </span>
                      <span className="font-mono text-gray-400">
                        {item.count}{' '}
                        <span className="text-gray-600">
                          / {userStats.total}
                        </span>
                      </span>
                    </div>
                    <GradientBar
                      value={item.count}
                      max={item.max}
                      tone={item.tone}
                    />
                  </div>
                ))}
              </GlassCard>

              {/* Roles Breakdown Grid */}
              <GlassCard
                padding="p-5"
                className="space-y-4 border-white/[0.05] bg-white/[0.02] lg:col-span-7"
              >
                <SectionHeader
                  icon={ShieldCheck}
                  title="User Role Structure"
                  accent="blue"
                />

                {rolesList.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No database roles cataloged"
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {rolesList.map((role) => (
                      <div
                        key={role.id}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white capitalize">
                              {role.name}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-gray-500">
                              Priority: {role.priority}
                            </p>
                          </div>
                          <Pill tone="indigo" className="font-semibold">
                            {role.userCount ?? 0} Assigned
                          </Pill>
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-white/[0.04] pt-2 text-xs text-gray-400">
                          <span>Permissions</span>
                          <span className="font-semibold text-gray-500">
                            {role.permissionsCount ?? 0} active rules
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: EVENTS & CONTESTS PERFORMANCE */}
        {/* ========================================================================= */}
        {tab === 'events-contests' && (
          <div className="mt-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Calendar}
                label="Total Logged Events"
                value={eventsData.stats?.total ?? 0}
                sublabel={`${eventsData.stats?.completed ?? 0} completed events`}
                accent="violet"
              />
              <StatCard
                icon={Sparkles}
                label="Draft & Pending Releases"
                value={eventsData.stats?.draft ?? 0}
                sublabel="Awaiting release coordinates"
                accent="amber"
              />
              <StatCard
                icon={TrendingUp}
                label="Total Event Registrations"
                value={eventsData.stats?.totalRegistrations ?? 0}
                sublabel="Aggregate member participation"
                accent="blue"
              />
              <StatCard
                icon={Trophy}
                label="Competitive Contests"
                value={platformStats.totalContests ?? 0}
                sublabel="Programming arenas hosted"
                accent="cyan"
              />
            </div>

            {/* Detailed Performance List */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
                  Events Engagement Analytics Ledger
                </h3>
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={eventQuery}
                    onChange={(e) => setEventQuery(e.target.value)}
                    placeholder="Search events by title, category, status..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pr-3 pl-10 text-sm text-white placeholder-gray-500 focus:border-violet-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No events record matching query"
                  description="Events details or participation stats will show up here."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <StaggerList>
                    {filteredEvents.map((e) => {
                      const attendanceRate =
                        e.registrationCount > 0
                          ? Math.round(
                              (e.attendedCount / e.registrationCount) * 100
                            )
                          : 0;

                      // Event Status Pill Colors
                      const statusTone =
                        e.status === 'completed'
                          ? 'emerald'
                          : e.status === 'ongoing'
                            ? 'blue'
                            : e.status === 'draft'
                              ? 'gray'
                              : 'amber';

                      return (
                        <GlassCard
                          key={e.id}
                          padding="p-4"
                          className="flex flex-col justify-between space-y-4 border-white/[0.06] bg-white/[0.02]"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between">
                              <span className="font-mono text-[10px] tracking-wider text-violet-400 uppercase">
                                {e.category || 'General'}
                              </span>
                              <Pill
                                tone={statusTone}
                                className="font-mono text-[10px] uppercase"
                              >
                                {e.status}
                              </Pill>
                            </div>
                            <h4
                              className="truncate text-sm font-semibold text-white"
                              title={e.title}
                            >
                              {e.title}
                            </h4>
                            <p className="text-[10px] text-gray-500">
                              Hosted:{' '}
                              {e.start_date
                                ? new Date(e.start_date).toLocaleDateString()
                                : 'Unscheduled'}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-3 text-center">
                            <div>
                              <p className="font-mono text-sm font-bold text-white">
                                {e.registrationCount ?? 0}
                              </p>
                              <p className="text-[10px] tracking-wide text-gray-500 uppercase">
                                Registered
                              </p>
                            </div>
                            <div>
                              <p className="font-mono text-sm font-bold text-white">
                                {e.attendedCount ?? 0}
                              </p>
                              <p className="text-[10px] tracking-wide text-gray-500 uppercase">
                                Attended
                              </p>
                            </div>
                            <div>
                              <p className="font-mono text-sm font-bold text-violet-400">
                                {attendanceRate}%
                              </p>
                              <p className="text-[10px] tracking-wide text-gray-500 uppercase">
                                Conv. Rate
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>Attendance Performance Bar</span>
                              <span>
                                {e.attendedCount} / {e.registrationCount}
                              </span>
                            </div>
                            <GradientBar
                              value={e.attendedCount}
                              max={e.registrationCount || 1}
                              tone="violet"
                            />
                          </div>
                        </GlassCard>
                      );
                    })}
                  </StaggerList>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TREASURY & LEDGER HISTORIAN */}
        {/* ========================================================================= */}
        {tab === 'treasury' && (
          <div className="mt-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={ArrowUpRight}
                label="Aggregate Club Income"
                value={`৳${Number(budgetSummary.totalIncome ?? 0).toLocaleString()}`}
                sublabel="Inflow revenues logged"
                accent="emerald"
              />
              <StatCard
                icon={ArrowDownRight}
                label="Aggregate Club Expenditures"
                value={`৳${Number(budgetSummary.totalExpenses ?? 0).toLocaleString()}`}
                sublabel="Outflow expenditures logged"
                accent="rose"
              />
              <StatCard
                icon={DollarSign}
                label="Treasury Net Balance"
                value={`৳${Number(budgetSummary.balance ?? 0).toLocaleString()}`}
                sublabel="Current bank/cash reserves"
                accent={
                  Number(budgetSummary.balance ?? 0) >= 0 ? 'blue' : 'amber'
                }
              />
            </div>

            {/* Treasury Transactions Ledger */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
                  Treasury Budget Ledger Transactions
                </h3>
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={budgetQuery}
                    onChange={(e) => setBudgetQuery(e.target.value)}
                    placeholder="Search ledger by details, event, description..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pr-3 pl-10 text-sm text-white placeholder-gray-500 focus:border-violet-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {filteredBudget.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No financial entries recorded"
                  description="Income or expense transactions approved on the system will show up here."
                />
              ) : (
                <GlassCard
                  padding="p-4"
                  className="overflow-hidden border-white/[0.05] bg-white/[0.02]"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-xs tracking-wider text-gray-500 uppercase">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Entry Context</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-right">
                            Approval Officer
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <StaggerList>
                          {filteredBudget.map((entry) => {
                            const isIncome = entry.entry_type === 'income';
                            return (
                              <tr
                                key={entry.id}
                                className="transition-colors hover:bg-white/[0.01]"
                              >
                                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-gray-400">
                                  {new Date(
                                    entry.transaction_date
                                  ).toLocaleDateString()}
                                </td>
                                <td
                                  className="max-w-xs truncate px-4 py-3 font-medium text-white"
                                  title={entry.description}
                                >
                                  {entry.description}
                                </td>
                                <td className="px-4 py-3">
                                  <Pill
                                    tone={isIncome ? 'emerald' : 'rose'}
                                    className="font-mono text-[10px] font-semibold uppercase"
                                  >
                                    {entry.entry_type}
                                  </Pill>
                                  {entry.events && (
                                    <span
                                      className="block max-w-[150px] truncate text-[10px] text-gray-500"
                                      title={entry.events.title}
                                    >
                                      Event: {entry.events.title}
                                    </span>
                                  )}
                                </td>
                                <td
                                  className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}
                                >
                                  {isIncome ? '+' : '-'}৳
                                  {Number(entry.amount).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-xs whitespace-nowrap text-gray-500">
                                  {entry.users?.full_name ??
                                    'Authorized / Admin'}
                                </td>
                              </tr>
                            );
                          })}
                        </StaggerList>
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CONTENT & LEARNING METRICS */}
        {/* ========================================================================= */}
        {tab === 'content-lms' && (
          <div className="mt-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={GraduationCap}
                label="Bootcamps Catalog"
                value={bootcamps.length}
                sublabel="Total dynamic learning programs"
                accent="violet"
              />
              <StatCard
                icon={BookOpen}
                label="Published Articles"
                value={blogsData.stats?.published ?? 0}
                sublabel={`${blogsData.stats?.draft ?? 0} drafts awaiting review`}
                accent="emerald"
              />
              <StatCard
                icon={TrendingUp}
                label="Aggregate Article Views"
                value={blogsData.stats?.totalViews ?? 0}
                sublabel="Active reader views count"
                accent="blue"
              />
              <StatCard
                icon={Trophy}
                label="Aggregate Article Likes"
                value={blogsData.stats?.totalLikes ?? 0}
                sublabel={`${blogsData.stats?.totalComments ?? 0} reader comments logged`}
                accent="rose"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Bootcamps Ledger */}
              <GlassCard
                padding="p-5"
                className="space-y-4 border-white/[0.05] bg-white/[0.02] lg:col-span-5"
              >
                <SectionHeader
                  icon={GraduationCap}
                  title="Active Learning Bootcamps"
                  accent="violet"
                />

                {bootcamps.length === 0 ? (
                  <EmptyState
                    icon={GraduationCap}
                    title="No active Bootcamps available"
                  />
                ) : (
                  <ul className="max-h-[350px] divide-y divide-white/[0.04] overflow-y-auto pr-1">
                    {bootcamps.map((bc) => (
                      <li
                        key={bc.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div className="min-w-0">
                          <p
                            className="max-w-[200px] truncate text-xs font-semibold text-white"
                            title={bc.title}
                          >
                            {bc.title}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Released:{' '}
                            {bc.start_date
                              ? new Date(bc.start_date).toLocaleDateString()
                              : 'Unscheduled'}
                          </p>
                        </div>
                        <Pill
                          tone="blue"
                          className="font-mono text-[10px] tracking-wide uppercase"
                        >
                          LMS Active
                        </Pill>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassCard>

              {/* Popular Articles Performance Grid */}
              <GlassCard
                padding="p-5"
                className="space-y-4 border-white/[0.05] bg-white/[0.02] lg:col-span-7"
              >
                <SectionHeader
                  icon={FileText}
                  title="Top-Performing Articles Metrics"
                  accent="emerald"
                />

                {!blogsData.posts || blogsData.posts.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No blog posts registered yet"
                  />
                ) : (
                  <div className="max-h-[350px] space-y-3 overflow-y-auto pr-1">
                    {blogsData.posts.slice(0, 5).map((post) => (
                      <div
                        key={post.id}
                        className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 transition-colors hover:border-white/[0.08]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-semibold tracking-wide text-emerald-400 uppercase">
                              {post.category || 'Tech'}
                            </span>
                            <h5
                              className="truncate text-xs font-semibold text-white"
                              title={post.title}
                            >
                              {post.title}
                            </h5>
                            <p className="text-[10px] text-gray-500">
                              Author: {post.users?.full_name ?? 'Author'}
                            </p>
                          </div>
                          <Pill
                            tone={
                              post.status === 'published' ? 'emerald' : 'gray'
                            }
                            className="font-mono text-[10px] whitespace-nowrap uppercase"
                          >
                            {post.status}
                          </Pill>
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-white/[0.04] pt-2 font-mono text-[10px] text-gray-400">
                          <span className="text-gray-500">
                            Views:{' '}
                            <span className="font-bold text-white">
                              {post.views ?? 0}
                            </span>
                          </span>
                          <span className="text-gray-500">
                            Likes:{' '}
                            <span className="font-bold text-white">
                              {post.likes ?? 0}
                            </span>
                          </span>
                          <span className="text-gray-500">
                            Comments:{' '}
                            <span className="font-bold text-white">
                              {post.commentCount ?? 0}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        )}
      </GlassCard>
    </PageShell>
  );
}
