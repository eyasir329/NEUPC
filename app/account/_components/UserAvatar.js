'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function UserAvatar({ session }) {
  const [imgError, setImgError] = useState(false);

  const name = session?.name || session?.email || '?';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const showImage = session?.image && !imgError;

  return (
    <div className="mb-8 flex justify-center">
      <div className="relative h-24 w-24 sm:h-32 sm:w-32">
        {showImage ? (
          <Image
            src={session.image}
            alt={name}
            fill
            sizes="(max-width: 640px) 96px, 128px"
            className="rounded-full border-4 border-white/20 object-cover shadow-xl"
            onError={() => setImgError(true)}
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-white/20 bg-gradient-to-br from-gray-700 to-gray-800 shadow-xl">
            <span className="text-2xl font-bold text-white/80 sm:text-3xl">
              {initials}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
