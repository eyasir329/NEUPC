/**
 * @file Achievements section — dashboard widget highlighting the
 *   member’s recently earned badges and progress towards new ones.
 * @module MemberAchievementsSection
 */

'use client';

import Link from 'next/link';

export default function AchievementsSection({ achievements }) {
  return (
    <div className="lg:col-span-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🏆 Achievements</h2>
            <p className="text-sm text-gray-400">Badges you've earned</p>
          </div>
          <Link
            href="/account/member/achievements"
            className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/30"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 2xl:grid-cols-8">
          {achievements.map((achievement, idx) => (
            <div
              key={idx}
              className={`group rounded-lg border p-4 text-center transition-all duration-200 ${
                achievement.earned
                  ? 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50 hover:bg-amber-500/20'
                  : 'border-white/10 bg-white/5 opacity-50'
              }`}
            >
              <div className="text-3xl">{achievement.icon}</div>
              <p
                className={`mt-2 text-xs font-semibold ${
                  achievement.earned ? 'text-amber-300' : 'text-gray-500'
                }`}
              >
                {achievement.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
