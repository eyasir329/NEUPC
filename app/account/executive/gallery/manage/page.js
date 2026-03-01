/**
 * @file Executive gallery management — fetches all gallery items with
 *   associated event data and provides tools for uploading, categorising,
 *   tagging, and reordering media content.
 * @module ExecutiveManageGalleryPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { supabaseAdmin } from '@/app/_lib/supabase';
import ManageGalleryClient from './_components/ManageGalleryClient';

export const metadata = { title: 'Gallery Management | Executive | NEUPC' };

export default async function ManageGalleryPage() {
  const { user } = await requireRole(['executive', 'admin']);

  const [{ data: items }, { data: events }] = await Promise.all([
    supabaseAdmin
      .from('gallery_items')
      .select(
        `id, url, type, caption, category, tags,
         event_id, is_featured, display_order, created_at,
         event:events(id, title)`
      )
      .order('created_at', { ascending: false })
      .limit(200),
    supabaseAdmin
      .from('events')
      .select('id, title')
      .in('status', ['upcoming', 'ongoing', 'completed'])
      .order('start_date', { ascending: false })
      .limit(50),
  ]);

  return (
    <ManageGalleryClient
      initialItems={items || []}
      events={events || []}
      userId={user.id}
    />
  );
}
