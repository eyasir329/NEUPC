import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import ReportsClient from './_components/ReportsClient';

export const metadata = { title: 'Reports | Executive | NEUPC' };

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive') && !userRoles.includes('admin'))
    redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

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

  return (
    <>
      <RoleSync role="executive" />
      <ReportsClient stats={stats} recentEvents={recentEvents} />
    </>
  );
}
