/**
 * @file Achievements section — earned badges + in-progress tiles.
 * @module MemberAchievementsSection
 */

'use client';

import { Trophy, ArrowRight, Lock } from 'lucide-react';
import { GlassCard, SectionHeader, ActionButton, GradientBar } from './_ui';
import { motion } from 'framer-motion';

export default function AchievementsSection({ achievements }) {
  return (
    <div className="lg:col-span-2">
      <GlassCard padding="p-5">
        <SectionHeader
          icon={Trophy}
          title="Achievements"
          subtitle={`${achievements.filter((a) => a.earned).length} earned · ${achievements.filter((a) => !a.earned).length} in progress`}
          accent="amber"
          action={
            <ActionButton
              tone="amber"
              icon={ArrowRight}
              href="/account/member/achievements"
            >
              View All
            </ActionButton>
          }
        />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
          {achievements.map((achievement, i) => (
            <motion.div
              key={achievement.title}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className={`relative rounded-lg border p-3 text-center transition-all ${
                achievement.earned
                  ? 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
              }`}
            >
              <div
                className={`text-2xl ${achievement.earned ? '' : 'opacity-40 grayscale'}`}
              >
                {achievement.icon}
              </div>
              <p
                className={`mt-1.5 truncate text-[11px] font-semibold ${
                  achievement.earned ? 'text-amber-200' : 'text-gray-400'
                }`}
                title={achievement.title}
              >
                {achievement.title}
              </p>
              {achievement.earned ? (
                <p className="mt-0.5 text-[9px] text-gray-500">
                  {achievement.date}
                </p>
              ) : (
                <div className="mt-1.5">
                  <GradientBar
                    value={achievement.progress ?? 0}
                    tone="amber"
                    height="h-1"
                  />
                  <p className="mt-1 inline-flex items-center gap-1 text-[9px] text-gray-500">
                    <Lock className="h-2.5 w-2.5" />
                    {achievement.progress ?? 0}%
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
