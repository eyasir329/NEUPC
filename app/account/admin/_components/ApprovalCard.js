/**
 * @file Approval card — renders a single pending-approval item with
 *   approve / reject action handlers, approval type, requester name,
 *   and submission date.
 * @module ApprovalCard
 */

'use client';

import { AlertCircle } from 'lucide-react';

export default function ApprovalCard({ approval }) {
  const handleApprove = () => {
    // TODO: Implement approval logic
    console.log('Approved:', approval.id);
  };

  const handleReject = () => {
    // TODO: Implement rejection logic
    console.log('Rejected:', approval.id);
  };

  return (
    <div className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-red-500/30 hover:bg-white/10">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-500/20">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{approval.type}</h3>
          <p className="mt-1 text-xs text-gray-400">
            {approval.user} • {approval.date}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          className="rounded-lg bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/30"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/30"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
