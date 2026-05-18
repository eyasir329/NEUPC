/**
 * @file Decisions log — recent decisions the advisor has made (approvals,
 *   rejections, notes). Helps build situational awareness and provides
 *   an audit trail at a glance.
 *
 * @module AdvisorDecisionsLog
 */

'use client';

import { History, CheckCircle, XCircle, FileEdit } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  StaggerList,
  EmptyState,
  ActionButton,
} from '../../_components/ui/dashboard';

const ACTION_ICON = {
  approved: CheckCircle,
  rejected: XCircle,
  noted: FileEdit,
};

const ACTION_TONE = {
  approved: 'text-emerald-400',
  rejected: 'text-rose-400',
  noted: 'text-cyan-400',
};

function timeAgo(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DecisionsLog({ decisions = [] }) {
  return (
    <GlassCard>
      <SectionHeader
        icon={History}
        title="Recent Decisions"
        subtitle="Your last actions, ordered by recency"
        accent="indigo"
        action={
          <ActionButton href="/account/advisor/reports" tone="ghost">
            Full log
          </ActionButton>
        }
      />
      {decisions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No recent decisions"
          description="Decisions you make in Approvals will appear here for reference."
        />
      ) : (
        <ul className="space-y-1.5">
          <StaggerList>
            {decisions.map((d, i) => {
              const Icon = ACTION_ICON[d.action] ?? FileEdit;
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2"
                >
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${ACTION_TONE[d.action] ?? 'text-gray-400'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-gray-200">
                      <span className="font-semibold capitalize">
                        {d.action}
                      </span>{' '}
                      <span className="text-gray-500">·</span>{' '}
                      <span>{d.title}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      {d.type} · {timeAgo(d.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </StaggerList>
        </ul>
      )}
    </GlassCard>
  );
}
