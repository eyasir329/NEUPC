/**
 * @file Hero
 * @module Hero
 */

import Link from 'next/link';
import SVG from '../ui/SVG';
import JoinButton from '../ui/JoinButton';
import Button from '../ui/Button';

// ─── Default Content ────────────────────────────────────────────────────────
const DEFAULTS = {
  title: 'Programming Club',
  subtitle: '(NEUPC)',
  department: 'Department of Computer Science and Engineering',
  university: 'Netrokona University, Netrokona, Bangladesh',
};

/**
 * Hero — Full-screen landing section with club name, department info,
 * CTA buttons, and an animated SVG illustration.
 *
 * @param {object} data – Overrides from site settings (hero_title, etc.)
 */
function Hero({ data = {} }) {
  const {
    title = DEFAULTS.title,
    subtitle = DEFAULTS.subtitle,
    department = DEFAULTS.department,
    university = DEFAULTS.university,
  } = data;

  return (
    <section
      aria-label="Hero"
      className="flex min-h-screen items-center justify-center px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* ── Text Content ────────────────────────────────────────── */}
        <div className="text-center lg:text-left">
          <h1
            className="animate-slide-up mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl xl:text-7xl"
            style={{ animationDelay: '100ms' }}
          >
            <span className="block">{title}</span>
            <span className="mt-2 block text-3xl font-semibold sm:text-4xl md:text-5xl xl:text-6xl">
              {subtitle}
            </span>
          </h1>

          <div
            className="animate-fade-in mx-auto my-8 h-1 w-24 bg-linear-to-r from-transparent via-white to-transparent lg:mx-0"
            style={{ animationDelay: '400ms' }}
          />

          <div
            className="animate-slide-up space-y-3"
            style={{ animationDelay: '500ms' }}
          >
            <h2 className="text-lg font-medium text-gray-100 sm:text-xl md:text-2xl">
              {department}
            </h2>
            <p className="text-base font-light text-gray-200 sm:text-lg md:text-xl">
              {university}
            </p>
          </div>

          {/* ── CTA Buttons ─────────────────────────────────────── */}
          <div
            className="animate-slide-up mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 lg:justify-start"
            style={{ animationDelay: '700ms' }}
          >
            <JoinButton
              href="/join"
              label="Join Now"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-gray-900 shadow-lg transition-all duration-300 hover:bg-gray-100 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none active:scale-[0.97] sm:w-auto md:px-10 md:py-4 md:text-lg"
            >
              <span className="via-primary-500/10 pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Join Now</span>
            </JoinButton>
            <Button
              variant="secondary"
              size="lg"
              href="/about"
              className="w-full sm:w-auto"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* ── Illustration ────────────────────────────────────────── */}
        <div
          className="animate-scale-in flex items-center justify-center"
          style={{ animationDelay: '400ms' }}
          aria-hidden="true"
        >
          <SVG />
        </div>
      </div>
    </section>
  );
}

export default Hero;
