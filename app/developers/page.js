'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DevelopersPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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

  // Core development team
  const coreDevelopers = [
    {
      id: 1,
      name: 'Md. Ariful Islam',
      role: 'Lead Developer',
      category: 'core',
      photo: '/team/placeholder.jpg',
      bio: 'Full-stack developer passionate about scalable web applications and competitive programming.',
      stack: ['Next.js', 'React', 'Node.js', 'MongoDB'],
      github: 'https://github.com/',
      linkedin: 'https://linkedin.com/',
      portfolio: '#',
    },
    {
      id: 2,
      name: 'Sabbir Ahmed',
      role: 'Frontend Developer',
      category: 'core',
      photo: '/team/placeholder.jpg',
      bio: 'UI/UX specialist focused on creating beautiful, responsive interfaces with modern frameworks.',
      stack: ['React', 'Tailwind CSS', 'TypeScript', 'Figma'],
      github: 'https://github.com/',
      linkedin: 'https://linkedin.com/',
      portfolio: '#',
    },
    {
      id: 3,
      name: 'Rifat Hossain',
      role: 'Backend Developer',
      category: 'core',
      photo: '/team/placeholder.jpg',
      bio: 'Backend architect specializing in API design, database optimization, and security.',
      stack: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL'],
      github: 'https://github.com/',
      linkedin: 'https://linkedin.com/',
      portfolio: '#',
    },
    {
      id: 4,
      name: 'Tasnim Rahman',
      role: 'UI/UX Designer',
      category: 'core',
      photo: '/team/placeholder.jpg',
      bio: 'Creative designer crafting intuitive user experiences and cohesive brand identities.',
      stack: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator'],
      github: 'https://github.com/',
      linkedin: 'https://linkedin.com/',
      portfolio: '#',
    },
  ];

  // Contributors
  const contributors = [
    {
      id: 5,
      name: 'Fahim Khan',
      role: 'Content Writer',
      category: 'contributor',
      contribution: 'Documentation & Blog Posts',
      github: 'https://github.com/',
    },
    {
      id: 6,
      name: 'Nusrat Jahan',
      role: 'QA Tester',
      category: 'contributor',
      contribution: 'Testing & Bug Reports',
      github: 'https://github.com/',
    },
    {
      id: 7,
      name: 'Rakib Hassan',
      role: 'Photographer',
      category: 'contributor',
      contribution: 'Event Photography',
      github: '#',
    },
    {
      id: 8,
      name: 'Sumaya Akter',
      role: 'Developer',
      category: 'contributor',
      contribution: 'Feature Development',
      github: 'https://github.com/',
    },
    {
      id: 9,
      name: 'Tanvir Islam',
      role: 'DevOps',
      category: 'contributor',
      contribution: 'Deployment & CI/CD',
      github: 'https://github.com/',
    },
    {
      id: 10,
      name: 'Mitu Rani',
      role: 'Technical Writer',
      category: 'contributor',
      contribution: 'API Documentation',
      github: 'https://github.com/',
    },
  ];

  // Tech stack
  const techStack = {
    frontend: [
      { name: 'Next.js', icon: '⚡' },
      { name: 'React', icon: '⚛️' },
      { name: 'Tailwind CSS', icon: '🎨' },
      { name: 'TypeScript', icon: '📘' },
    ],
    backend: [
      { name: 'Node.js', icon: '🟢' },
      { name: 'Express', icon: '🚂' },
      { name: 'MongoDB', icon: '🍃' },
      { name: 'PostgreSQL', icon: '🐘' },
    ],
    deployment: [
      { name: 'Vercel', icon: '▲' },
      { name: 'GitHub Actions', icon: '🔄' },
      { name: 'Docker', icon: '🐳' },
      { name: 'AWS', icon: '☁️' },
    ],
    tools: [
      { name: 'Git', icon: '📦' },
      { name: 'Figma', icon: '🎯' },
      { name: 'VS Code', icon: '💻' },
      { name: 'Postman', icon: '📮' },
    ],
  };

  // Timeline
  const timeline = [
    {
      year: '2024',
      title: 'Project Initiated',
      description: 'Website concept proposed and planning began',
      status: 'completed',
    },
    {
      year: '2025',
      title: 'MVP Launch',
      description: 'Public website launched with core features',
      status: 'completed',
    },
    {
      year: '2026',
      title: 'Member Portal',
      description: 'Authentication and member dashboard added',
      status: 'current',
    },
    {
      year: 'Future',
      title: 'Mobile App',
      description: 'Native mobile application development',
      status: 'planned',
    },
  ];

  // GitHub stats (mock data)
  const githubStats = {
    commits: '500+',
    contributors: '15',
    stars: '42',
    forks: '12',
  };

  const filteredDevelopers =
    activeTab === 'all'
      ? coreDevelopers
      : coreDevelopers.filter((dev) => dev.category === activeTab);

  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8 lg:py-28">
        {/* Animated Decorative Elements */}
        <div className="from-primary-500/10 fixed top-20 right-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"></div>
        <div
          className="from-secondary-500/10 fixed bottom-20 left-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"
          style={{ animationDelay: '1s' }}
        ></div>

        <div className="relative mx-auto max-w-7xl text-center">
          <div
            className={`bg-primary-500/10 text-primary-300 ring-primary-500/20 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-all duration-700 sm:text-sm ${
              isLoaded
                ? 'translate-y-0 opacity-100'
                : '-translate-y-4 opacity-0'
            }`}
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
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            Development Team
          </div>

          <h1
            className={`from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text font-mono text-3xl leading-tight font-extrabold text-transparent transition-all delay-100 duration-700 sm:text-4xl md:text-5xl lg:text-6xl ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            Meet the Developers
          </h1>

          <p
            className={`mx-auto mb-8 max-w-3xl text-sm leading-relaxed text-gray-300 transition-all delay-200 duration-700 sm:text-base md:text-lg lg:text-xl ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            The minds behind the digital platform of Netrokona University
            Programming Club. Passionate developers building the future of our
            community.
          </p>

          {/* GitHub Stats */}
          <div
            className={`mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 transition-all delay-300 duration-700 sm:grid-cols-4 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-purple-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="mb-1 text-2xl font-bold text-purple-300 transition-all duration-300 group-hover:scale-110 sm:text-3xl">
                {githubStats.commits}
              </div>
              <div className="text-xs text-gray-400 sm:text-sm">Commits</div>
            </div>
            <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-blue-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/20">
              <div className="mb-1 text-2xl font-bold text-blue-300 transition-all duration-300 group-hover:scale-110 sm:text-3xl">
                {githubStats.contributors}
              </div>
              <div className="text-xs text-gray-400 sm:text-sm">
                Contributors
              </div>
            </div>
            <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-pink-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-pink-500/20">
              <div className="mb-1 text-2xl font-bold text-pink-300 transition-all duration-300 group-hover:scale-110 sm:text-3xl">
                {githubStats.stars}
              </div>
              <div className="text-xs text-gray-400 sm:text-sm">Stars</div>
            </div>
            <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-cyan-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/20">
              <div className="mb-1 text-2xl font-bold text-cyan-300 transition-all duration-300 group-hover:scale-110 sm:text-3xl">
                {githubStats.forks}
              </div>
              <div className="text-xs text-gray-400 sm:text-sm">Forks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Development Team */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              Core Development Team
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              The architects of our digital ecosystem
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coreDevelopers.map((dev, index) => (
              <div
                key={dev.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="group animate-fade-in hover:border-primary-500/30 hover:shadow-primary-500/20 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-2xl"
              >
                {/* Photo */}
                <div className="from-primary-500/20 to-secondary-500/20 relative h-48 overflow-hidden bg-linear-to-br">
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="h-20 w-20 text-white/30 transition-transform duration-300 group-hover:scale-110"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="mb-1 text-lg font-bold text-white">
                    {dev.name}
                  </h3>
                  <p className="text-primary-400 mb-3 text-sm font-semibold">
                    {dev.role}
                  </p>
                  <p className="mb-4 text-xs leading-relaxed text-gray-400">
                    {dev.bio}
                  </p>

                  {/* Tech Stack */}
                  <div className="mb-4 flex flex-wrap gap-1">
                    {dev.stack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="bg-primary-500/10 text-primary-300 rounded-full px-2 py-1 text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-3">
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:border-primary-500/30 hover:bg-primary-500/10 hover:text-primary-300 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                    <a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                    <a
                      href={dev.portfolio}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
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
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              Tech Stack
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Technologies powering our platform
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Frontend */}
            <div className="group hover:border-primary-500/30 hover:shadow-primary-500/10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-primary-500/20 flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                  🎨
                </div>
                <h3 className="text-lg font-bold text-white">Frontend</h3>
              </div>
              <div className="space-y-2">
                {techStack.frontend.map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <span>{tech.icon}</span>
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Backend */}
            <div className="group hover:border-secondary-500/30 hover:shadow-secondary-500/10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-secondary-500/20 flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                  ⚙️
                </div>
                <h3 className="text-lg font-bold text-white">Backend</h3>
              </div>
              <div className="space-y-2">
                {techStack.backend.map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <span>{tech.icon}</span>
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deployment */}
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                  ☁️
                </div>
                <h3 className="text-lg font-bold text-white">Deployment</h3>
              </div>
              <div className="space-y-2">
                {techStack.deployment.map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <span>{tech.icon}</span>
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-pink-500/10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/20 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                  🛠️
                </div>
                <h3 className="text-lg font-bold text-white">Tools</h3>
              </div>
              <div className="space-y-2">
                {techStack.tools.map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <span>{tech.icon}</span>
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              Contributors
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Special thanks to everyone who helped build this platform
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contributors.map((contributor, index) => (
              <div
                key={contributor.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="group animate-fade-in hover:border-primary-500/30 hover:shadow-primary-500/10 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-white">
                      {contributor.name}
                    </h3>
                    <p className="text-primary-400 mb-2 text-xs font-semibold">
                      {contributor.role}
                    </p>
                    <p className="text-xs text-gray-400">
                      {contributor.contribution}
                    </p>
                  </div>
                  <a
                    href={contributor.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:border-primary-500/30 hover:bg-primary-500/10 hover:text-primary-300 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:scale-110 active:scale-95"
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
            ))}
          </div>
        </div>
      </section>

      {/* Development Timeline */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              Development Timeline
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Our journey of building this platform
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="from-primary-500/50 via-secondary-500/50 absolute top-0 bottom-0 left-4 w-0.5 bg-linear-to-b to-purple-500/50 sm:left-1/2"></div>

            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div
                  key={index}
                  className={`relative flex items-center gap-4 ${
                    index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-4 flex h-3 w-3 items-center justify-center sm:left-1/2 sm:-translate-x-1/2">
                    <div
                      className={`h-3 w-3 rounded-full border-2 ${
                        item.status === 'completed'
                          ? 'border-green-500 bg-green-500/50'
                          : item.status === 'current'
                            ? 'border-primary-500 bg-primary-500/50 animate-pulse'
                            : 'border-gray-500 bg-gray-500/50'
                      }`}
                    ></div>
                  </div>

                  {/* Content */}
                  <div className="ml-12 flex-1 sm:ml-0 sm:w-1/2">
                    <div
                      className={`hover:border-primary-500/30 hover:shadow-primary-500/10 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-lg ${
                        index % 2 === 0 ? 'sm:mr-8' : 'sm:ml-8'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="bg-primary-500/20 text-primary-300 rounded-full px-3 py-1 text-xs font-bold">
                          {item.year}
                        </span>
                        {item.status === 'current' && (
                          <span className="bg-secondary-500/20 text-secondary-300 rounded-full px-3 py-1 text-xs font-bold">
                            Current
                          </span>
                        )}
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 text-6xl">💻</div>
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Want to Contribute?
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-gray-300 sm:text-base lg:text-lg">
            This project follows collaborative development practices.
            Contributions from club members are welcomed through GitHub.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group border-primary-500/50 from-primary-500/40 to-secondary-500/40 hover:shadow-primary-500/50 hover:border-primary-500/70 relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border bg-linear-to-r px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>View Repository</span>
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
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
            <Link
              href="/contact"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-white/10 hover:shadow-lg active:scale-95 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              <span>Contact Team</span>
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
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
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="group animate-fade-in fixed right-4 bottom-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-white/30 hover:bg-white/20 active:scale-95 sm:right-6 sm:bottom-6 sm:h-12 sm:w-12 lg:right-8 lg:bottom-8"
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
