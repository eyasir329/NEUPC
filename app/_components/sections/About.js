'use client';

/**
 * @file About
 * @module About
 */

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';

const DEFAULTS = {
  title: 'Who We Are',
  description1:
    "NEUPC is the nexus of algorithmic thought and software craftsmanship at Netrokona University. We are a collective of developers, researchers, and visionaries pushing the boundaries of what's possible in the digital realm.",
  description2:
    'The club serves as a platform where students can explore competitive programming, software development, research discussions, and emerging technologies beyond the academic syllabus.',
};

// Animation variants
const headerVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};
const gridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const imageVariant = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};
const textVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

function About({ data = {}, settings = {} }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    title = DEFAULTS.title,
    description1 = DEFAULTS.description1,
    description2 = DEFAULTS.description2,
  } = data;

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Divider top */}
      <div className="dark:via-neon-violet/20 absolute top-0 left-1/2 h-px w-full -translate-x-1/2 bg-linear-to-r from-transparent via-slate-200 to-transparent" />

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="bg-neon-violet/5 absolute -top-20 left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full blur-[160px]" />
        <div className="bg-neon-lime/4 absolute right-0 bottom-0 h-[400px] w-[500px] rounded-full blur-[140px]" />
        <div className="grid-overlay absolute inset-0 opacity-20" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section header (centred, like other sections) ─── */}
        <motion.div
          variants={headerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px 0px' }}
          className="mb-16 space-y-5 text-center sm:mb-20"
        >
          <div className="flex items-center justify-center gap-4">
            <span className="bg-neon-violet h-px w-10" />
            <span className="text-neon-violet font-mono text-[11px] font-bold tracking-[0.5em] uppercase">
              Identity / 001
            </span>
            <span className="bg-neon-violet h-px w-10" />
          </div>
          <h2 className="kinetic-headline font-heading text-[clamp(1.85rem,8vw,4.5rem)] font-black whitespace-nowrap text-slate-900 uppercase dark:text-white">
            {title}
          </h2>
        </motion.div>

        {/* ── Main content grid ──────────────────────────────── */}
        <motion.div
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px 0px' }}
          className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:items-center lg:gap-16"
        >
          {/* ── Image column ─────────────────────────────────── */}
          <motion.div
            variants={imageVariant}
            className="relative lg:col-span-5"
          >
            {/* Card */}
            <div className="ph-violet soft-glow-violet relative mx-auto aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-3xl sm:max-w-[420px] lg:max-w-full">
              {/* Corner meta */}
              <div className="absolute top-5 left-5 z-10 font-mono text-[9px] font-bold tracking-[0.4em] uppercase opacity-75 sm:text-[10px]">
                {'/// IDENTITY'}
              </div>
              <div className="absolute top-5 right-5 z-10 font-mono text-[9px] font-bold tracking-[0.3em] uppercase opacity-55 sm:text-[10px]">
                v1.0
              </div>

              <Image
                src="/about.jpg"
                alt={
                  settings?.site_name
                    ? `${settings.site_name} About Section`
                    : 'NEUPC About Section'
                }
                fill
                sizes="(max-width: 640px) 360px, (max-width: 1024px) 420px, 38vw"
                className="object-cover object-center"
                loading="lazy"
              />

              {/* Gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#05060B]/85 via-[#05060B]/15 to-transparent" />

              {/* Bottom row: badge + caption in one aligned flex row */}
              <div className="absolute right-5 bottom-5 left-5 flex items-center justify-between gap-3">
                {/* Badge + label grouped */}
                <div className="flex items-center gap-3">
                  {/* Est. badge — small, inline */}
                  <div className="bg-neon-lime flex h-12 w-12 shrink-0 rotate-6 flex-col items-center justify-center rounded-full border-2 border-white shadow-lg dark:border-[#05060b]">
                    <span className="font-heading text-[11px] leading-none font-black text-black italic">
                      2025
                    </span>
                    <span className="font-mono text-[6px] tracking-widest text-black/60 uppercase">
                      Est.
                    </span>
                  </div>
                  {/* Club name */}
                  <div>
                    <div className="font-heading text-xl leading-none font-black text-white sm:text-2xl">
                      NEUPC
                    </div>
                    <div className="mt-0.5 font-mono text-[8px] tracking-[0.25em] text-white/60 uppercase sm:text-[9px]">
                      Netrokona University
                    </div>
                  </div>
                </div>
                {/* Right label */}
                <div className="text-right font-mono text-[8px] tracking-[0.25em] text-white/60 uppercase sm:text-[9px]">
                  Programming
                  <br />
                  Club
                </div>
              </div>
            </div>

            {/* Active chip */}
            <div className="border-neon-lime/30 bg-neon-lime/10 absolute top-8 -right-3 -rotate-6 rounded-xl border px-3 py-1.5 backdrop-blur-xl sm:-right-5 sm:px-4 sm:py-2">
              <span className="text-neon-lime font-mono text-[9px] font-bold tracking-[0.25em] uppercase sm:text-[10px]">
                Active · {settings?.member_count || '150+'}
              </span>
            </div>
          </motion.div>

          {/* ── Text column ──────────────────────────────────── */}
          <motion.div
            variants={textVariant}
            className="space-y-8 lg:col-span-7"
          >
            {/* Description */}
            <div className="space-y-4">
              <p className="font-sans text-base leading-[1.9] font-light text-slate-600 sm:text-lg dark:text-zinc-400">
                {description1}
              </p>

              {description2 && !isExpanded && (
                <div className="flex w-full justify-end md:justify-start">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="font-heading text-neon-lime inline-flex touch-manipulation items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors hover:opacity-80 sm:text-[11px]"
                  >
                    Read More
                    <span aria-hidden className="text-base leading-none">
                      +
                    </span>
                  </button>
                </div>
              )}

              {description2 && isExpanded && (
                <>
                  <p className="font-sans text-sm leading-[1.9] font-light text-slate-500 sm:text-base dark:text-zinc-500">
                    {description2}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="font-heading inline-flex touch-manipulation items-center gap-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-700 sm:text-[11px] dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    <span aria-hidden>−</span>
                    Collapse
                  </button>
                </>
              )}
            </div>

            {/* Mission / Vision */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="holographic-card group rounded-2xl p-5 sm:p-6">
                <div className="bg-neon-lime/10 mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl">
                  <svg
                    className="text-neon-lime h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h4 className="font-heading text-neon-lime mb-2 text-[11px] font-bold tracking-widest uppercase sm:text-[12px]">
                  Mission
                </h4>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  {settings?.mission ||
                    'Empowering students through technical leadership and hands-on system architecture.'}
                </p>
              </div>

              <div className="holographic-card group rounded-2xl p-5 sm:p-6">
                <div className="bg-neon-violet/10 mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl">
                  <svg
                    className="text-neon-violet h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
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
                </div>
                <h4 className="font-heading text-neon-violet mb-2 text-[11px] font-bold tracking-widest uppercase sm:text-[12px]">
                  Vision
                </h4>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  {settings?.vision ||
                    'To be the primary incubator for future tech architects in the region.'}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <Link
                href="/about"
                className="group font-heading hover:border-neon-violet hover:text-neon-violet focus-visible:ring-neon-violet inline-flex min-h-[44px] touch-manipulation items-center gap-2 rounded-full border border-slate-300 px-7 py-3 text-[10px] font-bold tracking-widest text-slate-700 uppercase transition-all focus-visible:ring-2 focus-visible:outline-none sm:px-8 sm:py-3.5 sm:text-[11px] dark:border-white/15 dark:text-zinc-300"
              >
                Learn More
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default About;
