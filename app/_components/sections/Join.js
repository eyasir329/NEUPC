'use client';

/**
 * @file Join — membership benefits + CTA
 * @module Join
 */

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
      className="holographic-card group rounded-2xl p-6"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-all group-hover:rotate-6 group-hover:bg-emerald-500 group-hover:text-white dark:bg-neon-lime/10 dark:text-neon-lime dark:group-hover:bg-neon-lime dark:group-hover:text-black">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-2 font-heading text-lg font-bold text-slate-900 dark:text-white">
        {benefit.title}
      </h3>
      <p className="font-sans text-sm font-light leading-relaxed text-slate-600 dark:text-zinc-400">
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
    <section className="relative overflow-hidden py-32">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="grid-overlay absolute inset-0 opacity-20" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-lime/5 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-8" ref={ref}>
        {/* Section header */}
        <div
          className={cn(
            'mx-auto mb-16 max-w-3xl text-center transition-all duration-700',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="mb-5 flex items-center justify-center gap-4">
            <span className="h-[1px] w-10 bg-emerald-500 dark:bg-neon-lime" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.5em] text-emerald-600 dark:text-neon-lime">
              Membership
            </span>
            <span className="h-[1px] w-10 bg-emerald-500 dark:bg-neon-lime" />
          </div>
          <h2 className="kinetic-headline font-heading text-5xl font-black uppercase text-slate-900 md:text-6xl dark:text-white">
            {settings?.homepage_join_title || (
              <>
                Join the <span className="neon-text">Signal.</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-sans text-base font-light leading-relaxed text-slate-600 dark:text-zinc-400">
            {settings?.homepage_join_subtitle ||
              'Membership is free. What you get in return is a network, a craft, and a reason to keep shipping.'}
          </p>
        </div>

        {/* Benefits grid */}
        <div
          className={cn(
            'grid grid-cols-1 gap-5 transition-all duration-700 md:grid-cols-2 lg:grid-cols-4',
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
            'relative mt-16 overflow-hidden rounded-3xl border border-neon-lime/20 bg-gradient-to-br from-neon-lime/5 via-transparent to-neon-violet/5 p-10 transition-all duration-700 md:p-16',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          )}
          style={{ transitionDelay: visible ? '400ms' : '0ms' }}
        >
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-600 dark:text-neon-lime">
                /// Next cohort
              </p>
              <h3 className="font-heading text-3xl font-black uppercase leading-tight text-slate-900 md:text-4xl dark:text-white">
                Ready to compete at the highest level?
              </h3>
              <p className="mt-4 max-w-xl font-sans text-sm font-light leading-relaxed text-slate-600 dark:text-zinc-400">
                Applications are open. Submit once, and our committee reviews
                within a week.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <Link
                href="/account"
                className="group inline-flex items-center gap-2 rounded-full bg-neon-lime px-8 py-3.5 font-heading text-[11px] font-bold uppercase tracking-widest text-black shadow-[0_0_40px_-10px_rgba(182,243,107,0.6)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_-5px_rgba(182,243,107,0.8)]"
              >
                Apply now
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/contact"
                className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline dark:text-zinc-500 dark:hover:text-white"
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
