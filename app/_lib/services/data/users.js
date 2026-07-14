/**
 * @file users data-access — split from the data-service module.
 */

import {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
} from '@/app/_lib/integrations/supabase';
import { _log } from './_internal';
import { key, mget, msetWithTtl, TTL } from './_cache';
import { dbWrite } from '@/app/_lib/db/router';

/**
 * Batch-resolve minimal display data for many user ids at once, cached.
 *
 * Because `users` is referenced everywhere, any list (blog authors, discussion
 * participants, event organizers…) needs `{name, avatar, username}` per id.
 * This resolves them in one round-trip and caches each by id, so repeated
 * lookups across requests are near-free (see 04-caching.md, the resolve-user
 * cache). Cache is optional — falls back to a single DB query when Redis is off.
 *
 * @param {string[]} ids  user ids (duplicates and falsy values are ignored)
 * @returns {Promise<Record<string, {id:string, name:string, avatar:string, username:string|null}>>}
 *   map keyed by user id (missing users are simply absent)
 */
export async function resolveUsers(ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (unique.length === 0) return {};

  const cacheKeys = unique.map((id) => key('identity', 'user', id));
  const cachedRows = await mget(cacheKeys);

  const result = {};
  const missing = [];
  unique.forEach((id, i) => {
    const row = cachedRows[i];
    if (row) result[id] = row;
    else missing.push(id);
  });

  if (missing.length > 0) {
    // `username` lives on member_profiles, not users. users has TWO fk
    // relationships to member_profiles (user_id and approved_by), so the
    // embed must be disambiguated by constraint name. It's a one-to-one
    // embed (object or null), not an array.
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(
        'id, full_name, avatar_url, member_profiles!member_profiles_user_id_fkey(username)'
      )
      .in('id', missing);

    if (error) {
      _log('resolveUsers', error);
    } else {
      const toCache = [];
      for (const u of data || []) {
        const shaped = {
          id: u.id,
          name: u.full_name,
          avatar: u.avatar_url,
          username: u.member_profiles?.username ?? null,
        };
        result[u.id] = shaped;
        toCache.push([key('identity', 'user', u.id), shaped]);
      }
      // Long TTL — invalidated explicitly on profile update.
      await msetWithTtl(toCache, TTL.long);
    }
  }

  return result;
}

// Get user by email.
export async function getUserByEmail(email) {
  // Add AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('getUserByEmail timed out for:', email);
      throw new Error('Database query timed out');
    }
    throw error;
  }
}

// Compatibility alias for older routes.
export async function getCachedUserByEmail(email) {
  return getUserByEmail(email);
}

