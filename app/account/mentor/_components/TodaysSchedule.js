/**
 * @file Todays schedule component — the mentor's real scheduled sessions
 *   for today (falling back to next upcoming ones), with working Join
 *   links for Google Meet sessions.
 * @module TodaysSchedule
 */

'use client';

import { motion } from 'framer-motion';
import { Video, MapPin, Clock, ExternalLink, Calendar } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  Pill,
  ActionButton,
  EmptyState,
} from '@/app/account/_components/ui';

const TARGET_LABEL = {
  'all-bootcamp': 'Bootcamp',
  selected: 'Selected',
  mentorship: '1:1',
};

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDay(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

export default function TodaysSchedule({
  todaySessions = [],
  upcomingSessions = [],
}) {
  const showingToday = todaySessions.length > 0;
  const sessions = showingToday ? todaySessions : upcomingSessions;

  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Calendar}
        title={showingToday ? "Today's Schedule" : 'Upcoming Sessions'}
        subtitle={
          showingToday
            ? 'Sessions scheduled for today'
            : 'Your next scheduled sessions'
        }
        accent="emerald"
        action={
          <ActionButton
            href="/account/mentor/sessions"
            tone="emerald"
            icon={Calendar}
          >
            + Schedule
          </ActionButton>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions scheduled"
          description="Schedule a session from the Sessions page."
          accent="emerald"
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => {
            const when = session.scheduled_at || session.session_date;
            const isOnline = Boolean(session.meet_link);
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                className="flex flex-col gap-3 rounded-xl border border-white/6 bg-white/2 p-4 transition-all hover:border-emerald-500/20 hover:bg-white/4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                    {isOnline ? (
                      <Video className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <MapPin className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {session.topic || 'Untitled session'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDay(when)} · {formatTime(when)}
                        {session.duration ? ` · ${session.duration} min` : ''}
                      </span>
                      <Pill
                        tone={
                          session.target_type === 'selected' ? 'violet' : 'blue'
                        }
                      >
                        {TARGET_LABEL[session.target_type] || 'Session'}
                      </Pill>
                      {session.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isOnline ? (
                  <ActionButton
                    href={session.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    tone="emerald"
                    icon={ExternalLink}
                    className="shrink-0"
                  >
                    Join
                  </ActionButton>
                ) : (
                  <ActionButton
                    href="/account/mentor/sessions"
                    tone="primary"
                    className="shrink-0"
                  >
                    Details
                  </ActionButton>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
