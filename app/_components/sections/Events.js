import Link from 'next/link';

function Events() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-transparent"></div>
      <div className="from-primary-500/10 via-secondary-500/10 to-primary-500/10 pointer-events-none absolute inset-0 bg-linear-to-br opacity-30"></div>

      {/* Decorative Blur Circles */}
      <div className="from-primary-500/20 to-secondary-500/20 absolute -top-40 -left-40 h-96 w-96 rounded-full bg-linear-to-br blur-3xl"></div>
      <div className="from-secondary-500/20 to-primary-500/20 absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-linear-to-br blur-3xl"></div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="mb-12 text-center md:mb-16 lg:mb-20">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md transition-all hover:bg-white/15 hover:shadow-xl md:mb-6">
              <span className="text-2xl">🎯</span>
              <span className="text-primary-300">Upcoming Events</span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-white md:mb-6 md:text-5xl lg:text-6xl">
              Recent Events
            </h2>
            <div className="from-primary-500 via-secondary-300 to-primary-500 shadow-glow mx-auto h-1.5 w-32 rounded-full bg-linear-to-r md:w-40"></div>
            <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300 md:text-lg lg:text-xl">
              Join our upcoming workshops, contests, and tech talks to enhance
              your skills and connect with the community
            </p>
          </div>

          {/* Events Grid */}
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
            {/* Event Card 1 - Bootcamp */}
            <div className="group hover:border-primary-500/50 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl md:p-8">
              {/* Gradient Overlay */}
              <div className="from-primary-500/20 via-primary-400/10 absolute -top-10 -right-10 h-40 w-40 rounded-full bg-linear-to-br to-transparent opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"></div>

              {/* Top Border Accent */}
              <div className="from-primary-500 to-secondary-500 absolute top-0 left-0 h-1 w-0 bg-linear-to-r transition-all duration-500 group-hover:w-full"></div>

              <div className="relative">
                {/* Category Badge */}
                <div className="bg-primary-500/20 text-primary-300 border-primary-500/30 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-md">
                  <span className="text-base">📚</span>
                  Bootcamp
                </div>

                {/* Event Title */}
                <h3 className="from-primary-300 via-primary-200 to-secondary-300 mb-3 bg-linear-to-r bg-clip-text text-xl leading-tight font-bold text-transparent transition-all duration-300 group-hover:scale-[1.02] md:mb-4 md:text-2xl">
                  Competitive Programming Bootcamp
                </h3>

                {/* Description */}
                <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-300 transition-colors group-hover:text-gray-200 md:text-base">
                  A 5-day intensive bootcamp covering C++, STL, data structures,
                  graph theory, and dynamic programming.
                </p>

                {/* Event Info Grid */}
                <div className="mb-6 space-y-3 text-sm md:text-base">
                  <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
                    <div className="from-primary-500/20 to-primary-600/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                      <svg
                        className="text-primary-300 h-5 w-5"
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
                    </div>
                    <span className="text-primary-300 font-medium">
                      Feb 20, 2026
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
                    <div className="from-primary-500/20 to-primary-600/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                      <svg
                        className="text-primary-300 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <span className="truncate">Seminar Room, CSE</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
                    <div className="from-primary-500/20 to-primary-600/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                      <svg
                        className="text-primary-300 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <span>50+ Participants</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/events/2"
                  className="from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 group/link hover:shadow-primary-500/50 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] md:text-base"
                >
                  Learn More
                  <svg
                    className="h-5 w-5 transition-transform group-hover/link:translate-x-1"
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
                </Link>
              </div>
            </div>

            {/* Event Card 2 - Contest */}
            <div className="group hover:border-secondary-500/50 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl md:p-8">
              {/* Gradient Overlay */}
              <div className="from-secondary-500/20 via-secondary-400/10 absolute -top-10 -right-10 h-40 w-40 rounded-full bg-linear-to-br to-transparent opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"></div>

              {/* Top Border Accent */}
              <div className="from-secondary-500 to-primary-500 absolute top-0 left-0 h-1 w-0 bg-linear-to-r transition-all duration-500 group-hover:w-full"></div>

              <div className="relative">
                {/* Category Badge */}
                <div className="bg-secondary-500/20 text-secondary-300 border-secondary-500/30 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-md">
                  <span className="text-base">🏆</span>
                  Contest
                </div>

                {/* Event Title */}
                <h3 className="from-secondary-300 via-secondary-200 to-primary-300 mb-3 bg-linear-to-r bg-clip-text text-xl leading-tight font-bold text-transparent transition-all duration-300 group-hover:scale-[1.02] md:mb-4 md:text-2xl">
                  Intra University Programming Contest 2026
                </h3>

                {/* Description */}
                <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-300 transition-colors group-hover:text-gray-200 md:text-base">
                  An internal competitive programming contest designed to
                  improve problem-solving skills and prepare students for ICPC.
                </p>

                {/* Event Info Grid */}
                <div className="mb-6 space-y-3 text-sm md:text-base">
                  <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
                    <div className="from-secondary-500/20 to-secondary-600/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                      <svg
                        className="text-secondary-300 h-5 w-5"
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
                    </div>
                    <span className="text-secondary-300 font-medium">
                      Mar 12, 2026
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
                    <div className="from-secondary-500/20 to-secondary-600/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                      <svg
                        className="text-secondary-300 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <span className="truncate">CSE Lab-1, NU</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
                    <div className="from-secondary-500/20 to-secondary-600/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                      <svg
                        className="text-secondary-300 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <span>100+ Participants</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/events/1"
                  className="from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 group/link hover:shadow-secondary-500/50 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] md:text-base"
                >
                  Learn More
                  <svg
                    className="h-5 w-5 transition-transform group-hover/link:translate-x-1"
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
                </Link>
              </div>
            </div>

            {/* Event Card 3 - Tech Talk */}
            <div className="group hover:border-primary-500/50 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl md:col-span-2 md:p-8 xl:col-span-1">
              {/* Gradient Overlay */}
              <div className="from-primary-500/20 via-primary-400/10 absolute -top-10 -right-10 h-40 w-40 rounded-full bg-linear-to-br to-transparent opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"></div>

              {/* Top Border Accent */}
              <div className="from-primary-500 to-secondary-500 absolute top-0 left-0 h-1 w-0 bg-linear-to-r transition-all duration-500 group-hover:w-full"></div>

              <div className="relative">
                {/* Category Badge */}
                <div className="bg-primary-500/20 text-primary-300 border-primary-500/30 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-md">
                  <span className="text-base">💼</span>
                  Tech Talk
                </div>

                {/* Event Title */}
                <h3 className="from-primary-300 via-primary-200 to-secondary-300 mb-3 bg-linear-to-r bg-clip-text text-xl leading-tight font-bold text-transparent transition-all duration-300 group-hover:scale-[1.02] md:mb-4 md:text-2xl">
                  Career Guidance & Tech Talk 2026
                </h3>

                {/* Description */}
                <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-300 transition-colors group-hover:text-gray-200 md:text-base">
                  An interactive session on career paths in software
                  engineering, competitive programming, and research
                  opportunities.
                </p>

                {/* Event Info Grid */}
                <div className="mb-6 space-y-3 text-sm md:text-base">
                  <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
                    <div className="from-primary-500/20 to-primary-600/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                      <svg
                        className="text-primary-300 h-5 w-5"
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
                    </div>
                    <span className="text-primary-300 font-medium">
                      Mar 28, 2026
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
                    <div className="from-primary-500/20 to-primary-600/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                      <svg
                        className="text-primary-300 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <span className="truncate">Main Auditorium, NU</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
                    <div className="from-primary-500/20 to-primary-600/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                      <svg
                        className="text-primary-300 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <span>200+ Participants</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/events/6"
                  className="from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 group/link hover:shadow-primary-500/50 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] md:text-base"
                >
                  Learn More
                  <svg
                    className="h-5 w-5 transition-transform group-hover/link:translate-x-1"
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
                </Link>
              </div>
            </div>
          </div>

          {/* View All Events Button */}
          <div className="mt-12 text-center md:mt-16">
            <Link
              href="/events"
              className="from-primary-500 via-secondary-500 to-primary-600 hover:shadow-3xl group hover:shadow-primary-500/50 relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-linear-to-r px-8 py-4 text-base font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 md:px-12 md:py-5 md:text-lg"
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>

              <span className="relative">View All Events</span>
              <svg
                className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 md:h-6 md:w-6"
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
          </div>
        </div>
      </div>
    </section>
  );
}

export default Events;
