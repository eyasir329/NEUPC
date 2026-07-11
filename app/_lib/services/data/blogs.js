/**
 * @file blogs data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { dbWrite } from '@/app/_lib/db/router';
import { cached, invalidate, key, TTL } from './_cache';

// A blog_posts write invalidates every cached public listing — cheap to
// blanket-invalidate since there are only a handful of these keys.
const BLOG_LIST_CACHE_KEYS = [
  key('blog', 'published', 20),
  key('blog', 'featured'),
];

// Get blog posts with admin stats.
export async function getBlogsWithStats() {
  const [postsRes, commentsRes] = await Promise.all([
    supabaseAdmin
      .from('blog_posts')
      .select('*, users!blog_posts_author_id_fkey(id, full_name, avatar_url)')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('blog_comments').select('blog_id, is_approved'),
  ]);

  if (postsRes.error) throw new Error(postsRes.error.message);
  const posts = postsRes.data ?? [];
  const comments = commentsRes.data ?? [];

  const commentCount = {};
  const pendingCount = {};
  for (const c of comments) {
    commentCount[c.blog_id] = (commentCount[c.blog_id] ?? 0) + 1;
    if (!c.is_approved)
      pendingCount[c.blog_id] = (pendingCount[c.blog_id] ?? 0) + 1;
  }

  const enriched = posts.map((p) => ({
    ...p,
    commentCount: commentCount[p.id] ?? 0,
    pendingComments: pendingCount[p.id] ?? 0,
  }));

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    archived: posts.filter((p) => p.status === 'archived').length,
    featured: posts.filter((p) => p.is_featured).length,
    totalViews: posts.reduce((s, p) => s + (p.views ?? 0), 0),
    totalLikes: posts.reduce((s, p) => s + (p.likes ?? 0), 0),
    totalComments: comments.length,
    pendingComments: comments.filter((c) => !c.is_approved).length,
  };

  return { posts: enriched, stats };
}

// Get all blog posts.
export async function getAllBlogPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, users!blog_posts_author_id_fkey(id, full_name, avatar_url)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get published blog posts. Public listing — cached; invalidated by writes below.
export async function getPublishedBlogPosts(limit = 20) {
  return cached(
    key('blog', 'published', limit),
    async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          `
      id, slug, title, excerpt, thumbnail, category, tags,
      read_time, views, likes, published_at, is_featured,
      users!blog_posts_author_id_fkey(id, full_name, avatar_url)
    `
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data;
    },
    TTL.short
  );
}

// Get featured published blog posts. Public listing — cached.
export async function getFeaturedBlogPosts() {
  return cached(
    key('blog', 'featured'),
    async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          `
      id, slug, title, excerpt, thumbnail, category,
      read_time, views, likes, published_at,
      users!blog_posts_author_id_fkey(id, full_name, avatar_url)
    `
        )
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    TTL.short
  );
}

// Get recent non-featured published blog posts (for homepage grid).
export async function getRecentNonFeaturedBlogPosts(limit = 6) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      `
      id, slug, title, excerpt, thumbnail, category, tags,
      read_time, views, likes, published_at,
      users!blog_posts_author_id_fkey(id, full_name, avatar_url)
    `
    )
    .eq('status', 'published')
    .eq('is_featured', false)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Get a published blog post by slug. Public detail page — cached per slug.
export async function getBlogPostBySlug(slug) {
  return cached(
    key('blog', 'slug', slug),
    async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, users!blog_posts_author_id_fkey(id, full_name, avatar_url)')
        .eq('slug', slug)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    TTL.short
  );
}

// Get published blog posts by category.
export async function getBlogPostsByCategory(category) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      `
      id, slug, title, excerpt, thumbnail, category, tags,
      read_time, views, likes, published_at,
      users!blog_posts_author_id_fkey(id, full_name, avatar_url)
    `
    )
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get published blog posts by author.
export async function getBlogPostsByAuthor(authorId) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, thumbnail, category, status, views, likes, published_at'
    )
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a new blog post.
export async function createBlogPost(postData) {
  const { data, error } = await dbWrite({
    table: 'blog_posts',
    op: 'insert',
    mutate: (client) => client.from('blog_posts').insert([postData]).select().single(),
    cacheKeys: BLOG_LIST_CACHE_KEYS,
  });
  if (error) throw new Error(error.message);
  return data;
}

// Update a blog post.
export async function updateBlogPost(id, updates) {
  const { data, error } = await dbWrite({
    table: 'blog_posts',
    op: 'update',
    mutate: (client) =>
      client
        .from('blog_posts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single(),
    cacheKeys: BLOG_LIST_CACHE_KEYS,
  });
  if (error) throw new Error(error.message);
  if (data?.slug) await invalidate(key('blog', 'slug', data.slug));
  return data;
}

// Publish a blog post.
export async function publishBlogPost(id) {
  const { data, error } = await dbWrite({
    table: 'blog_posts',
    op: 'update',
    mutate: (client) =>
      client
        .from('blog_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single(),
    cacheKeys: BLOG_LIST_CACHE_KEYS,
  });
  if (error) throw new Error(error.message);
  if (data?.slug) await invalidate(key('blog', 'slug', data.slug));
  return data;
}

// Increment view count for a blog post.
export async function incrementBlogPostViews(id) {
  const { error: rpcError } = await supabaseAdmin.rpc('increment_views', { post_id: id });
  if (!rpcError) {
    // increment_views succeeded via RPC — re-read + re-write through dbWrite so
    // the outbox payload reflects the post-increment value (the RPC itself
    // isn't visible to the router/outbox).
    const { data: post } = await supabaseAdmin.from('blog_posts').select('*').eq('id', id).single();
    if (post) {
      await dbWrite({
        table: 'blog_posts',
        op: 'update',
        mutate: (client) => client.from('blog_posts').update({ views: post.views }).eq('id', id).select().single(),
      });
    }
    return { success: true };
  }

  const { data: post } = await supabaseAdmin.from('blog_posts').select('views').eq('id', id).single();
  if (post) {
    await dbWrite({
      table: 'blog_posts',
      op: 'update',
      mutate: (client) =>
        client
          .from('blog_posts')
          .update({ views: (post.views || 0) + 1 })
          .eq('id', id)
          .select()
          .single(),
    });
  }
  return { success: true };
}

// Hard-delete a blog post.
export async function deleteBlogPost(id) {
  const { data: post } = await supabaseAdmin.from('blog_posts').select('slug').eq('id', id).single();

  const { error } = await dbWrite({
    table: 'blog_posts',
    op: 'delete',
    mutate: (client) => client.from('blog_posts').delete().eq('id', id),
    pk: { id },
    cacheKeys: BLOG_LIST_CACHE_KEYS,
  });
  if (error) throw new Error(error.message);
  if (post?.slug) await invalidate(key('blog', 'slug', post.slug));
  return { success: true };
}

// Get approved comments for a blog post.
export async function getBlogComments(blogId) {
  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .select('*, users(id, full_name, avatar_url)')
    .eq('blog_id', blogId)
    .eq('is_approved', true)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Get all comments for a blog post (admin).
export async function getAllBlogComments(blogId) {
  const { data, error } = await supabase
    .from('blog_comments')
    .select('*, users(id, full_name, avatar_url)')
    .eq('blog_id', blogId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Create a blog comment.
export async function createBlogComment(commentData) {
  // dbWrite needs the plain column row (embedded joins don't port to InsForge),
  // so insert without the join here and re-fetch the enriched shape after.
  const { data: plainRow, error } = await dbWrite({
    table: 'blog_comments',
    op: 'insert',
    mutate: (client) => client.from('blog_comments').insert([commentData]).select().single(),
  });
  if (error) throw new Error(error.message);

  const { data, error: fetchError } = await supabase
    .from('blog_comments')
    .select('*, users(id, full_name, avatar_url)')
    .eq('id', plainRow.id)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  return data;
}

// Update a blog comment.
export async function updateBlogComment(id, userId, content) {
  const { data, error } = await dbWrite({
    table: 'blog_comments',
    op: 'update',
    mutate: (client) =>
      client
        .from('blog_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single(),
  });
  if (error) throw new Error(error.message);
  return data;
}

// Approve a blog comment.
export async function approveBlogComment(id) {
  const { data, error } = await dbWrite({
    table: 'blog_comments',
    op: 'update',
    mutate: (client) =>
      client.from('blog_comments').update({ is_approved: true }).eq('id', id).select().single(),
  });
  if (error) throw new Error(error.message);
  return data;
}

// Delete a blog comment.
export async function deleteBlogComment(id) {
  const { error } = await dbWrite({
    table: 'blog_comments',
    op: 'delete',
    mutate: (client) => client.from('blog_comments').delete().eq('id', id),
    pk: { id },
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

// Toggle like on a blog post.
export async function toggleBlogPostLike(id) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('likes')
    .eq('id', id)
    .single();
  if (post) {
    const newLikes = (post.likes || 0) + 1;
    await dbWrite({
      table: 'blog_posts',
      op: 'update',
      mutate: (client) => client.from('blog_posts').update({ likes: newLikes }).eq('id', id).select().single(),
    });
    return { likes: newLikes };
  }
  return { likes: 0 };
}

// Get trending blog posts by views.
export async function getTrendingBlogPosts(limit = 10) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      `
      id, slug, title, excerpt, thumbnail, category,
      read_time, views, likes, published_at,
      users!blog_posts_author_id_fkey(id, full_name, avatar_url)
    `
    )
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

export async function searchBlogPosts(query) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      `
      id, slug, title, excerpt, category, published_at,
      users!blog_posts_author_id_fkey(id, full_name)
    `
    )
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
    .limit(20);
  if (error) throw new Error(error.message);
  return data;
}
