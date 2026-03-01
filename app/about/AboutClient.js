/**
 * @file About page client component.
 * Renders detailed information about NEUPC — mission, vision, activities,
 * values, organizational structure, and growth initiatives.
 *
 * @module AboutClient
 */

'use client';

import Link from 'next/link';
import About from '../_components/sections/About';
import { useDelayedLoad, useScrollReveal } from '../_lib/hooks';
import CTASection from '../_components/ui/CTASection';
import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});
import PageBackground from '../_components/ui/PageBackground';
import { cn } from '../_lib/utils';

// ---------------------------------------------------------------------------
// Data configurations — single source of truth for all static content
// ---------------------------------------------------------------------------

/** Mission statement bullet items */
const MISSION_ITEMS = [
  'To enhance programming skills among students',
  'To introduce various branches of Computer Science beyond academic coursework',
  'To prepare students for competitive programming contests (ICPC, NCPC, etc.)',
  'To organize workshops, seminars, bootcamps, and internal contests',
  'To build a strong programming community within the university',
];

/** "What We Do" activity cards */
const ACTIVITY_CARDS = [
  {
    emoji: '💻',
    title: 'Competitive Programming Training',
    color: 'primary',
    items: [
      'Weekly practice sessions',
      'Algorithm & data structure workshops',
      'Internal mock contests',
    ],
  },
  {
    emoji: '🎓',
    title: 'Academic & Career Development',
    color: 'secondary',
    items: [
      'Career guidance sessions',
      'Research discussions',
      'Industry-oriented workshops',
    ],
  },
  {
    emoji: '🏆',
    title: 'Contest Participation',
    color: 'primary',
    items: [
      'ICPC preparation',
      'National programming contests',
      'Inter-university competitions',
    ],
  },
  {
    emoji: '👩‍💻',
    title: 'Women in Engineering (WIE)',
    color: 'secondary',
    items: [
      'Special programming sessions',
      'Leadership development',
      'Inclusive community building',
    ],
  },
];

/** Core values displayed in the grid */
const CORE_VALUES = [
  'Discipline & Professionalism',
  'Ethical Conduct',
  'Zero Tolerance for Discrimination',
  'Transparency in Finances',
  'Non-political Structure',
  'Non-profit Organization',
];

/** Organizational structure hierarchy */
const ORG_STRUCTURE = [
  {
    title: 'Faculty Advisors',
    description: 'Lecturers from the Department of CSE',
    dotClass: 'bg-primary-500 shadow-primary-500/50',
  },
  {
    title: 'Executive Committee',
    description: 'President, Vice President, Secretary, and other officers',
    dotClass: 'bg-secondary-500 shadow-secondary-500/50',
  },
  {
    title: 'Mentors',
    description: 'Senior students and alumni',
    dotClass: 'bg-primary-700 shadow-primary-700/50',
  },
  {
    title: 'Members',
    description: 'Active student participants',
    dotClass: 'bg-secondary-700 shadow-secondary-700/50',
  },
];

/** Skills developed through programming */
const SKILLS = [
  { emoji: '🧠', label: 'Logical reasoning' },
  { emoji: '🏗️', label: 'Structured thinking' },
  { emoji: '📊', label: 'Analytical problem solving' },
  { emoji: '🌍', label: 'Real-world solution building' },
];

