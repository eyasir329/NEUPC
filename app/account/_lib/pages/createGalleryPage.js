/**
 * @file Factory for the gallery management page. Shared by the admin and
 *   executive panels; the only per-role difference is the "back to
 *   dashboard" link, supplied via `role`.
 *
 * @module account/_lib/pages/createGalleryPage
 */

import {
  getGalleryAdmin,
  getAllEvents,
  getAllEventGalleryAdmin,
} from '@/app/_lib/data-service';
import GalleryManagementClient from '@/app/account/_components/gallery/GalleryManagementClient';

/**
 * Build the gallery management page component.
 * @param {string} role panel role, used for the dashboard back-link
 */
export function createGalleryPage(role) {
  return async function GalleryPage() {
    const [{ items, stats }, allEvents, eventGalleryItems] = await Promise.all([
      getGalleryAdmin().catch(() => ({ items: [], stats: {} })),
      getAllEvents().catch(() => []),
      getAllEventGalleryAdmin().catch(() => []),
    ]);

    const events = (allEvents ?? []).map((e) => ({ id: e.id, title: e.title }));

    return (
      <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
        <GalleryManagementClient
          initialItems={items}
          stats={stats}
          events={events}
          eventGalleryItems={eventGalleryItems}
          dashboardHref={`/account/${role}`}
        />
      </div>
    );
  };
}
