/**
 * @file Account welcome header with user greeting.
 * @module AccountHeader
 */

'use client';

import {
  Calendar,
  Shield,
  ShieldCheck,
  LayoutDashboard,
  Mail,
  Award
} from 'lucide-react';

/** @param {{ session: Object, accountStatus: string, user: Object, userRoles: string[] }} props */
export default function AccountHeader({ session, accountStatus, user, userRoles = [] }) {
  const name = session?.name || 'Guest User';
  const email = session?.email || 'guest@example.com';
  const isNew = accountStatus === 'pending';
  const isActive = accountStatus === 'active';

  const statusLabel =
    {
      active: 'Account Active',
      pending: 'Awaiting Approval',
      rejected: 'Access Denied',
      suspended: 'Suspended',
      banned: 'Restricted',
      locked: 'Locked',
      inactive: 'Inactive',
    }[accountStatus] ?? 'Unknown';

  const statusColor = isActive
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
    : 'border-amber-500/25 bg-amber-500/10 text-amber-300';

  const dotColor = isActive ? 'bg-emerald-400' : 'bg-amber-400';

  // Format joined date
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  // Capitalize primary role nicely
  const highestRole = userRoles?.[0]
    ? userRoles[0].charAt(0).toUpperCase() + userRoles[0].slice(1)
    : 'Guest';

  const dashboardsCount = `${userRoles?.length || 0} ${userRoles?.length === 1 ? 'Portal' : 'Portals'}`;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Outer Card Wrapper (Premium Glassmorphic Panel) */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c1020]/50 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 md:p-10">
        {/* Subtle Ambient Glowing Background inside card */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px] select-none" />
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-500/5 blur-[100px] select-none" />

        <div className="relative z-10 text-center">
          {/* Eyebrow badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-5 py-1.5 text-xs font-semibold backdrop-blur-sm">
            <span className="text-lg">{isNew ? '🎉' : '👋'}</span>
            <span className="text-indigo-300 tracking-wide">
              {isNew ? 'Welcome to NEUPC' : 'Welcome Back'}
            </span>
          </div>

          {/* Gradient title */}
          <h1 className="mb-3 bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl md:text-5xl">
            {name}
          </h1>

          {/* Email with Icon */}
          <div className="mb-6 flex items-center justify-center gap-2 text-gray-400">
            <Mail className="h-4 w-4 text-indigo-400/85" />
            <span className="text-sm font-medium tracking-wide sm:text-base">{email}</span>
          </div>

          {/* Status pill */}
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 ${statusColor}`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotColor}`}
              />
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`}
              />
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
              {statusLabel}
            </span>
          </div>

          {/* Premium Thin Divider Line */}
          <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Card 1: Member Since */}
            <div className="group rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.04]">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/15">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Member Since
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {joinedDate}
              </p>
            </div>

            {/* Card 2: Account Level */}
            <div className="group rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.04]">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/15">
                <Award className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Account Level
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {highestRole}
              </p>
            </div>

            {/* Card 3: Security */}
            <div className="group rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.04]">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Security
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                Verified
              </p>
            </div>

            {/* Card 4: Access Portals */}
            <div className="group rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.04]">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/15">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Access Portals
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {dashboardsCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

