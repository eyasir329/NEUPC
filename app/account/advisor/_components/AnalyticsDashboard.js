'use client';

import Link from 'next/link';
import { BarChart3, Eye } from 'lucide-react';

export default function AnalyticsDashboard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-purple-400" />
        <h3 className="font-bold text-white">Analytics</h3>
      </div>
      <p className="mb-4 text-sm text-gray-400">View insights</p>
      <Link
        href="/account/advisor/analytics"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-500/30"
      >
        <Eye className="h-4 w-4" />
        View Dashboard
      </Link>
    </div>
  );
}
