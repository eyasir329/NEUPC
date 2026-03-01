/**
 * @file Guest welcome header — gradient card greeting the guest by
 *   name with a membership application CTA and account status.
 * @module GuestWelcomeHeader
 */

'use client';

import Link from 'next/link';
import { User, Sparkles, ArrowRight } from 'lucide-react';

export default function GuestWelcomeHeader({ userName }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-linear-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 p-6 backdrop-blur-xl sm:p-8">
      <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-pink-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              👋 Welcome, {userName}!
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-300">
                <User className="h-4 w-4" />
                Guest Account
              </span>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
                Limited Access
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Unlock full access by becoming a member
            </p>
          </div>
          <Link
            href="/join"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white shadow-xl shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
          >
            <Sparkles className="h-5 w-5" />
            <span className="whitespace-nowrap">Apply for Membership</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
