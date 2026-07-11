/**
 * @file Advisor settings client component
 * @module AdvisorSettingsClient
 */

'use client';

import { useState } from 'react';
import { Settings, Bell, Save, Shield, User, Sparkles } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
  Pill,
} from '@/app/account/_components/ui';
import toast from 'react-hot-toast';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 ${
        checked
          ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
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

export default function AdvisorSettingsClient({ user }) {
  const [savingNotif, setSavingNotif] = useState(false);

  const [notifSettings, setNotifSettings] = useState({
    pending_verifications: true,
    budget_approvals: true,
    committee_changes: false,
    monthly_reports: true,
  });

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSavingNotif(true);
    // Simulate backend save
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Advisor settings preferences saved successfully.');
    setSavingNotif(false);
  };

  const active = user?.account_status === 'active';

  return (
    <PageShell>
      <PageHeader
        icon={Settings}
        title="Oversight Preferences"
        subtitle="Manage your advisor permissions, system notification routing, and governance preferences."
        accent="amber"
      />

      {/* Account Info Cards */}
      <GlassCard padding="p-6">
        <SectionHeader
          icon={User}
          title="Faculty Credentials"
          subtitle="Administrative identity fields synchronized with the active university directory."
          accent="amber"
        />
        <div className="mt-4 space-y-3">
          {[
            { label: 'Full Name', value: user?.full_name || 'Faculty Advisor' },
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
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-black tracking-widest uppercase ${
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
          title="Governance Alerts & Summaries"
          subtitle="Subscribe to critical triggers requiring faculty review or operational records."
          accent="amber"
        />
        <form onSubmit={handleSaveNotifications} className="mt-4 space-y-4">
          {[
            {
              key: 'pending_verifications',
              label: 'Membership Verifications',
              desc: 'Get notified when new member profiles require advisor academic verification.',
            },
            {
              key: 'budget_approvals',
              label: 'Financial Approvals',
              desc: 'Receive alerts when transactions or budgets exceed committee limits and require your sign-off.',
            },
            {
              key: 'committee_changes',
              label: 'Executive Board Shifts',
              desc: 'Notify when executive assignments or committee roles are modified.',
            },
            {
              key: 'monthly_reports',
              label: 'Monthly consolidated Ledger',
              desc: 'Receive monthly summaries detailing club performance, attendance rates, and budget balance sheets.',
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
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white transition-all select-none hover:bg-amber-700 active:scale-95 disabled:opacity-50"
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
