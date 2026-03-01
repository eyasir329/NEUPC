/**
 * @file Roadmap detail page client component.
 * Shows a full learning path with interactive topic tracking, stage navigation,
 * resources, and mentors.
 *
 * @module RoadmapDetailClient
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import PageBackground from '../../_components/ui/PageBackground';
import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../../_components/ui/ScrollToTop'), {
  ssr: false,
});
import { cn } from '../../_lib/utils';

/* ──────────────────── Constants ──────────────────── */

/** @type {Object<string, { gradient: string, borderColor: string }>} */
const ROADMAP_STYLES = {
  'competitive-programming': {
    gradient: 'from-blue-500/20 to-purple-500/20',
    borderColor: 'border-blue-500/30',
  },
  'web-development': {
    gradient: 'from-green-500/20 to-teal-500/20',
    borderColor: 'border-green-500/30',
  },
  'ai-machine-learning': {
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
  },
  'app-development': {
    gradient: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/30',
  },
  cybersecurity: {
    gradient: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/30',
  },
};

const DEFAULT_STYLE = {
  gradient: 'from-gray-500/20 to-slate-500/20',
  borderColor: 'border-gray-500/30',
};

const CIRCUMFERENCE = 2 * Math.PI * 56;

/* ──────────────────── Helpers ──────────────────── */

/**
 * Normalize raw DB roadmap into a UI shape.
 * @param {Object} raw - Raw roadmap from props
 * @returns {Object} Normalized roadmap
 */
function normalizeRoadmap(raw) {
  const content = raw.content || {};
  const style = ROADMAP_STYLES[raw.slug] || DEFAULT_STYLE;
  return {
    id: raw.id,
    title: raw.title || 'Roadmap',
    icon: content.icon || '📚',
    level: raw.difficulty
      ? raw.difficulty.charAt(0).toUpperCase() + raw.difficulty.slice(1)
      : 'Beginner',
    duration: raw.estimated_duration || '',
    gradient: style.gradient,
    borderColor: style.borderColor,
    description: raw.description || '',
    prerequisites: raw.prerequisites || content.prerequisites || [],
    outcomes: content.outcomes || [],
    stages: (content.stages || []).map((stage, si) => ({
      ...stage,
      topics: (stage.topics || []).map((t, ti) => ({
        ...t,
        id: t.id || si * 100 + ti + 1,
      })),
    })),
    resources: content.resources || [],
    mentors: content.mentors || [],
  };
}

/* ──────────────────── Sub-components ──────────────────── */

/**
 * Breadcrumb navigation.
 * @param {{ title: string }} props
 */
function Breadcrumb({ title }) {
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Roadmaps', href: '/roadmaps' },
  ];

  return (
    <nav className="mb-6 md:mb-8" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs text-gray-400 sm:text-sm">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <Link
              href={item.href}
              className="underline-offset-4 transition-all duration-200 hover:text-white hover:underline"
            >
              {item.label}
            </Link>
            <svg
              className="h-4 w-4 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </li>
        ))}
        <li className="font-medium text-white" aria-current="page">
          {title}
        </li>
      </ol>
    </nav>
  );
}

/**
 * SVG circular progress indicator.
 * @param {{ progress: number }} props
 */
