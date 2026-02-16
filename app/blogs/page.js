'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Page() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'All', icon: '📚' },
    { name: 'Tutorials', icon: '📘' },
    { name: 'Contests', icon: '🏆' },
    { name: 'Career', icon: '🚀' },
    { name: 'Announcements', icon: '📢' },
    { name: 'WIE', icon: '👩‍💻' },
  ];

  const blogs = [
    {
      id: 1,
      title: 'How to Start Competitive Programming as a Beginner',
      excerpt:
        'A comprehensive guide for beginners to start their journey in competitive programming. Learn about essential resources, practice strategies, and common mistakes to avoid.',
      category: 'Tutorials',
      author: 'Md. Arif Rahman',
      date: 'Feb 10, 2026',
      readTime: '8 min',
      tags: ['CP', 'Beginner', 'Guide'],
      featured: true,
    },
    {
      id: 2,
      title: 'C++ STL You Must Know for Programming Contests',
      excerpt:
        'Master the essential C++ Standard Template Library components that every competitive programmer should know. Includes vectors, maps, sets, and algorithms.',
      category: 'Tutorials',
      author: 'Tasnim Akter',
      date: 'Feb 8, 2026',
      readTime: '12 min',
      tags: ['C++', 'STL', 'Data Structures'],
      featured: false,
    },
    {
      id: 3,
      title: 'Intra University Programming Contest 2026 Recap',
      excerpt:
        'Highlights and analysis from our annual programming contest. Over 100 participants competed in solving challenging algorithmic problems.',
      category: 'Contests',
      author: 'Sabbir Ahmed',
      date: 'Feb 5, 2026',
      readTime: '6 min',
      tags: ['Contest', 'ICPC', 'Recap'],
      featured: false,
    },
    {
      id: 4,
      title: 'Graph Theory Basics for ICPC Preparation',
      excerpt:
        'Understanding graph theory fundamentals including BFS, DFS, shortest paths, and minimum spanning trees for competitive programming.',
      category: 'Tutorials',
      author: 'Nusrat Jahan',
      date: 'Feb 3, 2026',
      readTime: '15 min',
      tags: ['Graph Theory', 'Algorithms', 'ICPC'],
      featured: false,
    },
    {
      id: 5,
      title: 'Roadmap to Becoming a Software Engineer',
      excerpt:
        'A complete roadmap for CSE students aspiring to become software engineers. Learn about essential skills, projects, and interview preparation.',
      category: 'Career',
      author: 'Fahim Hassan',
      date: 'Jan 28, 2026',
      readTime: '10 min',
      tags: ['Career', 'Software Engineering', 'Roadmap'],
      featured: false,
    },
    {
      id: 6,
      title: 'Encouraging Women in Competitive Programming',
      excerpt:
        "Our WIE initiative to promote diversity in tech. Learn about our programs, achievements, and how we're breaking barriers.",
      category: 'WIE',
      author: 'Farzana Kabir',
      date: 'Jan 25, 2026',
      readTime: '7 min',
      tags: ['WIE', 'Diversity', 'Women in Tech'],
      featured: false,
    },
    {
      id: 7,
      title: 'Dynamic Programming: A Beginner Friendly Guide',
      excerpt:
        'Master the art of dynamic programming with simple explanations, common patterns, and practice problems suitable for beginners.',
      category: 'Tutorials',
      author: 'Rakib Islam',
      date: 'Jan 20, 2026',
      readTime: '14 min',
      tags: ['DP', 'Algorithms', 'Tutorial'],
      featured: false,
    },
    {
      id: 8,
      title: 'NEUPC Bootcamp 2026 Announcement',
      excerpt:
        'Join our 5-day intensive competitive programming bootcamp covering C++, STL, data structures, and advanced algorithms. Registration now open!',
      category: 'Announcements',
      author: 'NEUPC Executive',
      date: 'Jan 15, 2026',
      readTime: '4 min',
      tags: ['Bootcamp', 'Event', 'Registration'],
      featured: false,
    },
    {
      id: 9,
      title: 'How to Build a Strong GitHub Profile',
      excerpt:
        'Learn the best practices for maintaining a professional GitHub profile that stands out to recruiters and showcases your skills effectively.',
      category: 'Career',
      author: 'Shahriar Alam',
      date: 'Jan 10, 2026',
      readTime: '9 min',
      tags: ['GitHub', 'Portfolio', 'Career'],
      featured: false,
    },
  ];

  const filteredBlogs = blogs.filter((blog) => {
    const matchesCategory =
      activeCategory === 'All' || blog.category === activeCategory;
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const featuredBlog = blogs.find((blog) => blog.featured);
  const regularBlogs = filteredBlogs.filter((blog) => !blog.featured);

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
          <div className="mx-auto max-w-7xl">
            {/* Header Section */}
            <div className="mb-12 text-center md:mb-16 lg:mb-20">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 text-sm font-medium backdrop-blur-sm">
                <span className="text-2xl">📝</span>
                <span className="text-primary-300">Knowledge Hub</span>
              </div>
              <h1 className="from-primary-300 to-secondary-300 mb-6 bg-linear-to-r via-white bg-clip-text text-4xl leading-tight font-bold text-transparent md:text-5xl lg:text-6xl">
                Programming Insights & Updates
              </h1>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-300 md:text-xl">
                Explore tutorials, contest insights, club updates, and career
                guidance from our programming community
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="mx-auto max-w-7xl">
            {/* Search Bar */}
            <div className="mb-12 md:mb-16">
              <div className="relative mx-auto max-w-2xl">
                <input
                  type="text"
                  placeholder="Search blogs by title, content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:border-primary-500/50 focus:ring-primary-500/50 w-full rounded-xl border border-white/20 bg-white/10 px-6 py-4 pl-14 text-white placeholder-gray-400 backdrop-blur-md transition-all focus:bg-white/15 focus:ring-2 focus:outline-none"
                />
                <svg
                  className="absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Category Filters */}
            <div className="mb-12 flex flex-wrap justify-center gap-3 md:mb-16">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(category.name)}
                  className={`group relative overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                    activeCategory === category.name
                      ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                      : 'hover:border-primary-500/50 border border-white/20 bg-white/10 text-gray-300 backdrop-blur-md hover:bg-white/15'
                  }`}
                >
                  <span className="relative flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Featured Blog */}
            {activeCategory === 'All' && featuredBlog && (
              <div className="mb-12 md:mb-16">
                <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
                  Featured Article
                </h2>
                <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/30 md:p-12">
                  <div className="from-primary-500/20 absolute -top-20 -right-20 h-64 w-64 rounded-full bg-linear-to-br to-transparent opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"></div>

                  <div className="relative">
                    <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                      <span className="from-primary-500/20 to-primary-600/20 text-primary-300 border-primary-500/30 rounded-full border bg-linear-to-br px-4 py-1.5 font-semibold">
                        {featuredBlog.category}
                      </span>
                      <span className="text-gray-400">{featuredBlog.date}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">
                        {featuredBlog.readTime} read
                      </span>
                    </div>

                    <h3 className="from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-3xl font-bold text-transparent md:text-4xl lg:text-5xl">
                      {featuredBlog.title}
                    </h3>

                    <p className="mb-6 text-base leading-relaxed text-gray-300 md:text-lg">
                      {featuredBlog.excerpt}
                    </p>

                    <div className="mb-6 flex flex-wrap gap-2">
                      {featuredBlog.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-white/10 px-3 py-1 text-xs text-gray-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="from-primary-500/30 to-secondary-500/30 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br text-xl font-bold text-white">
                          {featuredBlog.author.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {featuredBlog.author}
                          </p>
                          <p className="text-sm text-gray-400">Author</p>
                        </div>
                      </div>

                      <Link
                        href={`/blogs/${featuredBlog.id}`}
                        className="from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 group/link hover:shadow-primary-500/50 inline-flex items-center gap-2 rounded-xl bg-linear-to-r px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105"
                      >
                        Read Article
                        <svg
                          className="h-5 w-5 transition-transform group-hover/link:translate-x-1"
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
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Blog Grid */}
            <div>
              <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
                {activeCategory === 'All'
                  ? 'All Articles'
                  : `${activeCategory} Articles`}
              </h2>

              {regularBlogs.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {regularBlogs.map((blog) => (
                    <div
                      key={blog.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/20"
                    >
                      <div className="from-primary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"></div>

                      <div className="relative">
                        <div className="mb-3 flex items-center gap-2 text-xs">
                          <span className="from-primary-500/20 to-primary-600/20 text-primary-300 border-primary-500/30 rounded-full border bg-linear-to-br px-3 py-1 font-semibold">
                            {blog.category}
                          </span>
                          <span className="text-gray-400">{blog.readTime}</span>
                        </div>

                        <h3 className="from-primary-300 mb-3 bg-linear-to-r to-white bg-clip-text text-xl leading-tight font-bold text-transparent transition-all duration-300 group-hover:scale-[1.02]">
                          {blog.title}
                        </h3>

                        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-300 transition-colors group-hover:text-gray-200">
                          {blog.excerpt}
                        </p>

                        <div className="mb-4 flex flex-wrap gap-1.5">
                          {blog.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-gray-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                          <div className="flex items-center gap-2">
                            <div className="from-secondary-500/30 to-primary-500/30 flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold text-white">
                              {blog.author.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white">
                                {blog.author}
                              </p>
                              <p className="text-xs text-gray-400">
                                {blog.date}
                              </p>
                            </div>
                          </div>

                          <Link
                            href={`/blogs/${blog.id}`}
                            className="from-primary-500/20 to-primary-600/20 hover:from-primary-500/30 hover:to-primary-600/30 group/arrow flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br transition-all"
                          >
                            <svg
                              className="text-primary-300 h-4 w-4 transition-transform group-hover/arrow:translate-x-0.5"
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
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
                  <svg
                    className="mx-auto mb-4 h-16 w-16 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    No blogs found
                  </h3>
                  <p className="text-gray-400">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
