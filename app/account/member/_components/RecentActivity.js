/**
 * @file Recent activity feed — chronological timeline of the member's
 *   last few actions. Caps at 4 items with a "View all" affordance.
 * @module MemberRecentActivity
 */

'use client';

import {
  Calendar,
  CheckCircle,
  Award,
  MessageSquare,
  BookOpen,
  FileText,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { GlassCard, SectionHeader, IconChip, ActionButton } from './_ui';
import { motion } from 'framer-motion';

const ICON_MAP = {
  Calendar,
  CheckCircle,
  Award,
  MessageSquare,
  BookOpen,
  FileText,
};

const MAX_ITEMS = 4;

export default function RecentActivity({ recentActivities }) {
  const visible = recentActivities.slice(0, MAX_ITEMS);
  const extra = recentActivities.length - visible.length;

  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Activity}
        title="Recent Activity"
        subtitle="Your latest actions"
        accent="emerald"
        action={
          extra > 0 && (
            <ActionButton
              tone="ghost"
              icon={ArrowRight}
              href="/account/member/participation"
            >
              All {recentActivities.length}
            </ActionButton>
          )
        }
      />
      <div className="relative space-y-1">
        {/* Vertical timeline line — aligned with IconChip size="sm" centre (p-1.5 + h-3.5 ≈ 13px from row left at p-2) */}
        <div className="absolute top-3 bottom-3 left-[21px] w-px bg-white/[0.06]" />
        {visible.map((activity, i) => {
          const Icon = ICON_MAP[activity.icon] ?? Activity;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="relative flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.02]"
            >
              <div className="relative z-10">
                <IconChip icon={Icon} accent={activity.tone} size="sm" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs leading-relaxed text-gray-200">
                  {activity.action}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  {activity.time}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
