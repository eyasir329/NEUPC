'use client';

import { useEffect } from 'react';
import Image from 'next/image';

/**
 * PhotoLightbox — nested full-screen photo viewer used inside detail
 * modals (achievement / participation galleries). Shared to avoid
 * duplicating the prev/next/close/counter logic in each modal.
 */
export default function PhotoLightbox({ photos, activePhoto, onClose, onSelect }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        const idx = photos.findIndex((p) => p.id === activePhoto.id);
        onSelect(photos[(idx + 1) % photos.length]);
      }
      if (e.key === 'ArrowLeft') {
        const idx = photos.findIndex((p) => p.id === activePhoto.id);
        onSelect(photos[(idx - 1 + photos.length) % photos.length]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [photos, activePhoto, onClose, onSelect]);

  const activeIndex = photos.findIndex((p) => p.id === activePhoto.id);

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <button
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(photos[(activeIndex - 1 + photos.length) % photos.length]);
            }}
            aria-label="Previous photo"
            className="absolute top-1/2 left-4 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(photos[(activeIndex + 1) % photos.length]);
            }}
            aria-label="Next photo"
            className="absolute top-1/2 right-4 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </>
      )}
      <div
        className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={activePhoto.url}
          alt={activePhoto.name ?? 'Photo'}
          width={1200}
          height={900}
          className="max-h-[85vh] max-w-[90vw] object-contain"
          unoptimized
        />
      </div>
      {photos.length > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/60 tabular-nums backdrop-blur-sm">
          {activeIndex + 1} / {photos.length}
        </p>
      )}
    </div>
  );
}
