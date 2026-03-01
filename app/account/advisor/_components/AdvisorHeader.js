/**
 * @file Advisor header — gradient card displaying the advisor’s name,
 *   title, and advisory period with quick-action links.
 * @module AdvisorHeader
 */

'use client';

import { Shield } from 'lucide-react';

export default function AdvisorHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-500/10 via-blue-500/10 to-indigo-500/10 p-6 backdrop-blur-xl sm:p-8">
      <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-500/10 blur-3xl" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-400" />
          <span className="rounded-full bg-indigo-400/20 px-3 py-1 text-sm font-semibold text-indigo-300">
            Faculty Advisor
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Advisor Dashboard
        </h1>
        <p className="mt-2 text-gray-300">
          Strategic Oversight • Policy Guidance • Institutional Alignment
        </p>
      </div>
    </div>
  );
}
