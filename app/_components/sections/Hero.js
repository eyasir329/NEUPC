/**
 * @file Hero
 * @module Hero
 */

import Link from 'next/link';

const DEFAULTS = {
  department: 'Dept of CSE',
  university: 'Netrokona University',
};

function Hero({ data = {}, settings = {} }) {
  const { department = DEFAULTS.department, university = DEFAULTS.university } =
    data;

  return (
    <section
      aria-label="Hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20"
    >
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="grid-overlay absolute inset-0 opacity-30" />
        <div className="bg-neon-violet/8 absolute top-1/2 left-1/2 h-200 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[160px]" />
        <div className="bg-neon-lime/8 absolute right-0 bottom-0 h-100 w-100 rounded-full blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-7xl flex-col items-start gap-8 px-8">
        {/* Eyebrow label */}
        <div className="flex items-center gap-4">
          <span className="bg-neon-lime pulse-dot inline-block h-1.5 w-1.5 rounded-full" />
          <span className="font-mono text-[11px] font-medium tracking-[0.35em] text-zinc-500 uppercase">
            {department} — {university}
          </span>
        </div>

        {/* Kinetic headline */}
        <h1 className="kinetic-headline font-heading text-[11vw] leading-none font-black text-white uppercase select-none md:text-[8rem]">
          ARCHITECT
          <br />
          <span className="text-stroke-lime text-transparent">THE</span>{' '}
          <span className="neon-text">FUTURE</span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-xl font-sans text-base leading-relaxed font-light text-zinc-400 md:text-lg">
          {settings?.hero_description ||
            "Join Netrokona University's premier programming community — compete, build, and grow alongside passionate engineers."}
        </p>

        {/* CTAs */}
        <div className="mt-2 flex flex-wrap gap-4">
          <Link
            href="/account"
            className="bg-neon-lime font-heading rounded-full px-8 py-3.5 text-[11px] font-bold tracking-widest text-black uppercase shadow-lg transition-all hover:bg-white"
          >
            Join the Club
          </Link>
          <Link
            href="/events"
            className="font-heading hover:border-neon-lime hover:text-neon-lime rounded-full border border-white/15 px-8 py-3.5 text-[11px] font-bold tracking-widest text-zinc-300 uppercase transition-all"
          >
            View Events
          </Link>
        </div>
      </div>

      {/* Bottom-left panel */}
      <div className="glass-panel absolute bottom-12 left-8 hidden max-w-65 rounded-2xl p-6 lg:block">
        <p className="text-neon-lime mb-2 font-mono text-[10px] font-bold tracking-[0.3em] uppercase">
          Est. 2024
        </p>
        <p className="font-sans text-[12px] leading-relaxed font-light text-zinc-400">
          Building a legacy of computational excellence in the heart of
          Netrokona.
        </p>
      </div>
    </section>
  );
}

export default Hero;
