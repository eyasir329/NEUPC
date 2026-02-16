'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger animations on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gallery data
  const galleryItems = [
    {
      id: 1,
      title: 'Intra University Programming Contest 2025',
      category: 'Competition',
      year: '2025',
      image: '/images/contest1.jpg',
      description:
        'Students competing in a 3-hour problem solving session with 50+ participants.',
      date: '2025-02-15',
    },
    {
      id: 2,
      title: 'Web Development Workshop',
      category: 'Workshop',
      year: '2025',
      image: '/images/workshop1.jpg',
      description:
        'Hands-on session on React and Next.js with industry experts.',
      date: '2025-01-20',
    },
    {
      id: 3,
      title: 'ICPC Regional Dhaka 2024',
      category: 'ICPC',
      year: '2024',
      image: '/images/icpc1.jpg',
      description:
        'Our team representing Netrokona University at ICPC Regionals.',
      date: '2024-11-10',
    },
    {
      id: 4,
      title: 'Freshers Orientation Program',
      category: 'Activity',
      year: '2025',
      image: '/images/orientation1.jpg',
      description: 'Welcoming new members to the programming club family.',
      date: '2025-01-05',
    },
    {
      id: 5,
      title: 'Git & GitHub Workshop',
      category: 'Workshop',
      year: '2024',
      image: '/images/git-workshop.jpg',
      description:
        'Version control fundamentals and collaborative coding practices.',
      date: '2024-12-15',
    },
    {
      id: 6,
      title: 'National Programming Contest',
      category: 'Competition',
      year: '2024',
      image: '/images/npc1.jpg',
      description:
        'University teams competing at national level programming contest.',
      date: '2024-10-20',
    },
    {
      id: 7,
      title: 'AI/ML Bootcamp',
      category: 'Workshop',
      year: '2025',
      image: '/images/ai-workshop.jpg',
      description:
        'Deep dive into machine learning algorithms and practical applications.',
      date: '2025-02-01',
    },
    {
      id: 8,
      title: 'Weekly Problem Solving Session',
      category: 'Activity',
      year: '2025',
      image: '/images/weekly-session.jpg',
      description:
        'Regular practice session with peer learning and mentorship.',
      date: '2025-01-28',
    },
    {
      id: 9,
      title: 'Tech Fest 2024',
      category: 'Activity',
      year: '2024',
      image: '/images/tech-fest.jpg',
      description:
        'Annual technology festival showcasing student projects and innovations.',
      date: '2024-09-15',
    },
    {
      id: 10,
      title: 'Industry Guest Talk',
      category: 'Workshop',
      year: '2024',
      image: '/images/guest-talk.jpg',
      description:
        'Software industry professionals sharing career insights and experiences.',
      date: '2024-11-25',
    },
    {
      id: 11,
      title: 'Codeforces Meetup',
      category: 'Competition',
      year: '2024',
      image: '/images/cf-meetup.jpg',
      description:
        'Community gathering for competitive programming enthusiasts.',
      date: '2024-12-05',
    },
    {
      id: 12,
      title: 'Team Study Group',
      category: 'Activity',
      year: '2025',
      image: '/images/study-group.jpg',
      description: 'Collaborative learning sessions on advanced algorithms.',
      date: '2025-01-15',
    },
  ];

  // Filter categories
  const categories = [
    { id: 'all', label: 'All Events' },
    { id: 'Competition', label: 'Competitions' },
    { id: 'Workshop', label: 'Workshops' },
    { id: 'Activity', label: 'Activities' },
    { id: 'ICPC', label: 'ICPC' },
  ];

  // Gallery stats
  const stats = [
    { id: 1, value: '30+', label: 'Events Hosted', color: 'primary' },
    { id: 2, value: '200+', label: 'Active Members', color: 'secondary' },
    { id: 3, value: '5+', label: 'Competitions', color: 'purple' },
    { id: 4, value: '1000+', label: 'Photos Captured', color: 'pink' },
  ];

  // Filter images
  const filteredItems =
    activeFilter === 'all'
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeFilter);

  // Lightbox handlers
  const openLightbox = (item) => {
    setSelectedImage(item);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  // Manage body overflow when lightbox is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        const currentIndex = filteredItems.findIndex(
          (item) => item.id === selectedImage.id
        );
        const nextIndex = (currentIndex + 1) % filteredItems.length;
        setSelectedImage(filteredItems[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = filteredItems.findIndex(
          (item) => item.id === selectedImage.id
        );
        const prevIndex =
          (currentIndex - 1 + filteredItems.length) % filteredItems.length;
        setSelectedImage(filteredItems[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedImage, filteredItems]);

  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8 lg:py-28">
        {/* Animated Decorative Elements */}
        <div className="from-primary-500/10 fixed top-20 right-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"></div>
        <div
          className="from-secondary-500/10 fixed bottom-20 left-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"
          style={{ animationDelay: '1s' }}
        ></div>

        <div className="relative mx-auto max-w-7xl text-center">
          <div
            className={`text-primary-300 ring-primary-500/20 bg-primary-500/10 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-all duration-700 sm:text-sm ${
              isLoaded
                ? 'translate-y-0 opacity-100'
                : '-translate-y-4 opacity-0'
            }`}
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
            className={`from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-3xl leading-tight font-extrabold text-transparent transition-all delay-100 duration-700 sm:text-4xl md:text-5xl lg:text-6xl ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            Moments That Define Us
          </h1>

          <p
            className={`mx-auto mb-10 max-w-3xl text-sm leading-relaxed text-gray-300 transition-all delay-200 duration-700 sm:text-base md:text-lg lg:text-xl ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            Capturing innovation, teamwork, and excellence at Netrokona
            University Programming Club. Every photo tells a story of growth,
            learning, and community.
          </p>

          {/* Gallery Stats */}
          <div
            className={`mx-auto grid max-w-5xl gap-4 transition-all delay-300 duration-700 sm:grid-cols-2 lg:grid-cols-4 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.id}
                className="group hover:border-primary-500/30 hover:shadow-primary-500/10 relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:bg-white/10 hover:shadow-xl"
                style={{ transitionDelay: `${(index + 3) * 100}ms` }}
              >
                {/* Glow Effect */}
                <div className="from-primary-500/0 via-primary-500/5 to-secondary-500/0 absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

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

      {/* Filter Section */}
      <section className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 shadow-lg backdrop-blur-xl sm:gap-3 sm:p-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(category.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all duration-300 sm:px-6 sm:py-2.5 sm:text-sm ${
                    activeFilter === category.id
                      ? 'from-primary-500/40 to-secondary-500/40 ring-primary-500/20 bg-linear-to-r text-white shadow-lg ring-2'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white hover:ring-1 hover:ring-white/10'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
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
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="group hover:border-primary-500/30 hover:shadow-primary-500/10 animate-fade-in relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => openLightbox(item)}
              >
                {/* Image Container */}
                <div className="relative aspect-4/3 cursor-pointer overflow-hidden bg-gray-900">
                  {/* Placeholder background with animated gradient */}
                  <div className="from-primary-500/20 to-secondary-500/20 absolute inset-0 animate-pulse bg-linear-to-br via-purple-500/15"></div>

                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 z-10 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {item.category}
                  </div>

                  {/* Year Badge */}
                  <div className="absolute top-3 right-3 z-10 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    {item.year}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100"></div>

                  {/* Zoom Icon */}
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

                {/* Image Info */}
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
                    <span className="text-gray-400">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-primary-300 border-primary-500/20 shadow-primary-500/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border bg-white/5 shadow-lg">
                <svg
                  className="h-10 w-10 opacity-50"
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
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">
                No events found
              </h3>
              <p className="text-gray-400">
                Try selecting a different category
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 text-6xl">📸</div>
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Join the Programming Club Today
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-gray-300 sm:text-base lg:text-lg">
            Be part of creating these memorable moments. Join us in our next
            competition, workshop, or community event.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/join"
              className="group border-primary-500/50 from-primary-500/40 to-secondary-500/40 hover:shadow-primary-500/50 hover:border-primary-500/70 relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border bg-linear-to-r px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              <span>Become a Member</span>
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/events"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-white/10 hover:shadow-lg active:scale-95 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              <span>View Upcoming Events</span>
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
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
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
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

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filteredItems.findIndex(
                (item) => item.id === selectedImage.id
              );
              const prevIndex =
                (currentIndex - 1 + filteredItems.length) %
                filteredItems.length;
              setSelectedImage(filteredItems[prevIndex]);
            }}
            className="group hover:border-primary-500/50 hover:bg-primary-500/20 hover:shadow-primary-500/50 absolute left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:shadow-lg sm:h-12 sm:w-12"
          >
            <svg
              className="h-6 w-6 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filteredItems.findIndex(
                (item) => item.id === selectedImage.id
              );
              const nextIndex = (currentIndex + 1) % filteredItems.length;
              setSelectedImage(filteredItems[nextIndex]);
            }}
            className="group hover:border-primary-500/50 hover:bg-primary-500/20 hover:shadow-primary-500/50 absolute right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:shadow-lg sm:h-12 sm:w-12"
          >
            <svg
              className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Image Content */}
          <div
            className="relative max-h-[90vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-xl">
              {/* Image */}
              <div className="relative aspect-16/10 bg-gray-900">
                <div className="from-primary-500/20 to-secondary-500/20 absolute inset-0 animate-pulse bg-linear-to-br via-purple-500/15"></div>

                {/* Subtle Shimmer */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent opacity-50"></div>
              </div>

              {/* Info */}
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
                  <span>
                    {new Date(selectedImage.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Hint */}
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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="group animate-fade-in fixed right-4 bottom-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-white/30 hover:bg-white/20 active:scale-95 sm:right-6 sm:bottom-6 sm:h-12 sm:w-12 lg:right-8 lg:bottom-8"
          aria-label="Scroll to top"
        >
          <svg
            className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </main>
  );
}
