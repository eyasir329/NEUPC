/**
 * @file User avatar with image fallback.
 * Shows user profile image or initials-based fallback.
 *
 * @module UserAvatar
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/app/_lib/utils/utils';
import {
  getInitials,
  getFallbackAvatarUrl,
  driveImageUrl,
} from '@/app/_lib/utils/utils';

/** @param {{ session: Object, userId: string, size?: 'sm' | 'md' | 'lg' }} props */
export default function UserAvatar({ session, userId, size = 'lg' }) {
  const [imgError, setImgError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const name = session?.name || session?.email || '?';
  const initials = getInitials(name);

  // Prefer DB avatar over provider image; normalize Drive/external URLs.
  const rawAvatarSrc = session?.avatar_url || session?.image;
  const avatarSrc = rawAvatarSrc ? driveImageUrl(rawAvatarSrc) : '';
  const fallbackSrc = getFallbackAvatarUrl(session?.email || name);
  const isValidImage =
    avatarSrc && !avatarSrc.match(/^[A-Z?]{1,3}$/) && !imgError;

  const handleImageError = () => {
    if (!useFallback) {
      // First error: try fallback image
      setUseFallback(true);
    } else {
      // Fallback also failed: show initials
      setImgError(true);
    }
  };

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16 sm:h-20 sm:w-20',
    lg: 'h-20 w-20 sm:h-24 sm:w-24',
  };

  const ringSize = {
    sm: '-inset-1',
    md: '-inset-1',
    lg: '-inset-1.5',
  };

  const initialsSize = {
    sm: 'text-sm',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  return (
    <div className="relative inline-block">
      {/* Outer glowing border ring */}
      <div className={cn(
        "absolute rounded-full bg-gradient-to-r from-indigo-500/30 via-purple-500/25 to-pink-500/30 opacity-70 blur-[3px]",
        ringSize[size]
      )} />
      
      <div
        className={cn(
          "relative z-10 overflow-hidden rounded-full border-2 border-[#0d1226]/80 bg-[#0d1226] shadow-xl ring-1 ring-white/10 transition-all duration-300",
          sizeClasses[size]
        )}
      >
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
              sizes="(max-width: 640px) 80px, 96px"
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
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600/30 to-purple-600/30">
            <span className={cn("font-extrabold tracking-wider text-white", initialsSize[size])}>
              {initials}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
