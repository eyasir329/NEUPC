import Link from "next/link";

function Blogs() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20 lg:py-24">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/30 to-transparent"></div>
      <div className="from-primary-500/10 via-secondary-500/10 to-primary-500/10 pointer-events-none absolute inset-0 bg-linear-to-br opacity-40"></div>

      {/* Animated Decorative Elements */}
      <div className="from-primary-500/30 to-secondary-500/30 absolute -top-40 -left-40 h-96 w-96 animate-pulse rounded-full bg-linear-to-br blur-3xl"></div>
      <div className="from-secondary-500/30 to-primary-500/30 animation-delay-2000 absolute -right-40 -bottom-40 h-96 w-96 animate-pulse rounded-full bg-linear-to-br blur-3xl"></div>
      <div className="from-primary-400/20 to-secondary-400/20 absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br blur-3xl"></div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center md:mb-20">
          <div className="border-primary-500/30 from-primary-500/20 to-secondary-500/20 hover:border-primary-500/50 hover:shadow-primary-500/30 mb-6 inline-flex items-center gap-3 rounded-full border bg-linear-to-r px-8 py-3 text-sm font-semibold shadow-xl backdrop-blur-xl transition-all hover:scale-105 hover:shadow-2xl">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="from-primary-200 to-secondary-200 bg-linear-to-r bg-clip-text text-transparent">
              Latest Articles & Resources
            </span>
          </div>
          <h2 className="bg-linear-to-r from-white via-gray-100 to-white bg-clip-text text-5xl font-extrabold text-transparent md:text-6xl lg:text-7xl">
            Knowledge Base
          </h2>
          <div className="from-primary-500 via-secondary-400 to-primary-500 shadow-glow mx-auto mt-6 h-1.5 w-40 rounded-full bg-linear-to-r md:w-48"></div>
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-gray-300 md:text-xl">
            Explore tutorials, contest insights, career guidance, and community
            stories
          </p>
        </div>

        {/* Featured Blog Post */}
        <div className="mb-12">
          <Link
            href="/blogs/1"
            className="group hover:border-primary-500/50 hover:shadow-primary-500/30 relative block overflow-hidden rounded-3xl border border-white/20 bg-linear-to-br from-white/10 via-white/5 to-transparent shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-[0_20px_80px_-15px]"
          >
            <div className="from-primary-500/10 to-secondary-500/10 absolute inset-0 bg-linear-to-br via-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="relative grid gap-8 p-8 md:grid-cols-2 md:p-12 lg:gap-12">
              {/* Left Side - Content */}
              <div className="flex flex-col justify-center">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="from-primary-500/40 to-primary-600/40 border-primary-500/50 text-primary-200 inline-flex items-center gap-2 rounded-full border bg-linear-to-r px-4 py-1.5 text-sm font-bold shadow-lg">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    Featured Tutorial
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    8 min read
                  </div>
                </div>
                <h3 className="group-hover:from-primary-200 group-hover:to-secondary-200 mb-4 bg-linear-to-r from-white to-gray-200 bg-clip-text text-3xl font-bold text-transparent transition-all md:text-4xl lg:text-5xl">
                  How to Start Competitive Programming as a Beginner
                </h3>
                <p className="mb-6 text-base leading-relaxed text-gray-300 md:text-lg">
                  A comprehensive guide for beginners to start their journey in
                  competitive programming. Learn about essential resources,
                  practice strategies, and common mistakes to avoid. Perfect for
                  students taking their first steps into the world of algorithms
                  and problem-solving.
                </p>
                <div className="flex items-center gap-4">
                  <div className="from-primary-500/30 to-secondary-500/30 ring-primary-500/50 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br ring-2">
                    <span className="text-primary-300 text-lg font-bold">
                      AR
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      Md. Arif Rahman
                    </div>
                    <div className="text-sm text-gray-400">
                      Feb 10, 2026 · Competitive Programming Expert
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Visual */}
              <div className="relative flex items-center justify-center">
                <div className="from-primary-500/20 to-secondary-500/20 absolute inset-0 rounded-2xl bg-linear-to-br blur-2xl"></div>
                <div className="from-primary-500/10 to-secondary-500/10 relative flex h-full min-h-70 w-full items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br backdrop-blur-sm">
                  <div className="text-center">
                    <svg
                      className="text-primary-300/40 mx-auto mb-6 h-24 w-24"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <div className="space-y-2 text-gray-400">
                      <div className="border-primary-500/20 bg-primary-500/5 mx-auto flex w-3/4 items-center gap-2 rounded-lg border p-3 backdrop-blur-sm">
                        <div className="bg-primary-500/30 border-primary-500/30 h-8 w-8 shrink-0 rounded border"></div>
                        <div className="from-primary-500/30 h-2 flex-1 rounded bg-linear-to-r to-transparent"></div>
                      </div>
                      <div className="border-secondary-500/20 bg-secondary-500/5 mx-auto flex w-5/6 items-center gap-2 rounded-lg border p-3 backdrop-blur-sm">
                        <div className="bg-secondary-500/30 border-secondary-500/30 h-8 w-8 shrink-0 rounded border"></div>
                        <div className="from-secondary-500/30 h-2 flex-1 rounded bg-linear-to-r to-transparent"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Indicator */}
            <div className="from-primary-500/50 via-secondary-500/50 to-primary-500/50 absolute right-0 bottom-0 left-0 h-2 bg-linear-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          </Link>
        </div>

        {/* Regular Blog Grid */}
        <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Blog Post 2 */}
          <Link
            href="/blogs/2"
            className="group hover:border-primary-500/50 hover:shadow-primary-500/20 relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent shadow-xl backdrop-blur-lg transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
          >
            <div className="from-primary-500/0 to-primary-500/10 absolute inset-0 bg-linear-to-br via-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="relative p-8">
              <div className="from-primary-500/20 to-primary-600/20 ring-primary-500/30 group-hover:ring-primary-500/50 mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br ring-1 transition-all duration-300 group-hover:scale-110 group-hover:ring-2">
                <svg
                  className="text-primary-300 h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <div className="mb-4 flex items-center gap-3">
                <span className="from-primary-500/30 to-primary-600/30 text-primary-300 rounded-full bg-linear-to-r px-3 py-1 text-xs font-bold">
                  Tutorials
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  12 min
                </span>
              </div>
              <h3 className="group-hover:text-primary-300 mb-4 text-xl leading-tight font-bold text-white transition-colors md:text-2xl">
                C++ STL You Must Know for Programming Contests
              </h3>
              <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-400">
                Master the essential C++ Standard Template Library components
                that every competitive programmer should know. Includes vectors,
                maps, sets, and algorithms.
              </p>
              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <div className="from-secondary-500/30 to-primary-500/30 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-xs font-semibold text-white ring-2 ring-white/10">
                  TA
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-300">
                    Tasnim Akter
                  </div>
                  <div className="text-xs text-gray-500">Feb 8, 2026</div>
                </div>
                <svg
                  className="group-hover:text-primary-400 h-5 w-5 text-gray-600 transition-all group-hover:translate-x-1"
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
              </div>
            </div>
            <div className="from-primary-500/0 via-primary-500/50 to-primary-500/0 absolute right-0 bottom-0 left-0 h-1 bg-linear-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          </Link>

          {/* Blog Post 3 */}
          <Link
            href="/blogs/3"
            className="group hover:border-secondary-500/50 hover:shadow-secondary-500/20 relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent shadow-xl backdrop-blur-lg transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
          >
            <div className="from-secondary-500/0 to-secondary-500/10 absolute inset-0 bg-linear-to-br via-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="relative p-8">
              <div className="from-secondary-500/20 to-secondary-600/20 ring-secondary-500/30 group-hover:ring-secondary-500/50 mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br ring-1 transition-all duration-300 group-hover:scale-110 group-hover:ring-2">
                <svg
                  className="text-secondary-300 h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div className="mb-4 flex items-center gap-3">
                <span className="from-secondary-500/30 to-secondary-600/30 text-secondary-300 rounded-full bg-linear-to-r px-3 py-1 text-xs font-bold">
                  Contests
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  6 min
                </span>
              </div>
              <h3 className="group-hover:text-secondary-300 mb-4 text-xl leading-tight font-bold text-white transition-colors md:text-2xl">
                Intra University Programming Contest 2026 Recap
              </h3>
              <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-400">
                Highlights and analysis from our annual programming contest.
                Over 100 participants competed in solving challenging
                algorithmic problems.
              </p>
              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <div className="from-primary-500/30 to-secondary-500/30 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-xs font-semibold text-white ring-2 ring-white/10">
                  SA
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-300">
                    Sabbir Ahmed
                  </div>
                  <div className="text-xs text-gray-500">Feb 5, 2026</div>
                </div>
                <svg
                  className="group-hover:text-secondary-400 h-5 w-5 text-gray-600 transition-all group-hover:translate-x-1"
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
              </div>
            </div>
            <div className="from-secondary-500/0 via-secondary-500/50 to-secondary-500/0 absolute right-0 bottom-0 left-0 h-1 bg-linear-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          </Link>

          {/* Blog Post 4 */}
          <Link
            href="/blogs/4"
            className="group hover:border-primary-500/50 hover:shadow-primary-500/20 relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent shadow-xl backdrop-blur-lg transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
          >
            <div className="from-primary-500/0 to-primary-500/10 absolute inset-0 bg-linear-to-br via-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="relative p-8">
              <div className="from-primary-500/20 to-primary-600/20 ring-primary-500/30 group-hover:ring-primary-500/50 mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br ring-1 transition-all duration-300 group-hover:scale-110 group-hover:ring-2">
                <svg
                  className="text-primary-300 h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="mb-4 flex items-center gap-3">
                <span className="from-primary-500/30 to-primary-600/30 text-primary-300 rounded-full bg-linear-to-r px-3 py-1 text-xs font-bold">
                  Tutorials
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  15 min
                </span>
              </div>
              <h3 className="group-hover:text-primary-300 mb-4 text-xl leading-tight font-bold text-white transition-colors md:text-2xl">
                Graph Theory Basics for ICPC Preparation
              </h3>
              <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-400">
                Understanding graph theory fundamentals including BFS, DFS,
                shortest paths, and minimum spanning trees for competitive
                programming.
              </p>
              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <div className="from-primary-500/30 to-secondary-500/30 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-xs font-semibold text-white ring-2 ring-white/10">
                  NJ
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-300">
                    Nusrat Jahan
                  </div>
                  <div className="text-xs text-gray-500">Feb 3, 2026</div>
                </div>
                <svg
                  className="group-hover:text-primary-400 h-5 w-5 text-gray-600 transition-all group-hover:translate-x-1"
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
              </div>
            </div>
            <div className="from-primary-500/0 via-primary-500/50 to-primary-500/0 absolute right-0 bottom-0 left-0 h-1 bg-linear-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          </Link>

          {/* Blog Post 5 */}
          <Link
            href="/blogs/5"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent shadow-xl backdrop-blur-lg transition-all duration-500 hover:-translate-y-3 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20"
          >
            <div className="absolute inset-0 bg-linear-to-br from-green-500/0 via-transparent to-green-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="relative p-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-green-500/20 to-green-600/20 ring-1 ring-green-500/30 transition-all duration-300 group-hover:scale-110 group-hover:ring-2 group-hover:ring-green-500/50">
                <svg
                  className="h-8 w-8 text-green-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-linear-to-r from-green-500/30 to-green-600/30 px-3 py-1 text-xs font-bold text-green-300">
                  Career
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  10 min
                </span>
              </div>
              <h3 className="mb-4 text-xl leading-tight font-bold text-white transition-colors group-hover:text-green-300 md:text-2xl">
                Roadmap to Becoming a Software Engineer
              </h3>
              <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-400">
                A complete roadmap for CSE students aspiring to become software
                engineers. Learn about essential skills, projects, and interview
                preparation.
              </p>
              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <div className="to-primary-500/30 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-green-500/30 text-xs font-semibold text-white ring-2 ring-white/10">
                  FH
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-300">
                    Fahim Hassan
                  </div>
                  <div className="text-xs text-gray-500">Jan 28, 2026</div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-600 transition-all group-hover:translate-x-1 group-hover:text-green-400"
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
              </div>
            </div>
            <div className="absolute right-0 bottom-0 left-0 h-1 bg-linear-to-r from-green-500/0 via-green-500/50 to-green-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          </Link>

          {/* Blog Post 6 */}
          <Link
            href="/blogs/6"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent shadow-xl backdrop-blur-lg transition-all duration-500 hover:-translate-y-3 hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-500/20"
          >
            <div className="absolute inset-0 bg-linear-to-br from-pink-500/0 via-transparent to-pink-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="relative p-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-pink-500/20 to-pink-600/20 ring-1 ring-pink-500/30 transition-all duration-300 group-hover:scale-110 group-hover:ring-2 group-hover:ring-pink-500/50">
                <svg
                  className="h-8 w-8 text-pink-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-linear-to-r from-pink-500/30 to-pink-600/30 px-3 py-1 text-xs font-bold text-pink-300">
                  WIE
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  7 min
                </span>
              </div>
              <h3 className="mb-4 text-xl leading-tight font-bold text-white transition-colors group-hover:text-pink-300 md:text-2xl">
                Encouraging Women in Competitive Programming
              </h3>
              <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-400">
                Our WIE initiative to promote diversity in tech. Learn about our
                programs, achievements, and how we&apos;re breaking barriers.
              </p>
              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <div className="to-secondary-500/30 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-pink-500/30 text-xs font-semibold text-white ring-2 ring-white/10">
                  FK
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-300">
                    Farzana Kabir
                  </div>
                  <div className="text-xs text-gray-500">Jan 25, 2026</div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-600 transition-all group-hover:translate-x-1 group-hover:text-pink-400"
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
              </div>
            </div>
            <div className="absolute right-0 bottom-0 left-0 h-1 bg-linear-to-r from-pink-500/0 via-pink-500/50 to-pink-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          </Link>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            href="/blogs"
            className="group border-primary-500/30 from-primary-500/20 via-secondary-500/20 to-primary-500/20 hover:border-primary-500/50 hover:shadow-primary-500/50 relative inline-flex items-center gap-3 overflow-hidden rounded-full border bg-linear-to-r px-10 py-4 font-bold text-white shadow-2xl backdrop-blur-xl transition-all hover:scale-105 hover:shadow-[0_20px_60px_-15px]"
          >
            <div className="from-primary-500/50 via-secondary-500/50 to-primary-500/50 absolute inset-0 bg-linear-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <span className="relative z-10">Explore All Articles</span>
            <svg
              className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <div className="from-primary-500 to-secondary-500 absolute inset-0 bg-linear-to-r opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-50"></div>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Blogs;
