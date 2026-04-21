'use client';

import Link from 'next/link';
import * as Icons from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { useScrollReveal } from '@/app/_lib/hooks';

const DEFAULT_BENEFITS = [
  {
    icon: 'Zap',
    title: 'Contest Access',
    description: 'Exclusive internal contests and national team selections.',
  },
  {
    icon: 'Users',
    title: 'Mentorship',
    description: 'Guidance from seniors who have competed at the highest level.',
  },
  {
    icon: 'BookOpen',
    title: 'Curated Learning',
    description: 'Roadmaps, resources, and weekly problem sets to sharpen skills.',
  },
  {
    icon: 'Trophy',
    title: 'Recognition',
    description: 'Showcase your wins on a platform built for problem solvers.',
  },
];

function BenefitCard({ benefit, index }) {
  const Icon = Icons[benefit.icon] || Icons.Sparkles;
  return (
    <div
      className="holographic-card group rounded-2xl p-5 sm:p-6"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-all group-hover:rotate-6 group-hover:bg-emerald-500 group-hover:text-white sm:mb-5 sm:h-11 sm:w-11 dark:bg-neon-lime/10 dark:text-neon-lime dark:group-hover:bg-neon-lime dark:group-hover:text-black">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <h3 className="mb-2 font-heading text-base font-bold text-slate-900 sm:text-lg dark:text-white">
        {benefit.title}
      </h3>
      <p className="text-sm font-light leading-relaxed text-slate-600 dark:text-zinc-400">
        {benefit.description}
      </p>
    </div>
  );
}

function Join({ benefits, settings = {} }) {
  const [ref, visible] = useScrollReveal({ threshold: 0.08 });
  const items =
    Array.isArray(benefits) && benefits.length > 0 ? benefits : DEFAULT_BENEFITS;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-32">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="grid-overlay absolute inset-0 opacity-20" />
        <div className="absolute left-1/2 top-1/2 h-75 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-lime/5 blur-[120px] sm:h-125 sm:blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>

        {/* Section header */}
        <div
          className={cn(
            'mx-auto mb-12 max-w-3xl text-center transition-all duration-700 sm:mb-16',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="mb-4 flex items-center justify-center gap-3 sm:mb-5 sm:gap-4">
            <span className="h-px w-8 bg-emerald-500 dark:bg-neon-lime sm:w-10" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-600 dark:text-neon-lime sm:text-[11px] sm:tracking-[0.5em]">
              Membership
            </span>
            <span className="h-px w-8 bg-emerald-500 dark:bg-neon-lime sm:w-10" />
          </div>
          <h2 className="kinetic-headline font-heading text-4xl font-black uppercase text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
            {settings?.homepage_join_title || (
              <>
                Join the <span className="neon-text">Signal.</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-xl px-2 text-sm font-light leading-relaxed text-slate-600 sm:mt-6 sm:px-0 sm:text-base dark:text-zinc-400">
            {settings?.homepage_join_subtitle ||
              'Membership is free. What you get in return is a network, a craft, and a reason to keep shipping.'}
          </p>
        </div>

        {/* Benefits grid — 1 col → 2 col sm → 4 col lg */}
        <div
          className={cn(
            'grid grid-cols-1 gap-4 transition-all duration-700 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          )}
          style={{ transitionDelay: visible ? '200ms' : '0ms' }}
        >
          {items.map((benefit, i) => (
            <BenefitCard key={benefit.title || i} benefit={benefit} index={i} />
          ))}
        </div>

        {/* CTA block */}
        <div
          className={cn(
            'relative mt-10 overflow-hidden rounded-2xl border border-neon-lime/20 bg-linear-to-br from-neon-lime/5 via-transparent to-neon-violet/5 p-6 transition-all duration-700 sm:mt-12 sm:rounded-3xl sm:p-10 md:p-14 lg:mt-16 lg:p-16',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          )}
          style={{ transitionDelay: visible ? '400ms' : '0ms' }}
        >
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
            {/* Text */}
            <div className="md:col-span-2">
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-600 sm:mb-3 dark:text-neon-lime">
                /// Next cohort
              </p>
              <h3 className="font-heading text-2xl font-black uppercase leading-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
                Ready to compete at the highest level?
              </h3>
              <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-slate-600 sm:mt-4 dark:text-zinc-400">
                Applications are open. Submit once, and our committee reviews within a week.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-row flex-wrap items-center gap-3 md:flex-col md:items-end md:gap-3">
              <Link
                href="/account"
                className="group inline-flex items-center gap-2 rounded-full bg-neon-lime px-6 py-3 font-heading text-[10px] font-bold uppercase tracking-widest text-black shadow-[0_0_40px_-10px_rgba(182,243,107,0.6)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_-5px_rgba(182,243,107,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:px-8 sm:py-3.5 sm:text-[11px]"
              >
                Apply now
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/contact"
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-none sm:text-[11px] dark:text-zinc-500 dark:hover:text-white"
              >
                Or talk to us →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Join;
