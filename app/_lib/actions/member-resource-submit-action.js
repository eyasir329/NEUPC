/**
 * @file Member resource submit action
 * @module member-resource-submit-action
 */

'use server';

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { revalidatePath } from 'next/cache';
import { requireActionAuth } from '@/app/_lib/auth/action-guard';
import {
  normalizeEmbed,
  sanitizeRichHtml,
} from '@/app/_lib/resources/embed-utils';
import { slugify } from '@/app/_lib/resources/constants';
import { parseResourceFormData } from '@/app/_lib/resources/schemas';
import { upsertTags } from '@/app/_lib/actions/resource-actions';

const URL_TYPES = [
  'youtube',
  'external_link',
  'facebook_post',
  'linkedin_post',
];

function buildSubmissionPayload(data, userId) {
  const {
    title,
    description,
    resource_type,
    embed_url,
    thumbnail,
    category_id,
  } = data;

  const base = {
    title: title.trim(),
    description: description?.trim() || null,
    resource_type,
    category_id: category_id || null,
    thumbnail: thumbnail?.trim() || null,
    visibility: 'members',
    // Draft so admin must review/publish
    status: 'draft',
    is_pinned: false,
    created_by: userId,
    updated_at: new Date().toISOString(),
    // Required legacy non-null field
    url: embed_url || `https://neupc.vercel.app/account`,
    category: 'Other',
  };

  if (URL_TYPES.includes(resource_type) && embed_url) {
    const norm = normalizeEmbed(resource_type, embed_url);
    base.embed_url = norm.ok ? norm.url : embed_url;
    base.content = {
      provider: norm.provider || resource_type,
      embedUrl: norm.embedUrl || embed_url,
      videoId: norm.videoId || null,
      submittedByMember: true,
    };
  }

  return base;
}

export async function submitMemberResourceAction(formData) {
  const auth = await requireActionAuth([
    'member',
    'mentor',
    'executive',
    'advisor',
    'admin',
  ]);
  if (auth.error) return { error: auth.error };

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const resource_type = String(formData.get('resource_type') || '');
  const embed_url = String(formData.get('embed_url') || '').trim() || null;
  const thumbnail = String(formData.get('thumbnail') || '').trim() || null;
  const category_id = String(formData.get('category_id') || '').trim() || null;

  if (!title || title.length < 3)
    return { error: 'Title must be at least 3 characters.' };
  if (!resource_type) return { error: 'Resource type is required.' };

  if (URL_TYPES.includes(resource_type)) {
    if (!embed_url)
      return { error: 'A URL is required for this resource type.' };
    try {
      new URL(embed_url);
    } catch {
      return { error: 'Invalid URL format.' };
    }
    const norm = normalizeEmbed(resource_type, embed_url);
    if (!norm.ok) return { error: norm.error || 'Invalid URL for this type.' };
  }

  const payload = buildSubmissionPayload(
    { title, description, resource_type, embed_url, thumbnail, category_id },
    auth.user.id
  );

  const { data, error } = await supabaseAdmin
    .from('resources')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    console.error('Member resource submission error:', error);
    return { error: 'Failed to submit resource. Please try again.' };
  }

  revalidatePath('/account/admin/resources');
  return { success: true, id: data.id };
}

/**
 * Full submission from the block-editor (ResourceFormPanel) for members.
 * Forces draft status + members visibility so admin must review. Does NOT
 * handle file uploads; members can submit URL/rich_text resources.
 */
export async function submitMemberFullResourceAction(formData) {
  const auth = await requireActionAuth([
    'member',
    'mentor',
    'executive',
    'advisor',
    'admin',
  ]);
  if (auth.error) return { error: auth.error };

  const parsed = parseResourceFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues?.[0]?.message || 'Invalid resource payload.',
    };
  }

  const data = parsed.data;

  // Resolve category name (legacy non-null column)
  let categoryName = 'Other';
  if (data.category_id) {
    const { data: catRow } = await supabaseAdmin
      .from('resource_categories')
      .select('name')
      .eq('id', data.category_id)
      .maybeSingle();
    if (catRow?.name) categoryName = catRow.name;
  }

  const payload = {
    title: data.title,
    description: data.description || null,
    url:
      data.embed_url ||
      data.file_url ||
      data.thumbnail ||
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neupc.vercel.app'}/account`,
    resource_type: data.resource_type,
    category: categoryName,
    tags: data.tags?.length ? data.tags : null,
    content: null,
    embed_url: null,
    file_url: data.file_url || null,
    thumbnail: data.thumbnail || null,
    category_id: data.category_id || null,
    // Member submissions always start as drafts pending admin review.
    visibility: 'members',
    status: 'draft',
    is_pinned: false,
    scheduled_for: null,
    published_at: null,
    created_by: auth.user.id,
    updated_at: new Date().toISOString(),
  };

  if (data.content) {
    try {
      const blocks = JSON.parse(data.content);
      if (Array.isArray(blocks)) {
        payload.content = blocks.map((block) => {
          if (block.type === 'richText' || block.type === 'html') {
            return { ...block, content: sanitizeRichHtml(block.content || '') };
          }
          return block;
        });
      } else {
        payload.content = { html: sanitizeRichHtml(data.content || '') };
      }
    } catch {
      if (typeof data.content === 'string' && data.content.trim()) {
        payload.content = { html: sanitizeRichHtml(data.content || '') };
      }
    }
  }

  if (URL_TYPES.includes(data.resource_type) && data.embed_url) {
    const norm = normalizeEmbed(data.resource_type, data.embed_url);
    if (!norm.ok) return { error: norm.error || 'Invalid embed URL.' };
    payload.embed_url = norm.url;
    if (!Array.isArray(payload.content)) {
      payload.content = {
        ...(payload.content || {}),
        provider: norm.provider,
        embedUrl: norm.embedUrl,
        videoId: norm.videoId || null,
        submittedByMember: true,
      };
    }
  }

  const { data: inserted, error } = await supabaseAdmin
    .from('resources')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    console.error('Member full resource submission error:', error);
    return { error: 'Failed to submit resource. Please try again.' };
  }

  try {
    await upsertTags(inserted.id, data.tags);
  } catch (tagError) {
    console.error('Failed to upsert tags during member submission:', tagError);
  }

  revalidatePath('/account/admin/resources');
  revalidatePath('/account/member/resources');
  return { success: true, id: inserted.id };
}

