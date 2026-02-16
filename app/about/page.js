'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import About from '../_components/sections/About';

export default function AboutPage() {
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
            <div className="mb-6 inline-block rounded-full bg-white/20 px-6 py-2 text-sm font-medium backdrop-blur-sm">
              🎓 Student Organization
            </div>
            <h1 className="from-primary-300 to-secondary-300 mb-6 bg-linear-to-r via-white bg-clip-text text-4xl leading-tight font-bold text-transparent md:text-5xl lg:text-7xl">
              About NEUPC
            </h1>
            <p className="mb-4 text-xl font-medium text-gray-300 md:text-2xl lg:text-3xl">
              Netrokona University Programming Club
            </p>
            <p className="text-base text-gray-400 md:text-lg lg:text-xl">
              Department of Computer Science and Engineering
            </p>
            <div className="mt-10 flex justify-center">
              <div className="from-primary-400 via-secondary-400 to-primary-400 h-1.5 w-32 bg-linear-to-r shadow-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <About variant="on" />

      {/* Mission & Vision Section */}
      <section className="relative bg-gray-900/50 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
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
                style={{ animationDelay: '100ms' }}
                className="group animate-fade-in relative overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/15 md:p-10"
              >
                <div className="from-primary-500/20 absolute -top-10 -right-10 h-40 w-40 rounded-full bg-linear-to-br to-transparent blur-2xl transition-all group-hover:scale-150"></div>
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
                    <li className="flex items-start transition-all hover:translate-x-2">
                      <span className="text-primary-400 mt-1 mr-3 text-lg">
                        ✓
                      </span>
                      <span className="leading-relaxed">
                        To enhance programming skills among students
                      </span>
                    </li>
                    <li className="flex items-start transition-all hover:translate-x-2">
                      <span className="text-primary-400 mt-1 mr-3 text-lg">
                        ✓
                      </span>
                      <span className="leading-relaxed">
                        To introduce various branches of Computer Science beyond
                        academic coursework
                      </span>
                    </li>
                    <li className="flex items-start transition-all hover:translate-x-2">
                      <span className="text-primary-400 mt-1 mr-3 text-lg">
                        ✓
                      </span>
                      <span className="leading-relaxed">
                        To prepare students for competitive programming contests
                        (ICPC, NCPC, etc.)
                      </span>
                    </li>
                    <li className="flex items-start transition-all hover:translate-x-2">
                      <span className="text-primary-400 mt-1 mr-3 text-lg">
                        ✓
                      </span>
                      <span className="leading-relaxed">
                        To organize workshops, seminars, bootcamps, and internal
                        contests
                      </span>
                    </li>
                    <li className="flex items-start transition-all hover:translate-x-2">
                      <span className="text-primary-400 mt-1 mr-3 text-lg">
                        ✓
                      </span>
                      <span className="leading-relaxed">
                        To build a strong programming community within the
                        university
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Vision */}
              <div
                style={{ animationDelay: '200ms' }}
                className="from-primary-500 to-secondary-500 group hover:shadow-primary-500/50 animate-fade-in relative overflow-hidden rounded-2xl bg-linear-to-br p-8 text-white shadow-2xl transition-all duration-300 hover:scale-105 md:p-10"
              >
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition-all group-hover:scale-150"></div>
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
                  <div className="mt-6 h-1 w-20 bg-white/50 transition-all group-hover:w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/30"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                What We Do
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                Our activities and initiatives throughout the year
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {/* Card 1 */}
              <div
                style={{ animationDelay: '100ms' }}
                className="group hover:shadow-primary-500/20 animate-fade-in relative overflow-hidden rounded-2xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:bg-white/15 hover:shadow-2xl"
              >
                <div className="from-primary-500/20 absolute -top-8 -right-8 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100"></div>
                <div className="relative">
                  <div className="bg-primary-500/20 mb-4 flex h-14 w-14 items-center justify-center rounded-full text-4xl transition-transform group-hover:scale-110">
                    💻
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">
                    Competitive Programming Training
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2">•</span>
                      <span>Weekly practice sessions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2">•</span>
                      <span>Algorithm & data structure workshops</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2">•</span>
                      <span>Internal mock contests</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 2 */}
              <div
                style={{ animationDelay: '200ms' }}
                className="group hover:shadow-secondary-500/20 animate-fade-in relative overflow-hidden rounded-2xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:bg-white/15 hover:shadow-2xl"
              >
                <div className="from-secondary-500/20 absolute -top-8 -right-8 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100"></div>
                <div className="relative">
                  <div className="bg-secondary-500/20 mb-4 flex h-14 w-14 items-center justify-center rounded-full text-4xl transition-transform group-hover:scale-110">
                    🎓
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">
                    Academic & Career Development
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start">
                      <span className="text-secondary-400 mr-2">•</span>
                      <span>Career guidance sessions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary-400 mr-2">•</span>
                      <span>Research discussions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary-400 mr-2">•</span>
                      <span>Industry-oriented workshops</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 3 */}
              <div
                style={{ animationDelay: '300ms' }}
                className="group hover:shadow-primary-500/20 animate-fade-in relative overflow-hidden rounded-2xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:bg-white/15 hover:shadow-2xl"
              >
                <div className="from-primary-500/20 absolute -top-8 -right-8 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100"></div>
                <div className="relative">
                  <div className="bg-primary-500/20 mb-4 flex h-14 w-14 items-center justify-center rounded-full text-4xl transition-transform group-hover:scale-110">
                    🏆
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">
                    Contest Participation
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2">•</span>
                      <span>ICPC preparation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2">•</span>
                      <span>National programming contests</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-400 mr-2">•</span>
                      <span>Inter-university competitions</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 4 */}
              <div
                style={{ animationDelay: '400ms' }}
                className="group hover:shadow-secondary-500/20 animate-fade-in relative overflow-hidden rounded-2xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:bg-white/15 hover:shadow-2xl"
              >
                <div className="from-secondary-500/20 absolute -top-8 -right-8 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100"></div>
                <div className="relative">
                  <div className="bg-secondary-500/20 mb-4 flex h-14 w-14 items-center justify-center rounded-full text-4xl transition-transform group-hover:scale-110">
                    👩‍💻
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">
                    Women in Engineering (WIE)
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start">
                      <span className="text-secondary-400 mr-2">•</span>
                      <span>Special programming sessions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary-400 mr-2">•</span>
                      <span>Leadership development</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary-400 mr-2">•</span>
                      <span>Inclusive community building</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="relative bg-gray-900/50 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                Our Core Values
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                The principles that guide our community
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div
                style={{ animationDelay: '50ms' }}
                className="group hover:shadow-primary-500/20 animate-fade-in flex items-center rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-x-1 hover:bg-white/15 hover:shadow-xl"
              >
                <span className="bg-primary-500/20 group-hover:bg-primary-500/30 mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-all group-hover:scale-110">
                  ✔
                </span>
                <span className="text-base font-semibold text-gray-200 group-hover:text-white">
                  Discipline & Professionalism
                </span>
              </div>
              <div
                style={{ animationDelay: '100ms' }}
                className="group hover:shadow-secondary-500/20 animate-fade-in flex items-center rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-x-1 hover:bg-white/15 hover:shadow-xl"
              >
                <span className="bg-secondary-500/20 group-hover:bg-secondary-500/30 mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-all group-hover:scale-110">
                  ✔
                </span>
                <span className="text-base font-semibold text-gray-200 group-hover:text-white">
                  Ethical Conduct
                </span>
              </div>
              <div
                style={{ animationDelay: '150ms' }}
                className="group hover:shadow-primary-500/20 animate-fade-in flex items-center rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-x-1 hover:bg-white/15 hover:shadow-xl"
              >
                <span className="bg-primary-500/20 group-hover:bg-primary-500/30 mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-all group-hover:scale-110">
                  ✔
                </span>
                <span className="text-base font-semibold text-gray-200 group-hover:text-white">
                  Zero Tolerance for Discrimination
                </span>
              </div>
              <div
                style={{ animationDelay: '200ms' }}
                className="group hover:shadow-secondary-500/20 animate-fade-in flex items-center rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-x-1 hover:bg-white/15 hover:shadow-xl"
              >
                <span className="bg-secondary-500/20 group-hover:bg-secondary-500/30 mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-all group-hover:scale-110">
                  ✔
                </span>
                <span className="text-base font-semibold text-gray-200 group-hover:text-white">
                  Transparency in Finances
                </span>
              </div>
              <div
                style={{ animationDelay: '250ms' }}
                className="group hover:shadow-primary-500/20 animate-fade-in flex items-center rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-x-1 hover:bg-white/15 hover:shadow-xl"
              >
                <span className="bg-primary-500/20 group-hover:bg-primary-500/30 mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-all group-hover:scale-110">
                  ✔
                </span>
                <span className="text-base font-semibold text-gray-200 group-hover:text-white">
                  Non-political Structure
                </span>
              </div>
              <div
                style={{ animationDelay: '300ms' }}
                className="group hover:shadow-secondary-500/20 animate-fade-in flex items-center rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-x-1 hover:bg-white/15 hover:shadow-xl"
              >
                <span className="bg-secondary-500/20 group-hover:bg-secondary-500/30 mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-all group-hover:scale-110">
                  ✔
                </span>
                <span className="text-base font-semibold text-gray-200 group-hover:text-white">
                  Non-profit Organization
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organizational Structure Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/30 to-transparent"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                📊 Organizational Structure
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                A well-defined hierarchy driving excellence
              </p>
            </div>

            <div className="group hover:shadow-3xl relative overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 md:p-12">
              <div className="from-primary-500/10 to-secondary-500/10 absolute -top-20 -right-20 h-60 w-60 rounded-full bg-linear-to-br blur-3xl transition-all group-hover:scale-150"></div>
              <div className="relative">
                <p className="mb-8 text-lg text-gray-200">
                  The club operates under a well-defined structure:
                </p>
                <div className="space-y-6">
                  <div className="group/item flex items-start transition-all hover:translate-x-2">
                    <div className="bg-primary-500 shadow-primary-500/50 mt-1 mr-4 h-4 w-4 rounded-full shadow-lg transition-all group-hover/item:scale-125"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        Faculty Advisors
                      </h4>
                      <p className="text-gray-300">
                        Lecturers from the Department of CSE
                      </p>
                    </div>
                  </div>
                  <div className="group/item flex items-start transition-all hover:translate-x-2">
                    <div className="bg-secondary-500 shadow-secondary-500/50 mt-1 mr-4 h-4 w-4 rounded-full shadow-lg transition-all group-hover/item:scale-125"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        Executive Committee
                      </h4>
                      <p className="text-gray-300">
                        President, Vice President, Secretary, and other officers
                      </p>
                    </div>
                  </div>
                  <div className="group/item flex items-start transition-all hover:translate-x-2">
                    <div className="bg-primary-700 shadow-primary-700/50 mt-1 mr-4 h-4 w-4 rounded-full shadow-lg transition-all group-hover/item:scale-125"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        Mentors
                      </h4>
                      <p className="text-gray-300">
                        Senior students and alumni
                      </p>
                    </div>
                  </div>
                  <div className="group/item flex items-start transition-all hover:translate-x-2">
                    <div className="bg-secondary-700 shadow-secondary-700/50 mt-1 mr-4 h-4 w-4 rounded-full shadow-lg transition-all group-hover/item:scale-125"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        Members
                      </h4>
                      <p className="text-gray-300">
                        Active student participants
                      </p>
                    </div>
                  </div>
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
      <section className="relative bg-gray-900/50 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                💡 Why the Programming Club Matters
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                More than code — building essential skills for the future
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md md:p-12">
              <div className="from-secondary-500/10 to-primary-500/10 absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-linear-to-tr blur-3xl transition-all group-hover:scale-150"></div>
              <div className="relative">
                <p className="mb-8 text-xl font-medium text-gray-200">
                  Programming is more than writing code — it develops:
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div
                    style={{ animationDelay: '100ms' }}
                    className="group/skill bg-primary-500/20 hover:bg-primary-500/30 hover:shadow-primary-500/20 animate-fade-in flex items-center rounded-xl p-5 transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl transition-transform group-hover/skill:scale-110">
                      🧠
                    </div>
                    <span className="text-lg font-semibold text-gray-200 group-hover/skill:text-white">
                      Logical reasoning
                    </span>
                  </div>
                  <div
                    style={{ animationDelay: '200ms' }}
                    className="group/skill bg-secondary-500/20 hover:bg-secondary-500/30 hover:shadow-secondary-500/20 animate-fade-in flex items-center rounded-xl p-5 transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl transition-transform group-hover/skill:scale-110">
                      🏗️
                    </div>
                    <span className="text-lg font-semibold text-gray-200 group-hover/skill:text-white">
                      Structured thinking
                    </span>
                  </div>
                  <div
                    style={{ animationDelay: '300ms' }}
                    className="group/skill bg-primary-500/20 hover:bg-primary-500/30 hover:shadow-primary-500/20 animate-fade-in flex items-center rounded-xl p-5 transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl transition-transform group-hover/skill:scale-110">
                      📊
                    </div>
                    <span className="text-lg font-semibold text-gray-200 group-hover/skill:text-white">
                      Analytical problem solving
                    </span>
                  </div>
                  <div
                    style={{ animationDelay: '400ms' }}
                    className="group/skill bg-secondary-500/20 hover:bg-secondary-500/30 hover:shadow-secondary-500/20 animate-fade-in flex items-center rounded-xl p-5 transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl transition-transform group-hover/skill:scale-110">
                      🌍
                    </div>
                    <span className="text-lg font-semibold text-gray-200 group-hover/skill:text-white">
                      Real-world solution building
                    </span>
                  </div>
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
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-transparent"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
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
                style={{ animationDelay: '100ms' }}
                className="from-secondary-500 to-primary-500 group hover:shadow-3xl hover:shadow-secondary-500/30 animate-fade-in relative overflow-hidden rounded-2xl bg-linear-to-br p-8 text-white shadow-2xl transition-all duration-300 hover:scale-105 md:p-10"
              >
                <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl transition-all group-hover:scale-150"></div>
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
                  <div className="mt-6 h-1 w-24 bg-white/50 transition-all group-hover:w-32"></div>
                </div>
              </div>

              {/* Mentorship */}
              <div
                style={{ animationDelay: '200ms' }}
                className="group hover:shadow-3xl animate-fade-in relative overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/15 md:p-10"
              >
                <div className="from-primary-500/20 absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-linear-to-tr to-transparent blur-3xl transition-all group-hover:scale-150"></div>
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
                    <li className="flex items-start transition-all hover:translate-x-2">
                      <span className="bg-primary-500/20 shadow-primary-500/50 mt-1 mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-lg">
                        ▸
                      </span>
                      <span className="text-base">
                        Competitive programming strategies
                      </span>
                    </li>
                    <li className="flex items-start transition-all hover:translate-x-2">
                      <span className="bg-primary-500/20 shadow-primary-500/50 mt-1 mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-lg">
                        ▸
                      </span>
                      <span className="text-base">Academic development</span>
                    </li>
                    <li className="flex items-start transition-all hover:translate-x-2">
                      <span className="bg-primary-500/20 shadow-primary-500/50 mt-1 mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-lg">
                        ▸
                      </span>
                      <span className="text-base">Career direction</span>
                    </li>
                    <li className="flex items-start transition-all hover:translate-x-2">
                      <span className="bg-primary-500/20 shadow-primary-500/50 mt-1 mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-lg">
                        ▸
                      </span>
                      <span className="text-base">Project building</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="via-primary-500/5 absolute inset-0 bg-linear-to-b from-transparent to-transparent"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 text-5xl">🎯</div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Ready to Join Us?
            </h2>
            <p className="mb-8 text-lg text-gray-300">
              Become part of a community dedicated to excellence in programming
              and innovation.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
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
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20"
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
