'use client';

/**
 * @file Contact — Homepage section
 * @module Contact
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Github,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Send,
} from 'lucide-react';
import { cn } from '@/app/_lib/utils/utils';
import { useScrollReveal } from '@/app/_lib/utils/hooks';

const SOCIAL_ICONS = {
  github: Github,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
};

function Contact({ contact = {}, social = {}, settings = {} }) {
  const [ref, visible] = useScrollReveal({ threshold: 0.08 });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const contactItems = [
    contact.email && {
      icon: Mail,
      label: 'Email',
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    contact.phone && {
      icon: Phone,
      label: 'Phone',
      value: contact.phone,
      href: `tel:${contact.phone}`,
    },
    contact.address && {
      icon: MapPin,
      label: 'Location',
      value: contact.address,
      href: null,
    },
  ].filter(Boolean);

  const socialLinks = Object.entries(SOCIAL_ICONS)
    .map(([key, Icon]) =>
      social[key] ? { key, Icon, href: social[key] } : null
    )
    .filter(Boolean);

  return (
    <section className="relative overflow-hidden px-8 py-32">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="bg-neon-violet/5 absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full blur-[140px]" />
        <div className="bg-neon-lime/5 absolute top-0 left-0 h-[400px] w-[400px] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl" ref={ref}>
        {/* Header */}
        <div
          className={cn(
            'mb-16 space-y-5 transition-all duration-700',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="flex items-center gap-4">
            <span className="bg-neon-violet h-[1px] w-10" />
            <span className="text-neon-violet font-mono text-[11px] font-bold tracking-[0.5em] uppercase">
              Contact / 006
            </span>
          </div>
          <h2 className="kinetic-headline font-heading text-5xl font-black text-white uppercase md:text-6xl">
            Get in <span className="neon-text">Touch.</span>
          </h2>
          <p className="max-w-xl font-sans text-base leading-relaxed font-light text-zinc-400">
            {settings?.contact_description ||
              'Have a question, proposal, or just want to say hello? We are always open to new connections.'}
          </p>
        </div>

        {/* Two-column layout */}
        <div
          className={cn(
            'grid grid-cols-1 gap-12 transition-all duration-700 lg:grid-cols-2',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          )}
          style={{ transitionDelay: visible ? '150ms' : '0ms' }}
        >
          {/* ── Left: info + social ─────────────────────────────── */}
          <div className="space-y-10">
            {/* Contact info items */}
            {contactItems.length > 0 && (
              <div className="space-y-5">
                {contactItems.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="mb-0.5 font-mono text-[10px] font-bold tracking-[0.3em] text-zinc-600 uppercase">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          className="hover:text-neon-lime font-sans text-sm text-zinc-300 transition-colors"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="font-sans text-sm text-zinc-300">
                          {value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Office hours */}
            {contact.officeHours && (
              <div className="glass-panel rounded-2xl p-6">
                <p className="text-neon-lime mb-2 font-mono text-[10px] font-bold tracking-[0.3em] uppercase">
                  Office Hours
                </p>
                <p className="font-sans text-sm leading-relaxed text-zinc-400">
                  {contact.officeHours}
                </p>
              </div>
            )}

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div>
                <p className="mb-4 font-mono text-[10px] font-bold tracking-[0.3em] text-zinc-600 uppercase">
                  Find us on
                </p>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map(({ key, Icon, href }) => (
                    <Link
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:border-neon-lime hover:text-neon-lime flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition-all"
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: form ─────────────────────────────────────── */}
          <div className="glass-panel rounded-3xl p-8 md:p-10">
            {/* Terminal chrome */}
            <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-5">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                <div className="bg-neon-lime/60 h-3 w-3 rounded-full" />
              </div>
              <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-600">
                message@neupc
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.3em] uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    required
                    className="focus:border-neon-lime w-full border-0 border-b border-white/10 bg-transparent py-3 font-sans text-sm text-white transition-all outline-none placeholder:text-zinc-700 focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.3em] uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="focus:border-neon-lime w-full border-0 border-b border-white/10 bg-transparent py-3 font-sans text-sm text-white transition-all outline-none placeholder:text-zinc-700 focus:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.3em] uppercase">
                  Subject
                </label>
                <select className="focus:border-neon-lime w-full cursor-pointer border-0 border-b border-white/10 bg-transparent py-3 font-sans text-sm text-white outline-none focus:ring-0">
                  {(contact.subjects?.length > 0
                    ? contact.subjects
                    : ['Membership', 'Partnership', 'Event', 'General']
                  ).map((s) => (
                    <option key={s} className="bg-surface">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.3em] uppercase">
                  Message
                </label>
                <textarea
                  placeholder="Tell us what's on your mind..."
                  rows={4}
                  required
                  className="focus:border-neon-lime w-full resize-none border-0 border-b border-white/10 bg-transparent py-3 font-sans text-sm text-white transition-all outline-none placeholder:text-zinc-700 focus:ring-0"
                />
              </div>

              <button
                type="submit"
                disabled={submitted}
                className={cn(
                  'group bg-neon-lime font-heading flex w-full items-center justify-center gap-3 rounded-full py-4 text-[11px] font-black tracking-[0.3em] text-black uppercase transition-all hover:shadow-[0_0_40px_-5px_rgba(182,243,107,0.5)] hover:brightness-110',
                  submitted && 'opacity-70'
                )}
              >
                {submitted ? (
                  'Message Sent ✓'
                ) : (
                  <>
                    Send Message
                    <Send className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
