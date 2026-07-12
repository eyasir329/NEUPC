/**
 * @file Action queue — the advisor's "what to decide now" zone. Each row
 *   is one decision: priority chip, type, who submitted, age, and an
 *   inline Review CTA. Replaces the old ApprovalCenter with a cleaner
 *   review-flow-first design.
 *
 * @module AdvisorActionQueue
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  ArrowRight,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  Pill,
  ActionButton,
} from '@/app/account/_components/ui';

const PRIORITY_TONE = {
  High: 'rose',
  Medium: 'amber',
  Low: 'gray',
};

const TYPE_TONE = {
  'Event Proposal': 'violet',
  'Budget Request': 'emerald',
  'Policy Change': 'cyan',
  'Member Profile': 'blue',
  'Join Request': 'indigo',
};

function ageString(dateStr) {
  // Accept anything; if it's not a real Date, just echo it.
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const hours = Math.max(0, Math.floor((Date.now() - d.getTime()) / 3600000));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActionQueue({ pendingApprovals = [] }) {
  const total = pendingApprovals.length;
  const high = pendingApprovals.filter((p) => p.priority === 'High').length;

  return (
    <GlassCard className="border-amber-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-amber-950/20">
      <SectionHeader
        icon={ClipboardCheck}
        title="Action Queue"
        subtitle={
          total === 0
            ? 'All caught up — nothing waiting for your review.'
            : `${total} item${total === 1 ? '' : 's'} need your decision${high ? ` · ${high} high priority` : ''}`
        }
        accent="amber"
        action={
          <ActionButton
            href="/account/advisor/approvals"
            tone="amber"
            icon={ArrowRight}
          >
            Review all
          </ActionButton>
        }
      />

      {total === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 text-center">
          <p className="text-sm text-emerald-300">
            Inbox zero. Take a moment &mdash; you&rsquo;ve cleared the queue.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendingApprovals.slice(0, 5).map((approval, i) => (
            <motion.div
              key={approval.id ?? i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href="/account/advisor/approvals"
                className="group flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-amber-500/30 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {approval.priority === 'High' && (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={TYPE_TONE[approval.type] ?? 'gray'}>
                        {approval.type}
                      </Pill>
                      <Pill tone={PRIORITY_TONE[approval.priority] ?? 'gray'}>
                        {approval.priority}
                      </Pill>
                    </div>
                    <h3 className="mt-2 truncate text-sm font-semibold text-white">
                      {approval.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="truncate">
                        By {approval.submittedBy}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {ageString(approval.date)}
                      </span>
                    </p>
                  </div>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
