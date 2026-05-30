/**
 * @file Blogs client component
 * @module BlogsClient
 */

'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import SafeImg from '@/app/_components/ui/SafeImg';
import InlinePagination from '@/app/_components/ui/InlinePagination';
import StatTile from '@/app/_components/ui/StatTile';
import HeroAmbient from '@/app/_components/ui/HeroAmbient';
import ScrollCue from '@/app/_components/ui/ScrollCue';
import SectionEyebrow from '@/app/_components/ui/SectionEyebrow';
import { cn, driveImageUrl } from '@/app/_lib/utils/utils';
import { getCategoryLabel, CATEGORY_KEYS } from '@/app/_lib/config/blog-config';
import {
  pageFadeUp as fadeUp,
  pageStagger as stagger,
  pageCardReveal as cardReveal,
  pageViewport as viewport,
} from '@/app/_components/motion/motion';

const ScrollToTop = dynamic(() => import('@/app/_components/ui/ScrollToTop'), {
  ssr: false,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'popular', label: 'Most Views' },
  { key: 'title', label: 'Title A–Z' },
];

const PER_PAGE = 9;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeBlog(b) {
  const authorObj = b.users || {};
  return {
    ...b,
    excerpt: b.excerpt || '',
    author: authorObj.full_name || 'NEUPC Team',
    authorAvatar: authorObj.avatar_url || null,
    thumbnail: b.thumbnail || null,
    date: b.published_at
      ? new Date(b.published_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '',
    readTime: b.read_time || '5 min',
    tags: Array.isArray(b.tags) ? b.tags : [],
    featured: b.is_featured ?? false,
    views: b.views ?? 0,
  };
}

// ─── Blog card (holographic-card pattern from homepage / events) ──────────────

function BlogCard({ blog }) {
  const image = blog.thumbnail ? driveImageUrl(blog.thumbnail) : null;

  return (
    <motion.div
      variants={cardReveal}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      <Link
        href={`/blogs/${blog.slug || blog.id}`}
        className="group focus-visible:ring-neon-lime flex h-full flex-col focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060b] focus-visible:outline-none"
      >
        {/* Cover */}
        <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/8 bg-white/3 shadow-sm transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-black/40">
          {image ? (
            <SafeImg
              src={image}
              alt={blog.title || ''}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-700">
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

          {/* Category pill */}
          {blog.category && (
            <div className="bg-neon-lime/90 absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-black uppercase backdrop-blur-sm">
              {getCategoryLabel(blog.category)}
            </div>
          )}

          {/* Featured badge */}
          {blog.featured && (
            <div className="border-neon-lime/30 bg-neon-lime/10 text-neon-lime absolute top-2.5 right-2.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase backdrop-blur-sm">
              Featured
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-1 flex-col gap-2 px-0.5">
          <h3 className="font-heading group-hover:text-neon-lime line-clamp-2 text-base leading-snug font-black text-white transition-colors duration-200 sm:text-lg">
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500 sm:text-sm">
              {blog.excerpt}
            </p>
          )}
          {blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {blog.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-zinc-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-white/5 pt-3 font-mono text-[9px] tracking-wider text-zinc-600 uppercase sm:text-[10px]">
            <span className="flex items-center gap-1.5">
              <div className="font-heading flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white">
                {blog.author.charAt(0)}
              </div>
              <span className="max-w-[100px] truncate">{blog.author}</span>
            </span>
            {blog.date && (
              <>
                <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
                <span>{blog.date}</span>
              </>
            )}
            {blog.readTime && (
              <>
                <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
                <span>{blog.readTime}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BlogsClient({ initialBlogs = [], settings = {} }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setPage] = useState(1);
  const gridRef = useRef(null);

  const blogs = useMemo(() => initialBlogs.map(normalizeBlog), [initialBlogs]);
  const featuredBlogs = useMemo(() => blogs.filter((b) => b.featured), [blogs]);

  // Category tabs derived from the categories actually present in the posts,
  // ordered by the shared enum config. Labels come from blog-config.
  const categories = useMemo(() => {
    const present = new Set(blogs.map((b) => b.category).filter(Boolean));
    return CATEGORY_KEYS.filter((key) => present.has(key)).map((key) => ({
      key,
      label: getCategoryLabel(key),
    }));
  }, [blogs]);

  const counts = useMemo(() => {
    const map = { all: blogs.length };
    categories.forEach(({ key }) => {
      map[key] = blogs.filter((b) => b.category === key).length;
    });
    return map;
  }, [blogs, categories]);

  const filtered = useMemo(() => {
    let list = blogs;
    if (category) list = list.filter((b) => b.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'oldest')
        return new Date(a.published_at) - new Date(b.published_at);
      if (sortBy === 'popular') return (b.views ?? 0) - (a.views ?? 0);
      if (sortBy === 'title')
        return (a.title ?? '').localeCompare(b.title ?? '');
      return new Date(b.published_at) - new Date(a.published_at);
    });
  }, [blogs, category, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageBlogs = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );
  const hasFilters = !!(search || category);

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (category ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0);

  const scrollToGrid = useCallback(() => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  function changePage(p) {
    setPage(p);
    setTimeout(scrollToGrid, 50);
  }
  function handleCategory(cat) {
    setCategory((p) => (p === cat ? '' : cat));
    setPage(1);
  }
  function handleSearch(e) {
    setSearch(e.target.value);
    setPage(1);
  }
  function clearAll() {
    setSearch('');
    setCategory('');
    setSortBy('newest');
    setPage(1);
  }

  const heroTitle = settings?.blogs_page_title || 'Engineering Logs';
  const heroDesc =
    settings?.blogs_page_description ||
    'Tutorials, contest insights, career guidance, and community stories from NEUPC members and mentors.';

  // Collect all unique tags from published blogs
  const allTags = useMemo(
    () => Array.from(new Set(blogs.flatMap((b) => b.tags))).slice(0, 24),
    [blogs]
  );

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05060B] text-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[75vh] items-center overflow-hidden px-4 pt-24 pb-16 sm:min-h-[80vh] sm:px-6 sm:pt-28 sm:pb-20 lg:px-8">
        <HeroAmbient />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-7xl"
        >
          <div className="max-w-2xl space-y-6 sm:max-w-3xl sm:space-y-8">
            {/* Eyebrow */}
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <span className="pulse-dot bg-neon-lime inline-block h-1.5 w-1.5 rounded-full" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-400 uppercase sm:text-[11px]">
                {settings?.blogs_page_badge || 'Knowledge Hub · NEUPC'}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="kinetic-headline font-heading text-[clamp(2.8rem,11vw,7rem)] leading-none font-black text-white uppercase select-none"
            >
              {heroTitle.includes('&') ? (
                <>
                  {heroTitle.split('&')[0].trim()}
                  <br />
                  <span className="neon-text">
                    &amp; {heroTitle.split('&')[1].trim()}
                  </span>
                </>
              ) : (
                <>{heroTitle}</>
              )}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="max-w-lg text-sm leading-relaxed text-zinc-400 sm:max-w-xl sm:text-base lg:text-lg"
            >
              {heroDesc}
            </motion.p>

            {/* Article count pill */}
            <motion.div
              variants={fadeUp}
              className="border-neon-lime/20 bg-neon-lime/8 text-neon-lime inline-flex items-center gap-2.5 rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase sm:px-5 sm:py-2.5 sm:text-[11px]"
            >
              <span className="pulse-dot bg-neon-lime h-1.5 w-1.5 rounded-full" />
              {blogs.length > 0
                ? `${blogs.length} Article${blogs.length !== 1 ? 's' : ''} Published`
                : 'New Articles Coming Soon'}
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              className="border-t border-white/8 pt-6 sm:pt-8"
            >
              <div className="grid grid-cols-4 divide-x divide-white/8">
                <div className="pr-3 sm:pr-6 lg:pr-8">
                  <StatTile
                    value={blogs.length}
                    label="Total Articles"
                    mobileLabel="Total"
                  />
                </div>
                <div className="px-3 sm:px-6 lg:px-8">
                  <StatTile
                    value={featuredBlogs.length}
                    label="Featured"
                    accent
                  />
                </div>
                <div className="px-3 sm:px-6 lg:px-8">
                  <StatTile
                    value={counts['Tutorial'] ?? 0}
                    label="Tutorials"
                    mobileLabel="Tuts"
                  />
                </div>
                <div className="pl-3 sm:pl-6 lg:pl-8">
                  <StatTile
                    value={counts['CP'] ?? 0}
                    label="CP Articles"
                    mobileLabel="CP"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <ScrollCue />
      </section>

      {/* ── All articles grid ─────────────────────────────────────────────── */}
      <section
        ref={gridRef}
        className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        style={{ scrollMarginTop: '80px' }}
      >
        <div className="mx-auto max-w-7xl space-y-8 sm:space-y-10">
          <SectionEyebrow
            tag="Browse Articles"
            title="All Posts"
            right={`${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
          />

          {/* Filters panel */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="glass-panel space-y-3 rounded-2xl p-3 sm:p-4"
          >
            {/* Search + sort row */}
            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search articles, authors, tags…"
                  className="focus:border-neon-lime/30 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-9 pl-9 text-sm text-white transition outline-none placeholder:text-zinc-600 focus:bg-white/8"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-0.5 text-zinc-500 transition-colors hover:text-white"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="focus:border-neon-lime/30 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-[10px] tracking-wider text-zinc-300 uppercase transition outline-none sm:min-w-40"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category tabs + clear */}
            <div className="flex items-center gap-2">
              <div className="scrollbar-none -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5">
                {/* All tab */}
                <button
                  onClick={() => {
                    setCategory('');
                    setPage(1);
                  }}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-wider uppercase transition-all',
                    !category
                      ? 'bg-neon-lime text-black shadow-[0_0_16px_-4px_rgba(182,243,107,0.5)]'
                      : 'hover:border-neon-lime/30 hover:text-neon-lime border border-white/10 text-zinc-500'
                  )}
                >
                  All
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-px text-[9px] tabular-nums',
                      !category ? 'bg-black/20' : 'bg-white/10'
                    )}
                  >
                    {counts.all}
                  </span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => handleCategory(cat.key)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-wider uppercase transition-all',
                      category === cat.key
                        ? 'bg-neon-lime text-black shadow-[0_0_16px_-4px_rgba(182,243,107,0.5)]'
                        : 'hover:border-neon-lime/30 hover:text-neon-lime border border-white/10 text-zinc-500'
                    )}
                  >
                    {cat.label}
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-px text-[9px] tabular-nums',
                        category === cat.key ? 'bg-black/20' : 'bg-white/10'
                      )}
                    >
                      {counts[cat.key] ?? 0}
                    </span>
                  </button>
                ))}
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="border-neon-lime/25 bg-neon-lime/8 text-neon-lime hover:bg-neon-lime/15 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[9px] font-bold tracking-wider uppercase transition-colors"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  {activeFilterCount}
                </button>
              )}
            </div>
          </motion.div>

          {/* Cards grid */}
          {pageBlogs.length > 0 ? (
            <>
              <motion.div
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
                key={`${category}-${sortBy}-${currentPage}-${search}`}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3"
              >
                {pageBlogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </motion.div>

              <InlinePagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={filtered.length}
                perPage={PER_PAGE}
                onPageChange={changePage}
                itemLabel="article"
              />
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewport}
              className="ph flex flex-col items-center gap-3 rounded-2xl py-16 text-center sm:py-24"
            >
              <div className="text-3xl">🔍</div>
              <p className="font-heading text-base font-bold text-white sm:text-lg">
                {hasFilters ? 'No articles found' : 'No articles yet'}
              </p>
              <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
                {hasFilters
                  ? 'Try different keywords or clear your filters'
                  : 'Blog posts will appear here once published'}
              </p>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="hover:border-neon-lime/30 hover:text-neon-lime mt-2 rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] tracking-widest text-zinc-500 uppercase transition-colors"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Tags cloud ───────────────────────────────────────────────────── */}
      {allTags.length > 0 && (
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionEyebrow tag="Explore Topics" title="Popular Tags" />
            <motion.div
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="flex flex-wrap gap-3"
            >
              {allTags.map((tag) => (
                <motion.button
                  key={tag}
                  variants={cardReveal}
                  onClick={() => {
                    setSearch(tag);
                    setPage(1);
                    scrollToGrid();
                  }}
                  className="hover:border-neon-lime/30 hover:bg-neon-lime/5 hover:text-neon-lime rounded-full border border-white/10 bg-white/3 px-5 py-2.5 font-mono text-[10px] tracking-wider text-zinc-500 uppercase transition-all"
                >
                  #{tag}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="glass-panel relative flex flex-col items-center justify-between gap-10 overflow-hidden rounded-2xl p-10 sm:p-16 lg:flex-row"
          >
            {/* Glow accent */}
            <div className="bg-neon-lime/10 pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-[80px]" />

            <div className="relative z-10 text-center lg:text-left">
              <div className="mb-3 flex items-center justify-center gap-3 lg:justify-start">
                <span className="bg-neon-lime h-px w-7" />
                <span className="text-neon-lime font-mono text-[10px] tracking-[0.35em] uppercase sm:text-[11px]">
                  Write For Us
                </span>
              </div>
              <h3 className="kinetic-headline font-heading text-3xl font-black text-white uppercase sm:text-4xl">
                {settings?.blogs_page_cta_title || (
                  <>
                    Share Your <span className="neon-text">Knowledge</span>
                  </>
                )}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                {settings?.blogs_page_cta_description ||
                  'Are you a member with insights to share? Contribute a tutorial, contest editorial, or career story to the community.'}
              </p>
            </div>

            <div className="relative z-10 flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/join"
                className="bg-neon-lime font-heading inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[10px] font-bold tracking-widest text-black uppercase shadow-[0_0_30px_-8px_rgba(182,243,107,0.6)] transition-shadow hover:shadow-[0_0_50px_-4px_rgba(182,243,107,0.8)] sm:text-[11px]"
              >
                Join the Club →
              </Link>
              <Link
                href="/contact"
                className="font-heading hover:border-neon-lime/35 hover:text-neon-lime inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-8 py-3.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-all sm:text-[11px]"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <ScrollToTop />
    </div>
  );
}
