/**
 * @file Blog detail page client component.
 * Renders full blog post with reading progress, TOC, share, like, comments.
 *
 * @module BlogDetailClient
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const GiscusComments = dynamic(
  () => import('@/app/_components/ui/GiscusComments'),
  { ssr: false }
);
import { cn, getInitials } from '@/app/_lib/utils';

/* ──────────────────── Constants ──────────────────── */

/** @type {{ id: string, label: string, size: string }[]} */
const FONT_SIZES = [
  { id: 'small', label: 'A', size: 'text-xs' },
  { id: 'normal', label: 'A', size: 'text-sm' },
  { id: 'large', label: 'A', size: 'text-base' },
];

const FONT_SIZE_CLASSES = {
  small: 'text-sm',
  normal: 'text-base',
  large: 'text-lg',
};

/** @type {{ platform: string, label: string, icon: string, fill?: boolean }[]} */
const SHARE_PLATFORMS = [
  {
    platform: 'facebook',
    label: 'Facebook',
    icon: 'M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z',
    fill: true,
  },
  {
    platform: 'twitter',
    label: 'Twitter',
    icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
    fill: true,
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    fill: true,
  },
];

/** @type {string[]} */
const COMMUNITY_GUIDELINES = [
  'Be respectful and constructive in your comments',
  'Stay on topic and contribute to the discussion',
  'Share your experiences and help others learn',
  'Report any inappropriate content to moderators',
];

const COPY_ICON_PATH =
  'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3';

/* ──────────────────── Sub-components ──────────────────── */

/**
 * Social share button (icon-only).
 * @param {{ platform: string, icon: string, fill?: boolean, onClick: Function }} props
 */
