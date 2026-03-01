/**
 * @file Events listing client component.
 * Renders paginated event cards with hero and CTA sections.
 *
 * @module EventsClient
 */

'use client';

import { useState } from 'react';
import EventCard from '../_components/ui/EventCard';
import PageHero from '../_components/ui/PageHero';
import CTASection from '../_components/ui/CTASection';
import Pagination from '../_components/ui/Pagination';
import EmptyState from '../_components/ui/EmptyState';
import { useScrollReveal } from '../_lib/hooks';
import { cn } from '../_lib/utils';
import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});

/** @param {{ events?: Object[] }} props */
function EventsClient({ events = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;
  const [eventsRef, eventsVisible] = useScrollReveal({ threshold: 0.05 });

  const totalPages = Math.ceil(events.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      <PageHero
        badgeIcon="📅"
        badge="Upcoming Events"
        title="Events & Activities"
        description="Join us for exciting programming contests, workshops, bootcamps, and tech talks designed to enhance your skills and connect with fellow developers."
        subtitle="From ICPC preparation to beginner-friendly sessions, we organize events that cater to programmers of all skill levels."
        stats={[
          { value: `${events.length}+`, label: 'Events' },
          { value: '50+', label: 'Participants' },
          { value: '10+', label: 'Workshops' },
          { value: '5+', label: 'Contests' },
        ]}
      />

      {/* Events List */}
      <section ref={eventsRef} className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {events.length > 0 ? (
              <>
                <div className="space-y-8 lg:space-y-12">
                  {currentEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className={cn(
                        'transition-all duration-700',
                        eventsVisible
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-8 opacity-0'
                      )}
                      style={{
                        transitionDelay: eventsVisible
                          ? `${index * 150}ms`
                          : '0ms',
                      }}
                    >
                      <EventCard event={event} index={index} />
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <EmptyState
                icon="📭"
                title="No Events Yet"
                description="Check back soon for upcoming events and activities!"
              />
            )}
          </div>
        </div>
      </section>

      <CTASection
        icon="🎯"
        title="Don't Miss Out!"
        description="Stay updated with our latest events and activities. Join our community to receive notifications."
      />

      <ScrollToTop />
    </main>
  );
}

export default EventsClient;
