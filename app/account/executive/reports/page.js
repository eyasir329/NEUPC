/**
 * @file Executive reports dashboard — aggregates user, event, contest,
 *   registration, and blog statistics from the database into a unified
 *   overview with recent-event highlights for the executive committee.
 * @module ExecutiveReportsPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { supabaseAdmin } from '@/app/_lib/supabase';
import ReportsClient from './_components/ReportsClient';

export const metadata = { title: 'Reports | Executive | NEUPC' };

export default async function ReportsPage() {
  await requireRole(['executive', 'admin']);

  const [usersRes, eventsRes, contestsRes, registrationsRes, blogsRes] =
    await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id, account_status, created_at', { count: 'exact' }),
      supabaseAdmin
        .from('events')
        .select('id, status, category, created_at', { count: 'exact' }),
      supabaseAdmin
        .from('contests')
        .select('id, status, platform, created_at', { count: 'exact' }),
      supabaseAdmin
        .from('event_registrations')
        .select('id, status, attended, registered_at', { count: 'exact' }),
      supabaseAdmin
        .from('blog_posts')
        .select('id, status, views, created_at', { count: 'exact' }),
    ]);

  const stats = {
    totalUsers: usersRes.count ?? 0,
    activeUsers: (usersRes.data || []).filter(
      (u) => u.account_status === 'active'
    ).length,
    totalEvents: eventsRes.count ?? 0,
    publishedEvents: (eventsRes.data || []).filter((e) => e.status !== 'draft')
      .length,
    completedEvents: (eventsRes.data || []).filter(
      (e) => e.status === 'completed'
    ).length,
    totalContests: contestsRes.count ?? 0,
    totalRegistrations: registrationsRes.count ?? 0,
    attendedRegistrations: (registrationsRes.data || []).filter(
      (r) => r.attended
    ).length,
    totalBlogs: blogsRes.count ?? 0,
    publishedBlogs: (blogsRes.data || []).filter(
      (b) => b.status === 'published'
    ).length,
  };

  const recentEvents = (eventsRes.data || [])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  return <ReportsClient stats={stats} recentEvents={recentEvents} />;
}
