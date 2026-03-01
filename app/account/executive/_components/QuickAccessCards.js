/**
 * @file Quick access cards — navigation tiles linking to frequently
 *   used executive management features.
 * @module ExecutiveQuickAccessCards
 */

'use client';

import Link from 'next/link';
import { Image, Award, BarChart3, Plus, Settings, Eye } from 'lucide-react';

export default function QuickAccessCards() {
  return (
    <div className="space-y-4">
      {/* Gallery Quick Access */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Image className="h-5 w-5 text-cyan-400" />
          <h3 className="font-bold text-white">Gallery</h3>
        </div>
        <p className="mb-4 text-sm text-gray-400">Manage club photos</p>
        <Link
          href="/account/executive/gallery/manage"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
        >
          <Plus className="h-4 w-4" />
          Upload
        </Link>
      </div>

      {/* Certificate Generator */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-400" />
          <h3 className="font-bold text-white">Certificates</h3>
        </div>
        <p className="mb-4 text-sm text-gray-400">Generate certificates</p>
        <Link
          href="/account/executive/certificates/generate"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/30"
        >
          <Settings className="h-4 w-4" />
          Generate
        </Link>
      </div>

      {/* Reports Quick Access */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-400" />
          <h3 className="font-bold text-white">Reports</h3>
        </div>
        <p className="mb-4 text-sm text-gray-400">Analytics & insights</p>
        <Link
          href="/account/executive/reports"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-500/30"
        >
          <Eye className="h-4 w-4" />
          View
        </Link>
      </div>
    </div>
  );
}
