/**
 * @file Recent events — dashboard preview of latest club events with
 *   attendance, approval status, and shared visual language.
 *
 * @module AdvisorRecentEvents
 */

'use client';

import { Calendar, ArrowRight, Users } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  Pill,
  ActionButton,
  EmptyState,
} from '../../_components/ui/dashboard';

const APPROVAL_TONE = {
  Approved: 'emerald',
  Pending: 'amber',
  Rejected: 'rose',
};

const TYPE_TONE = {
  Contest: 'rose',
  Workshop: 'violet',
  Seminar: 'cyan',
  Hackathon: 'amber',
  Bootcamp: 'emerald',
};

export default function RecentEvents({ recentEvents = [] }) {
  return (
    <GlassCard>
      <SectionHeader
        icon={Calendar}
        title="Recent Events"
        subtitle="Latest activity across the club"
        accent="violet"
        action={
          <ActionButton
            href="/account/advisor/events"
            tone="ghost"
            icon={ArrowRight}
          >
            View all
          </ActionButton>
        }
      />
      {recentEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No recent events"
          description="Events created by the executive committee will show up here."
        />
      ) : (
        <ul className="space-y-2">
          {recentEvents.map((event, idx) => (
            <li
              key={idx}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">
                    {event.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <Pill tone={TYPE_TONE[event.type] ?? 'gray'}>
                      {event.type}
                    </Pill>
                    <span>{event.date}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.participants}
                    </span>
                  </div>
                </div>
                <Pill tone={APPROVAL_TONE[event.approval] ?? 'gray'}>
                  {event.approval}
                </Pill>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
