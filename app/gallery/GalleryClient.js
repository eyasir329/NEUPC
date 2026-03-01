/**
 * @file Gallery page client component.
 * Filterable photo gallery with lightbox modal and keyboard navigation.
 *
 * @module GalleryClient
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import CTASection from '../_components/ui/CTASection';
import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});
import EmptyState from '../_components/ui/EmptyState';
import PageBackground from '../_components/ui/PageBackground';
import { useDelayedLoad, useScrollReveal } from '../_lib/hooks';
import { cn } from '../_lib/utils';

/** @type {{ id: string, label: string }[]} Filter categories */
const CATEGORIES = [
  { id: 'all', label: 'All Events' },
  { id: 'Competition', label: 'Competitions' },
  { id: 'Workshop', label: 'Workshops' },
  { id: 'Activity', label: 'Activities' },
  { id: 'ICPC', label: 'ICPC' },
];

/** @type {{ id: number, value: string, label: string }[]} Default stats */
const DEFAULT_STATS = [
  { id: 1, value: '30+', label: 'Events Hosted' },
  { id: 2, value: '200+', label: 'Active Members' },
  { id: 3, value: '5+', label: 'Competitions' },
  { id: 4, value: '1000+', label: 'Photos Captured' },
];

/**
 * Normalize a gallery item from DB format.
 * @param {Object} item - Raw gallery item from DB
 * @returns {Object} Normalized gallery item
 */
function normalizeItem(item) {
  return {
    id: item.id,
    title: item.title || '',
    category: item.category || 'Activity',
    year:
      item.year ||
      (item.event_date
        ? new Date(item.event_date).getFullYear().toString()
        : item.created_at
          ? new Date(item.created_at).getFullYear().toString()
          : ''),
    image:
      item.image ||
      item.image_url ||
      item.thumbnail ||
      '/images/placeholder.jpg',
    description: item.description || '',
    date: item.date || item.event_date || item.created_at || '',
  };
}

/**
 * Format a date string for display.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDisplayDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Single gallery card with hover effects.
 * @param {{ item: Object, onClick: Function }} props
 */
