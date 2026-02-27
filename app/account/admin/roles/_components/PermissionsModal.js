'use client';

import { useState, useTransition, useMemo } from 'react';
import { X, Key, Shield, Loader2, Search, Lock } from 'lucide-react';
import { toggleRolePermissionAction } from '@/app/_lib/role-actions';
import { getRoleConfig } from './roleConfig';

export default function PermissionsModal({
  role,
  allPermissions,
  onClose,
  onPermissionsChanged,
}) {
  const cfg = getRoleConfig(role?.name);

  // local set of assigned permission IDs for O(1) lookup
  const [assignedIds, setAssignedIds] = useState(
    () => new Set(role?.permissions?.map((p) => p.id) ?? [])
  );
  const [loadingId, setLoadingId] = useState(null); // permissionId being toggled
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [, startTransition] = useTransition();

  // Group allPermissions by category
  const grouped = useMemo(() => {
    const map = {};
    for (const perm of allPermissions) {
      if (!map[perm.category]) map[perm.category] = [];
      map[perm.category].push(perm);
    }
    return map;
  }, [allPermissions]);

  const categories = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  // Filtered permissions
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return allPermissions.filter((p) => {
      const matchSearch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term);
      const matchCat =
        activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [allPermissions, search, activeCategory]);

  const groupedFiltered = useMemo(() => {
    const map = {};
    for (const perm of filtered) {
      if (!map[perm.category]) map[perm.category] = [];
      map[perm.category].push(perm);
    }
    return map;
  }, [filtered]);

  const assignedCount = assignedIds.size;

  function handleToggle(permissionId) {
    if (loadingId) return; // prevent concurrent toggles
    const isAssigned = assignedIds.has(permissionId);
    const action = isAssigned ? 'remove' : 'add';

    // Optimistic update
    setLoadingId(permissionId);
    setError(null);
    const next = new Set(assignedIds);
    if (isAssigned) {
      next.delete(permissionId);
    } else {
      next.add(permissionId);
    }
    setAssignedIds(next);

    const fd = new FormData();
    fd.set('roleId', role.id);
    fd.set('permissionId', permissionId);
    fd.set('action', action);

    startTransition(async () => {
      try {
        await toggleRolePermissionAction(fd);
        // Update parent with new permission list
        const updatedPerms = allPermissions.filter((p) => next.has(p.id));
        onPermissionsChanged(role.id, updatedPerms);
      } catch (err) {
        // Revert optimistic update
        setAssignedIds(assignedIds);
        setError(err.message ?? 'Failed to update permission.');
      } finally {
        setLoadingId(null);
      }
    });
  }

  if (!role) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className={`flex shrink-0 items-center justify-between border-b border-white/8 bg-linear-to-r ${cfg.gradient} px-5 py-4`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${cfg.iconBg}`}
            >
              <Key className={`h-5 w-5 ${cfg.iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Manage permissions for</p>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white capitalize">
                  {role.name}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${cfg.badge}`}
                >
                  {assignedCount} assigned
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/8 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search + Category filter */}
        <div className="shrink-0 space-y-3 border-b border-white/8 px-5 py-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permissions…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-4 pl-9 text-xs text-white placeholder-gray-600 transition-colors outline-none focus:border-white/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-white/15 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              All ({allPermissions.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  activeCategory === cat
                    ? 'bg-white/15 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {cat} ({grouped[cat]?.length ?? 0})
              </button>
            ))}
          </div>
        </div>

        {/* Permission list */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{ minHeight: 0 }}
        >
          {error && (
            <div className="mb-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
              {error}
            </div>
          )}

          {Object.keys(groupedFiltered).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <Key className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">No permissions found</p>
            </div>
          )}

          {Object.entries(groupedFiltered)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, perms]) => (
              <div key={category} className="mb-5 last:mb-0">
                {/* Category header */}
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                    {category}
                  </p>
                  <div className="h-px flex-1 bg-white/6" />
                  <span className="text-[10px] text-gray-600">
                    {perms.filter((p) => assignedIds.has(p.id)).length}/
                    {perms.length}
                  </span>
                </div>

                {/* Permissions */}
                <div className="space-y-1.5">
                  {perms.map((perm) => {
                    const isAssigned = assignedIds.has(perm.id);
                    const isLoading = loadingId === perm.id;

                    return (
                      <button
                        key={perm.id}
                        onClick={() => handleToggle(perm.id)}
                        disabled={!!loadingId}
                        className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 disabled:cursor-not-allowed ${
                          isAssigned
                            ? `border-white/10 bg-white/5 ${cfg.bgGlass}`
                            : 'border-transparent bg-white/3 hover:bg-white/5'
                        }`}
                      >
                        {/* toggle box */}
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                            isAssigned
                              ? `${cfg.iconBg} border-transparent`
                              : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                          ) : isAssigned ? (
                            <svg
                              className={`h-3 w-3 ${cfg.iconColor}`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : null}
                        </div>

                        {/* label */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-medium ${isAssigned ? 'text-white' : 'text-gray-400'}`}
                          >
                            {perm.name}
                          </p>
                          {perm.description && (
                            <p className="mt-0.5 truncate text-[10px] text-gray-600">
                              {perm.description}
                            </p>
                          )}
                        </div>

                        {/* badge */}
                        {isAssigned && (
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
                          >
                            ON
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-white/8 px-5 py-3">
          <p className="text-xs text-gray-500">
            {assignedCount} of {allPermissions.length} permissions assigned
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/8 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/12"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
