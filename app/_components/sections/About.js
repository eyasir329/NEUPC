/**
 * @file About
 * @module About
 */

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/app/_lib/utils';
import Button from '../ui/Button';

// ─── Default Content ────────────────────────────────────────────────────────
const DEFAULTS = {
  title: 'Who We Are',
  description1:
    'The Programming Club (NEUPC) of Netrokona University is an academic and skill-development organization under the Department of Computer Science and Engineering. Established with the goal of strengthening programming culture within the university, the club provides a structured environment for students to develop problem-solving skills, algorithmic thinking, and practical technical expertise.',
  description2:
    'The club serves as a platform where students can explore competitive programming, software development, research discussions, and emerging technologies beyond the academic syllabus.',
};

// Highlight "Programming Club (NEUPC)" whenever it appears in a paragraph.
const HIGHLIGHT_TERM = 'Programming Club (NEUPC)';

function highlightClubName(text) {
  if (!text?.includes(HIGHLIGHT_TERM)) return text;

  const idx = text.indexOf(HIGHLIGHT_TERM);
  return (
    <>
      {text.slice(0, idx)}
      <strong className="text-primary-300">{HIGHLIGHT_TERM}</strong>
      {text.slice(idx + HIGHLIGHT_TERM.length)}
    </>
  );
}

/**
 * About — Introduction card with club description and logo.
 * Used on the homepage (dark) and on the /about page (light variant).
 *
 * @param {'dark'|'light'} variant – Visual variant
 * @param {object}         data    – Overrides from site settings
 */
function About({ variant = 'dark', data = {} }) {
  const isDark = variant === 'dark';
  const {
    title = DEFAULTS.title,
    description1 = DEFAULTS.description1,
    description2 = DEFAULTS.description2,
  } = data;

  return (
    <section
      className={cn('relative', isDark ? 'pb-12 md:pb-16' : 'py-20 md:py-28')}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* ── Introduction Card ──────────────────────────────────── */}
          <div className="grid gap-8 rounded-2xl bg-white/10 p-8 backdrop-blur-md md:p-12 lg:grid-cols-2 lg:items-center">
            {/* Content */}
            <div>
              <div className="mb-8 flex items-center">
                <div className="bg-primary-500/20 mr-4 flex h-16 w-16 items-center justify-center rounded-full backdrop-blur-sm">
                  <span className="text-4xl">🌐</span>
                </div>
                <h3 className="text-2xl font-bold text-white md:text-3xl">
                  {title}
                </h3>
              </div>

              <p className="mb-6 text-base leading-relaxed text-gray-200 md:text-lg">
                {highlightClubName(description1)}
              </p>

              <p className="mb-6 text-base leading-relaxed text-gray-200 md:text-lg">
                {description2}
              </p>

              {/* CTA — only on the homepage variant */}
              {isDark && (
                <div className="mt-8">
                  <Button
                    variant="gradient"
                    size="md"
                    href="/about"
                    iconRight={
                      <svg
                        className="h-4 w-4 md:h-5 md:w-5"
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
                    }
                  >
                    Learn More About Us
                  </Button>
                </div>
              )}
            </div>

            {/* Logo */}
            <div className="flex items-center justify-center">
              <div className="relative aspect-square w-full max-w-xs sm:max-w-sm md:max-w-md">
                <div className="from-primary-500/20 to-secondary-500/20 absolute inset-0 rounded-full bg-linear-to-br blur-3xl" />
                <Image
                  src="/logo.png"
                  alt="NEUPC Logo"
                  width={500}
                  height={500}
                  className="relative z-10 drop-shadow-2xl transition-transform hover:scale-105"
                  loading="lazy"
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
