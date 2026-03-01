/**
 * @file Recent participation section — dashboard preview of the
 *   guest’s latest event attendance and activity history.
 * @module GuestRecentParticipationSection
 */

'use client';

import { Calendar, CheckCircle, Award } from 'lucide-react';

export default function RecentParticipationSection({ participation }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">
          🏆 Recent Participation
        </h2>
        <p className="text-sm text-gray-400">Your event history</p>
      </div>
      <div className="space-y-3">
        {participation.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-white">{item.event}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="h-3 w-3" />
                {item.date}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-300">
                <CheckCircle className="h-3 w-3" />
                Attended
              </span>
              {item.certificate && (
                <button className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                  <Award className="h-3 w-3" />
                  Certificate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
