/**
 * @file Achievements page client component.
 * Displays filtered achievements grid, timeline, hall of fame, and WIE section.
 *
 * @module AchievementsClient
 */

'use client';

import { useState } from 'react';
import PageHero from '../_components/ui/PageHero';
import CTASection from '../_components/ui/CTASection';
import EmptyState from '../_components/ui/EmptyState';
import { useScrollReveal } from '../_lib/hooks';
import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});
import { cn } from '../_lib/utils';

// ---------------------------------------------------------------------------
// Constants & defaults
// ---------------------------------------------------------------------------

/** Category filter buttons */
const DEFAULT_CATEGORIES = [
  { name: 'All', icon: '🏆' },
  { name: 'ICPC', icon: '🌏' },
  { name: 'Contest', icon: '⚔️' },
  { name: 'Hackathon', icon: '💻' },
  { name: 'Individual', icon: '⭐' },
  { name: 'WIE', icon: '👩‍💻' },
];

/** Default achievement timeline */
const DEFAULT_TIMELINE = [
  { year: '2019', event: 'Club Founded', icon: '🎯' },
  { year: '2021', event: 'First Intra Contest', icon: '🏁' },
  { year: '2023', event: 'First ICPC Participation', icon: '🌏' },
  { year: '2025', event: 'National Level Recognition', icon: '🏆' },
  { year: '2026', event: 'Regional Champions', icon: '👑' },
];

/** Default hero stats */
const DEFAULT_STATS = [
  { label: 'Total Awards', value: '45+', icon: '🏆' },
  { label: 'Contest Wins', value: '18', icon: '🥇' },
  { label: 'ICPC Teams', value: '12', icon: '🌏' },
  { label: 'Active Members', value: '150+', icon: '👥' },
];

/** Medal color mapping */
const MEDAL_COLORS = {
  gold: 'from-yellow-500/30 to-yellow-600/30 text-yellow-300 border-yellow-500/50',
  silver: 'from-gray-300/30 to-gray-400/30 text-gray-200 border-gray-400/50',
  bronze:
    'from-orange-500/30 to-orange-600/30 text-orange-300 border-orange-500/50',
};
const DEFAULT_MEDAL_COLOR =
  'from-primary-500/30 to-primary-600/30 text-primary-300 border-primary-500/50';