function GalleryCard({ item, onClick }) {
  return (
    <div
      className="group hover:border-primary-500/30 hover:shadow-primary-500/10 relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
      onClick={() => onClick(item)}
    >
      {/* Image */}
      <div className="relative aspect-4/3 cursor-pointer overflow-hidden bg-gray-900">
        <div className="from-primary-500/20 to-secondary-500/20 absolute inset-0 animate-pulse bg-linear-to-br via-purple-500/15" />
        <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

        <div className="absolute top-3 left-3 z-10 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {item.category}
        </div>
        <div className="absolute top-3 right-3 z-10 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {item.year}
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100" />
        <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 scale-75 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
          <div className="shadow-primary-500/50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-white/20 shadow-lg backdrop-blur-lg">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 sm:p-5">
        <h3 className="group-hover:text-primary-300 mb-2 text-base leading-tight font-bold text-white transition-colors duration-300 sm:text-lg">
          {item.title}
        </h3>
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-400 transition-colors group-hover:text-gray-300 sm:text-sm">
          {item.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-gray-400">{formatDisplayDate(item.date)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightbox navigation button.
 * @param {{ direction: 'prev'|'next', onClick: Function }} props
 */
function LightboxNavButton({ direction, onClick }) {
  const isPrev = direction === 'prev';
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'group hover:border-primary-500/50 hover:bg-primary-500/20 hover:shadow-primary-500/50 absolute z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:shadow-lg sm:h-12 sm:w-12',
        isPrev ? 'left-4' : 'right-4'
      )}
    >
      <svg
        className={cn(
          'h-6 w-6 transition-transform duration-300',
          isPrev ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isPrev ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  );
}

/**
 * Gallery page with filtering, grid layout, and lightbox.
 * @param {{ galleryItems?: Object[], stats?: Object[] }} props
 */
export default function GalleryClient({
  galleryItems: propItems = [],
  stats: propStats = [],
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const isLoaded = useDelayedLoad();
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.05 });

  const galleryItems = propItems.map(normalizeItem);
  const stats = propStats.length > 0 ? propStats : DEFAULT_STATS;
  const filteredItems =
    activeFilter === 'all'
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeFilter);

  const navigate = useCallback(
    (dir) => {
      if (!selectedImage) return;
      const idx = filteredItems.findIndex(
        (item) => item.id === selectedImage.id
      );
      const next =
        dir === 'next'
          ? (idx + 1) % filteredItems.length
          : (idx - 1 + filteredItems.length) % filteredItems.length;
      setSelectedImage(filteredItems[next]);
    },
    [selectedImage, filteredItems]
  );

  // Manage body overflow
  useEffect(() => {
    document.body.style.overflow = selectedImage ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedImage) return;
    const handler = (e) => {
      if (e.key === 'Escape') setSelectedImage(null);
      else if (e.key === 'ArrowRight') navigate('next');
      else if (e.key === 'ArrowLeft') navigate('prev');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedImage, navigate]);

  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8 lg:py-28">
        <PageBackground />

        <div className="relative mx-auto max-w-7xl text-center">
          <div
            className={cn(
              'text-primary-300 ring-primary-500/20 bg-primary-500/10 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-all duration-700 sm:text-sm',
              isLoaded
                ? 'translate-y-0 opacity-100'
                : '-translate-y-4 opacity-0'
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Photo Gallery
          </div>

          <h1
            className={cn(
              'from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-3xl leading-tight font-extrabold text-transparent transition-all delay-100 duration-700 sm:text-4xl md:text-5xl lg:text-6xl',
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
          >
            Moments That Define Us
          </h1>

          <p
            className={cn(
              'mx-auto mb-10 max-w-3xl text-sm leading-relaxed text-gray-300 transition-all delay-200 duration-700 sm:text-base md:text-lg lg:text-xl',
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
          >
            Capturing innovation, teamwork, and excellence at Netrokona
            University Programming Club. Every photo tells a story of growth,
            learning, and community.
          </p>

          {/* Stats */}
          <div
            className={cn(
              'mx-auto grid max-w-5xl gap-4 transition-all delay-300 duration-700 sm:grid-cols-2 lg:grid-cols-4',
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
          >
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="group hover:border-primary-500/30 hover:shadow-primary-500/10 relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:bg-white/10 hover:shadow-xl"
              >
                <div className="from-primary-500/0 via-primary-500/5 to-secondary-500/0 absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <div className="group-hover:text-primary-300 mb-1 text-2xl font-bold text-white transition-all sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-400 transition-all group-hover:text-gray-300 sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 shadow-lg backdrop-blur-xl sm:gap-3 sm:p-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all duration-300 sm:px-6 sm:py-2.5 sm:text-sm',
                    activeFilter === cat.id
                      ? 'from-primary-500/40 to-secondary-500/40 ring-primary-500/20 bg-linear-to-r text-white shadow-lg ring-2'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white hover:ring-1 hover:ring-white/10'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="inline-flex items-center gap-2 text-sm text-gray-400">
              <svg
                className="text-primary-400 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Showing{' '}
              <span className="text-primary-300 font-semibold">
                {filteredItems.length}
              </span>{' '}
              {filteredItems.length === 1 ? 'event' : 'events'}
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section
        ref={gridRef}
        className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'transition-all duration-700',
                  gridVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                )}
                style={{
                  transitionDelay: gridVisible ? `${index * 80}ms` : '0ms',
                }}
              >
                <GalleryCard item={item} onClick={setSelectedImage} />
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <EmptyState
              icon="📷"
              title="No events found"
              description="Try selecting a different category"
            />
          )}
        </div>
      </section>

      <CTASection
        icon="📸"
        title="Join the Programming Club Today"
        description="Be part of creating these memorable moments. Join us in our next competition, workshop, or community event."
        primaryAction={{ label: 'Become a Member', href: '/join' }}
        secondaryAction={{ label: 'View Upcoming Events', href: '/events' }}
      />

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="group absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-red-500/50 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/50 sm:h-12 sm:w-12"
          >
            <svg
              className="h-6 w-6 transition-transform group-hover:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <LightboxNavButton
            direction="prev"
            onClick={() => navigate('prev')}
          />
          <LightboxNavButton
            direction="next"
            onClick={() => navigate('next')}
          />

          <div
            className="relative max-h-[90vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-xl">
              <div className="relative aspect-16/10 bg-gray-900">
                <div className="from-primary-500/20 to-secondary-500/20 absolute inset-0 animate-pulse bg-linear-to-br via-purple-500/15" />
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent opacity-50" />
              </div>

              <div className="border-t border-white/10 bg-linear-to-b from-transparent to-black/20 p-4 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="border-primary-500/30 bg-primary-500/10 text-primary-300 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm">
                    {selectedImage.category}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                    {selectedImage.year}
                  </span>
                </div>
                <h2 className="mb-2 text-xl leading-tight font-bold text-white sm:text-2xl lg:text-3xl">
                  {selectedImage.title}
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-gray-300 sm:text-base">
                  {selectedImage.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400 sm:text-sm">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{formatDisplayDate(selectedImage.date)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <p className="flex items-center gap-2 text-xs text-gray-400 sm:text-sm">
                  <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                    ←
                  </kbd>
                  <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                    →
                  </kbd>
                  <span>Navigate</span>
                </p>
                <span className="text-gray-500">•</span>
                <p className="flex items-center gap-2 text-xs text-gray-400 sm:text-sm">
                  <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                    ESC
                  </kbd>
                  <span>Close</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollToTop />
    </main>
  );
}
