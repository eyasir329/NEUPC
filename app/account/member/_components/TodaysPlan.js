/**
 * @file Today's Plan — small actionable agenda derived from the user's
 *   open registrations, replies, and learning streak.
 *   Items can be checked off (local UI state).
 * @module TodaysPlan
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Check,
  ArrowRight,
  Code2,
  MessageSquare,
  Calendar,
  BookOpen,
  Trophy,
  Flame,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard, SectionHeader, IconChip, Pill } from './_ui';

const ICON = {
  practice: Code2,
  reply: MessageSquare,
  event: Calendar,
  lesson: BookOpen,
  contest: Trophy,
  streak: Flame,
};

export default function TodaysPlan({ items = [] }) {
  const [checked, setChecked] = useState(new Set());
  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const completedCount = items.filter((i) => checked.has(i.id)).length;

  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Sparkles}
        title="Today's Plan"
        subtitle={`${completedCount} of ${items.length} done · resets at midnight`}
        accent="cyan"
        action={<Pill tone="cyan">{items.length} tasks</Pill>}
      />

      <div className="space-y-1.5">
        {items.map((item, i) => {
          const Icon = ICON[item.type] ?? Sparkles;
          const isDone = checked.has(item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className={`group flex items-center gap-3 rounded-lg border p-2.5 transition-all ${
                isDone
                  ? 'border-emerald-500/15 bg-emerald-500/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  isDone
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/[0.12] bg-white/[0.03] text-transparent hover:border-emerald-500/30 hover:text-emerald-300/40'
                }`}
                aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </button>

              <IconChip icon={Icon} accent={item.accent} size="sm" />

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-[12.5px] font-medium ${
                    isDone ? 'text-gray-500 line-through' : 'text-white'
                  }`}
                >
                  {item.title}
                </p>
                <p className="truncate text-[10.5px] text-gray-500">
                  {item.subtitle}
                </p>
              </div>

              {item.href && (
                <Link
                  href={item.href}
                  className="shrink-0 rounded-md p-1.5 text-gray-600 opacity-0 transition group-hover:opacity-100 hover:bg-white/[0.05] hover:text-white"
                  aria-label="Open"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
