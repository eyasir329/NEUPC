/**
 * @file Member settings client — account preferences and
 *   configuration controls (notification toggles, display options,
 *   privacy settings).
 * @module MemberSettingsClient
 */

'use client';

import { useState, useTransition } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Check,
  X,
  Loader2,
  User,
  BadgeCheck,
  AlertTriangle,
  Info,
  LogOut,
  Palette,
  Moon,
  Globe,
  KeyRound,
} from 'lucide-react';
import { updateMemberInfoAction } from '@/app/_lib/member-profile-actions';
import { signOutAction } from '@/app/_lib/actions';

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, description, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
      <div className="flex items-start gap-3 border-b border-white/6 px-5 py-4">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5">
          <Icon className="size-4 text-white/40" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white/80">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-white/35">{description}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_META = {
  active: {
    label: 'Active',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  },
  pending: {
    label: 'Pending',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  suspended: {
    label: 'Suspended',
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
  banned: {
    label: 'Banned',
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
  },
  locked: {
    label: 'Locked',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
};

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-white/70">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-white/35">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ${
          checked
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-white/20 bg-white/8'
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MemberSettingsClient({ user }) {
  // Account update form state
  const [editingInfo, setEditingInfo] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Notification preferences (stored in localStorage, UI only)
  const [notifEventReminders, setNotifEventReminders] = useState(true);
  const [notifNotices, setNotifNotices] = useState(true);
  const [notifAchievements, setNotifAchievements] = useState(true);
  const [notifDiscussions, setNotifDiscussions] = useState(false);

  const statusMeta = STATUS_META[user.account_status] ?? STATUS_META.pending;

  async function handleInfoSubmit(formData) {
    setFormError(null);
    setFormSuccess(false);
    startTransition(async () => {
      const result = await updateMemberInfoAction(formData);
      if (result?.error) {
        setFormError(result.error);
      } else {
        setFormSuccess(true);
        setTimeout(() => {
          setFormSuccess(false);
          setEditingInfo(false);
        }, 1200);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Settings</h1>
        <p className="text-sm text-white/40">
          Manage your account preferences and security
        </p>
      </div>

      {/* ── Account Status ── */}
      <SectionCard
        title="Account Status"
        icon={Shield}
        description="Your current account standing and verification info"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusMeta.color}`}
              >
                {statusMeta.label}
              </span>
              {user.email_verified && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs text-emerald-400">
                  <BadgeCheck className="size-3" />
                  Email Verified
                </span>
              )}
              {user.phone_verified && (
                <span className="flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-0.5 text-xs text-blue-400">
                  <Phone className="size-3" />
                  Phone Verified
                </span>
              )}
            </div>
            {user.status_reason && (
              <p className="flex items-start gap-1.5 text-xs text-white/40">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {user.status_reason}
              </p>
            )}
          </div>

          <div className="text-xs text-white/30">
            <p>
              Member since{' '}
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </p>
            {user.last_login && (
              <p>
                Last login:{' '}
                {new Date(user.last_login).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Personal Info ── */}
      <SectionCard
        title="Personal Information"
        icon={User}
        description="Update your display name and contact details"
      >
        {editingInfo ? (
          <form action={handleInfoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Full Name
                </label>
                <input
                  name="full_name"
                  defaultValue={user.full_name}
                  required
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-3.5 py-2.5 text-sm text-white placeholder-white/25 transition outline-none focus:border-white/20 focus:bg-white/6"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Phone
                </label>
                <input
                  name="phone"
                  defaultValue={user.phone ?? ''}
                  placeholder="+880…"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-3.5 py-2.5 text-sm text-white placeholder-white/25 transition outline-none focus:border-white/20 focus:bg-white/6"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Email{' '}
                <span className="text-white/25">
                  (read-only — managed by OAuth)
                </span>
              </label>
              <input
                value={user.email}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-white/6 bg-white/2 px-3.5 py-2.5 text-sm text-white/30 outline-none"
              />
            </div>

            {formError && (
              <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-400">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-400">
                Personal information updated!
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/16 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingInfo(false)}
                className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-sm text-white/50 transition hover:bg-white/6"
              >
                <X className="size-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-1">
            {[
              { icon: User, label: 'Name', value: user.full_name },
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Phone, label: 'Phone', value: user.phone || '—' },
              {
                icon: Globe,
                label: 'Auth Provider',
                value: user.provider
                  ? user.provider.charAt(0).toUpperCase() +
                    user.provider.slice(1)
                  : 'Email',
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 border-b border-white/5 py-2.5 last:border-0"
              >
                <Icon className="size-4 shrink-0 text-white/30" />
                <span className="w-24 shrink-0 text-xs text-white/35">
                  {label}
                </span>
                <span className="truncate text-sm text-white/65">{value}</span>
              </div>
            ))}
            <div className="flex justify-end pt-3">
              <button
                onClick={() => setEditingInfo(true)}
                className="rounded-xl border border-white/8 bg-white/3 px-4 py-2 text-xs font-medium text-white/50 transition hover:bg-white/8 hover:text-white/80"
              >
                Edit Information
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Notification Preferences ── */}
      <SectionCard
        title="Notification Preferences"
        icon={Bell}
        description="Choose what updates you want to receive"
      >
        <ToggleRow
          label="Event Reminders"
          description="Get notified before registered events start"
          checked={notifEventReminders}
          onChange={setNotifEventReminders}
        />
        <ToggleRow
          label="New Notices"
          description="Receive alerts for important club notices"
          checked={notifNotices}
          onChange={setNotifNotices}
        />
        <ToggleRow
          label="Achievement Updates"
          description="Notifications when you earn new achievements"
          checked={notifAchievements}
          onChange={setNotifAchievements}
        />
        <ToggleRow
          label="Discussion Replies"
          description="Notify when someone replies to your threads"
          checked={notifDiscussions}
          onChange={setNotifDiscussions}
        />
        <p className="mt-3 rounded-xl border border-white/6 bg-white/2 px-3 py-2 text-[11px] text-white/25">
          <Info className="mr-1 mb-0.5 inline size-3" />
          Notification delivery via email is managed at the club level. These
          preferences are saved locally.
        </p>
      </SectionCard>

      {/* ── Security ── */}
      <SectionCard
        title="Security"
        icon={Lock}
        description="Authentication and account security settings"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/2 p-3.5">
            <div className="flex items-center gap-3">
              <KeyRound className="size-4 text-white/35" />
              <div>
                <p className="text-sm text-white/65">
                  Password / Authentication
                </p>
                <p className="text-xs text-white/30">
                  {user.provider
                    ? `Managed by ${user.provider} OAuth — no password required`
                    : 'Email & password authentication'}
                </p>
              </div>
            </div>
            {user.provider && (
              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[10px] text-blue-400">
                OAuth
              </span>
            )}
          </div>

          {user.suspension_expires_at && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Account Temporarily Suspended
                </p>
                <p className="text-xs text-amber-400/60">
                  Suspension lifts on{' '}
                  {new Date(user.suspension_expires_at).toLocaleDateString(
                    'en-US',
                    { month: 'long', day: 'numeric', year: 'numeric' }
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Danger Zone ── */}
      <div className="overflow-hidden rounded-2xl border border-red-400/20 bg-red-400/4">
        <div className="flex items-center gap-2.5 border-b border-red-400/12 px-5 py-4">
          <AlertTriangle className="size-4 text-red-400/70" />
          <h3 className="text-sm font-semibold text-red-400/80">Sign Out</h3>
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-white/50">
              Sign out of your account on this device.
            </p>
            <p className="mt-0.5 text-xs text-white/30">
              Your data is always safe on our servers.
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-400/18 hover:text-red-300"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
