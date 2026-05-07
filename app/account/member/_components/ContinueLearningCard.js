/**
 * @file Continue learning — resumes the most recent bootcamp lesson.
 * @module ContinueLearningCard
 */

'use client';

import { Play, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard, GradientBar, Pill, IconChip, ActionButton } from './_ui';

export default function ContinueLearningCard({ resume }) {
  if (!resume) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <GlassCard padding="p-0" className="overflow-hidden">
        <div className="relative p-5">
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <IconChip icon={Play} accent="violet" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-medium tracking-wider text-violet-300/80 uppercase">
                  Continue Learning
                </span>
                <Pill tone="violet">{resume.bootcamp}</Pill>
              </div>
              <h3 className="truncate text-sm font-semibold text-white">
                {resume.lessonTitle}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                Module {resume.moduleIndex} · Lesson {resume.lessonIndex} ·{' '}
                <span className="text-gray-300">{resume.duration} min</span>
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Bootcamp progress</span>
                    <span className="font-mono tabular-nums">
                      {resume.completedLessons} / {resume.totalLessons}
                    </span>
                  </div>
                  <GradientBar
                    value={resume.completedLessons}
                    max={resume.totalLessons}
                    tone="violet"
                    height="h-1.5"
                  />
                </div>
                <span className="font-mono text-sm font-bold text-violet-300 tabular-nums">
                  {Math.round(
                    (resume.completedLessons / resume.totalLessons) * 100
                  )}
                  %
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {resume.lastOpened}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {resume.remaining} lessons left
                  </span>
                </div>
                <ActionButton
                  tone="primary"
                  icon={ArrowRight}
                  href={resume.href}
                >
                  Resume
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
