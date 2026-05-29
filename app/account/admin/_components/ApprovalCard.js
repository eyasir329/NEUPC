/**
 * @file Approval card — single pending-approval row with approve /
 *   reject actions. Dark-glass surface and Avatar pattern matching the
 *   member panel.
 * @module ApprovalCard
 */

'use client';

import { Check, X } from 'lucide-react';
import { Avatar } from '@/app/account/_components/ui';

export default function ApprovalCard({ approval }) {
  const handleApprove = () => {
    console.log('Approved:', approval.id);
  };

  const handleReject = () => {
    console.log('Rejected:', approval.id);
  };

  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={approval.user} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">
            {approval.user}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {approval.type} · {approval.date}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleApprove}
          aria-label="Approve"
          className="flex items-center gap-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-500/20"
        >
          <Check className="w-3 h-3" />
          Approve
        </button>
        <button
          onClick={handleReject}
          aria-label="Reject"
          className="flex items-center gap-1 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-300 transition-colors hover:bg-rose-500/20"
        >
          <X className="w-3 h-3" />
          Reject
        </button>
      </div>
    </div>
  );
}
