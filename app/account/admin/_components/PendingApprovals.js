/**
 * @file Pending approvals list — dark-glass panel of items awaiting
 *   admin action with a link to the full approvals queue. Matches the
 *   member panel side-rail design language.
 * @module PendingApprovals
 */

'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import ApprovalCard from './ApprovalCard';

export default function PendingApprovals({ pendingApprovals = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Pending Approvals
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {pendingApprovals.length > 0
                ? `${pendingApprovals.length} item${pendingApprovals.length === 1 ? '' : 's'} awaiting review`
                : 'Queue clear'}
            </p>
          </div>
        </div>
        <Link
          href="/account/admin/applications"
          className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-100"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          View all
        </Link>
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="py-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
          <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
            Nothing to review
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingApprovals.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </div>
      )}
    </div>
  );
}
