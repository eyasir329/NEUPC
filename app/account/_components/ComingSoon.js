/**
 * @file Coming soon placeholder page.
 * Displays a placeholder for features under development.
 *
 * @module ComingSoon
 */

'use client';

import Link from 'next/link';
import { Rocket, ArrowLeft } from 'lucide-react';

export default function ComingSoon({
  title,
  description,
  backHref,
  backLabel,
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full border border-blue-500/30 bg-blue-500/10 p-8">
            <Rocket className="h-16 w-16 text-blue-400" />
          </div>
        </div>

        {/* Message */}
        <div className="mb-8 space-y-3">
          <h1 className="text-4xl font-bold text-white">{title}</h1>
          <p className="text-lg text-gray-400">{description}</p>
        </div>

        {/* Back Button */}
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-6 py-3 font-semibold text-blue-300 shadow-lg transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/20 hover:shadow-blue-500/20"
        >
          <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
          <span>{backLabel}</span>
        </Link>

        {/* Additional Info */}
        <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-sm text-gray-400">
            This feature is under development and will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}
