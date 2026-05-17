'use server';

import { supabaseAdmin } from './supabase';
import { revalidatePath } from 'next/cache';
import { requireActionAuth } from './action-guard';
import { normalizeEmbed } from './resources/embed-utils';
import { slugify } from './resources/constants';

const URL_TYPES = ['youtube', 'external_link', 'facebook_post', 'linkedin_post'];

function buildSubmissionPayload(data, userId) {
  const { title, description, resource_type, embed_url, thumbnail, category_id } = data;

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
  const auth = await requireActionAuth('member');
  if (auth.error) return { error: auth.error };

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const resource_type = String(formData.get('resource_type') || '');
  const embed_url = String(formData.get('embed_url') || '').trim() || null;
  const thumbnail = String(formData.get('thumbnail') || '').trim() || null;
  const category_id = String(formData.get('category_id') || '').trim() || null;

  if (!title || title.length < 3) return { error: 'Title must be at least 3 characters.' };
  if (!resource_type) return { error: 'Resource type is required.' };

  if (URL_TYPES.includes(resource_type)) {
    if (!embed_url) return { error: 'A URL is required for this resource type.' };
    try { new URL(embed_url); } catch { return { error: 'Invalid URL format.' }; }
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
