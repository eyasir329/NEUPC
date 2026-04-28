'use client';

import Link from 'next/link';
import { Calendar, Sparkles } from 'lucide-react';

export default function GuestWelcomeHeader({ userName }) {
  return (
    <div className="mb-6">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-blue-400">
        Guest dashboard
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[26px]">
            Welcome back, {userName}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Explore events and public resources — or apply to unlock full member access.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:border-white/20 hover:bg-white/10"
          >
            <Calendar className="h-3.5 w-3.5" />
            Browse events
          </Link>
          <Link
            href="/account/guest/membership-application"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-[#0b0d10] transition-all hover:brightness-110"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Apply for membership
          </Link>
        </div>
      </div>
    </div>
  );
}
