/**
 * @file gallery actions
 * @module gallery-actions
 */

'use server';

import { supabaseAdmin } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';
import { requireAdmin, createLogger } from '@/app/_lib/helpers';

const logActivity = createLogger('gallery');

function revalidate() {
  revalidatePath('/account/admin/gallery');
  revalidatePath('/gallery');
}

// =============================================================================
// ADD GALLERY ITEM
// =============================================================================

export async function addGalleryItemAction(formData) {
  const admin = await requireAdmin();

  const url = formData.get('url')?.trim();
  if (!url) return { error: 'URL is required.' };

  const rawTags = formData.get('tags') || '';
  const tags = rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const payload = {
    url,
    type: formData.get('type') || 'image',
    caption: formData.get('caption')?.trim() || null,
    category: formData.get('category')?.trim() || null,
    event_id: formData.get('event_id') || null,
    tags: tags.length ? tags : null,
    display_order: formData.get('display_order')
      ? parseInt(formData.get('display_order'), 10)
      : 0,
    is_featured: formData.get('is_featured') === 'true',
    uploaded_by: admin.id,
  };

  const { data, error } = await supabaseAdmin
    .from('gallery_items')
    .insert([payload])
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'gallery_item_added', data.id, { url });
  revalidate();
  return { success: true, id: data.id };
}

// =============================================================================
// BULK ADD GALLERY ITEMS
// =============================================================================

export async function bulkAddGalleryItemsAction(formData) {
  const admin = await requireAdmin();

  const rawUrls = formData.get('urls') || '';
  const urls = rawUrls
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

  if (urls.length === 0) return { error: 'No URLs provided.' };
  if (urls.length > 50) return { error: 'Maximum 50 items at a time.' };

  const type = formData.get('type') || 'image';
  const category = formData.get('category')?.trim() || null;
  const event_id = formData.get('event_id') || null;

  const payload = urls.map((url, i) => ({
    url,
    type,
    category,
    event_id,
    display_order: i,
    uploaded_by: admin.id,
  }));

  const { data, error } = await supabaseAdmin
    .from('gallery_items')
    .insert(payload)
    .select();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'gallery_bulk_added', null, {
    count: urls.length,
  });
  revalidate();
  return { success: true, count: data.length };
}

// =============================================================================
// UPDATE GALLERY ITEM
// =============================================================================

export async function updateGalleryItemAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Item ID is required.' };

  const url = formData.get('url')?.trim();
  if (!url) return { error: 'URL is required.' };

  const rawTags = formData.get('tags') || '';
  const tags = rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const payload = {
    url,
    type: formData.get('type') || 'image',
    caption: formData.get('caption')?.trim() || null,
    category: formData.get('category')?.trim() || null,
    event_id: formData.get('event_id') || null,
    tags: tags.length ? tags : null,
    display_order: formData.get('display_order')
      ? parseInt(formData.get('display_order'), 10)
      : 0,
    is_featured: formData.get('is_featured') === 'true',
  };

  const { error } = await supabaseAdmin
    .from('gallery_items')
    .update(payload)
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'gallery_item_updated', id, {});
  revalidate();
  return { success: true };
}

// =============================================================================
// DELETE GALLERY ITEM
// =============================================================================

export async function deleteGalleryItemAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Item ID is required.' };

  const { error } = await supabaseAdmin
    .from('gallery_items')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'gallery_item_deleted', id, {});
  revalidate();
  return { success: true };
}

// =============================================================================
// TOGGLE FEATURED
// =============================================================================

export async function toggleGalleryFeaturedAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const featured = formData.get('featured') === 'true';
  if (!id) return { error: 'Item ID is required.' };

  const { error } = await supabaseAdmin
    .from('gallery_items')
    .update({ is_featured: featured })
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(
    admin.id,
    featured ? 'gallery_item_featured' : 'gallery_item_unfeatured',
    id,
    {}
  );
  revalidate();
  return { success: true };
}
