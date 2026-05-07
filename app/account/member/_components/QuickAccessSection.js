/**
 * @file Quick access section — shortcut tiles to key member features.
 * @module MemberQuickAccessSection
 */

'use client';

import {
  BookOpen,
  Users,
  Code2,
  GraduationCap,
  Award,
  Bell,
  ArrowUpRight,
} from 'lucide-react';
import { GlassCard, IconChip } from './_ui';
import Link from 'next/link';
import { motion } from 'framer-motion';

const SHORTCUTS = [
  {
    label: 'Resources',
    desc: 'Curated learning library',
    icon: BookOpen,
    accent: 'cyan',
    href: '/account/member/resources',
  },
  {
    label: 'Help Desk',
    desc: 'Ask & discuss',
    icon: Users,
    accent: 'pink',
    href: '/account/member/discussions',
  },
  {
    label: 'Problem Solving',
    desc: 'Track CP progress',
    icon: Code2,
    accent: 'emerald',
    href: '/account/member/problem-solving',
  },
  {
    label: 'Bootcamps',
    desc: 'Structured tracks',
    icon: GraduationCap,
    accent: 'violet',
    href: '/account/member/bootcamps',
  },
  {
    label: 'Certificates',
    desc: 'Verified credentials',
    icon: Award,
    accent: 'amber',
    href: '/account/member/certificates',
  },
  {
    label: 'Notifications',
    desc: '7 unread',
    icon: Bell,
    accent: 'rose',
    href: '/account/member/notifications',
  },
];

export default function QuickAccessSection() {
  return (
    <GlassCard padding="p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-200">Quick Access</h2>
        <p className="text-xs text-gray-500">Jump to your favourite tools</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SHORTCUTS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
          >
            <Link
              href={s.href}
              className="group flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 transition-all hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <IconChip icon={s.icon} accent={s.accent} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">
                  {s.label}
                </div>
                <div className="truncate text-[10px] text-gray-500">
                  {s.desc}
                </div>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-gray-600 transition-colors group-hover:text-white" />
            </Link>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