/** Mentorship guidance areas */
const MENTORSHIP_AREAS = [
  'Competitive programming strategies',
  'Academic development',
  'Career direction',
  'Project building',
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Reusable activity card for the "What We Do" section.
 * @param {{ card: typeof ACTIVITY_CARDS[0], index: number }} props
 */
function ActivityCard({ card, index }) {
  const isPrimary = card.color === 'primary';
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-700 hover:-translate-y-2 hover:bg-white/15 hover:shadow-2xl',
        isPrimary
          ? 'hover:shadow-primary-500/20'
          : 'hover:shadow-secondary-500/20'
      )}
    >
      <div
        className={cn(
          'absolute -top-8 -right-8 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100',
          isPrimary ? 'from-primary-500/20' : 'from-secondary-500/20'
        )}
      />
      <div className="relative">
        <div
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-full text-4xl transition-transform group-hover:scale-110',
            isPrimary ? 'bg-primary-500/20' : 'bg-secondary-500/20'
          )}
        >
          {card.emoji}
        </div>
        <h3 className="mb-3 text-xl font-bold text-white">{card.title}</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          {card.items.map((item) => (
            <li key={item} className="flex items-start">
              <span
                className={cn(
                  'mr-2',
                  isPrimary ? 'text-primary-400' : 'text-secondary-400'
                )}
              >
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Single core value item.
 * @param {{ label: string, index: number }} props
 */
function CoreValueItem({ label, index }) {
  const isPrimary = index % 2 === 0;
  return (
    <div
      className={cn(
        'group flex items-center rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-700 hover:-translate-x-1 hover:bg-white/15 hover:shadow-xl',
        isPrimary
          ? 'hover:shadow-primary-500/20'
          : 'hover:shadow-secondary-500/20'
      )}
    >
      <span
        className={cn(
          'mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-all group-hover:scale-110',
          isPrimary
            ? 'bg-primary-500/20 group-hover:bg-primary-500/30'
            : 'bg-secondary-500/20 group-hover:bg-secondary-500/30'
        )}
      >
        ✔
      </span>
      <span className="text-base font-semibold text-gray-200 group-hover:text-white">
        {label}
      </span>
    </div>
  );
}

/**
 * Skill item for the "Why It Matters" section.
 * @param {{ skill: typeof SKILLS[0], index: number }} props
 */
function SkillItem({ skill, index }) {
  const isPrimary = index % 2 === 0;
  return (
    <div
      className={cn(
        'group/skill flex items-center rounded-xl p-5 transition-all duration-700 hover:scale-105 hover:shadow-lg',
        isPrimary
          ? 'bg-primary-500/20 hover:bg-primary-500/30 hover:shadow-primary-500/20'
          : 'bg-secondary-500/20 hover:bg-secondary-500/30 hover:shadow-secondary-500/20'
      )}
    >
      <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl transition-transform group-hover/skill:scale-110">
        {skill.emoji}
      </div>
      <span className="text-lg font-semibold text-gray-200 group-hover/skill:text-white">
        {skill.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * About page client component.
 *
 * @param {{ data?: object }} props - About page data from server
 */
export default function AboutClient({ data = {} }) {
  const isLoaded = useDelayedLoad();
  const [missionRef, missionVisible] = useScrollReveal({ threshold: 0.1 });
  const [activitiesRef, activitiesVisible] = useScrollReveal({
    threshold: 0.1,
  });
  const [valuesRef, valuesVisible] = useScrollReveal({ threshold: 0.1 });
  const [orgRef, orgVisible] = useScrollReveal({ threshold: 0.15 });
  const [skillsRef, skillsVisible] = useScrollReveal({ threshold: 0.15 });
  const [growthRef, growthVisible] = useScrollReveal({ threshold: 0.1 });

  const {
    title = 'Who We Are',
    description1 = '',
    description2 = '',
    what_we_do = [],
    stats = [],
  } = data;

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 z-0">
          <PageBackground variant="absolute" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className={cn(
                'mb-6 inline-block rounded-full bg-white/20 px-6 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-700',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : '-translate-y-4 opacity-0'
              )}
            >
              🎓 Student Organization
            </div>
            <h1
              className={cn(
                'from-primary-300 to-secondary-300 mb-6 bg-linear-to-r via-white bg-clip-text text-4xl leading-tight font-bold text-transparent transition-all duration-700 md:text-5xl lg:text-7xl',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
              style={{ transitionDelay: isLoaded ? '100ms' : '0ms' }}
            >
              About NEUPC
            </h1>
            <p
              className={cn(
                'mb-4 text-xl font-medium text-gray-300 transition-all duration-700 md:text-2xl lg:text-3xl',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
              style={{ transitionDelay: isLoaded ? '200ms' : '0ms' }}
            >
              Netrokona University Programming Club
            </p>
            <p
              className={cn(
                'text-base text-gray-400 transition-all duration-700 md:text-lg lg:text-xl',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
              style={{ transitionDelay: isLoaded ? '300ms' : '0ms' }}
            >
              Department of Computer Science and Engineering
            </p>
            <div
              className={cn(
                'mt-10 flex justify-center transition-all duration-700',
                isLoaded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              )}
              style={{ transitionDelay: isLoaded ? '500ms' : '0ms' }}
            >
              <div className="from-primary-400 via-secondary-400 to-primary-400 h-1.5 w-32 bg-linear-to-r shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <About variant="on" data={data} />

      {/* Mission & Vision Section */}
      <section
        ref={missionRef}
        className="relative bg-gray-900/50 py-20 md:py-28"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div
              className={cn(
                'mb-16 text-center transition-all duration-700',
                missionVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                Our Mission & Vision
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                Driving excellence in programming education and community
                building
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Mission */}
              <div
                className={cn(
                  'group relative overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md transition-all duration-700 hover:scale-105 hover:bg-white/15 md:p-10',
                  missionVisible
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-12 opacity-0'
                )}
                style={{ transitionDelay: missionVisible ? '200ms' : '0ms' }}
              >
                <div className="from-primary-500/20 absolute -top-10 -right-10 h-40 w-40 rounded-full bg-linear-to-br to-transparent blur-2xl transition-all group-hover:scale-150" />
                <div className="relative">
                  <div className="mb-6 flex items-center">
                    <div className="bg-primary-500/20 mr-4 flex h-16 w-16 items-center justify-center rounded-full backdrop-blur-sm transition-all group-hover:scale-110">
                      <span className="text-4xl">🎯</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                      Our Mission
                    </h2>
                  </div>
                  <ul className="space-y-4 text-gray-200">
                    {MISSION_ITEMS.map((item) => (
                      <li
                        key={item}
                        className="flex items-start transition-all hover:translate-x-2"
                      >
                        <span className="text-primary-400 mt-1 mr-3 text-lg">
                          ✓
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Vision */}
              <div
                className={cn(
                  'from-primary-500 to-secondary-500 group hover:shadow-primary-500/50 relative overflow-hidden rounded-2xl bg-linear-to-br p-8 text-white shadow-2xl transition-all duration-700 hover:scale-105 md:p-10',
                  missionVisible
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-12 opacity-0'
                )}
                style={{ transitionDelay: missionVisible ? '400ms' : '0ms' }}
              >
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition-all group-hover:scale-150" />
                <div className="relative">
                  <div className="mb-6 flex items-center">
                    <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm transition-all group-hover:scale-110">
                      <span className="text-4xl">🚀</span>
                    </div>
                    <h2 className="text-2xl font-bold md:text-3xl">
                      Our Vision
                    </h2>
                  </div>
                  <p className="text-primary-100 text-lg leading-relaxed md:text-xl">
                    To become a leading university programming community that
                    nurtures skilled, ethical, and innovative programmers
                    capable of competing at national and international levels.
                  </p>
                  <div className="mt-6 h-1 w-20 bg-white/50 transition-all group-hover:w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section
        ref={activitiesRef}
        className="relative overflow-hidden py-20 md:py-28"
      >
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/30" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div
              className={cn(
                'mb-16 text-center transition-all duration-700',
                activitiesVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                What We Do
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                Our activities and initiatives throughout the year
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {ACTIVITY_CARDS.map((card, index) => (
                <div
                  key={card.title}
                  className={cn(
                    'transition-all duration-700',
                    activitiesVisible
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0'
                  )}
                  style={{
                    transitionDelay: activitiesVisible
                      ? `${200 + index * 100}ms`
                      : '0ms',
                  }}
                >
                  <ActivityCard card={card} index={index} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section
        ref={valuesRef}
        className="relative bg-gray-900/50 py-20 md:py-28"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div
              className={cn(
                'mb-16 text-center transition-all duration-700',
                valuesVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                Our Core Values
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                The principles that guide our community
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CORE_VALUES.map((value, index) => (
                <div
                  key={value}
                  className={cn(
                    'transition-all duration-700',
                    valuesVisible
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0'
                  )}
                  style={{
                    transitionDelay: valuesVisible
                      ? `${200 + index * 80}ms`
                      : '0ms',
                  }}
                >
                  <CoreValueItem label={value} index={index} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Organizational Structure Section */}
      <section ref={orgRef} className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/30 to-transparent" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div
              className={cn(
                'mb-16 text-center transition-all duration-700',
                orgVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                📊 Organizational Structure
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                A well-defined hierarchy driving excellence
              </p>
            </div>

            <div className="group hover:shadow-3xl relative overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 md:p-12">
              <div className="from-primary-500/10 to-secondary-500/10 absolute -top-20 -right-20 h-60 w-60 rounded-full bg-linear-to-br blur-3xl transition-all group-hover:scale-150" />
              <div className="relative">
                <p className="mb-8 text-lg text-gray-200">
                  The club operates under a well-defined structure:
                </p>
                <div className="space-y-6">
                  {ORG_STRUCTURE.map((item) => (
                    <div
                      key={item.title}
                      className="group/item flex items-start transition-all hover:translate-x-2"
                    >
                      <div
                        className={cn(
                          'mt-1 mr-4 h-4 w-4 rounded-full shadow-lg transition-all group-hover/item:scale-125',
                          item.dotClass
                        )}
                      />
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {item.title}
                        </h4>
                        <p className="text-gray-300">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="bg-primary-500/10 border-primary-500 mt-8 rounded-lg border-l-4 p-4 text-gray-300 italic">
                  💼 All financial transactions require official signatory
                  approval and are maintained transparently according to club
                  policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters Section */}
      <section
        ref={skillsRef}
        className="relative bg-gray-900/50 py-20 md:py-28"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div
              className={cn(
                'mb-16 text-center transition-all duration-700',
                skillsVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                💡 Why the Programming Club Matters
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                More than code — building essential skills for the future
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md md:p-12">
              <div className="from-secondary-500/10 to-primary-500/10 absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-linear-to-tr blur-3xl transition-all group-hover:scale-150" />
              <div className="relative">
                <p className="mb-8 text-xl font-medium text-gray-200">
                  Programming is more than writing code — it develops:
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  {SKILLS.map((skill, index) => (
                    <SkillItem key={skill.label} skill={skill} index={index} />
                  ))}
                </div>
                <div className="from-primary-500/20 to-secondary-500/20 mt-8 rounded-xl bg-linear-to-r p-6">
                  <p className="text-lg leading-relaxed text-gray-100">
                    Through consistent practice and mentorship, the Programming
                    Club helps students transform from beginners into confident
                    programmers ready for competitive and professional
                    challenges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WIE & Mentorship Section */}
      <section
        ref={growthRef}
        className="relative overflow-hidden py-20 md:py-28"
      >
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-transparent" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div
              className={cn(
                'mb-16 text-center transition-all duration-700',
                growthVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                Fostering Growth & Inclusivity
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                Building leaders through mentorship and diversity
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* WIE */}
              <div
                className={cn(
                  'from-secondary-500 to-primary-500 group hover:shadow-3xl hover:shadow-secondary-500/30 relative overflow-hidden rounded-2xl bg-linear-to-br p-8 text-white shadow-2xl transition-all duration-700 hover:scale-105 md:p-10',
                  growthVisible
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-12 opacity-0'
                )}
                style={{ transitionDelay: growthVisible ? '200ms' : '0ms' }}
              >
                <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl transition-all group-hover:scale-150" />
                <div className="relative">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-5xl backdrop-blur-sm transition-transform group-hover:scale-110">
                    👩‍💻
                  </div>
                  <h2 className="mb-6 text-2xl font-bold md:text-3xl">
                    Women in Engineering (WIE) Branch
                  </h2>
                  <p className="text-primary-100 text-lg leading-relaxed">
                    The Programming Club also runs a dedicated Women in
                    Engineering (WIE) branch to encourage female participation
                    in programming and leadership roles. This branch organizes
                    focused sessions, mentoring programs, and awareness
                    initiatives to create an inclusive technical environment.
                  </p>
                  <div className="mt-6 h-1 w-24 bg-white/50 transition-all group-hover:w-32" />
                </div>
              </div>

              {/* Mentorship */}
              <div
                className={cn(
                  'group hover:shadow-3xl relative overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md transition-all duration-700 hover:scale-105 hover:bg-white/15 md:p-10',
                  growthVisible
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-12 opacity-0'
                )}
                style={{ transitionDelay: growthVisible ? '400ms' : '0ms' }}
              >
                <div className="from-primary-500/20 absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-linear-to-tr to-transparent blur-3xl transition-all group-hover:scale-150" />
                <div className="relative">
                  <div className="bg-primary-500/20 mb-6 flex h-16 w-16 items-center justify-center rounded-full text-5xl transition-transform group-hover:scale-110">
                    🎓
                  </div>
                  <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
                    Mentorship & Guidance
                  </h2>
                  <p className="mb-6 text-lg text-gray-200">
                    The club is supported by faculty advisors and experienced
                    mentors who guide students in:
                  </p>
                  <ul className="space-y-4 text-gray-200">
                    {MENTORSHIP_AREAS.map((area) => (
                      <li
                        key={area}
                        className="flex items-start transition-all hover:translate-x-2"
                      >
                        <span className="bg-primary-500/20 shadow-primary-500/50 mt-1 mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-lg">
                          ▸
                        </span>
                        <span className="text-base">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        icon="🎯"
        title="Ready to Join Us?"
        description="Become part of a community dedicated to excellence in programming and innovation."
        primaryAction={{ label: 'Join the Club', href: '/join' }}
      />

      <ScrollToTop />
    </main>
  );
}
