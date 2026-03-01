/**
 * @file Achievements
 * @module Achievements
 */

import Link from 'next/link';
import { cn, formatDate } from '@/app/_lib/utils';
import SectionBackground from '../ui/SectionBackground';

// ─── Configuration ──────────────────────────────────────────────────────────

const DEFAULT_STATS = [
  { icon: '🏆', value: '0', label: 'Total Awards' },
  { icon: '🥇', value: '0', label: 'Contest Wins' },
  { icon: '🌏', value: '0', label: 'ICPC Teams' },
  { icon: '👥', value: '0', label: 'Active Members' },
];

/** SVG path for the star icon used in achievement cards. */
const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

const CALENDAR_PATH =
  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';

/** Color tokens for the two featured achievement cards. */
const CARD_THEMES = [
  {
    border: 'hover:border-yellow-500/50 hover:shadow-yellow-500/20',
    text: 'group-hover:text-yellow-300',
    iconBg: 'border-yellow-500/50 from-yellow-500/30 to-yellow-600/30',
    iconColor: 'text-yellow-300',
    badge: 'from-yellow-500/30 to-primary-500/30 text-yellow-300',
    bottomLine: 'from-yellow-500/0 via-yellow-500/50 to-yellow-500/0',
    overlay: 'from-yellow-500/0 to-yellow-500/10',
  },
  {
    border: 'hover:border-primary-500/50 hover:shadow-primary-500/20',
    text: 'group-hover:text-primary-300',
    iconBg: 'border-primary-500/50 from-primary-500/30 to-primary-600/30',
    iconColor: 'text-primary-300',
    badge: 'from-primary-500/30 to-secondary-500/30 text-primary-300',
    bottomLine: 'from-primary-500/0 via-primary-500/50 to-primary-500/0',
    overlay: 'from-primary-500/0 to-primary-500/10',
  },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Single stat card in the stats grid. */
function StatCard({ stat }) {
  return (
    <div className="group hover:border-primary-500/50 hover:shadow-primary-500/20 relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:rounded-2xl sm:p-8">
      <div className="from-primary-500/0 to-primary-500/10 absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-3 text-4xl sm:text-5xl">{stat.icon}</div>
        <div className="to-primary-200 bg-linear-to-r from-white bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
          {stat.value}
        </div>
        <div className="mt-2 text-sm font-medium text-gray-400 sm:text-base">
          {stat.label}
        </div>
      </div>
    </div>
  );
}

/** Single featured achievement card. */
function AchievementCard({ achievement, theme }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent shadow-xl backdrop-blur-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl',
        theme.border
      )}
    >
      {/* Hover overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100',
          theme.overlay
        )}
      />

      <div className="relative p-6 sm:p-8">
        <div className="mb-4 flex items-start justify-between gap-3">
          {/* Star icon */}
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border bg-linear-to-br shadow-lg sm:h-16 sm:w-16',
              theme.iconBg
            )}
          >
            <svg
              className={cn('h-7 w-7 sm:h-8 sm:w-8', theme.iconColor)}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d={STAR_PATH} />
            </svg>
          </div>

          {/* Category badge */}
          <span
            className={cn(
              'rounded-full bg-linear-to-r px-3 py-1 text-xs font-bold',
              theme.badge
            )}
          >
            {achievement.category || 'Achievement'}
          </span>
        </div>

        <h3
          className={cn(
            'mb-3 text-xl font-bold text-white transition-colors sm:text-2xl',
            theme.text
          )}
        >
          {achievement.title}
        </h3>

        <p className="mb-4 text-sm leading-relaxed text-gray-400 sm:text-base">
          {achievement.description}
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-500">
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
              d={CALENDAR_PATH}
            />
          </svg>
          {formatDate(achievement.achievement_date || achievement.created_at, {
            year: 'numeric',
            month: 'long',
          })}
        </div>
      </div>

      {/* Bottom border reveal */}
      <div
        className={cn(
          'absolute right-0 bottom-0 left-0 h-1 bg-linear-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100',
          theme.bottomLine
        )}
      />
    </div>
  );
}

// ─── Achievements Section ───────────────────────────────────────────────────

/**
 * Achievements — Homepage section showing stats grid and featured achievements.
 *
 * @param {Array} achievements – Achievement records from DB
 * @param {Array} stats        – Stat items [{icon, value, label}]
 */
function Achievements({ achievements = [], stats = [] }) {
  const featuredAchievements = achievements.slice(0, 2);
  const displayStats = stats.length > 0 ? stats : DEFAULT_STATS;

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8 lg:py-28">
      <SectionBackground variant="warm" />

      <div className="relative mx-auto max-w-7xl">
        {/* ── Section Header ──────────────────────────────────────── */}
        <div className="mb-12 text-center md:mb-16 lg:mb-20">
          <div className="to-primary-500/20 mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-linear-to-r from-yellow-500/20 px-6 py-2.5 text-sm font-semibold shadow-xl backdrop-blur-xl transition-all hover:scale-105 hover:border-yellow-500/50 md:mb-6">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d={STAR_PATH} />
            </svg>
            <span className="to-primary-200 bg-linear-to-r from-yellow-200 bg-clip-text text-transparent">
              Our Achievements
            </span>
          </div>

          <h2 className="mb-4 bg-linear-to-r from-white via-gray-100 to-white bg-clip-text text-4xl font-extrabold text-transparent md:mb-6 md:text-5xl lg:text-6xl">
            Excellence in Action
          </h2>
          <div className="shadow-glow via-primary-500 to-secondary-500 mx-auto h-1.5 w-32 rounded-full bg-linear-to-r from-yellow-500 md:w-40" />
          <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300 md:text-lg lg:text-xl">
            Celebrating our journey of competitive programming success and
            innovation
          </p>
        </div>

        {/* ── Stats Grid ──────────────────────────────────────────── */}
        <div className="mb-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {displayStats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        {/* ── Featured Achievements ───────────────────────────────── */}
        {featuredAchievements.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {featuredAchievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                theme={CARD_THEMES[index] || CARD_THEMES[1]}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-400">
              No achievements to display yet.
            </p>
          </div>
        )}

        {/* ── View All ────────────────────────────────────────────── */}
        <div className="mt-12 text-center md:mt-16">
          <Link
            href="/achievements"
            className="group via-primary-500/20 to-secondary-500/20 relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-yellow-500/30 bg-linear-to-r from-yellow-500/20 px-8 py-4 font-bold text-white shadow-2xl backdrop-blur-xl transition-all hover:scale-105 hover:border-yellow-500/50 hover:shadow-[0_20px_60px_-15px] hover:shadow-yellow-500/50 sm:px-10"
          >
            <div className="via-primary-500/50 to-secondary-500/50 absolute inset-0 bg-linear-to-r from-yellow-500/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10">View All Achievements</span>
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
            <div className="to-primary-500 absolute inset-0 bg-linear-to-r from-yellow-500 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-50" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Achievements;