// Get user by ID with role info.
export async function getUserById(id) {
  if (!isSupabaseConfigured) {
    return {
      id,
      name: 'Mock User',
      email: 'mock@example.com',
      role: 'Guest',
      status: 'active',
    };
  }

  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id, email, full_name, avatar_url,
      account_status, status_reason, last_login, created_at,
      user_roles!user_roles_user_id_fkey!left(roles!left(name))
    `
    )
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  const roleName = data.user_roles?.[0]?.roles?.name;

  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    avatar: data.avatar_url,
    status: data.account_status || 'active',
    statusReason: data.status_reason,
    role: roleName
      ? roleName.charAt(0).toUpperCase() + roleName.slice(1)
      : 'Guest',
  };
}

// Insert a new user.
export async function createUser(userData) {
  const { data, error } = await dbWrite({
    table: 'users',
    op: 'insert',
    mutate: (client) =>
      client
        .from('users')
        .insert([
          {
            ...userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single(),
  });
  if (error) throw new Error(error.message);
  return data;
}

// Hard-delete a user.
export async function deleteUser(id) {
  const { error } = await dbWrite({
    table: 'users',
    op: 'delete',
    mutate: (client) => client.from('users').delete().eq('id', id),
    pk: { id },
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

// Update user fields.
export async function updateUser(id, updates) {
  const { data, error } = await dbWrite({
    table: 'users',
    op: 'update',
    mutate: (client) =>
      client
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single(),
    cacheKeys: [key('identity', 'user', id)],
  });
  if (error) throw new Error(error.message);
  return data;
}

// Get approved club members for selectors (achievements/participation
// member pickers) — sourced from member_profiles so unapproved applicants
// and non-member accounts never show up as linkable "members".
export async function getUsersForSelector() {
  const { data, error } = await supabaseAdmin
    .from('member_profiles')
    .select(
      'user_id, student_id, academic_session, department, users!member_profiles_user_id_fkey(id, full_name, avatar_url)'
    )
    .eq('approved', true);
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((m) => m.users)
    .map((m) => ({
      id: m.users.id,
      full_name: m.users.full_name,
      avatar_url: m.users.avatar_url,
      student_id: m.student_id,
      department: m.department,
      academic_session: m.academic_session,
    }))
    .sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''));
}

// Get all users with role/status info.
export async function getAllUsers() {
  if (!isSupabaseConfigured) {
    return [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@neupc.org',
        avatar: null,
        status: 'Active',
        joined: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isOnline: false,
        role: 'Admin',
        roles: ['admin'],
        isApproved: true,
      },
    ];
  }

  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(
        'id, email, full_name, avatar_url, is_online, last_seen, phone, phone_verified, email_verified, status_changed_by, account_status, status_reason, status_changed_at, last_login, created_at'
      )
      .order('created_at', { ascending: false });

    if (usersError) return [];
    if (!users || users.length === 0) return [];

    const userIds = users.map((u) => u.id);

    const { data: userRoles = [] } = await supabase
      .from('user_roles')
      .select('user_id, assigned_at, roles(name, priority)')
      .in('user_id', userIds);

    const { data: memberProfiles = [] } = await supabase
      .from('member_profiles')
      .select(
        'user_id, approved, student_id, academic_session, department, created_at'
      )
      .in('user_id', userIds);

    const rolesMap = {};
    const profilesMap = {};

    if (userRoles && userRoles.length > 0) {
      userRoles.forEach((role) => {
        if (!rolesMap[role.user_id]) {
          rolesMap[role.user_id] = [];
        }
        rolesMap[role.user_id].push(role);
      });
    }

    if (memberProfiles && memberProfiles.length > 0) {
      memberProfiles.forEach((profile) => {
        profilesMap[profile.user_id] = profile;
      });
    }

    const statusMap = {
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      suspended: 'Suspended',
      banned: 'Banned',
      blocked: 'Blocked',
      locked: 'Locked',
      rejected: 'Rejected',
    };

    return users.map((u) => {
      const userRoleRows = rolesMap[u.id] ?? [];
      const roleRows = userRoleRows
        .filter((r) => r.roles?.name)
        .sort((a, b) => (b.roles?.priority ?? 0) - (a.roles?.priority ?? 0));

      const roles = roleRows.map((r) => r.roles.name);
      const primaryRole = roles[0] ?? null;

      const profile = profilesMap[u.id];

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
        status: statusMap[u.account_status?.toLowerCase()] ?? 'Pending',
        statusReason: u.status_reason,
        statusChangedBy: u.status_changed_by,
        statusChangedAt: u.status_changed_at,
        joined: u.created_at,
        lastActive: u.last_seen ?? u.last_login,
        isOnline: u.last_seen
          ? Date.now() - new Date(u.last_seen).getTime() < 90_000
          : false,
        role: primaryRole
          ? primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1)
          : 'Unassigned',
        roles,
        studentId: profile?.student_id ?? null,
        appliedAt: profile?.created_at ?? null,
        hasProfile: !!profile,
        isApproved: profile?.approved ?? null,
        session: profile?.academic_session ?? null,
        department: profile?.department ?? null,
      };
    });
  } catch (err) {
    console.error('getAllUsers exception:', err);
    return [];
  }
}

// Get aggregate user statistics.
export async function getUserStats() {
  if (!isSupabaseConfigured) {
    return {
      total: 1,
      active: 1,
      inactive: 0,
      pending: 0,
      suspended: 0,
      banned: 0,
      blocked: 0,
      locked: 0,
      rejected: 0,
    };
  }

  try {
    const [
      total,
      active,
      inactive,
      pending,
      suspended,
      banned,
      blocked,
      locked,
      rejected,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'active'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'inActive'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'pending'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'suspended'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'banned'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'blocked'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'locked'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'rejected'),
    ]);

    return {
      total: total.count || 0,
      active: active.count || 0,
      inactive: inactive.count || 0,
      pending: pending.count || 0,
      suspended: suspended.count || 0,
      banned: banned.count || 0,
      blocked: blocked.count || 0,
      locked: locked.count || 0,
      rejected: rejected.count || 0,
    };
  } catch {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      suspended: 0,
      banned: 0,
      blocked: 0,
      locked: 0,
      rejected: 0,
    };
  }
}

// Update account status with reason.
export async function updateUserAccountStatus(id, status, reason, changedBy) {
  const { data, error } = await dbWrite({
    table: 'users',
    op: 'update',
    mutate: (client) =>
      client
        .from('users')
        .update({
          account_status: status,
          status_reason: reason,
          status_changed_by: changedBy,
          status_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single(),
  });
  if (error) throw new Error(error.message);
  return data;
}

// Suspend a user account.
export async function suspendUser(userId, adminId, reason, expiresAt = null) {
  const { error } = await dbWrite({
    table: 'users',
    op: 'update',
    mutate: (client) =>
      client
        .from('users')
        .update({
          account_status: 'suspended',
          status_reason: reason,
          status_changed_by: adminId,
          status_changed_at: new Date().toISOString(),
          suspension_expires_at: expiresAt,
          is_online: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single(),
  });
  if (error) throw new Error(error.message);
  await _log(adminId, 'suspend_user', 'user', userId, { reason, expiresAt });
  return { success: true };
}

// Activate/reactivate a user account.
export async function activateUser(
  userId,
  adminId,
  reason = 'Account activated'
) {
  const { error } = await dbWrite({
    table: 'users',
    op: 'update',
    mutate: (client) =>
      client
        .from('users')
        .update({
          account_status: 'active',
          status_reason: reason,
          status_changed_by: adminId,
          status_changed_at: new Date().toISOString(),
          suspension_expires_at: null,
          is_online: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single(),
  });
  if (error) throw new Error(error.message);
  await _log(adminId, 'activate_user', 'user', userId, { reason });
  return { success: true };
}

// Permanently ban a user.
export async function banUser(userId, adminId, reason) {
  const { error } = await dbWrite({
    table: 'users',
    op: 'update',
    mutate: (client) =>
      client
        .from('users')
        .update({
          account_status: 'banned',
          status_reason: reason,
          status_changed_by: adminId,
          status_changed_at: new Date().toISOString(),
          is_online: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single(),
  });
  if (error) throw new Error(error.message);
  await _log(adminId, 'ban_user', 'user', userId, { reason });
  return { success: true };
}

// Create a new admin user with role-specific profile.
export async function createAdminUser(
  fullName,
  email,
  role,
  adminId,
  profileData = {}
) {
  if (role === 'member') {
    if (
      !String(profileData.student_id || '').trim() ||
      !String(profileData.academic_session || '').trim() ||
      !String(profileData.department || '').trim()
    ) {
      throw new Error(
        'Member profile requires student_id, academic_session, and department.'
      );
    }
  }

  if (role === 'advisor') {
    if (
      !String(profileData.position || '').trim() ||
      !String(profileData.profile_link || '').trim() ||
      !String(profileData.department || '').trim()
    ) {
      throw new Error(
        'Advisor profile requires position, profile_link, and department.'
      );
    }
  }

  if (role === 'executive') {
    if (
      !String(profileData.position_id || '').trim() ||
      !String(profileData.term_start || '').trim() ||
      !String(profileData.term_end || '').trim()
    ) {
      throw new Error(
        'Executive profile requires position_id, term_start, and term_end.'
      );
    }
  }

  const { data: newUser, error: userError } = await dbWrite({
    table: 'users',
    op: 'insert',
    mutate: (client) =>
      client
        .from('users')
        .insert({
          full_name: fullName,
          email,
          account_status: 'inActive',
          status_reason: 'need to verify their email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single(),
  });

  if (userError) throw new Error(`Failed to create user: ${userError.message}`);

  const { data: roleData, error: roleError } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', role)
    .single();

  if (roleError || !roleData) throw new Error(`Invalid role: ${role}`);

  const { error: assignError } = await dbWrite({
    table: 'user_roles',
    op: 'insert',
    mutate: (client) =>
      client
        .from('user_roles')
        .insert({ user_id: newUser.id, role_id: roleData.id, assigned_by: adminId })
        .select()
        .single(),
  });

  if (assignError)
    throw new Error(`Failed to assign role: ${assignError.message}`);

  // Create role-specific profile
  const userId = newUser.id;
  try {
    if (role === 'member') {
      await dbWrite({
        table: 'member_profiles',
        op: 'insert',
        mutate: (client) =>
          client
            .from('member_profiles')
            .insert({
              user_id: userId,
              student_id: profileData.student_id || '',
              academic_session: profileData.academic_session || '',
              department: profileData.department || '',
              approved: false,
            })
            .select()
            .single(),
      });
    } else if (role === 'advisor') {
      await dbWrite({
        table: 'advisor_profiles',
        op: 'insert',
        mutate: (client) =>
          client
            .from('advisor_profiles')
            .insert({
              user_id: userId,
              position: profileData.position || '',
              profile_link: profileData.profile_link || '',
              department: profileData.department || '',
            })
            .select()
            .single(),
      });
    } else if (role === 'admin') {
      await dbWrite({
        table: 'admin_profiles',
        op: 'insert',
        mutate: (client) =>
          client
            .from('admin_profiles')
            .insert({ user_id: userId, bio: profileData.bio || '' })
            .select()
            .single(),
      });
    } else if (role === 'mentor') {
      await dbWrite({
        table: 'mentor_profiles',
        op: 'insert',
        mutate: (client) =>
          client
            .from('mentor_profiles')
            .insert({ user_id: userId, bio: profileData.bio || '' })
            .select()
            .single(),
      });
    } else if (role === 'executive') {
      await dbWrite({
        table: 'committee_members',
        op: 'insert',
        mutate: (client) =>
          client
            .from('committee_members')
            .insert({
              user_id: userId,
              position_id: profileData.position_id || null,
              term_start: profileData.term_start || null,
              term_end: profileData.term_end || null,
              is_current: profileData.is_current ?? true,
              bio: profileData.bio || '',
            })
            .select()
            .single(),
      });
    }
  } catch (profileErr) {
    console.error(`Failed to create ${role} profile:`, profileErr);
  }

  await _log(adminId, 'create_user', 'user', userId, { email, role });
  return { success: true, userId };
}

// Update an admin user.
export async function updateAdminUser(userId, updates, adminId) {
  const { fullName, role } = updates;

  if (fullName) {
    const { error } = await dbWrite({
      table: 'users',
      op: 'update',
      mutate: (client) =>
        client
          .from('users')
          .update({ full_name: fullName, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single(),
    });
    if (error) throw new Error(`Failed to update name: ${error.message}`);
  }

  if (role) {
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (roleError || !roleData) throw new Error(`Invalid role: ${role}`);

    await dbWrite({
      table: 'user_roles',
      op: 'delete',
      mutate: (client) => client.from('user_roles').delete().eq('user_id', userId),
      pk: { user_id: userId },
    });

    const { error: assignError } = await dbWrite({
      table: 'user_roles',
      op: 'insert',
      mutate: (client) =>
        client
          .from('user_roles')
          .insert({ user_id: userId, role_id: roleData.id, assigned_by: adminId })
          .select()
          .single(),
    });

    if (assignError)
      throw new Error(`Failed to update role: ${assignError.message}`);
  }

  await _log(adminId, 'update_user', 'user', userId, updates);
  return { success: true };
}

// Get role names for a user by email.
export async function getUserRoles(email) {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase not configured — returning empty roles');
    return [];
  }

  // Add AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
      .abortSignal(controller.signal);

    if (userError || !userData) {
      clearTimeout(timeoutId);
      console.warn('⚠️ User not found for email:', email);
      return [];
    }

    const userId = userData.id;

    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('id, role_id, roles(name, id, priority)')
      .eq('user_id', userId)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError.message);
      return [];
    }

    if (!rolesData || rolesData.length === 0) {
      console.warn('⚠️ No roles found for user:', userId);
      return [];
    }

    const roleNames =
      rolesData
        ?.filter((r) => r.roles?.name)
        .sort((a, b) => (b.roles?.priority ?? 0) - (a.roles?.priority ?? 0))
        .map((r) => r.roles?.name) || [];

    return roleNames.length > 0 ? roleNames : [];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('getUserRoles timed out for:', email);
      return [];
    }
    console.error('❌ Exception in getUserRoles:', error);
    return [];
  }
}

// Get users with basic role/status fields.
export async function getUsersBasic() {
  const { data: users, error: uErr } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, avatar_url, account_status')
    .order('full_name');
  if (uErr) throw new Error(uErr.message);
  if (!users?.length) return [];

  const userIds = users.map((u) => u.id);

  const { data: userRoles = [] } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, roles(id, name, priority)')
    .in('user_id', userIds);

  const rolesMap = {};
  for (const ur of userRoles) {
    if (!rolesMap[ur.user_id]) rolesMap[ur.user_id] = [];
    if (ur.roles) rolesMap[ur.user_id].push(ur.roles);
  }

  return users.map((u) => {
    const uroles = (rolesMap[u.id] ?? []).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
    const primary = uroles[0];
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
      avatar: u.avatar_url?.startsWith('http') ? u.avatar_url : initials,
      status: u.account_status ?? 'pending',

      currentRoleId: primary?.id ?? null,
      currentRoleName: primary?.name ?? null,

      roleIds: uroles.map((r) => r.id),
      roleNames: uroles.map((r) => r.name),
    };
  });
}

// Get all roles.
export async function getAllRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('priority', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get a role by name.
export async function getRoleByName(name) {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('name', name)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get guest & member roles (id + name) for eligibility selectors.
export async function getEligibilityRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name')
    .in('name', ['guest', 'member'])
    .order('priority', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

// Get roles with user counts.
export async function getRolesWithStats() {
  const [rolesRes, permissionsRes, userRolesRes, rolePermissionsRes] =
    await Promise.all([
      supabase
        .from('roles')
        .select('*')
        .order('priority', { ascending: false }),
      supabase.from('permissions').select('*').order('category'),
      supabase.from('user_roles').select('role_id'),
      supabase
        .from('role_permissions')
        .select(
          'role_id, permission_id, permissions(id, name, category, description)'
        ),
    ]);

  if (rolesRes.error) throw new Error(rolesRes.error.message);

  const roles = rolesRes.data || [];
  const allPermissions = permissionsRes.data || [];
  const userRoles = userRolesRes.data || [];
  const rolePermissions = rolePermissionsRes.data || [];

  const userCountByRole = userRoles.reduce((acc, ur) => {
    acc[ur.role_id] = (acc[ur.role_id] || 0) + 1;
    return acc;
  }, {});

  const permsByRole = rolePermissions.reduce((acc, rp) => {
    if (!acc[rp.role_id]) acc[rp.role_id] = [];
    if (rp.permissions) acc[rp.role_id].push(rp.permissions);
    return acc;
  }, {});

  return {
    roles: roles.map((r) => ({
      ...r,
      userCount: userCountByRole[r.id] || 0,
      permissions: permsByRole[r.id] || [],
    })),
    allPermissions,
  };
}

// Get permissions assigned to a role.
export async function getRolePermissions(roleId) {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*, permissions(*)')
    .eq('role_id', roleId);
  if (error) throw new Error(error.message);
  return data;
}

// Assign a permission to a role.
export async function assignPermissionToRole(roleId, permissionId) {
  const { data, error } = await dbWrite({
    table: 'role_permissions',
    op: 'insert',
    mutate: (client) =>
      client
        .from('role_permissions')
        .insert([{ role_id: roleId, permission_id: permissionId }])
        .select()
        .single(),
  });
  if (error) throw new Error(error.message);
  return data;
}

// Remove a permission from a role.
export async function removePermissionFromRole(roleId, permissionId) {
  const { error } = await dbWrite({
    table: 'role_permissions',
    op: 'delete',
    mutate: (client) =>
      client
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId),
    pk: { role_id: roleId, permission_id: permissionId },
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

// Assign a role to a user.
export async function assignRoleToUser(userId, roleId, assignedBy) {
  const { data, error } = await dbWrite({
    table: 'user_roles',
    op: 'insert',
    mutate: (client) =>
      client
        .from('user_roles')
        .insert([{ user_id: userId, role_id: roleId, assigned_by: assignedBy }])
        .select()
        .single(),
  });
  if (error) throw new Error(error.message);
  return data;
}

// Remove a role from a user.
export async function removeRoleFromUser(userId, roleId) {
  const { error } = await dbWrite({
    table: 'user_roles',
    op: 'delete',
    mutate: (client) =>
      client.from('user_roles').delete().eq('user_id', userId).eq('role_id', roleId),
    pk: { user_id: userId, role_id: roleId },
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

// Replace a user's current role.
export async function updateUserRole(
  userId,
  roleId,
  assignedBy,
  expiresAt = null
) {
  const { data, error } = await dbWrite({
    table: 'user_roles',
    op: 'update',
    mutate: (client) =>
      client
        .from('user_roles')
        .update({ role_id: roleId, assigned_by: assignedBy, expires_at: expiresAt })
        .eq('user_id', userId)
        .select()
        .single(),
  });
  if (error) throw new Error(error.message);
  return data;
}

// Get all participation records with admin details.
export async function getParticipationRecordsAdmin() {
  const { data, error } = await supabaseAdmin
    .from('participation_records')
    .select(
      `id, contest_name, contest_url, category, year, participation_date,
       result, is_team, team_name, team_members, photos, featured_photo, notes, created_at,
       user_id, users!participation_records_user_id_fkey(id, full_name, avatar_url),
       achievement_id, achievements(id, title, result)`
    )
    .order('year', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Get a user's platform handles (V1 schema: platform + handle columns).
export async function getUserHandlesBasic(userId) {
  const { data, error } = await supabaseAdmin
    .from('user_handles')
    .select('platform, handle')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get user's bootcamp enrollments for LMS context dropdown.
 */
export async function getUserBootcampEnrollments(userId) {
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select('bootcamp:bootcamps(id, title, slug, status)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) throw new Error(error.message);
  return (
    data?.map((e) => e.bootcamp)
      .filter((b) => b && b.status === 'published') || []
  );
}

export async function searchUsers(query) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, account_status, created_at')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);
  if (error) throw new Error(error.message);
  return data;
}

export async function getUserActivityLogs(userId, limit = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// =============================================================================
// PUBLIC PROFILE LOOKUP
// =============================================================================

/**
 * Fetch an approved member profile by username for the public `/user/[username]` route.
 * Joins member_profiles → users, then fetches handles and platform stats.
 */
export async function getMemberByUsername(username) {
  if (!username) return null;

  const { data: profile, error } = await supabaseAdmin
    .from('member_profiles')
    .select(
      `*, user:users!member_profiles_user_id_fkey(id, full_name, avatar_url, created_at)`
    )
    .eq('username', username)
    .eq('approved', true)
    .maybeSingle();

  if (error || !profile || !profile.user) return null;

  // Fetch competitive handles
  const { data: handles } = await supabaseAdmin
    .from('user_handles')
    .select(
      'handle, platform_id, current_rating, max_rating, rank_title, platform:platform_id(code, name)'
    )
    .eq('user_id', profile.user.id);

  // Fetch platform stats (solved counts, etc.)
  const { data: platformStats } = await supabaseAdmin
    .from('user_platform_stats')
    .select(
      'platform_id, problems_solved, current_rating, max_rating, rank_title, total_submissions, contest_count, platform:platform_id(code, name)'
    )
    .eq('user_id', profile.user.id);

  // Fetch user stats (total solved, streaks, etc.)
  const { data: userStats } = await supabaseAdmin
    .from('user_stats')
    .select('total_solved, current_streak, longest_streak, last_solve_date')
    .eq('user_id', profile.user.id)
    .maybeSingle();

  return {
    ...profile,
    handles: handles ?? [],
    platformStats: platformStats ?? [],
    userStats: userStats ?? null,
  };
}

// =============================================================================
// JOURNEY ITEMS
// =============================================================================
export async function getJourneyItemsAdmin() {
  const { data, error } = await supabaseAdmin
    .from('journey_items')
    .select('*')
    .order('display_order', { ascending: true })
    .order('year', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
