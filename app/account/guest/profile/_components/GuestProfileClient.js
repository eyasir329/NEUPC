/**
 * @file Guest profile client component
 * @module GuestProfileClient
 */

'use client';

import { useState, useTransition } from 'react';
import { useScrollLock } from '@/app/_hooks/useUiEffects';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  CheckCircle2,
  XCircle,
  Calendar,
  Save,
  X,
  Sparkles,
  LogOut,
  AlertTriangle,
  Clock,
  Trash2,
  Loader2,
  Upload,
  Pencil,
  Bell,
  Award,
  Lock,
} from 'lucide-react';
import {
  updateGuestInfoAction,
  deleteGuestAccountAction,
} from '@/app/_lib/actions/guest-actions';
import {
  uploadAvatarAction,
  removeAvatarAction,
} from '@/app/_lib/actions/avatar-actions';
import { signOutAction } from '@/app/_lib/actions/actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
  StatCard,
  Pill,
  GradientBar,
  ActionButton,
  Avatar,
} from '@/app/account/_components/ui';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function profileCompletion(user) {
  const fields = [
    !!user.full_name,
    !!user.email,
    !!user.phone,
    !!user.avatar_url,
    !!(user.email_verified || user.is_email_verified),
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function DeleteModal({ onClose }) {
  const [confirmed, setConfirmed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  useScrollLock();

  async function handleDelete() {
    setError('');
    setDeleting(true);
    try {
      const result = await deleteGuestAccountAction();
      if (result?.error) {
        setError(result.error);
        setDeleting(false);
        return;
      }
      await signOutAction();
    } catch {
      setError('Something went wrong. Please try again.');
      setDeleting(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md rounded-2xl border border-rose-500/20 bg-zinc-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              Delete Account
            </h3>
            <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
              Irreversible Action
            </p>
          </div>
        </div>
        <p className="mb-4 text-xs leading-relaxed font-semibold text-zinc-400">
          Deleting your account permanently removes your registration history,
          active logs, and membership queue requests. Type{' '}
          <span className="font-mono font-bold text-rose-400">DELETE</span>{' '}
          below to confirm.
        </p>
        <input
          value={confirmed}
          onChange={(e) => setConfirmed(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="mb-4 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 shadow-inner transition-all duration-200 outline-none focus:border-rose-500/40 focus:bg-zinc-900"
        />
        {error && (
          <p className="mb-3 text-xs font-bold text-rose-400">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            disabled={confirmed !== 'DELETE' || deleting}
            onClick={handleDelete}
            className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-bold tracking-wider text-rose-300 uppercase shadow-md transition-all hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {deleting ? 'Deleting…' : 'Confirm Delete'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-zinc-900 py-2.5 text-xs font-bold tracking-wider text-zinc-400 uppercase shadow-md transition-all hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function EditInfoForm({ user, onCancel, onSaved }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateGuestInfoAction(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(onSaved, 600);
      }
    });
  }

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-zinc-950/45 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-blue-500/50 focus:bg-zinc-950/70 focus:shadow-[0_0_8px_rgba(59,130,246,0.15)] shadow-inner';

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-2 block text-[10px] font-black tracking-wider text-zinc-500 uppercase">
          Full Name *
        </label>
        <input
          className={inputCls}
          name="full_name"
          defaultValue={user.full_name ?? ''}
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-black tracking-wider text-zinc-500 uppercase">
          Phone
        </label>
        <input
          className={inputCls}
          name="phone"
          defaultValue={user.phone ?? ''}
          placeholder="+880 1xxx xxxxxx"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs font-bold text-rose-300 sm:col-span-2">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs font-bold text-emerald-300 sm:col-span-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile updated
          successfully.
        </div>
      )}
      <div className="mt-2 flex gap-2 sm:col-span-2">
        <ActionButton
          type="submit"
          tone="primary"
          icon={isPending ? Loader2 : Save}
          className="px-4 py-2"
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </ActionButton>
        <ActionButton
          tone="ghost"
          icon={X}
          onClick={onCancel}
          className="px-4 py-2"
        >
          Cancel
        </ActionButton>
      </div>
    </form>
  );
}

function AvatarUploader({ user, name }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const isImage =
    user.avatar_url &&
    (user.avatar_url.startsWith('http') ||
      user.avatar_url.startsWith('/api/image/'));

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const result = await uploadAvatarAction(fd);
      if (result?.error) setError(result.error);
    } catch {
      setError('Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);
    try {
      const result = await removeAvatarAction();
      if (result?.error) setError(result.error);
    } catch {
      setError('Failed to remove avatar.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.full_name ?? 'Avatar'}
            className="h-20 w-20 rounded-2xl border border-white/10 object-cover shadow-lg"
          />
        ) : (
          <Avatar name={name} size="xl" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/5 bg-zinc-950/40 px-3 py-2 text-xs font-bold text-zinc-300 shadow-sm transition-all hover:border-white/10 hover:bg-zinc-900/60 active:scale-95">
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}{' '}
          Upload
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={handleFileChange}
          />
        </label>
        {isImage && (
          <ActionButton
            tone="danger"
            icon={Trash2}
            onClick={handleRemove}
            disabled={uploading}
            className="px-3 py-2"
          >
            Remove
          </ActionButton>
        )}
      </div>
      {error && <p className="text-[10px] font-bold text-rose-400">{error}</p>}
    </div>
  );
}

function InfoRow({ label, value, badge }) {
  return (
    <div className="border-b border-white/5 py-3 last:border-b-0">
      <p className="mb-1 font-mono text-[9px] font-black tracking-wider text-zinc-500 uppercase">
        {label}
      </p>
      <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
        {value}
        {badge}
      </div>
    </div>
  );
}

export default function GuestProfileClient({ user, stats }) {
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const name = user.full_name || user.email || 'Guest';
  const completion = profileCompletion(user);
  const verified = user.email_verified || user.is_email_verified;

  return (
    <PageShell className="space-y-6 text-zinc-300 selection:bg-blue-500/30">
      <AnimatePresence>
        {showDelete && <DeleteModal onClose={() => setShowDelete(false)} />}
      </AnimatePresence>

      <PageHeader
        icon={User}
        title="My Profile"
        subtitle="Manage your guest account details and verify academic fields."
        accent="blue"
        actions={
          !editing && (
            <ActionButton
              tone="ghost"
              icon={Pencil}
              className="px-4 py-2"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </ActionButton>
          )
        }
      />

      {/* Hero card */}
      <GlassCard className="relative overflow-hidden border border-white/10 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
        </div>
        <div className="relative flex flex-wrap items-center gap-6">
          <AvatarUploader user={user} name={name} />

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                {user.full_name || 'Guest User'}
              </h2>
              <Pill
                tone="emerald"
                className="text-[10px] font-bold tracking-wider uppercase"
              >
                <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{' '}
                {user.account_status ?? 'active'}
              </Pill>
              <Pill
                tone="violet"
                className="text-[10px] font-bold tracking-wider uppercase"
              >
                Guest Account
              </Pill>
            </div>
            <p className="font-mono text-xs leading-normal font-bold text-zinc-500">
              {user.email} · Joined {formatDate(user.created_at)}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs font-bold text-zinc-500">
                Profile Completeness
              </span>
              <div className="w-32 max-w-[200px] flex-1">
                <GradientBar
                  value={completion}
                  max={100}
                  tone="blue"
                  height="h-2"
                />
              </div>
              <span className="font-mono text-xs font-black text-white">
                {completion}%
              </span>
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="mb-0.5 font-mono text-[9px] font-black tracking-wider text-zinc-500 uppercase">
              Last Active
            </p>
            <p className="text-xs font-extrabold text-zinc-200">
              {formatDateTime(user.last_login)}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 border-t border-white/5 pt-6">
                <EditInfoForm
                  user={user}
                  onCancel={() => setEditing(false)}
                  onSaved={() => setEditing(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Registered"
          value={stats.eventsRegistered}
          accent="blue"
          delay={0}
        />
        <StatCard
          icon={CheckCircle2}
          label="Attended"
          value={stats.eventsAttended}
          accent="emerald"
          delay={0.05}
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={stats.certificates}
          accent="violet"
          delay={0.1}
        />
        <StatCard
          icon={Bell}
          label="Notifications"
          value={stats.notices}
          accent="amber"
          delay={0.15}
        />
      </div>

      {/* Details layout Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <GlassCard className="border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-xl">
          <SectionHeader
            icon={User}
            title="Personal Details"
            accent="blue"
            action={
              !editing && (
                <ActionButton
                  tone="ghost"
                  icon={Pencil}
                  className="px-3 py-1.5"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </ActionButton>
              )
            }
          />
          <div className="mt-2 flex flex-col">
            <InfoRow label="Full Name" value={user.full_name || '—'} />
            <InfoRow
              label="Email Address"
              value={user.email}
              badge={
                verified ? (
                  <Pill
                    tone="emerald"
                    className="text-[9px] font-black tracking-wider uppercase"
                  >
                    verified
                  </Pill>
                ) : (
                  <Pill
                    tone="rose"
                    className="text-[9px] font-black tracking-wider uppercase"
                  >
                    unverified
                  </Pill>
                )
              }
            />
            <InfoRow label="Mobile Phone" value={user.phone || '—'} />
            <InfoRow
              label="Account Access"
              value="Guest Level"
              badge={
                <Pill
                  tone="amber"
                  className="text-[9px] font-black tracking-wider uppercase"
                >
                  Upgrade Available
                </Pill>
              }
            />
          </div>
        </GlassCard>

        <GlassCard className="border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-xl">
          <SectionHeader
            icon={Shield}
            title="Security & Logs"
            accent="violet"
          />
          <div className="mt-2 flex flex-col">
            <InfoRow
              label="Sign-in provider"
              value={
                <span className="flex items-center gap-1.5 font-bold">
                  <Shield className="h-4 w-4 text-zinc-400" /> Managed Google
                  OAuth
                </span>
              }
            />
            <InfoRow
              label="Last recorded Session"
              value={formatDateTime(user.last_login)}
            />

            <div className="py-3">
              <p className="mb-2 font-mono text-[9px] font-black tracking-wider text-zinc-500 uppercase">
                MFA Status
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-950/40 px-3 py-2 text-xs font-bold text-zinc-500 shadow-inner">
                <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                <span className="flex-1">Multi-factor Authentication</span>
                <Pill
                  tone="gray"
                  className="text-[9px] font-black tracking-wider uppercase"
                >
                  Members only
                </Pill>
              </div>
            </div>

            {user.suspension_expires_at &&
              new Date(user.suspension_expires_at) > new Date() && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 shadow-md">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-amber-400" />
                  <div className="text-xs leading-normal font-bold">
                    <p className="text-amber-300">Account under suspension</p>
                    <p className="mt-0.5 text-amber-400/60">
                      Expires: {formatDateTime(user.suspension_expires_at)}
                    </p>
                  </div>
                </div>
              )}
          </div>
        </GlassCard>
      </div>

      {/* Premium members banner */}
      <GlassCard className="relative overflow-hidden border border-indigo-500/20 bg-linear-to-br from-zinc-950 via-zinc-900/60 to-indigo-950/20 p-6 shadow-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-40 w-40 animate-pulse rounded-full bg-indigo-500/5 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-inner">
            <Sparkles className="h-5.5 w-5.5 animate-pulse" />
          </div>
          <div className="min-w-[200px] flex-1 space-y-1">
            <h3 className="text-sm font-bold tracking-wider text-white uppercase">
              Upgrade to Club Membership
            </h3>
            <p className="text-xs leading-relaxed font-semibold text-zinc-400">
              Applying for full membership allows you to enjoy verified
              credentials and contest ranking logs.
            </p>
            <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {[
                'Contest leaderboard standings',
                'Performance analytics graphs',
                'Advanced resources & library guides',
                'Verified achievement credentials',
                'Premium Telegram log warnings',
                '1-on-1 CP mentor guides',
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-300"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-400" />{' '}
                  {t}
                </div>
              ))}
            </div>
          </div>
          <ActionButton
            href="/account/guest/membership-application"
            tone="indigo"
            className="shrink-0 px-4 py-2.5 font-bold"
          >
            Apply Now
          </ActionButton>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard className="border border-rose-500/10 bg-zinc-950/25 p-5">
        <SectionHeader icon={LogOut} title="Danger Zone" accent="rose" />
        <div className="mt-2 flex flex-col gap-4 divide-y divide-white/5">
          <div className="flex items-center justify-between gap-4 pt-1">
            <div>
              <p className="text-xs font-bold text-zinc-200">Sign Out</p>
              <p className="mt-0.5 text-[11px] leading-normal font-semibold text-zinc-500">
                Logout from this browser session.
              </p>
            </div>
            <form action={signOutAction}>
              <ActionButton
                type="submit"
                tone="ghost"
                icon={LogOut}
                className="px-4 py-2"
              >
                Sign Out
              </ActionButton>
            </form>
          </div>
          <div className="flex items-center justify-between gap-4 pt-4">
            <div>
              <p className="text-xs font-bold text-zinc-200">Delete Account</p>
              <p className="mt-0.5 text-[11px] leading-normal font-semibold text-zinc-500">
                Permanently remove your account and credentials from NEUPC.
              </p>
            </div>
            <ActionButton
              tone="danger"
              icon={X}
              className="px-4 py-2"
              onClick={() => setShowDelete(true)}
            >
              Delete
            </ActionButton>
          </div>
        </div>
      </GlassCard>
    </PageShell>
  );
}
