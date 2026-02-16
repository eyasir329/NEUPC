'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RoadmapsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const roadmaps = [
    {
      id: 1,
      slug: 'competitive-programming',
      title: 'Competitive Programming',
      category: 'technical',
      level: 'Beginner to Advanced',
      icon: '🧠',
      gradient: 'from-blue-500/20 to-purple-500/20',
      borderColor: 'border-blue-500/30',
      hoverGlow: 'hover:shadow-blue-500/20',
      description:
        'Master algorithms and problem-solving to compete in ICPC and beyond.',
      duration: '6-12 months',
      stages: [
        {
          title: 'Foundation',
          topics: [
            'C/C++ Basics',
            'STL',
            'Time Complexity',
            'Basic Problem Solving',
          ],
          goal: 'Solve Codeforces Div3 problems',
        },
        {
          title: 'Intermediate',
          topics: [
            'Recursion',
            'Binary Search',
            'Greedy',
            'Graph Basics',
            'Prefix Sum',
          ],
          goal: 'Solve Codeforces Div2 C-level',
        },
        {
          title: 'Advanced',
          topics: [
            'Dynamic Programming',
            'Graph Algorithms',
            'Number Theory',
            'Segment Tree',
          ],
          goal: 'ICPC Regional, 1700+ CF Rating',
        },
      ],
    },
    {
      id: 2,
      slug: 'web-development',
      title: 'Web Development',
      category: 'technical',
      level: 'Beginner to Professional',
      icon: '💻',
      gradient: 'from-green-500/20 to-teal-500/20',
      borderColor: 'border-green-500/30',
      hoverGlow: 'hover:shadow-green-500/20',
      description:
        'Build modern full-stack web applications from scratch to deployment.',
      duration: '4-8 months',
      stages: [
        {
          title: 'Frontend Basics',
          topics: ['HTML', 'CSS', 'Tailwind CSS', 'JavaScript ES6'],
          goal: 'Build responsive landing pages',
        },
        {
          title: 'Modern Frontend',
          topics: ['React', 'Next.js', 'API Integration', 'State Management'],
          goal: 'Create dynamic web apps',
        },
        {
          title: 'Backend & Deployment',
          topics: [
            'Node.js',
            'Express',
            'MongoDB',
            'Authentication',
            'Vercel/VPS',
          ],
          goal: 'Full-stack project deployment',
        },
      ],
    },
    {
      id: 3,
      slug: 'ai-machine-learning',
      title: 'AI & Machine Learning',
      category: 'technical',
      level: 'Intermediate to Advanced',
      icon: '🤖',
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
      hoverGlow: 'hover:shadow-purple-500/20',
      description:
        'Dive into artificial intelligence, machine learning, and deep learning.',
      duration: '8-12 months',
      stages: [
        {
          title: 'Math & Python',
          topics: ['Python Basics', 'NumPy', 'Pandas', 'Linear Algebra'],
          goal: 'Data manipulation proficiency',
        },
        {
          title: 'ML Fundamentals',
          topics: [
            'Regression',
            'Classification',
            'Scikit-learn',
            'Model Evaluation',
          ],
          goal: 'Build ML models',
        },
        {
          title: 'Deep Learning',
          topics: [
            'TensorFlow/PyTorch',
            'CNN',
            'NLP Basics',
            'Kaggle Projects',
          ],
          goal: 'Advanced AI applications',
        },
      ],
    },
    {
      id: 4,
      slug: 'app-development',
      title: 'App Development',
      category: 'technical',
      level: 'Beginner to Professional',
      icon: '📱',
      gradient: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
      hoverGlow: 'hover:shadow-orange-500/20',
      description:
        'Create cross-platform mobile applications for Android and iOS.',
      duration: '5-9 months',
      stages: [
        {
          title: 'Mobile Basics',
          topics: [
            'Flutter/React Native',
            'Dart/JavaScript',
            'UI Components',
            'Navigation',
          ],
          goal: 'Build simple mobile apps',
        },
        {
          title: 'Advanced Features',
          topics: [
            'State Management',
            'Firebase',
            'API Integration',
            'Local Storage',
          ],
          goal: 'Feature-rich applications',
        },
        {
          title: 'Publishing',
          topics: ['App Optimization', 'Testing', 'Play Store', 'App Store'],
          goal: 'Published mobile app',
        },
      ],
    },
    {
      id: 5,
      slug: 'cybersecurity',
      title: 'Cybersecurity',
      category: 'technical',
      level: 'Intermediate to Advanced',
      icon: '🔐',
      gradient: 'from-red-500/20 to-rose-500/20',
      borderColor: 'border-red-500/30',
      hoverGlow: 'hover:shadow-red-500/20',
      description:
        'Learn ethical hacking, penetration testing, and security fundamentals.',
      duration: '6-10 months',
      stages: [
        {
          title: 'Foundations',
          topics: [
            'Networking Basics',
            'Linux',
            'Command Line',
            'Cryptography',
          ],
          goal: 'Understanding security concepts',
        },
        {
          title: 'Security Skills',
          topics: ['Web Security', 'OWASP Top 10', 'Burp Suite', 'Metasploit'],
          goal: 'Identify vulnerabilities',
        },
        {
          title: 'Advanced Hacking',
          topics: [
            'CTF Participation',
            'Penetration Testing',
            'Exploit Development',
          ],
          goal: 'Ethical hacking certification',
        },
      ],
    },
  ];

  const clubGrowth = [
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

  const leadershipPath = [
    {
      role: 'Member',
      icon: '👤',
      description: 'Join the club & attend events',
    },
    {
      role: 'Active Participant',
      icon: '⭐',
      description: 'Regular contest participation',
    },
    { role: 'Mentor', icon: '🎓', description: 'Guide junior members' },
    {
      role: 'Coordinator',
      icon: '📋',
      description: 'Organize club activities',
    },
    { role: 'Executive', icon: '💼', description: 'Lead specific departments' },
    { role: 'Club Lead', icon: '👑', description: 'Overall club leadership' },
  ];

  const filteredRoadmaps = roadmaps.filter((r) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'beginner') {
      return r.level.toLowerCase().includes('beginner');
    }
    if (activeFilter === 'advanced') {
      return r.level.toLowerCase().includes('advanced');
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10">
        <div className="from-primary-500/10 absolute -top-20 -left-20 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl"></div>
        <div className="from-secondary-500/10 absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-linear-to-tl to-transparent blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="relative mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 text-sm font-medium backdrop-blur-sm">
            <span className="text-2xl">🗺️</span>
            <span className="text-primary-300">Learning Pathways</span>
          </div>

          <h1 className="from-primary-300 to-secondary-300 mb-6 bg-linear-to-r via-white bg-clip-text text-4xl leading-tight font-bold text-transparent sm:text-5xl md:text-6xl">
            Club Learning Roadmaps
          </h1>

          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-300 md:text-xl">
            Structured pathways to become a skilled developer, problem solver,
            and tech leader
          </p>

          {/* Quick Stats */}
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3 md:mt-12">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md">
              <div className="text-primary-300 text-3xl font-bold">5</div>
              <div className="text-sm text-gray-400">Tech Roadmaps</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md">
              <div className="text-secondary-300 text-3xl font-bold">3</div>
              <div className="text-sm text-gray-400">Growth Stages</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md">
              <div className="text-primary-300 text-3xl font-bold">6</div>
              <div className="text-sm text-gray-400">Career Levels</div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
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
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20"
            >
              Explore Events
            </Link>
          </div>
        </div>
      </section>

      {/* Roadmaps Section */}
      <section className="relative px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Technical Learning Paths
            </h2>
            <p className="mx-auto max-w-2xl text-base text-gray-400 md:text-lg">
              Choose your path and start your journey to excellence
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-12 flex flex-wrap justify-center gap-3 md:mb-16">
            <button
              onClick={() => setActiveFilter('all')}
              className={`rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                  : 'border border-white/20 bg-white/10 text-gray-300 backdrop-blur-md hover:bg-white/15'
              }`}
            >
              All Paths
            </button>
            <button
              onClick={() => setActiveFilter('beginner')}
              className={`rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                activeFilter === 'beginner'
                  ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                  : 'border border-white/20 bg-white/10 text-gray-300 backdrop-blur-md hover:bg-white/15'
              }`}
            >
              Beginner Friendly
            </button>
            <button
              onClick={() => setActiveFilter('advanced')}
              className={`rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                activeFilter === 'advanced'
                  ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                  : 'border border-white/20 bg-white/10 text-gray-300 backdrop-blur-md hover:bg-white/15'
              }`}
            >
              Advanced
            </button>
          </div>

          {/* Roadmap Cards Grid */}
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {filteredRoadmaps.map((roadmap, index) => (
              <div
                key={roadmap.id}
                className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md transition-all duration-300 hover:border-white/30"
              >
                <div className="from-primary-500/20 absolute -top-20 -right-20 h-64 w-64 rounded-full bg-linear-to-br to-transparent opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"></div>

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

                  {/* Description */}
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
                        <div
                          key={idx}
                          className="h-1.5 flex-1 rounded-full bg-white/10"
                        >
                          <div
                            className="from-primary-400 to-secondary-400 h-full rounded-full bg-linear-to-r opacity-0 transition-all delay-300 duration-700 group-hover:opacity-100"
                            style={{
                              width: '100%',
                              transitionDelay: `${300 + idx * 150}ms`,
                            }}
                          ></div>
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
                          <h4 className="font-semibold text-white">
                            {stage.title}
                          </h4>
                        </div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {stage.topics.map((topic, topicIdx) => (
                            <span
                              key={topicIdx}
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
                          <span className="font-medium">Goal:</span>{' '}
                          {stage.goal}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Start Learning CTA */}
                  <div className="mt-6">
                    <Link
                      href={`/roadmaps/${roadmap.slug}`}
                      className="from-primary-500 to-secondary-500 block w-full rounded-lg bg-linear-to-r py-3 text-center font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    >
                      Start Learning Path →
                    </Link>
                  </div>
                </div>

                {/* Bottom Glow */}
                <div className="absolute right-0 bottom-0 left-0 h-1 bg-linear-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredRoadmaps.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-4xl">
                🔍
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">
                No roadmaps found
              </h3>
              <p className="text-gray-400">
                Try selecting a different filter option
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Club Growth Roadmap */}
      <section className="relative px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Club Growth Vision
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              Our journey towards excellence and national recognition
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {clubGrowth.map((year, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:border-white/30"
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
      <section className="relative px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Leadership Development Path
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              Your journey from member to leader
            </p>
          </div>

          <div className="relative">
            {/* Connection Line - Desktop */}
            <div className="from-primary-500/30 via-secondary-500/30 to-primary-500/30 absolute top-0 left-1/2 hidden h-full w-0.5 -translate-x-1/2 bg-linear-to-b md:block"></div>

            <div className="space-y-8 md:space-y-12">
              {leadershipPath.map((step, index) => (
                <div
                  key={index}
                  className={`relative flex items-center gap-6 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Desktop: Half-width card */}
                  <div className="hidden flex-1 md:block">
                    {index % 2 === 0 && (
                      <div className="group rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="from-primary-500/20 to-secondary-500/20 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br text-2xl">
                            {step.icon}
                          </div>
                          <h3 className="text-xl font-bold text-white">
                            {step.role}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          {step.description}
                        </p>
                        {/* Level indicator */}
                        <div className="mt-4 flex items-center gap-2">
                          <div className="flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="from-primary-400 to-secondary-400 h-1.5 rounded-full bg-linear-to-r"
                              style={{
                                width: `${((index + 1) / leadershipPath.length) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            Level {index + 1}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:block">
                    <div className="border-primary-500/30 bg-primary-500/20 flex h-12 w-12 items-center justify-center rounded-full border-4 backdrop-blur-md">
                      <div className="bg-primary-400 h-4 w-4 rounded-full"></div>
                    </div>
                  </div>

                  {/* Desktop: Half-width card (right side) */}
                  <div className="hidden flex-1 md:block">
                    {index % 2 !== 0 && (
                      <div className="group rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="from-primary-500/20 to-secondary-500/20 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br text-2xl">
                            {step.icon}
                          </div>
                          <h3 className="text-xl font-bold text-white">
                            {step.role}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          {step.description}
                        </p>
                        {/* Level indicator */}
                        <div className="mt-4 flex items-center gap-2">
                          <div className="flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="from-primary-400 to-secondary-400 h-1.5 rounded-full bg-linear-to-r"
                              style={{
                                width: `${((index + 1) / leadershipPath.length) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            Level {index + 1}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile: Full-width card */}
                  <div className="w-full md:hidden">
                    <div className="group rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md transition-all hover:border-white/20">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="from-primary-500/20 to-secondary-500/20 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br text-2xl">
                            {step.icon}
                          </div>
                          <h3 className="text-lg font-bold text-white">
                            {step.role}
                          </h3>
                        </div>
                        <span className="bg-primary-500/20 text-primary-300 rounded-full px-3 py-1 text-xs font-semibold">
                          Lvl {index + 1}
                        </span>
                      </div>
                      <p className="mb-3 text-sm text-gray-400">
                        {step.description}
                      </p>
                      {/* Mobile progress bar */}
                      <div className="overflow-hidden rounded-full bg-white/10">
                        <div
                          className="from-primary-400 to-secondary-400 h-1.5 rounded-full bg-linear-to-r"
                          style={{
                            width: `${((index + 1) / leadershipPath.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3 md:mt-16">
            <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-md">
              <div className="text-primary-300 text-3xl font-bold">6</div>
              <div className="text-sm text-gray-400">Career Levels</div>
            </div>
            <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-md">
              <div className="text-secondary-300 text-3xl font-bold">∞</div>
              <div className="text-sm text-gray-400">
                Learning Opportunities
              </div>
            </div>
            <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-md">
              <div className="text-primary-300 text-3xl font-bold">1+</div>
              <div className="text-sm text-gray-400">Years to Leadership</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20">
        <div className="via-primary-500/5 absolute inset-0 bg-linear-to-b from-transparent to-transparent"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 text-5xl">🚀</div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Ready to Start Your Journey?
            </h2>
            <p className="mb-8 text-lg text-gray-300">
              Join NEUPC today and accelerate your learning with structured
              guidance and mentorship.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/join"
                className="from-primary-500 to-secondary-500 group inline-flex items-center gap-2 rounded-lg bg-linear-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Join Now
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
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="from-primary-500 to-secondary-500 fixed right-8 bottom-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br text-white shadow-2xl backdrop-blur-md transition-all hover:scale-110"
          aria-label="Scroll to top"
        >
          <svg
            className="h-6 w-6"
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
