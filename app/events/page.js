'use client';

import { useState } from 'react';
import EventCard from '../_components/features/EventCard';
import bg_img from '@/public/bg.webp';

function Page() {
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  const events = [
    {
      id: 1,
      title: 'Intra University Programming Contest 2026',
      description:
        'An internal competitive programming contest designed to improve problem-solving skills and prepare students for ICPC and national contests.',
      date: '2026-03-12',
      time: '10:00 AM',
      location: 'CSE Lab-1, Netrokona University',
      image: bg_img,
    },
    {
      id: 2,
      title: 'Competitive Programming Bootcamp (Beginner to Advanced)',
      description:
        'A 5-day intensive bootcamp covering C++, STL, data structures, graph theory, and dynamic programming.',
      date: '2026-02-20',
      time: '2:30 PM',
      location: 'Seminar Room, Dept. of CSE',
      image: bg_img,
    },
    {
      id: 3,
      title: 'ICPC Preparation Workshop',
      description:
        'A special workshop focused on team strategy, advanced algorithms, and real ICPC problem-solving sessions.',
      date: '2026-04-05',
      time: '3:00 PM',
      location: 'CSE Smart Classroom',
      image: bg_img,
    },
    {
      id: 4,
      title: 'Web Development Fundamentals Workshop',
      description:
        'Introduction to modern web development including HTML, CSS, JavaScript, and React basics.',
      date: '2026-01-25',
      time: '11:00 AM',
      location: 'Computer Lab-2',
      image: bg_img,
    },
    {
      id: 5,
      title: 'Women in Engineering Programming Session',
      description:
        'A dedicated programming practice session organized by the WIE branch to encourage and empower female students in competitive programming.',
      date: '2026-02-10',
      time: '1:30 PM',
      location: 'CSE Lab-3',
      image: bg_img,
    },
    {
      id: 6,
      title: 'Career Guidance & Tech Talk 2026',
      description:
        'An interactive session on career paths in software engineering, competitive programming, and research opportunities.',
      date: '2026-03-28',
      time: '12:00 PM',
      location: 'Main Auditorium, Netrokona University',
      image: bg_img,
    },
    {
      id: 7,
      title: 'Weekly Problem Solving Marathon',
      description:
        'A 3-hour problem-solving marathon to practice algorithmic challenges and improve coding speed.',
      date: '2026-01-18',
      time: '4:00 PM',
      location: 'Online (Codeforces Group)',
      image: bg_img,
    },
    {
      id: 8,
      title: 'Annual Programming Fest 2026',
      description:
        'A full-day programming festival featuring contests, project showcases, quiz competitions, and awards.',
      date: '2026-05-15',
      time: '9:00 AM',
      location: 'Netrokona University Campus',
      image: bg_img,
    },
  ];

  // Pagination logic
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0">
          <div className="from-primary-500/10 absolute -top-20 -left-20 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl"></div>
          <div className="from-secondary-500/10 absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-linear-to-tl to-transparent blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 text-sm font-medium backdrop-blur-sm">
              <span className="text-2xl">📅</span>
              <span className="text-primary-300">Upcoming Events</span>
            </div>

            <h1 className="from-primary-300 to-secondary-300 mb-6 bg-linear-to-r via-white bg-clip-text text-4xl leading-tight font-bold text-transparent md:text-5xl lg:text-6xl">
              Events & Activities
            </h1>

            <p className="mx-auto mb-4 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
              Join us for exciting programming contests, workshops, bootcamps,
              and tech talks designed to enhance your skills and connect with
              fellow developers.
            </p>

            <p className="mx-auto max-w-xl text-base text-gray-400">
              From ICPC preparation to beginner-friendly sessions, we organize
              events that cater to programmers of all skill levels.
            </p>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md">
                <div className="text-primary-300 text-3xl font-bold">
                  {events.length}+
                </div>
                <div className="text-sm text-gray-400">Events</div>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md">
                <div className="text-secondary-300 text-3xl font-bold">50+</div>
                <div className="text-sm text-gray-400">Participants</div>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md">
                <div className="text-primary-300 text-3xl font-bold">10+</div>
                <div className="text-sm text-gray-400">Workshops</div>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md">
                <div className="text-secondary-300 text-3xl font-bold">5+</div>
                <div className="text-sm text-gray-400">Contests</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events List Section */}
      <section className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {events.length > 0 ? (
              <>
                <div className="space-y-8 lg:space-y-12">
                  {currentEvents.map((event, index) => (
                    <EventCard event={event} key={event.id} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-col items-center gap-6">
                    {/* Page Info */}
                    <div className="text-center text-sm text-gray-400">
                      Showing {indexOfFirstEvent + 1}-
                      {Math.min(indexOfLastEvent, events.length)} of{' '}
                      {events.length} events
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
                      >
                        <svg
                          className="h-5 w-5"
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

                      {/* Page Numbers */}
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        // Show first, last, current, and adjacent pages
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 &&
                            pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => paginate(pageNumber)}
                              className={`h-10 w-10 rounded-lg font-semibold backdrop-blur-md transition-all ${
                                currentPage === pageNumber
                                  ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return (
                            <span
                              key={pageNumber}
                              className="px-2 text-gray-500"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}

                      {/* Next Button */}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
                      >
                        <svg
                          className="h-5 w-5"
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
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl bg-white/10 p-12 text-center backdrop-blur-md">
                <div className="mb-4 text-6xl">📭</div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  No Events Yet
                </h3>
                <p className="text-gray-400">
                  Check back soon for upcoming events and activities!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20">
        <div className="via-primary-500/5 absolute inset-0 bg-linear-to-b from-transparent to-transparent"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 text-5xl">🎯</div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Don&apos;t Miss Out!
            </h2>
            <p className="mb-8 text-lg text-gray-300">
              Stay updated with our latest events and activities. Join our
              community to receive notifications.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/join"
                className="from-primary-500 to-secondary-500 group inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Join the Club
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
              <a
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Page;
