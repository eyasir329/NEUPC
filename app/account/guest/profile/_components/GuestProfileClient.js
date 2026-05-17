'use client';

import { useState, useTransition } from 'react';
import { useScrollLock } from '@/app/_lib/hooks';
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
  Github,
  Lock,
} from 'lucide-react';
import { updateGuestInfoAction } from '@/app/_lib/guest-actions';
import { uploadAvatarAction, removeAvatarAction } from '@/app/_lib/avatar-actions';
import { signOutAction } from '@/app/_lib/actions';
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
} from '../../_components/_ui';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function profileCompletion(user) {
  const fields = [!!user.full_name, !!user.email, !!user.phone, !!user.avatar_url, !!(user.email_verified || user.is_email_verified)];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function DeleteModal({ onClose }) {
  const [confirmed, setConfirmed] = useState('');
  useScrollLock();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-white">Delete account</h3>
            <p className="text-[12px] text-gray-500">This action is irreversible.</p>
          </div>
        </div>
        <p className="mb-4 text-[13px] leading-relaxed text-gray-300">
          Deleting your account permanently removes your data, registrations, and any pending applications. Type{' '}
          <span className="font-mono text-rose-400">DELETE</span> to confirm.
        </p>
        <input
          value={confirmed}
          onChange={(e) => setConfirmed(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="mb-3 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-rose-500/30"
        />
        <div className="flex gap-2">
          <button
            disabled={confirmed !== 'DELETE'}
            className="flex-1 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-40"
          >
            Delete account
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.06]">
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
      if (result?.error) { setError(result.error); }
      else { setSuccess(true); setTimeout(onSaved, 600); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-500">Full name *</label>
        <input className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-white/[0.16]" name="full_name" defaultValue={user.full_name ?? ''} required />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-500">Phone</label>
        <input className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-white/[0.16]" name="phone" defaultValue={user.phone ?? ''} placeholder="+880 1xxx xxxxxx" />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300 sm:col-span-2">
          <XCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300 sm:col-span-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Profile updated.
        </div>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <ActionButton tone="primary" icon={Save}>{isPending ? 'Saving…' : 'Save changes'}</ActionButton>
        <ActionButton tone="ghost" icon={X} onClick={onCancel}>Cancel</ActionButton>
      </div>
    </form>
  );
}

function AvatarUploader({ user, name }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const isImage = user.avatar_url?.startsWith('/api/image/');

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
    } catch { setError('Upload failed.'); }
    finally { setUploading(false); e.target.value = ''; }
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);
    try {
      const result = await removeAvatarAction();
      if (result?.error) setError(result.error);
    } catch { setError('Failed to remove avatar.'); }
    finally { setUploading(false); }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar_url} alt={user.full_name ?? 'Avatar'} className="h-20 w-20 rounded-2xl border border-white/10 object-cover" />
        ) : (
          <Avatar name={name} size="xl" />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-xs font-semibold text-gray-300 transition hover:bg-white/[0.06]">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading} onChange={handleFileChange} />
        </label>
        {isImage && (
          <ActionButton tone="danger" icon={Trash2} onClick={handleRemove} disabled={uploading}>Remove</ActionButton>
        )}
      </div>
      {error && <p className="text-[10.5px] text-rose-400">{error}</p>}
    </div>
  );
}

