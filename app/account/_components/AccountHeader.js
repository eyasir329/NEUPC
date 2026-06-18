'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Calendar,
  ShieldCheck,
  Award,
  Settings,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  getInitials,
  getFallbackAvatarUrl,
  driveImageUrl,
} from '@/app/_lib/utils/utils';

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
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/25 opacity-70 blur-[4px]" />
      <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white/10 bg-[#0d1226] shadow-xl ring-1 ring-white/[0.06]">
        {isValidImage && !useFallback ? (
          avatarSrc.startsWith('/api/image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt={name} className="h-full w-full object-cover" onError={handleImageError} />
          ) : (
            <Image src={avatarSrc} alt={name} fill sizes="80px" className="object-cover" onError={handleImageError} priority />
          )
        ) : !imgError && useFallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fallbackSrc} alt={name} className="h-full w-full object-cover" onError={handleImageError} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600/40 to-purple-600/30">
            <span className="text-2xl font-extrabold tracking-wider text-white">{initials}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountHeader({ session, accountStatus, user, userRoles = [] }) {
  const name = session?.name || 'Guest User';
  const email = session?.email || '';
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
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recent';

  const highestRole = userRoles?.[0]
    ? userRoles[0].charAt(0).toUpperCase() + userRoles[0].slice(1)
    : 'Guest';

  const username = user?.username;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c1020]/70 shadow-2xl backdrop-blur-2xl">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Cover gradient strip */}
      <div className="h-16 w-full bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent" />

      <div className="relative z-10 px-5 pb-5">
        {/* Avatar — overlaps the cover */}
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <InlineAvatar session={session} />
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${statusColor}`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotColor}`} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
            </span>
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase">{statusLabel}</span>
          </div>
        </div>

        {/* Identity */}
        <div className="mb-1">
          <p className="text-[10px] font-semibold tracking-[0.15em] text-indigo-400/70 uppercase">
            {isNew ? 'New Member' : 'Welcome Back'}
          </p>
          <h1 className="mt-0.5 truncate bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            {name}
          </h1>
          {email && (
            <p className="mt-0.5 truncate text-xs text-gray-500">{email}</p>
          )}
        </div>

        {/* Stat chips */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-indigo-400/60" />
            <div>
              <p className="text-[9px] font-medium uppercase tracking-wider text-gray-600">Joined</p>
              <p className="text-[11px] font-semibold text-gray-300">{joinedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-2">
            <Award className="h-3.5 w-3.5 shrink-0 text-purple-400/60" />
            <div>
              <p className="text-[9px] font-medium uppercase tracking-wider text-gray-600">Role</p>
              <p className="text-[11px] font-semibold text-gray-300">{highestRole}</p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-2">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
            <div>
              <p className="text-[9px] font-medium uppercase tracking-wider text-gray-600">Portals</p>
              <p className="text-[11px] font-semibold text-gray-300">
                {userRoles?.length || 0} {userRoles?.length === 1 ? 'portal accessible' : 'portals accessible'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 flex flex-col gap-2">
          {username && (
            <Link
              href={`/user/${username}`}
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <User className="h-4 w-4 text-indigo-400/70" />
              <span>Public Profile</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-600" />
            </Link>
          )}
          <Link
            href="/account/member/profile"
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <User className="h-4 w-4 text-purple-400/70" />
            <span>Edit Profile</span>
          </Link>
          <Link
            href="/account/member/settings"
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Settings className="h-4 w-4 text-cyan-400/70" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
