/**
 * @file Roadmap detail client component
 * @module RoadmapDetailClient
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import SafeImg from '@/app/_components/ui/SafeImg';
import { cn, getInitials, driveImageUrl } from '@/app/_lib/utils/utils';
import { incrementRoadmapViewAction } from '@/app/_lib/actions/roadmap-actions';
import {
  useScrollLock,
  useHidePublicHeader,
} from '@/app/_hooks/useUiEffects';
import JoinButton from '@/app/_components/ui/JoinButton';
import ScrollToTop from '@/app/_components/ui/ScrollToTop';
import LessonContentRenderer from '@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer';

// ─── Constants ────────────────────────────────────────────────────────────────

const BG_THEMES = [
  { id: 'dark', bg: '#05060B', label: 'Dark' },
  { id: 'midnight', bg: '#02040d', label: 'Midnight' },
  { id: 'warm', bg: '#0f0c09', label: 'Warm' },
  { id: 'sepia', bg: '#1a1208', label: 'Sepia' },
  { id: 'forest', bg: '#07100c', label: 'Forest' },
  { id: 'slate', bg: '#0a0d14', label: 'Slate' },
];

const CONTENT_WIDTHS = {
  narrow: 'max-w-2xl',
  medium: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-none',
};

const SHARE_PLATFORMS = [
  {
    key: 'twitter',
    label: 'Twitter / X',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: 'M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z',
  },
];

const DIFF_CONFIG = {
  advanced: {
    label: 'Advanced',
    dot: 'bg-violet-400',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/10',
  },
  intermediate: {
    label: 'Intermediate',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/10',
  },
  beginner: {
    label: 'Beginner',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/10',
  },
};

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getReadTimeLabel(content) {
  const words = stripHtml(content).split(' ').filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min`;
}

// ─── TOC Item ─────────────────────────────────────────────────────────────────

function TOCItem({ section, level, isActive, isPast, sectionNum, onClick }) {
  return (
    <button
      data-section-id={section.id}
      onClick={onClick}
      className={cn(
        'group relative flex w-full touch-manipulation items-center justify-between gap-2 rounded-md py-2 pr-2 text-left transition-all duration-150 active:bg-white/5',
        level === 3 ? 'pl-8' : 'pl-4',
        isActive
          ? 'font-semibold text-emerald-400'
          : 'text-zinc-400 hover:text-zinc-200'
      )}
    >
      {isActive && (
        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-emerald-500" />
      )}
      <span className="flex min-w-0 items-center gap-2">
        {level === 2 && sectionNum != null && (
          <span
            className={cn(
              'shrink-0 font-mono text-[10px] font-bold tabular-nums',
              isActive ? 'text-emerald-400/80' : 'text-zinc-600'
            )}
          >
            {String(sectionNum).padStart(2, '0')}
          </span>
        )}
        {level === 3 && (
          <span
            className={cn(
              'mt-0.5 h-1 w-1 shrink-0 rounded-full',
              isActive ? 'bg-emerald-500' : 'bg-zinc-700'
            )}
          />
        )}
        <span className="line-clamp-2 font-sans text-[12px] leading-snug">
          {section.title}
        </span>
      </span>
      <svg
        className={cn(
          'h-3 w-3 shrink-0 transition-transform',
          isActive
            ? 'translate-x-0.5 text-emerald-400'
            : 'hidden text-zinc-600 group-hover:block group-hover:text-zinc-400'
        )}
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
    </button>
  );
}

// ─── Related Roadmap Card ─────────────────────────────────────────────────────

function RelatedRoadmapCard({ roadmap }) {
  const diff = (roadmap.difficulty || 'beginner').toLowerCase();
  const cfg = DIFF_CONFIG[diff] || DIFF_CONFIG.beginner;

  return (
    <Link
      href={`/roadmaps/${roadmap.slug || roadmap.id}`}
      className="group block rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
    >
      <div className="mb-4 font-mono text-[9px] font-bold tracking-wider text-emerald-400 uppercase">
        {roadmap.category || 'Roadmap'}
      </div>
      <h4 className="font-heading line-clamp-2 text-lg font-bold text-white transition-colors group-hover:text-emerald-400">
        {roadmap.title}
      </h4>
      <div className="mt-6 flex items-center gap-4 font-mono text-[9px] tracking-widest uppercase">
        <span className={cn('flex items-center gap-1.5', cfg.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
        {(roadmap.views ?? 0) > 0 && (
          <>
            <span className="h-1 w-1 rounded-full bg-zinc-800" />
            <span className="text-zinc-600">
              {roadmap.views.toLocaleString()} views
            </span>
          </>
        )}
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RoadmapDetailClient({
  roadmap: propRoadmap = {},
  relatedRoadmaps = [],
}) {
  const roadmap = propRoadmap;

  const [activeSection, setActiveSection] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const [showMobileTOC, setShowMobileTOC] = useState(false);
  useScrollLock(showMobileTOC);
  const [copied, setCopied] = useState(false);
  const [tableOfContents, setTableOfContents] = useState([]);
  const [bgTheme, setBgTheme] = useState('dark');
  const [contentWidth, setContentWidth] = useState('full');
  const [focusMode, setFocusMode] = useState(false);
  const [showReadingSettings, setShowReadingSettings] = useState(false);
  // Sticky reading toolbar (back link / category / TOC button) stays out of
  // the way until the reader scrolls past the "Reading Config" bar, at which
  // point it swaps out the site navbar and pins itself to the very top.
  // Scrolling back to the top reverses it — scroll position is the single
  // source of truth, so there's no separate exit control to keep in sync.
  const [scrolledPastAppearance, setScrolledPastAppearance] = useState(false);
  useHidePublicHeader(scrolledPastAppearance);
  const appearanceBarRef = useRef(null);
  const contentRef = useRef(null);
  const tocNavRef = useRef(null);
  const tocInitRef = useRef(false);

  // ── Normalize roadmap ─────────────────────────────────────────────────────
  const meta = useMemo(() => {
    const authorName = roadmap.users?.full_name || 'NEUPC Team';
    const contentSource =
      typeof roadmap.content === 'string'
        ? roadmap.content
        : Array.isArray(roadmap.content)
          ? JSON.stringify(roadmap.content)
          : (roadmap.content?.html ?? roadmap.content?.text ?? '');
    const prerequisites = Array.isArray(roadmap.prerequisites)
      ? roadmap.prerequisites
      : [];
    const thumbnail = roadmap.thumbnail || null;

    return {
      title: roadmap.title || 'Untitled Roadmap',
      description: roadmap.description || '',
      category: roadmap.category || 'General',
      difficulty: (roadmap.difficulty || 'beginner').toLowerCase(),
      estimatedDuration: roadmap.estimated_duration || '',
      authorName,
      authorInitials: getInitials(authorName),
      authorAvatar: roadmap.users?.avatar_url || null,
      date: roadmap.created_at
        ? new Date(roadmap.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '',
      readTimeLabel: contentSource ? getReadTimeLabel(contentSource) : null,
      prerequisites,
      views: roadmap.views ?? 0,
      thumbnail,
      content: contentSource,
      featured: roadmap.is_featured ?? false,
    };
  }, [roadmap]);

  const diffCfg = DIFF_CONFIG[meta.difficulty] || DIFF_CONFIG.beginner;

  // ── View count ────────────────────────────────────────────────────────────
  useEffect(() => {
    setViewCount(meta.views || 0);
    if (!roadmap.id) return;
    const run = async () => {
      try {
        const fd = new FormData();
        fd.set('id', String(roadmap.id));
        const res = await incrementRoadmapViewAction(fd);
        if (res?.views) setViewCount(res.views);
        else setViewCount((p) => p + 1);
      } catch {
        setViewCount((p) => p + 1);
      }
    };
    run();
  }, [roadmap.id, meta.views]);

  // ── TOC extraction and Heading ID injection ────────────────────────────────
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const buildToc = () => {
      // Inject IDs into all h2 and h3 elements that don't have them
      const headings = container.querySelectorAll('h2, h3');
      const seen = {};
      headings.forEach((h) => {
        if (!h.id) {
          const text = h.textContent.trim();
          let slug =
            text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '') || `heading-${h.tagName.toLowerCase()}`;
          if (seen[slug]) slug = `${slug}-${++seen[slug]}`;
          else seen[slug] = 1;
          h.id = slug;
        }
      });

      const headingsWithIds = container.querySelectorAll('h2[id], h3[id]');
      const toc = Array.from(headingsWithIds).map((h) => ({
        id: h.id,
        title: h.textContent,
        level: h.tagName === 'H3' ? 3 : 2,
      }));
      setTableOfContents((prev) => {
        if (
          prev.length === toc.length &&
          prev.every((s, i) => s.id === toc[i].id)
        )
          return prev;
        setActiveSection(toc.length ? toc[0].id : '');
        return toc;
      });
    };

    buildToc();
    // The rendered content can be replaced after mount (hydration swaps the
    // dangerouslySetInnerHTML subtree), which strips the injected heading
    // ids. Rebuild when that happens or TOC clicks / scroll-spy go dead.
    let raf = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(buildToc);
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [meta.content]);

  // ── Scroll tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const total =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
      // Toolbar swap: active once the Reading Config bar has scrolled up
      // past the viewport top. Computed here (not via IntersectionObserver)
      // so a single large scroll jump can't miss a threshold-crossing
      // callback.
      const bar = appearanceBarRef.current;
      if (bar) {
        setScrolledPastAppearance(bar.getBoundingClientRect().bottom < 0);
      }
      if (tableOfContents.length) {
        for (let i = tableOfContents.length - 1; i >= 0; i--) {
          const el = document.getElementById(tableOfContents[i].id);
          const stickyNav = document.querySelector('[data-sticky-nav]');
          const threshold =
            (stickyNav?.getBoundingClientRect().bottom ?? 60) + 24;
          if (el && el.getBoundingClientRect().top <= threshold) {
            setActiveSection(tableOfContents[i].id);
            break;
          }
        }
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [tableOfContents]);

  // ── Auto-scroll TOC to active ─────────────────────────────────────────────
  useEffect(() => {
    if (!tocNavRef.current || !activeSection) return;
    // Skip the very first set (on mount) to avoid jarring scroll on load.
    if (!tocInitRef.current) {
      tocInitRef.current = true;
      return;
    }
    tocNavRef.current
      .querySelector(`[data-section-id="${activeSection}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeSection]);

  // ── Reading preferences: load/save ────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('neupc-reading-prefs');
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.bgTheme) setBgTheme(p.bgTheme);
      if (p.contentWidth) setContentWidth(p.contentWidth);
      if (typeof p.tocCollapsed === 'boolean') setTocCollapsed(p.tocCollapsed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'neupc-reading-prefs',
        JSON.stringify({
          bgTheme,
          contentWidth,
          tocCollapsed,
        })
      );
    } catch {
      /* ignore */
    }
  }, [bgTheme, contentWidth, tocCollapsed]);

  const scrollToSection = useCallback((id) => {
    // Close the overlay first: useScrollLock keeps overflow hidden while it
    // is open, which makes window.scrollTo a no-op.
    setShowMobileTOC(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        const nav = document.querySelector('[data-sticky-nav]');
        const offset = (nav?.getBoundingClientRect().bottom ?? 60) + 16;
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - offset,
          behavior: 'smooth',
        });
      }
    }, 50);
  }, []);

  const handleShare = useCallback(
    (platform) => {
      if (typeof window === 'undefined') return;
      const url = window.location.href;
      const map = {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(meta.title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      };
      if (map[platform])
        window.open(map[platform], '_blank', 'width=600,height=400');
    },
    [meta.title]
  );

  const handleCopy = useCallback(() => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  if (!roadmap?.title) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05060B] text-white">
        <div className="text-center">
          <div className="text-neon-lime mb-6 font-mono text-[10px] tracking-[0.4em] uppercase">
            ERROR_404
          </div>
          <h1 className="font-heading mb-3 text-5xl font-black tracking-tighter text-white uppercase">
            Path Not Found
          </h1>
          <p className="mb-8 font-mono text-sm tracking-wider text-zinc-500">
            This roadmap doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/roadmaps"
            className="bg-neon-lime font-heading inline-flex items-center gap-2 rounded-full px-8 py-3 text-[10px] font-black tracking-widest text-black uppercase shadow-[0_0_30px_-8px_rgba(182,243,107,0.5)] transition-all hover:shadow-[0_0_50px_-4px_rgba(182,243,107,0.7)]"
          >
            ← Back to Roadmaps
          </Link>
        </div>
      </main>
    );
  }

  const hasTOC = tableOfContents.length > 0;
  const currentBg = BG_THEMES.find((t) => t.id === bgTheme)?.bg ?? '#05060B';
  const activeIdx = tableOfContents.findIndex((t) => t.id === activeSection);
  let h2Count = 0;
  const tocItems = tableOfContents.map((s, i) => {
    if (s.level === 2) h2Count++;
    return {
      ...s,
      isPast: i < activeIdx,
      sectionNum: s.level === 2 ? h2Count : null,
    };
  });

  return (
    <main
      className="relative min-h-screen overflow-x-clip text-white transition-colors duration-500"
      style={{ background: currentBg }}
    >
      {/* ── Reading Progress Bar ─────────────────────────────────────────────── */}
      <div className="fixed top-0 right-0 left-0 z-[210] h-0.5 bg-white/5">
        <div
          className="h-full transition-all duration-150"
          style={{
            width: `${scrollProgress}%`,
            background:
              'linear-gradient(to right, #10B981, #10B981cc, #B6F36B)',
            boxShadow: '0 0 8px rgba(16,185,129,0.6)',
          }}
        />
      </div>

      {/* ── Sticky Mini Nav ──────────────────────────────────────────────────── */}
      {/* Hidden on initial load; scrolling past the Reading Config bar
          swaps out the site navbar and pins this bar to the top. Fixed (not
          sticky) so mounting it doesn't shift the page flow — a sticky bar
          would push the Reading Config bar back into view and un-trigger
          the IntersectionObserver, causing a flicker loop at the boundary. */}
      {scrolledPastAppearance && (
        <div
          data-sticky-nav
          className="fixed top-0 right-0 left-0 z-40 border-b border-[#27272A]/50 backdrop-blur-xl transition-colors duration-500"
          style={{ backgroundColor: `${currentBg}cc` }}
        >
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-3 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/roadmaps"
                  className="group font-heading flex items-center gap-1.5 rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-[10px] tracking-widest text-zinc-400 uppercase transition-all hover:border-emerald-500/30 hover:text-emerald-400"
                >
                  <svg
                    className="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  All Roadmaps
                </Link>
                <span className="hidden text-zinc-700 sm:block">/</span>
                {meta.category && (
                  <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[9px] font-bold tracking-widest text-zinc-300 uppercase sm:block">
                    {meta.category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden font-mono text-[10px] tracking-wider text-zinc-600 uppercase tabular-nums md:block">
                  {Math.round(scrollProgress)}%
                  {meta.readTimeLabel ? ` · ${meta.readTimeLabel}` : ''}
                </span>
                {hasTOC && (
                  <button
                    onClick={() => setShowMobileTOC(!showMobileTOC)}
                    aria-label="Open learning path"
                    aria-expanded={showMobileTOC}
                    className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg border border-[#3F3F46] bg-white/5 text-zinc-400 transition-all hover:border-emerald-500/30 hover:text-emerald-400 active:bg-white/10 xl:hidden"
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
                        d="M4 6h16M4 12h16M4 18h7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile TOC Overlay ────────────────────────────────────────────────── */}
      {showMobileTOC && hasTOC && (
        <div className="fixed inset-0 z-[210] xl:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMobileTOC(false)}
          />
          <div className="absolute top-16 right-4 left-4 flex max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[#27272A] px-5 py-4">
              <h3 className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                Learning Path
              </h3>
              <button
                onClick={() => setShowMobileTOC(false)}
                aria-label="Close learning path"
                className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-white active:bg-white/10"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav
              className="flex-1 overflow-y-auto overscroll-contain px-3 py-3"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {tocItems.map((s) => (
                <TOCItem
                  key={s.id}
                  section={s}
                  level={s.level}
                  isActive={activeSection === s.id}
                  isPast={s.isPast}
                  sectionNum={s.sectionNum}
                  onClick={() => scrollToSection(s.id)}
                />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-16 lg:pt-40 lg:pb-20">
        {/* Background cover image */}
        {meta.thumbnail && (
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={driveImageUrl(meta.thumbnail)}
              alt=""
              aria-hidden
              className="h-full w-full object-cover opacity-10 grayscale"
            />
            <div className="absolute inset-0 bg-linear-to-b from-[#05060B]/70 via-[#05060B]/40 to-[#05060B]" />
          </div>
        )}

        {/* Ambient glows — same as event/blog pages */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="grid-overlay absolute inset-0 opacity-15" />
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[140px]" />
          <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#8b5cf6]/5 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[96rem] px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Back link */}
          <nav className="mb-6 sm:mb-8">
            <Link
              href="/roadmaps"
              className="group font-heading inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:text-emerald-400 sm:text-[11px]"
            >
              <svg
                className="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              All Roadmaps
            </Link>
          </nav>

          {/* Category + featured eyebrow */}
          <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-5">
            <span
              className={cn(
                'inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[9px] font-bold tracking-widest uppercase sm:text-[10px]',
                meta.featured
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/10 bg-white/5 text-zinc-300'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  meta.featured ? 'bg-emerald-400' : 'bg-zinc-400'
                )}
              />
              {meta.featured ? 'Featured' : meta.category}
            </span>
            <span
              className={cn(
                'inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[9px] font-bold tracking-widest uppercase sm:text-[10px]',
                diffCfg.bg,
                diffCfg.border,
                diffCfg.text
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', diffCfg.dot)} />
              {diffCfg.label}
            </span>
            {meta.estimatedDuration && (
              <span className="inline-flex min-h-[28px] items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[9px] tracking-widest text-zinc-400 uppercase sm:text-[10px]">
                ⏱ {meta.estimatedDuration}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-heading max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl lg:leading-[1.15]">
            {meta.title}
          </h1>

          {/* Author + meta chips — identical pattern to blog/event pages */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-white/8 pt-6 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3 sm:pt-8">
            <div className="col-span-2 flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 backdrop-blur-sm sm:col-span-1 sm:px-4">
              <div className="h-8 w-8 shrink-0 rounded-full border border-white/10 p-0.5">
                {meta.authorAvatar ? (
                  <SafeImg
                    src={driveImageUrl(meta.authorAvatar)}
                    alt={meta.authorName}
                    className="h-full w-full rounded-full object-cover"
                    fallback=""
                  />
                ) : (
                  <div className="font-heading flex h-full w-full items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-zinc-300">
                    {meta.authorInitials}
                  </div>
                )}
              </div>
              <div>
                <span className="block font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase sm:text-[10px]">
                  Curator
                </span>
                <span className="font-heading mt-0.5 block text-[13px] font-bold text-white sm:text-sm">
                  {meta.authorName}
                </span>
              </div>
            </div>
            {meta.date && (
              <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 backdrop-blur-sm sm:px-4">
                <span className="block font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase sm:text-[10px]">
                  Published
                </span>
                <span className="font-heading mt-0.5 block text-[13px] font-bold text-white sm:text-sm">
                  {meta.date}
                </span>
              </div>
            )}
            {meta.readTimeLabel && (
              <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 backdrop-blur-sm sm:px-4">
                <span className="block font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase sm:text-[10px]">
                  Read Time
                </span>
                <span className="font-heading mt-0.5 block text-[13px] font-bold text-white sm:text-sm">
                  {meta.readTimeLabel}
                </span>
              </div>
            )}
            {viewCount > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 backdrop-blur-sm sm:px-4">
                <span className="block font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase sm:text-[10px]">
                  Views
                </span>
                <span className="font-heading mt-0.5 block text-[13px] font-bold text-white sm:text-sm">
                  {viewCount.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {meta.description && (
            <p className="mt-6 max-w-3xl text-sm leading-[1.9] text-zinc-400 sm:mt-8 sm:text-base lg:text-[17px]">
              {meta.description}
            </p>
          )}
        </div>
      </section>

      {/* ── Section separator ─────────────────────────────────────────────────── */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-white/8 to-transparent" />

      {/* ── Main Reading Layout ───────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[96rem] px-4 py-10 sm:px-6 lg:px-8 xl:px-12">
        <div
          className={cn(
            'flex transition-[gap] duration-300',
            !hasTOC && 'justify-center',
            hasTOC && (tocCollapsed ? 'gap-4 xl:gap-6' : 'gap-8 xl:gap-12')
          )}
        >
          {/* ── Left sidebar: TOC ─────────────────────────────────────────────── */}
          {hasTOC && (
            <aside
              className={cn(
                'hidden shrink-0 transition-[width] duration-300 ease-out xl:block',
                tocCollapsed ? 'xl:w-12' : 'xl:w-80'
              )}
            >
              <div
                className={cn(
                  'sticky top-[calc(var(--header-h,69px)+5rem)] space-y-6 transition-opacity duration-300',
                  focusMode && !tocCollapsed && 'opacity-25 hover:opacity-100'
                )}
              >
                {/* TOC Glass Panel */}
                {tocCollapsed ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 px-2 py-4">
                    <button
                      onClick={() => setTocCollapsed(false)}
                      title="Expand contents"
                      aria-label="Expand table of contents"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-all hover:bg-emerald-500/10 hover:text-emerald-400"
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
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                    </button>
                    <div className="h-px w-6 bg-white/10" />
                    <div
                      className="relative h-32 w-1 overflow-hidden rounded-full bg-white/8"
                      title={`${Math.round(scrollProgress)}% read`}
                    >
                      <div
                        className="absolute top-0 left-0 w-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ height: `${scrollProgress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-zinc-500 tabular-nums">
                      {Math.round(scrollProgress)}%
                    </span>
                    <div className="h-px w-6 bg-white/10" />
                    <span
                      className="font-mono text-[9px] font-bold tracking-widest text-emerald-400/80 tabular-nums"
                      title={`Section ${activeIdx >= 0 ? activeIdx + 1 : 0} of ${tableOfContents.length}`}
                    >
                      {String(activeIdx >= 0 ? activeIdx + 1 : 0).padStart(
                        2,
                        '0'
                      )}
                      <span className="text-zinc-700">/</span>
                      {String(tableOfContents.length).padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <div
                    className="overflow-hidden rounded-2xl border border-white/10"
                    style={{
                      background: 'rgba(20, 20, 22, 0.45)',
                      backdropFilter: 'blur(24px)',
                      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-[#27272A]/50 px-6 py-4">
                      <h3 className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                        Learning Path
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 tabular-nums">
                          {tocItems.filter((s) => s.level === 2).length}
                        </span>
                        <button
                          onClick={() => setTocCollapsed(true)}
                          title="Collapse"
                          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-all hover:bg-white/8 hover:text-white"
                        >
                          <svg
                            className="h-3.5 w-3.5"
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
                        </button>
                      </div>
                    </div>

                    <nav
                      ref={tocNavRef}
                      className="max-h-[calc(100dvh-280px)] space-y-1 overflow-y-auto px-4 py-4"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.1) transparent',
                      }}
                    >
                      {tocItems.map((s) => (
                        <TOCItem
                          key={s.id}
                          section={s}
                          level={s.level}
                          isActive={activeSection === s.id}
                          isPast={s.isPast}
                          sectionNum={s.sectionNum}
                          onClick={() => scrollToSection(s.id)}
                        />
                      ))}
                    </nav>

                    <div className="border-t border-[#27272A]/50 px-6 py-4">
                      <div className="mb-2 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>
                          {activeIdx >= 0 ? activeIdx + 1 : 0} /{' '}
                          {tableOfContents.length} sections
                        </span>
                        <span className="font-bold text-emerald-400 tabular-nums">
                          {Math.round(scrollProgress)}%
                        </span>
                      </div>
                      <div className="h-0.5 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${scrollProgress}%` }}
                        />
                      </div>

                      {/* Share Roadmap */}
                      <div className="mt-6 space-y-3">
                        <h4 className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                          Share Roadmap
                        </h4>
                        <div className="flex gap-3">
                          {SHARE_PLATFORMS.map((p) => (
                            <button
                              key={p.key}
                              title={`Share on ${p.label}`}
                              aria-label={`Share on ${p.label}`}
                              onClick={() => handleShare(p.key)}
                              className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/3 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5"
                            >
                              <svg
                                className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-emerald-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d={p.icon} />
                              </svg>
                            </button>
                          ))}
                          <button
                            title="Copy link"
                            aria-label="Copy link"
                            onClick={handleCopy}
                            className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/3 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5"
                          >
                            <svg
                              className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-emerald-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.75}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Roadmaps — hidden when sidebar collapsed */}
                {!tocCollapsed && relatedRoadmaps.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h3 className="px-2 font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                      Related Roadmaps
                    </h3>
                    <div className="space-y-3">
                      {relatedRoadmaps.map((rm) => (
                        <RelatedRoadmapCard key={rm.id} roadmap={rm} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* ── Article ───────────────────────────────────────────────────────── */}
          <article className="w-full min-w-0 flex-1 transition-all duration-300">
            {/* Reading controls */}
            <div ref={appearanceBarRef} className="mb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 backdrop-blur-sm">
                <span className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                  <svg
                    className="h-4 w-4 text-emerald-400"
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
                  <span className="hidden sm:inline">Reading Config</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReadingSettings((p) => !p)}
                    aria-expanded={showReadingSettings}
                    className={cn(
                      'flex touch-manipulation items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all',
                      showReadingSettings
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-[#3F3F46] bg-white/5 text-zinc-500 hover:text-zinc-300 active:bg-white/10'
                    )}
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Customize</span>
                  </button>
                </div>
              </div>

              {showReadingSettings && (
                <div className="rounded-xl border border-white/5 bg-[#141416]/90 p-5 shadow-2xl backdrop-blur-md">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-[10px] font-semibold tracking-[0.15em] text-zinc-500 uppercase">
                        Theme & Layout
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {BG_THEMES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setBgTheme(t.id)}
                            title={t.label}
                            aria-label={`Background theme ${t.label}`}
                            className={cn(
                              'h-8 w-8 touch-manipulation rounded-lg transition-all',
                              bgTheme === t.id
                                ? 'scale-110 ring-2 ring-emerald-500 ring-offset-1 ring-offset-[#131315]'
                                : 'ring-1 ring-white/15 hover:ring-white/30'
                            )}
                            style={{ background: t.bg }}
                          />
                        ))}
                      </div>
                      <div>
                        <p className="mb-1.5 text-[10px] text-zinc-600">
                          Content width
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {Object.keys(CONTENT_WIDTHS).map((id) => (
                            <button
                              key={id}
                              onClick={() => setContentWidth(id)}
                              className={cn(
                                'touch-manipulation rounded-lg border py-1.5 text-xs capitalize transition-all',
                                contentWidth === id
                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                  : 'border-[#27272A] bg-white/3 text-zinc-500 hover:text-zinc-300 active:bg-white/5'
                              )}
                            >
                              {id}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setFocusMode((p) => !p)}
                        aria-pressed={focusMode}
                        className={cn(
                          'flex w-full touch-manipulation items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all',
                          focusMode
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                            : 'border-[#27272A] bg-white/3 text-zinc-500 hover:text-zinc-300 active:bg-white/5'
                        )}
                      >
                        <span>Focus mode</span>
                        <div
                          className={cn(
                            'relative flex h-4 w-7 items-center rounded-full border transition-all',
                            focusMode
                              ? 'border-emerald-500/50 bg-emerald-500/20'
                              : 'border-white/15 bg-white/5'
                          )}
                        >
                          <div
                            className={cn(
                              'absolute h-3 w-3 rounded-full transition-all duration-200',
                              focusMode
                                ? 'left-3.5 bg-emerald-400'
                                : 'left-0.5 bg-gray-600'
                            )}
                          />
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                    <p className="text-[10px] text-zinc-600">
                      Settings saved in your browser
                    </p>
                    <button
                      onClick={() => {
                        setBgTheme('dark');
                        setContentWidth('full');
                        setFocusMode(false);
                        setTocCollapsed(false);
                      }}
                      className="touch-manipulation rounded-lg border border-[#3F3F46] bg-white/4 px-3 py-1.5 text-[11px] text-gray-500 transition-all hover:border-white/20 hover:text-gray-300 active:bg-white/10"
                    >
                      Reset defaults
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Prerequisites */}
            {meta.prerequisites.length > 0 && (
              <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5 sm:p-6 md:p-8">
                <h2 className="font-heading mb-4 flex items-center gap-2.5 text-lg font-bold text-white">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 text-sm">
                    📋
                  </span>
                  Prerequisites
                </h2>
                <ul className="space-y-2.5">
                  {meta.prerequisites.map((prereq, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-zinc-300"
                    >
                      <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-[10px] font-semibold text-zinc-400">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Content */}
            {meta.content ? (
              // Rendered with the exact same wrapper-free strategy as the
              // bootcamp lesson page: LessonContentRenderer supplies its own
              // scopes (.tiptap-viewer-content / .lesson-viewer).
              <div
                ref={contentRef}
                className={cn(
                  'mx-auto rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 sm:p-6 md:p-8 lg:p-10',
                  CONTENT_WIDTHS[contentWidth],
                  focusMode && 'shadow-[0_0_0_100vw_rgba(0,0,0,0.5)]'
                )}
              >
                <LessonContentRenderer
                  content={meta.content}
                  viewerMode={true}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
                <div className="mb-4 text-5xl">📭</div>
                <p className="font-mono text-sm tracking-wider text-zinc-500">
                  No learning content available yet. Check back soon!
                </p>
              </div>
            )}

            {/* Article footer: share */}
            <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/6 pb-5">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-mono text-sm text-zinc-500">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span className="tabular-nums">
                      {viewCount.toLocaleString()}
                    </span>{' '}
                    views
                  </span>
                  {meta.readTimeLabel && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="font-mono text-sm text-zinc-500">
                        ⏱ {meta.readTimeLabel} read
                      </span>
                    </>
                  )}
                </div>
                <span
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] uppercase',
                    diffCfg.bg,
                    diffCfg.border,
                    diffCfg.text
                  )}
                >
                  <span
                    className={cn('h-1.5 w-1.5 rounded-full', diffCfg.dot)}
                  />
                  {diffCfg.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  Share:
                </span>
                {SHARE_PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handleShare(p.key)}
                    title={`Share on ${p.label}`}
                    aria-label={`Share on ${p.label}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d={p.icon} />
                    </svg>
                  </button>
                ))}
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-full border px-3.5 font-mono text-[10px] font-bold tracking-wider uppercase transition-all',
                    copied
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/10 bg-white/5 text-zinc-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400'
                  )}
                >
                  {copied ? (
                    <>
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-3.5 w-3.5"
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
                      Copy link
                    </>
                  )}
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* ── Related Roadmaps (mobile / no TOC fallback) ───────────────────────── */}
      {relatedRoadmaps.length > 0 && (
        <section
          className={cn(
            'relative overflow-hidden py-12 sm:py-16 lg:py-20',
            hasTOC && 'xl:hidden'
          )}
        >
          <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/8 to-transparent" />
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/[0.02] blur-[150px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-6 shrink-0 bg-emerald-400" />
                  <span className="font-heading text-[10px] font-bold tracking-wider text-emerald-400 uppercase sm:text-[11px]">
                    Continue Learning
                  </span>
                </div>
                <h2 className="font-heading mt-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                  Related Roadmaps
                </h2>
              </div>
              <Link
                href="/roadmaps"
                className="font-heading w-fit shrink-0 rounded-full border border-white/10 bg-white/4 px-5 py-2.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase transition-colors hover:border-emerald-500/30 hover:text-emerald-400 sm:px-7 sm:py-3 sm:text-[11px]"
              >
                All Roadmaps →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedRoadmaps.map((rm) => (
                <RelatedRoadmapCard key={rm.id} roadmap={rm} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA — matches event and blog page pattern exactly ─────────────────── */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="grid-overlay absolute inset-0 opacity-15" />
          <div className="absolute top-1/2 left-1/2 h-[400px] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.02] blur-[130px]" />
        </div>
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/8 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/5 bg-linear-to-br from-white/[0.02] via-transparent to-white/[0.01] p-6 sm:rounded-3xl sm:p-10 lg:p-14">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3 md:items-center">
              <div className="md:col-span-2">
                <p className="font-heading mb-2 text-[10px] font-bold tracking-wider text-emerald-400 uppercase sm:text-[11px]">
                  Start Your Journey
                </p>
                <h2 className="font-heading text-2xl leading-tight font-bold text-white sm:text-3xl lg:text-4xl">
                  Ready to follow this roadmap?
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400 sm:mt-4">
                  Join NEUPC to access resources, connect with mentors, and
                  track your learning progress alongside a thriving community of
                  programmers.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:flex-col md:items-end">
                <JoinButton
                  href="/join"
                  className="group font-heading inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-xs font-semibold text-black transition-all hover:bg-emerald-400 sm:min-h-0 sm:px-8 sm:py-3.5"
                >
                  Join the Club
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </JoinButton>
                <Link
                  href="/roadmaps"
                  className="text-center font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase underline-offset-4 transition-colors hover:text-zinc-200 hover:underline sm:text-[11px]"
                >
                  Browse Roadmaps →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ScrollToTop />
    </main>
  );
}
