/**
 * @file misc data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all permissions.
export async function getAllPermissions() {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('category');
  if (error) throw new Error(error.message);
  return data;
}

// Get permissions filtered by category.
export async function getPermissionsByCategory(category) {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .eq('category', category);
  if (error) throw new Error(error.message);
  return data;
}

// Get top members by problems solved.
export async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase
    .from('member_statistics')
    .select(
      '*, member_profiles(user_id, student_id, users(full_name, avatar_url))'
    )
    .order('codeforces_rating', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Mark attendance for an event registration.
export async function markAttendance(eventId, userId, attended = true) {
  const { data, error } = await supabase
    .from('event_registrations')
    .update({ attended, status: attended ? 'attended' : 'confirmed' })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get public participation records (no sensitive fields like notes, created_by).
export async function getPublicParticipationRecords() {
  const { data, error } = await supabaseAdmin
    .from('participation_records')
    .select(
      `id, contest_name, contest_url, category, year, participation_date,
       result, is_team, team_name, team_members, photos, featured_photo,
       user_id, users!participation_records_user_id_fkey(id, full_name, avatar_url),
       achievement_id, achievements(id, title, result)`
    )
    .order('year', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get feature requests (for Feature Requests tab).
 */
export async function getFeatureRequests({
  status = null,
  sortBy = 'views',
  limit = 50,
  offset = 0,
} = {}) {
  let query = supabase
    .from('discussion_threads')
    .select(
      `
      *,
      author:users!discussion_threads_author_id_fkey(id, full_name, avatar_url),
      assigned:users!discussion_threads_assigned_to_fkey(id, full_name, avatar_url)
    `,
      { count: 'exact' }
    )
    .eq('type', 'feature_request');

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  query = query
    .order(sortBy, { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { data, count };
}

/**
 * Get staff members who can be assigned to discussions.
 */
export async function getAssignableStaff() {
  const { data, error } = await supabase
    .from('user_roles')
    .select(
      `
      user_id,
      role:roles(name),
      user:users(id, full_name, avatar_url)
    `
    )
    .in('role_id', [2, 3, 4, 5]); // admin, mentor, advisor, executive role IDs

  if (error) throw new Error(error.message);

  // Flatten and dedupe by user_id
  const staffMap = new Map();
  data?.forEach((item) => {
    if (item.user && !staffMap.has(item.user_id)) {
      staffMap.set(item.user_id, {
        id: item.user.id,
        full_name: item.user.full_name,
        avatar_url: item.user.avatar_url,
        role: item.role?.name,
      });
    }
  });

  return Array.from(staffMap.values());
}

// Get all bootcamps.
export async function getAllBootcamps() {
  const { data, error } = await supabase
    .from('bootcamps')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Get committee positions by category.
export async function getPositionsByCategory(category) {
  const { data, error } = await supabaseAdmin
    .from('committee_positions')
    .select('*')
    .eq('category', category)
    .order('display_order');
  if (error) throw new Error(error.message);
  return data;
}

// Get pending guest account applications (new sign-ups awaiting admin review).
// Returns users with account_status = 'pending' (no member profile = pure guest applicants).
// Also includes 'rejected' users who wrote their own appeal message.
export async function getPendingGuestApplications() {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select(
      'id, email, full_name, avatar_url, account_status, status_reason, status_changed_by, status_changed_at, last_login, created_at'
    )
    .in('account_status', ['pending', 'rejected'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!users || users.length === 0) return [];

  const userIds = users.map((u) => u.id);

  // Exclude users who already have a member_profiles (they belong to Membership section)
  const { data: profiles = [] } = await supabaseAdmin
    .from('member_profiles')
    .select('user_id')
    .in('user_id', userIds);

  const profiledIds = new Set((profiles ?? []).map((p) => p.user_id));

  return users
    .filter((u) => {
      if (profiledIds.has(u.id)) return false;
      // Include all pending users
      if (u.account_status === 'pending') return true;
      // Include rejected users only if they wrote their own appeal
      if (u.account_status === 'rejected' && u.status_changed_by === u.id)
        return true;
      return false;
    })
    .map((u) => {
      const initials =
        u.full_name
          ?.split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() ?? '?';

      return {
        id: u.id,
        name: u.full_name,
        email: u.email,
        avatar:
          u.avatar_url?.startsWith('http') || u.avatar_url?.startsWith('/')
            ? u.avatar_url
            : u.avatar_url && u.avatar_url.length > 5
              ? `/api/image/${u.avatar_url}`
              : initials,
        joinedAt: u.created_at,
        lastLogin: u.last_login,
        statusReason: u.status_reason,
        statusChangedBy: u.status_changed_by,
        accountStatus: u.account_status,
      };
    });
}

export async function getPlatformStatistics() {
  try {
    const [userCount, memberCount, eventCount, contestCount] =
      await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase
          .from('member_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('approved', true),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .in('status', ['upcoming', 'ongoing', 'completed']),
        supabase.from('contests').select('*', { count: 'exact', head: true }),
      ]);

    return {
      totalUsers: userCount.count || 0,
      approvedMembers: memberCount.count || 0,
      totalEvents: eventCount.count || 0,
      totalContests: contestCount.count || 0,
    };
  } catch (error) {
    console.error('Error fetching platform statistics:', error);
    return {
      totalUsers: 0,
      approvedMembers: 0,
      totalEvents: 0,
      totalContests: 0,
    };
  }
}

export async function getDashboardMetrics() {
  try {
    const [
      newMemberCount,
      pendingJoinRequests,
      upcomingEventCount,
      unreadContacts,
    ] = await Promise.all([
      supabase
        .from('member_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approved', false),
      supabase
        .from('join_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'upcoming')
        .gte('start_date', new Date().toISOString()),
      supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new'),
    ]);

    return {
      pendingMemberApprovals: newMemberCount.count || 0,
      pendingJoinRequests: pendingJoinRequests.count || 0,
      upcomingEvents: upcomingEventCount.count || 0,
      unreadContacts: unreadContacts.count || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      pendingMemberApprovals: 0,
      pendingJoinRequests: 0,
      upcomingEvents: 0,
      unreadContacts: 0,
    };
  }
}

export async function bulkUpdateSubmissionStatus(taskId, ids, newStatus) {
  const { error } = await supabase
    .from('task_submissions')
    .update({ status: newStatus })
    .eq('task_id', taskId)
    .in('id', ids);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getPublicJourneyItems() {
  const { data, error } = await supabaseAdmin
    .from('journey_items')
    .select('id, year, event, icon, description, display_order')
    .order('display_order', { ascending: true })
    .order('year', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
