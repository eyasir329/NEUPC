/**
 * @file Role management client — admin interface for viewing, editing,
 *   and assigning user roles with permission-level controls and
 *   member-count statistics.
 * @module AdminRoleManagementClient
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Shield,
  Users,
  Key,
  Lock,
  LayoutGrid,
  Table2,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import RoleCard from './RoleCard';
import PermissionsModal from './PermissionsModal';
import EditDescriptionModal from './EditDescriptionModal';
import AssignRoleModal from './AssignRoleModal';
import { getRoleConfig } from './roleConfig';
import {
  PageShell,
  PageHeader,
  StatCard,
  EmptyState,
  GlassCard,
  StaggerList,
} from '@/app/account/_components/ui';

export default function RoleManagementClient({
  initialRoles,
  allPermissions,
  initialUsers,
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [users, setUsers] = useState(initialUsers); // live user list shared across modals
  const [view, setView] = useState('grid'); // 'grid' | 'matrix'
  const [search, setSearch] = useState('');

  // Modal state
  const [permissionsRole, setPermissionsRole] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [assignRole, setAssignRole] = useState(null);

  // ── derived stats ──────────────────────────────────────────
  const totalUsers = useMemo(
    () => roles.reduce((s, r) => s + (r.userCount ?? 0), 0),
    [roles]
  );
  const totalPermissions = allPermissions.length;
  const highestRole = roles[0]; // already sorted by priority DESC
  const mostUsedRole = useMemo(() => {
    return [...roles].sort(
      (a, b) => (b.userCount ?? 0) - (a.userCount ?? 0)
    )[0];
  }, [roles]);

  // ── filtered roles for grid ────────────────────────────────
  const filteredRoles = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return roles;
    return roles.filter(
      (r) =>
        r.name?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
    );
  }, [roles, search]);

  // ── callbacks ─────────────────────────────────────────────

  function handleDescriptionSaved(roleId, newDescription) {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId ? { ...r, description: newDescription } : r
      )
    );
  }

  function handlePermissionsChanged(roleId, updatedPerms) {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId ? { ...r, permissions: updatedPerms } : r
      )
    );
  }

  // Called by AssignRoleModal whenever a user's role changes.
  function handleUserAssigned(userId, roleId, action) {
    const roleName = roles.find((r) => r.id === roleId)?.name;

    // 1. Update the live users array so re-opening a modal shows fresh data
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const currentIds = Array.isArray(u.roleIds)
          ? u.roleIds
          : u.currentRoleId
            ? [u.currentRoleId]
            : [];
        const updatedIds =
          action === 'assign'
            ? currentIds.includes(roleId)
              ? currentIds
              : [...currentIds, roleId]
            : currentIds.filter((id) => id !== roleId);
        const currentNames = Array.isArray(u.roleNames) ? u.roleNames : [];
        const updatedNames = roleName
          ? action === 'assign'
            ? currentNames.includes(roleName)
              ? currentNames
              : [...currentNames, roleName]
            : currentNames.filter((n) => n !== roleName)
          : currentNames;
        return { ...u, roleIds: updatedIds, roleNames: updatedNames };
      })
    );

    // 2. Update role user-counts
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id === roleId) {
          return {
            ...r,
            userCount:
              action === 'assign'
                ? (r.userCount ?? 0) + 1
                : Math.max(0, (r.userCount ?? 0) - 1),
          };
        }
        return r;
      })
    );
  }

  // ── matrix view: get unique permission categories + names ──
  const permCategories = useMemo(
    () => [...new Set(allPermissions.map((p) => p.category))].sort(),
    [allPermissions]
  );

  return (
    <PageShell>
      {/* ── Page Header ────────────────────────────────── */}
      <PageHeader
        title="Role Management"
        subtitle="Configure role hierarchy, assign user scopes, and manage granular system capabilities."
        icon={Shield}
        accent="violet"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/account/admin/users"
              className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 transition-all hover:border-blue-500/50 hover:bg-blue-500/20 active:scale-95"
            >
              User Management
            </Link>
            <Link
              href="/account/admin/applications"
              className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-semibold text-yellow-300 transition-all hover:border-yellow-500/50 hover:bg-yellow-500/20 active:scale-95"
            >
              Applications
            </Link>
            <Link
              href="/account/admin"
              className="rounded-xl border border-white/8 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-400 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white active:scale-95"
            >
              ← Dashboard
            </Link>
          </div>
        }
      />

      {/* ── Stats Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Shield}
          label="Total Roles"
          value={roles.length}
          accent="violet"
          delay={0.05}
        />
        <StatCard
          icon={Key}
          label="Total Permissions"
          value={totalPermissions}
          accent="blue"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label="Users with Roles"
          value={totalUsers}
          sublabel={mostUsedRole ? `Most common: ${mostUsedRole.name}` : undefined}
          accent="emerald"
          delay={0.15}
        />
        <StatCard
          icon={Lock}
          label="Highest Precedence"
          value={
            highestRole?.name
              ? highestRole.name.charAt(0).toUpperCase() +
                highestRole.name.slice(1)
              : '—'
          }
          sublabel={`Priority Level ${highestRole?.priority ?? '—'}`}
          accent="rose"
          delay={0.2}
        />
      </div>

      {/* ── Search & Filter Controls ─────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles by name or description..."
            className="w-full bg-white/3 border border-white/8 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/3 p-1 self-end sm:self-auto">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              view === 'grid'
                ? 'bg-white/8 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid View
          </button>
          <button
            onClick={() => setView('matrix')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              view === 'matrix'
                ? 'bg-white/8 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            Permissions Matrix
          </button>
        </div>
      </div>

      {/* ── Grid View ─────────────────────────────────────── */}
      {view === 'grid' && (
        <>
          {filteredRoles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Roles Found"
              description="No registered system roles match your active search terms."
              accent="violet"
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <StaggerList>
                {filteredRoles.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onManagePermissions={(r) => setPermissionsRole(r)}
                    onEditDescription={(r) => setEditRole(r)}
                    onAssignUsers={(r) => setAssignRole(r)}
                  />
                ))}
              </StaggerList>
            </div>
          )}
        </>
      )}

      {/* ── Matrix View ───────────────────────────────────── */}
      {view === 'matrix' && (
        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-white/2">
                  <th className="sticky left-0 z-10 bg-gray-950 px-5 py-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Permission Scope
                  </th>
                  {[...roles].reverse().map((role) => {
                    const cfg = getRoleConfig(role.name);
                    return (
                      <th key={role.id} className="px-5 py-4 text-center border-l border-white/6">
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${cfg.badge}`}
                          >
                            {role.name}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            Priority {role.priority}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {permCategories.map((category) => (
                  <React.Fragment key={`cat-${category}`}>
                    {/* Category Header Row */}
                    <tr className="bg-white/3">
                      <td
                        colSpan={roles.length + 1}
                        className="sticky left-0 bg-gray-900/90 backdrop-blur-sm px-5 py-2.5 text-[9px] font-extrabold tracking-widest text-indigo-400/90 uppercase border-y border-white/8"
                      >
                        {category} Permissions
                      </td>
                    </tr>
                    {/* Permission Scope Rows */}
                    {allPermissions
                      .filter((p) => p.category === category)
                      .map((perm) => (
                        <tr
                          key={perm.id}
                          className="hover:bg-white/2 transition-colors duration-150"
                        >
                          <td className="sticky left-0 bg-gray-950 px-5 py-3.5 min-w-[280px]">
                            <p className="font-mono text-xs font-bold text-gray-200">
                              {perm.name}
                            </p>
                            {perm.description && (
                              <p className="mt-1 text-[11px] text-gray-400">
                                {perm.description}
                              </p>
                            )}
                          </td>
                          {[...roles].reverse().map((role) => {
                            const has = role.permissions?.some(
                              (p) => p.id === perm.id
                            );
                            return (
                              <td
                                key={role.id}
                                className="px-5 py-3.5 text-center border-l border-white/6"
                              >
                                {has ? (
                                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                                  </div>
                                ) : (
                                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/2 border border-white/6">
                                    <XCircle className="h-4.5 w-4.5 text-gray-700" />
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {allPermissions.length === 0 && (
            <div className="p-12">
              <EmptyState
                icon={Key}
                title="No Permissions Defined"
                description="There are currently no permissions configured in the system."
                accent="blue"
              />
            </div>
          )}
        </GlassCard>
      )}

      {/* ── Priority Legend ───────────────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3.5">
          <Shield className="h-4 w-4 text-purple-400" />
          <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            Role Hierarchy & Precedence
          </h3>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {[...roles].reverse().map((role) => {
            const cfg = getRoleConfig(role.name);
            return (
              <div
                key={role.id}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-sm ${cfg.bgGlass} ${cfg.border}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${cfg.dot}`} />
                <span
                  className={`text-xs font-bold capitalize ${cfg.accent}`}
                >
                  {role.name}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  Priority {role.priority}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/2 px-3.5 py-2">
            <span className="text-[10px] text-gray-500 font-medium">
              Note: Higher priority levels grant override capabilities and inherit access from sub-priority roles.
            </span>
          </div>
        </div>
      </GlassCard>

      {/* ── Modals ────────────────────────────────────────── */}
      {permissionsRole && (
        <PermissionsModal
          role={
            roles.find((r) => r.id === permissionsRole.id) ?? permissionsRole
          }
          allPermissions={allPermissions}
          onClose={() => setPermissionsRole(null)}
          onPermissionsChanged={handlePermissionsChanged}
        />
      )}

      {editRole && (
        <EditDescriptionModal
          role={roles.find((r) => r.id === editRole.id) ?? editRole}
          onClose={() => setEditRole(null)}
          onSaved={handleDescriptionSaved}
        />
      )}

      {assignRole && (
        <AssignRoleModal
          key={assignRole.id}
          role={roles.find((r) => r.id === assignRole.id) ?? assignRole}
          users={users}
          onClose={() => setAssignRole(null)}
          onUserAssigned={handleUserAssigned}
        />
      )}
    </PageShell>
  );
}
