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
  FileText,
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
  const isValidImage =
    avatarSrc && !avatarSrc.match(/^[A-Z?]{1,3}$/) && !imgError;

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
            <img
              src={avatarSrc}
              alt={name}
              className="h-full w-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <Image
              src={avatarSrc}
              alt={name}
              fill
              sizes="80px"
              className="object-cover"
              onError={handleImageError}
              priority
            />
          )
        ) : !imgError && useFallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fallbackSrc}
            alt={name}
            className="h-full w-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600/40 to-purple-600/30">
            <span className="text-2xl font-extrabold tracking-wider text-white">
              {initials}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountHeader({
  session,
  accountStatus,
  user,
  userRoles = [],
  bio,
  skills = [],
  username,
}) {
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
      inActive: 'Inactive',
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

  const resolvedUsername = username || user?.username;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c1020]/70 shadow-2xl backdrop-blur-2xl">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Cover gradient strip */}
      <div className="h-16 w-full bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent" />

      <div className="relative z-10 px-5 pb-5">
        {/* Avatar overlapping the cover */}
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <InlineAvatar session={session} />
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${statusColor}`}
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

        {/* Bio */}
        {bio && (
          <p className="mt-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-xs leading-relaxed text-gray-400 italic">
            &ldquo;{bio}&rdquo;
          </p>
        )}

        {/* Skills */}
        {skills?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[9px] font-semibold tracking-widest text-gray-600 uppercase">
              Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-indigo-500/15 bg-indigo-500/8 px-2 py-0.5 text-[10px] font-medium text-indigo-300/80"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stat chips */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-indigo-400/60" />
            <div>
              <p className="text-[9px] font-medium tracking-wider text-gray-600 uppercase">
                Joined
              </p>
              <p className="text-[11px] font-semibold text-gray-300">
                {joinedDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-2">
            <Award className="h-3.5 w-3.5 shrink-0 text-purple-400/60" />
            <div>
              <p className="text-[9px] font-medium tracking-wider text-gray-600 uppercase">
                Role
              </p>
              <p className="text-[11px] font-semibold text-gray-300">
                {highestRole}
              </p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-2">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
            <div>
              <p className="text-[9px] font-medium tracking-wider text-gray-600 uppercase">
                Portals
              </p>
              <p className="text-[11px] font-semibold text-gray-300">
                {userRoles?.length || 0}{' '}
                {userRoles?.length === 1
                  ? 'portal accessible'
                  : 'portals accessible'}
              </p>
            </div>
          </div>
        </div>

        {/* Scratchpad */}
        <ScratchpadSection />

        {/* Quick actions */}
        <div className="mt-4 flex flex-col gap-2">
          {resolvedUsername && (
            <Link
              href={`/user/${resolvedUsername}`}
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

// Client-only scratchpad — persisted to localStorage
function ScratchpadSection() {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('neupc_scratchpad') || '';
  });

  const handleChange = (e) => {
    setValue(e.target.value);
    localStorage.setItem('neupc_scratchpad', e.target.value);
  };

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5 text-indigo-400/60" />
        <p className="text-[9px] font-semibold tracking-widest text-gray-600 uppercase">
          Scratchpad
        </p>
        <span className="ml-auto text-[9px] text-gray-700">autosaved</span>
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder="Quick notes, links, tasks..."
        rows={3}
        className="w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-xs text-gray-300 placeholder-gray-700 transition-colors hover:border-white/[0.08] focus:border-indigo-500/30 focus:ring-0 focus:outline-none"
      />
    </div>
  );
}
