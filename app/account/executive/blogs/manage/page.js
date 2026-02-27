import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import ManageBlogsClient from './_components/ManageBlogsClient';

export const metadata = { title: 'Blog Management | Executive | NEUPC' };

export default async function ManageBlogsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive') && !userRoles.includes('admin'))
    redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

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

  return (
    <>
      <RoleSync role="executive" />
      <ManageBlogsClient initialBlogs={blogs || []} userId={user.id} />
    </>
  );
}
