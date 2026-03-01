/**
 * @file Executive header banner — gradient card with the committee
 *   member’s name, position title, and quick summary stats.
 * @module ExecutiveHeader
 */

'use client';

import { Crown } from 'lucide-react';

export default function ExecutiveHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 backdrop-blur-xl sm:p-8">
      <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-purple-500/20 blur-3xl" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <Crown className="h-6 w-6 text-amber-400" />
          <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-semibold text-amber-300">
            Executive Committee
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Executive Dashboard
        </h1>
        <p className="mt-2 text-gray-300">
          Term: 2025–2026 • Manage events, members, and content operations
        </p>
      </div>
    </div>
  );
}
