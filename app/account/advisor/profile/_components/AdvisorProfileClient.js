'use client';

import { User, Mail, Phone, Shield, Calendar, LogOut } from 'lucide-react';
import { signOutAction } from '@/app/_lib/actions';

export default function AdvisorProfileClient({ user }) {
  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      const formData = new FormData();
      await signOutAction(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="mt-1 text-gray-400">Advisor account details</p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/20 to-purple-600/20 p-8 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-4xl font-semibold text-white">
            {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white">
              {user.full_name || 'Advisor'}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-medium text-white">
                Advisor
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  user.account_status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {user.account_status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="mb-6 text-xl font-semibold text-white">
          Personal Information
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
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
      </div>

      {/* Security Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
          <Shield className="h-5 w-5 text-blue-400" />
          Security
        </h2>
        <div className="space-y-4">
          <SecurityRow label="Authentication" value="Google OAuth" />
          {user.last_login && (
            <SecurityRow
              label="Last Login"
              value={new Date(user.last_login).toLocaleString()}
            />
          )}
          <SecurityRow
            label="Account Status"
            value={user.account_status}
            statusColor={user.account_status === 'active' ? 'green' : 'amber'}
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-red-400">Actions</h2>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/20 px-6 py-3 font-medium text-red-400 transition-colors hover:bg-red-500/30"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function InfoField({ icon: Icon, label, value, locked }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
        <Icon className="h-4 w-4" />
        {label}
        {locked && <span className="text-xs text-gray-500">(locked)</span>}
      </label>
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white">
        {value}
      </div>
    </div>
  );
}

function SecurityRow({ label, value, statusColor }) {
  const colorClasses = {
    green: 'text-green-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div className="flex items-center justify-between border-b border-white/10 py-3 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span
        className={`font-medium ${statusColor ? colorClasses[statusColor] : 'text-white'}`}
      >
        {value}
      </span>
    </div>
  );
}
