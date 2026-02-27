'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  X,
  Shield,
  Search,
  UserCheck,
  UserMinus,
  Loader2,
  Users,
  CheckCircle2,
} from 'lucide-react';
import {
  assignRoleToUserAction,
  removeRoleFromUserAction,
} from '@/app/_lib/role-actions';
import { getRoleConfig } from './roleConfig';

function UserAvatar({ user, size = 'md' }) {
  const isUrl = user.avatar?.startsWith('http');
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  if (isUrl) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sz} rounded-full object-cover ring-1 ring-white/10`}
      />
    );
  }
  return (
    <div
      className={`${sz} flex shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-gray-300`}
    >
      {user.avatar ?? '?'}
    </div>
  );
}

export default function AssignRoleModal({
  role,
  users,
  onClose,
  onUserAssigned, // (userId, newRoleId, newRoleName, oldRoleId) => void
}) {
  const cfg = getRoleConfig(role?.name);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned'
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [localUsers, setLocalUsers] = useState(
    users.map((u) => ({
      ...u,
      roleIds: Array.isArray(u.roleIds)
        ? u.roleIds
        : u.currentRoleId
          ? [u.currentRoleId]
          : [],
      roleNames: Array.isArray(u.roleNames)
        ? u.roleNames
        : u.currentRoleName && u.currentRoleName !== 'guest'
          ? [u.currentRoleName]
          : [],
    }))
  );
  const [errorMap, setErrorMap] = useState({});
  const [successIds, setSuccessIds] = useState(new Set());
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return localUsers.filter((u) => {
      const matchSearch =
        !term ||
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term);
      const isAssigned = u.roleIds?.includes(role.id);
      if (filter === 'assigned') return matchSearch && isAssigned;
      if (filter === 'unassigned') return matchSearch && !isAssigned;
      return matchSearch;
    });
  }, [localUsers, search, filter, role.id]);

  const assignedCount = useMemo(
    () => localUsers.filter((u) => u.roleIds?.includes(role.id)).length,
    [localUsers, role.id]
  );

  function setLoading(userId, val) {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      val ? next.add(userId) : next.delete(userId);
      return next;
    });
  }

  function setSuccess(userId) {
    setSuccessIds((prev) => new Set(prev).add(userId));
    setTimeout(
      () =>
        setSuccessIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        }),
      2000
    );
  }

  function handleAssign(user) {
    setLoading(user.id, true);
    setErrorMap((prev) => ({ ...prev, [user.id]: null }));

    const fd = new FormData();
    fd.set('userId', user.id);
    fd.set('roleId', role.id);
    fd.set('roleName', role.name);

    startTransition(async () => {
      try {
        await assignRoleToUserAction(fd);
        setLocalUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  roleIds: u.roleIds?.includes(role.id)
                    ? u.roleIds
                    : [...(u.roleIds ?? []), role.id],
                  roleNames: u.roleNames?.includes(role.name)
                    ? u.roleNames
                    : [...(u.roleNames ?? []), role.name],
                }
              : u
          )
        );
        onUserAssigned(user.id, role.id, 'assign');
        setSuccess(user.id);
      } catch (err) {
        setErrorMap((prev) => ({ ...prev, [user.id]: err.message }));
      } finally {
        setLoading(user.id, false);
      }
    });
  }

  function handleRemove(user) {
    setLoading(user.id, true);
    setErrorMap((prev) => ({ ...prev, [user.id]: null }));

    const fd = new FormData();
    fd.set('userId', user.id);
    fd.set('roleId', role.id);
    fd.set('roleName', role.name);

    startTransition(async () => {
      try {
        await removeRoleFromUserAction(fd);
        setLocalUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  roleIds: (u.roleIds ?? []).filter((id) => id !== role.id),
                  roleNames: (u.roleNames ?? []).filter((n) => n !== role.name),
                }
              : u
          )
        );
        onUserAssigned(user.id, role.id, 'remove');
        setSuccess(user.id);
      } catch (err) {
        setErrorMap((prev) => ({ ...prev, [user.id]: err.message }));
      } finally {
        setLoading(user.id, false);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel */}
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl">
        {/* ── header ── */}
        <div
          className={`flex shrink-0 items-center justify-between border-b border-white/8 bg-linear-to-r ${cfg.gradient} px-5 py-4`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${cfg.iconBg}`}
            >
              <Shield className={`h-4 w-4 ${cfg.iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Assign role to users</p>
              <h2 className="text-sm font-bold text-white capitalize">
                {role.name}
                <span className="ml-2 font-normal text-gray-500">
                  · {assignedCount} assigned
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/8 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── search + filter ── */}
        <div className="shrink-0 space-y-2 border-b border-white/8 px-4 py-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-4 pl-10 text-sm text-white placeholder-gray-600 transition-colors outline-none focus:border-white/20"
            />
          </div>
          <div className="flex gap-1">
            {[
              { key: 'all', label: `All (${localUsers.length})` },
              { key: 'assigned', label: `Assigned (${assignedCount})` },
              {
                key: 'unassigned',
                label: `Others (${localUsers.length - assignedCount})`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── user list ── */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '420px' }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-600">
              <Users className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">No users found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {filtered.map((user) => {
                const isAssigned = user.currentRoleId === role.id;
                const isLoading = loadingIds.has(user.id);
                const isSuccess = successIds.has(user.id);
                const err = errorMap[user.id];
                const currentCfg = getRoleConfig(user.currentRoleName);

                return (
                  <li
                    key={user.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/3 ${
                      isAssigned ? 'bg-white/2' : ''
                    }`}
                  >
                    <UserAvatar user={user} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-white">
                          {user.name}
                        </p>
                        {isAssigned && (
                          <CheckCircle2
                            className={`h-3.5 w-3.5 shrink-0 ${cfg.iconColor}`}
                          />
                        )}
                      </div>
                      <p className="truncate text-xs text-gray-500">
                        {user.email}
                      </p>
                      {/* all current role badges */}
                      {user.roleNames?.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {user.roleNames.map((rn) => {
                            const rc = getRoleConfig(rn);
                            return (
                              <span
                                key={rn}
                                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold capitalize ${rc.badge}`}
                              >
                                {rn}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {err && (
                        <p className="mt-0.5 text-[10px] text-red-400">{err}</p>
                      )}
                    </div>

                    {/* role count badge */}
                    <span className="shrink-0 rounded-md bg-white/8 px-2 py-0.5 text-[10px] text-gray-400">
                      {user.roleIds?.length ?? 0} role
                      {user.roleIds?.length !== 1 ? 's' : ''}
                    </span>

                    {/* action button */}
                    {isAssigned ? (
                      <button
                        onClick={() => handleRemove(user)}
                        disabled={isLoading}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-white/6 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isSuccess ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <UserMinus className="h-3.5 w-3.5" />
                        )}
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAssign(user)}
                        disabled={isLoading}
                        className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${cfg.badge} hover:opacity-90`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isSuccess ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        Assign
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── footer ── */}
        <div className="shrink-0 border-t border-white/8 px-4 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white/6 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
