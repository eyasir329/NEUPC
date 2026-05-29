/**
 * @file Reports quick access — compact tile linking to the reports
 *   module with quick-download shortcuts for common reports.
 *
 * @module AdvisorReportsQuickAccess
 */

'use client';

import Link from 'next/link';
import { FileText, Download, ArrowRight } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  ActionButton,
} from '@/app/account/_components/ui/dashboard';

const REPORTS = [
  { label: 'Annual Report', href: '/account/advisor/reports', tone: 'emerald' },
  { label: 'Semester Summary', href: '/account/advisor/reports', tone: 'blue' },
  { label: 'Financial Report', href: '/account/advisor/reports', tone: 'cyan' },
];

const TONE_CLS = {
  emerald:
    'border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300 hover:bg-emerald-500/10',
  blue: 'border-blue-500/20 bg-blue-500/[0.05] text-blue-300 hover:bg-blue-500/10',
  cyan: 'border-cyan-500/20 bg-cyan-500/[0.05] text-cyan-300 hover:bg-cyan-500/10',
};

export default function ReportsQuickAccess() {
  return (
    <GlassCard>
      <SectionHeader
        icon={FileText}
        title="Reports"
        subtitle="Download or browse"
        accent="emerald"
        action={
          <ActionButton
            href="/account/advisor/reports"
            tone="ghost"
            icon={ArrowRight}
          >
            Open
          </ActionButton>
        }
      />
      <ul className="space-y-2">
        {REPORTS.map((r) => (
          <li key={r.label}>
            <Link
              href={r.href}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${TONE_CLS[r.tone]}`}
            >
              <span>{r.label}</span>
              <Download className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
