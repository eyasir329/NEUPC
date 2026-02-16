'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // Trigger animations on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Contact information
  const contactInfo = {
    email: 'programmingclub@nu.edu.bd',
    phone: '+880 1XXX-XXXXXX',
    address: 'Department of CSE, Netrokona University, Netrokona, Bangladesh',
    officeHours: 'Sunday - Thursday, 10:00 AM - 4:00 PM',
  };

  // Key contacts
  const keyContacts = [
    {
      id: 1,
      role: 'President',
      name: 'Md. Ariful Islam',
      email: 'president@neupc.com',
      linkedin: '#',
    },
    {
      id: 2,
      role: 'General Secretary',
      name: 'Sabbir Ahmed',
      email: 'gs@neupc.com',
      linkedin: '#',
    },
    {
      id: 3,
      role: 'Faculty Advisor',
      name: 'Dr. Mohammad Rahman',
      email: 'advisor@nu.edu.bd',
      linkedin: '#',
    },
  ];

  // Subject options
  const subjects = [
    'General Inquiry',
    'Membership Information',
    'Event Participation',
    'Collaboration Proposal',
    'Sponsorship Inquiry',
    'Technical Support',
    'Feedback / Suggestion',
  ];

  // Social media links
  const socialLinks = [
    {
      id: 1,
      name: 'Facebook',
      url: '#',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: 2,
      name: 'LinkedIn',
      url: '#',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      id: 3,
      name: 'GitHub',
      url: '#',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
    {
      id: 4,
      name: 'YouTube',
      url: '#',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  // FAQ data
  const faqs = [
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

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    }, 1500);
  };

  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8 lg:py-28">
        {/* Animated Decorative Elements */}
        <div className="from-primary-500/10 fixed top-20 right-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"></div>
        <div
          className="from-secondary-500/10 fixed bottom-20 left-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"
          style={{ animationDelay: '1s' }}
        ></div>

        <div className="relative mx-auto max-w-7xl text-center">
          <div
            className={`bg-primary-500/10 text-primary-300 ring-primary-500/20 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-all duration-700 sm:text-sm ${
              isLoaded
                ? 'translate-y-0 opacity-100'
                : '-translate-y-4 opacity-0'
            }`}
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
            className={`from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-3xl leading-tight font-extrabold text-transparent transition-all delay-100 duration-700 sm:text-4xl md:text-5xl lg:text-6xl ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            Get in Touch
          </h1>

          <p
            className={`mx-auto mb-8 max-w-3xl text-sm leading-relaxed text-gray-300 transition-all delay-200 duration-700 sm:text-base md:text-lg lg:text-xl ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
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
              className={`transition-all duration-700 ${
                isLoaded
                  ? 'translate-x-0 opacity-100'
                  : '-translate-x-8 opacity-0'
              }`}
            >
              <div className="group/form hover:border-primary-500/20 hover:shadow-primary-500/5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl sm:p-8">
                <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
                  Send us a Message
                </h2>

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

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-2 focus:outline-none ${
                        errors.name
                          ? 'border-red-500/50 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20 focus:ring-red-500/50'
                          : 'focus:border-primary-500 focus:ring-primary-500/50 focus:shadow-primary-500/20 border-white/10 focus:shadow-lg'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-2 focus:outline-none ${
                        errors.email
                          ? 'border-red-500/50 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20 focus:ring-red-500/50'
                          : 'focus:border-primary-500 focus:ring-primary-500/50 focus:shadow-primary-500/20 border-white/10 focus:shadow-lg'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field (Optional) */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Phone Number{' '}
                      <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="focus:border-primary-500 focus:ring-primary-500/50 focus:shadow-primary-500/20 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:shadow-lg focus:ring-2 focus:outline-none"
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>

                  {/* Subject Dropdown */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-white backdrop-blur-sm transition-all focus:ring-2 focus:outline-none ${
                        errors.subject
                          ? 'border-red-500/50 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20 focus:ring-red-500/50'
                          : 'focus:border-primary-500 focus:ring-primary-500/50 focus:shadow-primary-500/20 border-white/10 focus:shadow-lg'
                      }`}
                    >
                      <option value="" className="bg-gray-900">
                        Select a subject
                      </option>
                      {subjects.map((subject) => (
                        <option
                          key={subject}
                          value={subject}
                          className="bg-gray-900"
                        >
                          {subject}
                        </option>
                      ))}
                    </select>
                    {errors.subject && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message Field */}
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className={`w-full resize-none rounded-lg border bg-white/5 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-2 focus:outline-none ${
                        errors.message
                          ? 'border-red-500/50 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20 focus:ring-red-500/50'
                          : 'focus:border-primary-500 focus:ring-primary-500/50 focus:shadow-primary-500/20 border-white/10 focus:shadow-lg'
                      }`}
                      placeholder="Tell us what's on your mind..."
                    ></textarea>
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
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group from-primary-500/40 to-secondary-500/40 hover:shadow-primary-500/50 border-primary-500/50 hover:border-primary-500/70 relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border bg-linear-to-r px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>

                    {isSubmitting ? (
                      <>
                        <svg
                          className="h-5 w-5 animate-spin"
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
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <svg
                          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
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
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div
              className={`space-y-6 transition-all delay-200 duration-700 ${
                isLoaded
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-8 opacity-0'
              }`}
            >
              {/* Official Contact Info */}
              <div className="group/card hover:border-primary-500/30 hover:shadow-primary-500/10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl sm:p-8">
                <h2 className="mb-6 text-2xl font-bold text-white">
                  Contact Information
                </h2>

                <div className="space-y-5">
                  {/* Email */}
                  <div className="group flex items-start gap-4">
                    <div className="border-primary-500/30 bg-primary-500/10 group-hover:border-primary-500/50 group-hover:bg-primary-500/20 group-hover:shadow-primary-500/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 group-hover:shadow-lg">
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
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Email</p>
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="text-primary-300 hover:text-primary-200 mt-1 block text-base font-semibold transition-colors"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="group flex items-start gap-4">
                    <div className="border-secondary-500/30 bg-secondary-500/10 group-hover:border-secondary-500/50 group-hover:bg-secondary-500/20 group-hover:shadow-secondary-500/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 group-hover:shadow-lg">
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
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Phone</p>
                      <a
                        href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                        className="text-secondary-300 hover:text-secondary-200 mt-1 block text-base font-semibold transition-colors"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="group flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 transition-all duration-300 group-hover:scale-110 group-hover:border-purple-500/50 group-hover:bg-purple-500/20 group-hover:shadow-lg group-hover:shadow-purple-500/20">
                      <svg
                        className="h-6 w-6 text-purple-300 transition-transform duration-300 group-hover:scale-110"
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
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        Address
                      </p>
                      <p className="mt-1 text-base text-gray-300">
                        {contactInfo.address}
                      </p>
                    </div>
                  </div>

                  {/* Office Hours */}
                  <div className="group flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-pink-500/30 bg-pink-500/10 transition-all duration-300 group-hover:scale-110 group-hover:border-pink-500/50 group-hover:bg-pink-500/20 group-hover:shadow-lg group-hover:shadow-pink-500/20">
                      <svg
                        className="h-6 w-6 text-pink-300 transition-transform duration-300 group-hover:scale-110"
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
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        Office Hours
                      </p>
                      <p className="mt-1 text-base text-gray-300">
                        {contactInfo.officeHours}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Contacts */}
              <div className="group/card hover:border-secondary-500/30 hover:shadow-secondary-500/10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-white">
                  Key Contacts
                </h3>
                <div className="space-y-4">
                  {keyContacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      style={{ animationDelay: `${index * 100}ms` }}
                      className="group animate-fade-in hover:border-primary-500/30 hover:shadow-primary-500/10 rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:scale-[1.02] hover:bg-white/10 hover:shadow-lg"
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
                          <svg
                            className="group-hover:text-primary-300 h-5 w-5 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="group/card rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/10 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-white">Follow Us</h3>
                <p className="mb-4 text-sm text-gray-400">
                  Stay connected with our latest updates and activities
                </p>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social, index) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ animationDelay: `${index * 100}ms` }}
                      className="group animate-fade-in hover:border-primary-500/30 hover:bg-primary-500/10 hover:shadow-primary-500/20 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-all hover:scale-105 hover:shadow-lg active:scale-95"
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
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="group hover:border-primary-500/30 hover:shadow-primary-500/10 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10 hover:shadow-lg"
              >
                <button
                  onClick={() =>
                    setActiveFaq(activeFaq === faq.id ? null : faq.id)
                  }
                  className="flex w-full items-center justify-between p-5 text-left transition-all hover:bg-white/5"
                >
                  <span className="group-hover:text-primary-200 pr-4 text-base font-semibold text-white transition-colors sm:text-lg">
                    {faq.question}
                  </span>
                  <svg
                    className={`text-primary-300 group-hover:text-primary-200 h-5 w-5 shrink-0 transition-all duration-300 ${
                      activeFaq === faq.id ? 'rotate-180' : ''
                    }`}
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
                  className={`overflow-hidden transition-all duration-300 ${
                    activeFaq === faq.id ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="border-t border-white/10 bg-black/20 p-5">
                    <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 text-6xl">💬</div>
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-gray-300 sm:text-base lg:text-lg">
            Whether you&apos;re a student looking to join, a company interested
            in collaboration, or just want to say hello — we&apos;re here to
            help.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/join"
              className="group border-primary-500/50 from-primary-500/40 to-secondary-500/40 hover:shadow-primary-500/50 hover:border-primary-500/70 relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border bg-linear-to-r px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              <span>Join Our Club</span>
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/events"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-white/10 hover:shadow-lg active:scale-95 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              <span>Explore Events</span>
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="group animate-fade-in fixed right-4 bottom-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-white/30 hover:bg-white/20 active:scale-95 sm:right-6 sm:bottom-6 sm:h-12 sm:w-12 lg:right-8 lg:bottom-8"
          aria-label="Scroll to top"
        >
          <svg
            className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </main>
  );
}
