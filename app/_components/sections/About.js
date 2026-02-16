import Image from 'next/image';
import Link from 'next/link';

function About({ variant = 'dark' }) {
  const isDark = variant === 'dark';

  return (
    <section
      className={`relative ${isDark ? 'pb-20 md:pb-28' : 'py-20 md:py-28'}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content Grid */}
        <div className="mx-auto max-w-7xl">
          {/* Introduction Card with Logo */}
          <div className="grid gap-8 rounded-2xl bg-white/10 p-8 backdrop-blur-md md:p-12 lg:grid-cols-2 lg:items-center">
            {/* Left Side - Content */}
            <div>
              <div className="mb-8 flex items-center">
                <div className="bg-primary-500/20 mr-4 flex h-16 w-16 items-center justify-center rounded-full backdrop-blur-sm">
                  <span className="text-4xl">🌐</span>
                </div>
                <h3 className="text-2xl font-bold text-white md:text-3xl">
                  Who We Are
                </h3>
              </div>
              <p className="mb-6 text-base leading-relaxed text-gray-200 md:text-lg">
                The{' '}
                <strong className="text-primary-300">
                  Programming Club (NEUPC)
                </strong>{' '}
                of Netrokona University is an academic and skill-development
                organization under the Department of Computer Science and
                Engineering. Established with the goal of strengthening
                programming culture within the university, the club provides a
                structured environment for students to develop problem-solving
                skills, algorithmic thinking, and practical technical expertise.
              </p>

              <p className="mb-6 text-base leading-relaxed text-gray-200 md:text-lg">
                The club serves as a platform where students can explore
                competitive programming, software development, research
                discussions, and emerging technologies beyond the academic
                syllabus.
              </p>

              {/* Call to Action - Only show on main page */}
              {isDark && (
                <div className="mt-8">
                  <Link
                    href="/about"
                    className="group from-primary-500 to-secondary-500 inline-flex items-center gap-2 rounded-lg bg-linear-to-r px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl md:px-8 md:py-3 md:text-base"
                  >
                    Learn More About Us
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1 md:h-5 md:w-5"
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
              )}
            </div>

            {/* Right Side - Logo */}
            <div className="flex items-center justify-center">
              <div className="relative aspect-square w-full max-w-md">
                <div className="from-primary-500/20 to-secondary-500/20 absolute inset-0 animate-pulse rounded-full bg-linear-to-br blur-3xl"></div>
                <Image
                  src="/logo.png"
                  alt="NEUPC Logo"
                  width={500}
                  height={500}
                  className="relative z-10 drop-shadow-2xl transition-transform hover:scale-105"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
