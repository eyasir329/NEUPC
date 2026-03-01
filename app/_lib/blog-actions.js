/**
 * @file blog actions
 * @module blog-actions
 */

'use server';

import { supabaseAdmin } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';
import { requireAdmin, createLogger, generateSlug } from '@/app/_lib/helpers';
import sanitizeHtml from 'sanitize-html';

const logActivity = createLogger('blog');

// =============================================================================
// CONTENT + MEDIA
// =============================================================================

const BLOG_ASSETS_BUCKET = 'blog-assets';
const ALLOWED_BLOG_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_BLOG_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

function sanitizeBlogHtml(html) {
  return sanitizeHtml(html || '', {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'blockquote',
      'pre',
      'code',
      'ul',
      'ol',
      'li',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'a',
      'img',
      'hr',
      'mark',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      h2: ['id'],
      h3: ['id'],
      code: ['class'],
      span: ['style'],
      p: ['style'],
      mark: ['data-color'],
      pre: ['class'],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^(left|center|right|justify)$/],
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (tagName, attribs) => {
        const href = (attribs.href || '').trim();
        return {
          tagName,
          attribs: {
            ...attribs,
            href,
            target: '_blank',
            rel: 'noopener noreferrer nofollow',
          },
        };
      },
    },
  });
}

export async function uploadBlogImageAction(formData) {
  const admin = await requireAdmin();

  const file = formData.get('file');
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: 'No image provided.' };
  }
  if (file.size > MAX_BLOG_IMAGE_SIZE) {
    return { error: 'Image too large. Maximum size is 5 MB.' };
  }
  if (!ALLOWED_BLOG_IMAGE_TYPES.includes(file.type)) {
    return { error: 'Image type not supported.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `${admin.id}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BLOG_ASSETS_BUCKET)
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Blog image upload error:', uploadError);
    return { error: 'Failed to upload image. Please try again.' };
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BLOG_ASSETS_BUCKET).getPublicUrl(storagePath);

  await logActivity(admin.id, 'blog_image_uploaded', storagePath, {
    filename: file.name,
    path: storagePath,
  });

  return { success: true, url: publicUrl };
}

// =============================================================================
// CREATE BLOG POST
// =============================================================================

export async function createBlogAction(formData) {
  const admin = await requireAdmin();

  const title = formData.get('title')?.trim();
  if (!title) return { error: 'Title is required.' };

  const rawContent = formData.get('content')?.trim();
  if (!rawContent) return { error: 'Content is required.' };
  const content = sanitizeBlogHtml(rawContent);
  if (!content.trim()) return { error: 'Content is required.' };

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

  const rawContent = formData.get('content')?.trim();
  if (!rawContent) return { error: 'Content is required.' };
  const content = sanitizeBlogHtml(rawContent);
  if (!content.trim()) return { error: 'Content is required.' };

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
