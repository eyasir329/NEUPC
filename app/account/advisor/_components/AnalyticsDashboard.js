/**
 * @file Analytics dashboard tile — sparkline preview of recent club
 *   engagement with a CTA into the full analytics page.
 *
 * @module AdvisorAnalyticsDashboardTile
 */

'use client';

import { BarChart3, ArrowRight } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  Sparkline,
  ActionButton,
} from '@/app/account/_components/ui/dashboard';

export default function AnalyticsDashboard({
  weekActivity = [12, 18, 9, 22, 30, 24, 28],
  growth = 25,
}) {
  return (
    <GlassCard>
      <SectionHeader
        icon={BarChart3}
        title="Analytics"
        subtitle="Engagement · last 7 days"
        accent="violet"
        action={
          <ActionButton
            href="/account/advisor/analytics"
            tone="ghost"
            icon={ArrowRight}
          >
            Open
          </ActionButton>
        }
      />

      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-white">+{growth}%</span>
        <span className="text-[11px] text-gray-500">participation YoY</span>
      </div>
      <Sparkline data={weekActivity} tone="violet" height="h-12" />
    </GlassCard>
  );
}
