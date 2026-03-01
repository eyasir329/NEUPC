/**
 * @file Contact page client component.
 * Renders contact form, info cards, social links, and FAQ accordion.
 *
 * @module ContactClient
 */

'use client';

import { useState } from 'react';
import CTASection from '../_components/ui/CTASection';
import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});
import PageBackground from '../_components/ui/PageBackground';
import {
  FacebookIcon,
  LinkedInIcon,
  GitHubIcon,
  YouTubeIcon,
  SOCIAL_ICON_MAP,
} from '../_components/ui/SocialIcons';
import { useDelayedLoad, useScrollReveal } from '../_lib/hooks';
import { submitContactFormAction } from '@/app/_lib/contact-actions';
import { cn } from '../_lib/utils';
import Button from '../_components/ui/Button';

// ---------------------------------------------------------------------------
// Constants & defaults
// ---------------------------------------------------------------------------

/** Subject dropdown options */
const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Membership Information',
  'Event Participation',
  'Collaboration Proposal',
  'Sponsorship Inquiry',
  'Technical Support',
  'Feedback / Suggestion',
];

/** Default contact info fallbacks */
const DEFAULT_CONTACT_INFO = {
  email: 'programmingclub@nu.edu.bd',
  phone: '+880 1XXX-XXXXXX',
  address: 'Department of CSE, Netrokona University, Netrokona, Bangladesh',
  officeHours: 'Sunday - Thursday, 10:00 AM - 4:00 PM',
};

/** Default key contacts fallback */
const DEFAULT_KEY_CONTACTS = [
  {
    id: 1,
    role: 'President',
    name: 'TBD',
    email: 'president@neupc.com',
    linkedin: '#',
  },
  {
    id: 2,
    role: 'General Secretary',
    name: 'TBD',
    email: 'gs@neupc.com',
    linkedin: '#',
  },
  {
    id: 3,
    role: 'Faculty Advisor',
    name: 'TBD',
    email: 'advisor@nu.edu.bd',
    linkedin: '#',
  },
];

/** Default FAQ items */
const DEFAULT_FAQS = [
  {
    id: 1,
    question: 'How can I join the programming club?',
    answer:
      'You can join by filling out the membership form on our Join page. All CSE students are welcome to participate in our activities.',
  },
  {
    id: 2,
    question: 'When are events typically held?',
    answer:
      'We organize events throughout the academic year, including weekly problem-solving sessions, monthly workshops, and annual programming contests. Check our Events page for the latest schedule.',
  },
  {
    id: 3,
    question: 'Do I need prior programming experience?',
    answer:
      'No! We welcome students of all skill levels. We have beginner-friendly workshops and sessions designed to help you learn and grow.',
  },
  {
    id: 4,
    question: 'How can I sponsor or collaborate with the club?',
    answer:
      'We welcome collaboration proposals and sponsorships. Please use the contact form above with subject "Collaboration Proposal" or "Sponsorship Inquiry" and our team will get back to you.',
  },
  {
    id: 5,
    question: 'What is the response time for inquiries?',
    answer:
      'We typically respond to all inquiries within 24-48 hours during office hours (Sunday - Thursday, 10 AM - 4 PM).',
  },
];

/** Default social platform names */
const DEFAULT_SOCIAL_NAMES = ['Facebook', 'LinkedIn', 'GitHub', 'YouTube'];

/** Social icon component map for rendering */
const SOCIAL_ICON_COMPONENTS = {
  facebook: <FacebookIcon className="h-6 w-6" />,
  linkedin: <LinkedInIcon className="h-6 w-6" />,
  github: <GitHubIcon className="h-6 w-6" />,
  youtube: <YouTubeIcon className="h-6 w-6" />,
};

