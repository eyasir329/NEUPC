/**
 * @file Committee page client component.
 * Displays faculty advisor, core executives, department leads, and executive members.
 *
 * @module CommitteeClient
 */

'use client';

import { useState } from 'react';
import CTASection from '../_components/ui/CTASection';
import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});
import PageBackground from '../_components/ui/PageBackground';
import { GitHubIcon, LinkedInIcon } from '../_components/ui/SocialIcons';
import { useDelayedLoad, useScrollReveal } from '../_lib/hooks';
import { cn, getInitials } from '../_lib/utils';

// ---------------------------------------------------------------------------
// Constants & defaults
// ---------------------------------------------------------------------------

/** Default faculty advisor fallback */
const DEFAULT_ADVISOR = {
  name: 'Dr. Mohammad Rahman',
  designation: 'Associate Professor, Department of CSE',
  university: 'Netrokona University',
  image: '/images/advisor.jpg',
  message:
    'The Programming Club aims to build problem solvers and innovators who can compete globally while contributing locally.',
  linkedin: '#',
};

/** Hero quick-stat items */
const HERO_STATS = [
  {
    value: '15+',
    label: 'Committee Members',
    borderColor: 'hover:border-primary-500/30',
    shadowColor: 'hover:shadow-primary-500/10',
    textColor: 'group-hover:text-primary-300',
  },
  {
    value: '7',
    label: 'Departments',
    borderColor: 'hover:border-secondary-500/30',
    shadowColor: 'hover:shadow-secondary-500/10',
    textColor: 'group-hover:text-secondary-300',
  },
  {
    value: '1',
    label: 'Year Term',
    borderColor: 'hover:border-purple-500/30',
    shadowColor: 'hover:shadow-purple-500/10',
    textColor: 'group-hover:text-purple-300',
  },
];

/** Department filter tabs */
const FILTER_TABS = ['all', 'technical', 'events', 'media'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Social link button.
 * @param {{ href: string, icon: React.ReactNode, hoverClasses?: string }} props
 */
function SocialButton({
  href,
  icon,
  hoverClasses = 'hover:border-primary-500/30 hover:bg-primary-500/10 hover:text-primary-300',
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all',
        hoverClasses
      )}
    >
      {icon}
    </a>
  );
}

/**
 * Social link with label (for exec cards).
 * @param {{ href: string, icon: React.ReactNode, label: string, hoverClasses?: string }} props
 */
function SocialButtonLabeled({
  href,
  icon,
  label,
  hoverClasses = 'hover:border-primary-500/30 hover:bg-primary-500/10 hover:text-primary-300',
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group/link flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-400 transition-all',
        hoverClasses
      )}
    >
      {icon}
      {label}
    </a>
  );
}

/**
 * Avatar circle with initials.
 * @param {{ name: string, size?: string, borderColor?: string, bgGradient?: string, ringHover?: string }} props
 */
function AvatarInitials({
  name,
  size = 'h-20 w-20',
  textSize = 'text-2xl',
  borderColor = 'border-secondary-500/30',
  bgGradient = 'from-secondary-500/20 to-primary-500/20',
  ringHover = 'group-hover:ring-secondary-500/20',
}) {
  return (
    <div className="relative">
      <div
        className={cn(
          'bg-secondary-500/20 absolute inset-0 rounded-full blur-md'
        )}
      />
      <div
        className={cn(
          'relative overflow-hidden rounded-full border-2 bg-linear-to-br ring-2 ring-white/5 transition-all duration-300 group-hover:ring-4',
          size,
          borderColor,
          bgGradient,
          ringHover
        )}
      >
        <div
          className={cn(
            'flex h-full w-full items-center justify-center font-bold text-white',
            textSize
          )}
        >
          {getInitials(name)}
        </div>
      </div>
    </div>
  );
}

/**
 * Core executive card.
 * @param {{ exec: object, index: number, isLoaded: boolean }} props
 */
