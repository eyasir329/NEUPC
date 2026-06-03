'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { cn } from '@/app/_lib/utils/utils';
import InlinePagination from '@/app/_components/ui/InlinePagination';
import StatTile from '@/app/_components/ui/StatTile';
import HeroAmbient from '@/app/_components/ui/HeroAmbient';
import ScrollCue from '@/app/_components/ui/ScrollCue';
import SectionHeading from '@/app/_components/ui/SectionHeading';
import FeaturedCarousel from '@/app/_components/ui/FeaturedCarousel';
import {
  pageFadeUp as fadeUp,
  pageStagger as stagger,
  pageCardReveal as cardReveal,
  pageViewport as viewport,
} from '@/app/_components/motion/motion';

const ScrollToTop = dynamic(() => import('@/app/_components/ui/ScrollToTop'), {
  ssr: false,
});

function EmptyState({ icon, title, description, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewport}
      className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center sm:py-24"
    >
      <div className="text-3xl">{icon}</div>
      <p className="font-heading text-base font-bold text-white sm:text-lg">
        {title}
      </p>
      <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
        {description}
      </p>
      {onClear && (
        <button
          onClick={onClear}
          className="hover:border-neon-lime/30 hover:text-neon-lime mt-2 rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] tracking-widest text-zinc-500 uppercase transition-colors"
        >
          Clear filters
        </button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Animated counter for hero stats
// ---------------------------------------------------------------------------
function AnimatedCounter({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const num = parseInt(value, 10) || 0;
  useEffect(() => {
    if (num === 0) return;
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * num);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [num]);
  return <>{display}{suffix}</>;
}

// ---------------------------------------------------------------------------
// Search icon
// ---------------------------------------------------------------------------
function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dropdown select for filters
// ---------------------------------------------------------------------------
function FilterSelect({ value, onChange, options, label }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 pr-7 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-all hover:border-neon-lime/30 hover:text-neon-lime focus:border-neon-lime/40 focus:text-neon-lime focus:outline-none [&>option]:bg-gray-950 [&>option]:text-zinc-300"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Emoji icons for known achievement categories (presentation only).
// The category filter list itself is derived from achievement data.
const CATEGORY_ICONS = {
  All: '🏆',
  ICPC: '🌏',
  IUPC: '🏁',
  Contest: '⚔️',
  Hackathon: '💻',
  Individual: '⭐',
};
const DEFAULT_CATEGORY_ICON = '🏅';

const ACHIEVEMENT_PAGE_SIZE = 9;
const PARTICIPATION_PAGE_SIZE = 9;

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
// Percentile & Leaderboard Helpers
// ---------------------------------------------------------------------------

function getRankPercentileColor(topPercentage) {
  if (topPercentage <= 1) return { bar: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' };
  if (topPercentage <= 5) return { bar: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' };
  if (topPercentage <= 10) return { bar: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
  if (topPercentage <= 25) return { bar: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' };
  if (topPercentage <= 50) return { bar: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
  if (topPercentage <= 75) return { bar: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' };
  return { bar: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' };
}

function parseResultRankTotal(result, contestName, contestTotals) {
  const fallback = {
    rank: null,
    total: contestTotals[contestName] || 100,
    topPercentage: 100,
    percentile: 0,
  };

  if (!result) return fallback;
  const cleaned = result.replace(/\*/g, '');
  
  // 1. "X out of Y"
  const outOfMatch = cleaned.match(/(\d+)\s+out\s+of\s+(\d+)/i);
  if (outOfMatch) {
    const rank = parseInt(outOfMatch[1], 10);
    const total = parseInt(outOfMatch[2], 10);
    if (rank > 0 && total > 0) {
      const topPercentage = (rank / total) * 100;
      const percentile = ((total - rank + 1) / total) * 100;
      return { rank, total, topPercentage, percentile };
    }
  }
  
  // 2. Standalone awards
  const lowercase = cleaned.toLowerCase();
  let rank = null;
  if (lowercase.includes('1st') || lowercase.includes('champion') || lowercase.includes('winner') || lowercase.includes('first')) {
    rank = 1;
  } else if (lowercase.includes('2nd') || lowercase.includes('second')) {
    rank = 2;
  } else if (lowercase.includes('3rd') || lowercase.includes('third')) {
    rank = 3;
  }
  
  if (rank !== null) {
    const total = contestTotals[contestName] || 100;
    const topPercentage = (rank / total) * 100;
    const percentile = ((total - rank + 1) / total) * 100;
    return { rank, total, topPercentage, percentile };
  }
  
  return fallback;
}

function LeaderboardRankProgressBar({ topPercentage, className = '' }) {
  const percentile = 100 - topPercentage;
  const colors = getRankPercentileColor(topPercentage);
  
  return (
    <div
      className={cn("group/progress relative shrink-0", className)}
      title={`Top ${topPercentage.toFixed(1)}% | Rank Percentile: ${percentile.toFixed(1)}%`}
    >
      <div className="relative h-10 w-2 rounded-full bg-white/10">
        <div
          className={cn("absolute right-0 bottom-0 left-0 transition-all duration-300 rounded-full", colors.bar)}
          style={{ height: `${percentile}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero — synced with Events page pattern
// ---------------------------------------------------------------------------
// (Hero is rendered inline in the main component below)

// ---------------------------------------------------------------------------
// Featured Achievements Carousel
// ---------------------------------------------------------------------------

function FeaturedAchievementBanner({ achievement, onSelect }) {
  const rs = getResultStyle(achievement.result);
  const cats = achievement.category
    ? achievement.category
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const participants = Array.isArray(achievement.participants)
    ? achievement.participants
    : [];
  const image = achievement.featured_photo?.url;

  return (
    <div className="group border-neon-lime/10 relative overflow-hidden rounded-2xl border bg-[#08090f]">
      <div className="relative aspect-[3/2] w-full sm:aspect-[16/10] lg:aspect-[21/9]">
        {/* Backdrop fill */}
        {image && (
          <Image
            src={image}
            alt=""
            aria-hidden
            fill
            loading="lazy"
            className="scale-110 object-cover opacity-25 blur-xl"
            sizes="100vw"
            unoptimized
          />
        )}

        {/* Foreground image */}
        <Image
          src={image ?? '/placeholder-event.png'}
          alt={achievement.title || 'Featured achievement'}
          fill
          loading="lazy"
          className="object-contain object-center"
          sizes="100vw"
          unoptimized
        />

        {/* Bottom scrim */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-[#05060b] via-[#05060b]/85 to-transparent" />

        {/* Top-left meta */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 sm:top-5 sm:left-5">
          <span className="border-neon-lime/30 text-neon-lime inline-flex items-center gap-1.5 rounded-full border bg-black/50 px-3 py-1 font-mono text-[9px] font-bold tracking-widest uppercase backdrop-blur-md sm:text-[10px]">
            <span className="bg-neon-lime h-1.5 w-1.5 rounded-full" />
            Featured Victory
          </span>
          {achievement.year && (
            <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 font-mono text-[9px] font-bold tracking-widest text-zinc-200 uppercase backdrop-blur-md sm:text-[10px]">
              {achievement.year}
            </span>
          )}
        </div>

        {/* Floating content */}
        <div className="absolute inset-x-3 bottom-3 sm:inset-x-5 sm:bottom-5 lg:inset-x-8 lg:bottom-8">
          <div className="max-w-2xl space-y-3 sm:space-y-4">
            {/* Result chip + categories */}
            <div className="flex flex-wrap items-center gap-2">
              {achievement.result && rs && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-bold tracking-widest uppercase backdrop-blur-md sm:text-[11px]',
                    rs.badge
                  )}
                >
                  <span aria-hidden>{rs.emoji}</span>
                  <ResultText text={achievement.result} />
                </span>
              )}
              {cats.slice(0, 2).map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-white/15 bg-black/50 px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-zinc-200 uppercase backdrop-blur-md sm:text-[10px]"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Title */}
            <h3 className="kinetic-headline font-heading text-2xl leading-[1.05] font-black text-white uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-3xl lg:text-5xl">
              {achievement.title}
            </h3>

            {/* Contest name */}
            {achievement.contest_name && (
              <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-zinc-300 uppercase sm:text-[11px]">
                <svg
                  className="text-neon-lime h-3 w-3 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                {achievement.contest_url ? (
                  <a
                    href={achievement.contest_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-neon-lime"
                  >
                    {achievement.contest_name}
                  </a>
                ) : (
                  achievement.contest_name
                )}
              </p>
            )}

            {/* Description — desktop only */}
            {achievement.description && (
              <p className="hidden max-w-xl text-sm leading-relaxed text-zinc-300 sm:block sm:text-base">
                {achievement.description.length > 160
                  ? `${achievement.description.slice(0, 160).trim()}…`
                  : achievement.description}
              </p>
            )}

            {/* CTA + team row */}
            <div className="flex flex-wrap items-center gap-3 pt-1 sm:gap-4">
              <button
                type="button"
                onClick={() => onSelect?.(achievement)}
                className="group/cta bg-neon-lime font-heading focus-visible:ring-neon-lime inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-3 text-[10px] font-bold tracking-widest text-black uppercase shadow-[0_0_30px_-8px_rgba(182,243,107,0.6)] transition-shadow hover:shadow-[0_0_50px_-4px_rgba(182,243,107,0.8)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060b] focus-visible:outline-none sm:px-7 sm:text-[11px]"
              >
                Read Story
                <span className="transition-transform group-hover/cta:translate-x-1">
                  →
                </span>
              </button>
              {(achievement.team_name || participants.length > 0) && (
                <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-zinc-400 sm:text-[11px]">
                  <span aria-hidden>{achievement.is_team ? '👥' : '👤'}</span>
                  <span className="max-w-[18rem] truncate">
                    {achievement.team_name ||
                      participants
                        .slice(0, 3)
                        .map((p) => p.name || p)
                        .filter(Boolean)
                        .join(', ')}
                    {participants.length > 3 && ` +${participants.length - 3}`}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedAchievementsCarousel({ items, onSelect }) {
  return (
    <FeaturedCarousel
      items={items}
      ariaLabel="Featured achievements"
      getKey={(a) => a.id}
      renderItem={(a) => (
        <FeaturedAchievementBanner achievement={a} onSelect={onSelect} />
      )}
    />
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
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-2xl"
      />

      {/* Sheet */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={achievement.title || 'Achievement details'}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-h-[96vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-950 shadow-[0_-8px_80px_rgba(0,0,0,0.8)] sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl"
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
            aria-label="Close dialog"
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
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
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
      </motion.div>

      {/* ── Gallery lightbox (nested above the sheet) ── */}
      {activePhoto && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setActivePhoto(null)}
        >
          <button
            onClick={() => setActivePhoto(null)}
            aria-label="Close photo viewer"
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
                aria-label="Previous photo"
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
                aria-label="Next photo"
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
    </motion.div>
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
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-2xl"
      />

      {/* Sheet */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={record.contest_name || 'Participation details'}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-h-[96vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-950 shadow-[0_-8px_80px_rgba(0,0,0,0.8)] sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl"
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
            aria-label="Close dialog"
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
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
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
      </motion.div>

      {/* ── Photo lightbox (nested above the sheet) ── */}
      {activePhoto && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setActivePhoto(null)}
        >
          <button
            onClick={() => setActivePhoto(null)}
            aria-label="Close photo viewer"
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
                aria-label="Previous photo"
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
                aria-label="Next photo"
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
    </motion.div>
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${achievement.title}`}
      className="group focus-visible:ring-neon-lime/50 relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#08090f] transition-all duration-500 hover:border-neon-lime/30 hover:shadow-[0_0_40px_-12px_rgba(182,243,107,0.2)] focus-visible:ring-2 focus-visible:outline-none"
    >
      {/* Cover image */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-2xl">
        <Image
          src={achievement.featured_photo?.url ?? '/placeholder-event.png'}
          alt={achievement.featured_photo?.name ?? achievement.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#08090f] via-black/30 to-transparent" />
        {/* Top badges row */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {rs && (
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold backdrop-blur-md', rs.badge)}>
              {rs.emoji} <ResultText text={achievement.result} />
            </span>
          )}
          {achievement.year && (
            <span className="rounded-lg bg-black/60 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
              {achievement.year}
            </span>
          )}
        </div>
        {achievement.is_featured && (
          <div className="border-amber-500/30 bg-amber-500/15 text-amber-300 absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold backdrop-blur-md">
            ⭐ Featured
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category tags */}
        {categories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-white/10 bg-white/4 px-2.5 py-0.5 font-mono text-[9px] font-bold text-zinc-400 uppercase"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-heading group-hover:text-neon-lime mb-2 line-clamp-2 text-lg font-black tracking-tight text-white uppercase transition-colors">
          {achievement.title}
        </h3>

        {achievement.contest_name && (
          <p className="mb-2 line-clamp-1 font-mono text-[11px] text-zinc-500">
            {achievement.contest_name}
          </p>
        )}

        {achievement.description && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed font-light text-zinc-500">
            {achievement.description}
          </p>
        )}

        <div className="mt-auto" />

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/6 pt-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
            {achievement.is_team ? (
              <>
                <span>👥</span>
                <span className="max-w-[130px] truncate">
                  {achievement.team_name ?? 'Team'}
                </span>
              </>
            ) : participants.length > 0 ? (
              <>
                <span>👤</span>
                <span className="max-w-[130px] truncate">
                  {participants[0]}
                </span>
              </>
            ) : null}
          </div>
          <span className="text-neon-lime flex items-center gap-1 font-mono text-[10px] font-bold uppercase transition-transform group-hover:translate-x-1">
            Details
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
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
  const rs = getResultStyle(record.result);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${record.contest_name}`}
      className="group focus-visible:ring-neon-lime/50 relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#08090f] transition-all duration-500 hover:border-neon-lime/30 hover:shadow-[0_0_40px_-12px_rgba(182,243,107,0.2)] focus-visible:ring-2 focus-visible:outline-none"
    >
      {/* Cover */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-t-2xl">
        <Image
          src={record.featured_photo?.url ?? '/placeholder-event.png'}
          alt={record.featured_photo?.name ?? record.contest_name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#08090f] via-black/30 to-transparent" />
        {/* Top badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {rs && (
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold backdrop-blur-md', rs.badge)}>
              {rs.emoji} <ResultText text={record.result} />
            </span>
          )}
          <span className="rounded-lg bg-black/60 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
            {record.year}
          </span>
        </div>
        {record.is_team && (
          <div className="border-sky-500/30 bg-sky-500/15 text-sky-300 absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold backdrop-blur-md">
            👥 Team
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
          {catEmoji} {record.category ?? 'Contest'}
        </div>
        <h4 className="font-heading group-hover:text-neon-lime mb-2 line-clamp-2 text-lg font-black tracking-tight text-white uppercase transition-colors">
          {record.contest_name}
        </h4>

        {record.achievements && (
          <div className="mb-3">
            <span className="border-violet-500/20 bg-violet-500/8 text-violet-300 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase">
              🏆 {record.achievements.title}
            </span>
          </div>
        )}

        <div className="mt-auto" />

        {/* Footer */}
        <div className="border-t border-white/6 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {record.is_team ? (
                <>
                  <div className="bg-sky-500/15 ring-sky-500/20 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1">
                    <span className="text-xs">👥</span>
                  </div>
                  <p className="max-w-[120px] truncate font-mono text-[10px] font-semibold text-zinc-400">
                    {record.team_name || 'Team'}
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-neon-lime/15 ring-neon-lime/20 relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1">
                    {record.users?.avatar_url ? (
                      <Image
                        src={record.users.avatar_url}
                        alt={record.users.full_name ?? ''}
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-neon-lime flex h-full w-full items-center justify-center font-mono text-xs font-bold">
                        {(
                          record.users?.full_name?.[0] ??
                          members[0]?.name?.[0] ??
                          '?'
                        ).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="max-w-[120px] truncate font-mono text-[10px] text-zinc-400">
                    {record.users?.full_name ?? members[0]?.name ?? 'Unknown'}
                  </p>
                </>
              )}
            </div>
            <span className="text-neon-lime flex items-center gap-1 font-mono text-[10px] font-bold uppercase transition-transform group-hover:translate-x-1">
              Details
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </span>
          </div>

          {/* Team member avatar stack */}
          {record.is_team && members.length > 0 && (
            <div className="mt-2.5 flex items-center">
              <div className="flex -space-x-1.5">
                {members.slice(0, 4).map((m, i) => (
                  <div
                    key={i}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-[#08090f] bg-white/8 font-mono text-[8px] font-bold text-zinc-400"
                    title={m.name}
                  >
                    {(m.name?.[0] ?? '?').toUpperCase()}
                  </div>
                ))}
              </div>
              {members.length > 4 && (
                <span className="ml-1.5 font-mono text-[9px] text-zinc-600">
                  +{members.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
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
  settings = {},
}) {
  // ── Tab state ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('achievements');

  // ── Search state ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

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

  // ── Leaderboard state ────────────────────────────────────────────────────
  const [leaderboardYearFilter, setLeaderboardYearFilter] = useState('All');
  const [leaderboardCatFilter, setLeaderboardCatFilter] = useState('All');
  const [leaderboardPage, setLeaderboardPage] = useState(1);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedParticipation, setSelectedParticipation] = useState(null);

  // ── Scroll refs & callbacks ──────────────────────────────────────────────
  const gridRef = useRef(null);
  const leaderboardRef = useRef(null);

  const scrollToGrid = useCallback(() => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const changeLeaderboardPage = useCallback((p) => {
    setLeaderboardPage(p);
    setTimeout(() => {
      leaderboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  const changeAchPage = useCallback((p) => {
    setAchPage(p);
    setTimeout(() => scrollToGrid(), 50);
  }, [scrollToGrid]);

  const changeParticipPage = useCallback((p) => {
    setParticipatPage(p);
    setTimeout(() => scrollToGrid(), 50);
  }, [scrollToGrid]);

  // ── Data ─────────────────────────────────────────────────────────────────
  const achievements = propAchievements;

  // ── Leaderboard Calculations ─────────────────────────────────────────────
  const contestTotals = useMemo(() => {
    const totals = {};
    propParticipations.forEach((p) => {
      if (p.result) {
        const cleaned = p.result.replace(/\*/g, '');
        const outOfMatch = cleaned.match(/(\d+)\s+out\s+of\s+(\d+)/i);
        if (outOfMatch) {
          const total = parseInt(outOfMatch[2], 10);
          if (total && (!totals[p.contest_name] || total > totals[p.contest_name])) {
            totals[p.contest_name] = total;
          }
        }
      }
    });
    return totals;
  }, [propParticipations]);

  const leaderboardCategories = useMemo(() => {
    const teamCats = propParticipations
      .filter((p) => p.is_team && p.team_name)
      .map((p) => p.category)
      .filter(Boolean);
    const uniqueCats = [...new Set(teamCats)].sort();
    return ['All', ...uniqueCats];
  }, [propParticipations]);

  const leaderboardYears = useMemo(() => {
    const teamYears = propParticipations
      .filter((p) => p.is_team && p.team_name)
      .map((p) => p.year)
      .filter(Boolean);
    const uniqueYears = [...new Set(teamYears)].sort((a, b) => b - a);
    return ['All', ...uniqueYears.map(String)];
  }, [propParticipations]);

  const leaderboardEntries = useMemo(() => {
    const entries = [];
    propParticipations.forEach((p) => {
      if (!p.is_team || !p.team_name) return;
      
      const parsed = parseResultRankTotal(p.result, p.contest_name, contestTotals);
      if (!parsed) return;
      
      // Only show entries that have a parsed numerical rank (e.g. 1st, 2nd, 3rd, or X out of Y) and exclude those marked as "Participated"
      if (parsed.rank === null || !p.result || p.result.toLowerCase().includes('participat')) return;
      
      // Filter by Year and Category
      if (leaderboardYearFilter !== 'All' && String(p.year) !== leaderboardYearFilter) return;
      if (leaderboardCatFilter !== 'All' && p.category !== leaderboardCatFilter) return;
      
      entries.push({
        ...p,
        rank: parsed.rank,
        total: parsed.total,
        topPercentage: parsed.topPercentage,
        percentile: parsed.percentile,
      });
    });
    
    return entries
      .sort((a, b) => {
        if (b.percentile !== a.percentile) {
          return b.percentile - a.percentile;
        }
        if (a.rank !== null && b.rank !== null) {
          if (a.rank !== b.rank) {
            return a.rank - b.rank;
          }
        } else if (a.rank !== null) {
          return -1;
        } else if (b.rank !== null) {
          return 1;
        }
        return b.year - a.year;
      });
  }, [propParticipations, contestTotals, leaderboardYearFilter, leaderboardCatFilter]);

  const LEADERBOARD_PAGE_SIZE = 10;
  
  const leaderboardTotalPages = Math.ceil(
    leaderboardEntries.length / LEADERBOARD_PAGE_SIZE
  );
  const leaderboardCurrentPage = Math.min(leaderboardPage, leaderboardTotalPages || 1);
  
  const paginatedLeaderboardEntries = useMemo(() => {
    return leaderboardEntries.slice(
      (leaderboardCurrentPage - 1) * LEADERBOARD_PAGE_SIZE,
      leaderboardCurrentPage * LEADERBOARD_PAGE_SIZE
    );
  }, [leaderboardEntries, leaderboardCurrentPage]);

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
  const knownCategoryOrder = Object.keys(CATEGORY_ICONS).filter(
    (name) => name !== 'All'
  );
  const categories = [
    { name: 'All', icon: CATEGORY_ICONS.All },
    // Known categories present in the data, in registry order
    ...knownCategoryOrder
      .filter((name) => categorySet.has(name))
      .map((name) => ({ name, icon: CATEGORY_ICONS[name] })),
    // Any other categories found in the data
    ...[...categorySet]
      .filter((name) => !knownCategoryOrder.includes(name))
      .sort()
      .map((name) => ({ name, icon: DEFAULT_CATEGORY_ICON })),
  ];

  // Filtered achievements — applies all filters + search
  const filteredAchievements = useMemo(() => {
    let rows = [...achievements];
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter((a) =>
        [a.title, a.contest_name, a.team_name, a.description, ...(Array.isArray(a.participants) ? a.participants : [])]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q))
      );
    }
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
    searchQuery,
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
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter((r) =>
        [r.contest_name, r.team_name, r.category, r.notes, ...(r.team_members ?? []).map((m) => m.name)]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q))
      );
    }
    if (participCatFilter !== 'All')
      rows = rows.filter((r) => r.category === participCatFilter);
    if (participYearFilter !== 'All')
      rows = rows.filter((r) => String(r.year) === participYearFilter);
    return rows;
  }, [propParticipations, searchQuery, participCatFilter, participYearFilter]);

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
    <main className="relative min-h-screen overflow-x-clip bg-[#05060B] text-white">
      {/* ══════════════════════ HERO ══════════════════════ */}
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
                {settings?.achievements_page_badge || 'Achievements · NEUPC'}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="kinetic-headline font-heading text-[clamp(2.8rem,11vw,7rem)] leading-none font-black text-white uppercase select-none"
            >
              {(() => {
                const title =
                  settings?.achievements_page_title || 'Hall of Achievements';
                if (title.includes(' ')) {
                  return (
                    <>
                      {title.split(' ').slice(0, -1).join(' ')}
                      <br />
                      <span className="neon-text">
                        {title.split(' ').slice(-1)[0]}
                      </span>
                    </>
                  );
                }
                return <span className="neon-text">{title}</span>;
              })()}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="max-w-lg text-sm leading-relaxed text-zinc-400 sm:max-w-xl sm:text-base lg:text-lg"
            >
              {settings?.achievements_page_description ||
                'Every trophy, ranking, and milestone earned by NEUPC members — a record of excellence in competitive programming.'}
            </motion.p>

            {/* Status pill */}
            <motion.div
              variants={fadeUp}
              className="border-neon-lime/20 bg-neon-lime/8 text-neon-lime inline-flex items-center gap-2.5 rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase sm:px-5 sm:py-2.5 sm:text-[11px]"
            >
              <span className="pulse-dot bg-neon-lime h-1.5 w-1.5 rounded-full" />
              {propAchievements.length > 0
                ? `${propAchievements.length} Achievements on Record`
                : 'Building our legacy'}
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              className="border-t border-white/8 pt-6 sm:pt-8"
            >
              <div className="grid grid-cols-4 divide-x divide-white/8">
                <div className="pr-3 sm:pr-6 lg:pr-8">
                  <StatTile
                    value={<><AnimatedCounter value={propAchievements.length} />+</>}
                    label="Achievements"
                    mobileLabel="Total"
                  />
                </div>
                <div className="px-3 sm:px-6 lg:px-8">
                  <StatTile
                    value={<><AnimatedCounter value={medalistCount} />+</>}
                    label="Medalists"
                    accent
                  />
                </div>
                <div className="px-3 sm:px-6 lg:px-8">
                  <StatTile
                    value={<><AnimatedCounter value={propParticipations.length} />+</>}
                    label="Participations"
                    mobileLabel="Events"
                  />
                </div>
                <div className="pl-3 sm:pl-6 lg:pl-8">
                  <StatTile
                    value={<><AnimatedCounter value={yearsActive} />+</>}
                    label="Years Active"
                    mobileLabel="Years"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <ScrollCue />
      </section>

      {/* ══════════════════════ FEATURED CAROUSEL ══════════════════════ */}
      {featuredAchievements.length > 0 && (
        <section className="bg-[#05060B] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              tag="Recognition / 001"
              title="Featured"
              accent="Victory"
              onMount
            />
            <FeaturedAchievementsCarousel
              items={featuredAchievements}
              onSelect={setSelectedAchievement}
            />
          </div>
        </section>
      )}

      {/* ══════════════════════ UNIFIED TROPHY CASE ══════════════════════ */}
      <section
        id="achievements"
        ref={gridRef}
        className="bg-[#05060B] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        style={{ scrollMarginTop: '80px' }}
      >
        <div className="mx-auto max-w-7xl space-y-10 sm:space-y-12">
          <SectionHeading
            tag="Operations Log / 002"
            title="The"
            accent="Archive"
          />

          {/* Search + Tab + Filters */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="glass-panel space-y-3 rounded-2xl p-3 sm:p-4"
          >
            {/* Search bar + Tab toggle row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <SearchIcon className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setAchPage(1);
                    setParticipatPage(1);
                  }}
                  placeholder={activeTab === 'achievements' ? 'Search achievements, contests, teams...' : 'Search contests, teams, categories...'}
                  className="w-full rounded-xl border border-white/8 bg-white/3 py-2 pr-3 pl-9 font-mono text-[11px] text-zinc-300 placeholder:text-zinc-600 transition-all focus:border-neon-lime/30 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Tab toggle */}
              {propParticipations.length > 0 && (
                <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-white/8 bg-white/2 p-0.5">
                  {[
                    { key: 'achievements', label: '🏆 Achievements', count: propAchievements.length },
                    { key: 'participations', label: '📋 Participations', count: propParticipations.length },
                  ].map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveTab(key);
                        setSearchQuery('');
                      }}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all',
                        activeTab === key
                          ? 'bg-neon-lime/15 text-neon-lime shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      {label}
                      <span className={cn(
                        'rounded-full px-1.5 py-0.5 text-[8px] tabular-nums',
                        activeTab === key ? 'bg-neon-lime/20 text-neon-lime' : 'bg-white/5 text-zinc-600'
                      )}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conditional filter row */}
            {activeTab === 'achievements' ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-white/6 pt-3">
                {/* Category pills */}
                <div className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {categories.map((category) => {
                    const isActive = activeFilter === category.name;
                    return (
                      <button
                        key={category.name}
                        onClick={() => { setActiveFilter(category.name); setAchPage(1); }}
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-wider uppercase transition-all',
                          isActive
                            ? 'bg-neon-lime text-black shadow-[0_0_16px_-4px_rgba(182,243,107,0.5)]'
                            : 'hover:border-neon-lime/30 hover:text-neon-lime border border-white/10 text-zinc-500'
                        )}
                      >
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Compact dropdowns */}
                <div className="flex items-center gap-2">
                  {achievementYears.length > 2 && (
                    <FilterSelect value={achYearFilter} onChange={(v) => { setAchYearFilter(v); setAchPage(1); }} options={achievementYears} label="Year" />
                  )}
                  <FilterSelect value={achTypeFilter} onChange={(v) => { setAchTypeFilter(v); setAchPage(1); }} options={['All', 'Team', 'Individual']} label="Type" />
                  {hasActiveAchievementFilters && (
                    <button onClick={resetAchievementFilters} className="text-neon-lime hover:bg-neon-lime/10 rounded-lg p-1.5 transition-colors" title="Clear filters">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                  <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                    <span className="text-neon-lime font-bold">{filteredAchievements.length}</span> result{filteredAchievements.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 border-t border-white/6 pt-3">
                {/* Category pills */}
                <div className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {participationCategories.map((cat) => {
                    const isActive = participCatFilter === cat;
                    const emoji = cat !== 'All' ? (PARTICIPATION_CATEGORY_EMOJI[cat] ?? '🎯') : '✦';
                    return (
                      <button
                        key={cat}
                        onClick={() => { setParticipatCatFilter(cat); setParticipatPage(1); }}
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-wider uppercase transition-all',
                          isActive
                            ? 'bg-neon-lime text-black shadow-[0_0_16px_-4px_rgba(182,243,107,0.5)]'
                            : 'hover:border-neon-lime/30 hover:text-neon-lime border border-white/10 text-zinc-500'
                        )}
                      >
                        <span>{emoji}</span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  {participationYears.length > 2 && (
                    <FilterSelect value={participYearFilter} onChange={(v) => { setParticipatYearFilter(v); setParticipatPage(1); }} options={participationYears} label="Year" />
                  )}
                  {hasActiveParticipationFilters && (
                    <button onClick={resetParticipationFilters} className="text-neon-lime hover:bg-neon-lime/10 rounded-lg p-1.5 transition-colors" title="Clear filters">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                  <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                    <span className="text-neon-lime font-bold">{filteredParticipations.length}</span> record{filteredParticipations.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Conditional Grid */}
          {activeTab === 'achievements' ? (
            filteredAchievements.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No Achievements Found"
                description="Try different filters or clear your selection"
                onClear={hasActiveAchievementFilters ? resetAchievementFilters : undefined}
              />
            ) : (
              <>
                <motion.div
                  key={`ach-${activeFilter}-${achYearFilter}-${achTypeFilter}-${achResultFilter}-${achCurrentPage}-${searchQuery}`}
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3"
                >
                  {paginatedAchievements.map((achievement) => (
                    <motion.div key={achievement.id} variants={cardReveal} className="h-full">
                      <AchievementCard achievement={achievement} onClick={() => setSelectedAchievement(achievement)} />
                    </motion.div>
                  ))}
                </motion.div>
                <InlinePagination
                  currentPage={achCurrentPage}
                  totalPages={achTotalPages}
                  total={filteredAchievements.length}
                  perPage={ACHIEVEMENT_PAGE_SIZE}
                  onPageChange={changeAchPage}
                  itemLabel="achievement"
                />
              </>
            )
          ) : (
            filteredParticipations.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No Records Found"
                description="Try different filters or clear your selection"
                onClear={hasActiveParticipationFilters ? resetParticipationFilters : undefined}
              />
            ) : (
              <>
                <motion.div
                  key={`part-${participCatFilter}-${participYearFilter}-${participCurrentPage}-${searchQuery}`}
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3"
                >
                  {paginatedParticipations.map((record) => (
                    <motion.div key={record.id} variants={cardReveal} className="h-full">
                      <ParticipationRecordCard record={record} onClick={() => setSelectedParticipation(record)} />
                    </motion.div>
                  ))}
                </motion.div>
                <InlinePagination
                  currentPage={participCurrentPage}
                  totalPages={participTotalPages}
                  total={filteredParticipations.length}
                  perPage={PARTICIPATION_PAGE_SIZE}
                  onPageChange={changeParticipPage}
                  itemLabel="record"
                />
              </>
            )
          )}
        </div>
      </section>

        {/* ══════════════════════ TEAM LEADERBOARD ══════════════════════ */}
      <section ref={leaderboardRef} className="bg-[#05060B] px-4 py-16 sm:px-6 sm:py-20 lg:px-8" style={{ scrollMarginTop: '80px' }}>
        <div className="mx-auto max-w-7xl space-y-10 sm:space-y-12">
          <SectionHeading
            tag="Performance Index / 003"
            title="Top"
            accent="Performances"
          />

          {/* Leaderboard Panel */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="glass-panel space-y-6 rounded-2xl p-4 sm:p-6"
          >
            {/* Header / Filters row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                  Filters:
                </span>
                <FilterSelect
                  value={leaderboardYearFilter}
                  onChange={(v) => {
                    setLeaderboardYearFilter(v);
                    setLeaderboardPage(1);
                  }}
                  options={leaderboardYears}
                  label="Filter by Year"
                />
                <FilterSelect
                  value={leaderboardCatFilter}
                  onChange={(v) => {
                    setLeaderboardCatFilter(v);
                    setLeaderboardPage(1);
                  }}
                  options={leaderboardCategories}
                  label="Filter by Category"
                />
              </div>
              <span className="font-mono text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                {leaderboardEntries.length} Record{leaderboardEntries.length !== 1 ? 's' : ''} on Leaderboard
              </span>
            </div>

            {/* Rows list — self-animating + re-keyed per page (mirrors the
                Archive grid) so paginated rows always render, never blank */}
            <motion.div
              key={`lb-${leaderboardYearFilter}-${leaderboardCatFilter}-${leaderboardCurrentPage}`}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {paginatedLeaderboardEntries.length > 0 ? (
                paginatedLeaderboardEntries.map((entry, index) => {
                  const absoluteIndex = (leaderboardCurrentPage - 1) * LEADERBOARD_PAGE_SIZE + index;
                  return (
                    <motion.div
                      key={entry.id}
                      variants={cardReveal}
                      className="group/row relative flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between md:gap-6"
                    >
                      {/* Left: Rank + Rank Bar + Team & Contest Info */}
                      <div className="flex flex-1 items-center gap-4 min-w-0">
                        {/* Leaderboard Rank */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-heading text-lg font-black select-none bg-white/3 border border-white/5">
                          {(() => {
                            if (absoluteIndex === 0) return <span className="text-xl" title="1st Place">🥇</span>;
                            if (absoluteIndex === 1) return <span className="text-xl" title="2nd Place">🥈</span>;
                            if (absoluteIndex === 2) return <span className="text-xl" title="3rd Place">🥉</span>;
                            return <span className="text-zinc-500 font-mono text-sm">#{absoluteIndex + 1}</span>;
                          })()}
                        </div>

                        {/* Rank progress bar */}
                        <LeaderboardRankProgressBar topPercentage={entry.topPercentage} />

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h4 className="font-heading text-base font-black text-white group-hover/row:text-neon-lime transition-colors">
                              {entry.team_name}
                            </h4>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                              {entry.category}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500">
                              {entry.year}
                            </span>
                          </div>

                          <p className="mt-1 font-mono text-[10px] tracking-wider text-zinc-400 uppercase truncate">
                            {entry.contest_url ? (
                              <a
                                href={entry.contest_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-neon-lime hover:underline inline-flex items-center gap-1"
                              >
                                {entry.contest_name}
                                <svg className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              entry.contest_name
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: Team Members + Result Percentile */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-3 md:border-t-0 md:pt-0 md:justify-end md:gap-8">
                        {/* Team members */}
                        {Array.isArray(entry.team_members) && entry.team_members.length > 0 && (
                          <div className="flex flex-col gap-1 md:items-end">
                            <span className="font-mono text-[8px] tracking-[0.2em] text-zinc-500 uppercase">
                              Team Members
                            </span>
                            <div className="flex flex-wrap gap-1.5 md:justify-end">
                              {entry.team_members.map((member, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-lg bg-white/5 border border-white/5 px-2 py-0.5 font-mono text-[9px] text-zinc-300"
                                >
                                  {member.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rank Percentile Pill */}
                        <div className="text-right shrink-0">
                          <div className="font-heading text-lg font-black text-neon-lime">
                            Top {entry.topPercentage.toFixed(1)}%
                          </div>
                          <div className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
                            {entry.result}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <div className="text-2xl">🔍</div>
                  <p className="font-heading text-sm font-bold text-white">
                    No leaderboard records found
                  </p>
                  <p className="font-mono text-[9px] tracking-wider text-zinc-600 uppercase">
                    Try clearing or modifying the filters
                  </p>
                </div>
              )}
            </motion.div>

            {/* Pagination */}
            {leaderboardTotalPages > 1 && (
              <InlinePagination
                currentPage={leaderboardCurrentPage}
                totalPages={leaderboardTotalPages}
                total={leaderboardEntries.length}
                perPage={LEADERBOARD_PAGE_SIZE}
                onPageChange={changeLeaderboardPage}
                itemLabel="team performance"
              />
            )}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section className="relative overflow-hidden bg-[#05060B] py-20 sm:py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="grid-overlay absolute inset-0 opacity-20" />
          <div className="bg-neon-lime/5 absolute top-1/2 left-1/2 h-[300px] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] sm:h-[500px] sm:blur-[140px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="mx-auto mb-10 max-w-2xl text-center"
          >
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="bg-neon-lime h-px w-8 sm:w-10" />
              <span className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.4em] uppercase sm:text-[11px]">
                Join Us
              </span>
              <span className="bg-neon-lime h-px w-8 sm:w-10" />
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="border-neon-lime/20 from-neon-lime/5 to-neon-violet/5 relative overflow-hidden rounded-2xl border bg-linear-to-br via-transparent p-6 sm:rounded-3xl sm:p-10 md:p-14"
          >
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
              <div className="md:col-span-2">
                <p className="text-neon-lime mb-2 font-mono text-[10px] font-bold tracking-[0.4em] uppercase sm:mb-3">
                  /// Next cohort
                </p>
                <h3 className="font-heading text-2xl leading-tight font-black text-white uppercase sm:text-3xl md:text-4xl">
                  {settings?.achievements_page_cta_title || (<>Ready to Write Your <span className="neon-text">Legacy?</span></>)}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed font-light text-zinc-400 sm:mt-4">
                  {settings?.achievements_page_cta_subtitle || 'Join NEUPC and compete alongside the best problem solvers in the country. Applications are open.'}
                </p>
              </div>
              <div className="flex flex-row flex-wrap items-center gap-3 md:flex-col md:items-end md:gap-3">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    href="/account"
                    className="group bg-neon-lime font-heading focus-visible:ring-neon-lime inline-flex items-center gap-2 rounded-full px-6 py-3 text-[10px] font-bold tracking-widest text-black uppercase shadow-[0_0_40px_-10px_rgba(182,243,107,0.6)] transition-shadow hover:shadow-[0_0_60px_-5px_rgba(182,243,107,0.8)] focus-visible:ring-2 focus-visible:outline-none sm:px-8 sm:py-3.5 sm:text-[11px]"
                  >
                    Apply now
                    <span
                      aria-hidden
                      className="transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ x: 2 }}>
                  <Link
                    href="/contact"
                    className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 uppercase underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none sm:text-[11px]"
                  >
                    Or talk to us →
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <ScrollToTop />

      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailModal
            achievement={selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedParticipation && (
          <ParticipationDetailModal
            record={selectedParticipation}
            onClose={() => setSelectedParticipation(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
