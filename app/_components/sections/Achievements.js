'use client';

/**
 * @file Achievements — Homepage section
 * @module Achievements
 */

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/app/_lib/utils';

function isMedalist(result) {
  if (!result) return false;
  const r = result.toLowerCase();
  return /1st|first|champion|winner|gold|rank.?1\b|#1\b|2nd|second|silver|rank.?2\b|#2\b|3rd|third|bronze|rank.?3\b|#3\b/.test(
    r
  );
}

function deriveStats(achievements, participations) {
  const achYears = [
    ...new Set(achievements.map((a) => a.year).filter(Boolean)),
  ];
  const partYears = [
    ...new Set(participations.map((p) => p.year).filter(Boolean)),
  ];
  const yearsActive = Math.max(achYears.length - 1, partYears.length - 1);
  return [
    { value: String(achievements.length), label: 'Achievements' },
    {
      value: String(achievements.filter((a) => isMedalist(a.result)).length),
      label: 'Gold Medalists',
    },
    { value: String(participations.length), label: 'Participations' },
    { value: yearsActive > 0 ? `${yearsActive}+` : '—', label: 'Years Active' },
  ];
}

function Achievements({
  achievements = [],
  participations = [],
  stats = [],
  settings = {},
}) {
  const featured = achievements.filter((a) => a.is_featured);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayFeatured =
    featured.length > 0
      ? featured
      : achievements.length > 0
        ? [achievements[0]]
        : [];
  const current = displayFeatured[currentIndex] || null;
  const hasMultiple = displayFeatured.length > 1;

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? displayFeatured.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === displayFeatured.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(handleNext, 4000);
    return () => clearInterval(timer);
  }, [hasMultiple, displayFeatured.length]);

  const displayStats =
    achievements.length > 0 || participations.length > 0
      ? deriveStats(achievements, participations)
      : stats.length > 0
        ? stats
        : deriveStats([], []);

  return (
    <section className="relative overflow-hidden px-8 py-32">
      <div className="dark:via-neon-lime/20 absolute top-0 left-1/2 h-px w-full -translate-x-1/2 bg-linear-to-r from-transparent via-slate-200 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="bg-neon-lime/5 absolute top-1/3 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-20 space-y-5 text-center">
          <div className="flex items-center justify-center gap-4">
            <span className="h-[1px] w-10 bg-emerald-500 dark:bg-neon-lime" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.5em] text-emerald-600 dark:text-neon-lime">
              Recognition / 003
            </span>
            <span className="h-[1px] w-10 bg-emerald-500 dark:bg-neon-lime" />
          </div>
          <h2 className="kinetic-headline font-heading text-6xl font-black text-slate-900 uppercase md:text-7xl dark:text-white">
            Hall of <span className="neon-text">Victories</span>
          </h2>
          <p className="mx-auto max-w-md font-sans text-sm leading-relaxed font-light text-slate-600 dark:text-zinc-400">
            Our members compete and win at national and international
            programming contests.
          </p>
        </div>

        {/* Featured Achievement Slider */}
        {current ? (
          <div className="relative">
            <div className="holographic-card flex flex-col items-center gap-16 rounded-3xl p-10 md:p-16 lg:flex-row">
              <div className="relative lg:w-5/12">
                <div className="dark:border-neon-lime/15 aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:bg-[#020307]">
                  {current.featured_photo?.url ? (
                    <div className="relative h-full w-full overflow-hidden rounded-xl">
                      <Image
                        src={current.featured_photo.url}
                        alt={current.title}
                        fill
                        className="object-cover transition-all duration-500"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="ph-lime flex h-full w-full items-center justify-center rounded-xl">
                      <svg
                        className="h-28 w-28 text-[--accent]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="soft-glow-violet bg-neon-violet absolute -top-4 -right-4 rotate-12 rounded-2xl p-4 shadow-xl">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-8 lg:w-7/12">
                <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-6 py-2.5 font-mono text-[11px] font-bold uppercase text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {current.result ||
                    `Major Milestone ${current.year || new Date().getFullYear()}`}
                </span>
                <h3 className="kinetic-headline font-heading text-5xl font-black text-slate-900 uppercase md:text-6xl dark:text-white">
                  {current.title}
                </h3>
                {current.description && (
                  <p className="text-lg leading-loose font-light text-slate-500 dark:text-zinc-400">
                    {current.description}
                  </p>
                )}
                <div className="flex gap-4">
                  <div className="dark:border-neon-lime/20 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:bg-[#0c0e16]">
                    <svg
                      className="dark:text-neon-lime h-6 w-6 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <div className="dark:border-neon-violet/20 flex h-14 w-14 items-center justify-center rounded-full border border-violet-200 bg-violet-50 dark:bg-[#0c0e16]">
                    <svg
                      className="dark:text-neon-violet h-6 w-6 text-violet-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            {hasMultiple && (
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  className="group hover:border-neon-lime hover:text-neon-lime dark:hover:border-neon-lime dark:hover:text-neon-lime flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all dark:border-white/10 dark:text-zinc-400"
                  aria-label="Previous achievement"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  {displayFeatured.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        i === currentIndex
                          ? 'w-6 bg-emerald-500 dark:bg-neon-lime'
                          : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-white/20 dark:hover:bg-white/30'
                      )}
                      aria-label={`Go to achievement ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleNext}
                  className="group hover:border-neon-lime hover:text-neon-lime dark:hover:border-neon-lime dark:hover:text-neon-lime flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all dark:border-white/10 dark:text-zinc-400"
                  aria-label="Next achievement"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="holographic-card rounded-2xl py-14 text-center">
            <p className="font-mono text-[11px] tracking-[0.3em] text-slate-400 uppercase dark:text-zinc-600">
              {settings?.achievements_empty_message ||
                '[ NO_FEATURED_ACHIEVEMENTS ]'}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="mt-24 grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white/40 backdrop-blur-xl lg:grid-cols-4 lg:divide-y-0 dark:divide-white/5 dark:border-white/5 dark:bg-[#020307]/40">
          {displayStats.map((stat, i) => (
            <div
              key={i}
              className="group relative px-6 py-10 text-center transition-colors hover:bg-emerald-50/60 dark:hover:bg-neon-lime/5"
            >
              <div className="stat-numeral font-heading mb-3 text-5xl font-black leading-none tracking-tighter text-emerald-600 transition-transform group-hover:scale-110 dark:text-neon-lime md:text-6xl">
                {stat.value}
              </div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 dark:text-zinc-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/achievements"
            className="font-heading dark:hover:border-neon-lime dark:hover:text-neon-lime inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-8 py-3.5 text-[11px] font-bold tracking-widest text-slate-500 uppercase transition-all hover:border-slate-900 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
          >
            {settings?.homepage_achievements_cta || 'View All Achievements'}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Achievements;
