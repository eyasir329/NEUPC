/**
 * @file Advisor profile client component
 * @module AdvisorProfileClient
 */

'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  LogOut,
  Sparkles,
  Lock,
  Clock,
} from 'lucide-react';
import { signOutAction } from '@/app/_lib/actions/actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
  Avatar,
  Pill,
  ActionButton,
} from '@/app/account/_components/ui';

export default function AdvisorProfileClient({ user }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    setSigningOut(true);
    const fd = new FormData();
    await signOutAction(fd);
  };

  const active = user.account_status === 'active';
  const profileName = user.full_name || 'Faculty Advisor';

  return (
    <PageShell>
      {/* Page Header */}
      <PageHeader
        icon={User}
        title="Profile"
        subtitle="Manage your advisor profile, check account security settings, and end active sessions."
        accent="indigo"
      />

      {/* Frosted Faculty Identity Badge */}
      <GlassCard className="relative overflow-hidden bg-linear-to-br from-indigo-950/20 via-gray-900/40 to-transparent select-none">
        <div className="absolute top-0 right-0 -z-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-5 sm:text-left">
          <Avatar name={profileName} size="xl" src={user.avatar_url} />
          <div className="flex-1">
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <span className="font-mono text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                Faculty Administration
              </span>
              <h2 className="text-2xl leading-tight font-black text-white">
                {profileName}
              </h2>
              <p className="mt-0.5 font-mono text-xs text-gray-500">
                {user.email}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Pill tone="indigo" icon={Shield}>
                Faculty Advisor
              </Pill>
              <Pill tone={active ? 'emerald' : 'amber'} icon={Sparkles}>
                {user.account_status}
              </Pill>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Personal Information Deck */}
      <GlassCard padding="p-6">
        <SectionHeader
          icon={User}
          title="Administrative Profile"
          subtitle="Identity credentials compiled from the official campus directory."
          accent="blue"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoField
            icon={User}
            label="Full Name"
            value={user.full_name || 'Not provided'}
            locked
          />
          <InfoField
            icon={Mail}
            label="Email Address"
            value={user.email}
            locked
          />
          <InfoField
            icon={Phone}
            label="Contact Number"
            value={user.phone || 'Not provided'}
            locked
          />
          <InfoField
            icon={Calendar}
            label="Member Registration"
            value={new Date(user.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            locked
          />
        </div>
      </GlassCard>

      {/* Account Security integrity logs */}
      <GlassCard padding="p-6">
        <SectionHeader
          icon={Shield}
          title="Account Security & Access"
          subtitle="Authentication channels and integrity logs."
          accent="emerald"
        />
        <ul className="mt-4 space-y-1 font-mono text-[11px] text-gray-400">
          <SecurityRow label="Access Protocol" value="Google OAuth 2.0" />
          {user.last_login && (
            <SecurityRow
              label="Last Verified Login"
              value={new Date(user.last_login).toLocaleString()}
            />
          )}
          <SecurityRow
            label="Account Integrity status"
            value={user.account_status}
            tone={active ? 'emerald' : 'amber'}
          />
        </ul>
      </GlassCard>

      {/* Session Redirection Card */}
      <GlassCard
        padding="p-6"
        className="border-rose-500/10 bg-linear-to-br from-rose-950/5 via-gray-900/40 to-transparent"
      >
        <SectionHeader
          icon={LogOut}
          title="Sign Out Session"
          subtitle="Safely close your current session. All modifications will remain saved."
          accent="rose"
        />
        <div className="mt-4">
          <ActionButton
            tone="danger"
            icon={LogOut}
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out...' : 'Sign Out Session'}
          </ActionButton>
        </div>
      </GlassCard>
    </PageShell>
  );
}

// ── Info Field Subcomponent ────────────────────────────────────────────────
function InfoField({ icon: Icon, label, value, locked }) {
  return (
    <div className="group">
      <label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase select-none">
        <Icon className="h-3.5 w-3.5 text-gray-600" />
        {label}
        {locked && (
          <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] font-bold tracking-normal text-gray-600 normal-case">
            <Lock className="h-2.5 w-2.5" /> (read-only)
          </span>
        )}
      </label>
      <div className="truncate rounded-xl border border-white/6 bg-white/2 px-4 py-2.5 text-xs font-semibold text-gray-200">
        {value}
      </div>
    </div>
  );
}

// ── Security Row Subcomponent ──────────────────────────────────────────────
const TONE_TEXT = {
  emerald: 'text-emerald-400 font-bold',
  amber: 'text-amber-400 font-bold',
  rose: 'text-rose-400 font-bold',
  gray: 'text-white font-semibold',
};

function SecurityRow({ label, value, tone = 'gray' }) {
  return (
    <li className="flex items-center justify-between border-b border-white/6 py-3 select-none last:border-0">
      <span className="flex items-center gap-1.5 text-gray-500">
        <Clock className="h-3.5 w-3.5 text-gray-600" />
        {label}
      </span>
      <span className={`text-xs ${TONE_TEXT[tone]}`}>{value}</span>
    </li>
  );
}
