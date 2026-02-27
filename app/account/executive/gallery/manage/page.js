import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RoleSync from '@/app/account/_components/RoleSync';
import ManageGalleryClient from './_components/ManageGalleryClient';

export const metadata = { title: 'Gallery Management | Executive | NEUPC' };

export default async function ManageGalleryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive') && !userRoles.includes('admin'))
    redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const { data: items } = await supabaseAdmin
    .from('gallery_items')
    .select(
      `id, url, type, caption, category, tags,
       event_id, is_featured, display_order, created_at,
       event:events(id, title)`
    )
    .order('created_at', { ascending: false })
    .limit(200);

  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title')
    .in('status', ['upcoming', 'ongoing', 'completed'])
    .order('start_date', { ascending: false })
    .limit(50);

  return (
    <>
      <RoleSync role="executive" />
      <ManageGalleryClient
        initialItems={items || []}
        events={events || []}
        userId={user.id}
      />
    </>
  );
}
