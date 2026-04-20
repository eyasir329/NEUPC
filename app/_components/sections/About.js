'use client';

/**
 * @file About
 * @module About
 */

import Image from 'next/image';
import { cn } from '@/app/_lib/utils';
import { useScrollReveal } from '@/app/_lib/hooks';

const DEFAULTS = {
  title: 'Who We Are',
  description1:
    'NEUPC is the nexus of algorithmic thought and software craftsmanship at Netrokona University. We are a collective of developers, researchers, and visionaries pushing the boundaries of what\'s possible in the digital realm.',
  description2:
    'The club serves as a platform where students can explore competitive programming, software development, research discussions, and emerging technologies beyond the academic syllabus.',
};

function About({ variant = 'dark', data = {}, settings = {} }) {
  const [ref, visible] = useScrollReveal({ threshold: 0.08 });

  const {
    title = DEFAULTS.title,
    description1 = DEFAULTS.description1,
    description2 = DEFAULTS.description2,
  } = data;

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-8">
        <div
          ref={ref}
          className={cn(
            'grid grid-cols-1 lg:grid-cols-12 gap-20 items-center transition-all duration-700',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          )}
        >
          {/* ── Content ──────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-4">
              <span className="font-mono text-[11px] text-neon-lime uppercase tracking-[0.5em] font-bold">
                Genesis
              </span>
              <h2 className="font-heading text-6xl md:text-7xl font-black tracking-tighter text-white uppercase">
                {title}
              </h2>
            </div>

            <p className="font-sans text-lg text-zinc-400 leading-loose max-w-2xl font-light">
              {description1}
            </p>

            {description2 && (
              <p className="font-sans text-base text-zinc-500 leading-loose max-w-2xl font-light">
                {description2}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-neon-lime">
                <h4 className="font-heading text-neon-lime mb-3 uppercase text-[12px] font-bold tracking-widest">
                  Mission
                </h4>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                  {settings?.mission ||
                    'Empowering students through technical leadership and hands-on system architecture.'}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-neon-violet">
                <h4 className="font-heading text-neon-violet mb-3 uppercase text-[12px] font-bold tracking-widest">
                  Vision
                </h4>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                  {settings?.vision ||
                    'To be the primary incubator for future tech architects in the region.'}
                </p>
              </div>
            </div>


          </div>

          {/* ── Visual ───────────────────────────────────────────── */}
          <div className="lg:col-span-5 relative group">
            <div
              className={cn(
                'aspect-square bg-deep-void p-1 rounded-full border border-neon-lime/15 overflow-hidden shadow-2xl transition-all duration-700 soft-glow-violet',
                visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              )}
              style={{ transitionDelay: visible ? '300ms' : '0ms' }}
            >
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo.png"
                  alt={settings?.site_name ? `${settings.site_name} Logo` : 'NEUPC Logo'}
                  width={400}
                  height={400}
                  className="object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Est. badge */}
            <div className="absolute -bottom-4 -left-4 w-28 h-28 bg-neon-lime flex flex-col items-center justify-center rounded-full rotate-6 shadow-2xl border-4 border-site-bg">
              <span className="font-heading text-black text-2xl font-black italic leading-none">
                2024
              </span>
              <span className="font-mono text-[8px] text-black/60 uppercase tracking-widest mt-1">
                Est.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
