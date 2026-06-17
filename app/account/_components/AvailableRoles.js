/**
 * @file Available role dashboards grid — redesigned.
 * Shows a section header with the role cards in a responsive grid.
 * Uses a 2-column layout on md screens, 3-column on lg+.
 *
 * @module AvailableRoles
 */

'use client';

import { LayoutDashboard } from 'lucide-react';
import RoleCard from './RoleCard';
import { colorClasses } from '@/app/_lib/config/roleDashboardConfig';

export default function AvailableRoles({ availableRoles, accountStatus }) {
  if (accountStatus !== 'active') {
    return null;
  }

  if (availableRoles.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06]">
          <LayoutDashboard className="h-4 w-4 text-indigo-400/80" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">
            Your Dashboards
          </h2>
          <p className="text-xs text-gray-500">
            Select a portal to continue
          </p>
        </div>
      </div>

      {/* Role cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {availableRoles.map(({ role, config }) => (
          <RoleCard
            key={role}
            role={role}
            config={config}
            colorClass={colorClasses[config.color]}
          />
        ))}
      </div>
    </div>
  );
}
