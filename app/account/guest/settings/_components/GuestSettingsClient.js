'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  LogOut,
  Save,
  X,
  Edit3,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Clock,
  Mail,
} from 'lucide-react';
import { updateGuestInfoAction } from '@/app/_lib/guest-actions';
import { signOutAction } from '@/app/_lib/actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
  TabBar,
  Pill,
  ActionButton,
} from '../../_components/_ui';

const NOTIF_KEY = 'neupc_guest_notif_prefs';
const DEFAULT_PREFS = {
  emailNotices: true,
  browserNotices: false,
  eventReminders: true,
  weeklyDigest: false,
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full border transition-all ${
        on ? 'border-indigo-500/40 bg-indigo-500/30' : 'border-white/[0.08] bg-white/[0.04]'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full border transition-all ${
        on ? 'left-4 border-indigo-400/50 bg-indigo-400' : 'left-0.5 border-white/20 bg-white/30'
      }`} />
    </button>
  );
}

function ToggleRow({ label, desc, checked, onChange, disabled, memberOnly }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-[13px] font-medium ${disabled ? 'text-gray-500' : 'text-gray-200'}`}>{label}</p>
          {memberOnly && <Pill tone="gray">Members only</Pill>}
        </div>
        {desc && <p className="mt-0.5 text-[11.5px] text-gray-600">{desc}</p>}
      </div>
      <Toggle on={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function EditPersonalForm({ user, onCancel, onSaved }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateGuestInfoAction(fd);
      if (result?.error) setError(result.error);
      else onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-500">Full name</label>
        <input className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-white/[0.16]" name="full_name" defaultValue={user.full_name ?? ''} required />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-500">Phone</label>
        <input className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-white/[0.16]" name="phone" defaultValue={user.phone ?? ''} placeholder="+880 1xxx xxxxxx" />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300 sm:col-span-2">
          <X className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <ActionButton tone="primary" icon={Save}>{isPending ? 'Saving…' : 'Save'}</ActionButton>
        <ActionButton tone="ghost" icon={X} onClick={onCancel}>Cancel</ActionButton>
      </div>
    </form>
  );
}

const TABS = [
  { value: 'account', label: 'Account', icon: User },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'security', label: 'Security', icon: Shield },
];

export default function GuestSettingsClient({ user }) {
  const [tab, setTab] = useState('account');
  const [editing, setEditing] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  function togglePref(key, val) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)); } catch {}
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  const verified = user.email_verified || user.is_email_verified;

  return (
    <PageShell>
      <PageHeader
        icon={User}
        title="Settings"
        subtitle="Manage your account preferences and notifications."
        accent="blue"
      />

      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      <AnimatePresence mode="popLayout">
        {tab === 'account' && (
          <motion.div key="account" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
            <GlassCard>
              <SectionHeader
                icon={User}
                title="Personal information"
                accent="blue"
                action={
                  !editing && (
                    <ActionButton tone="ghost" icon={Edit3} onClick={() => setEditing(true)}>Edit</ActionButton>
                  )
                }
              />
              <div className="grid gap-2.5">
                {[
                  { label: 'Full name', value: user.full_name || '—' },
                  { label: 'Email', value: user.email, badge: verified ? <Pill tone="emerald">verified</Pill> : <Pill tone="gray">unverified</Pill> },
                  { label: 'Phone', value: user.phone || '—' },
                  { label: 'Role', value: 'Guest', badge: <Pill tone="violet">Guest account</Pill> },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between gap-4 py-1">
                    <span className="text-[12px] text-gray-500">{f.label}</span>
                    <div className="flex items-center gap-2 text-[13px] text-gray-200">
                      {f.value}
                      {f.badge}
                    </div>
                  </div>
                ))}
              </div>
              <AnimatePresence>
                {editing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <EditPersonalForm user={user} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Upgrade banner */}
            <GlassCard className="border-indigo-500/20 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950/30">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-white">Ready to upgrade?</h3>
                  <p className="mt-0.5 text-[12.5px] text-gray-400">Apply for full club membership today.</p>
                </div>
                <ActionButton href="/account/guest/membership-application" tone="indigo" className="shrink-0">Apply now</ActionButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {tab === 'notifications' && (
          <motion.div key="notifications" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <GlassCard>
              <SectionHeader
                icon={Bell}
                title="Notification preferences"
                accent="violet"
                action={<span className="text-[11.5px] text-gray-600">Stored on this device</span>}
              />
              <AnimatePresence>
                {prefsSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Preferences saved
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="divide-y divide-white/[0.04]">
                <ToggleRow label="Email notices" desc="Important updates delivered via email" checked={prefs.emailNotices} onChange={(v) => togglePref('emailNotices', v)} />
                <ToggleRow label="Browser notifications" desc="Push notifications when you're online" checked={prefs.browserNotices} onChange={(v) => togglePref('browserNotices', v)} />
                <ToggleRow label="Event reminders" desc="Reminded 24h before events you're registered for" checked={prefs.eventReminders} onChange={(v) => togglePref('eventReminders', v)} />
                <ToggleRow label="Weekly digest" desc="Summary of all club activity each week" checked={prefs.weeklyDigest} onChange={(v) => togglePref('weeklyDigest', v)} />
                <ToggleRow label="Personalized recommendations" desc="ML-driven event suggestions based on your interests" checked={false} onChange={() => {}} disabled memberOnly />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
            <GlassCard>
              <SectionHeader icon={Shield} title="Account security" accent="emerald" />
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[12.5px] text-gray-400 flex items-center gap-2.5">
                <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
                Account authenticated via Google OAuth. Password management is handled by your Google account.
              </div>
              {user.suspension_expires_at && new Date(user.suspension_expires_at) > new Date() && (
                <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div className="text-[12.5px]">
                    <p className="font-semibold text-amber-300">Account suspended</p>
                    <p className="text-amber-400/70">Expires: {formatDate(user.suspension_expires_at)}</p>
                    {user.suspension_reason && <p className="mt-0.5 text-amber-400/50">Reason: {user.suspension_reason}</p>}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Danger zone */}
            <GlassCard className="border-rose-500/10">
              <SectionHeader icon={AlertTriangle} title="Danger zone" accent="rose" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-gray-200">Sign out</p>
                  <p className="text-[11.5px] text-gray-500">End your current session.</p>
                </div>
                <form action={signOutAction}>
                  <ActionButton tone="danger" icon={LogOut}>Sign out</ActionButton>
                </form>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
