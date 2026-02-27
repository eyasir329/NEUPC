import { supabaseAdmin } from './supabase';

/**
 * Fetches all analytics data in parallel for the admin dashboard.
 * Uses supabaseAdmin to bypass RLS.
 */
export async function getAnalyticsData() {
  const [
    // Users
    usersTotal,
    usersActive,
    usersPending,
    usersSuspended,
    usersBanned,
    usersRejected,
    // Join requests
    appsAll,
    appsPending,
    appsApproved,
    appsRejected,
    // Events
    eventsTotal,
    eventsUpcoming,
    eventsOngoing,
    eventsCompleted,
    eventsCancelled,
    // Blogs
    blogsTotal,
    blogsPublished,
    blogsDraft,
    // Contact
    contactNew,
    contactReplied,
    contactTotal,
    // Content
    noticesTotal,
    galleryTotal,
    resourcesTotal,
    achievementsTotal,
    // Recent activity
    recentActivity,
    // Blogs stats (views + likes)
    blogsStats,
    // Member profiles
    membersTotal,
    membersApproved,
    // Events by category
    eventsByCategory,
  ] = await Promise.all([
    // Users by status
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'active'),
    supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'pending'),
    supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'suspended'),
    supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'banned'),
    supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'rejected'),

    // Join requests
    supabaseAdmin
      .from('join_requests')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('join_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabaseAdmin
      .from('join_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabaseAdmin
      .from('join_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),

    // Events
    supabaseAdmin.from('events').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'upcoming'),
    supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ongoing'),
    supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled'),

    // Blogs
    supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft'),

    // Contact
    supabaseAdmin
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new'),
    supabaseAdmin
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'replied'),
    supabaseAdmin
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true }),

    // Content counts
    supabaseAdmin.from('notices').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('gallery_items')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('resources').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('achievements')
      .select('*', { count: 'exact', head: true }),

    // Recent activity logs (last 20)
    supabaseAdmin
      .from('activity_logs')
      .select('id, action, entity_type, details, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(20),

    // Blog views + likes totals
    supabaseAdmin
      .from('blog_posts')
      .select('views, likes')
      .eq('status', 'published'),

    // Members
    supabaseAdmin
      .from('member_profiles')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('member_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('approved', true),

    // Events by category
    supabaseAdmin.from('events').select('category').not('category', 'is', null),
  ]);

  // Aggregate blog views/likes
  const blogViewsTotal = (blogsStats.data || []).reduce(
    (sum, b) => sum + (b.views || 0),
    0
  );
  const blogLikesTotal = (blogsStats.data || []).reduce(
    (sum, b) => sum + (b.likes || 0),
    0
  );

  // Aggregate events by category
  const categoryMap = {};
  (eventsByCategory.data || []).forEach(({ category }) => {
    if (category) categoryMap[category] = (categoryMap[category] || 0) + 1;
  });
  const eventCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return {
    users: {
      total: usersTotal.count || 0,
      active: usersActive.count || 0,
      pending: usersPending.count || 0,
      suspended: usersSuspended.count || 0,
      banned: usersBanned.count || 0,
      rejected: usersRejected.count || 0,
    },
    applications: {
      total: appsAll.count || 0,
      pending: appsPending.count || 0,
      approved: appsApproved.count || 0,
      rejected: appsRejected.count || 0,
    },
    events: {
      total: eventsTotal.count || 0,
      upcoming: eventsUpcoming.count || 0,
      ongoing: eventsOngoing.count || 0,
      completed: eventsCompleted.count || 0,
      cancelled: eventsCancelled.count || 0,
      byCategory: eventCategories,
    },
    blogs: {
      total: blogsTotal.count || 0,
      published: blogsPublished.count || 0,
      draft: blogsDraft.count || 0,
      totalViews: blogViewsTotal,
      totalLikes: blogLikesTotal,
    },
    contact: {
      new: contactNew.count || 0,
      replied: contactReplied.count || 0,
      total: contactTotal.count || 0,
    },
    content: {
      notices: noticesTotal.count || 0,
      gallery: galleryTotal.count || 0,
      resources: resourcesTotal.count || 0,
      achievements: achievementsTotal.count || 0,
    },
    members: {
      total: membersTotal.count || 0,
      approved: membersApproved.count || 0,
    },
    recentActivity: recentActivity.data || [],
    generatedAt: new Date().toISOString(),
  };
}
