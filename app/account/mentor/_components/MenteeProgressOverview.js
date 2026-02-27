'use client';

import Link from 'next/link';
import { CheckCircle, Target, AlertCircle } from 'lucide-react';

export default function MenteeProgressOverview({ menteeProgress }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            👥 Mentee Progress Overview
          </h2>
          <p className="text-sm text-gray-400">
            Track your mentees' learning journey
          </p>
        </div>
        <Link
          href="/account/mentor/mentees"
          className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
        >
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid gap-3">
            {menteeProgress.map((mentee) => (
              <div
                key={mentee.id}
                className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/10 sm:grid-cols-12 sm:items-center"
              >
                <div className="sm:col-span-3">
                  <p className="font-semibold text-white">{mentee.name}</p>
                  <p className="mt-1 text-xs text-gray-400">{mentee.roadmap}</p>
                </div>
                <div className="sm:col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full bg-${mentee.statusColor}-500 transition-all duration-500`}
                        style={{ width: `${mentee.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white">
                      {mentee.progress}%
                    </span>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      mentee.statusColor === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : mentee.statusColor === 'green'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {mentee.status === 'Excellent' && (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {mentee.status === 'On Track' && (
                      <Target className="h-3 w-3" />
                    )}
                    {mentee.status === 'Needs Attention' && (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {mentee.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 sm:col-span-3 sm:justify-end">
                  <span className="text-xs text-gray-400">
                    Last: {mentee.lastSession}
                  </span>
                  <button className="rounded bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
