/**
 * @file Achievements — Homepage section
 * @module Achievements
 */

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/app/_lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

function isMedalist(result) {
  if (!result) return false;
  const r = result.toLowerCase();
  return /1st|first|champion|winner|gold|rank.?1\b|#1\b|2nd|second|silver|rank.?2\b|#2\b|3rd|third|bronze|rank.?3\b|#3\b/.test(r);
}

function deriveStats(achievements, participations) {
  const achYears = [...new Set(achievements.map((a) => a.year).filter(Boolean))];
  const partYears = [...new Set(participations.map((p) => p.year).filter(Boolean))];
  const yearsActive = Math.max(achYears.length - 1, partYears.length - 1);
  return [
    { value: String(achievements.length), label: 'Achievements' },
    { value: String(achievements.filter((a) => isMedalist(a.result)).length), label: 'Gold Medalists' },
    { value: String(participations.length), label: 'Participations' },
    { value: yearsActive > 0 ? `${yearsActive}+` : '—', label: 'Years Active' },
  ];
}

const STAT_COLORS = ['text-neon-lime', 'text-neon-lime', 'text-neon-lime', 'text-neon-lime'];

// ─── Achievements Section ────────────────────────────────────────────────────

function Achievements({ achievements = [], participations = [], stats = [], settings = {} }) {
  const featured = achievements.filter((a) => a.is_featured);
  const topFeatured = featured[0] || achievements[0] || null;

  const displayStats =
    achievements.length > 0 || participations.length > 0
      ? deriveStats(achievements, participations)
      : stats.length > 0
        ? stats
        : deriveStats([], []);

  return (
    <section className="py-32 px-8 relative overflow-hidden">
      {/* Top separator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-neon-lime/20 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-20">
          <span className="font-mono text-[11px] text-neon-lime uppercase tracking-[0.4em] font-bold">
            Recognition
          </span>
          <h2 className="text-6xl md:text-7xl font-heading font-black uppercase tracking-tighter text-white">
            Hall of <span className="text-neon-lime italic">Victories</span>
          </h2>
          <p className="text-zinc-500 text-sm font-light max-w-md mx-auto">
            Our members compete and win at national and international programming contests.
          </p>
        </div>

        {/* Featured Achievement */}
        {topFeatured ? (
          <div className="holographic-card rounded-3xl p-10 md:p-16 flex flex-col lg:flex-row items-center gap-16">
            {/* Image / Icon side */}
            <div className="lg:w-5/12 relative">
              <div className="aspect-square rounded-2xl overflow-hidden border border-neon-lime/15 p-3 bg-deep-void">
                {topFeatured.featured_photo?.url ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden">
                    <Image
                      src={topFeatured.featured_photo.url}
                      alt={topFeatured.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-xl ph-lime flex items-center justify-center">
                    <svg className="h-28 w-28 text-neon-lime/70" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute -top-4 -right-4 bg-neon-violet text-white p-4 rounded-2xl shadow-xl rotate-12 soft-glow-violet">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>

            {/* Content side */}
            <div className="lg:w-7/12 space-y-8">
              <span className="bg-neon-lime/10 text-neon-lime px-6 py-2.5 font-mono text-[11px] font-bold uppercase rounded-full border border-neon-lime/25 inline-block">
                {topFeatured.result || `Major Milestone ${topFeatured.year || new Date().getFullYear()}`}
              </span>
              <h3 className="text-5xl md:text-6xl font-heading font-black text-white italic tracking-tighter uppercase">
                {topFeatured.title}
              </h3>
              {topFeatured.description && (
                <p className="text-zinc-400 text-lg font-light leading-loose">
                  {topFeatured.description}
                </p>
              )}
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-surface border border-neon-lime/20 flex items-center justify-center">
                  <svg className="h-6 w-6 text-neon-lime" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="w-14 h-14 rounded-full bg-surface border border-neon-violet/20 flex items-center justify-center">
                  <svg className="h-6 w-6 text-neon-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="holographic-card rounded-2xl py-14 text-center">
            <p className="font-mono text-[11px] text-zinc-600 uppercase tracking-[0.3em]">
              {settings?.achievements_empty_message || '[ NO_FEATURED_ACHIEVEMENTS ]'}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mt-24">
          {displayStats.map((stat, i) => (
            <div key={i} className="text-center group">
              <div
                className={cn(
                  'text-5xl font-heading font-black tracking-tighter mb-2 group-hover:scale-110 transition-transform',
                  STAT_COLORS[i % STAT_COLORS.length]
                )}
              >
                {stat.value}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500 font-bold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/achievements"
            className="font-heading font-bold px-8 py-3.5 rounded-full border border-white/10 hover:border-neon-lime hover:text-neon-lime transition-all text-[11px] uppercase tracking-widest bg-white/5 text-zinc-400 inline-flex items-center gap-3"
          >
            {settings?.homepage_achievements_cta || 'View All Achievements'}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Achievements;
