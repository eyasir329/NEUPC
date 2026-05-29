/**
 * @file Queries
 * @module queries
 */

import 'server-only';

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

function isUuid(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    val
  );
}

function mapResourceRow(row) {
  const tags = (row.resource_tag_map || [])
    .map((m) => m.resource_tags)
    .filter(Boolean);

  const uniqueUsers = new Set(
    (row.resource_views || []).map((v) => v.user_id).filter(Boolean)
  );
  const uniqueAnons = new Set(
    (row.resource_views || []).map((v) => v.anon_id).filter(Boolean)
  );
  const uniqueViewsCount = uniqueUsers.size + uniqueAnons.size;

  return {
    ...row,
    category: row.resource_categories || null,
    tags,
    creator: row.users || null,
    uniqueViewsCount: uniqueViewsCount || 0,
  };
}

function baseSelect() {
  return `
    id,
    title,
    description,
    resource_type,
    content,
    embed_url,
    file_url,
    thumbnail,
    category_id,
    visibility,
    status,
    is_pinned,
    published_at,
    scheduled_for,
    created_by,
    created_at,
    updated_at,
    upvotes,
    resource_categories(id,name,slug,description),
    resource_tag_map(tag_id,resource_tags(id,name,slug)),
    users!resources_created_by_fkey(id,full_name,avatar_url),
    resource_views(user_id, anon_id)
  `;
}

export async function getResourceCategories() {
  const { data, error } = await supabaseAdmin
    .from('resource_categories')
    .select('id,name,slug,description')
    .order('name', { ascending: true });

  if (error) return [];
  return data || [];
}

export async function getResourceTags() {
  const { data, error } = await supabaseAdmin
    .from('resource_tags')
    .select('id,name,slug')
    .order('name', { ascending: true });

  if (error) return [];
  return data || [];
}

export async function getAdminResources({
  page = 1,
  // The admin UI loads all records client-side for filtering/stat counts.
  // A high default avoids silently truncating the dataset until server-side
  // pagination controls are added to the admin page.
  pageSize = 200,
  q = '',
  type = '',
  categoryId = '',
} = {}) {
  const offset = (Math.max(page, 1) - 1) * pageSize;

  let query = supabaseAdmin
    .from('resources')
    .select(baseSelect(), { count: 'exact' })
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (q) {
    const safe = q.replace(/,/g, ' ').trim();
    query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (type) query = query.eq('resource_type', type);
  if (categoryId) query = query.eq('category_id', categoryId);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    resources: (data || []).map(mapResourceRow),
    total: count || 0,
    page,
    pageSize,
  };
}