function CoreExecCard({ exec, index, isLoaded }) {
  return (
    <div
      className={cn(
        'group hover:border-primary-500/30 hover:shadow-primary-500/10 relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-6 backdrop-blur-xl transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl sm:p-8',
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      )}
      style={{ transitionDelay: `${(index + 1) * 150}ms` }}
    >
      <div className="from-primary-500/20 to-secondary-500/20 absolute -top-20 -right-20 h-40 w-40 rounded-full bg-linear-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
        {/* Avatar */}
        <div className="relative mb-4 shrink-0 sm:mb-0">
          <div className="bg-primary-500/20 absolute inset-0 rounded-full blur-lg" />
          <div className="border-primary-500/30 from-primary-500/20 to-secondary-500/20 group-hover:ring-primary-500/20 relative h-24 w-24 overflow-hidden rounded-full border-4 bg-linear-to-br ring-4 ring-white/5 transition-all duration-300 group-hover:ring-8 sm:h-28 sm:w-28">
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white sm:text-4xl">
              {getInitials(exec.name)}
            </div>
          </div>
          <div className="border-primary-500/30 bg-primary-500/20 text-primary-200 absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide whitespace-nowrap uppercase backdrop-blur-sm">
            {exec.role}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-xl font-bold text-white sm:text-2xl">
            {exec.name}
          </h3>
          <p className="mb-1 text-xs text-gray-400 sm:text-sm">
            {exec.batch} • Session {exec.session}
          </p>
          <p className="mb-3 text-sm text-gray-300">{exec.bio}</p>

          {/* Quote */}
          <div className="border-primary-500/50 mb-4 rounded-lg border-l-4 bg-black/20 p-3">
            <p className="text-xs text-gray-400 italic sm:text-sm">
              &ldquo;{exec.quote}&rdquo;
            </p>
          </div>

          {/* Achievements */}
          {exec.achievements?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {exec.achievements.map((achievement, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-300 ring-1 ring-green-500/20 sm:text-xs"
                >
                  <svg
                    className="h-3 w-3"
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
                  {achievement}
                </span>
              ))}
            </div>
          )}

          {/* Social links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <SocialButtonLabeled
              href={exec.linkedin}
              icon={<LinkedInIcon className="h-4 w-4" />}
              label="LinkedIn"
            />
            <SocialButtonLabeled
              href={exec.github}
              icon={<GitHubIcon className="h-4 w-4" />}
              label="GitHub"
              hoverClasses="hover:border-secondary-500/30 hover:bg-secondary-500/10 hover:text-secondary-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Department lead card.
 * @param {{ lead: object, index: number }} props
 */
function LeadCard({ lead, index }) {
  return (
    <div className="group hover:border-secondary-500/30 hover:shadow-secondary-500/10 relative overflow-hidden rounded-xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:shadow-xl sm:p-6">
      <div className="mb-4 flex justify-center">
        <AvatarInitials name={lead.name} />
      </div>
      <div className="text-center">
        <h3 className="mb-1 text-lg font-bold text-white">{lead.name}</h3>
        <p className="text-primary-300 mb-1 text-sm font-medium">{lead.role}</p>
        <p className="mb-3 text-xs text-gray-400">{lead.batch}</p>
        <p className="mb-4 text-sm leading-relaxed text-gray-300">{lead.bio}</p>

        {/* Responsibility badge */}
        <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
          <div className="mb-1 text-[10px] font-semibold tracking-wide text-yellow-400 uppercase">
            Responsibility
          </div>
          <p className="text-xs text-yellow-200">{lead.responsibility}</p>
        </div>

        <div className="flex justify-center gap-2">
          <SocialButton
            href={lead.linkedin}
            icon={<LinkedInIcon className="h-4 w-4" />}
          />
          <SocialButton
            href={lead.github}
            icon={<GitHubIcon className="h-4 w-4" />}
            hoverClasses="hover:border-secondary-500/30 hover:bg-secondary-500/10 hover:text-secondary-300"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Executive member compact card.
 * @param {{ member: object, index: number }} props
 */
function MemberCard({ member, index }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-500 hover:scale-110 hover:border-purple-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/20">
      <div className="mb-3 flex justify-center">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-purple-500/30 bg-linear-to-br from-purple-500/20 to-pink-500/20 ring-2 ring-white/5 transition-all duration-300 group-hover:ring-4 group-hover:ring-purple-500/20">
          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
            {getInitials(member.name)}
          </div>
        </div>
      </div>
      <div className="text-center">
        <h3 className="mb-1 text-sm font-bold text-white">{member.name}</h3>
        <p className="mb-2 text-xs text-gray-400">{member.batch}</p>
        <div className="max-h-0 overflow-hidden transition-all duration-500 group-hover:max-h-24">
          <p className="mt-2 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2 py-1.5 text-xs font-medium text-purple-300 shadow-lg">
            {member.responsibility}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Committee page client component.
 *
 * @param {{ facultyAdvisor?: object, coreExecutives?: Array, departmentLeads?: Array, executiveMembers?: Array }} props
 */
export default function CommitteeClient({
  facultyAdvisor: propAdvisor = null,
  coreExecutives: propCore = [],
  departmentLeads: propLeads = [],
  executiveMembers: propExecs = [],
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const isLoaded = useDelayedLoad();
  const [leadsRef, leadsVisible] = useScrollReveal({ threshold: 0.05 });
  const [membersRef, membersVisible] = useScrollReveal({ threshold: 0.05 });

  // --- Data normalization ---
  const facultyAdvisor = propAdvisor || DEFAULT_ADVISOR;
  const coreExecutives = propCore;
  const departmentLeads = propLeads;
  const executiveMembers = propExecs;

  const filteredLeads =
    activeFilter === 'all'
      ? departmentLeads
      : departmentLeads.filter(
          (lead) => lead.department.toLowerCase() === activeFilter
        );

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <PageBackground variant="absolute" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className={cn(
                'bg-primary-500/10 text-primary-300 ring-primary-500/20 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-all duration-700 sm:text-sm',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : '-translate-y-4 opacity-0'
              )}
            >
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Leadership Team 2025-2026
            </div>

            <h1
              className={cn(
                'mb-4 text-3xl leading-tight font-extrabold text-white transition-all delay-100 duration-700 sm:text-4xl md:text-5xl lg:text-6xl',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
            >
              Meet the Committee
            </h1>

            <p
              className={cn(
                'mx-auto mb-8 max-w-3xl text-sm leading-relaxed text-gray-300 transition-all delay-200 duration-700 sm:text-base md:text-lg lg:text-xl',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
            >
              The dedicated team leading the Netrokona University Programming
              Club towards excellence in competitive programming and software
              development.
            </p>

            {/* Quick Stats */}
            <div
              className={cn(
                'mx-auto grid max-w-4xl gap-4 transition-all delay-300 duration-700 sm:grid-cols-3',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
            >
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    'group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-xl',
                    stat.borderColor,
                    stat.shadowColor
                  )}
                >
                  <div
                    className={cn(
                      'mb-1 text-2xl font-bold text-white transition-all sm:text-3xl',
                      stat.textColor
                    )}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-400 transition-all group-hover:text-gray-300 sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Faculty Advisor Section */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center md:mb-10">
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              Faculty Advisor
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Guiding our vision with expertise and experience
            </p>
          </div>

          <div
            className={cn(
              'group hover:border-primary-500/30 hover:shadow-primary-500/10 relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-6 backdrop-blur-xl transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl sm:p-8 lg:p-10',
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
          >
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="bg-primary-500/20 absolute inset-0 rounded-full blur-xl" />
                <div className="border-primary-500/30 from-primary-500/20 to-secondary-500/20 relative h-32 w-32 overflow-hidden rounded-full border-4 bg-linear-to-br sm:h-40 sm:w-40 lg:h-48 lg:w-48">
                  <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white sm:text-6xl lg:text-7xl">
                    {getInitials(facultyAdvisor.name)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                  {facultyAdvisor.name}
                </h3>
                <p className="text-primary-300 mb-1 text-sm font-medium sm:text-base">
                  {facultyAdvisor.designation}
                </p>
                <p className="mb-4 text-xs text-gray-400 sm:text-sm">
                  {facultyAdvisor.university}
                </p>

                <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5">
                  <div className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold tracking-wide text-blue-300 uppercase sm:text-sm md:justify-start">
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
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    Message
                  </div>
                  <p className="text-sm leading-relaxed text-gray-300 italic sm:text-base">
                    &ldquo;{facultyAdvisor.message}&rdquo;
                  </p>
                </div>

                <a
                  href={facultyAdvisor.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-primary-500/30 bg-primary-500/10 text-primary-300 hover:border-primary-500/50 hover:bg-primary-500/20 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:scale-105"
                >
                  <LinkedInIcon className="h-5 w-5" />
                  Connect on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Executive Panel */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center md:mb-10 lg:mb-12">
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl lg:text-5xl">
              Core Executive Panel
            </h2>
            <p className="text-sm text-gray-400 sm:text-base md:text-lg">
              The leadership driving our club&apos;s vision and mission
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {coreExecutives.map((exec, index) => (
              <CoreExecCard
                key={exec.id}
                exec={exec}
                index={index}
                isLoaded={isLoaded}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Department Leads */}
      <section
        ref={leadsRef}
        className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className={cn(
              'mb-8 text-center transition-all duration-700 md:mb-10',
              leadsVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0'
            )}
          >
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              Department Leads
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Specialized teams driving excellence in their domains
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl sm:gap-3 sm:p-2">
              {FILTER_TABS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all duration-300 sm:px-6 sm:py-2.5 sm:text-sm',
                    activeFilter === filter
                      ? 'from-primary-500/40 to-secondary-500/40 bg-linear-to-r text-white shadow-lg'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {filter === 'all' ? 'All Teams' : filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {filteredLeads.map((lead, index) => (
              <div
                key={lead.id}
                className={cn(
                  'transition-all duration-700',
                  leadsVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                )}
                style={{
                  transitionDelay: leadsVisible
                    ? `${200 + index * 100}ms`
                    : '0ms',
                }}
              >
                <LeadCard lead={lead} index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Members */}
      <section
        ref={membersRef}
        className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className={cn(
              'mb-8 text-center transition-all duration-700 md:mb-10',
              membersVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0'
            )}
          >
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              Executive Members
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Supporting the club&apos;s operations and initiatives
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {executiveMembers.map((member, index) => (
              <div
                key={member.id}
                className={cn(
                  'transition-all duration-700',
                  membersVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                )}
                style={{
                  transitionDelay: membersVisible
                    ? `${200 + index * 80}ms`
                    : '0ms',
                }}
              >
                <MemberCard member={member} index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        icon="🎯"
        title="Want to Lead with Us?"
        description="Applications for the next committee term open soon. Be part of shaping the future of programming at Netrokona University."
        primaryAction={{ label: 'Apply for Leadership', href: '/join' }}
        secondaryAction={{ label: 'Contact Committee', href: '/contact' }}
      />

      <ScrollToTop />
    </main>
  );
}
