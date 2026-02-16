'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GiscusComments from '@/app/_components/ui/GiscusComments';

export default function Page({ params }) {
  const [activeSection, setActiveSection] = useState('introduction');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [showMobileTOC, setShowMobileTOC] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      // Show scroll to top button after scrolling 300px
      setShowScrollTop(window.scrollY > 300);

      // Scroll spy for table of contents
      const sections = [
        'introduction',
        'why-cp',
        'getting-started',
        'resources',
        'practice-strategy',
        'common-mistakes',
        'conclusion',
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    handleScroll(); // Initial call
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setShowMobileTOC(false);
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = blog.title;

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      copy: url,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  // Sample blog data - in production, this would come from CMS/API
  const blog = {
    id: params.blogId,
    title: 'How to Start Competitive Programming as a Beginner',
    category: 'Tutorials',
    author: {
      name: 'Md. Arif Rahman',
      role: 'Programming Instructor',
      bio: 'ICPC Regionalist and competitive programming enthusiast with 5+ years of experience.',
      avatar: 'AR',
    },
    date: 'Feb 10, 2026',
    readTime: '8 min',
    tags: ['CP', 'Beginner', 'Guide', 'Competitive Programming', 'C++'],
    views: '2.5k',
    likes: 128,
  };

  const tableOfContents = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'why-cp', title: 'Why Competitive Programming?' },
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'resources', title: 'Essential Resources' },
    { id: 'practice-strategy', title: 'Practice Strategy' },
    { id: 'common-mistakes', title: 'Common Mistakes to Avoid' },
    { id: 'conclusion', title: 'Conclusion' },
  ];

  const relatedBlogs = [
    {
      id: 2,
      title: 'C++ STL You Must Know for Programming Contests',
      category: 'Tutorials',
      readTime: '12 min',
      tags: ['C++', 'STL'],
    },
    {
      id: 4,
      title: 'Graph Theory Basics for ICPC Preparation',
      category: 'Tutorials',
      readTime: '15 min',
      tags: ['Graph Theory', 'Algorithms'],
    },
    {
      id: 7,
      title: 'Dynamic Programming: A Beginner Friendly Guide',
      category: 'Tutorials',
      readTime: '14 min',
      tags: ['DP', 'Algorithms'],
    },
  ];

  return (
    <main className="relative min-h-screen bg-linear-to-b from-black via-gray-900 to-black">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 right-0 left-0 z-50 h-1 bg-gray-800/50">
        <div
          className="from-primary-500 to-secondary-500 shadow-primary-500/50 h-full bg-linear-to-r shadow-lg transition-all duration-300 ease-out"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 bg-linear-to-b from-black/50 via-black/30 to-black/60"></div>
      <div className="from-primary-500/10 via-secondary-500/10 to-primary-500/10 pointer-events-none fixed inset-0 -z-10 bg-linear-to-br opacity-30"></div>

      {/* Decorative Blur Circles */}
      <div className="from-primary-500/20 to-secondary-500/20 fixed -top-40 -left-40 -z-10 h-96 w-96 animate-pulse rounded-full bg-linear-to-br blur-3xl"></div>
      <div
        className="from-secondary-500/20 to-primary-500/20 fixed top-1/2 -right-40 -z-10 h-96 w-96 animate-pulse rounded-full bg-linear-to-br blur-3xl"
        style={{ animationDelay: '1s' }}
      ></div>
      <div
        className="from-primary-500/15 to-secondary-500/15 fixed bottom-0 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 animate-pulse rounded-full bg-linear-to-br blur-3xl"
        style={{ animationDelay: '2s' }}
      ></div>

      {/* Back Navigation */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
            <Link href="/" className="hover:text-primary-300 transition-colors">
              Home
            </Link>
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <Link
              href="/blogs"
              className="hover:text-primary-300 transition-colors"
            >
              Blogs
            </Link>
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-primary-300">{blog.category}</span>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/blogs"
              className="group hover:text-primary-300 inline-flex items-center gap-2 text-sm font-medium text-gray-300 transition-all hover:gap-3"
            >
              <svg
                className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Blogs
            </Link>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {/* Mobile TOC Toggle */}
              <button
                onClick={() => setShowMobileTOC(!showMobileTOC)}
                className="hover:bg-primary-500/20 hover:border-primary-500/50 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all lg:hidden"
                title="Table of Contents"
              >
                <svg
                  className="text-primary-300 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
              </button>

              <div className="hidden items-center gap-3 md:flex">
                <span className="text-xs text-gray-400">
                  {Math.round(scrollProgress)}% read
                </span>
                <div className="h-4 w-px bg-white/10"></div>
                <span className="text-xs text-gray-400">
                  {blog.readTime} read
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Table of Contents Dropdown */}
      {showMobileTOC && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowMobileTOC(false)}
          ></div>
          <div className="absolute top-20 right-4 left-4 rounded-2xl border border-white/10 bg-black/95 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Table of Contents
              </h3>
              <button
                onClick={() => setShowMobileTOC(false)}
                className="text-gray-400 hover:text-white"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav className="max-h-96 space-y-1 overflow-y-auto">
              {tableOfContents.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`group relative block w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                    activeSection === section.id
                      ? 'text-primary-300 bg-primary-500/10 font-semibold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        activeSection === section.id
                          ? 'text-primary-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">{section.title}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="border-b border-white/10 bg-black/30 py-12 backdrop-blur-sm md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Category Badge */}
            <div className="mb-4 flex flex-wrap items-center gap-3 md:mb-6">
              <span className="from-primary-500/20 to-primary-600/20 text-primary-300 border-primary-500/30 inline-flex items-center gap-2 rounded-full border bg-linear-to-br px-4 py-2 text-sm font-semibold">
                <span>📘</span>
                {blog.category}
              </span>
              <span className="text-sm text-gray-400">{blog.date}</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-400">
                {blog.readTime} read
              </span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-400">{blog.views} views</span>
            </div>

            {/* Title */}
            <h1 className="from-primary-300 to-secondary-300 mb-6 bg-linear-to-r via-white bg-clip-text text-4xl leading-tight font-bold text-transparent md:mb-8 md:text-5xl lg:text-6xl">
              {blog.title}
            </h1>

            {/* Tags */}
            <div className="mb-6 flex flex-wrap gap-2 md:mb-8">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-300 backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Author Info */}
            <div className="group hover:border-primary-500/30 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:bg-white/10 sm:p-8">
              <div className="from-primary-500/10 absolute -top-20 -right-20 h-40 w-40 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"></div>

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="from-primary-500/30 to-secondary-500/30 ring-primary-500/20 relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-2xl font-bold text-white shadow-lg ring-2 transition-transform group-hover:scale-110 sm:h-20 sm:w-20 sm:text-3xl">
                    {blog.author.avatar}
                    <div className="from-primary-500/50 to-secondary-500/50 absolute inset-0 rounded-full bg-linear-to-br opacity-0 blur transition-opacity group-hover:opacity-30"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-white sm:text-xl">
                      {blog.author.name}
                    </p>
                    <p className="text-primary-300 text-sm font-medium">
                      {blog.author.role}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-300 sm:text-base">
                      {blog.author.bio}
                    </p>
                  </div>
                </div>

                {/* Social Share */}
                <div className="flex gap-2 sm:flex-col sm:gap-3">
                  <button
                    title="Share on Facebook"
                    className="group/btn hover:bg-primary-500/20 hover:border-primary-500/50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all hover:scale-110 active:scale-95"
                  >
                    <svg
                      className="group-hover/btn:text-primary-300 h-5 w-5 text-gray-300 transition-colors"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                    </svg>
                  </button>
                  <button
                    title="Share on Twitter"
                    className="group/btn hover:bg-primary-500/20 hover:border-primary-500/50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all hover:scale-110 active:scale-95"
                  >
                    <svg
                      className="group-hover/btn:text-primary-300 h-5 w-5 text-gray-300 transition-colors"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </button>
                  <button
                    title="Share on LinkedIn"
                    className="group/btn hover:bg-primary-500/20 hover:border-primary-500/50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all hover:scale-110 active:scale-95"
                  >
                    <svg
                      className="group-hover/btn:text-primary-300 h-5 w-5 text-gray-300 transition-colors"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </button>
                  <button
                    title="Copy link"
                    className="group/btn hover:bg-primary-500/20 hover:border-primary-500/50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all hover:scale-110 active:scale-95"
                  >
                    <svg
                      className="group-hover/btn:text-primary-300 h-5 w-5 text-gray-300 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12">
            {/* Table of Contents - Sidebar */}
            <aside className="lg:col-span-3">
              <div className="sticky top-28 space-y-6">
                <div className="hover:border-primary-500/30 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all">
                  <div className="mb-4 flex items-center gap-2">
                    <svg
                      className="text-primary-400 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h7"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-white">
                      Table of Contents
                    </h3>
                  </div>
                  <nav className="space-y-1">
                    {tableOfContents.map((section, index) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`group relative block w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                          activeSection === section.id
                            ? 'text-primary-300 bg-primary-500/10 font-semibold'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs ${
                              activeSection === section.id
                                ? 'text-primary-400'
                                : 'text-gray-500'
                            }`}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="flex-1">{section.title}</span>
                          {activeSection === section.id && (
                            <svg
                              className="text-primary-400 h-3 w-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                        {activeSection === section.id && (
                          <div className="from-primary-500 absolute top-0 left-0 h-full w-1 rounded-r bg-linear-to-b to-transparent"></div>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Like Button */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`group relative w-full overflow-hidden rounded-xl border py-4 font-semibold text-white transition-all hover:scale-105 active:scale-95 ${
                      isLiked
                        ? 'border-pink-500/50 bg-linear-to-br from-pink-500/30 to-red-500/30 shadow-lg shadow-pink-500/20'
                        : 'from-primary-500/20 to-primary-600/20 hover:from-primary-500/30 hover:to-primary-600/30 border-primary-500/30 bg-linear-to-br'
                    }`}
                  >
                    <div className="from-primary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100"></div>
                    <div className="relative flex items-center justify-center gap-2">
                      <svg
                        className={`h-6 w-6 transition-all ${
                          isLiked
                            ? 'scale-110 fill-current text-pink-400'
                            : 'group-hover:scale-110'
                        }`}
                        fill={isLiked ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span className="text-lg">
                        {isLiked ? blog.likes + 1 : blog.likes}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-300">
                      {isLiked ? 'You liked this!' : 'Like this article'}
                    </p>
                  </button>

                  {/* Article Stats */}
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Views</span>
                      <span className="font-semibold text-white">
                        {blog.views}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Read time</span>
                      <span className="font-semibold text-white">
                        {blog.readTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Published</span>
                      <span className="font-semibold text-white">
                        {blog.date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Article Content */}
            <article className="lg:col-span-9">
              {/* Font Size Controls */}
              <div className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <svg
                    className="text-primary-400 h-5 w-5"
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
                  <span className="text-sm font-medium text-white">
                    Reading Settings
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Font Size:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFontSize('small')}
                      className={`rounded px-2 py-1 text-xs font-medium transition-all ${
                        fontSize === 'small'
                          ? 'from-primary-500/30 to-primary-600/30 text-primary-300 bg-linear-to-br'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setFontSize('normal')}
                      className={`rounded px-2 py-1 text-sm font-medium transition-all ${
                        fontSize === 'normal'
                          ? 'from-primary-500/30 to-primary-600/30 text-primary-300 bg-linear-to-br'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setFontSize('large')}
                      className={`rounded px-2 py-1 text-base font-medium transition-all ${
                        fontSize === 'large'
                          ? 'from-primary-500/30 to-primary-600/30 text-primary-300 bg-linear-to-br'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      A
                    </button>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <div
                  className={`rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md md:p-10 lg:p-12 ${
                    fontSize === 'small'
                      ? 'text-sm'
                      : fontSize === 'large'
                        ? 'text-lg'
                        : 'text-base'
                  }`}
                >
                  {/* Introduction */}
                  <section id="introduction" className="mb-12">
                    <h2 className="from-primary-300 mb-4 bg-linear-to-r to-white bg-clip-text text-3xl font-bold text-transparent">
                      Introduction
                    </h2>
                    <p className="mb-4 text-lg leading-relaxed text-gray-300">
                      Competitive programming is an exhilarating journey that
                      combines problem-solving, algorithmic thinking, and coding
                      skills. Whether you&apos;re a complete beginner or have
                      some programming experience, this comprehensive guide will
                      help you take your first steps into the world of
                      competitive programming.
                    </p>
                    <p className="text-lg leading-relaxed text-gray-300">
                      In this article, we&apos;ll explore everything you need to
                      know to start your competitive programming journey, from
                      understanding what it is to developing a solid practice
                      strategy that will help you improve consistently.
                    </p>
                  </section>

                  {/* Why CP */}
                  <section id="why-cp" className="mb-12">
                    <h2 className="from-primary-300 mb-4 bg-linear-to-r to-white bg-clip-text text-3xl font-bold text-transparent">
                      Why Competitive Programming?
                    </h2>
                    <p className="mb-4 leading-relaxed text-gray-300">
                      Competitive programming offers numerous benefits that
                      extend far beyond just winning contests:
                    </p>
                    <ul className="mb-4 space-y-2 text-gray-300">
                      <li className="flex items-start gap-3">
                        <span className="text-primary-400 mt-1 shrink-0">
                          ✓
                        </span>
                        <span>
                          <strong className="text-white">
                            Sharpen Problem-Solving Skills:
                          </strong>{' '}
                          Learn to break down complex problems into manageable
                          components
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary-400 mt-1 shrink-0">
                          ✓
                        </span>
                        <span>
                          <strong className="text-white">
                            Master Data Structures & Algorithms:
                          </strong>{' '}
                          Deep understanding of fundamental CS concepts
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary-400 mt-1 shrink-0">
                          ✓
                        </span>
                        <span>
                          <strong className="text-white">
                            Ace Technical Interviews:
                          </strong>{' '}
                          Excel in coding interviews at top tech companies
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary-400 mt-1 shrink-0">
                          ✓
                        </span>
                        <span>
                          <strong className="text-white">
                            Build a Strong Profile:
                          </strong>{' '}
                          Showcase your skills to potential employers and
                          universities
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary-400 mt-1 shrink-0">
                          ✓
                        </span>
                        <span>
                          <strong className="text-white">
                            Join a Global Community:
                          </strong>{' '}
                          Connect with programmers worldwide and learn together
                        </span>
                      </li>
                    </ul>
                  </section>

                  {/* Getting Started */}
                  <section id="getting-started" className="mb-12">
                    <h2 className="from-primary-300 mb-4 bg-linear-to-r to-white bg-clip-text text-3xl font-bold text-transparent">
                      Getting Started
                    </h2>
                    <div className="border-primary-500/30 bg-primary-500/10 mb-6 rounded-xl border p-6">
                      <h3 className="text-primary-300 mb-3 text-xl font-semibold">
                        Step 1: Choose Your Language
                      </h3>
                      <p className="mb-3 text-gray-300">
                        While you can use any programming language,{' '}
                        <strong className="text-white">C++</strong> is the most
                        popular choice for competitive programming due to its
                        speed and rich Standard Template Library (STL).
                      </p>
                      <p className="text-gray-300">
                        Other good options include Java, Python (for beginners),
                        and C. Pick one and stick with it!
                      </p>
                    </div>

                    <div className="border-secondary-500/30 bg-secondary-500/10 mb-6 rounded-xl border p-6">
                      <h3 className="text-secondary-300 mb-3 text-xl font-semibold">
                        Step 2: Learn the Basics
                      </h3>
                      <p className="mb-3 text-gray-300">
                        Master fundamental programming concepts:
                      </p>
                      <ul className="ml-6 list-disc space-y-1 text-gray-300">
                        <li>Variables, data types, and operators</li>
                        <li>Conditional statements and loops</li>
                        <li>Functions and recursion</li>
                        <li>Arrays and strings</li>
                        <li>Basic input/output operations</li>
                      </ul>
                    </div>

                    <div className="border-primary-500/30 bg-primary-500/10 rounded-xl border p-6">
                      <h3 className="text-primary-300 mb-3 text-xl font-semibold">
                        Step 3: Start Solving Problems
                      </h3>
                      <p className="text-gray-300">
                        Begin with easy problems on platforms like Codeforces,
                        CodeChef, or AtCoder. Don&apos;t worry about ratings
                        initially—focus on learning and understanding solutions.
                      </p>
                    </div>
                  </section>

                  {/* Resources */}
                  <section id="resources" className="mb-12">
                    <h2 className="from-primary-300 mb-4 bg-linear-to-r to-white bg-clip-text text-3xl font-bold text-transparent">
                      Essential Resources
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/20 bg-white/5 p-5">
                        <h4 className="mb-2 text-lg font-semibold text-white">
                          Online Judges
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-300">
                          <li>• Codeforces</li>
                          <li>• CodeChef</li>
                          <li>• AtCoder</li>
                          <li>• LeetCode</li>
                          <li>• HackerRank</li>
                        </ul>
                      </div>
                      <div className="rounded-xl border border-white/20 bg-white/5 p-5">
                        <h4 className="mb-2 text-lg font-semibold text-white">
                          Learning Resources
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-300">
                          <li>• CP Algorithms</li>
                          <li>• Competitive Programmer&apos;s Handbook</li>
                          <li>• USACO Guide</li>
                          <li>• GeeksforGeeks</li>
                          <li>• YouTube Tutorials</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Practice Strategy */}
                  <section id="practice-strategy" className="mb-12">
                    <h2 className="from-primary-300 mb-4 bg-linear-to-r to-white bg-clip-text text-3xl font-bold text-transparent">
                      Practice Strategy
                    </h2>
                    <p className="mb-4 text-lg leading-relaxed text-gray-300">
                      Consistent practice is the key to improvement. Here&apos;s
                      a structured approach:
                    </p>
                    <div className="space-y-4">
                      <div className="border-primary-500 border-l-4 bg-white/5 p-4">
                        <h4 className="mb-2 font-semibold text-white">
                          1. Solve Problems Regularly
                        </h4>
                        <p className="text-sm text-gray-300">
                          Aim to solve at least 2-3 problems daily. Quality
                          matters more than quantity.
                        </p>
                      </div>
                      <div className="border-secondary-500 border-l-4 bg-white/5 p-4">
                        <h4 className="mb-2 font-semibold text-white">
                          2. Participate in Contests
                        </h4>
                        <p className="text-sm text-gray-300">
                          Join live contests weekly to experience time pressure
                          and improve your speed.
                        </p>
                      </div>
                      <div className="border-primary-500 border-l-4 bg-white/5 p-4">
                        <h4 className="mb-2 font-semibold text-white">
                          3. Learn from Editorials
                        </h4>
                        <p className="text-sm text-gray-300">
                          After contests, read editorials and study better
                          solutions to expand your problem-solving toolkit.
                        </p>
                      </div>
                      <div className="border-secondary-500 border-l-4 bg-white/5 p-4">
                        <h4 className="mb-2 font-semibold text-white">
                          4. Focus on Weak Areas
                        </h4>
                        <p className="text-sm text-gray-300">
                          Identify topics you struggle with and dedicate extra
                          time to mastering them.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Common Mistakes */}
                  <section id="common-mistakes" className="mb-12">
                    <h2 className="from-primary-300 mb-4 bg-linear-to-r to-white bg-clip-text text-3xl font-bold text-transparent">
                      Common Mistakes to Avoid
                    </h2>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                        <p className="text-white">
                          <strong>❌ Giving up too quickly:</strong>{' '}
                          <span className="text-gray-300">
                            Spend at least 30-45 minutes on a problem before
                            looking at the solution.
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                        <p className="text-white">
                          <strong>❌ Only solving easy problems:</strong>{' '}
                          <span className="text-gray-300">
                            Challenge yourself with problems slightly above your
                            current level.
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                        <p className="text-white">
                          <strong>❌ Ignoring time complexity:</strong>{' '}
                          <span className="text-gray-300">
                            Always analyze the efficiency of your solutions.
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                        <p className="text-white">
                          <strong>❌ Not learning from mistakes:</strong>{' '}
                          <span className="text-gray-300">
                            Review your wrong submissions and understand why
                            they failed.
                          </span>
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Conclusion */}
                  <section id="conclusion">
                    <h2 className="from-primary-300 mb-4 bg-linear-to-r to-white bg-clip-text text-3xl font-bold text-transparent">
                      Conclusion
                    </h2>
                    <p className="mb-4 leading-relaxed text-gray-300">
                      Starting competitive programming might seem daunting, but
                      with patience, consistent practice, and the right
                      resources, anyone can become proficient. Remember that
                      everyone starts as a beginner, and improvement comes
                      gradually.
                    </p>
                    <p className="mb-6 leading-relaxed text-gray-300">
                      Join our NEUPC community to practice with peers,
                      participate in contests, and get guidance from experienced
                      programmers. Your journey starts now!
                    </p>
                    <div className="border-primary-500/30 bg-primary-500/10 rounded-2xl border p-6 text-center backdrop-blur-md">
                      <p className="mb-4 text-lg font-semibold text-white">
                        Ready to start your competitive programming journey?
                      </p>
                      <Link
                        href="/join"
                        className="from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 inline-flex items-center gap-2 rounded-xl bg-linear-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105"
                      >
                        Join NEUPC Now
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
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </Link>
                    </div>
                  </section>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="border-t border-white/10 bg-black/20 py-12 backdrop-blur-sm md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Section Header */}
            <div className="mb-8 text-center md:mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md transition-all hover:bg-white/15 hover:shadow-xl">
                <span className="text-2xl">💬</span>
                <span className="text-primary-300">Join the Discussion</span>
              </div>
              <h2 className="from-primary-300 mb-3 bg-linear-to-r to-white bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                Comments & Discussion
              </h2>
              <p className="text-gray-400">
                Share your thoughts and connect with the community using GitHub
              </p>
            </div>

            {/* GitHub Giscus Comments */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8 lg:p-10">
              <GiscusComments />

              {/* Alternative: Manual Comment Prompt */}
              <div className="border-primary-500/20 bg-primary-500/5 mt-6 rounded-xl border p-6">
                <div className="flex items-start gap-4">
                  <div className="from-primary-500/30 to-secondary-500/30 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br">
                    <svg
                      className="text-primary-300 h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      Sign in with GitHub to comment
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-300">
                      Comments are powered by GitHub Discussions. You&apos;ll
                      need a GitHub account to participate in the conversation.
                      Your comments will be visible to everyone.
                    </p>
                    <a
                      href="https://github.com/eyasir329/neupc/discussions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 inline-flex items-center gap-2 rounded-lg bg-linear-to-r px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      View Discussions
                    </a>
                  </div>
                </div>
              </div>

              {/* Comment Guidelines */}
              <div className="mt-6 border-t border-white/10 pt-6">
                <h4 className="mb-3 text-sm font-semibold text-white">
                  Community Guidelines
                </h4>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-0.5">✓</span>
                    <span>Be respectful and constructive in your comments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-0.5">✓</span>
                    <span>Stay on topic and contribute to the discussion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-0.5">✓</span>
                    <span>Share your experiences and help others learn</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-0.5">✓</span>
                    <span>Report any inappropriate content to moderators</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      <div className="border-t border-white/10 bg-black/30 py-12 backdrop-blur-sm md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 text-3xl font-bold text-white md:text-4xl">
              Related Articles
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  href={`/blogs/${relatedBlog.id}`}
                  className="group hover:border-primary-500/50 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl"
                >
                  <div className="from-primary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"></div>

                  <div className="relative">
                    <span className="from-primary-500/20 to-primary-600/20 text-primary-300 border-primary-500/30 mb-3 inline-block rounded-full border bg-linear-to-br px-3 py-1 text-xs font-semibold">
                      {relatedBlog.category}
                    </span>
                    <h3 className="from-primary-300 mb-3 bg-linear-to-r to-white bg-clip-text text-lg leading-tight font-bold text-transparent">
                      {relatedBlog.title}
                    </h3>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {relatedBlog.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-gray-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <p className="flex items-center justify-between text-sm text-gray-400">
                      <span>{relatedBlog.readTime} read</span>
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-3">
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="group from-primary-500/20 to-primary-600/20 hover:from-primary-500/30 hover:to-primary-600/30 border-primary-500/30 flex h-12 w-12 items-center justify-center rounded-full border bg-linear-to-br shadow-lg backdrop-blur-md transition-all hover:scale-110 active:scale-95"
            title="Scroll to top"
          >
            <svg
              className="text-primary-300 h-5 w-5 transition-transform group-hover:-translate-y-1"
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

        {/* Floating Share Button */}
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="group from-secondary-500/20 to-secondary-600/20 hover:from-secondary-500/30 hover:to-secondary-600/30 border-secondary-500/30 flex h-12 w-12 items-center justify-center rounded-full border bg-linear-to-br shadow-lg backdrop-blur-md transition-all hover:scale-110 active:scale-95"
            title="Share article"
          >
            <svg
              className="text-secondary-300 h-5 w-5 transition-transform group-hover:rotate-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>

          {/* Share Menu Dropdown */}
          {showShareMenu && (
            <div className="absolute right-0 bottom-14 w-48 rounded-xl border border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur-xl">
              <div className="mb-2 text-xs font-semibold text-gray-400">
                Share this article
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleShare('facebook')}
                  className="hover:bg-primary-500/10 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition-all hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                  </svg>
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="hover:bg-primary-500/10 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition-all hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="hover:bg-primary-500/10 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition-all hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="hover:bg-primary-500/10 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition-all hover:text-white"
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
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
