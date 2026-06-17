/**
 * @file Role dashboard selection card — premium redesign.
 * Each card has a unique personality with distinctive icon backgrounds,
 * hover animations, and a clear "Enter Dashboard" CTA.
 *
 * @module RoleCard
 */

'use client';

import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ArrowRight,
  User,
  UserCog,
  Shield,
  Crown,
  GraduationCap,
  Briefcase,
  Zap,
} from 'lucide-react';
import { useRole } from './RoleContext';

// Icon mapping
const iconMap = {
  User,
  UserCog,
  Shield,
  Crown,
  GraduationCap,
  Briefcase,
};

// Per-role accent palette (HSL-driven, avoids generic primary colors)
const ROLE_ACCENTS = {
  blue: {
    iconBg: 'bg-sky-500/12',
    iconRing: 'ring-sky-500/20',
    iconText: 'text-sky-400',
    featureDot: 'bg-sky-400/60',
    cta: 'bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20',
    glow: 'from-sky-500/8 to-sky-600/4',
    topBar: 'from-sky-500/50 to-sky-600/20',
    hoverBorder: 'group-hover:border-sky-500/30',
    hoverShadow: 'group-hover:shadow-sky-500/8',
  },
  purple: {
    iconBg: 'bg-violet-500/12',
    iconRing: 'ring-violet-500/20',
    iconText: 'text-violet-400',
    featureDot: 'bg-violet-400/60',
    cta: 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
    glow: 'from-violet-500/8 to-violet-600/4',
    topBar: 'from-violet-500/50 to-violet-600/20',
    hoverBorder: 'group-hover:border-violet-500/30',
    hoverShadow: 'group-hover:shadow-violet-500/8',
  },
  amber: {
    iconBg: 'bg-amber-500/12',
    iconRing: 'ring-amber-500/20',
    iconText: 'text-amber-400',
    featureDot: 'bg-amber-400/60',
    cta: 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20',
    glow: 'from-amber-500/8 to-amber-600/4',
    topBar: 'from-amber-500/50 to-amber-600/20',
    hoverBorder: 'group-hover:border-amber-500/30',
    hoverShadow: 'group-hover:shadow-amber-500/8',
  },
  red: {
    iconBg: 'bg-rose-500/12',
    iconRing: 'ring-rose-500/20',
    iconText: 'text-rose-400',
    featureDot: 'bg-rose-400/60',
    cta: 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20',
    glow: 'from-rose-500/8 to-rose-600/4',
    topBar: 'from-rose-500/50 to-rose-600/20',
    hoverBorder: 'group-hover:border-rose-500/30',
    hoverShadow: 'group-hover:shadow-rose-500/8',
  },
  green: {
    iconBg: 'bg-emerald-500/12',
    iconRing: 'ring-emerald-500/20',
    iconText: 'text-emerald-400',
    featureDot: 'bg-emerald-400/60',
    cta: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
    glow: 'from-emerald-500/8 to-emerald-600/4',
    topBar: 'from-emerald-500/50 to-emerald-600/20',
    hoverBorder: 'group-hover:border-emerald-500/30',
    hoverShadow: 'group-hover:shadow-emerald-500/8',
  },
  teal: {
    iconBg: 'bg-teal-500/12',
    iconRing: 'ring-teal-500/20',
    iconText: 'text-teal-400',
    featureDot: 'bg-teal-400/60',
    cta: 'bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20',
    glow: 'from-teal-500/8 to-teal-600/4',
    topBar: 'from-teal-500/50 to-teal-600/20',
    hoverBorder: 'group-hover:border-teal-500/30',
    hoverShadow: 'group-hover:shadow-teal-500/8',
  },
};

export default function RoleCard({ role, config, colorClass }) {
  const router = useRouter();
  const { setActiveRole } = useRole();
  const RoleIcon = iconMap[config.icon] || User;
  const accent = ROLE_ACCENTS[config.color] || ROLE_ACCENTS.blue;

  const handleRoleSwitch = () => {
    setActiveRole(role);
    router.push(config.path);
  };

  return (
    <button
      onClick={handleRoleSwitch}
      className={`group relative w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c1020]/70 text-left shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${accent.hoverBorder} ${accent.hoverShadow} focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none active:scale-[0.98] will-change-transform`}
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${accent.topBar} to-transparent`} />

      {/* Subtle background glow on hover */}
      <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${accent.glow} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`} />

      <div className="relative z-10 p-5 sm:p-6">
        {/* Icon + title row */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.iconBg} ring-1 ${accent.iconRing} transition-all duration-300 group-hover:scale-105`}
            >
              <RoleIcon className={`h-5 w-5 ${accent.iconText}`} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white leading-tight">
                {config.title}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        {/* Features list */}
        <div className="mb-5 space-y-1.5">
          {config.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-[13px] text-gray-400"
            >
              <div className={`h-1 w-1 rounded-full ${accent.featureDot}`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-300 ${accent.cta}`}>
          <span className="text-xs font-semibold tracking-wide">
            Enter Dashboard
          </span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}
