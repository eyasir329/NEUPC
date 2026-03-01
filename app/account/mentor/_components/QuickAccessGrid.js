/**
 * @file Quick access grid — navigation tiles linking to frequently
 *   used mentor features such as sessions, tasks, and resources.
 * @module MentorQuickAccessGrid
 */

'use client';

import Link from 'next/link';
import {
  Target,
  BookOpen,
  BarChart3,
  FileText,
  ExternalLink,
} from 'lucide-react';

export default function QuickAccessGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <Link
        href="/account/mentor/roadmaps"
        className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-white/10 sm:p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-6 w-6 text-purple-400" />
          <h3 className="font-bold text-white">Roadmaps</h3>
        </div>
        <p className="mb-4 text-sm text-gray-400">
          Assign & track learning paths
        </p>
        <div className="flex items-center text-sm font-semibold text-purple-300">
          Manage <ExternalLink className="ml-2 h-4 w-4" />
        </div>
      </Link>

      <Link
        href="/account/mentor/resources"
        className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10 sm:p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-cyan-400" />
          <h3 className="font-bold text-white">Resources</h3>
        </div>
        <p className="mb-4 text-sm text-gray-400">Upload materials & guides</p>
        <div className="flex items-center text-sm font-semibold text-cyan-300">
          Browse <ExternalLink className="ml-2 h-4 w-4" />
        </div>
      </Link>

      <Link
        href="/account/mentor/reports"
        className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:bg-white/10 sm:p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-amber-400" />
          <h3 className="font-bold text-white">Reports</h3>
        </div>
        <p className="mb-4 text-sm text-gray-400">Analytics & insights</p>
        <div className="flex items-center text-sm font-semibold text-amber-300">
          View Stats <ExternalLink className="ml-2 h-4 w-4" />
        </div>
      </Link>

      <Link
        href="/account/mentor/announcements"
        className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-pink-500/30 hover:bg-white/10 sm:p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-6 w-6 text-pink-400" />
          <h3 className="font-bold text-white">Announcements</h3>
        </div>
        <p className="mb-4 text-sm text-gray-400">Post updates & reminders</p>
        <div className="flex items-center text-sm font-semibold text-pink-300">
          Create <ExternalLink className="ml-2 h-4 w-4" />
        </div>
      </Link>
    </div>
  );
}
