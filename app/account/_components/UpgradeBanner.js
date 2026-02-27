'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function UpgradeBanner({ accountStatus, userRoles }) {
  if (accountStatus !== 'active') {
    return null;
  }

  const isGuestOnly =
    userRoles.includes('guest') && !userRoles.some((role) => role !== 'guest');

  if (!isGuestOnly) {
    return null;
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-purple-500/30 bg-linear-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 p-1">
      <div className="rounded-xl bg-gray-900/80 p-6 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
            <Sparkles className="h-8 w-8 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-xl font-bold text-white">
              Unlock Full Access
            </h3>
            <p className="text-sm text-gray-300">
              Apply for membership to access exclusive features, contests, and
              mentorship programs.
            </p>
          </div>
          <Link
            href="/account/guest/membership-application"
            className="shrink-0 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}
