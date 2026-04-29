/**
 * @file Guest settings client — account preferences panel for
 *   notification settings and account actions.
 * @module GuestSettingsClient
 */

'use client';

import { useState, useEffect, useTransition } from 'react';
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
  PageHead,
  CardHead,
  Stat,
  StatRow,
  Badge,
  Btn,
  Toggle,
  Locked,
  UpgradeBanner,
} from '../../_components/ui';

const NOTIF_KEY = 'neupc_guest_notif_prefs';
const DEFAULT_PREFS = {
  emailNotices: true,
  browserNotices: false,
  eventReminders: true,
  weeklyDigest: false,
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ToggleRow({ label, desc, checked, onChange, disabled, lockedReason }) {
  const inner = (
    <Toggle on={checked} onChange={(v) => !disabled && onChange(v)} disabled={disabled} />
  );
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: disabled ? 'var(--gp-text-3)' : 'var(--gp-text)' }}>
          {label}
          {disabled && (
            <Badge mono style={{ fontSize: 9, marginLeft: 6, padding: '1px 5px' }}>
              MEMBERS
            </Badge>
          )}
        </div>
        {desc && <div style={{ fontSize: 11.5, color: 'var(--gp-text-4)' }}>{desc}</div>}
      </div>
      {disabled && lockedReason ? <Locked feature={lockedReason}>{inner}</Locked> : inner}
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
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2" style={{ marginTop: 12 }}>
      <div>
        <label className="gp-field-label">Full name</label>
        <input className="gp-input" name="full_name" defaultValue={user.full_name ?? ''} required />
      </div>
      <div>
        <label className="gp-field-label">Phone</label>
        <input className="gp-input" name="phone" defaultValue={user.phone ?? ''} placeholder="+880 1xxx xxxxxx" />
      </div>
      <div className="sm:col-span-2">
        <label className="gp-field-label">Avatar URL</label>
        <input className="gp-input" name="avatar_url" defaultValue={user.avatar_url ?? ''} placeholder="https://..." />
      </div>
      {error && (
        <div
          className="sm:col-span-2"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'oklch(0.68 0.18 25 / 0.1)',
            border: '1px solid oklch(0.68 0.18 25 / 0.3)',
            color: 'oklch(0.85 0.16 25)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={isPending} className="gp-btn gp-btn-primary">
          <Save size={13} /> {isPending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="gp-btn">
          <X size={13} /> Cancel
        </button>
      </div>
    </form>
  );
}

export default function GuestSettingsClient({ user }) {
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
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    } catch {}
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  const verified = user.email_verified || user.is_email_verified;

  return (
    <div className="gp-page" style={{ maxWidth: 880 }}>
      <PageHead
        eyebrow="Account"
        title="Settings"
        sub="Manage your account preferences and notifications."
      />

      <StatRow cols={3}>
        <Stat
          icon={Shield}
          label="Account"
          value={<span style={{ fontSize: 18 }}>{user.account_status ?? 'Active'}</span>}
          trend="Guest tier"
        />
        <Stat
          icon={Mail}
          label="Email"
          value={<span style={{ fontSize: 18 }}>{verified ? 'Verified' : 'Unverified'}</span>}
          trend={user.email}
        />
        <Stat
          icon={Clock}
          label="Last login"
          value={<span style={{ fontSize: 18 }}>{formatDate(user.last_login)}</span>}
        />
      </StatRow>

      {/* Personal info */}
      <div className="gp-card" style={{ marginBottom: 16 }}>
        <CardHead
          icon={User}
          title="Personal information"
          action={
            !editing && (
              <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Edit3 size={11} /> Edit
              </Btn>
            )
          }
        />
        <div className="gp-card-body">
          {!editing ? (
            <div className="grid gap-2.5">
              {[
                { label: 'Full name', value: user.full_name || '—' },
                { label: 'Email', value: user.email },
                { label: 'Phone', value: user.phone || '—' },
              ].map((f) => (
                <div className="gp-row-between" key={f.label}>
                  <span style={{ fontSize: 12, color: 'var(--gp-text-3)' }}>{f.label}</span>
                  <span style={{ fontSize: 13 }}>{f.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <EditPersonalForm
              user={user}
              onCancel={() => setEditing(false)}
              onSaved={() => setEditing(false)}
            />
          )}
        </div>
      </div>

      {/* Notification prefs */}
      <div className="gp-card" style={{ marginBottom: 16 }}>
        <CardHead
          icon={Bell}
          title="Notification preferences"
          action={<span className="gp-muted" style={{ fontSize: 11.5 }}>Stored on this device</span>}
        />
        <div className="gp-card-body">
          {prefsSaved && (
            <div
              className="flex items-center gap-2"
              style={{
                marginBottom: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'oklch(0.74 0.14 155 / 0.12)',
                border: '1px solid oklch(0.74 0.14 155 / 0.3)',
                color: 'oklch(0.85 0.14 155)',
                fontSize: 12,
              }}
            >
              <CheckCircle2 size={13} /> Preferences saved
            </div>
          )}
          <div className="divide-y" style={{ borderColor: 'var(--gp-line)' }}>
            <ToggleRow
              label="Email notices"
              desc="Important updates delivered via email"
              checked={prefs.emailNotices}
              onChange={(v) => togglePref('emailNotices', v)}
            />
            <div style={{ borderTop: '1px solid var(--gp-line)' }}>
              <ToggleRow
                label="Browser notifications"
                desc="Push notifications when you're online"
                checked={prefs.browserNotices}
                onChange={(v) => togglePref('browserNotices', v)}
              />
            </div>
            <div style={{ borderTop: '1px solid var(--gp-line)' }}>
              <ToggleRow
                label="Event reminders"
                desc="Reminded 24h before events you're registered for"
                checked={prefs.eventReminders}
                onChange={(v) => togglePref('eventReminders', v)}
              />
            </div>
            <div style={{ borderTop: '1px solid var(--gp-line)' }}>
              <ToggleRow
                label="Weekly digest"
                desc="Summary of all club activity each week"
                checked={prefs.weeklyDigest}
                onChange={(v) => togglePref('weeklyDigest', v)}
              />
            </div>
            <div style={{ borderTop: '1px solid var(--gp-line)' }}>
              <ToggleRow
                label="Personalized recommendations"
                desc="ML-driven event suggestions based on your interests"
                checked={false}
                onChange={() => {}}
                disabled
                lockedReason="Personalized recommendations are member-only."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="gp-card" style={{ marginBottom: 16 }}>
        <CardHead icon={Shield} title="Account security" />
        <div className="gp-card-body">
          <div
            className="flex items-center gap-2.5"
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--gp-surface-2)',
              border: '1px solid var(--gp-line)',
              fontSize: 12.5,
              color: 'var(--gp-text-2)',
            }}
          >
            <Shield size={14} style={{ color: 'oklch(0.85 0.14 155)' }} />
            Account authenticated via Google OAuth. Password management is handled by your Google account.
          </div>
          {user.suspension_expires_at &&
            new Date(user.suspension_expires_at) > new Date() && (
              <div
                className="flex items-start gap-3"
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'oklch(0.78 0.13 75 / 0.1)',
                  border: '1px solid oklch(0.78 0.13 75 / 0.3)',
                }}
              >
                <Clock size={14} style={{ color: 'oklch(0.85 0.13 75)', marginTop: 2 }} />
                <div style={{ fontSize: 12.5 }}>
                  <div style={{ fontWeight: 600, color: 'oklch(0.85 0.13 75)' }}>Account suspended</div>
                  <div style={{ color: 'var(--gp-text-3)' }}>Expires: {formatDate(user.suspension_expires_at)}</div>
                  {user.suspension_reason && (
                    <div style={{ color: 'var(--gp-text-4)', marginTop: 2 }}>Reason: {user.suspension_reason}</div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <UpgradeBanner
          icon={Sparkles}
          title="Ready to upgrade?"
          desc="Apply for full club membership today."
          ctaLabel="Apply now"
        />
      </div>

      {/* Danger zone */}
      <div className="gp-card">
        <CardHead
          title={
            <span style={{ color: 'oklch(0.85 0.16 25)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} /> Danger zone
            </span>
          }
        />
        <div className="gp-card-body">
          <div className="gp-row-between">
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Sign out</div>
              <div style={{ fontSize: 11.5, color: 'var(--gp-text-3)' }}>End your current session.</div>
            </div>
            <form action={signOutAction}>
              <button type="submit" className="gp-btn gp-btn-danger">
                <LogOut size={12} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
