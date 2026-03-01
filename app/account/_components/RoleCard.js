/**
 * @file Role dashboard selection card.
 * Clickable card that switches active role and navigates to role dashboard.
 *
 * @module RoleCard
 */

'use client';

import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  User,
  UserCog,
  Shield,
  Crown,
  GraduationCap,
  Briefcase,
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

export default function RoleCard({ role, config, colorClass }) {
  const router = useRouter();
  const { setActiveRole } = useRole();
  const RoleIcon = iconMap[config.icon] || User;

  const handleRoleSwitch = () => {
    // Update the active role in context
    setActiveRole(role);
    // Navigate to the role's dashboard
    router.push(config.path);
  };

  return (
    <button
      onClick={handleRoleSwitch}
      className={`group w-full overflow-hidden rounded-2xl border-2 bg-linear-to-br ${colorClass} text-left shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/10`}
          >
            <RoleIcon className="h-6 w-6 text-white" />
          </div>
          <ChevronRight className="h-5 w-5 text-white/50 transition-transform group-hover:translate-x-1" />
        </div>

        <h3 className="mb-2 text-xl font-bold text-white">{config.title}</h3>
        <p className="mb-4 text-sm text-gray-300">{config.description}</p>

        <div className="space-y-2">
          {config.features.slice(0, 3).map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs text-gray-300"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
              <span>{feature}</span>
            </div>
          ))}
          {config.features.length > 3 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
              <span>+{config.features.length - 3} more</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
