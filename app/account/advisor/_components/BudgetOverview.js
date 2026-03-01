/**
 * @file Budget overview — financial summary card showing allocated,
 *   spent, and remaining club budget with recent transactions.
 * @module AdvisorBudgetOverview
 */

'use client';

import Link from 'next/link';

export default function BudgetOverview({ budgetData, budgetUtilization }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">💰 Budget Overview</h2>
          <p className="text-sm text-gray-400">Financial status</p>
        </div>
        <Link
          href="/account/advisor/budget"
          className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
        >
          View Full
        </Link>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Allocated Budget</span>
            <span className="text-lg font-bold text-white">
              ৳{budgetData.allocated.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Used</span>
            <span className="text-lg font-bold text-cyan-300">
              ৳{budgetData.used.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Remaining</span>
            <span className="text-lg font-bold text-green-300">
              ৳{budgetData.remaining.toLocaleString()}
            </span>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-400">Utilization</span>
            <span className="font-semibold text-white">
              {budgetUtilization}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-cyan-500 to-blue-500"
              style={{ width: `${budgetUtilization}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
