/**
 * @file Member gallery browser — displays club photo and media gallery
 *   with category filtering and statistics for member viewing.
 * @module MemberGalleryPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getGalleryAdmin } from '@/app/_lib/data-service';
import MemberGalleryClient from './_components/MemberGalleryClient';

export const metadata = { title: 'Gallery | Member | NEUPC' };

export default async function MemberGalleryPage() {
  await requireRole('member');

  const { items, stats } = await getGalleryAdmin().catch(() => ({
    items: [],
    stats: {},
  }));

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberGalleryClient items={items} stats={stats} />
    </div>
  );
}
