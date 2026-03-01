/**
 * @file Achievements — dashboard preview of notable club accomplishments
 *   and award summaries for advisor oversight.
 * @module AdvisorAchievements
 */

'use client';

import Link from 'next/link';
import { Award } from 'lucide-react';

export default function Achievements({ achievements }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">🏆 Achievements</h2>
          <p className="text-sm text-gray-400">Recent accomplishments</p>
        </div>
        <Link
          href="/account/advisor/achievements"
          className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/30"
        >
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {achievements.map((achievement, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-amber-500/30 hover:bg-white/10"
          >
            <Award className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">
                {achievement.title}
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                {achievement.category} • {achievement.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
