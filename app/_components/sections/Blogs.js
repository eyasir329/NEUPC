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
  {
    cat: 'text-emerald-600 dark:text-neon-lime',
    hover: 'group-hover:text-emerald-600 dark:group-hover:text-neon-lime',
    icon: 'text-emerald-500 dark:text-neon-lime',
  },
  {
    cat: 'text-violet-600 dark:text-neon-violet',
    hover: 'group-hover:text-violet-600 dark:group-hover:text-neon-violet',
    icon: 'text-violet-500 dark:text-neon-violet',
  },
  {
    cat: 'text-emerald-600 dark:text-neon-lime',
    hover: 'group-hover:text-emerald-600 dark:group-hover:text-neon-lime',
    icon: 'text-emerald-500 dark:text-neon-lime',
  },
];

const CARD_ICONS = [
  'M6 5v7.586l3.293-3.293a1 1 0 011.414 0L14 12.586l3.293-3.293A1 1 0 0119 10v9a1 1 0 01-1 1H6a1 1 0 01-1-1V5z',
  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  'M13 10V3L4 14h7v7l9-11h-7z',
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
            'font-heading mb-6 text-2xl font-black leading-snug tracking-tighter text-slate-900 uppercase transition-colors dark:text-white',
            accent.hover
          )}
        >
          {blog.title}
        </h3>
        <p className="mb-8 text-sm font-light italic leading-relaxed text-slate-500 dark:text-zinc-500">
          {getExcerpt(blog)}
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-8 dark:border-white/5">
        <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-zinc-500">
          {authorName}
        </span>
        <svg
          className={cn(
            'h-6 w-6 transition-transform group-hover:rotate-12',
            accent.icon
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
    <section className="relative overflow-hidden px-8 py-32">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-neon-violet/5 blur-[140px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl space-y-20">
        <div className="flex flex-col items-end gap-10 md:flex-row">
          <div className="shrink-0 space-y-5">
            <div className="flex items-center gap-4">
              <span className="h-[1px] w-10 bg-violet-600 dark:bg-neon-violet" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.5em] text-violet-600 dark:text-neon-violet">
                Knowledge Base / 004
              </span>
            </div>
            <h2 className="kinetic-headline font-heading text-5xl font-black uppercase text-slate-900 md:text-6xl dark:text-white">
              {settings?.homepage_blogs_title || 'Insights'}
            </h2>
          </div>
          <div className="mb-3 hidden h-px grow bg-linear-to-r from-violet-200 to-transparent md:block dark:from-neon-violet/20" />
          <Link
            href="/blogs"
            className="font-heading shrink-0 rounded-full border border-slate-200 bg-slate-50 px-8 py-3.5 text-[11px] font-bold tracking-widest text-slate-500 uppercase transition-all hover:border-violet-600 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:border-neon-violet dark:hover:text-neon-violet"
          >
            View All Posts →
          </Link>
        </div>

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
            <p className="font-mono text-[11px] tracking-[0.3em] text-slate-400 uppercase dark:text-zinc-600">
              {settings?.blogs_empty_message || '[ NO_ARTICLES_PUBLISHED ]'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Blogs;
