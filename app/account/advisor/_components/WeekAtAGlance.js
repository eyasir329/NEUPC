/**
 * @file Week-at-a-glance — compact 7-day strip showing what's happening
 *   this week (events, deadlines, decisions due). Helps the advisor
 *   anticipate rather than only react.
 *
 * @module AdvisorWeekAtAGlance
 */

'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Dot } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  Pill,
} from '@/app/account/_components/ui/dashboard';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TYPE_TONE = {
  event: 'violet',
  deadline: 'amber',
  decision: 'rose',
  meeting: 'cyan',
};

export default function WeekAtAGlance({ days }) {
  // Normalise: accept either a length-7 array of objects, or [] (no data)
  const safe =
    Array.isArray(days) && days.length === 7
      ? days
      : DAYS.map((d) => ({ label: d, date: '', items: [] }));

  const today = new Date().getDay(); // 0=Sun..6=Sat
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <GlassCard>
      <SectionHeader
        icon={CalendarDays}
        title="Week at a Glance"
        subtitle="Events, deadlines, decisions due"
        accent="violet"
      />
      <div className="grid grid-cols-7 gap-2">
        {safe.map((day, i) => {
          const isToday = i === todayIndex;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex min-h-32 flex-col rounded-xl border p-2.5 ${
                isToday
                  ? 'border-indigo-500/40 bg-indigo-500/[0.08]'
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase ${
                    isToday ? 'text-indigo-300' : 'text-gray-500'
                  }`}
                >
                  {day.label ?? DAYS[i]}
                </span>
                {day.date && (
                  <span
                    className={`text-xs ${
                      isToday ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {day.date}
                  </span>
                )}
              </div>

              <ul className="mt-2 space-y-1.5">
                {(day.items ?? []).slice(0, 3).map((it, j) => (
                  <li key={j} className="flex items-start gap-1">
                    <Dot
                      className={`h-3 w-3 shrink-0 ${
                        TYPE_TONE[it.type] === 'rose'
                          ? 'text-rose-400'
                          : TYPE_TONE[it.type] === 'amber'
                            ? 'text-amber-400'
                            : TYPE_TONE[it.type] === 'cyan'
                              ? 'text-cyan-400'
                              : 'text-violet-400'
                      }`}
                    />
                    <span className="line-clamp-2 text-[10px] leading-tight text-gray-300">
                      {it.label}
                    </span>
                  </li>
                ))}
                {(day.items ?? []).length === 0 && (
                  <li className="text-[10px] text-gray-600">—</li>
                )}
                {(day.items ?? []).length > 3 && (
                  <li className="text-[10px] text-gray-500">
                    +{day.items.length - 3} more
                  </li>
                )}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill tone="violet">Events</Pill>
        <Pill tone="amber">Deadlines</Pill>
        <Pill tone="rose">Decisions due</Pill>
        <Pill tone="cyan">Meetings</Pill>
      </div>
    </GlassCard>
  );
}