function InfoRow({ label, value, badge }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10.5px] uppercase tracking-wider text-gray-600">{label}</p>
      <div className="flex items-center gap-2 text-[13.5px] text-gray-200">
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
    <PageShell>
      <AnimatePresence>{showDelete && <DeleteModal onClose={() => setShowDelete(false)} />}</AnimatePresence>

      <PageHeader
        icon={User}
        title="My profile"
        subtitle="Manage your account information and visibility."
        accent="blue"
        actions={
          !editing && (
            <ActionButton tone="ghost" icon={Pencil} onClick={() => setEditing(true)}>Edit profile</ActionButton>
          )
        }
      />

      {/* Hero card */}
      <GlassCard className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl" />
        </div>
        <div className="relative flex flex-wrap items-center gap-5">
          <AvatarUploader user={user} name={name} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-white">{user.full_name || 'Guest user'}</h2>
              <Pill tone="emerald"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> {user.account_status ?? 'active'}</Pill>
              <Pill tone="violet">Guest account</Pill>
            </div>
            <p className="font-mono text-[12.5px] text-gray-500">{user.email} · Joined {formatDate(user.created_at)}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[11.5px] text-gray-500">Profile completeness</span>
              <div className="w-32 flex-1 max-w-[200px]">
                <GradientBar value={completion} max={100} tone="blue" height="h-1.5" />
              </div>
              <span className="font-mono text-[12px] font-bold text-white">{completion}%</span>
            </div>
          </div>
          <div className="text-right">
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-gray-600">Last active</p>
            <p className="text-[12.5px] font-medium text-gray-200">{formatDateTime(user.last_login)}</p>
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
              <div className="mt-5 border-t border-white/[0.06] pt-5">
                <EditInfoForm user={user} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Registered" value={stats.eventsRegistered} accent="blue" delay={0} />
        <StatCard icon={CheckCircle2} label="Attended" value={stats.eventsAttended} accent="emerald" delay={0.05} />
        <StatCard icon={Award} label="Certificates" value={stats.certificates} accent="violet" delay={0.1} />
        <StatCard icon={Bell} label="Notifications" value={stats.notices} accent="amber" delay={0.15} />
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <SectionHeader
            icon={User}
            title="Personal information"
            accent="blue"
            action={
              !editing && (
                <ActionButton tone="ghost" icon={Pencil} onClick={() => setEditing(true)}>Edit</ActionButton>
              )
            }
          />
          <div className="grid gap-4">
            <InfoRow label="Full name" value={user.full_name || '—'} />
            <InfoRow
              label="Email"
              value={user.email}
              badge={
                verified
                  ? <Pill tone="emerald">verified</Pill>
                  : <Pill tone="gray">unverified</Pill>
              }
            />
            <InfoRow label="Phone" value={user.phone || '—'} />
            <InfoRow label="Account role" value="Guest" badge={<Pill tone="amber">Upgrade available</Pill>} />
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader icon={Shield} title="Security" accent="violet" />
          <div className="grid gap-4">
            <InfoRow
              label="Sign-in method"
              value={
                <span className="flex items-center gap-2">
                  <Github className="h-3.5 w-3.5" /> Google OAuth · Managed externally
                </span>
              }
            />
            <InfoRow label="Last login" value={formatDateTime(user.last_login)} />
            <div>
              <p className="mb-1 font-mono text-[10.5px] uppercase tracking-wider text-gray-600">2FA</p>
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12.5px] text-gray-500">
                <Lock className="h-3.5 w-3.5 shrink-0 text-gray-600" />
                <span className="flex-1">Two-factor authentication</span>
                <Pill tone="gray">Members only</Pill>
              </div>
            </div>
            {user.suspension_expires_at && new Date(user.suspension_expires_at) > new Date() && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <div className="text-[12.5px]">
                  <p className="font-semibold text-amber-300">Account suspended</p>
                  <p className="text-amber-400/70">Expires: {formatDateTime(user.suspension_expires_at)}</p>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Upgrade banner */}
      <GlassCard className="border-indigo-500/20 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950/30">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-[14px] font-semibold text-white">Upgrade to full membership</h3>
            <p className="mt-0.5 text-[12px] text-gray-400">Unlock the complete NEUPC experience.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                'Contest participation & rankings',
                'Performance analytics dashboard',
                'Members-only resources & editorials',
                'Achievement badges & certificates',
                'Advanced notification system',
                'Mentor access & guidance',
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[12.5px] text-gray-300">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-400" /> {t}
                </div>
              ))}
            </div>
          </div>
          <ActionButton href="/account/guest/membership-application" tone="indigo" className="shrink-0">Apply now →</ActionButton>
        </div>
      </GlassCard>

      {/* Danger zone */}
      <GlassCard className="border-rose-500/10">
        <SectionHeader icon={LogOut} title="Danger zone" accent="rose" />
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-gray-200">Sign out</p>
              <p className="text-[11.5px] text-gray-500">End your current session.</p>
            </div>
            <form action={signOutAction}>
              <ActionButton tone="ghost" icon={LogOut}>Sign out</ActionButton>
            </form>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-3">
            <div>
              <p className="text-[13px] font-medium text-gray-200">Delete account</p>
              <p className="text-[11.5px] text-gray-500">Permanently remove your account and all associated data.</p>
            </div>
            <ActionButton tone="danger" icon={X} onClick={() => setShowDelete(true)}>Delete</ActionButton>
          </div>
        </div>
      </GlassCard>
    </PageShell>
  );
}