function ProgressCircle({ progress }) {
  return (
    <div className="mb-6 flex items-center justify-center py-4">
      <div className="relative">
        <div className="bg-primary-500/20 absolute inset-0 rounded-full blur-2xl" />
        <svg className="relative h-32 w-32 -rotate-90 transform drop-shadow-xl sm:h-36 sm:w-36">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-white/10"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="url(#progressGradient)"
            strokeWidth="10"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                className="text-primary-400"
                stopColor="currentColor"
              />
              <stop
                offset="100%"
                className="text-secondary-400"
                stopColor="currentColor"
              />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="from-primary-300 to-secondary-300 bg-linear-to-br bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            {Math.round(progress)}%
          </span>
          <span className="mt-1 text-[10px] font-medium text-gray-500 sm:text-xs">
            Complete
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Checklist item for a single topic within a stage.
 * @param {{ topic: Object, isCompleted: boolean, onToggle: Function }} props
 */
function TopicItem({ topic, isCompleted, onToggle }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 sm:p-5',
        isCompleted
          ? 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/5'
          : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30 hover:shadow-xl'
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          onClick={() => onToggle(topic.id)}
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200 sm:mt-1',
            isCompleted
              ? 'scale-110 border-green-500 bg-green-500 shadow-lg shadow-green-500/50'
              : 'border-white/30 hover:scale-105 hover:border-white/50 hover:bg-white/5'
          )}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted && (
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <h4
              className={cn(
                'text-base font-semibold transition-all sm:text-lg',
                isCompleted
                  ? 'text-green-300 line-through opacity-75'
                  : 'text-white'
              )}
            >
              {topic.name}
            </h4>
            <span className="bg-primary-500/20 text-primary-300 ring-primary-500/30 rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ring-1 sm:text-xs">
              ~{topic.hours}h
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {topic.resources.map((resource, idx) => (
              <span
                key={idx}
                className="group/tag inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-gray-400 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white hover:ring-white/20"
              >
                <svg
                  className="h-3 w-3 transition-transform group-hover/tag:scale-110"
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
                {resource}
              </span>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500 ease-out',
                isCompleted
                  ? 'w-full bg-linear-to-r from-green-400 to-green-500'
                  : 'bg-primary-500 w-0 group-hover:w-1/4'
              )}
            />
          </div>
        </div>
      </div>

      {!isCompleted && (
        <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      )}
    </div>
  );
}

/**
 * Resource link card.
 * @param {{ resource: Object }} props
 */
function ResourceCard({ resource }) {
  return (
    <a
      href={resource.url}
      className="group hover:border-primary-500/30 hover:shadow-primary-500/10 flex items-center gap-3 rounded-xl border border-white/10 bg-linear-to-r from-white/5 to-transparent p-4 backdrop-blur-xl transition-all hover:scale-[1.02] hover:bg-white/10 hover:shadow-lg sm:gap-4 sm:p-5"
    >
      <div className="bg-primary-500/20 ring-primary-500/20 group-hover:ring-primary-500/40 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ring-2 transition-all duration-300 group-hover:scale-110 sm:h-14 sm:w-14 sm:text-2xl">
        {resource.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="group-hover:text-primary-300 text-sm font-bold text-white transition-colors sm:text-base">
          {resource.name}
        </div>
        <div className="text-xs text-gray-400 sm:text-sm">{resource.type}</div>
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
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>
    </a>
  );
}

/**
 * Mentor card with connect button.
 * @param {{ mentor: Object }} props
 */
function MentorCard({ mentor }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-linear-to-r from-white/5 to-transparent p-4 backdrop-blur-xl transition-all hover:scale-[1.02] hover:border-white/20 hover:shadow-lg sm:gap-4 sm:p-5">
      <div className="from-primary-500/30 to-secondary-500/30 group-hover:ring-primary-500/30 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-lg font-bold text-white ring-2 ring-white/10 transition-all group-hover:ring-4 sm:h-16 sm:w-16 sm:text-xl">
        {mentor.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-white sm:text-base">
          {mentor.name}
        </div>
        <div className="text-xs text-gray-400 sm:text-sm">{mentor.role}</div>
      </div>
      <button className="border-primary-500/30 bg-primary-500/10 text-primary-300 hover:bg-primary-500/20 hover:border-primary-500/50 hover:shadow-primary-500/20 rounded-lg border px-4 py-2 text-xs font-bold transition-all hover:scale-105 hover:shadow-lg sm:text-sm">
        Connect
      </button>
    </div>
  );
}

/**
 * Checklist-style info card (prerequisites or outcomes).
 * @param {{ icon: string, title: string, items: string[], iconColor: string, hoverBorder: string, hoverShadow: string, checkIcon: string }} props
 */
function InfoListCard({
  icon,
  title,
  items,
  iconColor,
  hoverBorder,
  hoverShadow,
  checkIcon,
}) {
  return (
    <div
      className={cn(
        'group rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-5 backdrop-blur-xl transition-all duration-300 hover:shadow-lg sm:p-6 lg:p-8',
        hoverBorder,
        hoverShadow
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl text-xl ring-2 transition-all duration-300 group-hover:scale-110 sm:h-12 sm:w-12 sm:text-2xl',
            iconColor
          )}
        >
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white sm:text-xl">{title}</h3>
      </div>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/5"
          >
            <svg
              className={cn('mt-0.5 h-5 w-5 shrink-0', checkIcon)}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  title === 'Prerequisites'
                    ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    : 'M5 13l4 4L19 7'
                }
              />
            </svg>
            <span className="text-sm leading-relaxed text-gray-300 sm:text-base">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ──────────────────── Main Component ──────────────────── */

/**
 * Roadmap detail page component with interactive topic tracking.
 * @param {{ roadmap?: Object }} props
 */
export default function RoadmapDetailClient({ roadmap: propRoadmap = {} }) {
  const [activeStage, setActiveStage] = useState(0);
  const [completedTopics, setCompletedTopics] = useState([]);

  const currentRoadmap = useMemo(
    () => normalizeRoadmap(propRoadmap),
    [propRoadmap]
  );

  const totalTopics = useMemo(
    () => currentRoadmap.stages.reduce((acc, s) => acc + s.topics.length, 0),
    [currentRoadmap.stages]
  );
  const progress =
    totalTopics > 0 ? (completedTopics.length / totalTopics) * 100 : 0;

  const toggleTopic = useCallback((topicId) => {
    setCompletedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  }, []);

  const activeStageData = currentRoadmap.stages[activeStage];

  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      <PageBackground variant="fixed" />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8 lg:py-28">
        <div className="relative mx-auto max-w-7xl">
          <Breadcrumb title={currentRoadmap.title} />

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6 md:mb-8">
                <div
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-2xl border-2 bg-linear-to-br text-4xl shadow-lg backdrop-blur-xl transition-transform duration-300 hover:scale-105 sm:h-20 sm:w-20 sm:text-5xl',
                    currentRoadmap.borderColor,
                    currentRoadmap.gradient
                  )}
                >
                  {currentRoadmap.icon}
                </div>
                <div className="flex-1">
                  <h1 className="from-primary-300 to-secondary-300 mb-2 bg-linear-to-r via-white bg-clip-text text-2xl leading-tight font-extrabold text-transparent sm:text-3xl md:text-4xl lg:text-5xl">
                    {currentRoadmap.title}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-300 backdrop-blur-sm sm:text-sm">
                    <svg
                      className="h-3.5 w-3.5"
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
                    {currentRoadmap.level}
                  </span>
                </div>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-gray-300 sm:text-base md:mb-8 lg:text-lg">
                {currentRoadmap.description}
              </p>

              {/* Key Info Cards */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {[
                  {
                    label: 'Duration',
                    value: currentRoadmap.duration,
                    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                    color: 'text-primary-400',
                    hoverColor: 'group-hover:text-primary-300',
                  },
                  {
                    label: 'Learning Stages',
                    value: `${currentRoadmap.stages.length} Levels`,
                    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                    color: 'text-secondary-400',
                    hoverColor: 'group-hover:text-secondary-300',
                  },
                ].map((info) => (
                  <div
                    key={info.label}
                    className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-lg sm:p-5"
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-400 sm:text-sm">
                      <svg
                        className={cn('h-4 w-4 sm:h-5 sm:w-5', info.color)}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={info.iconPath}
                        />
                      </svg>
                      <span className="font-medium">{info.label}</span>
                    </div>
                    <div
                      className={cn(
                        'text-lg font-bold text-white transition-colors sm:text-xl lg:text-2xl',
                        info.hoverColor
                      )}
                    >
                      {info.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Progress Card */}
            <div className="lg:col-span-1">
              <div className="hover:shadow-primary-500/10 sticky top-4 rounded-2xl border border-white/10 bg-white/5 bg-linear-to-br from-white/5 to-transparent p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 sm:p-6 lg:top-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white sm:text-lg">
                    Your Progress
                  </h3>
                  <span className="text-xs font-medium text-gray-500">
                    Track your journey
                  </span>
                </div>

                <ProgressCircle progress={progress} />

                <div className="mb-6 space-y-3">
                  {[
                    {
                      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                      color: 'text-green-400',
                      label: 'Completed Topics',
                      value: completedTopics.length,
                      total: totalTopics,
                    },
                    {
                      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
                      color: 'text-blue-400',
                      label: 'Current Stage',
                      value: activeStage + 1,
                      total: currentRoadmap.stages.length,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between rounded-lg bg-black/20 p-3 text-xs transition-colors hover:bg-black/30 sm:text-sm"
                    >
                      <span className="flex items-center gap-2 text-gray-400">
                        <svg
                          className={cn('h-4 w-4', stat.color)}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={stat.icon}
                          />
                        </svg>
                        {stat.label}
                      </span>
                      <span className="font-bold text-white tabular-nums">
                        {stat.value}
                        <span className="text-gray-500">/{stat.total}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <button className="group border-primary-500/50 from-primary-500/30 to-secondary-500/30 hover:border-primary-500/70 hover:shadow-primary-500/20 relative w-full overflow-hidden rounded-xl border bg-linear-to-r py-3 font-bold text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg sm:py-3.5">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Learning
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
                  </span>
                  <div className="from-primary-500/0 via-primary-500/20 to-primary-500/0 absolute inset-0 -translate-x-full bg-linear-to-r transition-transform duration-1000 group-hover:translate-x-full" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prerequisites & Outcomes */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            <InfoListCard
              icon="📋"
              title="Prerequisites"
              items={currentRoadmap.prerequisites}
              iconColor="bg-yellow-500/20 ring-yellow-500/20 group-hover:ring-yellow-500/40"
              hoverBorder="hover:border-yellow-500/30"
              hoverShadow="hover:shadow-yellow-500/5"
              checkIcon="text-yellow-400"
            />
            <InfoListCard
              icon="🎯"
              title="Learning Outcomes"
              items={currentRoadmap.outcomes}
              iconColor="bg-green-500/20 ring-green-500/20 group-hover:ring-green-500/40"
              hoverBorder="hover:border-green-500/30"
              hoverShadow="hover:shadow-green-500/5"
              checkIcon="text-green-400"
            />
          </div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center md:mb-10 lg:mb-12">
            <div className="bg-primary-500/10 text-primary-300 ring-primary-500/20 mb-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 sm:text-sm">
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
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Interactive Learning Journey
            </div>
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
              Learning Path
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base md:text-lg">
              Follow this structured path to master{' '}
              {currentRoadmap.title.toLowerCase()}
            </p>
          </div>

          {/* Stage Navigation */}
          <div className="mb-6 flex justify-center sm:mb-8">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 shadow-lg backdrop-blur-xl sm:gap-3 sm:p-2">
              {currentRoadmap.stages.map((stage, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStage(idx)}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 sm:px-6 sm:py-2.5 sm:text-sm',
                    activeStage === idx
                      ? 'from-primary-500/40 to-secondary-500/40 scale-105 bg-linear-to-r text-white shadow-lg'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <span className="relative z-10">{stage.title}</span>
                  {activeStage === idx && (
                    <div className="bg-primary-500/20 absolute inset-0 rounded-full blur-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Stage Content */}
          <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-5 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                  {activeStageData.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-400 sm:text-base">
                  {activeStageData.description}
                </p>
                <div className="flex flex-wrap gap-3 text-xs sm:gap-4 sm:text-sm">
                  {[
                    {
                      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                      color: 'text-primary-400',
                      bg: 'bg-primary-500/10',
                      value: activeStageData.duration,
                    },
                    {
                      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                      color: 'text-secondary-400',
                      bg: 'bg-secondary-500/10',
                      value: `${activeStageData.topics.length} Topics`,
                    },
                  ].map((meta) => (
                    <div
                      key={meta.value}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-1.5',
                        meta.bg
                      )}
                    >
                      <svg
                        className={cn('h-4 w-4', meta.color)}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={meta.icon}
                        />
                      </svg>
                      <span className="font-medium text-gray-300">
                        {meta.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="shrink-0 rounded-xl bg-green-500/20 px-4 py-2.5 text-center ring-2 ring-green-500/20 transition-all duration-300 hover:bg-green-500/30 hover:ring-green-500/40 sm:px-5 sm:py-3">
                <div className="mb-0.5 text-[10px] font-medium tracking-wider text-green-400 uppercase sm:text-xs">
                  Goal
                </div>
                <div className="text-xs font-bold text-green-200 sm:text-sm">
                  {activeStageData.goal}
                </div>
              </div>
            </div>

            {/* Topics List */}
            <div className="space-y-3 sm:space-y-4">
              {activeStageData.topics.map((topic) => (
                <TopicItem
                  key={topic.id}
                  topic={topic}
                  isCompleted={completedTopics.includes(topic.id)}
                  onToggle={toggleTopic}
                />
              ))}
            </div>

            {/* Projects */}
            <div className="mt-6 rounded-xl border border-yellow-500/30 bg-linear-to-br from-yellow-500/10 to-yellow-500/5 p-4 ring-1 ring-yellow-500/20 backdrop-blur-sm transition-all hover:ring-yellow-500/40 sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-yellow-300 sm:text-sm">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span className="tracking-wide uppercase">
                  Recommended Projects
                </span>
              </div>
              <div className="space-y-2">
                {activeStageData.projects.map((project, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm text-yellow-200 sm:text-base"
                  >
                    <span className="mt-1 text-yellow-400">•</span>
                    <span>{project}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources & Mentors */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
            {/* Resources */}
            <div>
              <h3 className="mb-5 text-xl font-bold text-white sm:mb-6 sm:text-2xl lg:text-3xl">
                Learning Resources
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {currentRoadmap.resources.map((resource, idx) => (
                  <ResourceCard key={idx} resource={resource} />
                ))}
              </div>
            </div>

            {/* Mentors */}
            <div>
              <h3 className="mb-5 text-xl font-bold text-white sm:mb-6 sm:text-2xl lg:text-3xl">
                Expert Mentors
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {currentRoadmap.mentors.map((mentor, idx) => (
                  <MentorCard key={idx} mentor={mentor} />
                ))}
              </div>

              {/* Community CTA */}
              <div className="mt-5 rounded-xl border border-purple-500/30 bg-linear-to-br from-purple-500/10 to-purple-500/5 p-5 ring-1 ring-purple-500/20 backdrop-blur-xl transition-all hover:shadow-lg hover:shadow-purple-500/10 hover:ring-purple-500/40 sm:mt-6 sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-base font-bold text-white sm:text-lg">
                  <svg
                    className="h-5 w-5 text-purple-400"
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
                  Join Study Groups
                </div>
                <p className="mb-4 text-xs leading-relaxed text-gray-300 sm:text-sm">
                  Connect with fellow learners, share progress, and get help
                  from the community.
                </p>
                <button className="group w-full rounded-lg border border-purple-500/50 bg-purple-500/20 py-2.5 text-sm font-bold text-purple-200 transition-all hover:scale-[1.02] hover:border-purple-500/70 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20 sm:py-3 sm:text-base">
                  <span className="flex items-center justify-center gap-2">
                    Join Community
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="border-primary-500/30 from-primary-500/20 via-secondary-500/10 to-primary-500/20 relative overflow-hidden rounded-3xl border bg-linear-to-br p-6 text-center shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
            <div className="bg-primary-500/20 absolute -top-20 -right-20 h-40 w-40 animate-pulse rounded-full blur-3xl" />
            <div
              className="bg-secondary-500/20 absolute -bottom-20 -left-20 h-40 w-40 animate-pulse rounded-full blur-3xl"
              style={{ animationDelay: '1s' }}
            />

            <div className="relative">
              <div className="text-primary-300 mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold sm:text-sm">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Start Your Journey Today
              </div>
              <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">
                Ready to Get Started?
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-300 sm:mb-8 sm:text-base lg:text-lg">
                Join thousands of students mastering{' '}
                {currentRoadmap.title.toLowerCase()} with expert guidance
              </p>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <button className="group border-primary-500/50 from-primary-500/40 to-secondary-500/40 hover:shadow-primary-500/50 hover:border-primary-500/70 inline-flex w-full items-center justify-center gap-2 rounded-full border bg-linear-to-r px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition-all hover:scale-105 sm:w-auto sm:px-8 sm:py-4 sm:text-base">
                  Start This Roadmap
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
                </button>
                <Link
                  href="/roadmaps"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                >
                  Explore Other Roadmaps
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ScrollToTop />
    </main>
  );
}
