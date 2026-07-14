/**
 * @file Pending actions component
 * @module PendingActions
 */

'use client';

import Link from 'next/link';
import { UserCheck, UserPlus, FileText, Calendar, Zap } from 'lucide-react';
import { GlassCard, SectionHeader } from '@/app/account/_components/ui';

const iconMap = { UserCheck, UserPlus, FileText, Calendar };

const ACCENT_ROW = {
  red: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  orange: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
};

export default function PendingActions({ pendingActions }) {
  const totalCount = pendingActions.reduce((sum, a) => sum + (a.count || 0), 0);

  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Zap}
        title="Pending Actions"
        subtitle="Items requiring immediate attention"
        accent="amber"
        action={
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
            {totalCount} total
          </span>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pendingActions.map((action) => {
          const Icon = iconMap[action.icon];
          const chip = ACCENT_ROW[action.color] ?? ACCENT_ROW.blue;
          const [border, bg, text] = chip.split(' ');
          return (
            <Link
              key={action.id}
              href={action.href}
              className={`group rounded-xl border p-4 transition-all hover:brightness-110 ${border} ${bg}`}
            >
              <div className="mb-3 flex items-center justify-between">
                {Icon && <Icon className={`h-4.5 w-4.5 ${text}`} />}
                <span className={`text-2xl font-bold ${text}`}>
                  {action.count || 0}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-200">
                {action.label}
              </p>
              <span
                className={`mt-2 inline-block text-[11px] font-medium ${text} group-hover:underline`}
              >
                View details →
              </span>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}
