/**
 * @file Events page
 * @module EventsPage
 */

import {
  getPublicEvents,
  getPublicFeaturedEvents,
  getPublicUpcomingEvents,
  getAllPublicSettings,
} from '@/app/_lib/actions/public-actions';
import EventsClient from './EventsClient';
import { buildMetadata } from '@/app/_lib/config/seo';
import {
  CollectionPageJsonLd,
  BreadcrumbJsonLd,
} from '@/app/_components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'Events',
  description:
    'Explore upcoming and past events organized by NEUPC — workshops, hackathons, programming contests, seminars, and more.',
  pathname: '/events',
  keywords: [
    'events',
    'workshops',
    'hackathon',
    'programming contest',
    'seminar',
    'tech events',
  ],
});

export default async function EventsPage() {
  // Load every published event once; the client filters/paginates in the
  // browser (same pattern as blogs/roadmaps/gallery/achievements).
  const [events, featured, settings] = await Promise.all([
    getPublicEvents(),
    getPublicFeaturedEvents(),
    getAllPublicSettings(),
  ]);

  // Featured carousel: prefer flagged events, else surface the soonest upcoming
  // one so the section is never empty when events exist.
  let featuredEvents = featured;
  if (!featuredEvents.length) {
    featuredEvents = await getPublicUpcomingEvents(1);
  }

  return (
    <>
      <CollectionPageJsonLd
        name="Events - NEUPC"
        description="Upcoming and past events organized by Netrokona University Programming Club."
        url="/events"
      />
      <BreadcrumbJsonLd
        items={[{ name: 'Home', url: '/' }, { name: 'Events' }]}
      />
      <EventsClient
        events={events}
        featuredEvents={featuredEvents}
        settings={settings}
      />
    </>
  );
}
