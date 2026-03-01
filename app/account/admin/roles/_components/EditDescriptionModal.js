/**
 * @file Edit description modal — dialog for updating a role’s
 *   display description text.
 * @module AdminEditDescriptionModal
 */

'use client';

import { useState, useTransition, useEffect } from 'react';
import { X, Shield, Loader2, Check } from 'lucide-react';
import { updateRoleDescriptionAction } from '@/app/_lib/role-actions';
import { getRoleConfig } from './roleConfig';

export default function EditDescriptionModal({ role, onClose, onSaved }) {
  const [description, setDescription] = useState(role?.description ?? '');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  useEffect(() => {
    setDescription(role?.description ?? '');
    setError(null);
  }, [role]);

  if (!role) return null;

  const cfg = getRoleConfig(role.name);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set('roleId', role.id);
    fd.set('description', description);

    startTransition(async () => {
      try {
        await updateRoleDescriptionAction(fd);
        onSaved(role.id, description);
        onClose();
      } catch (err) {
        setError(err.message ?? 'Something went wrong.');
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
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl">
        {/* header */}
        <div
          className={`flex items-center justify-between border-b border-white/8 bg-linear-to-r ${cfg.gradient} p-5`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${cfg.iconBg}`}
            >
              <Shield className={`h-4 w-4 ${cfg.iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Edit description</p>
              <h2 className="text-sm font-bold text-white capitalize">
                {role.name} Role
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

        {/* body */}
        <form onSubmit={handleSubmit} className="p-5">
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={300}
            placeholder="Describe this role's purpose and capabilities..."
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors outline-none focus:border-white/20 focus:bg-white/8"
          />
          <p className="mt-1 text-right text-[10px] text-gray-600">
            {description.length}/300
          </p>

          {error && (
            <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 rounded-xl bg-white/6 px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !description.trim()}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${cfg.badge}`}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
