'use client';

import Link from 'next/link';
import { BookOpen, Users, ExternalLink } from 'lucide-react';

export default function QuickAccessSection() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h3 className="font-bold text-white">Resources</h3>
        </div>
        <p className="mb-4 text-sm text-gray-400">Learning materials</p>
        <Link
          href="/account/member/resources"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
        >
          Browse
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-pink-400" />
          <h3 className="font-bold text-white">Community</h3>
        </div>
        <p className="mb-4 text-sm text-gray-400">Join discussions</p>
        <Link
          href="/account/member/discussions"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500/20 px-4 py-2 text-sm font-semibold text-pink-300 transition-colors hover:bg-pink-500/30"
        >
          Explore
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
