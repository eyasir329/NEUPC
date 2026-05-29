/**
 * @file User avatar with image fallback.
 * Shows user profile image or initials-based fallback.
 *
 * @module UserAvatar
 */

'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadUserImageAction } from '@/app/_lib/actions/user-actions';
import { cn } from '@/app/_lib/utils/utils';
import {
  getInitials,
  getFallbackAvatarUrl,
  driveImageUrl,
} from '@/app/_lib/utils/utils';

/** @param {{ session: Object, userId: string, isAdmin: boolean }} props */
export default function UserAvatar({ session, userId, isAdmin }) {
  const [imgError, setImgError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const name = session?.name || session?.email || '?';
  const initials = getInitials(name);

  // Prefer DB avatar over provider image; normalize Drive/external URLs.
  const rawAvatarSrc = localAvatar || session?.avatar_url || session?.image;
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

  const handleAvatarClick = () => {
    if (isAdmin && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading your new avatar...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId || session?.id);
      formData.append('updateDb', 'true');

      const result = await uploadUserImageAction(formData);
      if (result?.error) {
        throw new Error(result.error);
      }
      if (!result?.url) {
        throw new Error('Image upload failed.');
      }

      setLocalAvatar(result.url);
      setImgError(false);
      setUseFallback(false);
      toast.success('Avatar updated successfully!', { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to upload avatar.', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const frameClass =
    'h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-white/10 ring-2 ring-primary-500/30 overflow-hidden shadow-2xl shadow-primary-500/10 backdrop-blur-xl';

  return (
    <div className="mb-6 flex flex-col items-center justify-center">
      <div
        onClick={handleAvatarClick}
        className={cn(
          `relative ${frameClass}`,
          isAdmin ? 'group cursor-pointer' : ''
        )}
      >
        {/* Hidden File Input */}
        {isAdmin && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        )}

        {/* Hover Camera Overlay */}
        {isAdmin && !isUploading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Camera className="h-5 w-5 text-indigo-400" />
            <span className="text-[10px] font-semibold tracking-wide">
              Change Photo
            </span>
          </div>
        )}

        {/* Uploading Spinner Overlay */}
        {isUploading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-full bg-black/75 text-white">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-[9px] font-medium tracking-wide text-gray-400">
              Uploading...
            </span>
          </div>
        )}

        {isValidImage && !useFallback ? (
          avatarSrc.startsWith('/api/image/') ? (
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
          <img
            src={fallbackSrc}
            alt={name}
            className="h-full w-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="from-primary-500/30 to-secondary-500/30 flex h-full w-full items-center justify-center bg-linear-to-br">
            <span className="text-3xl font-bold text-white sm:text-4xl">
              {initials}
            </span>
          </div>
        )}
      </div>

      {isAdmin && (
        <span className="mt-2.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-indigo-400/80 uppercase select-none">
          Click Avatar to Upload
        </span>
      )}
    </div>
  );
}
