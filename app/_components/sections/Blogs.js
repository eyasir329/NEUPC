'use client';

/**
 * @file Blogs — Homepage section (Insights design)
 * @module Blogs
 */

import Link from 'next/link';
import { cn } from '@/app/_lib/utils';
import { getCategoryConfig } from '@/app/_lib/blog-config';
import { useStaggerReveal } from '@/app/_lib/hooks';

const CARD_ACCENTS = [
  { cat: 'text-neon-lime', hover: 'group-hover:text-neon-lime' },
  { cat: 'text-neon-violet', hover: 'group-hover:text-neon-violet' },
  { cat: 'text-neon-lime', hover: 'group-hover:text-neon-lime' },
];

const CARD_ICONS = [
  'M6 5v7.586l3.293-3.293a1 1 0 011.414 0L14 12.586l3.293-3.293A1 1 0 0119 10v9a1 1 0 01-1 1H6a1 1 0 01-1-1V5z', // terminal-like
  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', // chart
  'M13 10V3L4 14h7v7l9-11h-7z', // bolt/hub
];

function getExcerpt(blog) {
  return (
    blog.excerpt ||
    blog.description ||
    (blog.content
      ? blog.content.replace(/<[^>]*>/g, '').slice(0, 180) + '…'
      : '')
  );
}

function getAuthorName(blog) {
  return (
    blog.users?.full_name || blog.author_name || blog.author || 'NEUPC Team'
  );
}

// ─── InsightCard ──────────────────────────────────────────────────────────────

function InsightCard({ blog, index = 0 }) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const catCfg = getCategoryConfig(blog.category);
  const blogLink = `/blogs/${blog.slug || blog.id}`;
  const authorName = getAuthorName(blog);
  const iconPath = CARD_ICONS[index % CARD_ICONS.length];

  return (
    <Link
      href={blogLink}
      className="holographic-card group flex min-h-100 flex-col justify-between rounded-3xl p-10"
    >
      <div>
        <div
          className={cn(
            'mb-6 font-mono text-[10px] font-bold tracking-widest uppercase',
            accent.cat
          )}
        >
          {catCfg.label || blog.category || 'Research'}
        </div>
        <h3
          className={cn(
            'font-heading mb-6 text-2xl leading-snug font-black tracking-tighter text-white uppercase transition-colors',
            accent.hover
          )}
        >
          {blog.title}
        </h3>
        <p className="mb-8 text-sm leading-relaxed font-light text-zinc-500 italic">
          {getExcerpt(blog)}
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-white/5 pt-8">
        <span className="font-mono text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
          {authorName}
        </span>
        <svg
          className={cn(
            'h-6 w-6 transition-transform group-hover:rotate-12',
            accent.cat
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </div>
    </Link>
  );
}

// ─── Blogs / Insights Section ────────────────────────────────────────────────

function Blogs({
  blogs = [],
  featuredBlogs = [],
  recentBlogs = [],
  settings = {},
}) {
  const allBlogs = [...featuredBlogs, ...recentBlogs, ...blogs];
  const uniqueBlogs = allBlogs.filter(
    (b, i, arr) => arr.findIndex((x) => x.id === b.id) === i
  );
  const displayBlogs = uniqueBlogs.slice(0, 3);

  const {
    ref: gridRef,
    isVisible: gridVisible,
    getDelay,
  } = useStaggerReveal({ staggerMs: 120 });

  return (
    <section className="px-8 py-32">
      <div className="mx-auto max-w-7xl space-y-20">
        {/* Header */}
        <div className="flex flex-col items-end gap-10 md:flex-row">
          <div className="shrink-0 space-y-3">
            <span className="text-neon-violet font-mono text-[11px] font-bold tracking-[0.4em] uppercase">
              Knowledge Base
            </span>
            <h2 className="font-heading text-5xl font-black tracking-tighter text-white uppercase italic md:text-6xl">
              {settings?.homepage_blogs_title || 'Insights'}
            </h2>
          </div>
          <div className="from-neon-violet/20 mb-3 hidden h-px grow bg-linear-to-r to-transparent md:block" />
          <Link
            href="/blogs"
            className="font-heading hover:border-neon-violet hover:text-neon-violet shrink-0 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-[11px] font-bold tracking-widest text-zinc-400 uppercase transition-all"
          >
            View All Posts
          </Link>
        </div>

        {/* Cards */}
        {displayBlogs.length > 0 ? (
          <div ref={gridRef} className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {displayBlogs.map((blog, index) => (
              <div
                key={blog.id ?? index}
                className={cn(
                  'transition-all duration-700 ease-out',
                  gridVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                )}
                style={{
                  transitionDelay: gridVisible ? `${getDelay(index)}ms` : '0ms',
                }}
              >
                <InsightCard blog={blog} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="holographic-card rounded-2xl py-16 text-center">
            <p className="font-mono text-[11px] tracking-[0.3em] text-zinc-600 uppercase">
              {settings?.blogs_empty_message || '[ NO_ARTICLES_PUBLISHED ]'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Blogs;
