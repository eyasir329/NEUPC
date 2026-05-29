'use client';

import { motion } from 'framer-motion';
import { Target, BookOpen, BarChart3, FileText, GraduationCap, ArrowRight } from 'lucide-react';
import { GlassCard, IconChip } from '@/app/account/_components/ui';

const LINKS = [
  {
    href: '/account/mentor/bootcamps',
    icon: GraduationCap,
    accent: 'violet',
    title: 'My Bootcamps',
    desc: 'Manage assigned bootcamps',
  },
  {
    href: '/account/mentor/assigned-members',
    icon: Target,
    accent: 'cyan',
    title: 'Assigned Members',
    desc: 'Manage and track mentees',
  },
  {
    href: '/account/mentor/resources',
    icon: BookOpen,
    accent: 'amber',
    title: 'Resources',
    desc: 'Upload materials & guides',
  },
  {
    href: '/account/mentor/sessions',
    icon: BarChart3,
    accent: 'pink',
    title: 'Sessions',
    desc: 'Log and review sessions',
  },
];

const ARROW_TEXT = {
  violet: 'text-violet-400',
  cyan: 'text-cyan-400',
  amber: 'text-amber-400',
  pink: 'text-pink-400',
  emerald: 'text-emerald-400',
};

export default function QuickAccessGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {LINKS.map((link, i) => (
        <motion.div
          key={link.href}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.07 }}
        >
          <GlassCard href={link.href} hover padding="p-5" className="flex flex-col gap-3 h-full">
            <IconChip icon={link.icon} accent={link.accent} />
            <div className="flex-1">
              <h3 className="font-semibold text-white text-sm">{link.title}</h3>
              <p className="mt-1 text-xs text-gray-400">{link.desc}</p>
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${ARROW_TEXT[link.accent]}`}>
              Open <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
