/**
 * @file Recent activity timeline — chronological list of admin-relevant
 *   system events (user checks, completions, security alerts, database
 *   operations) with dynamically resolved icons.
 * @module RecentActivity
 */

'use client';

import {
  Activity,
  Clock,
  UserCheck,
  CheckCircle,
  Shield,
  Database,
} from 'lucide-react';

const iconMap = {
  UserCheck,
  CheckCircle,
  Shield,
  Database,
};

export default function RecentActivity({ recentActivities }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
      </div>
      <div className="space-y-3">
        {recentActivities.map((activity, idx) => {
          const Icon = iconMap[activity.iconName];
          const colorMap = {
            user: 'blue',
            event: 'green',
            role: 'purple',
            system: 'cyan',
          };
          const color = colorMap[activity.type] || 'cyan';

          return (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
            >
              <div className={`rounded-full bg-${color}-500/20 p-2`}>
                <Icon className={`h-4 w-4 text-${color}-400`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {activity.action}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
