/**
 * @file Account welcome header — unified profile card with embedded avatar.
 * Shows avatar, name, email, status pill, and metadata chips as a single
 * cohesive glassmorphic panel.
 *
 * @module AccountHeader
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  Calendar,
  ShieldCheck,
  LayoutDashboard,
  Mail,
  Award,
} from 'lucide-react';
import { cn } from '@/app/_lib/utils/utils';
import {
  getInitials,
  getFallbackAvatarUrl,
  driveImageUrl,
} from '@/app/_lib/utils/utils';

// ── Inline Avatar (embedded inside card, no separate component needed) ──────
function InlineAvatar({ session }) {
  const [imgError, setImgError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const name = session?.name || session?.email || '?';
  const initials = getInitials(name);
  const rawAvatarSrc = session?.avatar_url || session?.image;
  const avatarSrc = rawAvatarSrc ? driveImageUrl(rawAvatarSrc) : '';
  const fallbackSrc = getFallbackAvatarUrl(session?.email || name);
  const isValidImage = avatarSrc && !avatarSrc.match(/^[A-Z?]{1,3}$/) && !imgError;

  const handleImageError = () => {
    if (!useFallback) setUseFallback(true);
    else setImgError(true);
  };

  return (
    <div className="relative shrink-0">
      {/* Glow ring */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-indigo-500/25 via-purple-500/20 to-pink-500/25 opacity-60 blur-[3px]" />
      <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white/10 bg-[#0d1226] shadow-lg ring-1 ring-white/[0.06] sm:h-16 sm:w-16">
        {isValidImage && !useFallback ? (
          avatarSrc.startsWith('/api/image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt={name} className="h-full w-full object-cover" onError={handleImageError} />
          ) : (
            <Image src={avatarSrc} alt={name} fill sizes="64px" className="object-cover" onError={handleImageError} priority />
          )
        ) : !imgError && useFallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fallbackSrc} alt={name} className="h-full w-full object-cover" onError={handleImageError} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600/30 to-purple-600/30">
            <span className="text-lg font-extrabold tracking-wider text-white sm:text-xl">{initials}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** @param {{ session: Object, accountStatus: string, user: Object, userRoles: string[] }} props */
export default function AccountHeader({ session, accountStatus, user, userRoles = [] }) {
  const name = session?.name || 'Guest User';
  const email = session?.email || 'guest@example.com';
  const isNew = accountStatus === 'pending';
  const isActive = accountStatus === 'active';

  const statusLabel =
    {
      active: 'Active',
      pending: 'Pending',
      rejected: 'Rejected',
      suspended: 'Suspended',
      banned: 'Restricted',
      locked: 'Locked',
      inactive: 'Inactive',
    }[accountStatus] ?? 'Unknown';

  const statusColor = isActive
    ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-400'
    : 'border-amber-500/20 bg-amber-500/8 text-amber-400';

  const dotColor = isActive ? 'bg-emerald-400' : 'bg-amber-400';

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  const highestRole = userRoles?.[0]
    ? userRoles[0].charAt(0).toUpperCase() + userRoles[0].slice(1)
    : 'Guest';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c1020]/60 shadow-2xl backdrop-blur-2xl">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      <div className="relative z-10 p-4 sm:p-5 md:p-6">
        {/* Avatar + identity row */}
        <div className="mb-3 flex items-center gap-4 sm:mb-4">
          <InlineAvatar session={session} />

          <div className="min-w-0 flex-1">
            {/* Eyebrow */}
            <p className="mb-0.5 text-[11px] font-semibold tracking-[0.15em] text-indigo-400/80 uppercase">
              {isNew ? '🎉 Welcome to NEUPC' : '👋 Welcome Back'}
            </p>

            {/* Name */}
            <h1 className="mb-0.5 truncate bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-lg font-bold tracking-tight text-transparent sm:text-xl md:text-2xl">
              {name}
            </h1>

            {/* Email + status inline */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-400 sm:text-sm">
                <Mail className="h-3 w-3 text-indigo-400/70 sm:h-3.5 sm:w-3.5" />
                {email}
              </span>
              <div
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${statusColor}`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotColor}`}
                  />
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`}
                  />
                </span>
                <span className="text-[10px] font-bold tracking-[0.12em] uppercase">
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thin separator */}
        <div className="mb-3 h-px w-full bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04]" />

        {/* Quick-stat chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 transition-colors hover:bg-white/[0.04]">
            <Calendar className="h-3.5 w-3.5 text-indigo-400/60" />
            <span className="text-[11px] font-medium text-gray-400">{joinedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 transition-colors hover:bg-white/[0.04]">
            <Award className="h-3.5 w-3.5 text-purple-400/60" />
            <span className="text-[11px] font-medium text-gray-400">{highestRole}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 transition-colors hover:bg-white/[0.04]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/60" />
            <span className="text-[11px] font-medium text-gray-400">Verified</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 transition-colors hover:bg-white/[0.04]">
            <LayoutDashboard className="h-3.5 w-3.5 text-cyan-400/60" />
            <span className="text-[11px] font-medium text-gray-400">
              {userRoles?.length || 0} {userRoles?.length === 1 ? 'Portal' : 'Portals'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
