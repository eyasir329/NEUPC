/**
 * @file Executive settings client component
 * @module ExecutiveSettingsClient
 */

'use client';

import { useState } from 'react';
import { Settings, Bell, Save, User } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
} from '@/app/account/_components/ui';
import toast from 'react-hot-toast';
import { execSaveNotificationPrefsAction } from '@/app/_lib/actions/executive-actions';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 ${
        checked
          ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
          : 'bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

const DEFAULT_PREFS = {
  event_registrations: true,
  membership_applications: true,
  budget_requests: true,
  system_alerts: false,
};

export default function ExecutiveSettingsClient({ user }) {
  const [savingNotif, setSavingNotif] = useState(false);

  const [notifSettings, setNotifSettings] = useState({
    ...DEFAULT_PREFS,
    ...(user?.notification_prefs || {}),
  });

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSavingNotif(true);
    const res = await execSaveNotificationPrefsAction(notifSettings);
    if (res?.error) toast.error(res.error);
    else toast.success('Notification preferences saved.');
    setSavingNotif(false);
  };

  const active = user?.account_status === 'active';

  return (
    <PageShell>
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Manage your executive account details and notification preferences."
        accent="indigo"
      />

      {/* Account Info Cards */}
      <GlassCard padding="p-6">
        <SectionHeader
          icon={User}
          title="Executive Credentials"
          subtitle="Administrative identity fields synchronized with the active committee registry."
          accent="indigo"
        />
        <div className="mt-4 space-y-3">
          {[
            {
              label: 'Full Name',
              value: user?.full_name || 'Executive Officer',
            },
            { label: 'Official Email', value: user?.email, note: 'read-only' },
            {
              label: 'Account Integrity',
              value: user?.account_status,
              badge: active
                ? { text: 'Active', tone: 'emerald' }
                : { text: 'Inactive', tone: 'rose' },
            },
          ].map(({ label, value, note, badge }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-white/6 bg-white/2 px-4 py-3.5"
            >
              <div>
                <p className="font-mono text-xs font-bold tracking-wider text-gray-500 uppercase select-none">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
              {note && (
                <span className="font-mono text-[10px] font-bold tracking-wide text-gray-600 uppercase select-none">
                  {note}
                </span>
              )}
              {badge && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                    badge.tone === 'emerald'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {badge.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Notifications Preferences Form */}
      <GlassCard padding="p-6">
        <SectionHeader
          icon={Bell}
          title="Operational Subscriptions"
          subtitle="Subscribe to specific events and real-time triggers across club sections."
          accent="indigo"
        />
        <form onSubmit={handleSaveNotifications} className="mt-4 space-y-4">
          {[
            {
              key: 'event_registrations',
              label: 'Event Registrations',
              desc: 'Get notified when members register for workshops or contests.',
            },
            {
              key: 'membership_applications',
              label: 'Membership Filings',
              desc: 'Receive alerts when new candidate guest registrations are submitted.',
            },
            {
              key: 'budget_requests',
              label: 'Financial Postings',
              desc: 'Notify when new event budgets or invoices require review.',
            },
            {
              key: 'system_alerts',
              label: 'System Analytics Alerts',
              desc: 'Receive weekly consolidated reports on platform diagnostics and growth.',
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/2 px-4 py-3.5 transition-all hover:border-white/10 hover:bg-white/4"
            >
              <div>
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
              </div>
              <Toggle
                checked={notifSettings[key]}
                onChange={(val) =>
                  setNotifSettings({ ...notifSettings, [key]: val })
                }
              />
            </div>
          ))}
          <div className="pt-3">
            <button
              type="submit"
              disabled={savingNotif}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-all select-none hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingNotif
                ? 'Saving modifications...'
                : 'Save Settings Preferences'}
            </button>
          </div>
        </form>
      </GlassCard>
    </PageShell>
  );
}
