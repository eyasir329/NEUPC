/**
 * @file Shared SEO constants, helpers, and metadata generators.
 * Centralises site-wide SEO configuration so every page produces
 * consistent, search-engine-friendly metadata.
 *
 * @module seo
 */

// ── Constants ───────────────────────────────────────────────────────────────

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://neupc.vercel.app';

export const SITE_NAME = 'NEUPC';
export const SITE_TITLE = 'Netrokona University Programming Club';
export const SITE_DESCRIPTION =
  'Building a strong programming community at Netrokona University through competitive programming, workshops, mentorship, and ICPC preparation.';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image.png`;

/** Global keywords shared across all pages */
export const BASE_KEYWORDS = [
  'NEUPC',
  'Netrokona University',
  'Programming Club',
  'Competitive Programming',
  'ICPC',
  'CSE',
  'Coding',
  'Bangladesh',
  'Netrokona',
  'Computer Science',
  'Algorithm',
  'Data Structure',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a canonical URL from a pathname.
 * @param {string} [pathname='/'] — e.g. '/about', '/events/my-event'
 * @returns {string}
 */
export function canonicalUrl(pathname = '/') {
  return `${SITE_URL}${pathname}`;
}

/**
 * Generate a complete metadata object for a static page.
 * Merges page-specific fields with consistent defaults for OG, Twitter,
 * canonical URL, and keywords.
 *
 * @param {Object} options
 * @param {string} options.title        — Page title (used in template)
 * @param {string} options.description  — Meta description (≤160 chars ideal)
 * @param {string} options.pathname     — URL path, e.g. '/about'
 * @param {string[]} [options.keywords] — Extra keywords to append to base set
 * @param {string} [options.ogType]     — OG type, defaults to 'website'
 * @param {string} [options.ogImage]    — Custom OG image URL
 * @returns {import('next').Metadata}
 */
export function buildMetadata({
  title,
  description,
  pathname,
  keywords = [],
  ogType = 'website',
  ogImage,
}) {
  const url = canonicalUrl(pathname);
  const image = ogImage || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    keywords: [...BASE_KEYWORDS, ...keywords],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} - ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType,
      locale: 'en_US',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} - ${SITE_TITLE}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ${SITE_NAME}`,
      description,
      images: [image],
    },
  };
}

/**
 * Generate metadata for a dynamic article page (blog post).
 * @param {Object} article — Blog post data
 * @param {string} pathname — e.g. '/blogs/my-post'
 * @returns {import('next').Metadata}
 */
export function buildArticleMetadata(article, pathname) {
  const url = canonicalUrl(pathname);
  const image = article.cover_image || article.thumbnail || DEFAULT_OG_IMAGE;
  const description = article.excerpt || article.title;

  return {
    title: `${article.title} | ${SITE_NAME} Blog`,
    description,
    keywords: [
      ...BASE_KEYWORDS,
      'blog',
      'tutorial',
      ...(article.tags || []),
      article.category,
    ].filter(Boolean),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      locale: 'en_US',
      publishedTime: article.published_at || article.created_at,
      modifiedTime: article.updated_at || article.published_at,
      authors: article.author_name ? [article.author_name] : [SITE_NAME],
      tags: article.tags || [],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [image],
    },
  };
}

/**
 * Generate metadata for a dynamic event page.
 * @param {Object} event — Event data
 * @param {string} pathname — e.g. '/events/my-event'
 * @returns {import('next').Metadata}
 */
export function buildEventMetadata(event, pathname) {
  const url = canonicalUrl(pathname);
  const image =
    event.image_url || event.cover_image || event.thumbnail || DEFAULT_OG_IMAGE;
  const description =
    event.short_description || event.description?.slice(0, 160) || event.title;

  return {
    title: `${event.title} - ${SITE_NAME} Events`,
    description,
    keywords: [
      ...BASE_KEYWORDS,
      'event',
      event.category,
      event.venue_type,
    ].filter(Boolean),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: event.title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      locale: 'en_US',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [image],
    },
  };
}

/**
 * Generate metadata for a dynamic roadmap page.
 * @param {Object} roadmap — Roadmap data
 * @param {string} pathname — e.g. '/roadmaps/web-dev'
 * @returns {import('next').Metadata}
 */
export function buildRoadmapMetadata(roadmap, pathname) {
  const url = canonicalUrl(pathname);
  const description =
    roadmap.description || `${roadmap.title} learning roadmap by ${SITE_NAME}`;

  return {
    title: `${roadmap.title} - Learning Roadmap`,
    description,
    keywords: [
      ...BASE_KEYWORDS,
      'roadmap',
      'learning path',
      'tutorial',
      'guide',
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${roadmap.title} - ${SITE_NAME} Roadmap`,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      locale: 'en_US',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${roadmap.title} Roadmap`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${roadmap.title} - ${SITE_NAME} Roadmap`,
      description,
    },
  };
}
