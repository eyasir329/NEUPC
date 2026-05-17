'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Video, Users, Clock, ExternalLink, Calendar } from 'lucide-react';
import { GlassCard, SectionHeader, Pill, ActionButton, Avatar, EmptyState } from './_ui';

export default function TodaysSchedule({ todaySessions }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Calendar}
        title="Today's Schedule"
        subtitle="Upcoming mentoring sessions"
        accent="emerald"
        action={
          <ActionButton href="/account/mentor/sessions" tone="emerald" icon={Calendar}>
            + Schedule
          </ActionButton>
        }
      />

      {todaySessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions today"
          description="Schedule a session with one of your mentees."
          accent="emerald"
        />
      ) : (
        <div className="space-y-3">
          {todaySessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-emerald-500/20 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                  <Video className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {session.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Avatar name={session.mentee} size="sm" />
                      {session.mentee}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.time}
                    </span>
                    <Pill tone={session.type === '1:1' ? 'blue' : 'violet'}>
                      {session.type}
                    </Pill>
                  </div>
                </div>
              </div>
              <ActionButton tone="emerald" icon={ExternalLink} className="shrink-0">
                Join
              </ActionButton>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
