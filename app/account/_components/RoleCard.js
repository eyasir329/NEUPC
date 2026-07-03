'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  User,
  UserCog,
  Shield,
  Crown,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { useRole } from './RoleContext';

const iconMap = { User, UserCog, Shield, Crown, GraduationCap, Briefcase };

const ROLE_ACCENTS = {
  blue: {
    iconBg: 'bg-sky-500/10',
    iconRing: 'ring-sky-500/20',
    iconText: 'text-sky-400',
    featureDot: 'bg-sky-400/50',
    cta: 'bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20',
    topBar: 'from-sky-500/50 to-sky-600/10',
    hoverBorder: 'group-hover:border-sky-500/25',
    glow: 'from-sky-500/6 to-sky-600/2',
  },
  purple: {
    iconBg: 'bg-violet-500/10',
    iconRing: 'ring-violet-500/20',
    iconText: 'text-violet-400',
    featureDot: 'bg-violet-400/50',
    cta: 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
    topBar: 'from-violet-500/50 to-violet-600/10',
    hoverBorder: 'group-hover:border-violet-500/25',
    glow: 'from-violet-500/6 to-violet-600/2',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconRing: 'ring-amber-500/20',
    iconText: 'text-amber-400',
    featureDot: 'bg-amber-400/50',
    cta: 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20',
    topBar: 'from-amber-500/50 to-amber-600/10',
    hoverBorder: 'group-hover:border-amber-500/25',
    glow: 'from-amber-500/6 to-amber-600/2',
  },
  red: {
    iconBg: 'bg-rose-500/10',
    iconRing: 'ring-rose-500/20',
    iconText: 'text-rose-400',
    featureDot: 'bg-rose-400/50',
    cta: 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20',
    topBar: 'from-rose-500/50 to-rose-600/10',
    hoverBorder: 'group-hover:border-rose-500/25',
    glow: 'from-rose-500/6 to-rose-600/2',
  },
  green: {
    iconBg: 'bg-emerald-500/10',
    iconRing: 'ring-emerald-500/20',
    iconText: 'text-emerald-400',
    featureDot: 'bg-emerald-400/50',
    cta: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
    topBar: 'from-emerald-500/50 to-emerald-600/10',
    hoverBorder: 'group-hover:border-emerald-500/25',
    glow: 'from-emerald-500/6 to-emerald-600/2',
  },
  teal: {
    iconBg: 'bg-teal-500/10',
    iconRing: 'ring-teal-500/20',
    iconText: 'text-teal-400',
    featureDot: 'bg-teal-400/50',
    cta: 'bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20',
    topBar: 'from-teal-500/50 to-teal-600/10',
    hoverBorder: 'group-hover:border-teal-500/25',
    glow: 'from-teal-500/6 to-teal-600/2',
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

  // Ensure we always have exactly 4 features for the 2x2 grid
  const features = (config.features || []).slice(0, 4);

  return (
    <button
      onClick={handleRoleSwitch}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/6 bg-[#0c1020]/70 text-left shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0e1228]/80 hover:shadow-2xl ${accent.hoverBorder} focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none active:scale-[0.99] will-change-transform`}
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full bg-linear-to-r ${accent.topBar} to-transparent`} />

      {/* Hover glow */}
      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-linear-to-br ${accent.glow} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`} />

      <div className="relative z-10 flex flex-1 flex-col p-5">
        {/* Icon + title row */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.iconBg} ring-1 ${accent.iconRing} transition-transform duration-300 group-hover:scale-105`}>
              <RoleIcon className={`h-5 w-5 ${accent.iconText}`} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold leading-tight text-white">
                {config.title}
              </h3>
              <p className="mt-0.5 font-mono text-[10px] text-gray-500">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {config.desc && (
          <p className="mb-4 text-xs leading-relaxed text-gray-400">
            {config.desc}
          </p>
        )}

        {/* 2×2 feature grid */}
        {features.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-x-3 gap-y-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-1.5 text-[12px] text-gray-400">
                <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${accent.featureDot}`} />
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA — pushed to bottom */}
        <div className={`mt-auto flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-300 ${accent.cta}`}>
          <span className="text-xs font-semibold tracking-wide">Enter Dashboard</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}
