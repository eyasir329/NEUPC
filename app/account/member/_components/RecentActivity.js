'use client';

import { Calendar, CheckCircle, Award, MessageSquare } from 'lucide-react';

const iconMap = {
  Calendar: Calendar,
  CheckCircle: CheckCircle,
  Award: Award,
  MessageSquare: MessageSquare,
};

const colorClasses = {
  blue: 'bg-blue-500/20',
  green: 'bg-green-500/20',
  amber: 'bg-amber-500/20',
  purple: 'bg-purple-500/20',
};

const iconColorClasses = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  amber: 'text-amber-400',
  purple: 'text-purple-400',
};

export default function RecentActivity({ recentActivities }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">⚡ Recent Activity</h2>
        <p className="text-sm text-gray-400">Your latest actions</p>
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
