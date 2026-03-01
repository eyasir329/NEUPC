/**
 * @file Club overview — high-level snapshot of club health including
 *   member count, active events, and committee composition.
 * @module AdvisorClubOverview
 */

'use client';

import Link from 'next/link';

export default function ClubOverview({ committee }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">🏛 Club Overview</h2>
          <p className="text-sm text-gray-400">Committee structure</p>
        </div>
        <Link
          href="/account/advisor/club-overview"
          className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/30"
        >
          Details
        </Link>
      </div>
      <div className="space-y-3">
        {committee.map((member, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-indigo-500/30 hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-blue-500 text-sm font-bold text-white">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white">{member.name}</p>
                <p className="text-xs text-gray-400">{member.role}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-300">
                {member.status}
              </span>
              <p className="mt-1 text-xs text-gray-400">{member.term}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
