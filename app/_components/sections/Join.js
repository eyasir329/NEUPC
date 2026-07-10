/**
 * @file Join component
 * @module Join
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

// Variants
const headerVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};
const benefitsGrid = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const benefitCard = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};
const ctaVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

function BenefitCard({ benefit }) {
  const Icon = Icons[benefit.icon] || Icons.Sparkles;
  return (
    <motion.div
      variants={benefitCard}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="holographic-card group rounded-2xl p-5 sm:p-6"
    >
      <motion.div
        className="bg-neon-lime/10 text-neon-lime group-hover:bg-neon-lime mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors group-hover:text-black sm:mb-5 sm:h-11 sm:w-11"
        whileHover={{ rotate: 6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </motion.div>
      <h3 className="font-heading mb-2 text-base font-bold text-white sm:text-lg">
        {benefit.title}
      </h3>
      <p className="text-sm leading-relaxed font-light text-zinc-400">
        {benefit.description}
      </p>
    </motion.div>
  );
}

function Join({ benefits, settings = {} }) {
  const items = Array.isArray(benefits) ? benefits : [];

  return (
    <section className="relative overflow-hidden pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-32 lg:pb-14">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="grid-overlay absolute inset-0 opacity-20" />
        <div className="bg-neon-lime/5 absolute top-1/2 left-1/2 h-75 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] sm:h-125 sm:blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          variants={headerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px 0px' }}
          className="mx-auto mb-12 max-w-3xl text-center sm:mb-16"
        >
          <div className="mb-4 flex items-center justify-center gap-3 sm:mb-5 sm:gap-4">
            <span className="bg-neon-lime h-px w-8 sm:w-10" />
            <span className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.4em] uppercase sm:text-[11px] sm:tracking-[0.5em]">
              {settings?.homepage_join_badge || 'Membership'}
            </span>
            <span className="bg-neon-lime h-px w-8 sm:w-10" />
          </div>
          <h2 className="kinetic-headline font-heading text-4xl font-black text-white uppercase sm:text-5xl md:text-6xl">
            {settings?.homepage_join_title || (
              <>
                Join the <span className="neon-text">Signal.</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-xl px-2 text-sm leading-relaxed font-light text-zinc-400 sm:mt-6 sm:px-0 sm:text-base">
            {settings?.homepage_join_subtitle ||
              'Membership is free. What you get in return is a network, a craft, and a reason to keep shipping.'}
          </p>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          variants={benefitsGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px 0px' }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
        >
          {items.map((benefit, i) => (
            <BenefitCard key={benefit.title || i} benefit={benefit} />
          ))}
        </motion.div>

        {/* CTA block */}
        <motion.div
          variants={ctaVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px 0px' }}
          className="border-neon-lime/20 from-neon-lime/5 to-neon-violet/5 relative mt-10 overflow-hidden rounded-2xl border bg-linear-to-br via-transparent p-6 sm:mt-12 sm:rounded-3xl sm:p-10 md:p-14 lg:mt-16 lg:p-16"
        >
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
            {/* Text */}
            <div className="md:col-span-2">
              <p className="text-neon-lime mb-2 font-mono text-[10px] font-bold tracking-[0.4em] uppercase sm:mb-3">
                /// Next cohort
              </p>
              <h3 className="font-heading text-2xl leading-tight font-black text-white uppercase sm:text-3xl md:text-4xl">
                {settings?.homepage_join_cta_title ||
                  'Ready to compete at the highest level?'}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed font-light text-zinc-400 sm:mt-4">
                {settings?.homepage_join_cta_description ||
                  'Applications are open. Submit once, and our committee reviews within a week.'}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-row flex-wrap items-center gap-3 md:flex-col md:items-end md:gap-3">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/account"
                  className="group bg-neon-lime font-heading focus-visible:ring-neon-lime inline-flex items-center gap-2 rounded-full px-6 py-3 text-[10px] font-bold tracking-widest text-black uppercase shadow-[0_0_40px_-10px_rgba(182,243,107,0.6)] transition-shadow hover:shadow-[0_0_60px_-5px_rgba(182,243,107,0.8)] focus-visible:ring-2 focus-visible:outline-none sm:px-8 sm:py-3.5 sm:text-[11px]"
                >
                  {settings?.homepage_join_cta_button || 'Apply now'}
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
  );
}

export default Join;
