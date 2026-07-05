/**
 * @file Contact client component
 * @module ContactClient
 */

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FacebookIcon,
  LinkedInIcon,
  GitHubIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/app/_components/ui/SocialIcons';
import HeroAmbient from '@/app/_components/ui/HeroAmbient';
import ScrollCue from '@/app/_components/ui/ScrollCue';
import SectionEyebrow from '@/app/_components/ui/SectionEyebrow';
import { submitContactFormAction } from '@/app/_lib/actions/contact-actions';
import { cn } from '@/app/_lib/utils/utils';
import posthog from 'posthog-js';
import {
  pageFadeUp as fadeUp,
  pageStagger as stagger,
  pageCardReveal as cardReveal,
  pageViewport as viewport,
} from '@/app/_components/motion/motion';

const ScrollToTop = dynamic(() => import('@/app/_components/ui/ScrollToTop'), {
  ssr: false,
});

// ─── Constants ───────────────────────────────────────────────────────────────

const SOCIAL_ICON_MAP = {
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  twitter: TwitterIcon,
  youtube: YouTubeIcon,
};

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

// ─── Contact info config ─────────────────────────────────────────────────────

const INFO_ITEMS = [
  {
    key: 'email',
    label: 'Electronic Mail',
    isLink: true,
    prefix: 'mailto:',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    key: 'phone',
    label: 'Voice Line',
    isLink: true,
    prefix: 'tel:',
    format: (v) => v.replace(/\s/g, ''),
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
  },
  {
    key: 'address',
    label: 'Physical Node',
    isLink: false,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    key: 'officeHours',
    label: 'Active Hours',
    isLink: false,
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FaqItem({ faq, isActive, onToggle }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all duration-300',
        isActive
          ? 'border-neon-lime/30 bg-white/[0.04] shadow-[0_0_25px_-5px_rgba(182,243,107,0.12)]'
          : 'border-white/8 bg-white/[0.015] hover:border-white/16 hover:bg-white/[0.03]'
      )}
    >
      {/* Neon accent left line */}
      <div
        className={cn(
          'bg-neon-lime absolute top-0 bottom-0 left-0 w-[3px] origin-top transition-transform duration-300 ease-out',
          isActive ? 'scale-y-100' : 'scale-y-0'
        )}
      />
      <button
        onClick={onToggle}
        className="relative z-10 flex w-full items-start justify-between gap-4 p-5 text-left"
      >
        <span
          className={cn(
            'font-heading text-sm leading-snug font-bold transition-colors duration-200 sm:text-base',
            isActive ? 'text-neon-lime' : 'text-white'
          )}
        >
          {faq.question}
        </span>
        <div
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300',
            isActive ? 'bg-neon-lime/10 text-neon-lime' : 'text-zinc-500'
          )}
        >
          <svg
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              isActive && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="relative z-10 border-t border-white/6 bg-white/[0.01] px-5 pt-4 pb-5 text-sm leading-relaxed text-zinc-400">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContactClient({
  contactInfo: propContactInfo = {},
  keyContacts: propKeyContacts = [],
  socialLinks: propSocialLinks = {},
  faqs: propFaqs = [],
  settings = {},
}) {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM,
    name: searchParams.get('name') ?? '',
    email: searchParams.get('email') ?? '',
  }));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // Data normalization
  const contactInfo = { ...propContactInfo };
  if (propContactInfo.office_hours && !propContactInfo.officeHours) {
    contactInfo.officeHours = propContactInfo.office_hours;
  }

  const keyContacts = propKeyContacts;

  const socialLinks = Object.entries(propSocialLinks)
    .filter(([, url]) => url && url !== '#')
    .map(([name, url], idx) => ({
      id: idx + 1,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      url,
      Icon: SOCIAL_ICON_MAP[name.toLowerCase()] || GitHubIcon,
    }));

  const faqs = propFaqs.map((f, i) => ({ ...f, id: f.id || i + 1 }));

  // Form logic
  const validateForm = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.subject) e.subject = 'Please select a subject';
    if (!formData.message.trim()) e.message = 'Message is required';
    else if (formData.message.trim().length < 10)
      e.message = 'Minimum 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('name', formData.name);
      fd.set('email', formData.email);
      fd.set('subject', formData.subject);
      fd.set('message', formData.message);
      const result = await submitContactFormAction(fd);
      if (result?.error) {
        setErrors({ submit: result.error });
      } else {
        posthog.capture('contact_form_submitted', {
          subject: formData.subject,
        });
        setSubmitSuccess(true);
        setFormData(INITIAL_FORM);
        setTimeout(() => setSubmitSuccess(false), 6000);
      }
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase =
    'w-full rounded-xl border bg-white/[0.015] px-4 py-3 text-sm text-white placeholder-zinc-650 outline-none backdrop-blur-sm transition-all duration-300 focus:bg-white/[0.035] sm:text-base';
  const inputNormal =
    'border-white/8 focus:border-neon-lime/30 focus:ring-1 focus:ring-neon-lime/15';
  const inputError =
    'border-red-500/40 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/15';

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05060B] text-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[60vh] items-center overflow-hidden px-4 pt-32 pb-12 sm:min-h-[65vh] sm:px-6 sm:pt-36 sm:pb-16 lg:px-8">
        <HeroAmbient />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-7xl"
        >
          <div className="max-w-2xl space-y-6 sm:max-w-3xl sm:space-y-8">
            {/* Eyebrow — same pulse-dot pattern as events/achievements */}
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <span className="pulse-dot bg-neon-lime inline-block h-1.5 w-1.5 rounded-full" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-400 uppercase sm:text-[11px]">
                {settings?.contact_page_badge || 'Contact · NEUPC'}
              </span>
            </motion.div>

            {/* Kinetic headline */}
            <motion.h1
              variants={fadeUp}
              className="kinetic-headline font-heading text-[clamp(2.8rem,11vw,7rem)] leading-none font-black text-white uppercase select-none"
            >
              {settings?.contact_page_title ? (
                settings.contact_page_title
              ) : (
                <>
                  Get in
                  <br />
                  <span className="neon-text">Touch.</span>
                </>
              )}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="max-w-lg text-sm leading-relaxed text-zinc-400 sm:max-w-xl sm:text-base lg:text-lg"
            >
              {settings?.contact_page_description ||
                "Have questions, ideas, or collaboration proposals? Direct channel to the core team — reach out and let's build something together."}
            </motion.p>

            {/* Status pill & Quick stat row */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-4 border-t border-white/8 pt-6 sm:pt-8"
            >
              <div className="border-neon-lime/20 bg-neon-lime/8 text-neon-lime inline-flex h-[38px] items-center gap-2.5 rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase sm:h-[42px] sm:px-5 sm:py-2.5 sm:text-[11px]">
                <span className="pulse-dot bg-neon-lime h-1.5 w-1.5 rounded-full" />
                Responding within 24–48 hrs
              </div>

              {[
                {
                  value: faqs.length,
                  label: 'FAQ Answered',
                  mobile: 'FAQs',
                  accent: true,
                },
                {
                  value: keyContacts.length,
                  label: 'Key Contacts',
                  mobile: 'Contacts',
                  accent: false,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex h-[38px] items-center gap-3 rounded-full border border-white/8 bg-white/[0.015] px-4 py-1.5 backdrop-blur-md transition-all duration-300 hover:border-white/16 hover:bg-white/[0.03] sm:h-[42px] sm:px-5 sm:py-2"
                >
                  <span
                    className={cn(
                      'font-heading stat-numeral text-lg leading-none font-black tabular-nums sm:text-xl',
                      stat.accent ? 'text-neon-lime' : 'text-white'
                    )}
                  >
                    {stat.value}
                  </span>
                  <div className="flex flex-col justify-center">
                    <span className="font-mono text-[8px] leading-none font-bold tracking-[0.15em] text-zinc-400 uppercase sm:text-[9px]">
                      <span className="sm:hidden">{stat.mobile}</span>
                      <span className="hidden sm:inline">{stat.label}</span>
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <ScrollCue />
      </section>

      {/* ── Main Contact Grid ──────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            {/* ── LEFT: Info + Social + Key Contacts ── */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              {/* Contact info card */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="glass-panel group hover:border-neon-lime/20 relative overflow-hidden rounded-2xl p-6 transition-all duration-300 sm:p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <span className="bg-neon-lime h-px w-7" />
                  <span className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.35em] uppercase">
                    Direct Line
                  </span>
                </div>

                <div className="space-y-5">
                  {INFO_ITEMS.map(
                    ({ key, label, isLink, prefix, format, icon }) => {
                      const value = contactInfo[key];
                      if (!value) return null;
                      const href = isLink
                        ? `${prefix}${format ? format(value) : value}`
                        : undefined;
                      return (
                        <div
                          key={key}
                          className="group/item -mx-2.5 flex items-start gap-4 rounded-xl p-2.5 transition-all duration-300 hover:bg-white/[0.02]"
                        >
                          <div className="group-hover/item:border-neon-lime/30 group-hover/item:bg-neon-lime/5 group-hover/item:text-neon-lime flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-zinc-400 transition-all duration-300 group-hover/item:shadow-[0_0_15px_-3px_rgba(182,243,107,0.2)]">
                            {icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="mt-1 font-mono text-[9px] leading-none font-bold tracking-widest text-zinc-500 uppercase">
                              {label}
                            </p>
                            {isLink ? (
                              <a
                                href={href}
                                className="hover:text-neon-lime mt-1.5 block text-sm font-semibold break-all text-white transition-colors duration-200"
                              >
                                {value}
                              </a>
                            ) : (
                              <p className="mt-1.5 text-sm leading-snug font-semibold text-zinc-300">
                                {value}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </motion.div>

              {/* Social links */}
              {socialLinks.length > 0 && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-white/12 sm:p-8"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <span className="bg-neon-lime h-px w-7" />
                    <span className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.35em] uppercase">
                      Follow Us
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                    {socialLinks.map((social) => {
                      const brandName = social.name.toLowerCase();
                      return (
                        <motion.a
                          key={social.id}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'group/social flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.015] px-3 py-2.5 transition-all duration-300',
                            brandName === 'facebook' &&
                              'hover:border-blue-500/30 hover:bg-blue-500/5',
                            brandName === 'linkedin' &&
                              'hover:border-sky-600/30 hover:bg-sky-600/5',
                            brandName === 'github' &&
                              'hover:border-white/30 hover:bg-white/5',
                            brandName === 'twitter' &&
                              'hover:border-zinc-300/30 hover:bg-zinc-300/5',
                            brandName === 'youtube' &&
                              'hover:border-red-600/30 hover:bg-red-600/5'
                          )}
                        >
                          <span
                            className={cn(
                              'shrink-0 text-zinc-400 transition-colors duration-300',
                              brandName === 'facebook' &&
                                'group-hover/social:text-blue-500',
                              brandName === 'linkedin' &&
                                'group-hover/social:text-sky-400',
                              brandName === 'github' &&
                                'group-hover/social:text-white',
                              brandName === 'twitter' &&
                                'group-hover/social:text-white',
                              brandName === 'youtube' &&
                                'group-hover/social:text-red-500'
                            )}
                          >
                            <social.Icon className="h-4 w-4" />
                          </span>
                          <span
                            className={cn(
                              'truncate font-mono text-[9px] font-bold tracking-wider text-zinc-400 uppercase transition-colors duration-300',
                              brandName === 'facebook' &&
                                'group-hover/social:text-blue-500',
                              brandName === 'linkedin' &&
                                'group-hover/social:text-sky-400',
                              brandName === 'github' &&
                                'group-hover/social:text-white',
                              brandName === 'twitter' &&
                                'group-hover/social:text-white',
                              brandName === 'youtube' &&
                                'group-hover/social:text-red-500'
                            )}
                          >
                            {social.name}
                          </span>
                        </motion.a>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Key contacts */}
              {keyContacts.length > 0 && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-white/12 sm:p-8"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <span className="bg-neon-lime h-px w-7" />
                    <span className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.35em] uppercase">
                      Key Contacts
                    </span>
                  </div>
                  <motion.div
                    className="space-y-3.5"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.08 } },
                    }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewport}
                  >
                    {keyContacts.map((contact) => {
                      const initials = contact.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      return (
                        <motion.div
                          key={contact.id}
                          variants={cardReveal}
                          whileHover={{ y: -2 }}
                          className="group/contact flex items-center gap-4 rounded-xl border border-white/6 bg-white/[0.015] p-4 transition-all duration-300 hover:border-white/16 hover:bg-white/[0.03]"
                        >
                          <div className="group-hover/contact:border-neon-lime/30 group-hover/contact:bg-neon-lime/5 group-hover/contact:text-neon-lime flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] font-mono text-xs font-bold text-white shadow-inner transition-all duration-300 group-hover/contact:shadow-[0_0_15px_-4px_rgba(182,243,107,0.15)]">
                            {initials}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="border-neon-lime/20 bg-neon-lime/8 text-neon-lime inline-block rounded-md border px-1.5 py-0.5 font-mono text-[8px] leading-none font-bold tracking-wider uppercase">
                              {contact.role}
                            </span>
                            <p className="group-hover/contact:text-neon-lime mt-1 text-sm leading-tight font-bold text-white transition-colors duration-200">
                              {contact.name}
                            </p>
                            <a
                              href={`mailto:${contact.email}`}
                              className="hover:text-neon-lime mt-1 block truncate font-mono text-[9px] text-zinc-500 transition-colors"
                            >
                              {contact.email}
                            </a>
                          </div>
                          <a
                            href={contact.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.02] text-zinc-400 transition-all duration-300 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-400 hover:shadow-[0_0_15px_-4px_rgba(14,165,233,0.2)]"
                          >
                            <LinkedInIcon className="h-4 w-4" />
                          </a>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}
            </div>

            {/* ── RIGHT: Contact Form ── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7"
            >
              <div className="glass-panel rounded-2xl p-6 sm:p-8 lg:p-10">
                {/* Form header */}
                <div className="mb-8">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="bg-neon-lime h-px w-7" />
                    <span className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.35em] uppercase">
                      Send Message
                    </span>
                  </div>
                  <h2 className="kinetic-headline font-heading text-3xl font-black text-white uppercase sm:text-4xl">
                    Start the
                    <br />
                    <span className="neon-text">Conversation</span>
                  </h2>
                </div>

                {/* Success banner */}
                <AnimatePresence>
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="border-neon-lime/25 bg-neon-lime/8 mb-6 overflow-hidden rounded-xl border p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-neon-lime/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                          <svg
                            className="text-neon-lime h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-neon-lime text-sm font-bold">
                            Message sent!
                          </p>
                          <p className="text-neon-lime/70 mt-0.5 font-mono text-[10px] tracking-wider">
                            We will get back to you within 24–48 hours.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error banner */}
                <AnimatePresence>
                  {errors.submit && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6 rounded-xl border border-red-500/30 bg-red-500/8 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="h-4 w-4 shrink-0 text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        <p className="text-sm text-red-300">{errors.submit}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name + Email */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-zinc-550 mb-1.5 block font-mono text-[9px] font-bold tracking-widest uppercase">
                        Full Name <span className="text-neon-lime">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={cn(
                          inputBase,
                          errors.name ? inputError : inputNormal
                        )}
                      />
                      {errors.name && (
                        <p className="mt-1 font-mono text-[9px] text-red-400">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-zinc-550 mb-1.5 block font-mono text-[9px] font-bold tracking-widest uppercase">
                        Email <span className="text-neon-lime">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={cn(
                          inputBase,
                          errors.email ? inputError : inputNormal
                        )}
                      />
                      {errors.email && (
                        <p className="mt-1 font-mono text-[9px] text-red-400">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Phone + Subject */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-zinc-550 mb-1.5 block font-mono text-[9px] font-bold tracking-widest uppercase">
                        Phone <span className="text-zinc-600">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+880 1XXX-XXXXXX"
                        className={cn(inputBase, inputNormal)}
                      />
                    </div>
                    <div>
                      <label className="text-zinc-550 mb-1.5 block font-mono text-[9px] font-bold tracking-widest uppercase">
                        Subject <span className="text-neon-lime">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className={cn(
                            inputBase,
                            'cursor-pointer appearance-none pr-10',
                            errors.subject ? inputError : inputNormal,
                            !formData.subject && 'text-zinc-500'
                          )}
                        >
                          <option value="" className="bg-[#0c0e16]">
                            Select a subject
                          </option>
                          {(contactInfo.subjects || []).map((s) => (
                            <option
                              key={s}
                              value={s}
                              className="bg-[#0c0e16] text-white"
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                        <div className="text-zinc-550 pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                      {errors.subject && (
                        <p className="mt-1 font-mono text-[9px] text-red-400">
                          {errors.subject}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-zinc-550 mb-1.5 block font-mono text-[9px] font-bold tracking-widest uppercase">
                      Message <span className="text-neon-lime">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={8}
                      placeholder="Tell us what's on your mind..."
                      className={cn(
                        inputBase,
                        'resize-none',
                        errors.message ? inputError : inputNormal
                      )}
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      {errors.message ? (
                        <p className="font-mono text-[9px] text-red-400">
                          {errors.message}
                        </p>
                      ) : (
                        <p className="font-mono text-[9px] text-zinc-500">
                          Minimum 10 characters
                        </p>
                      )}
                      <p className="font-mono text-[9px] text-zinc-500">
                        {formData.message.length}/500
                      </p>
                    </div>
                  </div>

                  {/* Submit button — same style as FeaturedBanner CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group bg-neon-lime font-heading flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full px-8 py-4 text-[11px] font-bold tracking-widest text-black uppercase shadow-[0_0_30px_-8px_rgba(182,243,107,0.4)] transition-all duration-300 hover:shadow-[0_0_40px_-2px_rgba(182,243,107,0.6)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Message
                        <span className="transition-transform duration-200 group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="mb-10 flex flex-col gap-1 sm:mb-12 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <motion.div
                  variants={fadeUp}
                  className="flex items-center gap-3"
                >
                  <span className="bg-neon-lime h-px w-7" />
                  <span className="text-neon-lime font-mono text-[10px] tracking-[0.35em] uppercase sm:text-[11px]">
                    FAQ
                  </span>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  className="kinetic-headline font-heading mt-2 text-3xl font-black text-white uppercase sm:text-4xl"
                >
                  Common <span className="neon-text">Questions</span>
                </motion.h2>
              </div>
              <motion.p
                variants={fadeUp}
                className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase sm:text-[11px]"
              >
                {faqs.length} answers
              </motion.p>
            </motion.div>

            <motion.div
              className="grid gap-3 lg:grid-cols-2"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              {faqs.map((faq) => (
                <motion.div key={faq.id} variants={cardReveal}>
                  <FaqItem
                    faq={faq}
                    isActive={activeFaq === faq.id}
                    onToggle={() =>
                      setActiveFaq(activeFaq === faq.id ? null : faq.id)
                    }
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── CTA Strip — same pattern as events page join prompt ───────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="glass-panel border-neon-lime/10 overflow-hidden rounded-2xl p-8 sm:p-12 lg:p-16"
          >
            <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="bg-neon-lime h-px w-7" />
                  <span className="text-neon-lime font-mono text-[10px] tracking-[0.35em] uppercase">
                    Ready to join?
                  </span>
                </div>
                <h3 className="kinetic-headline font-heading text-3xl font-black text-white uppercase sm:text-4xl">
                  {settings?.contact_page_cta_title || (
                    <>
                      Become Part
                      <br />
                      of the Crew
                    </>
                  )}
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-zinc-400">
                  {settings?.contact_page_cta_description ||
                    "Whether you're a student looking to join, a company interested in collaboration, or just want to say hello — we're here."}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  href="/join"
                  className="bg-neon-lime font-heading inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[11px] font-bold tracking-widest text-black uppercase shadow-[0_0_30px_-8px_rgba(182,243,107,0.5)] transition-all hover:shadow-[0_0_50px_-4px_rgba(182,243,107,0.7)] sm:py-4"
                >
                  Join Our Club →
                </Link>
                <Link
                  href="/events"
                  className="font-heading hover:border-neon-lime/35 hover:text-neon-lime inline-flex items-center gap-2 rounded-full border border-white/12 px-7 py-3.5 text-[11px] font-bold tracking-widest text-zinc-400 uppercase transition-all sm:py-4"
                >
                  Explore Events
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <ScrollToTop />
    </div>
  );
}
