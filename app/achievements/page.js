'use client';

import { useState } from 'react';

export default function Page() {
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = [
    { name: 'All', icon: '🏆' },
    { name: 'ICPC', icon: '🌏' },
    { name: 'Contest', icon: '⚔️' },
    { name: 'Hackathon', icon: '💻' },
    { name: 'Individual', icon: '⭐' },
    { name: 'WIE', icon: '👩‍💻' },
  ];

  const achievements = [
    {
      id: 1,
      title: 'ICPC Asia Regional Participation',
      category: 'ICPC',
      date: '2025-11-12',
      description:
        'A team from the Programming Club represented Netrokona University at the ICPC Asia Regional Contest.',
      position: '1st Place',
      location: 'Dhaka Regional Site',
      participants: 'Team Alpha',
      medal: 'gold',
    },
    {
      id: 2,
      title: 'Inter-University Programming Contest Champion',
      category: 'Contest',
      date: '2025-08-22',
      description:
        'Our team secured 1st position among 25 participating universities.',
      position: '1st Place',
      location: 'XYZ University',
      participants: 'Team Beta',
      medal: 'gold',
    },
    {
      id: 3,
      title: 'National Hackathon Finalist',
      category: 'Hackathon',
      date: '2025-06-18',
      description:
        'Two members qualified for the national round with an AI-based solution.',
      position: 'Top 10 Finalist',
      location: 'National Tech Fest',
      participants: 'Sarah & Ahmed',
      medal: 'bronze',
    },
    {
      id: 4,
      title: 'Top Codeforces Rating Achievement',
      category: 'Individual',
      date: '2026-01-05',
      description: 'A club member achieved Specialist rank (1400+ rating).',
      position: 'Specialist',
      location: 'Codeforces',
      participants: 'Arif Rahman',
      medal: 'silver',
    },
    {
      id: 5,
      title: 'WIE Programming Competition Winner',
      category: 'WIE',
      date: '2025-09-15',
      description: 'Female team won the regional WIE programming competition.',
      position: 'Champion',
      location: 'Regional WIE Event',
      participants: 'Team Phoenix',
      medal: 'gold',
    },
    {
      id: 6,
      title: 'CodeChef Long Challenge Top Performer',
      category: 'Individual',
      date: '2025-12-10',
      description:
        'Secured top 50 position in CodeChef Long Challenge among 10,000+ participants.',
      position: 'Top 50',
      location: 'CodeChef',
      participants: 'Tasnim Akter',
      medal: 'silver',
    },
  ];

  const hallOfFame = [
    {
      name: 'Md. Arif Rahman',
      title: 'Highest Codeforces Rating',
      rating: '1452 (Specialist)',
      year: '2026',
      avatar: 'AR',
    },
    {
      name: 'Tasnim Akter',
      title: 'ICPC Regional Qualifier',
      rating: 'Team Lead',
      year: '2025',
      avatar: 'TA',
    },
    {
      name: 'Sabbir Ahmed',
      title: 'Most Active Member',
      rating: '50+ Contests',
      year: '2025',
      avatar: 'SA',
    },
    {
      name: 'Nusrat Jahan',
      title: 'WIE Champion',
      rating: 'Gold Medal',
      year: '2025',
      avatar: 'NJ',
    },
  ];

  const timeline = [
    { year: '2019', event: 'Club Founded', icon: '🎯' },
    { year: '2021', event: 'First Intra Contest', icon: '🏁' },
    { year: '2023', event: 'First ICPC Participation', icon: '🌏' },
    { year: '2025', event: 'National Level Recognition', icon: '🏆' },
    { year: '2026', event: 'Regional Champions', icon: '👑' },
  ];

  const stats = [
    { label: 'Total Awards', value: '45+', icon: '🏆' },
    { label: 'Contest Wins', value: '18', icon: '🥇' },
    { label: 'ICPC Teams', value: '12', icon: '🌏' },
    { label: 'Active Members', value: '150+', icon: '👥' },
  ];

  const filteredAchievements = achievements.filter((achievement) => {
    const matchesFilter =
      activeFilter === 'All' || achievement.category === activeFilter;
    return matchesFilter;
  });

  const getMedalColor = (medal) => {
    switch (medal) {
      case 'gold':
        return 'from-yellow-500/30 to-yellow-600/30 text-yellow-300 border-yellow-500/50';
      case 'silver':
        return 'from-gray-300/30 to-gray-400/30 text-gray-200 border-gray-400/50';
      case 'bronze':
        return 'from-orange-500/30 to-orange-600/30 text-orange-300 border-orange-500/50';
      default:
        return 'from-primary-500/30 to-primary-600/30 text-primary-300 border-primary-500/50';
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0">
          <div className="from-primary-500/10 absolute -top-20 -left-20 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl"></div>
          <div className="from-secondary-500/10 absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-linear-to-tl to-transparent blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 text-sm font-medium backdrop-blur-sm">
              <span className="text-2xl">🏆</span>
              <span className="text-primary-300">
                Excellence & Achievements
              </span>
            </div>

            <h1 className="from-primary-300 to-secondary-300 mb-6 bg-linear-to-r via-white bg-clip-text text-4xl leading-tight font-bold text-transparent md:text-5xl lg:text-6xl">
              Our Achievements
            </h1>

            <p className="mx-auto mb-4 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
              Celebrating excellence in competitive programming, innovation, and
              academic growth
            </p>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-white/10 p-4 backdrop-blur-md"
                >
                  <div className="mb-2 text-3xl">{stat.icon}</div>
                  <div className="text-primary-300 text-3xl font-bold">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="relative py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveFilter(category.name)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  activeFilter === category.name
                    ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                    : 'bg-white/10 text-gray-400 backdrop-blur-md hover:bg-white/20 hover:text-white'
                }`}
              >
                <span className="text-base">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Grid */}
      <section className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {filteredAchievements.length === 0 ? (
              <div className="rounded-2xl bg-white/10 p-12 text-center backdrop-blur-md">
                <div className="mb-4 text-6xl">🔍</div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  No Achievements Found
                </h3>
                <p className="text-gray-400">
                  Try selecting a different category
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="group hover:border-primary-500/50 hover:shadow-primary-500/20 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl"
                  >
                    <div className="p-6">
                      {/* Medal Badge */}
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-xl ${getMedalColor(achievement.medal)}`}
                        >
                          <svg
                            className="h-7 w-7"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <span className="text-primary-300 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                          {achievement.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="group-hover:text-primary-300 mb-2 text-xl font-bold text-white transition-colors">
                        {achievement.title}
                      </h3>

                      {/* Description */}
                      <p className="mb-4 text-sm leading-relaxed text-gray-400">
                        {achievement.description}
                      </p>

                      {/* Meta Info */}
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
                          <span className="line-clamp-1">
                            {achievement.location}
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {new Date(achievement.date).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
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
                          <span className="line-clamp-1">
                            {achievement.participants}
                          </span>
                        </div>
                      </div>

                      {/* Position Badge */}
                      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="text-sm font-semibold text-gray-300">
                          Position
                        </span>
                        <span className="text-primary-200 rounded-lg bg-white/10 px-4 py-1.5 text-sm font-bold">
                          {achievement.position}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                Our Journey
              </h2>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="from-primary-500 to-secondary-500 absolute top-0 left-1/2 hidden h-full w-1 -translate-x-1/2 rounded-full bg-linear-to-b md:block"></div>

              {timeline.map((item, index) => (
                <div
                  key={index}
                  className={`group relative mb-12 flex items-center ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}
                  >
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/10">
                      <div className="mb-3 text-3xl">{item.icon}</div>
                      <h3 className="mb-2 text-xl font-bold text-white">
                        {item.event}
                      </h3>
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

                  {/* Spacer for desktop */}
                  <div className="hidden w-5/12 md:block"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hall of Fame */}
      <section className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
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
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl transition-all duration-300 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/20"
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
      <section className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-white/20 bg-white/5 p-8 backdrop-blur-xl md:p-12">
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
                <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:bg-pink-500/10">
                  <div className="mb-3 text-4xl">🏆</div>
                  <div className="bg-linear-to-r from-pink-300 to-purple-300 bg-clip-text text-3xl font-bold text-transparent">
                    5+
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    WIE Champions
                  </div>
                </div>
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:bg-purple-500/10">
                  <div className="mb-3 text-4xl">📈</div>
                  <div className="bg-linear-to-r from-purple-300 to-pink-300 bg-clip-text text-3xl font-bold text-transparent">
                    40%
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    Female Participation
                  </div>
                </div>
                <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:bg-pink-500/10">
                  <div className="mb-3 text-4xl">🌟</div>
                  <div className="bg-linear-to-r from-pink-300 to-purple-300 bg-clip-text text-3xl font-bold text-transparent">
                    12
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    Leadership Roles
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center text-gray-300">
                Promoting diversity, inclusion, and equal opportunities in
                competitive programming and technology.
              </p>
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
              Ready to Make Your Mark?
            </h2>
            <p className="mb-8 text-lg text-gray-300">
              Join NEUPC today and be part of our legacy of excellence in
              competitive programming and technology.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/join"
                className="from-primary-500 to-secondary-500 group inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
              <a
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
