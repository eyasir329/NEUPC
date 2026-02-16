import Link from "next/link";

function Join() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-transparent"></div>
      <div className="from-secondary-500/10 via-primary-500/10 to-secondary-500/10 pointer-events-none absolute inset-0 bg-linear-to-br opacity-30"></div>

      {/* Decorative Blur Circles */}
      <div className="from-primary-500/20 to-secondary-500/20 absolute -top-40 -left-40 h-96 w-96 rounded-full bg-linear-to-br blur-3xl"></div>
      <div className="from-secondary-500/20 to-primary-500/20 absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-linear-to-br blur-3xl"></div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="mb-12 text-center md:mb-16 lg:mb-20">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md transition-all hover:bg-white/15 hover:shadow-xl md:mb-6">
              <span className="text-2xl">🚀</span>
              <span className="text-primary-300">Join Our Community</span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-white md:mb-6 md:text-5xl lg:text-6xl">
              Become a Member
            </h2>
            <div className="from-primary-500 via-secondary-300 to-primary-500 shadow-glow mx-auto h-1.5 w-32 rounded-full bg-linear-to-r md:w-40"></div>
            <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300 md:text-lg lg:text-xl">
              Join NEUPC and unlock your potential in competitive programming,
              software development, and tech innovation
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="mb-12 grid gap-6 sm:grid-cols-2 md:mb-16 lg:grid-cols-4">
            {/* Benefit 1 */}
            <div className="group hover:border-primary-500/50 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl">
              <div className="from-primary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"></div>

              <div className="relative">
                <div className="from-primary-500/20 to-primary-600/20 mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br">
                  <svg
                    className="text-primary-300 h-7 w-7"
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
                </div>
                <h3 className="from-primary-300 mb-2 bg-linear-to-r to-white bg-clip-text text-lg font-bold text-transparent">
                  Learn & Grow
                </h3>
                <p className="text-sm text-gray-400">
                  Access workshops, bootcamps, and mentorship programs
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="group hover:border-secondary-500/50 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl">
              <div className="from-secondary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"></div>

              <div className="relative">
                <div className="from-secondary-500/20 to-secondary-600/20 mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br">
                  <svg
                    className="text-secondary-300 h-7 w-7"
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
                <h3 className="from-secondary-300 mb-2 bg-linear-to-r to-white bg-clip-text text-lg font-bold text-transparent">
                  Network
                </h3>
                <p className="text-sm text-gray-400">
                  Connect with peers, alumni, and industry professionals
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="group hover:border-primary-500/50 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl">
              <div className="from-primary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"></div>

              <div className="relative">
                <div className="from-primary-500/20 to-primary-600/20 mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br">
                  <svg
                    className="text-primary-300 h-7 w-7"
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
                <h3 className="from-primary-300 mb-2 bg-linear-to-r to-white bg-clip-text text-lg font-bold text-transparent">
                  Compete
                </h3>
                <p className="text-sm text-gray-400">
                  Participate in contests and represent NU nationally
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="group hover:border-secondary-500/50 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl">
              <div className="from-secondary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"></div>

              <div className="relative">
                <div className="from-secondary-500/20 to-secondary-600/20 mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br">
                  <svg
                    className="text-secondary-300 h-7 w-7"
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
                <h3 className="from-secondary-300 mb-2 bg-linear-to-r to-white bg-clip-text text-lg font-bold text-transparent">
                  Build Projects
                </h3>
                <p className="text-sm text-gray-400">
                  Collaborate on real-world projects and hackathons
                </p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-linear-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md md:p-12 lg:p-16">
            <div className="from-primary-500/30 via-secondary-500/30 to-primary-500/30 absolute inset-0 bg-linear-to-r opacity-50"></div>

            {/* Decorative Elements */}
            <div className="from-primary-500/40 absolute -top-20 -left-20 h-40 w-40 rounded-full bg-linear-to-br to-transparent blur-3xl"></div>
            <div className="from-secondary-500/40 absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-linear-to-br to-transparent blur-3xl"></div>

            <div className="relative text-center">
              <h3 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                Ready to Start Your Journey?
              </h3>
              <p className="mx-auto mb-8 max-w-2xl text-base text-gray-300 md:text-lg lg:text-xl">
                Join hundreds of students who are already part of NEUPC and take
                your programming skills to the next level
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/join"
                  className="from-primary-500 via-secondary-500 to-primary-600 hover:shadow-3xl group/cta hover:shadow-primary-500/50 relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-linear-to-r px-8 py-4 text-base font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 md:px-12 md:py-5 md:text-lg"
                >
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full"></div>

                  <span className="relative">Join NEUPC Now</span>
                  <svg
                    className="relative h-5 w-5 transition-transform duration-300 group-hover/cta:translate-x-1 md:h-6 md:w-6"
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
                  href="/contact"
                  className="group/contact inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-white/50 hover:bg-white/20 md:px-12 md:py-5 md:text-lg"
                >
                  <span>Contact Us</span>
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover/contact:translate-x-1 md:h-6 md:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Join;
