/**
 * @file Role badge — colour-coded pill displaying a user’s assigned
 *   role name.
 * @module AdminRoleBadge
 */

import { ROLE_COLORS, ROLES } from './constants';

export default function RoleBadge({ role, roles }) {
  // If roles array is provided, display all roles
  const rolesToDisplay = Array.isArray(roles) ? roles : role ? [role] : [];

  if (rolesToDisplay.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {rolesToDisplay.map((r) => {
        const roleCapitalized = r.charAt(0).toUpperCase() + r.slice(1);
        const cls = ROLE_COLORS[roleCapitalized] || ROLE_COLORS.Guest;
        return (
          <span
            key={r}
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}
          >
            {roleCapitalized}
          </span>
        );
      })}
    </div>
  );
}
