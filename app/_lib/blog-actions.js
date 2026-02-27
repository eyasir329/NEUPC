'use server';

import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';

// =============================================================================
// HELPERS
// =============================================================================

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const roles = await getUserRoles(session.user.email);
  if (!roles.includes('admin')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active') redirect('/account');
  return user;
}

async function logActivity(userId, action, entityId, details = {}) {
  try {
    await supabaseAdmin.from('activity_logs').insert({
      user_id: userId,
      action,
      entity_type: 'blog',
      entity_id: entityId,
      details,
    });
  } catch {
    // non-critical
  }
}

function generateSlug(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 60) +
    '-' +
    Date.now().toString(36)
  );
}

// =============================================================================
// CREATE BLOG POST
// =============================================================================

export async function createBlogAction(formData) {
  const admin = await requireAdmin();

  const title = formData.get('title')?.trim();
  if (!title) return { error: 'Title is required.' };

  const content = formData.get('content')?.trim();
  if (!content) return { error: 'Content is required.' };

  const rawTags = formData.get('tags') || '';
  const tags = rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const status = formData.get('status') || 'draft';
  const published_at = status === 'published' ? new Date().toISOString() : null;

  const payload = {
    slug: generateSlug(title),
    title,
    excerpt: formData.get('excerpt')?.trim() || null,
    content,
    thumbnail: formData.get('thumbnail')?.trim() || null,
    category: formData.get('category') || null,
    tags: tags.length ? tags : null,
    status,
    published_at,
    is_featured: formData.get('is_featured') === 'true',
    read_time: formData.get('read_time')
      ? parseInt(formData.get('read_time'), 10)
      : null,
    author_id: admin.id,
  };

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .insert([payload])
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'blog_created', data.id, { title });
  revalidatePath('/account/admin/blogs');
  revalidatePath('/blogs');
  return { success: true, id: data.id };
}

// =============================================================================
// UPDATE BLOG POST
// =============================================================================

export async function updateBlogAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Blog ID is required.' };

  const title = formData.get('title')?.trim();
  if (!title) return { error: 'Title is required.' };

  const content = formData.get('content')?.trim();
  if (!content) return { error: 'Content is required.' };

  const rawTags = formData.get('tags') || '';
  const tags = rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // If status changes to published and wasn't before, record timestamp
  const newStatus = formData.get('status') || 'draft';
  const { data: existing } = await supabaseAdmin
    .from('blog_posts')
    .select('status, published_at')
    .eq('id', id)
    .single();

  let published_at = existing?.published_at ?? null;
  if (newStatus === 'published' && existing?.status !== 'published') {
    published_at = new Date().toISOString();
  }

  const payload = {
    title,
    excerpt: formData.get('excerpt')?.trim() || null,
    content,
    thumbnail: formData.get('thumbnail')?.trim() || null,
    category: formData.get('category') || null,
    tags: tags.length ? tags : null,
    status: newStatus,
    published_at,
    is_featured: formData.get('is_featured') === 'true',
    read_time: formData.get('read_time')
      ? parseInt(formData.get('read_time'), 10)
      : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('blog_posts')
    .update(payload)
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'blog_updated', id, { title });
  revalidatePath('/account/admin/blogs');
  revalidatePath('/blogs');
  return { success: true };
}

// =============================================================================
// DELETE BLOG POST
// =============================================================================

export async function deleteBlogAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Blog ID is required.' };

  // Delete comments first (foreign key)
  await supabaseAdmin.from('blog_comments').delete().eq('blog_id', id);

  const { error } = await supabaseAdmin
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'blog_deleted', id, {});
  revalidatePath('/account/admin/blogs');
  revalidatePath('/blogs');
  return { success: true };
}

// =============================================================================
// UPDATE BLOG STATUS
// =============================================================================

export async function updateBlogStatusAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const status = formData.get('status');
  if (!id || !status) return { error: 'Missing id or status.' };

  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'published') {
    // Only set published_at if not already set
    const { data: existing } = await supabaseAdmin
      .from('blog_posts')
      .select('published_at')
      .eq('id', id)
      .single();
    if (!existing?.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabaseAdmin
    .from('blog_posts')
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'blog_status_updated', id, { status });
  revalidatePath('/account/admin/blogs');
  revalidatePath('/blogs');
  return { success: true };
}

// =============================================================================
// TOGGLE FEATURED
// =============================================================================

export async function toggleBlogFeaturedAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const featured = formData.get('featured') === 'true';
  if (!id) return { error: 'Blog ID is required.' };

  const { error } = await supabaseAdmin
    .from('blog_posts')
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(
    admin.id,
    featured ? 'blog_featured' : 'blog_unfeatured',
    id,
    {}
  );
  revalidatePath('/account/admin/blogs');
  revalidatePath('/blogs');
  return { success: true };
}

// =============================================================================
// TOGGLE COMMENT APPROVAL
// =============================================================================

export async function toggleCommentApprovalAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const approved = formData.get('approved') === 'true';
  if (!id) return { error: 'Comment ID is required.' };

  const { error } = await supabaseAdmin
    .from('blog_comments')
    .update({ is_approved: approved, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(
    admin.id,
    approved ? 'comment_approved' : 'comment_hidden',
    id,
    {}
  );
  revalidatePath('/account/admin/blogs');
  return { success: true };
}

// =============================================================================
// DELETE COMMENT
// =============================================================================

export async function deleteCommentAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Comment ID is required.' };

  const { error } = await supabaseAdmin
    .from('blog_comments')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'comment_deleted', id, {});
  revalidatePath('/account/admin/blogs');
  return { success: true };
}
