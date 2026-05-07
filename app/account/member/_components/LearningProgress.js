/**
 * @file Learning progress tracker — roadmap completion bars.
 * @module MemberLearningProgress
 */

'use client';

import { Map, ArrowRight } from 'lucide-react';
import { GlassCard, SectionHeader, GradientBar, ActionButton } from './_ui';
import { motion } from 'framer-motion';

const TONE_TEXT = {
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  violet: 'text-violet-400',
  amber: 'text-amber-400',
  orange: 'text-orange-400',
  rose: 'text-rose-400',
};

export default function LearningProgress({ roadmaps }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Map}
        title="Learning Progress"
        subtitle="Roadmaps and bootcamp tracks you've started"
        accent="violet"
        action={
          <ActionButton
            tone="primary"
            icon={ArrowRight}
            href="/account/member/bootcamps"
          >
            All Tracks
          </ActionButton>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {roadmaps.map((roadmap, i) => (
          <motion.div
            key={roadmap.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-xs font-semibold text-white">
                {roadmap.name}
              </h3>
              <span
                className={`text-xs font-bold ${TONE_TEXT[roadmap.tone] ?? 'text-gray-300'}`}
              >
                {roadmap.progress}%
              </span>
            </div>
            <GradientBar value={roadmap.progress} tone={roadmap.tone} />
            <p className="mt-1.5 text-[10px] text-gray-500">
              {roadmap.completed} of {roadmap.total} lessons
            </p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
