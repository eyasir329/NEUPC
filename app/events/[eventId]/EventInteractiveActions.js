/**
 * @file Client-side event interactive actions (countdown, calendar sync, social share).
 * @module EventInteractiveActions
 */

'use client';

import { useState, useEffect, useRef } from 'react';

/* ── SVG Icons ── */

function IconCalendar({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
      />
    </svg>
  );
}

function IconShare({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l5.57 3.248m-5.57-3.248l5.57-3.248M13.5 5.25a2.25 2.25 0 113 0m-3 0l-5.57 3.248m5.57-3.248l5.57-3.248M18 10.5a2.25 2.25 0 11-3 0m3 0l-5.57 3.248m5.57-3.248l-5.57 3.248"
      />
    </svg>
  );
}

function IconCopy({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function IconCheck({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function IconXTwitter({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedIn({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconFacebook({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/* ── Calendar Helper — formatting date for iCal and Google templates ── */
function formatCalendarDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/* ──────────────────────────────────────────────────────────────────────── */
/* EventInteractiveActions                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

export default function EventInteractiveActions({ event }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    title = '',
    description = '',
    start_date,
    end_date,
    location = '',
    registration_deadline,
    status = '',
  } = event;

  const isCompleted = status === 'completed';

  // ── Countdown Timer Logic ──
  useEffect(() => {
    if (isCompleted || !start_date) return;

    const targetTime = new Date(start_date).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ expired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [start_date, isCompleted]);

  // ── Click Outside to Close Calendar Dropdown ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Share URLs ──
  const [originUrl, setOriginUrl] = useState('');
  useEffect(() => {
    setOriginUrl(window.location.href);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(originUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareText = `Check out this amazing event at NEUPC: ${title}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(originUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(originUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(originUrl)}`;

  // ── Add to Calendar URLs ──
  const utcStart = formatCalendarDate(start_date);
  const utcEnd = formatCalendarDate(end_date || new Date(new Date(start_date).getTime() + 7200000).toISOString()); // Default 2 hours

  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${utcStart}/${utcEnd}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

  // Generate iCal ICS content
  const handleDownloadICS = () => {
    const cleanDesc = description.replace(/\n/g, '\\n').replace(/,/g, '\\,');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NEUPC//Programming Club Events//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `DTSTART:${utcStart}`,
      `DTEND:${utcEnd}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${cleanDesc}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* ── Countdown Timer Panel (Only for Upcoming Events) ── */}
      {!isCompleted && timeLeft && !timeLeft.expired && (
        <div className="holographic-card no-lift border-neon-lime/10 relative overflow-hidden rounded-2xl border bg-white/2 p-5 backdrop-blur-md">
          {/* Subtle neon corner indicator */}
          <div className="absolute top-0 right-0 h-1.5 w-12 rounded-bl-lg bg-linear-to-l from-neon-lime to-neon-violet" />
          
          <p className="mb-3 font-mono text-[9px] font-bold tracking-[0.3em] text-zinc-500 uppercase sm:text-[10px]">
            /// Event Countdown
          </p>

          <div className="grid grid-cols-4 gap-2">
            {/* Days */}
            <div className="flex flex-col items-center justify-center rounded-xl bg-white/3 border border-white/5 py-3 px-1 backdrop-blur-xs">
              <span className="font-mono text-xl font-black text-white sm:text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="mt-1 font-mono text-[8px] font-medium tracking-widest text-zinc-500 uppercase sm:text-[9px]">
                Days
              </span>
            </div>
            {/* Hours */}
            <div className="flex flex-col items-center justify-center rounded-xl bg-white/3 border border-white/5 py-3 px-1 backdrop-blur-xs">
              <span className="font-mono text-xl font-black text-white sm:text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="mt-1 font-mono text-[8px] font-medium tracking-widest text-zinc-500 uppercase sm:text-[9px]">
                Hours
              </span>
            </div>
            {/* Minutes */}
            <div className="flex flex-col items-center justify-center rounded-xl bg-white/3 border border-white/5 py-3 px-1 backdrop-blur-xs">
              <span className="font-mono text-xl font-black text-white sm:text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="mt-1 font-mono text-[8px] font-medium tracking-widest text-zinc-500 uppercase sm:text-[9px]">
                Min
              </span>
            </div>
            {/* Seconds */}
            <div className="flex flex-col items-center justify-center rounded-xl bg-white/3 border border-white/5 py-3 px-1 backdrop-blur-xs">
              <span className="text-neon-lime font-mono text-xl font-black sm:text-2xl drop-shadow-[0_0_12px_rgba(182,243,107,0.4)]">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="mt-1 font-mono text-[8px] font-medium tracking-widest text-zinc-500 uppercase sm:text-[9px]">
                Sec
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar & Sharing Action Strip ── */}
      <div className="grid grid-cols-2 gap-2">
        {/* Add to Calendar Dropdown */}
        {!isCompleted && start_date && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="group hover:border-white/20 hover:bg-white/8 hover:text-white flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/3 py-3 px-3 font-mono text-[10px] font-bold tracking-widest text-zinc-300 uppercase transition-all"
            >
              <IconCalendar className="text-neon-lime group-hover:scale-105 h-4 w-4 transition-transform" />
              Add Calendar
            </button>

            {calendarOpen && (
              <div className="absolute left-0 z-30 mt-2 w-full rounded-xl border border-white/10 bg-[#0c0d14] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setCalendarOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-mono text-[10px] text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Google Calendar
                </a>
                <button
                  onClick={() => {
                    handleDownloadICS();
                    setCalendarOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-mono text-[10px] text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                  Apple iCal (.ics)
                </button>
                <a
                  href={googleCalUrl} // Falls back to templated redirect
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setCalendarOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-mono text-[10px] text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Outlook Web
                </a>
              </div>
            )}
          </div>
        )}

        {/* Share Button (Toggles copy link fallback or handles direct sharing) */}
        <button
          onClick={handleCopyLink}
          className={`group hover:text-white flex items-center justify-center gap-2 rounded-xl border py-3 px-3 font-mono text-[10px] font-bold tracking-widest uppercase transition-all ${
            copied
              ? 'border-neon-lime/30 bg-neon-lime/8 text-neon-lime hover:bg-neon-lime/12'
              : 'border-white/10 bg-white/3 text-zinc-300 hover:border-white/20 hover:bg-white/8'
          } ${isCompleted || !start_date ? 'col-span-2' : ''}`}
        >
          {copied ? (
            <>
              <IconCheck className="text-neon-lime h-4 w-4 animate-scale" />
              Copied!
            </>
          ) : (
            <>
              <IconShare className="text-neon-violet group-hover:scale-105 h-4 w-4 transition-transform" />
              Copy Link
            </>
          )}
        </button>
      </div>

      {/* Social Icons row */}
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 py-2.5 px-4 backdrop-blur-md">
        <span className="font-mono text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
          Share Event
        </span>
        <div className="flex items-center gap-2">
          {/* X (Twitter) */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/2 text-zinc-400 hover:border-white/15 hover:bg-white/5 hover:text-white transition-all"
            title="Share on X"
          >
            <IconXTwitter className="h-3.5 w-3.5" />
          </a>
          {/* LinkedIn */}
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/2 text-zinc-400 hover:border-white/15 hover:bg-white/5 hover:text-[#0077b5] transition-all"
            title="Share on LinkedIn"
          >
            <IconLinkedIn className="h-3.5 w-3.5" />
          </a>
          {/* Facebook */}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/2 text-zinc-400 hover:border-white/15 hover:bg-white/5 hover:text-[#1877f2] transition-all"
            title="Share on Facebook"
          >
            <IconFacebook className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
