/**
 * @file Recent activity feed — chronological list of the member's
 *   latest actions, rendered with the shared `_ui` primitives.
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
} from 'lucide-react';
import { GlassCard, SectionHeader, IconChip } from './_ui';
import { motion } from 'framer-motion';

const ICON_MAP = {
  Calendar,
  CheckCircle,
  Award,
  MessageSquare,
  BookOpen,
  FileText,
};

export default function RecentActivity({ recentActivities }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Activity}
        title="Recent Activity"
        subtitle="Your latest actions"
        accent="emerald"
      />
      <div className="relative space-y-1">
        <div className="absolute top-2 bottom-2 left-[18px] w-px bg-white/[0.06]" />
        {recentActivities.map((activity, i) => {
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
