/**
 * @file Pending approvals list — renders a scrollable list of approval
 *   cards with a “View All” link to the dedicated approvals page.
 * @module PendingApprovals
 */

'use client';

import Link from 'next/link';
import ApprovalCard from './ApprovalCard';

export default function PendingApprovals({ pendingApprovals }) {
  return (
    <div className="lg:col-span-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              ⚠️ Pending Approvals
            </h2>
            <p className="text-sm text-gray-400">
              Items requiring your attention
            </p>
          </div>
          <Link
            href="/account/admin/approvals"
            className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/30"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {pendingApprovals.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </div>
      </div>
    </div>
  );
}
