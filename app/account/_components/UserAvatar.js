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

/** @param {{ session: Object, userId: string }} props */
export default function UserAvatar({ session, userId }) {
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

  return (
    <div className="mb-6 flex flex-col items-center justify-center">
      <div className="relative">
        {/* Outer glowing pulsing border ring (Premium Aesthetic) */}
        <div className="absolute -inset-1.5 animate-pulse rounded-full bg-gradient-to-r from-indigo-500/40 via-purple-500/30 to-pink-500/40 opacity-75 blur-[4px]" />
        
        <div
          className={cn(
            "relative z-10 overflow-hidden rounded-full border-[3px] border-[#060810] bg-[#0d1226] shadow-2xl transition-all duration-300",
            "h-28 w-28 sm:h-32 sm:w-32"
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
                sizes="(max-width: 640px) 112px, 128px"
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
              <span className="text-3xl font-extrabold tracking-wider text-white sm:text-4xl">
                {initials}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

