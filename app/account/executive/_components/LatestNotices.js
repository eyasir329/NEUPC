/**
 * @file Latest notices widget — dashboard preview of recently
 *   published club notices with priority indicators.
 * @module ExecutiveLatestNotices
 */

'use client';

import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';

export default function LatestNotices({ latestNotices }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">📰 Latest Notices</h2>
          <p className="text-sm text-gray-400">Recent announcements</p>
        </div>
        <Link
          href="/account/executive/notices/create"
          className="flex items-center gap-1 rounded-lg bg-pink-500/20 px-3 py-1.5 text-sm font-semibold text-pink-300 transition-colors hover:bg-pink-500/30"
        >
          <Plus className="h-4 w-4" />
          Create
        </Link>
      </div>
      <div className="space-y-3">
        {latestNotices.map((notice, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-pink-500/30 hover:bg-white/10"
          >
            <div>
              <h3 className="font-semibold text-white">{notice.title}</h3>
              <p className="mt-1 text-xs text-gray-400">{notice.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  notice.status === 'Published'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {notice.status}
              </span>
              <button className="rounded bg-blue-500/20 p-2 text-blue-300 transition-colors hover:bg-blue-500/30">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