function ShareIconButton({ platform, icon, fill, onClick }) {
  return (
    <button
      title={`Share on ${platform}`}
      onClick={onClick}
      className="group/btn hover:bg-primary-500/20 hover:border-primary-500/50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all hover:scale-110 active:scale-95"
    >
      <svg
        className="group-hover/btn:text-primary-300 h-5 w-5 text-gray-300 transition-colors"
        fill={fill ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke={fill ? undefined : 'currentColor'}
      >
        <path
          strokeLinecap={fill ? undefined : 'round'}
          strokeLinejoin={fill ? undefined : 'round'}
          strokeWidth={fill ? undefined : 2}
          d={icon}
        />
      </svg>
    </button>
  );
}

/**
 * Table of contents navigation item.
 * @param {{ section: Object, index: number, isActive: boolean, onClick: Function }} props
 */
function TOCItem({ section, index, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative block w-full rounded-lg px-3 py-2 text-left text-sm transition-all',
        isActive
          ? 'text-primary-300 bg-primary-500/10 font-semibold'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-xs',
            isActive ? 'text-primary-400' : 'text-gray-500'
          )}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="flex-1">{section.title}</span>
        {isActive && (
          <svg
            className="text-primary-400 h-3 w-3"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      {isActive && (
        <div className="from-primary-500 absolute top-0 left-0 h-full w-1 rounded-r bg-linear-to-b to-transparent" />
      )}
    </button>
  );
}

/**
 * Related blog card.
 * @param {{ blog: Object }} props
 */
function RelatedBlogCard({ blog }) {
  return (
    <Link
      href={`/blogs/${blog.slug || blog.id}`}
      className="group hover:border-primary-500/50 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl"
    >
      <div className="from-primary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">
        <span className="from-primary-500/20 to-primary-600/20 text-primary-300 border-primary-500/30 mb-3 inline-block rounded-full border bg-linear-to-br px-3 py-1 text-xs font-semibold">
          {blog.category}
        </span>
        <h3 className="from-primary-300 mb-3 bg-linear-to-r to-white bg-clip-text text-lg leading-tight font-bold text-transparent">
          {blog.title}
        </h3>
        {blog.tags?.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {blog.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <p className="flex items-center justify-between text-sm text-gray-400">
          <span>{blog.read_time || blog.readTime || '5'} min read</span>
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
  );
}

/* ──────────────────── Main Component ──────────────────── */

/**
 * Blog detail page with reading progress, TOC, share, and comments.
 * @param {{ blog?: Object, relatedBlogs?: Object[] }} props
 */
export default function BlogDetailClient({ blog = {}, relatedBlogs = [] }) {
  const [activeSection, setActiveSection] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [showMobileTOC, setShowMobileTOC] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const contentRef = useRef(null);

  /** Normalized blog fields */
  const meta = useMemo(() => {
    const authorName =
      blog.author?.name ||
      blog.users?.full_name ||
      blog.author_name ||
      'NEUPC Team';
    const readTime = blog.readTime || blog.read_time || '5';
    const readTimeLabel =
      typeof readTime === 'number'
        ? `${readTime} min`
        : readTime.toString().includes('min')
          ? readTime
          : `${readTime} min`;
    return {
      title: blog.title || 'Untitled Blog',
      category: blog.category || 'General',
      authorName,
      authorRole: blog.author?.role || 'Author',
      authorBio: blog.author?.bio || '',
      authorAvatar:
        blog.author?.avatar ||
        blog.users?.avatar_url ||
        getInitials(authorName),
      blogDate:
        blog.date ||
        (blog.published_at
          ? new Date(blog.published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : ''),
      readTimeLabel,
      tags: blog.tags || [],
      views: blog.views || 0,
      likes: blog.likes || 0,
      content: blog.content || '',
    };
  }, [blog]);

  const [tableOfContents, setTableOfContents] = useState([]);

  useEffect(() => {
    if (contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h2[id], h3[id]');
      const toc = Array.from(headings).map((h) => ({
        id: h.id,
        title: h.textContent,
        level: h.tagName === 'H3' ? 3 : 2,
      }));
      if (toc.length > 0) {
        setTableOfContents(toc);
        setActiveSection(toc[0].id);
      }
    }
  }, [meta.content]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      setScrollProgress(
        totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      );
      setShowScrollTop(window.scrollY > 300);

      if (tableOfContents.length > 0) {
        for (let i = tableOfContents.length - 1; i >= 0; i--) {
          const section = document.getElementById(tableOfContents[i].id);
          if (section && section.getBoundingClientRect().top <= 150) {
            setActiveSection(tableOfContents[i].id);
            break;
          }
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tableOfContents]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetPosition =
        element.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setShowMobileTOC(false);
  }, []);

  const handleShare = useCallback(
    (platform) => {
      const url = window.location.href;
      const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(meta.title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      };

      if (platform === 'copy') {
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } else if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      }
      setShowShareMenu(false);
    },
    [meta.title]
  );

  if (!blog?.title) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Blog Not Found</h1>
          <p className="mb-6 text-gray-400">
            The blog post you are looking for does not exist.
          </p>
          <Link
            href="/blogs"
            className="from-primary-500 to-primary-600 rounded-xl bg-linear-to-r px-6 py-3 font-semibold text-white transition-all hover:scale-105"
          >
            Back to Blogs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-black text-white">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 right-0 left-0 z-50 h-1 bg-black/50">
        <div
          className="from-primary-500 via-secondary-400 to-primary-300 h-full bg-linear-to-r transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-linear-to-b from-black/50 via-black/30 to-black/60" />
      <div className="from-primary-500/10 via-secondary-500/10 to-primary-500/10 pointer-events-none fixed inset-0 -z-10 bg-linear-to-br opacity-30" />
      <div className="from-primary-500/20 to-secondary-500/20 fixed -top-40 -left-40 -z-10 h-96 w-96 animate-pulse rounded-full bg-linear-to-br blur-3xl" />
      <div
        className="from-secondary-500/20 to-primary-500/20 fixed top-1/2 -right-40 -z-10 h-96 w-96 animate-pulse rounded-full bg-linear-to-br blur-3xl"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="from-primary-500/15 to-secondary-500/15 fixed bottom-0 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 animate-pulse rounded-full bg-linear-to-br blur-3xl"
        style={{ animationDelay: '2s' }}
      />

      {/* Sticky Nav Bar */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
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
            <span className="text-primary-300">{meta.category}</span>
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

            <div className="flex items-center gap-3">
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
                <div className="h-4 w-px bg-white/10" />
                <span className="text-xs text-gray-400">
                  {meta.readTimeLabel} read
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile TOC Overlay */}
      {showMobileTOC && tableOfContents.length > 0 && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowMobileTOC(false)}
          />
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
                <TOCItem
                  key={section.id}
                  section={section}
                  index={index}
                  isActive={activeSection === section.id}
                  onClick={() => scrollToSection(section.id)}
                />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="border-b border-white/10 bg-black/30 py-12 backdrop-blur-sm md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center gap-3 md:mb-6">
              <span className="from-primary-500/20 to-primary-600/20 text-primary-300 border-primary-500/30 inline-flex items-center gap-2 rounded-full border bg-linear-to-br px-4 py-2 text-sm font-semibold">
                <span>📘</span> {meta.category}
              </span>
              {meta.blogDate && (
                <span className="text-sm text-gray-400">{meta.blogDate}</span>
              )}
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-400">
                {meta.readTimeLabel} read
              </span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-400">{meta.views} views</span>
            </div>

            <h1 className="from-primary-300 to-secondary-300 mb-6 bg-linear-to-r via-white bg-clip-text text-4xl leading-tight font-bold text-transparent md:mb-8 md:text-5xl lg:text-6xl">
              {meta.title}
            </h1>

            {meta.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2 md:mb-8">
                {meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-300 backdrop-blur-md transition-colors hover:bg-white/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Info */}
            <div className="group hover:border-primary-500/30 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:bg-white/10 sm:p-8">
              <div className="from-primary-500/10 absolute -top-20 -right-20 h-40 w-40 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="from-primary-500/30 to-secondary-500/30 ring-primary-500/20 relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-2xl font-bold text-white shadow-lg ring-2 transition-transform group-hover:scale-110 sm:h-20 sm:w-20 sm:text-3xl">
                    {meta.authorAvatar}
                    <div className="from-primary-500/50 to-secondary-500/50 absolute inset-0 rounded-full bg-linear-to-br opacity-0 blur transition-opacity group-hover:opacity-30" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-white sm:text-xl">
                      {meta.authorName}
                    </p>
                    <p className="text-primary-300 text-sm font-medium">
                      {meta.authorRole}
                    </p>
                    {meta.authorBio && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-300 sm:text-base">
                        {meta.authorBio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col sm:gap-3">
                  {SHARE_PLATFORMS.map((p) => (
                    <ShareIconButton
                      key={p.platform}
                      platform={p.label}
                      icon={p.icon}
                      fill={p.fill}
                      onClick={() => handleShare(p.platform)}
                    />
                  ))}
                  <ShareIconButton
                    platform="Copy link"
                    icon={COPY_ICON_PATH}
                    onClick={() => handleShare('copy')}
                  />
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
            {tableOfContents.length > 0 && (
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
                        <TOCItem
                          key={section.id}
                          section={section}
                          index={index}
                          isActive={activeSection === section.id}
                          onClick={() => scrollToSection(section.id)}
                        />
                      ))}
                    </nav>
                  </div>

                  {/* Like Button */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className={cn(
                        'group relative w-full overflow-hidden rounded-xl border py-4 font-semibold text-white transition-all hover:scale-105 active:scale-95',
                        isLiked
                          ? 'border-pink-500/50 bg-linear-to-br from-pink-500/30 to-red-500/30 shadow-lg shadow-pink-500/20'
                          : 'from-primary-500/20 to-primary-600/20 hover:from-primary-500/30 hover:to-primary-600/30 border-primary-500/30 bg-linear-to-br'
                      )}
                    >
                      <div className="from-primary-500/20 absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                      <div className="relative flex items-center justify-center gap-2">
                        <svg
                          className={cn(
                            'h-6 w-6 transition-all',
                            isLiked
                              ? 'scale-110 fill-current text-pink-400'
                              : 'group-hover:scale-110'
                          )}
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
                          {isLiked ? meta.likes + 1 : meta.likes}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-300">
                        {isLiked ? 'You liked this!' : 'Like this article'}
                      </p>
                    </button>

                    <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                      {[
                        { label: 'Views', value: meta.views },
                        { label: 'Read time', value: meta.readTimeLabel },
                        ...(meta.blogDate
                          ? [{ label: 'Published', value: meta.blogDate }]
                          : []),
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-400">{stat.label}</span>
                          <span className="font-semibold text-white">
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Article Content */}
            <article
              className={
                tableOfContents.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'
              }
            >
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
                    {FONT_SIZES.map((fs) => (
                      <button
                        key={fs.id}
                        onClick={() => setFontSize(fs.id)}
                        className={cn(
                          'rounded px-2 py-1 font-medium transition-all',
                          fs.size,
                          fontSize === fs.id
                            ? 'from-primary-500/30 to-primary-600/30 text-primary-300 bg-linear-to-br'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                      >
                        {fs.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <div
                  ref={contentRef}
                  className={cn(
                    'blog-content rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md md:p-10 lg:p-12',
                    FONT_SIZE_CLASSES[fontSize]
                  )}
                  dangerouslySetInnerHTML={{ __html: meta.content }}
                />
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="border-t border-white/10 bg-black/20 py-12 backdrop-blur-sm md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
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

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8 lg:p-10">
              <GiscusComments />

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
                      Comments are powered by GitHub Discussions. You need a
                      GitHub account to participate in the conversation.
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

              <div className="mt-6 border-t border-white/10 pt-6">
                <h4 className="mb-3 text-sm font-semibold text-white">
                  Community Guidelines
                </h4>
                <ul className="space-y-2 text-xs text-gray-400">
                  {COMMUNITY_GUIDELINES.map((guideline) => (
                    <li key={guideline} className="flex items-start gap-2">
                      <span className="text-primary-400 mt-0.5">✓</span>
                      <span>{guideline}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      {relatedBlogs.length > 0 && (
        <div className="border-t border-white/10 bg-black/30 py-12 backdrop-blur-sm md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-8 text-3xl font-bold text-white md:text-4xl">
                Related Articles
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedBlogs.map((relatedBlog) => (
                  <RelatedBlogCard key={relatedBlog.id} blog={relatedBlog} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-3">
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

          {showShareMenu && (
            <div className="absolute right-0 bottom-14 w-48 rounded-xl border border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur-xl">
              <div className="mb-2 text-xs font-semibold text-gray-400">
                Share this article
              </div>
              <div className="space-y-1">
                {SHARE_PLATFORMS.map(({ platform, label, icon }) => (
                  <button
                    key={platform}
                    onClick={() => handleShare(platform)}
                    className="hover:bg-primary-500/10 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition-all hover:text-white"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d={icon} />
                    </svg>
                    {label}
                  </button>
                ))}
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
                      d={COPY_ICON_PATH}
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
