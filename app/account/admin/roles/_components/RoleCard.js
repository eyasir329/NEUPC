/**
 * @file Role card — displays a role’s name, description, member count,
 *   and permission summary with edit / assign actions.
 * @module AdminRoleCard
 */

'use client';

import {
  Shield,
  Users,
  Key,
  ChevronRight,
  Edit3,
  Eye,
  UserPlus,
} from 'lucide-react';
import { getRoleConfig } from './roleConfig';

export default function RoleCard({
  role,
  onManagePermissions,
  onEditDescription,
  onAssignUsers,
}) {
  const cfg = getRoleConfig(role.name);

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-200 ${cfg.bgGlass} ${cfg.border}`}
    >
      {/* top accent bar */}
      <div className={`h-1 w-full bg-linear-to-r ${cfg.gradient}`} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}
            >
              <Shield className={`h-5 w-5 ${cfg.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white capitalize">
                  {role.name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${cfg.badge}`}
                >
                  P{role.priority}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">
                {role.description || 'No description set.'}
              </p>
            </div>
          </div>
        </div>

        {/* stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
            <Users className="h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <p className="text-lg leading-none font-bold text-white tabular-nums">
                {role.userCount ?? 0}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-500">Users</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
            <Key className="h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <p className="text-lg leading-none font-bold text-white tabular-nums">
                {role.permissions?.length ?? 0}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-500">Permissions</p>
            </div>
          </div>
        </div>

        {/* permission chips (preview) */}
        {role.permissions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {role.permissions.slice(0, 3).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-400"
              >
                {p.name}
              </span>
            ))}
            {role.permissions.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                +{role.permissions.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* spacer */}
        <div className="flex-1" />

        {/* actions */}
        <div className="space-y-2 border-t border-white/8 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => onEditDescription(role)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/6 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={() => onManagePermissions(role)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${cfg.badge} hover:opacity-90`}
            >
              <Key className="h-3.5 w-3.5" />
              Permissions
              <ChevronRight className="h-3 w-3 opacity-70" />
            </button>
          </div>
          <button
            onClick={() => onAssignUsers(role)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/8 hover:text-white"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Assign Users
          </button>
        </div>

        {/* view users link */}
        <a
          href={`/account/admin/users?role=${role.name}`}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-white/4 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-white/8 hover:text-gray-300"
        >
          <Eye className="h-3 w-3" />
          View {role.userCount} {role.name} users
        </a>
      </div>
    </div>
  );
}
