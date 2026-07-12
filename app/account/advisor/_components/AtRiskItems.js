/**
 * @file At-risk items — surfaces club health signals that may need
 *   advisor attention but aren't waiting in the approval queue:
 *   low event registration, over-budget categories, stalled
 *   committee terms ending soon, etc.
 *
 * @module AdvisorAtRiskItems
 */

'use client';

import Link from 'next/link';
import { AlertTriangle, TrendingDown, Clock, ArrowRight } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  Pill,
  EmptyState,
} from '@/app/account/_components/ui';

const SEVERITY = {
  critical: { tone: 'rose', icon: AlertTriangle },
  warning: { tone: 'amber', icon: TrendingDown },
  watch: { tone: 'cyan', icon: Clock },
};

export default function AtRiskItems({ items = [] }) {
  return (
    <GlassCard>
      <SectionHeader
        icon={AlertTriangle}
        title="At Risk"
        subtitle="Signals worth your attention"
        accent="rose"
      />
      {items.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No risks detected"
          description="All tracked indicators are within healthy ranges."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => {
            const cfg = SEVERITY[item.severity] ?? SEVERITY.watch;
            const Icon = cfg.icon;
            return (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    cfg.tone === 'rose'
                      ? 'text-rose-400'
                      : cfg.tone === 'amber'
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-white">
                      {item.title}
                    </p>
                    <Pill tone={cfg.tone}>{item.severity}</Pill>
                  </div>
                  {item.detail && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">
                      {item.detail}
                    </p>
                  )}
                  {item.href && (
                    <Link
                      href={item.href}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      Look at it
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
