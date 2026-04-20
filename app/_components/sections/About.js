'use client';

/**
 * @file About
 * @module About
 */

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/app/_lib/utils';
import { useScrollReveal } from '@/app/_lib/hooks';

const DEFAULTS = {
  title: 'Who We Are',
  description1:
    "NEUPC is the nexus of algorithmic thought and software craftsmanship at Netrokona University. We are a collective of developers, researchers, and visionaries pushing the boundaries of what's possible in the digital realm.",
  description2:
    'The club serves as a platform where students can explore competitive programming, software development, research discussions, and emerging technologies beyond the academic syllabus.',
};

function About({ data = {}, settings = {} }) {
  const [ref, visible] = useScrollReveal({ threshold: 0.08 });

  const {
    title = DEFAULTS.title,
    description1 = DEFAULTS.description1,
    description2 = DEFAULTS.description2,
  } = data;

  return (
    <section className="relative overflow-hidden py-32">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="bg-neon-violet/5 absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-screen-2xl px-8">
        <div
          ref={ref}
          className={cn(
            'grid grid-cols-1 items-center gap-20 transition-all duration-700 lg:grid-cols-12',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          )}
        >
          {/* ── Content ──────────────────────────────────────────── */}
          <div className="space-y-12 lg:col-span-7">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <span className="h-[1px] w-10 bg-violet-600 dark:bg-neon-violet" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.5em] text-violet-600 dark:text-neon-violet">
                  Genesis / 001
                </span>
              </div>
              <h2 className="kinetic-headline font-heading text-6xl font-black text-slate-900 uppercase md:text-7xl dark:text-white">
                {title}
              </h2>
            </div>

            <p className="max-w-2xl font-sans text-lg leading-loose font-light text-slate-600 dark:text-zinc-400">
              {description1}
            </p>

            {description2 && (
              <p className="max-w-2xl font-sans text-base leading-loose font-light text-slate-500 dark:text-zinc-500">
                {description2}
              </p>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="glass-panel border-l-neon-lime rounded-2xl border-l-4 p-6 transition-all hover:-translate-y-1">
                <h4 className="font-heading mb-3 text-[12px] font-bold uppercase tracking-widest text-emerald-600 dark:text-neon-lime">
                  Mission
                </h4>
                <p className="text-sm leading-relaxed font-medium text-slate-600 dark:text-zinc-400">
                  {settings?.mission ||
                    'Empowering students through technical leadership and hands-on system architecture.'}
                </p>
              </div>
              <div className="glass-panel border-l-neon-violet rounded-2xl border-l-4 p-6 transition-all hover:-translate-y-1">
                <h4 className="font-heading mb-3 text-[12px] font-bold uppercase tracking-widest text-violet-600 dark:text-neon-violet">
                  Vision
                </h4>
                <p className="text-sm leading-relaxed font-medium text-slate-600 dark:text-zinc-400">
                  {settings?.vision ||
                    'To be the primary incubator for future tech architects in the region.'}
                </p>
              </div>
            </div>

            <Link
              href="/about"
              className="group font-heading dark:hover:border-neon-lime dark:hover:text-neon-lime inline-flex items-center gap-2 rounded-full border border-slate-300 px-8 py-3.5 text-[11px] font-bold tracking-widest text-slate-700 uppercase transition-all hover:border-slate-900 hover:text-slate-900 dark:border-white/15 dark:text-zinc-300"
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

          {/* ── Visual ───────────────────────────────────────────── */}
          <div className="relative lg:col-span-5">
            <div
              className={cn(
                'ph-violet soft-glow-violet relative aspect-[4/5] w-full overflow-hidden rounded-3xl transition-all duration-700',
                visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              )}
              style={{ transitionDelay: visible ? '300ms' : '0ms' }}
            >
              {/* Corner meta */}
              <div className="absolute top-6 left-6 font-mono text-[10px] font-bold tracking-[0.4em] uppercase">
                /// IDENTITY
              </div>
              <div className="absolute top-6 right-6 font-mono text-[10px] font-bold tracking-[0.3em] uppercase opacity-70">
                v1.0
              </div>

              {/* Logo mark, centered */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-neon-violet/30 bg-deep-void/50 flex h-40 w-40 items-center justify-center rounded-full border backdrop-blur-xl">
                  <Image
                    src="/logo.png"
                    alt={
                      settings?.site_name
                        ? `${settings.site_name} Logo`
                        : 'NEUPC Logo'
                    }
                    width={120}
                    height={120}
                    className="object-contain p-3"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Bottom caption */}
              <div className="absolute right-6 bottom-6 left-6 flex items-end justify-between">
                <div>
                  <div className="font-heading text-3xl leading-none font-black">
                    NEUPC
                  </div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.3em] uppercase opacity-70">
                    Netrokona Univ.
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] tracking-[0.3em] uppercase opacity-70">
                  Programming
                  <br />
                  Club
                </div>
              </div>
            </div>

            {/* Est. badge */}
            <div className="bg-neon-lime absolute -bottom-6 -left-6 flex h-24 w-24 rotate-6 flex-col items-center justify-center rounded-full border-4 border-white shadow-2xl dark:border-[#05060b]">
              <span className="font-heading text-xl leading-none font-black text-black italic">
                2024
              </span>
              <span className="mt-1 font-mono text-[8px] tracking-widest text-black/60 uppercase">
                Est.
              </span>
            </div>

            {/* Floating chip */}
            <div className="border-neon-lime/30 bg-neon-lime/10 absolute top-8 -right-4 -rotate-6 rounded-xl border px-4 py-2 backdrop-blur-xl">
              <span className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.3em] uppercase">
                Active · {settings?.member_count || '150+'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
