/**
 * @file Mentor settings client component
 * @module MentorSettingsClient
 */

'use client';

import { useState } from 'react';
import { Settings, Bell, Save } from 'lucide-react';
import { saveMentorNotificationPrefsAction } from '@/app/_lib/actions/mentor-actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
} from '@/app/account/_components/ui';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-white/20'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function MentorSettingsClient({ user }) {
  const [message, setMessage] = useState(null);
  const [savingNotif, setSavingNotif] = useState(false);

  const [notifSettings, setNotifSettings] = useState({
    session_reminders: true,
    task_submissions: true,
    mentee_updates: true,
    weekly_digest: false,
    ...(user?.notification_prefs || {}),
  });

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSavingNotif(true);
    setMessage(null);
    const res = await saveMentorNotificationPrefsAction(notifSettings);
    setMessage(
      res?.error
        ? { type: 'error', text: res.error }
        : { type: 'success', text: 'Notification preferences saved.' }
    );
    setSavingNotif(false);
  };

  return (
    <PageShell>
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Configure your mentor account preferences"
        accent="emerald"
      />

      {message && (
        <div
          className={`rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}
        >
          {message.text}
        </div>
      )}

      {/* Account Info */}
      <GlassCard padding="p-6">
        <SectionHeader icon={Settings} title="Account" accent="blue" />
        <div className="space-y-3">
          {[
            { label: 'Full Name', value: user?.full_name },
            { label: 'Email Address', value: user?.email, note: 'Read only' },
            {
              label: 'Account Status',
              value: user?.account_status,
              badge:
                user?.account_status === 'active'
                  ? { text: 'Active', tone: 'emerald' }
                  : { text: user?.account_status || 'Inactive', tone: 'rose' },
            },
          ].map(({ label, value, note, badge }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-white/6 bg-white/2 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-300">{label}</p>
                <p className="text-xs text-gray-500">{value}</p>
              </div>
              {note && <span className="text-xs text-gray-500">{note}</span>}
              {badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${badge.tone === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
                >
                  {badge.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard padding="p-6">
        <SectionHeader icon={Bell} title="Notifications" accent="violet" />
        <form onSubmit={handleSaveNotifications} className="space-y-3">
          {[
            {
              key: 'session_reminders',
              label: 'Session Reminders',
              desc: 'Get reminded before scheduled sessions',
            },
            {
              key: 'task_submissions',
              label: 'Task Submissions',
              desc: 'Notify when a mentee submits a task',
            },
            {
              key: 'mentee_updates',
              label: 'Mentee Updates',
              desc: 'Activity updates from your mentees',
            },
            {
              key: 'weekly_digest',
              label: 'Weekly Digest',
              desc: 'Weekly summary of mentorship activity',
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-white/6 bg-white/2 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-300">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <Toggle
                checked={notifSettings[key]}
                onChange={(val) =>
                  setNotifSettings({ ...notifSettings, [key]: val })
                }
              />
            </div>
          ))}
          <div className="pt-2">
            <button
              type="submit"
              disabled={savingNotif}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingNotif ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </GlassCard>
    </PageShell>
  );
}