/** Contact info card definitions */
const CONTACT_INFO_CARDS = [
  {
    key: 'email',
    label: 'Email',
    borderColor: 'border-primary-500/30',
    bgColor: 'bg-primary-500/10',
    hoverBorder: 'group-hover:border-primary-500/50',
    hoverBg: 'group-hover:bg-primary-500/20',
    hoverShadow: 'group-hover:shadow-primary-500/20',
    textColor: 'text-primary-300',
    linkClass: 'text-primary-300 hover:text-primary-200',
    isLink: true,
    linkPrefix: 'mailto:',
    icon: (
      <svg
        className="text-primary-300 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    key: 'phone',
    label: 'Phone',
    borderColor: 'border-secondary-500/30',
    bgColor: 'bg-secondary-500/10',
    hoverBorder: 'group-hover:border-secondary-500/50',
    hoverBg: 'group-hover:bg-secondary-500/20',
    hoverShadow: 'group-hover:shadow-secondary-500/20',
    textColor: 'text-secondary-300',
    linkClass: 'text-secondary-300 hover:text-secondary-200',
    isLink: true,
    linkPrefix: 'tel:',
    formatLink: (v) => v.replace(/\s/g, ''),
    icon: (
      <svg
        className="text-secondary-300 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
  },
  {
    key: 'address',
    label: 'Address',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    hoverBorder: 'group-hover:border-purple-500/50',
    hoverBg: 'group-hover:bg-purple-500/20',
    hoverShadow: 'group-hover:shadow-purple-500/20',
    textColor: 'text-purple-300',
    isLink: false,
    icon: (
      <svg
        className="h-6 w-6 text-purple-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    key: 'officeHours',
    label: 'Office Hours',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/10',
    hoverBorder: 'group-hover:border-pink-500/50',
    hoverBg: 'group-hover:bg-pink-500/20',
    hoverShadow: 'group-hover:shadow-pink-500/20',
    textColor: 'text-pink-300',
    isLink: false,
    icon: (
      <svg
        className="h-6 w-6 text-pink-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Initial form state */
const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

/**
 * Reusable form field with error state.
 * @param {{ label: string, name: string, type?: string, required?: boolean, value: string, error?: string, onChange: Function, placeholder?: string, children?: React.ReactNode }} props
 */
function FormField({
  label,
  name,
  type = 'text',
  required,
  value,
  error,
  onChange,
  placeholder,
  children,
}) {
  const inputClasses = cn(
    'w-full rounded-lg border bg-white/5 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-2 focus:outline-none',
    error
      ? 'border-red-500/50 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20 focus:ring-red-500/50'
      : 'focus:border-primary-500 focus:ring-primary-500/50 focus:shadow-primary-500/20 border-white/10 focus:shadow-lg'
  );

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-gray-300"
      >
        {label}{' '}
        {required ? (
          <span className="text-red-400">*</span>
        ) : (
          <span className="text-gray-500">(Optional)</span>
        )}
      </label>
      {children || (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={inputClasses}
          placeholder={placeholder}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/**
 * FAQ accordion item.
 * @param {{ faq: object, isActive: boolean, onToggle: Function }} props
 */
function FaqItem({ faq, isActive, onToggle }) {
  return (
    <div className="group hover:border-primary-500/30 hover:shadow-primary-500/10 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10 hover:shadow-lg">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left transition-all hover:bg-white/5"
      >
        <span className="group-hover:text-primary-200 pr-4 text-base font-semibold text-white transition-colors sm:text-lg">
          {faq.question}
        </span>
        <svg
          className={cn(
            'text-primary-300 group-hover:text-primary-200 h-5 w-5 shrink-0 transition-all duration-300',
            isActive && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isActive ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="border-t border-white/10 bg-black/20 p-5">
          <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Contact page client component.
 *
 * @param {{ contactInfo?: object, keyContacts?: Array, socialLinks?: object, faqs?: Array }} props
 */
export default function ContactClient({
  contactInfo: propContactInfo = {},
  keyContacts: propKeyContacts = [],
  socialLinks: propSocialLinks = {},
  faqs: propFaqs = [],
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const isLoaded = useDelayedLoad();
  const [faqRef, faqVisible] = useScrollReveal({ threshold: 0.1 });
  const [contactsRef, contactsVisible] = useScrollReveal({ threshold: 0.1 });
  const [socialRef, socialVisible] = useScrollReveal({ threshold: 0.15 });

  // --- Data normalization ---
  const contactInfo = { ...DEFAULT_CONTACT_INFO, ...propContactInfo };
  if (propContactInfo.office_hours && !propContactInfo.officeHours) {
    contactInfo.officeHours = propContactInfo.office_hours;
  }

  const keyContacts =
    propKeyContacts.length > 0 ? propKeyContacts : DEFAULT_KEY_CONTACTS;

  const socialLinks = (() => {
    const entries = Object.entries(propSocialLinks)
      .filter(([, url]) => url && url !== '#')
      .map(([name, url], idx) => ({
        id: idx + 1,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        url,
        icon:
          SOCIAL_ICON_COMPONENTS[name.toLowerCase()] ||
          SOCIAL_ICON_COMPONENTS.github,
      }));
    if (entries.length > 0) return entries;
    return DEFAULT_SOCIAL_NAMES.map((name, idx) => ({
      id: idx + 1,
      name,
      url: '#',
      icon: SOCIAL_ICON_COMPONENTS[name.toLowerCase()],
    }));
  })();

  const faqs =
    propFaqs.length > 0
      ? propFaqs.map((f, i) => ({ ...f, id: f.id || i + 1 }))
      : DEFAULT_FAQS;

  // --- Form logic ---
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Email is invalid';
    if (!formData.subject) newErrors.subject = 'Please select a subject';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    else if (formData.message.trim().length < 10)
      newErrors.message = 'Message must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8 lg:py-28">
        <PageBackground />

        <div className="relative mx-auto max-w-7xl text-center">
          <div
            className={cn(
              'bg-primary-500/10 text-primary-300 ring-primary-500/20 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-all duration-700 sm:text-sm',
              isLoaded
                ? 'translate-y-0 opacity-100'
                : '-translate-y-4 opacity-0'
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Us
          </div>

          <h1
            className={cn(
              'from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-3xl leading-tight font-extrabold text-transparent transition-all delay-100 duration-700 sm:text-4xl md:text-5xl lg:text-6xl',
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
          >
            Get in Touch
          </h1>

          <p
            className={cn(
              'mx-auto mb-8 max-w-3xl text-sm leading-relaxed text-gray-300 transition-all delay-200 duration-700 sm:text-base md:text-lg lg:text-xl',
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
          >
            Have questions, ideas, or collaboration proposals? We&apos;d love to
            hear from you. Reach out and let&apos;s build something amazing
            together.
          </p>
        </div>
      </section>

      {/* Main Contact Section - Two Column Layout */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Contact Form */}
            <div
              className={cn(
                'transition-all duration-700',
                isLoaded
                  ? 'translate-x-0 opacity-100'
                  : '-translate-x-8 opacity-0'
              )}
            >
              <div className="group/form hover:border-primary-500/20 hover:shadow-primary-500/5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl sm:p-8">
                <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
                  Send us a Message
                </h2>

                {/* Success message */}
                {submitSuccess && (
                  <div className="animate-fade-in mb-6 overflow-hidden rounded-xl border border-green-500/30 bg-linear-to-r from-green-500/10 to-emerald-500/10 p-4 shadow-lg shadow-green-500/10">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                        <svg
                          className="h-6 w-6 shrink-0 text-green-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-300">
                          Message Sent Successfully!
                        </h3>
                        <p className="mt-1 text-sm text-green-200">
                          Thank you for contacting us. We will get back to you
                          within 24-48 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {errors.submit && (
                  <div className="mb-6 overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 shrink-0 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <p className="text-sm text-red-300">{errors.submit}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <FormField
                    label="Full Name"
                    name="name"
                    required
                    value={formData.name}
                    error={errors.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                  <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    error={errors.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                  />
                  <FormField
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+880 1XXX-XXXXXX"
                  />

                  {/* Subject dropdown */}
                  <FormField
                    label="Subject"
                    name="subject"
                    required
                    value={formData.subject}
                    error={errors.subject}
                    onChange={handleChange}
                  >
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={cn(
                        'w-full rounded-lg border bg-white/5 px-4 py-3 text-white backdrop-blur-sm transition-all focus:ring-2 focus:outline-none',
                        errors.subject
                          ? 'border-red-500/50 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20 focus:ring-red-500/50'
                          : 'focus:border-primary-500 focus:ring-primary-500/50 focus:shadow-primary-500/20 border-white/10 focus:shadow-lg'
                      )}
                    >
                      <option value="" className="bg-gray-900">
                        Select a subject
                      </option>
                      {SUBJECT_OPTIONS.map((subject) => (
                        <option
                          key={subject}
                          value={subject}
                          className="bg-gray-900"
                        >
                          {subject}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {/* Message textarea */}
                  <FormField
                    label="Message"
                    name="message"
                    required
                    value={formData.message}
                    error={errors.message}
                    onChange={handleChange}
                  >
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className={cn(
                        'w-full resize-none rounded-lg border bg-white/5 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-2 focus:outline-none',
                        errors.message
                          ? 'border-red-500/50 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20 focus:ring-red-500/50'
                          : 'focus:border-primary-500 focus:ring-primary-500/50 focus:shadow-primary-500/20 border-white/10 focus:shadow-lg'
                      )}
                      placeholder="Tell us what's on your mind..."
                    />
                    <div className="mt-1 flex items-center justify-between">
                      {errors.message ? (
                        <p className="text-xs text-red-400">{errors.message}</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Minimum 10 characters
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formData.message.length}/500
                      </p>
                    </div>
                  </FormField>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    variant="gradient"
                    size="md"
                    loading={isSubmitting}
                    loadingText="Sending..."
                    fullWidth
                    className="rounded-full"
                    iconRight={
                      !isSubmitting ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      ) : undefined
                    }
                  >
                    Send Message
                  </Button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div
              className={cn(
                'space-y-6 transition-all delay-200 duration-700',
                isLoaded
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-8 opacity-0'
              )}
            >
              {/* Official Contact Info */}
              <div className="group/card hover:border-primary-500/30 hover:shadow-primary-500/10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl sm:p-8">
                <h2 className="mb-6 text-2xl font-bold text-white">
                  Contact Information
                </h2>
                <div className="space-y-5">
                  {CONTACT_INFO_CARDS.map((card) => {
                    const value = contactInfo[card.key];
                    const href = card.isLink
                      ? `${card.linkPrefix}${card.formatLink ? card.formatLink(value) : value}`
                      : undefined;
                    return (
                      <div
                        key={card.key}
                        className="group flex items-start gap-4"
                      >
                        <div
                          className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 group-hover:shadow-lg',
                            card.borderColor,
                            card.bgColor,
                            card.hoverBorder,
                            card.hoverBg,
                            card.hoverShadow
                          )}
                        >
                          {card.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-400">
                            {card.label}
                          </p>
                          {card.isLink ? (
                            <a
                              href={href}
                              className={cn(
                                'mt-1 block text-base font-semibold transition-colors',
                                card.linkClass
                              )}
                            >
                              {value}
                            </a>
                          ) : (
                            <p className="mt-1 text-base text-gray-300">
                              {value}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Contacts */}
              <div
                ref={contactsRef}
                className="group/card hover:border-secondary-500/30 hover:shadow-secondary-500/10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl sm:p-8"
              >
                <h3
                  className={cn(
                    'mb-4 text-xl font-bold text-white transition-all duration-700',
                    contactsVisible
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-4 opacity-0'
                  )}
                >
                  Key Contacts
                </h3>
                <div className="space-y-4">
                  {keyContacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      style={{
                        transitionDelay: contactsVisible
                          ? `${200 + index * 100}ms`
                          : '0ms',
                      }}
                      className={cn(
                        'group hover:border-primary-500/30 hover:shadow-primary-500/10 rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-500 hover:scale-[1.02] hover:bg-white/10 hover:shadow-lg',
                        contactsVisible
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-4 opacity-0'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-primary-400 text-xs font-semibold tracking-wide uppercase">
                            {contact.role}
                          </p>
                          <p className="mt-1 font-semibold text-white">
                            {contact.name}
                          </p>
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-primary-300 hover:text-primary-200 mt-1 block text-sm transition-colors"
                          >
                            {contact.email}
                          </a>
                        </div>
                        <a
                          href={contact.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:bg-primary-500/20 hover:border-primary-500/30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all"
                        >
                          <LinkedInIcon className="group-hover:text-primary-300 h-5 w-5 text-gray-400" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div
                ref={socialRef}
                className="group/card rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/10 sm:p-8"
              >
                <h3
                  className={cn(
                    'mb-4 text-xl font-bold text-white transition-all duration-700',
                    socialVisible
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-4 opacity-0'
                  )}
                >
                  Follow Us
                </h3>
                <p
                  className={cn(
                    'mb-4 text-sm text-gray-400 transition-all delay-100 duration-700',
                    socialVisible
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-4 opacity-0'
                  )}
                >
                  Stay connected with our latest updates and activities
                </p>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social, index) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        transitionDelay: socialVisible
                          ? `${200 + index * 100}ms`
                          : '0ms',
                      }}
                      className={cn(
                        'group hover:border-primary-500/30 hover:bg-primary-500/10 hover:shadow-primary-500/20 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-all duration-500 hover:scale-105 hover:shadow-lg active:scale-95',
                        socialVisible
                          ? 'translate-y-0 scale-100 opacity-100'
                          : 'translate-y-3 scale-95 opacity-0'
                      )}
                      title={social.name}
                    >
                      <div className="group-hover:text-primary-300 text-gray-400 transition-colors">
                        {social.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                        {social.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        ref={faqRef}
        className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8"
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2
              className={cn(
                'mb-3 text-2xl font-extrabold text-white transition-all duration-700 sm:text-3xl md:text-4xl',
                faqVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-6 opacity-0'
              )}
            >
              Frequently Asked Questions
            </h2>
            <p
              className={cn(
                'text-sm text-gray-400 transition-all delay-150 duration-700 sm:text-base',
                faqVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
            >
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                style={{
                  transitionDelay: faqVisible
                    ? `${300 + index * 100}ms`
                    : '0ms',
                }}
                className={cn(
                  'transition-all duration-500',
                  faqVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                )}
              >
                <FaqItem
                  faq={faq}
                  isActive={activeFaq === faq.id}
                  onToggle={() =>
                    setActiveFaq(activeFaq === faq.id ? null : faq.id)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        icon="💬"
        title="Ready to Get Started?"
        description="Whether you're a student looking to join, a company interested in collaboration, or just want to say hello — we're here to help."
        primaryAction={{ label: 'Join Our Club', href: '/join' }}
        secondaryAction={{ label: 'Explore Events', href: '/events' }}
      />

      <ScrollToTop />
    </main>
  );
}
