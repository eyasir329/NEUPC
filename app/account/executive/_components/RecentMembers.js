/**
 * @file Recent members widget — dashboard preview of newly joined
 *   or recently approved club members.
 * @module ExecutiveRecentMembers
 */

'use client';

import Link from 'next/link';

export default function RecentMembers({ recentMembers }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">👥 Recent Members</h2>
          <p className="text-sm text-gray-400">Last 7 days</p>
        </div>
        <Link
          href="/account/executive/members"
          className="rounded-lg bg-green-500/20 px-3 py-1.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/30"
        >
          Manage
        </Link>
      </div>
      <div className="space-y-3">
        {recentMembers.map((member, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-green-500/30 hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white">{member.name}</p>
                <p className="text-xs text-gray-400">{member.joinDate}</p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                member.activity === 'High'
                  ? 'bg-green-500/20 text-green-300'
                  : member.activity === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-red-500/20 text-red-300'
              }`}
            >
              {member.activity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