export async function updateMemberResourceAction(formData) {
  const auth = await requireActionAuth([
    'member',
    'mentor',
    'executive',
    'advisor',
    'admin',
  ]);
  if (auth.error) return { error: auth.error };

  const id = formData.get('id');
  if (!id) return { error: 'Resource ID is required.' };

  // Fetch the existing resource to verify ownership
  const { data: resource, error: fetchErr } = await supabaseAdmin
    .from('resources')
    .select('id, created_by, status')
    .eq('id', id)
    .single();

  if (fetchErr || !resource) {
    return { error: 'Resource not found.' };
  }

  // Enforce ownership: only the creator can edit their resource!
  if (resource.created_by !== auth.user.id) {
    return { error: 'You are not authorized to edit this resource.' };
  }

  const parsed = parseResourceFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues?.[0]?.message || 'Invalid resource payload.',
    };
  }

  const data = parsed.data;

  // Resolve category name (legacy non-null column)
  let categoryName = 'Other';
  if (data.category_id) {
    const { data: catRow } = await supabaseAdmin
      .from('resource_categories')
      .select('name')
      .eq('id', data.category_id)
      .maybeSingle();
    if (catRow?.name) categoryName = catRow.name;
  }

  const payload = {
    title: data.title,
    description: data.description || null,
    url:
      data.embed_url ||
      data.file_url ||
      data.thumbnail ||
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neupc.vercel.app'}/account`,
    resource_type: data.resource_type,
    category: categoryName,
    content: null,
    embed_url: null,
    file_url: data.file_url || null,
    thumbnail: data.thumbnail || null,
    category_id: data.category_id || null,
    updated_at: new Date().toISOString(),
  };

  if (data.content) {
    try {
      const blocks = JSON.parse(data.content);
      if (Array.isArray(blocks)) {
        payload.content = blocks.map((block) => {
          if (block.type === 'richText' || block.type === 'html') {
            return { ...block, content: sanitizeRichHtml(block.content || '') };
          }
          return block;
        });
      } else {
        payload.content = { html: sanitizeRichHtml(data.content || '') };
      }
    } catch {
      if (typeof data.content === 'string' && data.content.trim()) {
        payload.content = { html: sanitizeRichHtml(data.content || '') };
      }
    }
  }

  if (URL_TYPES.includes(data.resource_type) && data.embed_url) {
    const norm = normalizeEmbed(data.resource_type, data.embed_url);
    if (!norm.ok) return { error: norm.error || 'Invalid embed URL.' };
    payload.embed_url = norm.url;
    if (!Array.isArray(payload.content)) {
      payload.content = {
        ...(payload.content || {}),
        provider: norm.provider,
        embedUrl: norm.embedUrl,
        videoId: norm.videoId || null,
      };
    }
  }

  const { error: updateErr } = await supabaseAdmin
    .from('resources')
    .update(payload)
    .eq('id', id);

  if (updateErr) {
    console.error('Member resource update error:', updateErr);
    return { error: 'Failed to update resource. Please try again.' };
  }

  try {
    await upsertTags(id, data.tags);
  } catch (tagError) {
    console.error('Failed to upsert tags during member edit:', tagError);
  }

  revalidatePath('/account/admin/resources');
  revalidatePath('/account/member/resources');
  return { success: true };
}

export async function deleteMemberResourceAction(id) {
  const auth = await requireActionAuth([
    'member',
    'mentor',
    'executive',
    'advisor',
    'admin',
  ]);
  if (auth.error) return { error: auth.error };

  if (!id) return { error: 'Resource ID is required.' };

  // Fetch resource to verify ownership
  const { data: resource, error: fetchErr } = await supabaseAdmin
    .from('resources')
    .select('id, created_by')
    .eq('id', id)
    .single();

  if (fetchErr || !resource) {
    return { error: 'Resource not found.' };
  }

  if (resource.created_by !== auth.user.id) {
    return { error: 'You are not authorized to delete this resource.' };
  }

  const { error: deleteErr } = await supabaseAdmin
    .from('resources')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    console.error('Member resource delete error:', deleteErr);
    return { error: 'Failed to delete resource. Please try again.' };
  }

  revalidatePath('/account/admin/resources');
  revalidatePath('/account/member/resources');
  return { success: true };
}
