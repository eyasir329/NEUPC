/**
 * @file Blogs listing page client component.
 * Displays categorized, searchable blog cards with featured article highlight.
 *
 * @module BlogsClient
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import PageHero from '../_components/ui/PageHero';
import EmptyState from '../_components/ui/EmptyState';
import { useScrollReveal } from '../_lib/hooks';
import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});
import { cn } from '../_lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Blog category filter buttons */
const CATEGORIES = [
  { name: 'All', icon: '📚' },
  { name: 'Tutorials', icon: '📘' },
  { name: 'Contests', icon: '🏆' },
  { name: 'Career', icon: '🚀' },
  { name: 'Announcements', icon: '📢' },
  { name: 'WIE', icon: '👩‍💻' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a raw blog object from the API into a consistent shape.
 * @param {object} b - Raw blog record
 * @returns {object} Normalized blog
 */
function normalizeBlog(b) {
  return {
    ...b,
    excerpt: b.excerpt || b.description || '',
    author: b.author || b.author_name || 'NEUPC Team',
    date:
      b.date ||
      (b.published_at
        ? new Date(b.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : ''),
    readTime: b.readTime || b.read_time || '5 min',
    tags: b.tags || [],
    featured: b.featured ?? b.is_featured ?? false,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Featured blog hero card.
 * @param {{ blog: object }} props
 */
function FeaturedBlogCard({ blog }) {
  return (
    <div className="mb-12 md:mb-16">
      <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
        Featured Article
      </h2>
      <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/30 md:p-12">
        <div className="from-primary-500/20 absolute -top-20 -right-20 h-64 w-64 rounded-full bg-linear-to-br to-transparent opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="from-primary-500/20 to-primary-600/20 text-primary-300 border-primary-500/30 rounded-full border bg-linear-to-br px-4 py-1.5 font-semibold">
              {blog.category}
            </span>
            <span className="text-gray-400">{blog.date}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">{blog.readTime} read</span>
          </div>

          <h3 className="from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-3xl font-bold text-transparent md:text-4xl lg:text-5xl">
            {blog.title}
          </h3>

          <p className="mb-6 text-base leading-relaxed text-gray-300 md:text-lg">
            {blog.excerpt}
          </p>

          {blog.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-white/10 px-3 py-1 text-xs text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="from-primary-500/30 to-secondary-500/30 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br text-xl font-bold text-white">
                {blog.author.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white">{blog.author}</p>
                <p className="text-sm text-gray-400">Author</p>
              </div>
            </div>

            <Link
              href={`/blogs/${blog.slug || blog.id}`}
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
  );
}

/**
 * Regular blog card.
 * @param {{ blog: object }} props
 */
function BlogCard({ blog }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/20">
      <div className="from-primary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

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

        {blog.tags.length > 0 && (
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
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <div className="from-secondary-500/30 to-primary-500/30 flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold text-white">
              {blog.author.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-medium text-white">{blog.author}</p>
              <p className="text-xs text-gray-400">{blog.date}</p>
            </div>
          </div>

          <Link
            href={`/blogs/${blog.slug || blog.id}`}
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
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Blogs listing page client component.
 *
 * @param {{ initialBlogs?: Array }} props
 */
export default function BlogsClient({ initialBlogs = [] }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRef, searchVisible] = useScrollReveal({ threshold: 0.2 });
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.05 });

  // Memoize normalized blogs to avoid re-computing on every render
  const blogs = useMemo(() => initialBlogs.map(normalizeBlog), [initialBlogs]);

  const filteredBlogs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return blogs.filter((blog) => {
      const matchesCategory =
        activeCategory === 'All' || blog.category === activeCategory;
      const matchesSearch =
        !q ||
        blog.title.toLowerCase().includes(q) ||
        blog.excerpt.toLowerCase().includes(q) ||
        blog.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [blogs, activeCategory, searchQuery]);

  const featuredBlog = blogs.find((blog) => blog.featured);
  const regularBlogs = filteredBlogs.filter((blog) => !blog.featured);

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      <PageHero
        badgeIcon="📝"
        badge="Knowledge Hub"
        title="Programming Insights & Updates"
        description="Explore tutorials, contest insights, club updates, and career guidance from our programming community"
      />

      {/* Content Section */}
      <section className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="mx-auto max-w-7xl">
            {/* Search Bar */}
            <div
              ref={searchRef}
              className={cn(
                'mb-12 transition-all duration-700 md:mb-16',
                searchVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
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
              {CATEGORIES.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(category.name)}
                  className={cn(
                    'group relative overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300',
                    activeCategory === category.name
                      ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                      : 'hover:border-primary-500/50 border border-white/20 bg-white/10 text-gray-300 backdrop-blur-md hover:bg-white/15'
                  )}
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
              <FeaturedBlogCard blog={featuredBlog} />
            )}

            {/* Blog Grid */}
            <div ref={gridRef}>
              <h2
                className={cn(
                  'mb-6 text-2xl font-bold text-white transition-all duration-700 md:text-3xl',
                  gridVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                )}
              >
                {activeCategory === 'All'
                  ? 'All Articles'
                  : `${activeCategory} Articles`}
              </h2>

              {regularBlogs.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {regularBlogs.map((blog, index) => (
                    <div
                      key={blog.id}
                      className={cn(
                        'transition-all duration-700',
                        gridVisible
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-8 opacity-0'
                      )}
                      style={{
                        transitionDelay: gridVisible
                          ? `${index * 100}ms`
                          : '0ms',
                      }}
                    >
                      <BlogCard blog={blog} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📝"
                  title="No blogs found"
                  description="Try adjusting your search or filters"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <ScrollToTop />
    </main>
  );
}
