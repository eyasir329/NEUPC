/**
 * @file Approval centre — dashboard panel listing pending approvals
 *   for events, budgets, and other items requiring advisor sign-off.
 * @module AdvisorApprovalCenter
 */

'use client';

import Link from 'next/link';
import { CheckCircle, Eye, XCircle } from 'lucide-react';

export default function ApprovalCenter({ pendingApprovals }) {
  return (
    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">📋 Approval Center</h2>
          <p className="text-sm text-gray-400">Items requiring your review</p>
        </div>
        <Link
          href="/account/advisor/approvals"
          className="rounded-lg bg-orange-500/20 px-3 py-1.5 text-sm font-semibold text-orange-300 transition-colors hover:bg-orange-500/30"
        >
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {pendingApprovals.map((approval) => (
          <div
            key={approval.id}
            className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-orange-500/30 hover:bg-white/10"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
                    {approval.type}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      approval.priority === 'High'
                        ? 'bg-red-500/20 text-red-300'
                        : approval.priority === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {approval.priority} Priority
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-white">
                  {approval.title}
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  By {approval.submittedBy} • {approval.date}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 rounded bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/30">
                  <CheckCircle className="h-3 w-3" />
                  Approve
                </button>
                <button className="flex items-center gap-1 rounded bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                  <Eye className="h-3 w-3" />
                  Review
                </button>
                <button className="flex items-center gap-1 rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/30">
                  <XCircle className="h-3 w-3" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
