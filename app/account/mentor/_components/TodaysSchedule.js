/**
 * @file Today’s schedule — dashboard widget showing the mentor’s
 *   upcoming sessions and tasks for the current day.
 * @module MentorTodaysSchedule
 */

'use client';

import Link from 'next/link';
import { Video, Users, Clock, ExternalLink } from 'lucide-react';

export default function TodaysSchedule({ todaySessions }) {
  return (
    <div className="lg:col-span-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              📅 Today's Schedule
            </h2>
            <p className="text-sm text-gray-400">
              Your upcoming mentoring sessions
            </p>
          </div>
          <Link
            href="/account/mentor/sessions"
            className="rounded-lg bg-green-500/20 px-3 py-1.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/30"
          >
            + Schedule
          </Link>
        </div>
        <div className="space-y-4">
          {todaySessions.map((session) => (
            <div
              key={session.id}
              className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-green-500/30 hover:bg-white/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-emerald-500">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-green-300">
                      {session.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {session.mentee}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.time}
                      </span>
                      <span>•</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          session.type === '1:1'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {session.type}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/30">
                  Join <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
