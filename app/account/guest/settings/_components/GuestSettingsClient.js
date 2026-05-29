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
} from '@/app/account/_components/ui';

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
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-300 ${
        on ? 'border-indigo-500/30 bg-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.25)]' : 'border-white/10 bg-zinc-950/40 shadow-inner'
      } ${disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 h-4.5 w-4.5 rounded-full border transition-colors duration-200 ${
          on ? 'right-0.5 border-indigo-400/50 bg-indigo-400' : 'left-0.5 border-white/20 bg-zinc-600'
        }`}
        style={on ? { right: 2 } : { left: 2 }}
      />
    </button>
  );
}

function ToggleRow({ label, desc, checked, onChange, disabled, memberOnly }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4.5 first:pt-2 last:pb-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <p className={`text-[13px] font-bold ${disabled ? 'text-zinc-500' : 'text-zinc-200'}`}>{label}</p>
          {memberOnly && <Pill tone="gray" className="text-[9px] font-black uppercase tracking-wider">Members only</Pill>}
        </div>
        {desc && <p className="mt-1 text-xs text-zinc-500 font-semibold leading-normal">{desc}</p>}
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

  const inputCls = "w-full rounded-xl border border-white/10 bg-zinc-950/45 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-blue-500/50 focus:bg-zinc-950/70 focus:shadow-[0_0_8px_rgba(59,130,246,0.15)] shadow-inner";

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-zinc-500">Full Name</label>
        <input className={inputCls} name="full_name" defaultValue={user.full_name ?? ''} required />
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-zinc-500">Phone</label>
        <input className={inputCls} name="phone" defaultValue={user.phone ?? ''} placeholder="+880 1xxx xxxxxx" />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs font-bold text-rose-300 sm:col-span-2 shadow-md">
          <X className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      <div className="flex gap-2 sm:col-span-2 mt-2">
        <ActionButton type="submit" tone="primary" icon={Save} className="px-4 py-2">{isPending ? 'Saving…' : 'Save Details'}</ActionButton>
        <ActionButton tone="ghost" icon={X} onClick={onCancel} className="px-4 py-2">Cancel</ActionButton>
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
    <PageShell className="text-zinc-300 selection:bg-blue-500/30 space-y-6">
      <PageHeader
        icon={User}
        title="Settings"
        subtitle="Manage your guest dashboard preferences and system notifications."
        accent="blue"
      />

      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      <AnimatePresence mode="popLayout" initial={false}>
        {tab === 'account' && (
          <motion.div
            key="account"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <GlassCard className="border border-white/10 bg-zinc-900/50 backdrop-blur-xl p-5 shadow-xl">
              <SectionHeader
                icon={User}
                title="Personal Details"
                accent="blue"
                action={
                  !editing && (
                    <ActionButton tone="ghost" icon={Edit3} className="px-3 py-1.5" onClick={() => setEditing(true)}>Edit</ActionButton>
                  )
                }
              />
              <div className="flex flex-col mt-2 divide-y divide-white/5">
                {[
                  { label: 'Full Name', value: user.full_name || '—' },
                  { label: 'Email Address', value: user.email, badge: verified ? <Pill tone="emerald" className="text-[9px] font-black uppercase tracking-wider">verified</Pill> : <Pill tone="rose" className="text-[9px] font-black uppercase tracking-wider">unverified</Pill> },
                  { label: 'Phone Number', value: user.phone || '—' },
                  { label: 'Account Role', value: 'Guest Level', badge: <Pill tone="violet" className="text-[9px] font-black uppercase tracking-wider">Guest Account</Pill> },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1">
                    <span className="text-xs font-semibold text-zinc-500">{f.label}</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
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

            {/* Premium Promotion callout */}
            <GlassCard className="border border-indigo-500/20 bg-gradient-to-br from-zinc-950 via-zinc-900/60 to-indigo-950/20 relative overflow-hidden shadow-xl p-5">
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />
              </div>
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-inner animate-pulse">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Ready to Upgrade?</h3>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                    Submit your application to become a full NEUPC club member.
                  </p>
                </div>
                <ActionButton href="/account/guest/membership-application" tone="indigo" className="shrink-0 font-bold px-4 py-2">
                  Apply Now
                </ActionButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {tab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <GlassCard className="border border-white/10 bg-zinc-900/50 backdrop-blur-xl p-5 shadow-xl">
              <SectionHeader
                icon={Bell}
                title="Notification Rules"
                accent="violet"
                action={<span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">Stored Locally</span>}
              />
              
              <AnimatePresence>
                {prefsSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-bold text-emerald-300 shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4" /> System preferences logged successfully.
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="divide-y divide-white/5 mt-2">
                <ToggleRow label="Email Broadcasts" desc="Receive general newsletter updates via verified email logs" checked={prefs.emailNotices} onChange={(v) => togglePref('emailNotices', v)} />
                <ToggleRow label="Browser Triggers" desc="Pop system push notices when new events are published" checked={prefs.browserNotices} onChange={(v) => togglePref('browserNotices', v)} />
                <ToggleRow label="Event Check-in Reminders" desc="Receive countdown triggers 24h prior to registered bootcamp workshops" checked={prefs.eventReminders} onChange={(v) => togglePref('eventReminders', v)} />
                <ToggleRow label="Weekly Digests" desc="Aggregate summaries of all club activities and programming contests" checked={prefs.weeklyDigest} onChange={(v) => togglePref('weeklyDigest', v)} />
                <ToggleRow label="AI Event Recommendations" desc="Context-based event suggestions curated specifically to your department skills" checked={false} onChange={() => {}} disabled memberOnly />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <GlassCard className="border border-white/10 bg-zinc-900/50 backdrop-blur-xl p-5 shadow-xl">
              <SectionHeader icon={Shield} title="Account Security" accent="emerald" />
              
              <div className="rounded-xl border border-white/5 bg-zinc-950/45 px-4 py-3.5 text-xs font-semibold leading-relaxed text-zinc-500 shadow-inner flex items-center gap-3">
                <Shield className="h-5 w-5 shrink-0 text-emerald-400" />
                This guest account is securely authenticated using Google OAuth. Profile fields are synced directly from Google accounts.
              </div>
              
              {user.suspension_expires_at && new Date(user.suspension_expires_at) > new Date() && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-md">
                  <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-400 animate-pulse" />
                  <div className="text-xs font-bold leading-normal">
                    <p className="text-amber-300">Account status under suspension</p>
                    <p className="text-amber-400/60 mt-0.5">Expires: {formatDate(user.suspension_expires_at)}</p>
                    {user.suspension_reason && <p className="mt-1 text-zinc-500 font-semibold">Details: {user.suspension_reason}</p>}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Sign Out Card */}
            <GlassCard className="border border-rose-500/10 bg-zinc-950/20 p-5 shadow-xl">
              <SectionHeader icon={AlertTriangle} title="Terminate Session" accent="rose" />
              <div className="flex items-center justify-between gap-4 mt-2">
                <div>
                  <p className="text-xs font-bold text-zinc-200">Sign Out</p>
                  <p className="text-[11px] text-zinc-500 font-semibold leading-normal mt-0.5">Terminate your current dashboard browser credentials.</p>
                </div>
                <form action={signOutAction}>
                  <ActionButton type="submit" tone="danger" icon={LogOut} className="px-4 py-2">Sign Out</ActionButton>
                </form>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