export async function getPublishedResources({
  page = 1,
  pageSize = 12,
  q = '',
  type = '',
  types = null,
  categoryId = '',
  tagSlug = '',
  includeMembers = false,
  visibility = '',
  onlyBookmarkedFor = null,
  onlyCompletedFor = null,
  onlyCreatedBy = null,
} = {}) {
  const offset = (Math.max(page, 1) - 1) * pageSize;
  const nowIso = new Date().toISOString();

  let query = supabaseAdmin
    .from('resources')
    .select(baseSelect(), { count: 'exact' });

  if (onlyCreatedBy && isUuid(onlyCreatedBy)) {
    query = query.eq('created_by', onlyCreatedBy);
  } else {
    query = query.eq('status', 'published');
  }

  query = query
    .or(`published_at.is.null,published_at.lte.${nowIso},status.eq.draft`)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (!includeMembers) {
    query = query.eq('visibility', 'public');
  }

  if (visibility === 'public' || visibility === 'members') {
    query = query.eq('visibility', visibility);
  }

  if (q) {
    const safe = q.replace(/,/g, ' ').trim();
    query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (Array.isArray(types) && types.length) {
    query = query.in('resource_type', types);
  } else if (type) {
    query = query.eq('resource_type', type);
  }
  if (categoryId && isUuid(categoryId))
    query = query.eq('category_id', categoryId);

  if (onlyBookmarkedFor && isUuid(onlyBookmarkedFor)) {
    const { data: bm } = await supabaseAdmin
      .from('resource_bookmarks')
      .select('resource_id')
      .eq('user_id', onlyBookmarkedFor);
    const ids = [...new Set((bm || []).map((r) => r.resource_id))];
    if (!ids.length) return { resources: [], total: 0, page, pageSize };
    query = query.in('id', ids);
  }

  if (onlyCompletedFor && isUuid(onlyCompletedFor)) {
    const { data: cp } = await supabaseAdmin
      .from('resource_completions')
      .select('resource_id')
      .eq('user_id', onlyCompletedFor);
    const ids = [...new Set((cp || []).map((r) => r.resource_id))];
    if (!ids.length) return { resources: [], total: 0, page, pageSize };
    query = query.in('id', ids);
  }

  if (tagSlug) {
    const { data: tagRows } = await supabaseAdmin
      .from('resource_tag_map')
      .select('resource_id, resource_tags!inner(slug)')
      .eq('resource_tags.slug', tagSlug);

    const ids = [...new Set((tagRows || []).map((r) => r.resource_id))];
    if (!ids.length) {
      return { resources: [], total: 0, page, pageSize };
    }
    query = query.in('id', ids);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    resources: (data || []).map(mapResourceRow),
    total: count || 0,
    page,
    pageSize,
  };
}

export async function getResourceById(id, { includeMembers = false } = {}) {
  const nowIso = new Date().toISOString();

  // Use admin client so dashboard/API access does not depend on anon RLS.
  // Visibility is still enforced below via `includeMembers`.
  let query = supabaseAdmin
    .from('resources')
    .select(baseSelect())
    .eq('id', id)
    .eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${nowIso}`)
    .single();

  if (!includeMembers) {
    query = query.eq('visibility', 'public');
  }

  const { data, error } = await query;
  if (error) return null;
  return mapResourceRow(data);
}

export async function getAdminResourceById(id) {
  const { data, error } = await supabaseAdmin
    .from('resources')
    .select(baseSelect())
    .eq('id', id)
    .single();

  if (error) return null;
  return mapResourceRow(data);
}

export async function getBookmarkedResourceIds(userId, resourceIds) {
  if (!userId || !resourceIds?.length) return [];

  const { data, error } = await supabaseAdmin
    .from('resource_bookmarks')
    .select('resource_id')
    .eq('user_id', userId)
    .in('resource_id', resourceIds);

  if (error) return [];
  return (data || []).map((r) => r.resource_id);
}

export async function getCompletedResourceIds(userId, resourceIds) {
  if (!userId || !resourceIds?.length) return [];
  const { data, error } = await supabaseAdmin
    .from('resource_completions')
    .select('resource_id')
    .eq('user_id', userId)
    .in('resource_id', resourceIds);
  if (error) return [];
  return (data || []).map((r) => r.resource_id);
}

export async function getBookmarkCount(userId) {
  if (!userId || !isUuid(userId)) return 0;
  const { count, error } = await supabaseAdmin
    .from('resource_bookmarks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return 0;
  return count ?? 0;
}

export async function getCompletionCount(userId) {
  if (!userId || !isUuid(userId)) return 0;
  const { count, error } = await supabaseAdmin
    .from('resource_completions')
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return 0;
  return count ?? 0;
}

export async function getPublishedBlogCount() {
  const { count, error } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  if (error) return 0;
  return count ?? 0;
}

export async function getPublishedRoadmapCount() {
  const { count, error } = await supabase
    .from('roadmaps')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  if (error) return 0;
  return count ?? 0;
}

export async function getSubmissionCount(userId) {
  if (!userId || !isUuid(userId)) return 0;
  const { count, error } = await supabaseAdmin
    .from('resources')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId);
  if (error) return 0;
  return count ?? 0;
}

export async function getLovedResourceIds(userId, resourceIds) {
  if (!userId || !resourceIds?.length) return [];

  const { data, error } = await supabaseAdmin
    .from('resource_upvotes')
    .select('resource_id')
    .eq('user_id', userId)
    .in('resource_id', resourceIds);

  if (error) return [];
  return (data || []).map((r) => r.resource_id);
}
