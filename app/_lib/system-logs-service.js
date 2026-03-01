/**
 * @file system logs service
 * @module system-logs-service
 */

import { supabaseAdmin } from './supabase';

// ─── Category & Severity Classification ──────────────────────────────────────

/** Classify a log entry into one of 5 display categories */
export function classifyLog(log) {
  const action = (log.action || '').toLowerCase();
  const entity = (log.entity_type || '').toLowerCase();

  // Security
  if (
    action.includes('login_failed') ||
    action.includes('fail') ||
    action.includes('lock') ||
    action.includes('ban') ||
    action.includes('suspend') ||
    action.includes('denied') ||
    action.includes('unauthorized') ||
    action.includes('blocked') ||
    action.includes('invalid_token') ||
    action.includes('session_expired')
  )
    return 'security';

  // User activity
  if (
    action.includes('login') ||
    action.includes('logout') ||
    action.includes('register') ||
    action.includes('signup') ||
    action.includes('profile') ||
    action.includes('password') ||
    action.includes('avatar') ||
    entity === 'users'
  )
    return 'user_activity';

  // Content
  if (
    entity === 'blog_posts' ||
    entity === 'events' ||
    entity === 'gallery_items' ||
    entity === 'achievements' ||
    entity === 'notices' ||
    entity === 'resources' ||
    entity === 'announcements' ||
    entity === 'roadmaps'
  )
    return 'content';

  // System / Settings / Roles
  if (
    entity === 'website_settings' ||
    entity === 'user_roles' ||
    entity === 'role_applications' ||
    action.includes('setting') ||
    action.includes('config') ||
    action.includes('backup') ||
    action.includes('maintenance') ||
    action.includes('assign_role') ||
    action.includes('role_change') ||
    action.includes('approve') ||
    action.includes('reject')
  )
    return 'system';

  return 'other';
}

/** Classify a log entry's severity */
export function classifySeverity(log) {
  const action = (log.action || '').toLowerCase();
  const statusInDetails = log.details?.status || '';

  if (
    action.includes('error') ||
    action.includes('crash') ||
    action.includes('critical') ||
    statusInDetails === 'error' ||
    statusInDetails === 'critical'
  )
    return 'error';

  if (
    action.includes('fail') ||
    action.includes('warn') ||
    action.includes('invalid') ||
    action.includes('conflict') ||
    action.includes('denied') ||
    action.includes('lock') ||
    action.includes('ban') ||
    action.includes('suspend') ||
    statusInDetails === 'warning' ||
    statusInDetails === 'failed'
  )
    return 'warning';

  return 'info';
}

/** Derive a human-readable module name from entity_type or action */
function deriveModule(log) {
  const entity = (log.entity_type || '').toLowerCase();
  const action = (log.action || '').toLowerCase();

  const MAP = {
    blog_posts: 'Blogs',
    events: 'Events',
    gallery_items: 'Gallery',
    achievements: 'Achievements',
    notices: 'Notices',
    resources: 'Resources',
    announcements: 'Announcements',
    roadmaps: 'Roadmaps',
    users: 'Users',
    user_roles: 'Roles',
    role_applications: 'Applications',
    website_settings: 'Settings',
  };
  if (MAP[entity]) return MAP[entity];
  if (action.includes('login') || action.includes('logout')) return 'Auth';
  if (action.includes('role') || action.includes('assign')) return 'Roles';
  if (action.includes('setting') || action.includes('config'))
    return 'Settings';
  return entity
    ? entity.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'System';
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export async function getSystemLogsData() {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();
  const weekStart = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [allLogsRes, todayCountRes, weekLogsRes] = await Promise.all([
    // All recent logs (last 500) with user join
    supabaseAdmin
      .from('activity_logs')
      .select(
        'id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at, users(id, full_name, email)'
      )
      .order('created_at', { ascending: false })
      .limit(500),

    // Count of today's logs
    supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),

    // Logs from the last 7 days for daily breakdown chart
    supabaseAdmin
      .from('activity_logs')
      .select('id, action, entity_type, created_at')
      .gte('created_at', weekStart)
      .order('created_at', { ascending: true }),
  ]);

  const allLogs = (allLogsRes.data || []).map((log) => ({
    ...log,
    category: classifyLog(log),
    severity: classifySeverity(log),
    module: deriveModule(log),
  }));

  // ── Stats ─────────────────────────────────────────────────────────────────
  const todayCount = todayCountRes.count || 0;
  const warningsCount = allLogs.filter((l) => l.severity === 'warning').length;
  const errorsCount = allLogs.filter((l) => l.severity === 'error').length;
  const failedCount = allLogs.filter((l) =>
    (l.action || '').toLowerCase().includes('fail')
  ).length;

  // ── Category breakdown ────────────────────────────────────────────────────
  const categoryBreakdown = {
    user_activity: 0,
    content: 0,
    security: 0,
    system: 0,
    other: 0,
  };
  allLogs.forEach((l) => {
    categoryBreakdown[l.category] = (categoryBreakdown[l.category] || 0) + 1;
  });

  // ── Module breakdown (top 8) ──────────────────────────────────────────────
  const moduleCounts = {};
  allLogs.forEach((l) => {
    moduleCounts[l.module] = (moduleCounts[l.module] || 0) + 1;
  });
  const topModules = Object.entries(moduleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // ── Action breakdown (top 10) ─────────────────────────────────────────────
  const actionCounts = {};
  allLogs.forEach((l) => {
    if (l.action) actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
  });
  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // ── Daily activity for last 7 days ─────────────────────────────────────────
  const dailyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const label = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const dayStart = d.toISOString();
    const dayEnd = new Date(d.getTime() + 86400000).toISOString();
    const count = (weekLogsRes.data || []).filter(
      (l) => l.created_at >= dayStart && l.created_at < dayEnd
    ).length;
    dailyActivity.push({ label, date: d.toISOString(), count });
  }

  // ── Unique IPs & Users ─────────────────────────────────────────────────────
  const uniqueIPs = new Set(
    allLogs.filter((l) => l.ip_address).map((l) => l.ip_address)
  ).size;
  const uniqueUsers = new Set(
    allLogs.filter((l) => l.user_id).map((l) => l.user_id)
  ).size;

  return {
    overview: {
      todayCount,
      totalLoaded: allLogs.length,
      warningsCount,
      errorsCount,
      failedCount,
      uniqueIPs,
      uniqueUsers,
    },
    allLogs,
    categoryBreakdown,
    topModules,
    topActions,
    dailyActivity,
    generatedAt: new Date().toISOString(),
  };
}
