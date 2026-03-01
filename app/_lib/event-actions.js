/**
 * @file event actions
 * @module event-actions
 */

'use server';

import { supabaseAdmin } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';
import { requireAdmin, createLogger, generateSlug } from '@/app/_lib/helpers';

const logActivity = createLogger('event');

// =============================================================================
// CREATE EVENT
// =============================================================================

export async function createEventAction(formData) {
  const admin = await requireAdmin();

  const title = formData.get('title')?.trim();
  if (!title) return { error: 'Title is required.' };

  const location = formData.get('location')?.trim();
  if (!location) return { error: 'Location is required.' };

  const start_date = formData.get('start_date');
  if (!start_date) return { error: 'Start date is required.' };

  const rawTags = formData.get('tags') || '';
  const tags = rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const maxP = formData.get('max_participants');
  const max_participants = maxP ? parseInt(maxP, 10) : null;

  const payload = {
    slug: generateSlug(title),
    title,
    description: formData.get('description')?.trim() || null,
    content: formData.get('content')?.trim() || null,
    location,
    venue_type: formData.get('venue_type') || 'offline',
    category: formData.get('category') || null,
    status: formData.get('status') || 'draft',
    start_date: new Date(start_date).toISOString(),
    end_date: formData.get('end_date')
      ? new Date(formData.get('end_date')).toISOString()
      : null,
    cover_image: formData.get('cover_image')?.trim() || null,
    registration_required: formData.get('registration_required') === 'true',
    registration_deadline: formData.get('registration_deadline')
      ? new Date(formData.get('registration_deadline')).toISOString()
      : null,
    max_participants,
    is_featured: formData.get('is_featured') === 'true',
    tags: tags.length ? tags : null,
    external_url: formData.get('external_url')?.trim() || null,
    registration_url: formData.get('registration_url')?.trim() || null,
    created_by: admin.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('events')
    .insert(payload)
    .select()
    .single();

  if (error) return { error: error.message };

  // Auto-approve if status is not draft
  if (payload.status !== 'draft') {
    await supabaseAdmin
      .from('events')
      .update({ approved_by: admin.id, approved_at: new Date().toISOString() })
      .eq('id', data.id);
  }

  await logActivity(admin.id, 'create_event', data.id, { title });
  revalidatePath('/account/admin/events');
  revalidatePath('/events');

  return {
    success: true,
    event: {
      ...data,
      ...payload,
      creatorName: admin.full_name ?? 'Admin',
      creatorAvatar: admin.avatar ?? null,
      registrationCount: 0,
      attendedCount: 0,
      confirmedCount: 0,
    },
  };
}

// =============================================================================
// UPDATE EVENT
// =============================================================================

export async function updateEventAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Event ID is required.' };

  const title = formData.get('title')?.trim();
  if (!title) return { error: 'Title is required.' };

  const location = formData.get('location')?.trim();
  if (!location) return { error: 'Location is required.' };

  const start_date = formData.get('start_date');
  if (!start_date) return { error: 'Start date is required.' };

  const rawTags = formData.get('tags') || '';
  const tags = rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const maxP = formData.get('max_participants');
  const max_participants = maxP ? parseInt(maxP, 10) : null;

  const updates = {
    title,
    description: formData.get('description')?.trim() || null,
    content: formData.get('content')?.trim() || null,
    location,
    venue_type: formData.get('venue_type') || 'offline',
    category: formData.get('category') || null,
    status: formData.get('status') || 'draft',
    start_date: new Date(start_date).toISOString(),
    end_date: formData.get('end_date')
      ? new Date(formData.get('end_date')).toISOString()
      : null,
    cover_image: formData.get('cover_image')?.trim() || null,
    registration_required: formData.get('registration_required') === 'true',
    registration_deadline: formData.get('registration_deadline')
      ? new Date(formData.get('registration_deadline')).toISOString()
      : null,
    max_participants,
    is_featured: formData.get('is_featured') === 'true',
    tags: tags.length ? tags : null,
    external_url: formData.get('external_url')?.trim() || null,
    registration_url: formData.get('registration_url')?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  // Set approval fields when publishing
  if (updates.status !== 'draft') {
    updates.approved_by = admin.id;
    updates.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'update_event', id, { title });
  revalidatePath('/account/admin/events');
  revalidatePath('/events');

  return { success: true, event: data };
}

// =============================================================================
// DELETE EVENT
// =============================================================================

export async function deleteEventAction(formData) {
  const admin = await requireAdmin();
  const id = formData.get('id');
  if (!id) return { error: 'Event ID is required.' };

  const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
  if (error) return { error: error.message };

  await logActivity(admin.id, 'delete_event', id, {});
  revalidatePath('/account/admin/events');
  revalidatePath('/events');

  return { success: true };
}

// =============================================================================
// QUICK STATUS CHANGE
// =============================================================================

export async function updateEventStatusAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const status = formData.get('status');
  if (!id || !status) return { error: 'Missing id or status.' };

  const updates = { status, updated_at: new Date().toISOString() };
  if (status !== 'draft') {
    updates.approved_by = admin.id;
    updates.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'update_event_status', id, { status });
  revalidatePath('/account/admin/events');
  revalidatePath('/events');

  return { success: true, event: data };
}

// =============================================================================
// TOGGLE FEATURED
// =============================================================================

export async function toggleEventFeaturedAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const featured = formData.get('featured') === 'true';

  const { data, error } = await supabaseAdmin
    .from('events')
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'toggle_event_featured', id, { featured });
  revalidatePath('/account/admin/events');
  revalidatePath('/events');

  return { success: true, event: data };
}
