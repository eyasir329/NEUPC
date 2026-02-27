'use client';

import { TrendingUp } from 'lucide-react';

export default function SystemMetrics({ systemStats }) {
  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
      {systemStats.map((stat, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-400">{stat.label}</p>
            {stat.trend === 'up' && (
              <TrendingUp className={`h-4 w-4 text-${stat.color}-400`} />
            )}
          </div>
          <p className={`mt-2 text-2xl font-bold text-${stat.color}-400`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
