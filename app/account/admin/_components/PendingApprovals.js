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
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 rounded-2xl shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">
              Pending Approvals
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {pendingApprovals.length > 0
                ? `${pendingApprovals.length} item${pendingApprovals.length === 1 ? '' : 's'} awaiting review`
                : 'Queue clear'}
            </p>
          </div>
        </div>
        <Link
          href="/account/admin/applications"
          className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 px-3 py-1.5 transition-colors shrink-0"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          View all
        </Link>
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
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
