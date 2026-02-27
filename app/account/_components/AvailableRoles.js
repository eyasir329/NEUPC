'use client';

import RoleCard from './RoleCard';
import { colorClasses } from '@/app/_lib/roleDashboardConfig';

export default function AvailableRoles({ availableRoles, accountStatus }) {
  if (accountStatus !== 'active') {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-center text-2xl font-bold text-white">
        Your Available Dashboards
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
