'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';

const STEPS = ['Basics', 'Academic', 'Experience', 'Review'];

export default function MembershipBenefitsBanner({ progress = 0 }) {
  const completedSteps = Math.round((progress / 100) * STEPS.length);

  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#111418]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5 text-gray-500" />
          Membership application
        </h3>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-medium text-amber-400">
          Not started
        </span>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-[13px] font-medium text-white">
              You&apos;re {progress}% applied
            </div>
            <div className="mt-0.5 text-[11.5px] text-gray-500">
              Takes ~3 minutes · 4 short steps
            </div>
          </div>
          <div className="font-mono text-[22px] font-semibold tracking-tight tabular-nums text-white">
            {completedSteps}/{STEPS.length}
          </div>
        </div>

        <div className="mb-3.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] ${
                i < completedSteps
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                  : 'border-white/[0.07] bg-white/[0.03] text-gray-500'
              }`}
            >
              <span className="font-mono text-[9.5px] text-gray-600">0{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <Link
          href="/account/guest/membership-application"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-[13px] font-semibold text-[#0b0d10] transition-all hover:brightness-110"
        >
          Start application <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
