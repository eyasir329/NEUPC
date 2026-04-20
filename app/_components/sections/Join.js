'use client';

/**
 * @file Join — Homepage section (Terminal Contact design)
 * @module Join
 */

import { useState } from 'react';
import { cn } from '@/app/_lib/utils';
import { useScrollReveal } from '@/app/_lib/hooks';

function Join({ settings = {} }) {
  const [ref, visible] = useScrollReveal({ threshold: 0.08 });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="relative px-8 py-32">
      <div className="mx-auto max-w-4xl" ref={ref}>
        <div
          className={cn(
            'bg-surface border-neon-lime/15 relative overflow-hidden rounded-3xl border shadow-[0_0_80px_-20px_rgba(182,243,107,0.25)] transition-all duration-700',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          {/* Gradient overlay */}
          <div className="from-neon-lime/5 to-neon-violet/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent" />

          {/* Terminal chrome */}
          <div className="bg-deep-void/80 flex items-center justify-between border-b border-white/5 p-4 px-8 backdrop-blur-md">
            <div className="flex space-x-2">
              <div className="h-3 w-3 rounded-full bg-red-500/40" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/40" />
              <div className="bg-neon-lime/60 h-3 w-3 rounded-full" />
            </div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
              contact@neupc
            </span>
          </div>

          {/* Form content */}
          <form
            onSubmit={handleSubmit}
            className="relative space-y-10 p-10 md:p-14"
          >
            <div className="space-y-3 text-center">
              <h2 className="font-heading text-4xl font-black tracking-tighter text-white uppercase italic md:text-5xl">
                {settings?.homepage_join_title || 'Join the Club'}
              </h2>
              <p className="text-sm font-light text-zinc-500">
                Fill in your details and we&apos;ll get back to you.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-neon-lime font-mono text-[10px] font-bold tracking-widest uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="bg-deep-void/50 focus:border-neon-lime w-full border-0 border-b border-white/10 py-3 font-sans text-sm text-white transition-all outline-none placeholder:text-zinc-700 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-neon-lime font-mono text-[10px] font-bold tracking-widest uppercase">
                  Enquiry Type
                </label>
                <select className="bg-deep-void/50 focus:border-neon-lime w-full cursor-pointer border-0 border-b border-white/10 py-3 font-sans text-sm text-white outline-none focus:ring-0">
                  <option>Membership</option>
                  <option>Partnership</option>
                  <option>Event Participation</option>
                  <option>General Enquiry</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-neon-lime font-mono text-[10px] font-bold tracking-widest uppercase">
                  Message
                </label>
                <textarea
                  placeholder="Tell us about yourself or your enquiry..."
                  rows={3}
                  className="bg-deep-void/50 focus:border-neon-lime w-full resize-none border-0 border-b border-white/10 py-3 font-sans text-sm text-white transition-all outline-none placeholder:text-zinc-700 focus:ring-0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitted}
              className={cn(
                'from-neon-lime font-heading w-full rounded-full bg-linear-to-r to-lime-400 py-5 text-[11px] font-black tracking-[0.4em] text-black uppercase transition-all hover:shadow-[0_0_40px_-5px_rgba(182,243,107,0.6)]',
                submitted && 'opacity-70'
              )}
            >
              {submitted ? 'Message Sent ✓' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Join;
