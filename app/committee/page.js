'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CommitteePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger animations on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Committee data
  const facultyAdvisor = {
    name: 'Dr. Mohammad Rahman',
    designation: 'Associate Professor, Department of CSE',
    university: 'Netrokona University',
    image: '/images/advisor.jpg',
    message:
      'The Programming Club aims to build problem solvers and innovators who can compete globally while contributing locally.',
    linkedin: '#',
  };

  const coreExecutives = [
    {
      id: 1,
      name: 'Md. Ariful Islam',
      role: 'President',
      batch: 'CSE 3rd Year',
      session: '2022-23',
      image: '/images/president.jpg',
      bio: 'ICPC Regionalist & Competitive Programmer',
      quote: "Leadership is not about title — it's about responsibility.",
      linkedin: '#',
      github: '#',
      email: 'president@neupc.com',
      achievements: ['ICPC Finalist', '1800+ Codeforces'],
    },
    {
      id: 2,
      name: 'Tasnim Akter',
      role: 'Vice President',
      batch: 'CSE 3rd Year',
      session: '2022-23',
      image: '/images/vp.jpg',
      bio: 'Full-stack Developer & Event Organizer',
      quote: 'Innovation distinguishes between a leader and a follower.',
      linkedin: '#',
      github: '#',
      email: 'vp@neupc.com',
      achievements: ['Full-stack Expert', 'Hackathon Winner'],
    },
    {
      id: 3,
      name: 'Sabbir Ahmed',
      role: 'General Secretary',
      batch: 'CSE 2nd Year',
      session: '2023-24',
      image: '/images/gs.jpg',
      bio: 'Problem Solver & Team Coordinator',
      quote: 'Organization is the key to success.',
      linkedin: '#',
      github: '#',
      email: 'gs@neupc.com',
      achievements: ['Expert Organizer', 'CF Specialist'],
    },
    {
      id: 4,
      name: 'Nusrat Jahan',
      role: 'Treasurer',
      batch: 'CSE 2nd Year',
      session: '2023-24',
      image: '/images/treasurer.jpg',
      bio: 'Finance Manager & Machine Learning Enthusiast',
      quote: 'Financial discipline drives sustainable growth.',
      linkedin: '#',
      github: '#',
      email: 'treasurer@neupc.com',
      achievements: ['ML Practitioner', 'Budget Expert'],
    },
  ];

  const departmentLeads = [
    {
      id: 5,
      name: 'Fahim Hassan',
      role: 'Technical Lead',
      department: 'Technical',
      batch: 'CSE 3rd Year',
      image: '/images/tech-lead.jpg',
      bio: 'Full-stack Developer & Mentor',
      linkedin: '#',
      github: '#',
      responsibility: 'Technical workshops & code reviews',
    },
    {
      id: 6,
      name: 'Raihan Kabir',
      role: 'Assistant Technical Lead',
      department: 'Technical',
      batch: 'CSE 2nd Year',
      image: '/images/asst-tech.jpg',
      bio: 'Backend Developer & Problem Setter',
      linkedin: '#',
      github: '#',
      responsibility: 'Contest management & mentoring',
    },
    {
      id: 7,
      name: 'Sadia Islam',
      role: 'Event Coordinator',
      department: 'Events',
      batch: 'CSE 2nd Year',
      image: '/images/event-coord.jpg',
      bio: 'Event Planner & Community Builder',
      linkedin: '#',
      github: '#',
      responsibility: 'Event planning & execution',
    },
    {
      id: 8,
      name: 'Mahmudul Hasan',
      role: 'Logistics Coordinator',
      department: 'Events',
      batch: 'CSE 1st Year',
      image: '/images/logistics.jpg',
      bio: 'Resource Manager & Organizer',
      linkedin: '#',
      github: '#',
      responsibility: 'Logistics & venue management',
    },
    {
      id: 9,
      name: 'Farzana Akter',
      role: 'Graphic Designer',
      department: 'Media',
      batch: 'CSE 2nd Year',
      image: '/images/designer.jpg',
      bio: 'UI/UX Designer & Visual Artist',
      linkedin: '#',
      github: '#',
      responsibility: 'Visual design & branding',
    },
    {
      id: 10,
      name: 'Tanvir Ahmed',
      role: 'Content Manager',
      department: 'Media',
      batch: 'CSE 2nd Year',
      image: '/images/content.jpg',
      bio: 'Content Writer & Storyteller',
      linkedin: '#',
      github: '#',
      responsibility: 'Content creation & documentation',
    },
    {
      id: 11,
      name: 'Sharmin Sultana',
      role: 'Social Media Manager',
      department: 'Media',
      batch: 'CSE 1st Year',
      image: '/images/social.jpg',
      bio: 'Digital Marketing & Community Engagement',
      linkedin: '#',
      github: '#',
      responsibility: 'Social media & online presence',
    },
  ];

  const executiveMembers = [
    {
      id: 12,
      name: 'Rakib Hasan',
      batch: 'CSE 2nd Year',
      image: '/images/exec1.jpg',
      responsibility: 'Workshop Coordination',
    },
    {
      id: 13,
      name: 'Mim Akter',
      batch: 'CSE 1st Year',
      image: '/images/exec2.jpg',
      responsibility: 'Member Relations',
    },
    {
      id: 14,
      name: 'Kamrul Islam',
      batch: 'CSE 2nd Year',
      image: '/images/exec3.jpg',
      responsibility: 'Contest Support',
    },
    {
      id: 15,
      name: 'Fatema Khatun',
      batch: 'CSE 1st Year',
      image: '/images/exec4.jpg',
      responsibility: 'Documentation',
    },
    {
      id: 16,
      name: 'Hasibul Hasan',
      batch: 'CSE 1st Year',
      image: '/images/exec5.jpg',
      responsibility: 'Technical Support',
    },
    {
      id: 17,
      name: 'Rima Akter',
      batch: 'CSE 2nd Year',
      image: '/images/exec6.jpg',
      responsibility: 'Event Support',
    },
  ];

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
        {/* Decorative Elements */}
        <div className="absolute inset-0 z-0">
          <div className="from-primary-500/10 absolute -top-20 -left-20 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl"></div>
          <div className="from-secondary-500/10 absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-linear-to-tl to-transparent blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className={`bg-primary-500/10 text-primary-300 ring-primary-500/20 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-all duration-700 sm:text-sm ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
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
              className={`mb-4 text-3xl leading-tight font-extrabold text-white transition-all delay-100 duration-700 sm:text-4xl md:text-5xl lg:text-6xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              Meet the Committee
            </h1>

            <p
              className={`mx-auto mb-8 max-w-3xl text-sm leading-relaxed text-gray-300 transition-all delay-200 duration-700 sm:text-base md:text-lg lg:text-xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              The dedicated team leading the Netrokona University Programming
              Club towards excellence in competitive programming and software
              development.
            </p>

            {/* Quick Stats */}
            <div
              className={`mx-auto grid max-w-4xl gap-4 transition-all delay-300 duration-700 sm:grid-cols-3 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              <div className="group hover:border-primary-500/30 hover:shadow-primary-500/10 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-xl">
                <div className="group-hover:text-primary-300 mb-1 text-2xl font-bold text-white transition-all sm:text-3xl">
                  15+
                </div>
                <div className="text-xs text-gray-400 transition-all group-hover:text-gray-300 sm:text-sm">
                  Committee Members
                </div>
              </div>
              <div className="group hover:border-secondary-500/30 hover:shadow-secondary-500/10 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-xl">
                <div className="group-hover:text-secondary-300 mb-1 text-2xl font-bold text-white transition-all sm:text-3xl">
                  7
                </div>
                <div className="text-xs text-gray-400 transition-all group-hover:text-gray-300 sm:text-sm">
                  Departments
                </div>
              </div>
              <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-purple-500/30 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/10">
                <div className="mb-1 text-2xl font-bold text-white transition-all group-hover:text-purple-300 sm:text-3xl">
                  1
                </div>
                <div className="text-xs text-gray-400 transition-all group-hover:text-gray-300 sm:text-sm">
                  Year Term
                </div>
              </div>
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
            className={`group hover:border-primary-500/30 hover:shadow-primary-500/10 relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-6 backdrop-blur-xl transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl sm:p-8 lg:p-10 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="bg-primary-500/20 absolute inset-0 rounded-full blur-xl"></div>
                <div className="border-primary-500/30 from-primary-500/20 to-secondary-500/20 relative h-32 w-32 overflow-hidden rounded-full border-4 bg-linear-to-br sm:h-40 sm:w-40 lg:h-48 lg:w-48">
                  <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white sm:text-6xl lg:text-7xl">
                    DR
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
                  className="border-primary-500/30 bg-primary-500/10 text-primary-300 hover:border-primary-500/50 hover:bg-primary-500/20 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:scale-105"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
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
              <div
                key={exec.id}
                className={`group hover:border-primary-500/30 hover:shadow-primary-500/10 relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-6 backdrop-blur-xl transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl sm:p-8 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                style={{ transitionDelay: `${(index + 1) * 150}ms` }}
              >
                {/* Background Gradient */}
                <div className="from-primary-500/20 to-secondary-500/20 absolute -top-20 -right-20 h-40 w-40 rounded-full bg-linear-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"></div>

                <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
                  {/* Avatar */}
                  <div className="relative mb-4 shrink-0 sm:mb-0">
                    <div className="bg-primary-500/20 absolute inset-0 rounded-full blur-lg"></div>
                    <div className="border-primary-500/30 from-primary-500/20 to-secondary-500/20 group-hover:ring-primary-500/20 relative h-24 w-24 overflow-hidden rounded-full border-4 bg-linear-to-br ring-4 ring-white/5 transition-all duration-300 group-hover:ring-8 sm:h-28 sm:w-28">
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white sm:text-4xl">
                        {exec.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    </div>
                    {/* Role Badge */}
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

                    {/* Social Links */}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                      <a
                        href={exec.linkedin}
                        className="group/link hover:border-primary-500/30 hover:bg-primary-500/10 hover:text-primary-300 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-400 transition-all"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        LinkedIn
                      </a>
                      <a
                        href={exec.github}
                        className="group/link hover:border-secondary-500/30 hover:bg-secondary-500/10 hover:text-secondary-300 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-400 transition-all"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Department Leads */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center md:mb-10">
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
              {['all', 'technical', 'events', 'media'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all duration-300 sm:px-6 sm:py-2.5 sm:text-sm ${
                    activeFilter === filter
                      ? 'from-primary-500/40 to-secondary-500/40 bg-linear-to-r text-white shadow-lg'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {filter === 'all' ? 'All Teams' : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Leads Grid */}
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {filteredLeads.map((lead, index) => (
              <div
                key={lead.id}
                className="group hover:border-secondary-500/30 hover:shadow-secondary-500/10 animate-fade-in relative overflow-hidden rounded-xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:shadow-xl sm:p-6"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Avatar */}
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div className="bg-secondary-500/20 absolute inset-0 rounded-full blur-md"></div>
                    <div className="border-secondary-500/30 from-secondary-500/20 to-primary-500/20 group-hover:ring-secondary-500/20 relative h-20 w-20 overflow-hidden rounded-full border-2 bg-linear-to-br ring-2 ring-white/5 transition-all duration-300 group-hover:ring-4">
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                        {lead.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="mb-1 text-lg font-bold text-white">
                    {lead.name}
                  </h3>
                  <p className="text-primary-300 mb-1 text-sm font-medium">
                    {lead.role}
                  </p>
                  <p className="mb-3 text-xs text-gray-400">{lead.batch}</p>
                  <p className="mb-4 text-sm leading-relaxed text-gray-300">
                    {lead.bio}
                  </p>

                  {/* Responsibility Badge */}
                  <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                    <div className="mb-1 text-[10px] font-semibold tracking-wide text-yellow-400 uppercase">
                      Responsibility
                    </div>
                    <p className="text-xs text-yellow-200">
                      {lead.responsibility}
                    </p>
                  </div>

                  {/* Social Links */}
                  <div className="flex justify-center gap-2">
                    <a
                      href={lead.linkedin}
                      className="hover:border-primary-500/30 hover:bg-primary-500/10 hover:text-primary-300 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                    <a
                      href={lead.github}
                      className="hover:border-secondary-500/30 hover:bg-secondary-500/10 hover:text-secondary-300 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Members */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center md:mb-10">
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
                className="group animate-fade-in relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-500 hover:scale-110 hover:border-purple-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/20"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Avatar */}
                <div className="mb-3 flex justify-center">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-purple-500/30 bg-linear-to-br from-purple-500/20 to-pink-500/20 ring-2 ring-white/5 transition-all duration-300 group-hover:ring-4 group-hover:ring-purple-500/20">
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="mb-1 text-sm font-bold text-white">
                    {member.name}
                  </h3>
                  <p className="mb-2 text-xs text-gray-400">{member.batch}</p>

                  {/* Responsibility - Shown on hover */}
                  <div className="max-h-0 overflow-hidden transition-all duration-500 group-hover:max-h-24">
                    <p className="mt-2 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2 py-1.5 text-xs font-medium text-purple-300 shadow-lg">
                      {member.responsibility}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20">
        <div className="via-primary-500/5 absolute inset-0 bg-linear-to-b from-transparent to-transparent"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 text-5xl">🎯</div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Want to Lead with Us?
            </h2>
            <p className="mb-8 text-lg text-gray-300">
              Applications for the next committee term open soon. Be part of
              shaping the future of programming at Netrokona University.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/join"
                className="from-primary-500 to-secondary-500 group inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Apply for Leadership
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20"
              >
                Contact Committee
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="group fixed right-4 bottom-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-white/50 hover:bg-white/20 active:scale-95 sm:right-6 sm:bottom-6 sm:h-12 sm:w-12 lg:right-8 lg:bottom-8"
          aria-label="Scroll to top"
        >
          <svg
            className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </main>
  );
}
