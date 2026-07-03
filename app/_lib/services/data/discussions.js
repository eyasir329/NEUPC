/**
 * @file discussions data-access — split from the data-service module.
 */

// Discussion tables have RLS enabled but no policies, and these functions run
// server-side behind auth guards (requireRole / requireActionSession), so they
// use the service-role client to perform reads and writes.
import { supabaseAdmin as supabase } from '@/app/_lib/integrations/supabase';

// Get all discussion categories.
export async function getDiscussionCategories() {
  const { data, error } = await supabase
    .from('discussion_categories')
    .select('*')
    .order('display_order');
  if (error) throw new Error(error.message);
  return data;
}

// Create a discussion category.
export async function createDiscussionCategory(categoryData) {
  const { data, error } = await supabase
    .from('discussion_categories')
    .insert([categoryData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a discussion category.
export async function updateDiscussionCategory(id, updates) {
  const { data, error } = await supabase
    .from('discussion_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a discussion category.
export async function deleteDiscussionCategory(id) {
  const { error } = await supabase
    .from('discussion_categories')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get all discussion threads (paginated).
export async function getAllDiscussionThreads(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .select(
      `
      *,
      users!discussion_threads_author_id_fkey(id, full_name, avatar_url),
      discussion_categories(name, icon)
    `
    )
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data;
}

// Get discussion threads by category.
export async function getDiscussionThreadsByCategory(categoryId, limit = 20) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .select(
      '*, users!discussion_threads_author_id_fkey(id, full_name, avatar_url)'
    )
    .eq('category_id', categoryId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Get a discussion thread by ID.
export async function getDiscussionThreadById(id) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .select(
      `
      *,
      users!discussion_threads_author_id_fkey(id, full_name, avatar_url),
      discussion_categories(name, icon)
    `
    )
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Create a discussion thread.
export async function createDiscussionThread(threadData) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .insert([threadData])
    .select(
      '*, users!discussion_threads_author_id_fkey(id, full_name, avatar_url)'
    )
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a discussion thread.
export async function updateDiscussionThread(id, authorId, updates) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('author_id', authorId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Pin or unpin a thread.
export async function pinDiscussionThread(id, pinned = true) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .update({ is_pinned: pinned, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Lock or unlock a thread.
export async function lockDiscussionThread(id, locked = true) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .update({ is_locked: locked, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Mark a thread as solved.
export async function markThreadSolved(id, solved = true) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .update({ is_solved: solved, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Increment view count for a thread.
export async function incrementThreadViews(id) {
  const { data: thread } = await supabase
    .from('discussion_threads')
    .select('views')
    .eq('id', id)
    .single();
  if (thread) {
    await supabase
      .from('discussion_threads')
      .update({ views: (thread.views || 0) + 1 })
      .eq('id', id);
  }
  return { success: true };
}

// Delete a discussion thread.
export async function deleteDiscussionThread(id) {
  const { error } = await supabase
    .from('discussion_threads')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get replies for a thread.
export async function getThreadReplies(threadId) {
  const { data, error } = await supabase
    .from('discussion_replies')
    .select(
      '*, users!discussion_replies_author_id_fkey(id, full_name, avatar_url)'
    )
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Create a reply to a thread.
export async function createDiscussionReply(replyData) {
  const { data, error } = await supabase
    .from('discussion_replies')
    .insert([replyData])
    .select(
      '*, users!discussion_replies_author_id_fkey(id, full_name, avatar_url)'
    )
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from('discussion_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', replyData.thread_id);

  return data;
}

// Update a discussion reply.
export async function updateDiscussionReply(id, authorId, content) {
  const { data, error } = await supabase
    .from('discussion_replies')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('author_id', authorId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Mark or unmark a reply as solution.
export async function markReplyAsSolution(id, isSolution = true) {
  const { data, error } = await supabase
    .from('discussion_replies')
    .update({ is_solution: isSolution })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a discussion reply.
export async function deleteDiscussionReply(id) {
  const { error } = await supabase
    .from('discussion_replies')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Vote on a discussion thread.
export async function voteOnThread(userId, threadId, voteType) {
  const { data, error } = await supabase
    .from('discussion_votes')
    .upsert(
      {
        user_id: userId,
        thread_id: threadId,
        vote_type: voteType,
        reply_id: null,
      },
      { onConflict: 'user_id,thread_id' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Vote on a discussion reply.
export async function voteOnReply(userId, replyId, voteType) {
  const { data, error } = await supabase
    .from('discussion_votes')
    .upsert(
      {
        user_id: userId,
        reply_id: replyId,
        vote_type: voteType,
        thread_id: null,
      },
      { onConflict: 'user_id,reply_id' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Remove a vote from a thread or reply.
export async function removeVote(userId, threadId = null, replyId = null) {
  let query = supabase.from('discussion_votes').delete().eq('user_id', userId);
  if (threadId) query = query.eq('thread_id', threadId);
  if (replyId) query = query.eq('reply_id', replyId);
  const { error } = await query;
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get all votes cast by a user.
export async function getUserVotes(userId) {
  const { data, error } = await supabase
    .from('discussion_votes')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data;
}

// =============================================================================
// HELP DESK / DISCUSSION SYSTEM (Enhanced)
// =============================================================================

/**
 * Get discussions with advanced filtering, sorting, and pagination.
 * This is the main query function for the Help Desk system.
 */
export async function getDiscussions({
  userId = null,
  type = null,
  status = null,
  priority = null,
  bootcampId = null,
  courseId = null,
  assignedTo = null,
  search = null,
  sortBy = 'created_at',
  sortOrder = 'desc',
  limit = 20,
  offset = 0,
  includeResolved = true,
  myPostsOnly = false,
  unassignedOnly = false,
  needsResponse = false,
} = {}) {
  // Map sort keys to actual column names
  const SORT_COLUMN_MAP = {
    newest: 'created_at',
    oldest: 'created_at',
    most_replies: 'reply_count',
    most_viewed: 'views',
    recently_updated: 'updated_at',
    priority_high: 'priority',
    created_at: 'created_at',
    updated_at: 'updated_at',
    reply_count: 'reply_count',
    views: 'views',
    priority: 'priority',
  };

  // Map sort keys to sort direction
  const SORT_ORDER_MAP = {
    newest: 'desc',
    oldest: 'asc',
    most_replies: 'desc',
    most_viewed: 'desc',
    recently_updated: 'desc',
    priority_high: 'desc',
  };

  // Resolve the actual column name and sort order
  const actualSortColumn = SORT_COLUMN_MAP[sortBy] || 'created_at';
  const actualSortOrder = SORT_ORDER_MAP[sortBy] || sortOrder;

  const applyFiltersAndPaging = (query) => {
    let next = query;

    if (myPostsOnly && userId) {
      next = next.eq('author_id', userId);
    }

    if (type) {
      next = next.eq('type', type);
    }

    if (status) {
      if (Array.isArray(status)) {
        next = next.in('status', status);
      } else {
        next = next.eq('status', status);
      }
    }

    if (!includeResolved) {
      next = next.not('status', 'in', '("resolved","closed")');
    }

    if (priority) {
      next = next.eq('priority', priority);
    }

    if (bootcampId) {
      next = next.eq('bootcamp_id', bootcampId);
    }

    if (courseId) {
      next = next.eq('course_id', courseId);
    }

    if (assignedTo) {
      next = next.eq('assigned_to', assignedTo);
    }

    if (unassignedOnly) {
      next = next.is('assigned_to', null);
    }

    if (needsResponse) {
      next = next.eq('status', 'open').eq('reply_count', 0);
    }

    if (search) {
      next = next.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const ascending = actualSortOrder === 'asc';
    return next
      .order('is_pinned', { ascending: false })
      .order(actualSortColumn, { ascending })
      .range(offset, offset + limit - 1);
  };

  const normalizeError = (error) => {
    if (!error) return {};
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }
    return {
      message: error.message || null,
      details: error.details || null,
      hint: error.hint || null,
      code: error.code || null,
      raw: error,
    };
  };

  const primaryQuery = applyFiltersAndPaging(
    supabase.from('discussion_threads').select(
      `
      *,
      author:users!discussion_threads_author_id_fkey(id, full_name, avatar_url, email),
      category:discussion_categories(id, name, icon),
      assigned:users!discussion_threads_assigned_to_fkey(id, full_name, avatar_url),
      bootcamp:bootcamps(id, title, slug),
      course:courses(id, title)
    `,
      { count: 'exact' }
    )
  );

  const primaryResult = await primaryQuery;

  if (!primaryResult.error) {
    return {
      data: primaryResult.data || [],
      count: primaryResult.count || 0,
      hasMore: primaryResult.count > offset + limit,
    };
  }

  console.error(
    'Database error in getDiscussions (relational query):',
    JSON.stringify(primaryResult.error, null, 2)
  );

  // Fallback to base query so Help Desk remains usable when joins are misconfigured.
  const fallbackQuery = applyFiltersAndPaging(
    supabase.from('discussion_threads').select('*', { count: 'exact' })
  );
  const fallbackResult = await fallbackQuery;

  if (fallbackResult.error) {
    console.error(
      'Database error in getDiscussions (fallback query):',
      JSON.stringify(fallbackResult.error, null, 2)
    );

    const fallbackError =
      fallbackResult.error.message ||
      fallbackResult.error.details ||
      'Unknown database error. Check discussion_threads schema and related foreign keys.';

    throw new Error(`Failed to fetch discussions: ${fallbackError}`);
  }

  return {
    data: fallbackResult.data || [],
    count: fallbackResult.count || 0,
    hasMore: fallbackResult.count > offset + limit,
  };
}

/**
 * Get a single discussion thread with full details including replies.
 */
export async function getDiscussionWithReplies(threadId) {
  // Get thread with author, assigned user, and LMS context
  const { data: thread, error: threadError } = await supabase
    .from('discussion_threads')
    .select(
      `
      *,
      author:users!discussion_threads_author_id_fkey(id, full_name, avatar_url, email),
      category:discussion_categories(id, name, icon),
      assigned:users!discussion_threads_assigned_to_fkey(id, full_name, avatar_url),
      bootcamp:bootcamps(id, title, slug),
      course:courses(id, title),
      module:modules(id, title),
      lesson:lessons(id, title)
    `
    )
    .eq('id', threadId)
    .single();

  if (threadError) throw new Error(threadError.message);

  // Get replies with author info and role
  const { data: replies, error: repliesError } = await supabase
    .from('discussion_replies')
    .select(
      `
      *,
      author:users!discussion_replies_author_id_fkey(id, full_name, avatar_url)
    `
    )
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (repliesError) throw new Error(repliesError.message);

  // Get activity log for this thread
  const { data: activity, error: activityError } = await supabase
    .from('discussion_activity')
    .select(
      `
      *,
      user:users(id, full_name, avatar_url)
    `
    )
    .eq('discussion_id', threadId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (activityError) {
    console.error('Error fetching activity:', activityError.message);
  }

  return {
    ...thread,
    replies: replies || [],
    activity: activity || [],
  };
}

/**
 * Get discussion statistics for a user (member dashboard).
 */
export async function getUserDiscussionStats(userId) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .select('status, type', { count: 'exact' })
    .eq('author_id', userId);

  if (error) throw new Error(error.message);

  const stats = {
    total: data?.length || 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    byType: {},
  };

  data?.forEach((thread) => {
    // Count by status (matches DB constraint values)
    if (thread.status === 'new' || thread.status === 'open') stats.open++;
    else if (
      thread.status === 'in_progress' ||
      thread.status === 'investigating' ||
      thread.status === 'acknowledged'
    )
      stats.in_progress++;
    else if (thread.status === 'resolved' || thread.status === 'closed')
      stats.resolved++;

    // Count by type
    stats.byType[thread.type] = (stats.byType[thread.type] || 0) + 1;
  });

  // Count replies authored by the user.
  const { count: repliesCount } = await supabase
    .from('discussion_replies')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId);

  stats.repliesCount = repliesCount || 0;

  return stats;
}

/**
 * Get top discussion contributors ranked by number of replies authored.
 */
export async function getTopDiscussionContributors(limit = 5) {
  const { data, error } = await supabase
    .from('discussion_replies')
    .select(
      'author_id, author:users!discussion_replies_author_id_fkey(id, full_name, avatar_url)'
    );

  if (error) throw new Error(error.message);

  const byUser = new Map();
  for (const reply of data || []) {
    if (!reply.author_id) continue;
    const current = byUser.get(reply.author_id) || {
      id: reply.author_id,
      name: reply.author?.full_name || 'Unknown User',
      avatar_url: reply.author?.avatar_url || null,
      score: 0,
    };
    current.score += 1;
    byUser.set(reply.author_id, current);
  }

  return Array.from(byUser.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get discussion statistics for staff (admin dashboard).
 */
export async function getStaffDiscussionStats() {
  const { data, error } = await supabase
    .from('discussion_threads')
    .select('status, type, priority, assigned_to');

  if (error) throw new Error(error.message);

  const stats = {
    total: data?.length || 0,
    new: 0,
    open: 0,
    in_progress: 0,
    investigating: 0,
    acknowledged: 0,
    resolved: 0,
    unassigned: 0,
    urgent: 0,
    byType: {},
    byPriority: {},
  };

  data?.forEach((thread) => {
    // Count by status (matches DB constraint values)
    if (thread.status === 'new') stats.new++;
    else if (thread.status === 'open') stats.open++;
    else if (thread.status === 'in_progress') stats.in_progress++;
    else if (thread.status === 'investigating') stats.investigating++;
    else if (thread.status === 'acknowledged') stats.acknowledged++;
    else if (thread.status === 'resolved' || thread.status === 'closed')
      stats.resolved++;

    // Count unassigned
    if (
      !thread.assigned_to &&
      thread.status !== 'resolved' &&
      thread.status !== 'closed'
    ) {
      stats.unassigned++;
    }

    // Count urgent
    if (
      thread.priority === 'urgent' &&
      thread.status !== 'resolved' &&
      thread.status !== 'closed'
    ) {
      stats.urgent++;
    }

    // Count by type
    stats.byType[thread.type] = (stats.byType[thread.type] || 0) + 1;

    // Count by priority
    stats.byPriority[thread.priority] =
      (stats.byPriority[thread.priority] || 0) + 1;
  });

  return stats;
}

/**
 * Get discussions grouped by status for Kanban view.
 */
export async function getDiscussionsForKanban({
  type = null,
  bootcampId = null,
  assignedTo = null,
} = {}) {
  let query = supabase
    .from('discussion_threads')
    .select(
      `
      id, title, type, status, priority, created_at, updated_at, reply_count,
      author:users!discussion_threads_author_id_fkey(id, full_name, avatar_url),
      assigned:users!discussion_threads_assigned_to_fkey(id, full_name, avatar_url)
    `
    )
    .not('status', 'eq', 'closed');

  if (type) {
    query = query.eq('type', type);
  }

  if (bootcampId) {
    query = query.eq('bootcamp_id', bootcampId);
  }

  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo);
  }

  query = query
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Group by status (matches DB constraint values)
  const grouped = {
    new: [],
    open: [],
    investigating: [],
    in_progress: [],
    acknowledged: [],
    resolved: [],
  };

  data?.forEach((thread) => {
    if (grouped[thread.status]) {
      grouped[thread.status].push(thread);
    }
  });

  return grouped;
}

/**
 * Update discussion status (staff action).
 */
export async function updateDiscussionStatus(threadId, status, userId) {
  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Set resolved_at if status is resolved
  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('discussion_threads')
    .update(updates)
    .eq('id', threadId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logDiscussionActivity(threadId, userId, 'status_changed', {
    new_status: status,
  });

  return data;
}

/**
 * Assign discussion to staff member.
 */
export async function assignDiscussion(threadId, assigneeId, assignerId) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .update({
      assigned_to: assigneeId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', threadId)
    .select(
      `
      *,
      assigned:users!discussion_threads_assigned_to_fkey(id, full_name)
    `
    )
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logDiscussionActivity(threadId, assignerId, 'assigned', {
    assignee_id: assigneeId,
    assignee_name: data.assigned?.full_name,
  });

  return data;
}

/**
 * Update discussion priority (staff action).
 */
export async function updateDiscussionPriority(threadId, priority, userId) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .update({
      priority,
      updated_at: new Date().toISOString(),
    })
    .eq('id', threadId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logDiscussionActivity(threadId, userId, 'priority_changed', {
    new_priority: priority,
  });

  return data;
}

/**
 * Create a staff reply to a discussion.
 */
export async function createStaffReply(replyData, userRole) {
  const { data, error } = await supabase
    .from('discussion_replies')
    .insert([
      {
        ...replyData,
        is_staff_reply: true,
        responder_role: userRole,
      },
    ])
    .select(
      `
      *,
      author:users!discussion_replies_author_id_fkey(id, full_name, avatar_url)
    `
    )
    .single();

  if (error) throw new Error(error.message);

  // Update thread's updated_at and reply_count
  await supabase
    .from('discussion_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', replyData.thread_id);

  // Log activity
  await logDiscussionActivity(
    replyData.thread_id,
    replyData.author_id,
    'replied',
    {
      reply_id: data.id,
      is_staff: true,
    }
  );

  return data;
}

/**
 * Mark a reply as accepted answer.
 */
export async function markReplyAsAccepted(replyId, threadId, userId) {
  // First, unmark any existing accepted reply
  await supabase
    .from('discussion_replies')
    .update({ is_accepted: false })
    .eq('thread_id', threadId)
    .eq('is_accepted', true);

  // Mark the new reply as accepted
  const { data, error } = await supabase
    .from('discussion_replies')
    .update({ is_accepted: true })
    .eq('id', replyId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logDiscussionActivity(threadId, userId, 'accepted_answer', {
    reply_id: replyId,
  });

  return data;
}

/**
 * Log discussion activity.
 */
export async function logDiscussionActivity(
  threadId,
  userId,
  activityType,
  details = {}
) {
  const { error } = await supabase.from('discussion_activity').insert([
    {
      discussion_id: threadId,
      user_id: userId,
      action: activityType,
      metadata: details,
    },
  ]);

  if (error) {
    console.error('Error logging discussion activity:', error.message);
  }
}

/**
 * Create a new discussion thread with LMS context.
 */
export async function createHelpDeskThread(threadData) {
  const { data, error } = await supabase
    .from('discussion_threads')
    .insert([
      {
        ...threadData,
        status: 'open',
        priority: threadData.priority || 'normal',
      },
    ])
    .select(
      `
      *,
      author:users!discussion_threads_author_id_fkey(id, full_name, avatar_url),
      bootcamp:bootcamps(id, title),
      course:courses(id, title)
    `
    )
    .single();

  if (error) throw new Error(error.message);

  // Log creation activity
  await logDiscussionActivity(data.id, threadData.author_id, 'created', {
    type: threadData.type,
  });

  return data;
}

/**
 * Get recent resolved discussions (for release log).
 */
export async function getResolvedDiscussions({ limit = 50, offset = 0 } = {}) {
  const { data, error, count } = await supabase
    .from('discussion_threads')
    .select(
      `
      id, title, type, status, resolved_at, created_at,
      author:users!discussion_threads_author_id_fkey(id, full_name, avatar_url),
      assigned:users!discussion_threads_assigned_to_fkey(id, full_name, avatar_url)
    `,
      { count: 'exact' }
    )
    .in('status', ['resolved', 'closed'])
    .not('resolved_at', 'is', null)
    .order('resolved_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { data, count };
}

// Increment upvote count for a resource.
export async function upvoteResource(id) {
  const { data: resource } = await supabase
    .from('resources')
    .select('upvotes')
    .eq('id', id)
    .single();
  if (resource) {
    await supabase
      .from('resources')
      .update({ upvotes: (resource.upvotes || 0) + 1 })
      .eq('id', id);
  }
  return { success: true };
}
