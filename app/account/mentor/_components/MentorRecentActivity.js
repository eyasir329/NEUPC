/**
 * @file Mentor recent activity — chronological feed of the mentor’s
 *   latest interactions including sessions, task reviews, and notes.
 * @module MentorRecentActivity
 */

'use client';

import { CheckCircle, UserPlus, BookOpen, Star } from 'lucide-react';

const iconMap = {
  CheckCircle: CheckCircle,
  UserPlus: UserPlus,
  BookOpen: BookOpen,
  Star: Star,
};

const colorClasses = {
  green: 'bg-green-500/20',
  blue: 'bg-blue-500/20',
  purple: 'bg-purple-500/20',
  amber: 'bg-amber-500/20',
};

const iconColorClasses = {
  green: 'text-green-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  amber: 'text-amber-400',
};

export default function MentorRecentActivity({ recentActivities }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">⚡ Recent Activity</h2>
        <p className="text-sm text-gray-400">Latest updates</p>
      </div>
      <div className="space-y-3">
        {recentActivities.map((activity, idx) => {
          const Icon = iconMap[activity.icon];
          return (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
            >
              <div
                className={`rounded-full ${colorClasses[activity.color]} p-2`}
              >
                <Icon
                  className={`h-4 w-4 ${iconColorClasses[activity.color]}`}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {activity.action}
                </p>
                <p className="mt-1 text-xs text-gray-400">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
