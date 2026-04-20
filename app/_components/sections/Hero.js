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
      className="relative flex min-h-screen items-center overflow-hidden pt-32 pb-16"
    >
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="grid-overlay absolute inset-0 opacity-30" />
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-neon-violet/10 blur-[140px]" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-neon-lime/10 blur-[140px]" />
      </div>

      {/* Content grid */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-8 lg:grid-cols-12 lg:gap-12">
        {/* ── Left column: copy ───────────────────────────────── */}
        <div className="flex flex-col items-start gap-8 lg:col-span-7">
          {/* Eyebrow */}
          <div className="flex items-center gap-4">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-neon-lime" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.35em] text-slate-500 dark:text-zinc-500">
              {department} — {university}
            </span>
          </div>

          {/* Kinetic headline */}
          <h1 className="kinetic-headline select-none font-heading text-[12vw] font-black uppercase leading-none text-slate-900 md:text-[8rem] dark:text-white">
            CODE.
            <br />
            <span className="text-stroke-lime text-transparent">COMPETE.</span>
            <br />
            <span className="neon-text">CREATE.</span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-xl font-sans text-base font-light leading-relaxed text-slate-600 md:text-lg dark:text-zinc-400">
            {settings?.hero_description ||
              "Join Netrokona University's premier programming community — compete, build, and grow alongside passionate engineers."}
          </p>

          {/* CTAs */}
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/account"
              className="group inline-flex items-center gap-2 rounded-full bg-neon-lime px-8 py-3.5 font-heading text-[11px] font-bold uppercase tracking-widest text-black shadow-[0_0_40px_-10px_rgba(182,243,107,0.6)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_-5px_rgba(182,243,107,0.8)]"
            >
              Join the Club
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-8 py-3.5 font-heading text-[11px] font-bold uppercase tracking-widest text-slate-700 transition-all hover:border-slate-900 hover:text-slate-900 dark:border-white/15 dark:text-zinc-300 dark:hover:border-neon-lime dark:hover:text-neon-lime"
            >
              View Events
            </Link>
          </div>

          {/* Meta row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-200 pt-8 dark:border-white/5">
            {[
              ['150+', 'Members'],
              ['40+', 'Contests'],
              ['12', 'Awards'],
            ].map(([value, label]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                  {value}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-zinc-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column: decorative stack ─────────────────── */}
        <div className="relative hidden lg:col-span-5 lg:block">
          {/* Main portrait placeholder */}
          <div className="ph-lime relative aspect-[4/5] w-full overflow-hidden rounded-3xl soft-glow-lime">
            <div className="absolute left-6 top-6 font-mono text-[10px] font-bold uppercase tracking-[0.4em]">
              /// NEUPC.01
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <div className="font-heading text-4xl font-black leading-none">
                  2024
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
                  Est. year
                </div>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
                N—22.02°
                <br />
                E—90.73°
              </div>
            </div>
          </div>

          {/* Floating stats card */}
          <div className="glass-panel absolute -bottom-6 -left-6 max-w-[14rem] rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-neon-lime" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neon-lime">
                Live
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
              Weekly practice contests every Friday at 9:00 PM.
            </p>
          </div>

          {/* Floating accent chip */}
          <div className="absolute -top-4 -right-4 rotate-6 rounded-xl border border-neon-violet/30 bg-neon-violet/10 px-4 py-2 backdrop-blur-xl">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neon-violet">
              ICPC ready
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500 dark:text-zinc-600">
          Scroll
        </span>
        <div className="h-8 w-[1px] bg-gradient-to-b from-slate-400 to-transparent dark:from-zinc-600" />
      </div>
    </section>
  );
}

export default Hero;
