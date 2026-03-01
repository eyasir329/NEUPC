/**
 * @file Executive blog management — lists all blog posts with author info,
 *   engagement metrics, and publishing status so executives can create,
 *   edit, feature, or remove posts.
 * @module ExecutiveManageBlogsPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { supabaseAdmin } from '@/app/_lib/supabase';
import ManageBlogsClient from './_components/ManageBlogsClient';

export const metadata = { title: 'Blog Management | Executive | NEUPC' };

export default async function ManageBlogsPage() {
  const { user } = await requireRole(['executive', 'admin']);

  const { data: blogs } = await supabaseAdmin
    .from('blog_posts')
    .select(
      `id, slug, title, excerpt, thumbnail, category, tags,
       status, is_featured, views, likes, published_at,
       created_at, updated_at,
       author:users!blog_posts_author_id_fkey(id, full_name, avatar_url)`
    )
    .order('created_at', { ascending: false })
    .limit(100);

  return <ManageBlogsClient initialBlogs={blogs || []} userId={user.id} />;
}
