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
      entity_type: 'resource',
      entity_id: entityId,
      details,
    });
  } catch {
    // non-critical
  }
}

// =============================================================================
// CREATE RESOURCE
// =============================================================================

export async function createResourceAction(formData) {
  const admin = await requireAdmin();

  const title = formData.get('title')?.trim();
  if (!title) return { error: 'Title is required.' };

  const url = formData.get('url')?.trim();
  if (!url) return { error: 'URL is required.' };

  const category = formData.get('category')?.trim();
  if (!category) return { error: 'Category is required.' };

  const rawTags = formData.get('tags') || '';
  const tags = rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const payload = {
    title,
    description: formData.get('description')?.trim() || null,
    url,
    resource_type: formData.get('resource_type') || 'article',
    category,
    difficulty: formData.get('difficulty') || null,
    tags: tags.length ? tags : null,
    thumbnail: formData.get('thumbnail')?.trim() || null,
    is_free: formData.get('is_free') !== 'false',
    is_featured: formData.get('is_featured') === 'true',
    created_by: admin.id,
  };

  const { data, error } = await supabaseAdmin
    .from('resources')
    .insert([payload])
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'resource_created', data.id, { title });
  revalidatePath('/account/admin/resources');
  revalidatePath('/resources');
  return { success: true, id: data.id };
}

// =============================================================================
// UPDATE RESOURCE
// =============================================================================

export async function updateResourceAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Resource ID is required.' };

  const title = formData.get('title')?.trim();
  if (!title) return { error: 'Title is required.' };

  const url = formData.get('url')?.trim();
  if (!url) return { error: 'URL is required.' };

  const category = formData.get('category')?.trim();
  if (!category) return { error: 'Category is required.' };

  const rawTags = formData.get('tags') || '';
  const tags = rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const payload = {
    title,
    description: formData.get('description')?.trim() || null,
    url,
    resource_type: formData.get('resource_type') || 'article',
    category,
    difficulty: formData.get('difficulty') || null,
    tags: tags.length ? tags : null,
    thumbnail: formData.get('thumbnail')?.trim() || null,
    is_free: formData.get('is_free') !== 'false',
    is_featured: formData.get('is_featured') === 'true',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('resources')
    .update(payload)
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'resource_updated', id, { title });
  revalidatePath('/account/admin/resources');
  revalidatePath('/resources');
  return { success: true };
}

// =============================================================================
// DELETE RESOURCE
// =============================================================================

export async function deleteResourceAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Resource ID is required.' };

  const { error } = await supabaseAdmin.from('resources').delete().eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'resource_deleted', id, {});
  revalidatePath('/account/admin/resources');
  revalidatePath('/resources');
  return { success: true };
}

// =============================================================================
// TOGGLE FEATURED
// =============================================================================

export async function toggleResourceFeaturedAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const featured = formData.get('featured') === 'true';
  if (!id) return { error: 'Resource ID is required.' };

  const { error } = await supabaseAdmin
    .from('resources')
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(
    admin.id,
    featured ? 'resource_featured' : 'resource_unfeatured',
    id,
    {}
  );
  revalidatePath('/account/admin/resources');
  revalidatePath('/resources');
  return { success: true };
}

// =============================================================================
// TOGGLE FREE / PAID
// =============================================================================

export async function toggleResourceFreeAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const isFree = formData.get('is_free') === 'true';
  if (!id) return { error: 'Resource ID is required.' };

  const { error } = await supabaseAdmin
    .from('resources')
    .update({ is_free: isFree, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'resource_access_toggled', id, {
    is_free: isFree,
  });
  revalidatePath('/account/admin/resources');
  revalidatePath('/resources');
  return { success: true };
}
