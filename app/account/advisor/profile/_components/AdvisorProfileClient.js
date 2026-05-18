/**
 * @file Advisor profile client — read-only profile view with sections
 *   for identity, security, and a sign-out action. Mirrors the member
 *   profile's design language using shared primitives.
 *
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
} from 'lucide-react';
import { signOutAction } from '@/app/_lib/actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
  Avatar,
  Pill,
  ActionButton,
} from '../../../_components/ui/dashboard';

export default function AdvisorProfileClient({ user }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    setSigningOut(true);
    const fd = new FormData();
    await signOutAction(fd);
  };

  const active = user.account_status === 'active';

  return (
    <PageShell>
      <PageHeader
        icon={User}
        title="My Profile"
        subtitle="Advisor account details"
        accent="indigo"
      />

      <GlassCard className="bg-linear-to-br from-gray-900 via-gray-900 to-indigo-950/30">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar name={user.full_name ?? user.email ?? '?'} size="xl" />
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-white">
              {user.full_name || 'Advisor'}
            </h2>
            <p className="mt-0.5 text-sm text-gray-400">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
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

      <GlassCard>
        <SectionHeader
          icon={User}
          title="Personal Information"
          subtitle="From your authentication provider"
          accent="blue"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoField
            icon={User}
            label="Full Name"
            value={user.full_name || 'Not set'}
          />
          <InfoField icon={Mail} label="Email" value={user.email} locked />
          <InfoField
            icon={Phone}
            label="Phone"
            value={user.phone || 'Not set'}
          />
          <InfoField
            icon={Calendar}
            label="Member Since"
            value={new Date(user.created_at).toLocaleDateString()}
            locked
          />
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={Shield}
          title="Security"
          subtitle="Authentication and account state"
          accent="emerald"
        />
        <ul className="space-y-1">
          <SecurityRow label="Authentication" value="Google OAuth" />
          {user.last_login && (
            <SecurityRow
              label="Last login"
              value={new Date(user.last_login).toLocaleString()}
            />
          )}
          <SecurityRow
            label="Account status"
            value={user.account_status}
            tone={active ? 'emerald' : 'amber'}
          />
        </ul>
      </GlassCard>

      <GlassCard className="border-rose-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-rose-950/20">
        <SectionHeader
          icon={LogOut}
          title="Sign out"
          subtitle="End the current session on this device"
          accent="rose"
        />
        <ActionButton
          tone="danger"
          icon={LogOut}
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </ActionButton>
      </GlassCard>
    </PageShell>
  );
}

function InfoField({ icon: Icon, label, value, locked }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-gray-500 uppercase">
        <Icon className="h-3 w-3" />
        {label}
        {locked && (
          <span className="text-[10px] tracking-normal text-gray-600 normal-case">
            (locked)
          </span>
        )}
      </label>
      <div className="truncate rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white">
        {value}
      </div>
    </div>
  );
}

const TONE_TEXT = {
  emerald: 'text-emerald-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  gray: 'text-gray-200',
};

function SecurityRow({ label, value, tone = 'gray' }) {
  return (
    <li className="flex items-center justify-between border-b border-white/[0.06] py-2.5 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${TONE_TEXT[tone]}`}>
        {value}
      </span>
    </li>
  );
}
