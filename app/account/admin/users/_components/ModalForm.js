import { ChevronDown } from 'lucide-react';
import { ROLES } from './constants';

export default function ModalForm({
  cfg,
  reason,
  onReasonChange,
  expiresAt,
  onExpiresAtChange,
  selectedRole,
  onRoleChange,
  editName,
  onNameChange,
  editEmail,
  onEmailChange,
  editStudentId,
  onStudentIdChange,
  editAvatar,
  onAvatarChange,
}) {
  return (
    <>
      {/* Reason textarea */}
      {cfg?.showReason && (
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-300">
            Reason{' '}
            <span className="text-gray-500">
              {cfg.title === 'Activate User' ? '(optional)' : '(required)'}
            </span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={2}
            placeholder="Provide a clear reason for this action…"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>
      )}

      {/* Expiry datetime */}
      {cfg?.showExpiry && (
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-300">
            Suspension Expires <span className="text-red-400">*required</span>
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => onExpiresAtChange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>
      )}

      {/* Role select */}
      {cfg?.showRole && (
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-300">
            New Role <span className="text-gray-500">(required)</span>
          </label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white transition-colors outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-gray-900">
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      )}

      {/* Edit user fields */}
      {cfg?.showEdit && (
        <>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-300">
              Full Name <span className="text-gray-500">(required)</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., John Doe"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-300">
              Email <span className="text-gray-500">(required)</span>
            </label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="e.g., john@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-300">
              Student ID <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={editStudentId}
              onChange={(e) => onStudentIdChange(e.target.value)}
              placeholder="e.g., STU-2024-001"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-300">
              Avatar URL <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="url"
              value={editAvatar}
              onChange={(e) => onAvatarChange(e.target.value)}
              placeholder="e.g., https://example.com/avatar.jpg"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
        </>
      )}
    </>
  );
}
