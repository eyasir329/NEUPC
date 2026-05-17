'use client';

import { motion } from 'framer-motion';
import { Calendar, Users, AlertCircle, TrendingUp, Megaphone, BarChart3 } from 'lucide-react';
import { GlassCard, IconChip } from './_ui';

const STAT_CONFIGS = [
  { key: 'totalEvents',           label: 'Total Events',           icon: Calendar,    accent: 'blue',   trend: { dir: 'up', value: '+12%' } },
  { key: 'activeMembers',         label: 'Active Members',         icon: Users,       accent: 'emerald',trend: { dir: 'up', value: '+8%'  } },
  { key: 'pendingRegistrations',  label: 'Pending Registrations',  icon: AlertCircle, accent: 'amber',  alert: 'Needs Review'               },
  { key: 'totalParticipation',    label: 'Total Participation',    icon: TrendingUp,  accent: 'violet', trend: { dir: 'up', value: '+15%' } },
  { key: 'activeNotices',         label: 'Active Notices',         icon: Megaphone,   accent: 'pink',   alert: 'Live'                       },
  { key: 'engagementRate',        label: 'Engagement Rate',        icon: BarChart3,   accent: 'cyan',   trend: { dir: 'up', value: '+5%'  }, suffix: '%' },
];

export default function ExecutiveStatsGrid({ stats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {STAT_CONFIGS.map((cfg, i) => {
        const value = cfg.suffix
          ? `${stats[cfg.key]}${cfg.suffix}`
          : stats[cfg.key];
        return (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="h-full"
          >
            <GlassCard hover padding="p-4" className="flex h-full flex-col">
              <div className="flex min-h-9 items-start justify-between gap-3">
                <IconChip icon={cfg.icon} accent={cfg.accent} />
                {cfg.trend && (
                  <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                    ↑ {cfg.trend.value}
                  </span>
                )}
                {cfg.alert && (
                  <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                    {cfg.alert}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="text-xs text-gray-400">{cfg.label}</div>
                <div className="mt-0.5 text-2xl font-bold text-white">{value}</div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}
