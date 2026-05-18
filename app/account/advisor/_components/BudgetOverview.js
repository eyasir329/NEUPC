/**
 * @file Budget overview — financial snapshot with allocated / used /
 *   remaining and a gradient utilization bar.
 *
 * @module AdvisorBudgetOverview
 */

'use client';

import { Wallet, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  GradientBar,
  ActionButton,
} from '../../_components/ui/dashboard';

const fmt = (n) =>
  typeof n === 'number' ? `৳${n.toLocaleString()}` : `৳${n ?? 0}`;

export default function BudgetOverview({ budgetData, budgetUtilization = 0 }) {
  const tone =
    budgetUtilization > 90
      ? 'rose'
      : budgetUtilization > 70
        ? 'amber'
        : 'emerald';

  return (
    <GlassCard>
      <SectionHeader
        icon={Wallet}
        title="Budget Health"
        subtitle="Financial status this term"
        accent="emerald"
        action={
          <ActionButton
            href="/account/advisor/budget"
            tone="ghost"
            icon={ArrowRight}
          >
            View full
          </ActionButton>
        }
      />

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-medium tracking-wider text-gray-500 uppercase">
            Allocated
          </p>
          <p className="mt-1 text-base font-bold text-white">
            {fmt(budgetData?.allocated)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3">
          <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-amber-400 uppercase">
            <TrendingDown className="h-3 w-3" />
            Used
          </p>
          <p className="mt-1 text-base font-bold text-white">
            {fmt(budgetData?.used)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
          <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-400 uppercase">
            <TrendingUp className="h-3 w-3" />
            Remaining
          </p>
          <p className="mt-1 text-base font-bold text-white">
            {fmt(budgetData?.remaining)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-gray-400">Utilization</span>
          <span className="font-semibold text-white">{budgetUtilization}%</span>
        </div>
        <GradientBar value={budgetUtilization} tone={tone} />
      </div>
    </GlassCard>
  );
}
