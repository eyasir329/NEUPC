'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { cn } from '../_lib/utils';

const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});

// Motion variants — synced with homepage
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};
const cardReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};
const viewport = { once: true, margin: '-40px 0px' };

function SectionEyebrow({ tag, title, accent, description }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      className="mb-16 space-y-6 text-center sm:mb-20"
    >
      <span className="text-neon-emerald font-mono text-[10px] font-bold tracking-[0.5em] uppercase">
        {tag}
      </span>
      <h2 className="kinetic-headline font-heading text-5xl font-black tracking-tighter text-white uppercase sm:text-6xl md:text-7xl">
        {title}
        {accent && (
          <>
            {' '}
            <span className="text-neon-violet italic">{accent}</span>
          </>
        )}
      </h2>
      {description && (
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CATEGORIES = [
  { name: 'All', icon: '🏆' },
  { name: 'ICPC', icon: '🌏' },
  { name: 'IUPC', icon: '🏁' },
  { name: 'Contest', icon: '⚔️' },
  { name: 'Hackathon', icon: '💻' },
  { name: 'Individual', icon: '⭐' },
];

const DEFAULT_TIMELINE = [
  { year: '2019', event: 'Club Founded', icon: '🎯' },
  { year: '2021', event: 'First Intra Contest', icon: '🏁' },
  { year: '2023', event: 'First ICPC Participation', icon: '🌏' },
  { year: '2025', event: 'National Level Recognition', icon: '🏆' },
  { year: '2026', event: 'Regional Champions', icon: '👑' },
];

const ACHIEVEMENT_PAGE_SIZE = 9;
const PARTICIPATION_PAGE_SIZE = 9;

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '…', total];
  if (current >= total - 2)
    return [1, '…', total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns badge + emoji classes for a result string */
function getResultStyle(result) {
  if (!result) return null;
  const r = result.toLowerCase();
  if (/1st|first|champion|winner|gold|rank.?1\b|#1\b/.test(r))
    return {
      badge: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
      emoji: '🥇',
    };
  if (/2nd|second|silver|rank.?2\b|#2\b/.test(r))
    return {
      badge: 'border-slate-400/40 bg-slate-400/10 text-slate-300',
      emoji: '🥈',
    };
  if (/3rd|third|bronze|rank.?3\b|#3\b/.test(r))
    return {
      badge: 'border-orange-500/40 bg-orange-500/15 text-orange-300',
      emoji: '🥉',
    };
  if (/finalist|final|top.?\d|semi/.test(r))
    return {
      badge: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
      emoji: '🏅',
    };
  if (/qualified|qualify|selected/.test(r))
    return {
      badge: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
      emoji: '✅',
    };
  if (/participant|participated/.test(r))
    return { badge: 'border-white/10 bg-white/5 text-white/50', emoji: '📋' };
  return {
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    emoji: '🏅',
  };
}

/** Classify a result string into a higher-level tier (for filter use) */
function getResultTier(result) {
  if (!result) return 'Participant';
  const r = result.toLowerCase();
  if (
    /1st|first|champion|winner|gold|rank.?1\b|#1\b|2nd|second|silver|rank.?2\b|#2\b|3rd|third|bronze|rank.?3\b|#3\b/.test(
      r
    )
  )
    return 'Medalist';
  if (/finalist|final|top.?\d|semi/.test(r)) return 'Finalist';
  if (/qualified|qualify|selected/.test(r)) return 'Qualified';
  return 'Participant';
}

/** Render result text with `*` as superscript */
function ResultText({ text }) {
  return text.split('*').map((part, i, arr) =>
    i < arr.length - 1 ? (
      <span key={i}>
        {part}
        <sup>*</sup>
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const PARTICIPATION_CATEGORY_COLORS = {
  'Competitive Programming': 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  Hackathon: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  ICPC: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  IUPC: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  NCPC: 'border-lime-500/30 bg-lime-500/10 text-lime-300',
  'Web Development': 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  'AI / ML': 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  Research: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  Internship: 'border-green-500/30 bg-green-500/10 text-green-300',
  'Academic Award': 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  'Club Milestone': 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  Community: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Certification: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
};

const PARTICIPATION_CATEGORY_EMOJI = {
  'Competitive Programming': '💻',
  Hackathon: '⚡',
  ICPC: '🏆',
  IUPC: '🥇',
  NCPC: '🌍',
  'Web Development': '🌐',
  'AI / ML': '🤖',
  Research: '🔬',
  Internship: '💼',
  'Academic Award': '🎓',
  'Club Milestone': '🏛',
  Community: '🤝',
  Certification: '📜',
};

// ---------------------------------------------------------------------------
// Hero — synced with Events page pattern
// ---------------------------------------------------------------------------
// (Hero is rendered inline in the main component below)

// ---------------------------------------------------------------------------
// Reusable Pagination Controls
// ---------------------------------------------------------------------------

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col items-center gap-3 pt-6 sm:flex-row sm:justify-between">
      <p className="text-xs text-slate-500">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {/* First / Prev — hidden on xs to save space */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="hidden rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 sm:inline-flex"
          title="First page"
        >
          ««
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          ‹ Prev
        </button>
        {getPageNumbers(currentPage, totalPages).map((p, i) =>
          p === '…' ? (
            <span
              key={`e${i}`}
              className="hidden px-1.5 text-xs text-slate-600 sm:inline"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-8 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                p === currentPage
                  ? 'bg-neon-violet text-white shadow-sm'
                  : 'hidden border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white sm:inline-flex',
                // always show current ±1 on mobile
                Math.abs(p - currentPage) <= 1 ? 'inline-flex!' : ''
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          Next ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="hidden rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 sm:inline-flex"
          title="Last page"
        >
          »»
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Featured Achievements Carousel
// ---------------------------------------------------------------------------

function FeaturedAchievementsCarousel({ items }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  useEffect(() => {
    if (total <= 1 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 5500);
    return () => clearInterval(t);
  }, [total, paused]);

  const achievement = items[idx];
  const _rs = getResultStyle(achievement.result);
  const _participants = Array.isArray(achievement.participants)
    ? achievement.participants
    : [];
  const cats = achievement.category
    ? achievement.category
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className="group relative mb-10 overflow-hidden rounded-3xl border border-white/15 bg-white/4 shadow-2xl shadow-black/30 backdrop-blur-sm transition-all duration-500 hover:border-white/30"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -top-28 -right-28 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-cyan-500/8 blur-3xl" />

      <div className="relative h-96 overflow-hidden sm:h-112 md:h-128">
        <Image
          src={achievement.featured_photo?.url ?? '/placeholder-event.png'}
          alt={achievement.title}
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.06]"
          sizes="100vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/48 via-black/12 to-black/3" />
        <div className="absolute inset-0 bg-linear-to-r from-black/10 via-transparent to-black/8" />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/6 px-3 py-1 text-[11px] font-bold text-amber-200 shadow-lg shadow-black/25 backdrop-blur-2xl">
            ⭐ Featured
          </span>
          {achievement.year && (
            <span className="rounded-lg border border-white/22 bg-white/5 px-2.5 py-1 text-xs font-bold text-white shadow-md shadow-black/25 backdrop-blur-2xl">
              {achievement.year}
            </span>
          )}
        </div>

        {total > 1 && (
          <span className="absolute top-4 right-4 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white tabular-nums shadow-md shadow-black/25 backdrop-blur-2xl">
            {idx + 1} / {total}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3">
          <div className="relative max-w-full overflow-hidden rounded-xl border border-white/16 bg-white/2 px-3 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.15)] backdrop-blur-lg sm:px-4 sm:py-2.5">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/4 via-white/1 to-transparent" />
            <div className="relative z-10 flex flex-col gap-1.5">
              {cats.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cats.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full border border-white/20 bg-white/3 px-2 py-0.5 text-[9px] font-semibold text-white drop-shadow-sm"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm leading-tight font-bold text-white drop-shadow-md sm:text-base">
                  {achievement.title}
                </h3>
                {achievement.contest_name && (
                  <span className="text-xs text-white/85 drop-shadow-sm">
                    {achievement.contest_url ? (
                      <a
                        href={achievement.contest_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-1 hover:text-white"
                      >
                        {achievement.contest_name}
                      </a>
                    ) : (
                      achievement.contest_name
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div className="absolute right-5 bottom-4 flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === idx
                      ? 'w-5 bg-white'
                      : 'w-1.5 bg-white/35 hover:bg-white/60'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Achievement Detail Modal
// ---------------------------------------------------------------------------

function AchievementDetailModal({ achievement, onClose }) {
  const rs = getResultStyle(achievement.result);
  const categories = achievement.category
    ? achievement.category
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const participants = Array.isArray(achievement.participants)
    ? achievement.participants
    : [];
  const galleryImages = achievement.gallery_images ?? [];
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (activePhoto) setActivePhoto(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [onClose, activePhoto]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-2xl" />

      {/* Sheet */}
      <div
        className="animate-slide-up relative z-10 max-h-[96vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-950 shadow-[0_-8px_80px_rgba(0,0,0,0.8)] sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cover image ── */}
        <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-t-3xl sm:h-72">
          <Image
            src={achievement.featured_photo?.url ?? '/placeholder-event.png'}
            alt={achievement.title}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/80"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>

          {/* Top-left badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {achievement.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-sm">
                ⭐ Featured
              </span>
            )}
            {achievement.year && (
              <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                {achievement.year}
              </span>
            )}
          </div>

          {/* Bottom content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            {categories.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
            <h2 className="text-xl leading-snug font-bold text-white sm:text-2xl">
              {achievement.title}
            </h2>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 pt-5 pb-10 sm:px-6">
          {/* Result + date row */}
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            {rs && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                  rs.badge
                )}
              >
                {rs.emoji} <ResultText text={achievement.result} />
              </span>
            )}
            {achievement.achievement_date && (
              <span className="text-xs text-gray-400">
                📅{' '}
                {new Date(achievement.achievement_date).toLocaleDateString(
                  'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </span>
            )}
          </div>

          {/* Contest */}
          {achievement.contest_name && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-white/6 bg-white/3 px-4 py-3">
              <span className="mt-0.5 text-base">🏟</span>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                  Contest
                </p>
                <p className="text-sm font-semibold text-gray-200">
                  {achievement.contest_url ? (
                    <a
                      href={achievement.contest_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 transition-colors hover:text-blue-300"
                    >
                      {achievement.contest_name}{' '}
                      <span className="text-blue-400 no-underline">↗</span>
                    </a>
                  ) : (
                    achievement.contest_name
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {achievement.description && (
            <p className="mb-5 text-sm leading-relaxed text-gray-400">
              {achievement.description}
            </p>
          )}

          {/* Participants / Team */}
          {(participants.length > 0 || achievement.team_name) && (
            <div className="mb-5">
              <p className="mb-2.5 text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                {achievement.is_team ? '👥 Team' : '👤 Participants'}
              </p>
              {achievement.team_name && (
                <p className="mb-2 text-sm font-semibold text-sky-300">
                  {achievement.team_name}
                </p>
              )}
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {participants.map((p, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Platform / Profile */}
          {(achievement.platform || achievement.profile_url) && (
            <div className="mb-5 flex flex-wrap items-center gap-4">
              {achievement.platform && (
                <span className="text-xs font-medium text-gray-400">
                  🖥 {achievement.platform}
                </span>
              )}
              {achievement.profile_url && (
                <a
                  href={achievement.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
                >
                  View Profile ↗
                </a>
              )}
            </div>
          )}

          {/* Gallery grid */}
          {galleryImages.length > 0 && (
            <div>
              <p className="mb-3 text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                🖼 Gallery ({galleryImages.length})
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {galleryImages.map((img, i) => (
                  <button
                    key={img.id ?? i}
                    onClick={() => setActivePhoto(img)}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 transition-all duration-300 hover:scale-[1.04] hover:border-white/30"
                  >
                    <Image
                      src={img.url}
                      alt={img.name ?? `Photo ${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="120px"
                      unoptimized
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                      <svg
                        className="h-6 w-6 text-white drop-shadow"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Gallery lightbox (nested above the sheet) ── */}
      {activePhoto && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setActivePhoto(null)}
        >
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = galleryImages.findIndex(
                    (p) => p.id === activePhoto.id
                  );
                  setActivePhoto(
                    galleryImages[
                      (idx - 1 + galleryImages.length) % galleryImages.length
                    ]
                  );
                }}
                className="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = galleryImages.findIndex(
                    (p) => p.id === activePhoto.id
                  );
                  setActivePhoto(
                    galleryImages[(idx + 1) % galleryImages.length]
                  );
                }}
                className="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </>
          )}
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activePhoto.url}
              alt={activePhoto.name ?? 'Gallery photo'}
              width={1200}
              height={900}
              className="max-h-[85vh] max-w-[90vw] object-contain"
              unoptimized
            />
          </div>
          {galleryImages.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/60 tabular-nums backdrop-blur-sm">
              {galleryImages.findIndex((p) => p.id === activePhoto.id) + 1} /{' '}
              {galleryImages.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Participation Detail Modal
// ---------------------------------------------------------------------------

function ParticipationDetailModal({ record, onClose }) {
  const rs = getResultStyle(record.result);
  const catColor =
    PARTICIPATION_CATEGORY_COLORS[record.category] ??
    'border-slate-500/30 bg-slate-500/10 text-slate-300';
  const catEmoji = PARTICIPATION_CATEGORY_EMOJI[record.category] ?? '🎯';
  const members = record.team_members ?? [];
  const photos = record.photos ?? [];
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (activePhoto) setActivePhoto(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [onClose, activePhoto]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-2xl" />

      {/* Sheet */}
      <div
        className="animate-slide-up relative z-10 max-h-[96vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-950 shadow-[0_-8px_80px_rgba(0,0,0,0.8)] sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cover image ── */}
        <div className="relative h-52 w-full shrink-0 overflow-hidden rounded-t-3xl sm:h-64">
          <Image
            src={record.featured_photo?.url ?? '/placeholder-event.png'}
            alt={record.contest_name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/50 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/80"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>

          <div className="absolute top-4 left-4 flex items-center gap-2">
            {record.is_team && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/20 px-2.5 py-1 text-[10px] font-bold text-sky-300 backdrop-blur-sm">
                👥 Team
              </span>
            )}
            <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
              {record.year}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            {record.category && (
              <div className="mb-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm',
                    catColor
                  )}
                >
                  {catEmoji} {record.category}
                </span>
              </div>
            )}
            <h2 className="text-xl leading-snug font-bold text-white sm:text-2xl">
              {record.contest_name}
            </h2>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 pt-5 pb-10 sm:px-6">
          {/* Result + date */}
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            {rs && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                  rs.badge
                )}
              >
                {rs.emoji} <ResultText text={record.result} />
              </span>
            )}
            {record.participation_date && (
              <span className="text-xs text-gray-400">
                📅{' '}
                {new Date(record.participation_date).toLocaleDateString(
                  'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </span>
            )}
            {record.contest_url && (
              <a
                href={record.contest_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300 transition-colors hover:border-blue-400/30 hover:text-blue-200"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3 w-3 opacity-70"
                >
                  <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
                  <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
                </svg>
                Contest link
              </a>
            )}
          </div>

          {/* Linked achievement */}
          {record.achievements && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/8 px-4 py-3">
              <span className="text-lg">🏆</span>
              <div>
                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                  Linked Achievement
                </p>
                <p className="text-sm font-semibold text-violet-200">
                  {record.achievements.title}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <p className="mb-5 text-sm leading-relaxed text-gray-400">
              {record.notes}
            </p>
          )}

          {/* Lead member + team */}
          {(record.users || members.length > 0) && (
            <div className="mb-5">
              <p className="mb-2.5 text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                {record.is_team ? '👥 Team Members' : '👤 Participant'}
              </p>
              {record.users && (
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10 ring-2 ring-white/10">
                    {record.users.avatar_url ? (
                      <Image
                        src={record.users.avatar_url}
                        alt={record.users.full_name ?? ''}
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/50">
                        {(record.users.full_name?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="flex-1 text-sm font-semibold text-white/85">
                    {record.users.full_name}
                  </p>
                  {record.team_name && (
                    <span className="text-xs text-sky-400">
                      {record.team_name}
                    </span>
                  )}
                </div>
              )}
              {members.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {members.map((m, i) => (
                    <span
                      key={i}
                      className={cn(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs',
                        m.type === 'club'
                          ? 'bg-emerald-500/10 text-emerald-300/80'
                          : m.type === 'guest'
                            ? 'bg-sky-500/10 text-sky-300/80'
                            : 'bg-white/5 text-white/50'
                      )}
                    >
                      {m.profile_url ? (
                        <a
                          href={m.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-white"
                        >
                          {m.name}
                        </a>
                      ) : (
                        m.name
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Photos grid */}
          {photos.length > 0 && (
            <div>
              <p className="mb-3 text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                🖼 Photos ({photos.length})
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((img, i) => (
                  <button
                    key={img.id ?? i}
                    onClick={() => setActivePhoto(img)}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 transition-all duration-300 hover:scale-[1.04] hover:border-white/30"
                  >
                    <Image
                      src={img.url}
                      alt={img.name ?? `Photo ${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="120px"
                      unoptimized
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                      <svg
                        className="h-6 w-6 text-white drop-shadow"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Photo lightbox (nested above the sheet) ── */}
      {activePhoto && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setActivePhoto(null)}
        >
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = photos.findIndex((p) => p.id === activePhoto.id);
                  setActivePhoto(
                    photos[(idx - 1 + photos.length) % photos.length]
                  );
                }}
                className="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = photos.findIndex((p) => p.id === activePhoto.id);
                  setActivePhoto(photos[(idx + 1) % photos.length]);
                }}
                className="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </>
          )}
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activePhoto.url}
              alt={activePhoto.name ?? 'Photo'}
              width={1200}
              height={900}
              className="max-h-[85vh] max-w-[90vw] object-contain"
              unoptimized
            />
          </div>
          {photos.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/60 tabular-nums backdrop-blur-sm">
              {photos.findIndex((p) => p.id === activePhoto.id) + 1} /{' '}
              {photos.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Achievement Card — uniform height via flex column
// ---------------------------------------------------------------------------

function AchievementCard({ achievement, onClick }) {
  const rs = getResultStyle(achievement.result);
  const categories = achievement.category
    ? achievement.category
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const participants = Array.isArray(achievement.participants)
    ? achievement.participants
    : [];

  return (
    <div
      onClick={onClick}
      className="group hover:border-neon-violet relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-[#27272A] bg-[#050505] transition-all duration-500"
    >
      {/* Cover image */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-t-[2rem]">
        <Image
          src={achievement.featured_photo?.url ?? '/placeholder-event.png'}
          alt={achievement.featured_photo?.name ?? achievement.title}
          fill
          className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {achievement.year && (
          <div className="absolute top-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
            {achievement.year}
          </div>
        )}
        {achievement.is_featured && (
          <div className="border-neon-violet/30 bg-neon-violet/10 text-neon-violet absolute top-3 left-3 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold">
            ★ Featured
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="font-heading group-hover:text-neon-violet line-clamp-2 text-xl font-black tracking-tight text-white uppercase transition-colors">
            {achievement.title}
          </h3>
          {rs && <span className="mt-0.5 shrink-0 text-lg">{rs.emoji}</span>}
        </div>

        {achievement.contest_name && (
          <p className="mb-3 line-clamp-1 font-mono text-[11px] text-zinc-500">
            {achievement.contest_name}
          </p>
        )}

        {achievement.description && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed font-light text-zinc-500">
            {achievement.description}
          </p>
        )}

        <div className="mt-auto" />

        {/* Tags */}
        {categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="border-neon-violet/30 text-neon-violet rounded-full border px-3 py-0.5 font-mono text-[9px] font-bold uppercase"
              >
                {cat}
              </span>
            ))}
            {rs && (
              <span className="border-neon-emerald/30 text-neon-emerald rounded-full border px-3 py-0.5 font-mono text-[9px] font-bold uppercase">
                <ResultText text={achievement.result} />
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#27272A] pt-4">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
            {achievement.is_team ? (
              <>
                <span>👥</span>
                <span className="max-w-[120px] truncate">
                  {achievement.team_name ?? 'Team'}
                </span>
              </>
            ) : participants.length > 0 ? (
              <>
                <span>👤</span>
                <span className="max-w-[120px] truncate">
                  {participants[0]}
                </span>
              </>
            ) : null}
          </div>
          <span className="text-neon-emerald font-mono text-[10px] font-bold uppercase transition-transform group-hover:translate-x-1">
            View →
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Participation Card — professional, fully responsive
// ---------------------------------------------------------------------------

function ParticipationRecordCard({ record, onClick }) {
  const catEmoji = PARTICIPATION_CATEGORY_EMOJI[record.category] ?? '🎯';
  const members = record.team_members ?? [];
  const photos = record.photos ?? [];
  const rs = getResultStyle(record.result);

  return (
    <div
      onClick={onClick}
      className="group hover:border-neon-emerald relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-[#27272A] bg-[#050505] transition-all duration-500"
    >
      {/* Cover */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-t-[2rem]">
        <Image
          src={record.featured_photo?.url ?? '/placeholder-event.png'}
          alt={record.featured_photo?.name ?? record.contest_name}
          fill
          className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-2.5 right-2.5 rounded-lg bg-black/60 px-2.5 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
          {record.year}
        </div>
        {record.is_team && (
          <div className="border-neon-violet/30 bg-neon-violet/10 text-neon-violet absolute top-2.5 left-2.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold">
            👥 Team
          </div>
        )}
        {rs && (
          <div className="border-neon-emerald/30 bg-neon-emerald/10 text-neon-emerald absolute right-2.5 bottom-2.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold">
            {rs.emoji} <ResultText text={record.result} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <div className="text-neon-emerald mb-1 font-mono text-[10px] font-bold tracking-[0.3em] uppercase">
          {catEmoji} {record.category ?? 'Contest'}
        </div>
        <h4 className="font-heading group-hover:text-neon-emerald mb-3 line-clamp-2 text-lg font-black tracking-tight text-white uppercase transition-colors">
          {record.contest_name}
        </h4>

        {record.achievements && (
          <div className="mb-3">
            <span className="border-neon-violet/20 bg-neon-violet/8 text-neon-violet inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase">
              🏆 {record.achievements.title}
            </span>
          </div>
        )}

        <div className="mt-auto" />

        {/* Lead member */}
        <div className="border-t border-[#27272A] pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-neon-violet/20 ring-neon-violet/30 relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1">
                {record.users?.avatar_url ? (
                  <Image
                    src={record.users.avatar_url}
                    alt={record.users.full_name ?? ''}
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-neon-violet flex h-full w-full items-center justify-center font-mono text-xs font-bold">
                    {(
                      record.users?.full_name?.[0] ??
                      members[0]?.name?.[0] ??
                      '?'
                    ).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="truncate font-mono text-[10px] text-zinc-400">
                {record.users?.full_name ?? members[0]?.name ?? 'Unknown'}
              </p>
            </div>
            <span className="text-neon-emerald font-mono text-[10px] font-bold uppercase transition-transform group-hover:translate-x-1">
              View →
            </span>
          </div>

          {/* Team members */}
          {record.is_team && members.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {members.slice(0, 3).map((m, i) => (
                <span
                  key={i}
                  className="rounded-full border border-[#27272A] px-2 py-0.5 font-mono text-[9px] text-zinc-500"
                >
                  {m.name}
                </span>
              ))}
              {members.length > 3 && (
                <span className="rounded-full border border-[#27272A] px-2 py-0.5 font-mono text-[9px] text-zinc-600">
                  +{members.length - 3}
                </span>
              )}
            </div>
          )}

          {photos.length > 0 && (
            <div className="mt-3 flex gap-1.5">
              {photos.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#27272A]"
                >
                  <Image
                    src={p.url}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="36px"
                    unoptimized
                  />
                </div>
              ))}
              {photos.length > 3 && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#27272A] font-mono text-[9px] text-zinc-600">
                  +{photos.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline Item
// ---------------------------------------------------------------------------

function TimelineItem({ item, index, total }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const isEven = index % 2 === 0;
  const isLast = index === total - 1;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(t);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="group relative">
      {/* ═══════════════════════════════ MOBILE ════════════════════════════════ */}
      <div
        className={cn(
          'relative flex gap-4 md:hidden',
          !isLast ? 'pb-10' : 'pb-0'
        )}
      >
        {/* Spine + Node */}
        <div className="relative flex shrink-0 flex-col items-center">
          {/* Glow halo */}
          <span className="from-neon-violet/15 to-neon-emerald/10 absolute z-0 h-10 w-10 rounded-full bg-gradient-to-br opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
          {/* Node — scale pops in */}
          <div
            className={cn(
              'from-neon-violet to-neon-emerald relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br shadow-lg ring-2 shadow-black/60 ring-[#050505] transition-all duration-500 group-hover:scale-110',
              visible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )}
            style={{ transitionDelay: visible ? '200ms' : '0ms' }}
          >
            <span className="text-sm leading-none">{item.icon}</span>
          </div>
          {/* Animated connector — grows downward */}
          {!isLast && (
            <div className="relative mt-2 w-px flex-1 overflow-hidden">
              <div
                className={cn(
                  'from-neon-violet/35 absolute top-0 left-0 w-full bg-gradient-to-b to-transparent transition-[height] duration-700 ease-out',
                  visible ? 'h-full' : 'h-0'
                )}
                style={{ transitionDelay: visible ? '500ms' : '0ms' }}
              />
            </div>
          )}
        </div>

        {/* Card — slides in from right */}
        <div
          className={cn(
            'min-w-0 flex-1 pt-0.5 transition-all duration-600 ease-out',
            visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
          )}
          style={{ transitionDelay: visible ? '100ms' : '0ms' }}
        >
          {/* Year + step label */}
          <div className="mb-2 flex items-center gap-2">
            <span className="border-neon-violet/20 bg-neon-violet/10 text-neon-violet inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums">
              {item.year}
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-gray-700 uppercase">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 group-hover:border-white/16 group-hover:bg-white/7 group-hover:shadow-xl group-hover:shadow-black/25">
            <h3 className="mb-1 text-sm leading-snug font-bold text-white">
              {item.event}
            </h3>
            {item.description && (
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════ DESKTOP ════════════════════════════════ */}
      <div
        className={cn(
          'relative hidden md:flex md:items-center',
          isEven ? 'md:flex-row' : 'md:flex-row-reverse',
          !isLast ? 'mb-14' : ''
        )}
      >
        {/* ── Card column — slides in from its side ── */}
        <div
          className={cn(
            'flex w-[45%]',
            isEven ? 'justify-end pr-10' : 'justify-start pl-10'
          )}
        >
          <div
            className={cn(
              'w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-700 ease-out group-hover:border-white/18 group-hover:bg-white/8 group-hover:shadow-2xl group-hover:shadow-black/30',
              isEven ? 'text-right' : 'text-left',
              visible
                ? 'translate-x-0 opacity-100'
                : isEven
                  ? '-translate-x-12 opacity-0'
                  : 'translate-x-12 opacity-0'
            )}
            style={{ transitionDelay: visible ? '100ms' : '0ms' }}
          >
            {/* Step label */}
            <p className="mb-3 text-[10px] font-bold tracking-[0.25em] text-gray-600 uppercase">
              Milestone {String(index + 1).padStart(2, '0')}
            </p>
            {/* Icon — large decorative, fades up */}
            <div
              className={cn(
                'mb-3 text-4xl leading-none transition-all duration-500',
                visible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-3 opacity-0'
              )}
              style={{ transitionDelay: visible ? '250ms' : '0ms' }}
            >
              {item.icon}
            </div>
            {/* Title */}
            <h3 className="group-hover:text-neon-violet font-heading mb-2 text-xl font-black tracking-tight text-white uppercase transition-colors">
              {item.event}
            </h3>
            {/* Description */}
            {item.description && (
              <p className="text-sm leading-relaxed text-gray-400">
                {item.description}
              </p>
            )}
            {/* Year accent line */}
            <div
              className={cn(
                'mt-5 flex items-center gap-2',
                isEven ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'h-px w-8',
                  isEven
                    ? 'to-neon-violet/50 bg-gradient-to-r from-transparent'
                    : 'from-neon-violet/50 bg-gradient-to-r to-transparent'
                )}
              />
              <span className="text-neon-violet font-mono text-[11px] font-bold tabular-nums">
                {item.year}
              </span>
              {!isEven && (
                <div className="from-primary-500/50 h-px w-8 bg-linear-to-l to-transparent" />
              )}
            </div>
          </div>
        </div>

        {/* ── Center node column ── */}
        <div className="relative flex w-[10%] flex-col items-center justify-center">
          {/* Glow halo */}
          <span className="from-neon-violet/15 to-neon-emerald/10 absolute h-20 w-20 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
          {/* Node — scale pops in after card */}
          <div
            className={cn(
              'from-neon-violet to-neon-emerald relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl ring-4 shadow-black/60 ring-[#050505] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110',
              visible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )}
            style={{ transitionDelay: visible ? '350ms' : '0ms' }}
          >
            <span className="text-xl leading-none">{item.icon}</span>
          </div>
          {/* Year pill — slides up after node */}
          <div
            className={cn(
              'border-neon-violet/20 bg-neon-violet/10 text-neon-violet relative z-10 mt-2.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold whitespace-nowrap tabular-nums transition-all duration-400',
              visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            )}
            style={{ transitionDelay: visible ? '480ms' : '0ms' }}
          >
            {item.year}
          </div>
        </div>

        {/* ── Mirror column ── */}
        <div className="w-[45%]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AchievementsClient({
  achievements: propAchievements = [],
  participations: propParticipations = [],
  timeline: propTimeline = [],
  settings = {},
}) {
  // ── Achievement state ────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('All');
  const [achPage, setAchPage] = useState(1);
  const [achYearFilter, setAchYearFilter] = useState('All');
  const [achTypeFilter, setAchTypeFilter] = useState('All'); // 'All' | 'Team' | 'Individual'
  const [achResultFilter, setAchResultFilter] = useState('All'); // 'All' | 'Medalist' | 'Finalist' | 'Qualified' | 'Participant'

  // ── Participation state ──────────────────────────────────────────────────
  const [participCatFilter, setParticipatCatFilter] = useState('All');
  const [participYearFilter, setParticipatYearFilter] = useState('All');
  const [participPage, setParticipatPage] = useState(1);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedParticipation, setSelectedParticipation] = useState(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const achievements = propAchievements;

  // Featured achievements (for the carousel)
  const featuredAchievements = useMemo(
    () => propAchievements.filter((a) => a.is_featured),
    [propAchievements]
  );

  // Dynamic year list derived from achievement data
  const achievementYears = useMemo(() => {
    const years = [
      ...new Set(propAchievements.map((a) => a.year).filter(Boolean)),
    ].sort((a, b) => b - a);
    return ['All', ...years.map(String)];
  }, [propAchievements]);

  const timeline = propTimeline.length > 0 ? propTimeline : DEFAULT_TIMELINE;

  // Build dynamic category list
  const categorySet = new Set(
    propAchievements.flatMap((a) =>
      a.category
        ? a.category
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    )
  );
  const categories = DEFAULT_CATEGORIES.filter(
    (c) => c.name === 'All' || categorySet.has(c.name)
  );
  if (categories.length <= 1) categories.push(...DEFAULT_CATEGORIES.slice(1));

  // Filtered achievements — applies all four filters
  const filteredAchievements = useMemo(() => {
    let rows = [...achievements];
    if (activeFilter !== 'All')
      rows = rows.filter((a) =>
        a.category
          ?.split(',')
          .map((s) => s.trim())
          .includes(activeFilter)
      );
    if (achYearFilter !== 'All')
      rows = rows.filter((a) => String(a.year) === achYearFilter);
    if (achTypeFilter === 'Team') rows = rows.filter((a) => a.is_team);
    else if (achTypeFilter === 'Individual')
      rows = rows.filter((a) => !a.is_team);
    if (achResultFilter !== 'All')
      rows = rows.filter((a) => getResultTier(a.result) === achResultFilter);
    return rows;
  }, [
    achievements,
    activeFilter,
    achYearFilter,
    achTypeFilter,
    achResultFilter,
  ]);

  // Achievement pagination
  const achTotalPages = Math.ceil(
    filteredAchievements.length / ACHIEVEMENT_PAGE_SIZE
  );
  const achCurrentPage = Math.min(achPage, achTotalPages || 1);
  const paginatedAchievements = filteredAchievements.slice(
    (achCurrentPage - 1) * ACHIEVEMENT_PAGE_SIZE,
    achCurrentPage * ACHIEVEMENT_PAGE_SIZE
  );

  // ── Participation data ───────────────────────────────────────────────────
  const participationCategories = useMemo(() => {
    const cats = [
      ...new Set(propParticipations.map((p) => p.category).filter(Boolean)),
    ].sort();
    return ['All', ...cats];
  }, [propParticipations]);

  const participationYears = useMemo(() => {
    const years = [
      ...new Set(propParticipations.map((p) => p.year).filter(Boolean)),
    ].sort((a, b) => b - a);
    return ['All', ...years.map(String)];
  }, [propParticipations]);

  const filteredParticipations = useMemo(() => {
    let rows = [...propParticipations];
    if (participCatFilter !== 'All')
      rows = rows.filter((r) => r.category === participCatFilter);
    if (participYearFilter !== 'All')
      rows = rows.filter((r) => String(r.year) === participYearFilter);
    return rows;
  }, [propParticipations, participCatFilter, participYearFilter]);

  // ── Participation pagination ─────────────────────────────────────────────
  const participTotalPages = Math.ceil(
    filteredParticipations.length / PARTICIPATION_PAGE_SIZE
  );
  const participCurrentPage = Math.min(participPage, participTotalPages || 1);
  const paginatedParticipations = filteredParticipations.slice(
    (participCurrentPage - 1) * PARTICIPATION_PAGE_SIZE,
    participCurrentPage * PARTICIPATION_PAGE_SIZE
  );

  // ── Reset helpers ────────────────────────────────────────────────────────
  const hasActiveParticipationFilters =
    participCatFilter !== 'All' || participYearFilter !== 'All';

  function resetParticipationFilters() {
    setParticipatCatFilter('All');
    setParticipatYearFilter('All');
    setParticipatPage(1);
  }

  const hasActiveAchievementFilters =
    activeFilter !== 'All' ||
    achYearFilter !== 'All' ||
    achTypeFilter !== 'All' ||
    achResultFilter !== 'All';

  function resetAchievementFilters() {
    setActiveFilter('All');
    setAchYearFilter('All');
    setAchTypeFilter('All');
    setAchResultFilter('All');
    setAchPage(1);
  }

  const medalistCount = propAchievements.filter(
    (a) => getResultTier(a.result) === 'Medalist'
  ).length;
  const yearsActive = Math.max(
    achievementYears.length - 1,
    participationYears.length - 1
  );

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#050505] text-white">
      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]" />
          <div className="grid-overlay absolute inset-0 opacity-10" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#050505] to-transparent" />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto w-full max-w-screen-xl px-6 lg:px-10"
        >
          {/* Top-right metadata */}
          <motion.div variants={fadeUp} className="mb-12 flex justify-end">
            <div className="space-y-1 text-right">
              <p className="text-neon-violet font-mono text-[10px] font-bold tracking-[0.4em] uppercase">
                Hall of Achievements
              </p>
              <p className="font-mono text-[10px] tracking-[0.4em] text-zinc-600 uppercase">
                {settings?.achievements_page_badge || 'Operational Excellence'}
              </p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="kinetic-headline font-heading text-[clamp(3.5rem,12vw,9rem)] leading-[0.85] font-black tracking-tighter text-white uppercase select-none"
          >
            HALL OF
            <br />
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: '1.5px #8B5CF6' }}
            >
              ACHIEVEMENTS
            </span>
          </motion.h1>

          {/* Divider + tagline */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex items-center gap-6"
          >
            <div className="bg-neon-emerald h-[2px] w-20" />
            <p className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
              {settings?.achievements_page_description ||
                'A technical lineage of digital excellence.'}
            </p>
          </motion.div>

          {/* Stats row */}
          {/* <motion.div variants={fadeUp} className="mt-16 grid grid-cols-2 gap-8 border-t border-[#27272A] pt-12 sm:grid-cols-4">
            {[
              { value: String(propAchievements.length), label: 'Achievements', color: 'text-neon-violet' },
              { value: String(medalistCount), label: 'Medalists', color: 'text-neon-emerald' },
              { value: String(propParticipations.length), label: 'Participations', color: 'text-white' },
              { value: yearsActive > 0 ? `${yearsActive}+` : '—', label: 'Years Active', color: 'text-neon-violet' },
            ].map((stat) => (
              <div key={stat.label} className="group space-y-3 text-center">
                <div className={cn('font-heading text-6xl font-black tracking-tighter transition-transform duration-300 group-hover:scale-110', stat.color)}>
                  {stat.value}
                </div>
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div> */}
        </motion.div>

        {/* Bottom-left glass panel */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="absolute bottom-16 left-6 hidden max-w-xs lg:block"
          style={{
            background: 'rgba(20,20,22,0.7)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(139,92,246,0.1)',
            boxShadow: '0 0 60px 0 rgba(139,92,246,0.1)',
          }}
        >
          <div className="p-8">
            <div className="text-neon-violet mb-6 text-3xl">★</div>
            <p className="font-mono text-[11px] leading-relaxed tracking-wider text-zinc-400 uppercase">
              Documenting the highest standards of computational triumph within
              the NEUPC ecosystem.
            </p>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
          <span className="font-mono text-[9px] tracking-[0.4em] text-zinc-700 uppercase">
            Scroll
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-zinc-600 to-transparent" />
        </div>
      </section>

      {/* ══════════════════════ STATS BAND ══════════════════════ */}
      <section className="bg-[#131315] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
            {[
              {
                value: `${propAchievements.length}+`,
                label: 'Total Achievements',
                color: 'text-neon-violet',
              },
              {
                value: `${medalistCount}+`,
                label: 'Medalists',
                color: 'text-neon-emerald',
              },
              {
                value: `${propParticipations.length}+`,
                label: 'Participations',
                color: 'text-white',
              },
              {
                value: yearsActive > 0 ? `${yearsActive}+` : '5+',
                label: 'Years Active',
                color: 'text-neon-violet',
              },
            ].map((s) => (
              <div key={s.label} className="group space-y-3 text-center">
                <div
                  className={cn(
                    'font-heading text-6xl font-black tracking-tighter transition-transform group-hover:scale-110',
                    s.color
                  )}
                >
                  {s.value}
                </div>
                <div className="font-mono text-[9px] font-bold tracking-[0.4em] text-zinc-500 uppercase">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FEATURED CAROUSEL ══════════════════════ */}
      {featuredAchievements.length > 0 && (
        <section className="relative overflow-hidden bg-[#050505] px-6 py-32 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="mb-20 space-y-4 text-center"
            >
              <span className="text-neon-emerald font-mono text-[10px] font-bold tracking-[0.5em] uppercase">
                Legacy Unit 01
              </span>
              <h2 className="font-heading text-6xl font-black tracking-tighter text-white uppercase sm:text-7xl">
                Featured{' '}
                <span className="text-neon-violet italic">Victory</span>
              </h2>
            </motion.div>
            <FeaturedAchievementsCarousel items={featuredAchievements} />
          </div>
        </section>
      )}

      {/* ══════════════════════ VICTORY LOG (Achievements) ══════════════════════ */}
      <section id="achievements" className="bg-[#131315] px-6 py-32 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-16">
          {/* Header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="flex flex-col items-start justify-between gap-8 border-b border-[#27272A] pb-12 md:flex-row md:items-end"
          >
            <div className="space-y-3">
              <span className="text-neon-emerald font-mono text-[10px] font-bold tracking-[0.5em] uppercase">
                Operations Log
              </span>
              <h2 className="font-heading text-6xl font-black tracking-tighter text-white uppercase">
                Victory Log
              </h2>
            </div>
            <div className="font-mono text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">
              {achievementYears[1] &&
              achievementYears[achievementYears.length - 1]
                ? `${achievementYears[achievementYears.length - 1]}–${achievementYears[1]} Cycle`
                : 'All Time'}
            </div>
          </motion.div>

          {/* Filter bar */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#050505]"
          >
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
                {categories.map((category) => {
                  const isActive = activeFilter === category.name;
                  return (
                    <button
                      key={category.name}
                      onClick={() => {
                        setActiveFilter(category.name);
                        setAchPage(1);
                      }}
                      className={cn(
                        'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[10px] font-bold tracking-widest uppercase transition-all duration-200',
                        isActive
                          ? 'bg-neon-violet text-white'
                          : 'hover:border-neon-violet/40 hover:text-neon-violet border border-[#27272A] text-zinc-500'
                      )}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-[#27272A] px-5 py-3">
              {achievementYears.length > 2 && (
                <div className="flex items-center gap-0.5 overflow-x-auto rounded-lg border border-[#27272A] p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {achievementYears.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => {
                        setAchYearFilter(yr);
                        setAchPage(1);
                      }}
                      className={cn(
                        'shrink-0 rounded-md px-3 py-1 font-mono text-[10px] font-bold uppercase transition-all',
                        achYearFilter === yr
                          ? 'bg-neon-violet/15 text-neon-violet'
                          : 'text-zinc-600 hover:text-zinc-300'
                      )}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-0.5 rounded-lg border border-[#27272A] p-0.5">
                {[
                  { key: 'All', label: 'All' },
                  { key: 'Team', label: 'Team' },
                  { key: 'Individual', label: 'Solo' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setAchTypeFilter(key);
                      setAchPage(1);
                    }}
                    className={cn(
                      'shrink-0 rounded-md px-3 py-1 font-mono text-[10px] font-bold uppercase transition-all',
                      achTypeFilter === key
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-600 hover:text-zinc-300'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-3">
                {hasActiveAchievementFilters && (
                  <button
                    onClick={resetAchievementFilters}
                    className="hover:text-neon-violet font-mono text-[10px] font-bold tracking-widest text-zinc-600 uppercase underline underline-offset-2 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                  <span className="text-neon-emerald font-bold">
                    {filteredAchievements.length}
                  </span>{' '}
                  result{filteredAchievements.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Grid */}
          {filteredAchievements.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No Achievements Found"
              description="Try adjusting the filters above"
            />
          ) : (
            <>
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              >
                {paginatedAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    variants={cardReveal}
                    className="h-full"
                  >
                    <AchievementCard
                      achievement={achievement}
                      onClick={() => setSelectedAchievement(achievement)}
                    />
                  </motion.div>
                ))}
              </motion.div>
              <PaginationControls
                currentPage={achCurrentPage}
                totalPages={achTotalPages}
                onPageChange={setAchPage}
              />
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════ PARTICIPATION LOG ══════════════════════ */}
      {propParticipations.length > 0 && (
        <section
          id="participation"
          className="bg-[#050505] px-6 py-32 lg:px-10"
        >
          <div className="mx-auto max-w-7xl space-y-16">
            {/* Header */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="flex flex-col items-start gap-6 md:flex-row md:items-center"
            >
              <h2 className="font-heading shrink-0 text-5xl font-black tracking-tighter text-white uppercase italic">
                Participation Log
              </h2>
              <div className="h-px flex-grow bg-[#27272A]" />
              <span className="text-neon-emerald shrink-0 font-mono text-[10px] font-bold tracking-widest uppercase">
                Recent Missions
              </span>
            </motion.div>

            {/* Filter bar */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#131315]"
            >
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
                  {participationCategories.map((cat) => {
                    const isActive = participCatFilter === cat;
                    const emoji =
                      cat !== 'All'
                        ? (PARTICIPATION_CATEGORY_EMOJI[cat] ?? '🎯')
                        : '✦';
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setParticipatCatFilter(cat);
                          setParticipatPage(1);
                        }}
                        className={cn(
                          'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[10px] font-bold tracking-widest uppercase transition-all duration-200',
                          isActive
                            ? 'bg-neon-emerald text-black'
                            : 'hover:border-neon-emerald/40 hover:text-neon-emerald border border-[#27272A] text-zinc-500'
                        )}
                      >
                        <span>{emoji}</span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#27272A] px-5 py-3">
                {participationYears.length > 2 ? (
                  <div className="flex items-center gap-0.5 overflow-x-auto rounded-lg border border-[#27272A] p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {participationYears.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => {
                          setParticipatYearFilter(yr);
                          setParticipatPage(1);
                        }}
                        className={cn(
                          'shrink-0 rounded-md px-3 py-1 font-mono text-[10px] font-bold uppercase transition-all',
                          participYearFilter === yr
                            ? 'bg-neon-emerald/15 text-neon-emerald'
                            : 'text-zinc-600 hover:text-zinc-300'
                        )}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
                  {hasActiveParticipationFilters && (
                    <button
                      onClick={resetParticipationFilters}
                      className="hover:text-neon-emerald font-mono text-[10px] font-bold text-zinc-600 uppercase underline transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <span className="font-mono text-[10px] text-zinc-600">
                    <span className="text-neon-emerald font-bold">
                      {filteredParticipations.length}
                    </span>{' '}
                    record{filteredParticipations.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Grid */}
            {filteredParticipations.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No Records Found"
                description="Try adjusting the filters above"
              />
            ) : (
              <>
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewport}
                  className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {paginatedParticipations.map((record) => (
                    <motion.div
                      key={record.id}
                      variants={cardReveal}
                      className="h-full"
                    >
                      <ParticipationRecordCard
                        record={record}
                        onClick={() => setSelectedParticipation(record)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
                <PaginationControls
                  currentPage={participCurrentPage}
                  totalPages={participTotalPages}
                  onPageChange={setParticipatPage}
                />
              </>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════ JOURNEY TIMELINE ══════════════════════ */}
      <section id="journey" className="bg-[#131315] px-6 py-32 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-20">
          <SectionEyebrow
            tag="Our Story / 003"
            title="The"
            accent="Journey"
            description="From a small programming club to a nationally recognized team — every milestone shaped who we are today."
          />
          <div className="mx-auto max-w-5xl">
            <div className="relative">
              <div className="from-neon-violet/40 via-neon-emerald/20 absolute top-0 left-1/2 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b to-transparent md:block" />
              {timeline.map((item, index) => (
                <TimelineItem
                  key={index}
                  item={item}
                  index={index}
                  total={timeline.length}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section className="relative overflow-hidden bg-[#050505] px-6 py-40 lg:px-10">
        <div className="bg-neon-violet/10 pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="relative z-10 mx-auto max-w-4xl space-y-16 text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="font-heading text-6xl leading-none font-black tracking-tighter text-white uppercase italic sm:text-7xl md:text-8xl lg:text-9xl"
          >
            {settings?.achievements_page_cta_title || (
              <>
                WANT TO BE OUR NEXT{' '}
                <span className="text-neon-violet">CHAMPION?</span>
              </>
            )}
          </motion.h2>
          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center justify-center gap-6 sm:flex-row"
          >
            <Link
              href="/join"
              className="bg-neon-violet font-heading rounded-full px-14 py-5 text-sm font-black tracking-[0.3em] text-white uppercase italic transition-all hover:bg-white hover:text-black"
            >
              Join the Elite
            </Link>
            <Link
              href="#achievements"
              className="font-heading hover:border-neon-emerald hover:text-neon-emerald rounded-full border-2 border-[#3F3F46] px-14 py-5 text-sm font-black tracking-[0.3em] text-zinc-400 uppercase italic transition-all"
            >
              Explore Victories
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <ScrollToTop />

      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
      {selectedParticipation && (
        <ParticipationDetailModal
          record={selectedParticipation}
          onClose={() => setSelectedParticipation(null)}
        />
      )}
    </main>
  );
}
