'use client';

import Link from 'next/link';
import { Trophy, Check, Lock, ChevronRight } from 'lucide-react';

export default function RecentParticipationSection({ participation }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#111418]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
          <Trophy className="h-3.5 w-3.5 text-gray-500" />
          Recent attendance
        </h3>
        <Link
          href="/account/guest/participation"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-400 transition-colors hover:text-white"
        >
          All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div>
        {participation.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] ${
              i < participation.length - 1 ? 'border-b border-white/[0.07]' : ''
            }`}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium text-white">{item.event}</div>
              <div className="font-mono mt-0.5 text-[11px] text-gray-600">{item.date}</div>
            </div>
            {item.certificate && (
              <div className="group relative shrink-0 cursor-help">
                <button
                  disabled
                  className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-gray-500 opacity-60"
                >
                  <Lock className="h-2.5 w-2.5" />
                  Cert
                </button>
                <span className="pointer-events-none absolute bottom-[calc(100%+6px)] right-0 z-10 w-52 rounded-lg border border-white/10 bg-[#050608] p-2.5 text-[11.5px] text-gray-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                  <strong className="text-blue-400">Member-only feature</strong>
                  <br />
                  Members can download attendance certificates.
                  <span className="mt-1.5 block font-semibold text-blue-400">Apply for membership →</span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
