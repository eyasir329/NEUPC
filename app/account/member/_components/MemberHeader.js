'use client';

import { Zap } from 'lucide-react';

export default function MemberHeader({ firstName, userLevel }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 backdrop-blur-xl sm:p-8">
      <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-purple-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              👋 Welcome back, {firstName}!
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-300">
                {userLevel.level}
              </span>
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-300">
                Membership: {userLevel.membershipStatus}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-xs text-gray-400">XP Progress</p>
                <p className="text-sm font-bold text-white">
                  {userLevel.xp} / {userLevel.nextLevelXp}
                </p>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-500"
                style={{
                  width: `${(userLevel.xp / userLevel.nextLevelXp) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
