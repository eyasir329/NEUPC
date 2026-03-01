/**
 * @file Roadmaps listing page client component.
 * Shows technical learning paths, club growth vision, and leadership path.
 *
 * @module RoadmapsClient
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHero from '../_components/ui/PageHero';
import CTASection from '../_components/ui/CTASection';
import { useScrollReveal } from '../_lib/hooks';
import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});
import EmptyState from '../_components/ui/EmptyState';
import JoinButton from '../_components/ui/JoinButton';
import { cn } from '../_lib/utils';

/** @type {Object<string, { icon: string, gradient: string, borderColor: string, hoverGlow: string }>} */
const ROADMAP_STYLES = {
  'competitive-programming': {
    icon: '🧠',
    gradient: 'from-blue-500/20 to-purple-500/20',
    borderColor: 'border-blue-500/30',
    hoverGlow: 'hover:shadow-blue-500/20',
  },
  'web-development': {
    icon: '💻',
    gradient: 'from-green-500/20 to-teal-500/20',
    borderColor: 'border-green-500/30',
    hoverGlow: 'hover:shadow-green-500/20',
  },
  'ai-machine-learning': {
    icon: '🤖',
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
    hoverGlow: 'hover:shadow-purple-500/20',
  },
  'app-development': {
    icon: '📱',
    gradient: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/30',
    hoverGlow: 'hover:shadow-orange-500/20',
  },
  cybersecurity: {
    icon: '🔐',
    gradient: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/30',
    hoverGlow: 'hover:shadow-red-500/20',
  },
};

const DEFAULT_STYLE = {
  icon: '📚',
  gradient: 'from-gray-500/20 to-slate-500/20',
  borderColor: 'border-gray-500/30',
  hoverGlow: 'hover:shadow-gray-500/20',
};

/** @type {{ id: string, label: string }[]} */
const FILTER_TABS = [
  { id: 'all', label: 'All Paths' },
  { id: 'beginner', label: 'Beginner Friendly' },
  { id: 'advanced', label: 'Advanced' },
];

/** @type {{ year: string, icon: string, goals: string[], color: string }[]} */
const CLUB_GROWTH = [
  {
    year: 'Year 1',
    icon: '🌱',
    goals: [
      '200+ active members',
      'Weekly CP sessions',
      '1 Intra-University Contest',
    ],
    color: 'from-green-500/30 to-emerald-500/30',
  },
  {
    year: 'Year 2',
    icon: '🚀',
    goals: [
      'ICPC Regional Participation',
      'Inter-University Hackathon',
      '3 Industry Guest Talks',
    ],
    color: 'from-blue-500/30 to-cyan-500/30',
  },
  {
    year: 'Year 3',
    icon: '🏆',
    goals: [
      'National-level recognition',
      'Industry partnerships',
      'Sponsored Tech Fest',
    ],
    color: 'from-yellow-500/30 to-orange-500/30',
  },
];

/** @type {{ role: string, icon: string, description: string }[]} */
const LEADERSHIP_PATH = [
  { role: 'Member', icon: '👤', description: 'Join the club & attend events' },
  {
    role: 'Active Participant',
    icon: '⭐',
    description: 'Regular contest participation',
  },
  { role: 'Mentor', icon: '🎓', description: 'Guide junior members' },
  { role: 'Coordinator', icon: '📋', description: 'Organize club activities' },
  { role: 'Executive', icon: '💼', description: 'Lead specific departments' },
  { role: 'Club Lead', icon: '👑', description: 'Overall club leadership' },
];

/** @type {{ value: string, label: string, color: string }[]} */
const SUMMARY_STATS = [
  { value: '6', label: 'Career Levels', color: 'text-primary-300' },
  { value: '∞', label: 'Learning Opportunities', color: 'text-secondary-300' },
  { value: '1+', label: 'Years to Leadership', color: 'text-primary-300' },
];

/**
 * Normalize a roadmap from DB to UI shape.
 * @param {Object} r - Raw roadmap from DB
 * @returns {Object}
 */
function normalizeRoadmap(r) {
  const style = ROADMAP_STYLES[r.slug] || DEFAULT_STYLE;
  const content = r.content || {};
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    level: r.difficulty
      ? r.difficulty.charAt(0).toUpperCase() + r.difficulty.slice(1)
      : 'Beginner',
    icon: style.icon,
    gradient: style.gradient,
    borderColor: style.borderColor,
    hoverGlow: style.hoverGlow,
    description: r.description || '',
    duration: r.estimated_duration || '',
    stages: content.stages || [],
  };
}

