/**
 * @file Mentor dashboard data-access — aggregates the mentor's real
 *   mentorships, sessions, tasks, submissions and resources into the
 *   shape the dashboard UI needs.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

/**
 * Fetch everything the mentor dashboard needs in one round of
 * parallel queries. All numbers are derived from live DB rows —
 * no placeholders.
 *
 * @param {string} mentorId - users.id of the authenticated mentor.
 */
export async function getMentorDashboardData(mentorId) {
  const [
    { data: mentorships },
    { data: sessions },
    { data: bootcampRows },
    { data: tasks },
    { data: pendingSubmissions },
    { data: resources },
  ] = await Promise.all([
    supabaseAdmin
      .from('mentorships')
      .select(
        'id, status, created_at, users!mentorships_mentee_id_fkey(id, full_name, avatar_url)'
      )
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('mentorship_sessions')
      .select(
        'id, topic, description, scheduled_at, session_date, duration, status, meet_link, location, target_type, target_student_ids, bootcamp_id, attendance_data, created_at'
      )
      .eq('created_by', mentorId)
      .order('scheduled_at', { ascending: true }),
    supabaseAdmin
      .from('bootcamp_mentors')
      .select('bootcamps(id, title, slug, status)')
      .eq('user_id', mentorId),
    supabaseAdmin
      .from('weekly_tasks')
      .select('id, title, deadline, start_time, created_at')
      .eq('assigned_by', mentorId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('task_submissions')
      .select(
        'id, status, submitted_at, users(id, full_name, avatar_url), weekly_tasks!inner(id, title, assigned_by)'
      )
      .eq('weekly_tasks.assigned_by', mentorId)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false }),
    supabaseAdmin
      .from('resources')
      .select('id, title, created_at')
      .eq('created_by', mentorId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const now = new Date();
  const allSessions = sessions ?? [];
  const scheduled = allSessions.filter((s) => s.status === 'scheduled');
  const completed = allSessions.filter((s) => s.status === 'completed');
  const bootcamps = (bootcampRows ?? []).map((r) => r.bootcamps).filter(Boolean);
  const activeMentorships = (mentorships ?? []).filter(
    (m) => m.status === 'active'
  );

  // Sessions scheduled for the rest of today
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const todaySessions = scheduled.filter((s) => {
    const t = new Date(s.scheduled_at || s.session_date);
    return t <= endOfDay;
  });

  const activeTasks = (tasks ?? []).filter(
    (t) => t.deadline && new Date(t.deadline) >= now
  );

  const stats = {
    activeMentees: activeMentorships.length,
    upcomingSessions: scheduled.length,
    completedSessions: completed.length,
    pendingReviews: (pendingSubmissions ?? []).length,
    activeTasks: activeTasks.length,
    bootcamps: bootcamps.length,
  };

  // Recent activity — merge real events from every domain, newest first
  const activity = [
    ...completed.map((s) => ({
      action: `Completed session “${s.topic || 'Untitled'}”`,
      at: s.scheduled_at || s.session_date || s.created_at,
      icon: 'CheckCircle',
      color: 'green',
    })),
    ...(tasks ?? []).slice(0, 5).map((t) => ({
      action: `Created task “${t.title}”`,
      at: t.created_at,
      icon: 'FileText',
      color: 'blue',
    })),
    ...(resources ?? []).map((r) => ({
      action: `Added resource “${r.title}”`,
      at: r.created_at,
      icon: 'BookOpen',
      color: 'purple',
    })),
    ...(pendingSubmissions ?? []).slice(0, 5).map((s) => ({
      action: `${s.users?.full_name || 'A member'} submitted “${s.weekly_tasks?.title || 'a task'}”`,
      at: s.submitted_at,
      icon: 'UserPlus',
      color: 'amber',
    })),
  ]
    .filter((a) => a.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);

  // Per-mentee overview from real mentorship + session data
  const menteeOverview = activeMentorships.slice(0, 6).map((m) => {
    const mentee = m.users;
    return {
      id: m.id,
      menteeId: mentee?.id,
      name: mentee?.full_name || 'Member',
      avatarUrl: mentee?.avatar_url || null,
      since: m.created_at,
      status: m.status,
    };
  });

  return {
    stats,
    todaySessions: todaySessions.slice(0, 5),
    upcomingSessions: scheduled.slice(0, 5),
    menteeOverview,
    recentActivity: activity,
    pendingSubmissions: (pendingSubmissions ?? []).slice(0, 5),
    bootcamps,
  };
}
