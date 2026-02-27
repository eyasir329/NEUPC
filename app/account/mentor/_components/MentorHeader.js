'use client';

import { Star, Sparkles } from 'lucide-react';

export default function MentorHeader({ mentorName, stats }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 p-6 backdrop-blur-xl sm:p-8">
      <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-blue-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              👨‍🏫 Welcome back, {mentorName}!
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">
                Technical Mentor
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
                <Star className="h-3 w-3 fill-amber-300" />
                {stats.averageRating} Rating
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">Completion Rate</p>
                <p className="text-sm font-bold text-white">
                  {stats.completionRate}%
                </p>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-blue-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