/** WIE stats */
const WIE_STATS = [
  {
    value: '5+',
    label: 'WIE Champions',
    emoji: '🏆',
    borderColor: 'border-pink-500/20',
    bgColor: 'bg-pink-500/5',
    hoverBg: 'hover:bg-pink-500/10',
    gradient: 'from-pink-300 to-purple-300',
  },
  {
    value: '40%',
    label: 'Female Participation',
    emoji: '📈',
    borderColor: 'border-purple-500/20',
    bgColor: 'bg-purple-500/5',
    hoverBg: 'hover:bg-purple-500/10',
    gradient: 'from-purple-300 to-pink-300',
  },
  {
    value: '12',
    label: 'Leadership Roles',
    emoji: '🌟',
    borderColor: 'border-pink-500/20',
    bgColor: 'bg-pink-500/5',
    hoverBg: 'hover:bg-pink-500/10',
    gradient: 'from-pink-300 to-purple-300',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Achievement card with medal badge, meta info, and position.
 * @param {{ achievement: object }} props
 */
function AchievementCard({ achievement }) {
  const medalColor = MEDAL_COLORS[achievement.medal] || DEFAULT_MEDAL_COLOR;

  return (
    <div className="group hover:border-primary-500/50 hover:shadow-primary-500/20 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl">
      <div className="p-6">
        {/* Medal badge + category */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl',
              medalColor
            )}
          >
            <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <span className="text-primary-300 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
            {achievement.category}
          </span>
        </div>

        <h3 className="group-hover:text-primary-300 mb-2 text-xl font-bold text-white transition-colors">
          {achievement.title}
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-400">
          {achievement.description}
        </p>

        {/* Meta info */}
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1">{achievement.location}</span>
          </div>
          <div className="flex items-center gap-2">
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
              {new Date(achievement.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="line-clamp-1">{achievement.participants}</span>
          </div>
        </div>

        {/* Position badge */}
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm font-semibold text-gray-300">Position</span>
          <span className="text-primary-200 rounded-lg bg-white/10 px-4 py-1.5 text-sm font-bold">
            {achievement.position}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline milestone item.
 * @param {{ item: object, index: number }} props
 */
function TimelineItem({ item, index }) {
  return (
    <div
      className={cn(
        'group relative mb-12 flex items-center',
        index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
      )}
    >
      <div
        className={cn(
          'w-full md:w-5/12',
          index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'
        )}
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/10">
          <div className="mb-3 text-3xl">{item.icon}</div>
          <h3 className="mb-2 text-xl font-bold text-white">{item.event}</h3>
          <span className="text-primary-300 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-semibold">
            {item.year}
          </span>
        </div>
      </div>

      {/* Center dot */}
      <div className="from-primary-500 to-secondary-500 absolute top-0 left-0 z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-gray-900 bg-linear-to-br transition-all duration-300 group-hover:scale-110 md:left-1/2 md:-translate-x-1/2">
        <span className="text-lg font-bold text-white">
          {item.year.slice(-2)}
        </span>
      </div>

      <div className="hidden w-5/12 md:block" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Achievements page client component.
 *
 * @param {{ achievements?: Array, hallOfFame?: Array, timeline?: Array, stats?: Array }} props
 */
export default function AchievementsClient({
  achievements: propAchievements = [],
  hallOfFame: propHallOfFame = [],
  timeline: propTimeline = [],
  stats: propStats = [],
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.05 });
  const [timelineRef, timelineVisible] = useScrollReveal({ threshold: 0.1 });
  const [hofRef, hofVisible] = useScrollReveal({ threshold: 0.1 });
  const [wieRef, wieVisible] = useScrollReveal({ threshold: 0.15 });

  // --- Data normalization ---
  const achievements = propAchievements;
  const hallOfFame = propHallOfFame;
  const timeline = propTimeline.length > 0 ? propTimeline : DEFAULT_TIMELINE;
  const stats = propStats.length > 0 ? propStats : DEFAULT_STATS;

  // Build categories dynamically
  const categorySet = new Set(propAchievements.map((a) => a.category));
  const categories = DEFAULT_CATEGORIES.filter(
    (c) => c.name === 'All' || categorySet.has(c.name)
  );
  if (categories.length <= 1) categories.push(...DEFAULT_CATEGORIES.slice(1));

  const filteredAchievements =
    activeFilter === 'All'
      ? achievements
      : achievements.filter((a) => a.category === activeFilter);

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      <PageHero
        badge="Excellence & Achievements"
        badgeIcon="🏆"
        title="Our Achievements"
        description="Celebrating excellence in competitive programming, innovation, and academic growth"
        stats={stats}
      />

      {/* Filter Tabs */}
      <section className="relative py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveFilter(category.name)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeFilter === category.name
                    ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                    : 'bg-white/10 text-gray-400 backdrop-blur-md hover:bg-white/20 hover:text-white'
                )}
              >
                <span className="text-base">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Grid */}
      <section ref={gridRef} className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {filteredAchievements.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No Achievements Found"
                description="Try selecting a different category"
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAchievements.map((achievement, index) => (
                  <div
                    key={achievement.id}
                    className={cn(
                      'transition-all duration-700',
                      gridVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                    )}
                    style={{
                      transitionDelay: gridVisible ? `${index * 100}ms` : '0ms',
                    }}
                  >
                    <AchievementCard achievement={achievement} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section ref={timelineRef} className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div
              className={cn(
                'mb-12 text-center transition-all duration-700',
                timelineVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
              <h2 className="from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                Our Journey
              </h2>
            </div>

            <div className="relative">
              <div className="from-primary-500 to-secondary-500 absolute top-0 left-1/2 hidden h-full w-1 -translate-x-1/2 rounded-full bg-linear-to-b md:block" />
              {timeline.map((item, index) => (
                <TimelineItem key={index} item={item} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hall of Fame */}
      <section ref={hofRef} className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div
              className={cn(
                'mb-12 text-center transition-all duration-700',
                hofVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
              <h2 className="from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                Hall of Fame
              </h2>
              <p className="mx-auto max-w-2xl text-gray-300">
                Honoring our top performers and outstanding contributors
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {hallOfFame.map((member, index) => (
                <div
                  key={index}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl transition-all duration-700 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/20',
                    hofVisible
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0'
                  )}
                  style={{
                    transitionDelay: hofVisible
                      ? `${200 + index * 100}ms`
                      : '0ms',
                  }}
                >
                  <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-yellow-500/30 to-orange-500/30 text-2xl font-bold text-yellow-300 ring-4 ring-yellow-500/30 transition-all duration-300 group-hover:scale-110">
                    {member.avatar}
                    <div className="absolute -top-8 text-3xl opacity-0 transition-all duration-300 group-hover:opacity-100">
                      👑
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">
                    {member.name}
                  </h3>
                  <p className="text-primary-300 mb-3 text-sm">
                    {member.title}
                  </p>
                  <div className="mb-3 text-xl font-bold text-yellow-400">
                    {member.rating}
                  </div>
                  <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold text-yellow-300">
                    {member.year}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WIE Highlight Section */}
      <section ref={wieRef} className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div
              className={cn(
                'rounded-2xl border border-white/20 bg-white/5 p-8 backdrop-blur-xl transition-all duration-700 md:p-12',
                wieVisible
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'translate-y-8 scale-95 opacity-0'
              )}
            >
              <div className="mb-8 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-pink-500/20 px-6 py-2 text-sm font-semibold">
                  <span className="text-2xl">👩‍💻</span>
                  <span className="text-pink-300">Women in Engineering</span>
                </div>
                <h2 className="mb-4 bg-linear-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                  Empowering Women in Tech
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {WIE_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      'rounded-xl border p-6 text-center backdrop-blur-sm transition-all duration-300',
                      stat.borderColor,
                      stat.bgColor,
                      stat.hoverBg
                    )}
                  >
                    <div className="mb-3 text-4xl">{stat.emoji}</div>
                    <div
                      className={cn(
                        'bg-linear-to-r bg-clip-text text-3xl font-bold text-transparent',
                        stat.gradient
                      )}
                    >
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm text-gray-300">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-center text-gray-300">
                Promoting diversity, inclusion, and equal opportunities in
                competitive programming and technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        icon="🚀"
        title="Ready to Make Your Mark?"
        description="Join NEUPC today and be part of our legacy of excellence in competitive programming and technology."
      />

      <ScrollToTop />
    </main>
  );
}