/**
 * Single roadmap card.
 * @param {{ roadmap: Object }} props
 */
function RoadmapCard({ roadmap }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md transition-all duration-300 hover:border-white/30">
      <div className="from-primary-500/20 absolute -top-20 -right-20 h-64 w-64 rounded-full bg-linear-to-br to-transparent opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 text-4xl backdrop-blur-sm">
              {roadmap.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                {roadmap.title}
              </h3>
              <p className="text-sm text-gray-400">{roadmap.level}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
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
            {roadmap.duration}
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-gray-300 sm:text-base">
          {roadmap.description}
        </p>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-gray-400">Learning Journey</span>
            <span className="font-semibold text-white">
              {roadmap.stages.length} Stages
            </span>
          </div>
          <div className="flex gap-1">
            {roadmap.stages.map((_, idx) => (
              <div key={idx} className="h-1.5 flex-1 rounded-full bg-white/10">
                <div
                  className="from-primary-400 to-secondary-400 h-full rounded-full bg-linear-to-r opacity-0 transition-all delay-300 duration-700 group-hover:opacity-100"
                  style={{
                    width: '100%',
                    transitionDelay: `${300 + idx * 150}ms`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {roadmap.stages.map((stage, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/40"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                  {idx + 1}
                </div>
                <h4 className="font-semibold text-white">{stage.title}</h4>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {stage.topics.map((topic, ti) => (
                  <span
                    key={ti}
                    className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-white/10"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg
                  className="h-4 w-4 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Goal:</span> {stage.goal}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link
            href={`/roadmaps/${roadmap.slug}`}
            className="from-primary-500 to-secondary-500 block w-full rounded-lg bg-linear-to-r py-3 text-center font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Start Learning Path →
          </Link>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 h-1 bg-linear-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}

/**
 * Leadership step card (used in both desktop + mobile layouts).
 * @param {{ step: Object, index: number, total: number }} props
 */
function LeadershipCard({ step, index, total }) {
  const progress = ((index + 1) / total) * 100;
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md transition-all hover:border-white/20 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="from-primary-500/20 to-secondary-500/20 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br text-2xl">
            {step.icon}
          </div>
          <h3 className="text-lg font-bold text-white sm:text-xl">
            {step.role}
          </h3>
        </div>
        <span className="bg-primary-500/20 text-primary-300 rounded-full px-3 py-1 text-xs font-semibold sm:hidden">
          Lvl {index + 1}
        </span>
      </div>
      <p className="mb-3 text-sm text-gray-400">{step.description}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="from-primary-400 to-secondary-400 h-1.5 rounded-full bg-linear-to-r"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">Level {index + 1}</span>
      </div>
    </div>
  );
}

/**
 * Roadmaps listing page component.
 * @param {{ roadmaps?: Object[] }} props
 */
export default function RoadmapsClient({ roadmaps: propRoadmaps = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [roadmapsRef, roadmapsVisible] = useScrollReveal({ threshold: 0.05 });
  const [growthRef, growthVisible] = useScrollReveal({ threshold: 0.1 });
  const [leaderRef, leaderVisible] = useScrollReveal({ threshold: 0.05 });

  const roadmaps = propRoadmaps.map(normalizeRoadmap);

  const filteredRoadmaps = roadmaps.filter((r) => {
    if (activeFilter === 'all') return true;
    const lvl = (r.level || '').toLowerCase();
    if (activeFilter === 'beginner') return lvl.includes('beginner');
    if (activeFilter === 'advanced')
      return lvl.includes('advanced') || lvl.includes('intermediate');
    return true;
  });

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      <div className="fixed inset-0 -z-10">
        <div className="from-primary-500/10 absolute -top-20 -left-20 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl" />
        <div className="from-secondary-500/10 absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-linear-to-tl to-transparent blur-3xl" />
      </div>

      <PageHero
        badge="Learning Pathways"
        badgeIcon="🗺️"
        title="Club Learning Roadmaps"
        description="Structured pathways to become a skilled developer, problem solver, and tech leader"
        stats={[
          {
            value: String(roadmaps.length),
            label: 'Tech Roadmaps',
            color: 'text-primary-300',
          },
          {
            value: String(CLUB_GROWTH.length),
            label: 'Growth Stages',
            color: 'text-secondary-300',
          },
          {
            value: String(LEADERSHIP_PATH.length),
            label: 'Career Levels',
            color: 'text-primary-300',
          },
        ]}
      >
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <JoinButton
            href="/join"
            className="from-primary-500 to-secondary-500 group inline-flex items-center gap-2 rounded-lg bg-linear-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Join the Club
            <svg
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
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
          </JoinButton>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20"
          >
            Explore Events
          </Link>
        </div>
      </PageHero>

      {/* Technical Roadmaps */}
      <section
        ref={roadmapsRef}
        className="relative px-4 py-16 sm:px-6 md:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className={cn(
              'mb-12 text-center transition-all duration-700 md:mb-16',
              roadmapsVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0'
            )}
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Technical Learning Paths
            </h2>
            <p className="mx-auto max-w-2xl text-base text-gray-400 md:text-lg">
              Choose your path and start your journey to excellence
            </p>
          </div>

          <div className="mb-12 flex flex-wrap justify-center gap-3 md:mb-16">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'rounded-full px-6 py-3 text-sm font-semibold transition-all',
                  activeFilter === tab.id
                    ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                    : 'border border-white/20 bg-white/10 text-gray-300 backdrop-blur-md hover:bg-white/15'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {filteredRoadmaps.map((roadmap, index) => (
              <div
                key={roadmap.id}
                className={cn(
                  'transition-all duration-700',
                  roadmapsVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                )}
                style={{
                  transitionDelay: roadmapsVisible
                    ? `${300 + index * 150}ms`
                    : '0ms',
                }}
              >
                <RoadmapCard roadmap={roadmap} />
              </div>
            ))}
          </div>

          {filteredRoadmaps.length === 0 && (
            <EmptyState
              icon="🔍"
              title="No roadmaps found"
              description="Try selecting a different filter option"
            />
          )}
        </div>
      </section>

      {/* Club Growth Vision */}
      <section
        ref={growthRef}
        className="relative px-4 py-16 sm:px-6 md:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className={cn(
              'mb-12 text-center transition-all duration-700 md:mb-16',
              growthVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0'
            )}
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Club Growth Vision
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              Our journey towards excellence and national recognition
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {CLUB_GROWTH.map((year, index) => (
              <div
                key={index}
                className={cn(
                  'group rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition-all duration-700 hover:border-white/30',
                  growthVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                )}
                style={{
                  transitionDelay: growthVisible
                    ? `${200 + index * 150}ms`
                    : '0ms',
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-5xl">{year.icon}</div>
                  <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white">
                    {year.year}
                  </span>
                </div>
                <ul className="space-y-3">
                  {year.goals.map((goal, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <svg
                        className="text-primary-400 mt-0.5 h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Development Path */}
      <section
        ref={leaderRef}
        className="relative px-4 py-16 sm:px-6 md:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className={cn(
              'mb-12 text-center transition-all duration-700 md:mb-16',
              leaderVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0'
            )}
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Leadership Development Path
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              Your journey from member to leader
            </p>
          </div>

          <div className="relative">
            <div className="from-primary-500/30 via-secondary-500/30 to-primary-500/30 absolute top-0 left-1/2 hidden h-full w-0.5 -translate-x-1/2 bg-linear-to-b md:block" />

            <div className="space-y-8 md:space-y-12">
              {LEADERSHIP_PATH.map((step, index) => (
                <div
                  key={index}
                  className={cn(
                    'relative flex items-center gap-6',
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  )}
                >
                  {/* Desktop: alternating sides */}
                  <div className="hidden flex-1 md:block">
                    {index % 2 === 0 && (
                      <LeadershipCard
                        step={step}
                        index={index}
                        total={LEADERSHIP_PATH.length}
                      />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="border-primary-500/30 bg-primary-500/20 flex h-12 w-12 items-center justify-center rounded-full border-4 backdrop-blur-md">
                      <div className="bg-primary-400 h-4 w-4 rounded-full" />
                    </div>
                  </div>
                  <div className="hidden flex-1 md:block">
                    {index % 2 !== 0 && (
                      <LeadershipCard
                        step={step}
                        index={index}
                        total={LEADERSHIP_PATH.length}
                      />
                    )}
                  </div>

                  {/* Mobile */}
                  <div className="w-full md:hidden">
                    <LeadershipCard
                      step={step}
                      index={index}
                      total={LEADERSHIP_PATH.length}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3 md:mt-16">
            {SUMMARY_STATS.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-md"
              >
                <div className={cn('text-3xl font-bold', stat.color)}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        icon="🚀"
        title="Ready to Start Your Journey?"
        description="Join NEUPC today and accelerate your learning with structured guidance and mentorship."
        primaryAction={{ label: 'Join Now', href: '/join' }}
      />

      <ScrollToTop />
    </main>
  );
}
