/**
 * @file Gallery item card — displays a single media item’s thumbnail,
 *   caption, category tag, and edit / delete / feature actions.
 * @module GalleryItemCard
 */

'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { getTypeConfig, formatRelativeDate } from './galleryConfig';
import {
  toggleGalleryFeaturedAction,
  deleteGalleryItemAction,
} from '@/app/_lib/gallery-actions';
import { Edit2, Trash2, Calendar, Star } from 'lucide-react';
import { GlassCard, Pill } from '@/app/account/_components/ui';

export default function GalleryItemCard({
  item,
  onEdit,
  noFeatured = false,
  deleteAction,
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [featured, setFeatured] = useState(item.is_featured ?? false);
  const [isPending, startTransition] = useTransition();
  const [imgError, setImgError] = useState(false);

  const effectiveDeleteAction = deleteAction ?? deleteGalleryItemAction;

  const typeConf = getTypeConfig(item.type);
  const uploaderName = item.users?.full_name ?? 'Unknown';
  const eventTitle = item.events?.title ?? null;

  // ── Featured Toggle ────────────────────────────────────────────────────────
  function handleToggleFeatured(e) {
    e.stopPropagation();
    const newVal = !featured;
    setFeatured(newVal);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', item.id);
      fd.set('featured', String(newVal));
      const res = await toggleGalleryFeaturedAction(fd);
      if (res?.error) setFeatured(!newVal); // revert on error
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  function handleDeleteClick(e) {
    e.stopPropagation();
    setConfirmDelete(true);
  }

  async function handleConfirmDelete(e) {
    e.stopPropagation();
    setDeleting(true);
    const fd = new FormData();
    fd.set('id', item.id);
    await effectiveDeleteAction(fd);
    setDeleting(false);
  }

  return (
    <GlassCard
      hover
      padding="p-0"
      className="group relative overflow-hidden flex flex-col h-full border-white/[0.08] hover:border-violet-500/30 bg-gray-900 transition-all duration-200 hover:shadow-lg hover:shadow-violet-900/10 cursor-default"
    >
      {/* ── Media Preview ──────────────────────────────────────────────────── */}
      <div className="relative aspect-video overflow-hidden bg-slate-900/80">
        {item.type === 'image' && !imgError ? (
          <Image
            src={item.url}
            alt={item.caption ?? 'Gallery image'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-linear-to-br ${typeConf.gradient} flex items-center justify-center text-slate-500`}
          >
            {typeConf.icon}
          </div>
        )}

        {/* Caption overlay */}
        {item.caption && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-black/80 via-black/50 to-transparent px-3.5 py-2.5 transition-transform duration-200 group-hover:translate-y-0">
            <p className="line-clamp-2 text-xs text-white/90 leading-relaxed">{item.caption}</p>
          </div>
        )}

        {/* Featured toggle (top-left) — hidden for event_gallery items */}
        {!noFeatured && (
          <button
            onClick={handleToggleFeatured}
            disabled={isPending}
            title={featured ? 'Unfeature' : 'Mark as featured'}
            className={`absolute top-2.5 left-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all duration-150 ${
              featured
                ? 'scale-110 bg-amber-500 text-white shadow-md shadow-amber-500/40'
                : 'bg-black/50 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-amber-500/20 hover:text-amber-400 backdrop-blur-xs'
            }`}
          >
            ★
          </button>
        )}

        {/* Type badge (top-right) */}
        <span
          className={`absolute top-2.5 right-2.5 z-10 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md transition-all ${typeConf.badge}`}
        >
          {typeConf.emoji} {typeConf.label}
        </span>
      </div>

      {/* ── Info ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-3.5 space-y-3">
        {/* Category + Event */}
        <div className="flex flex-wrap gap-1.5">
          {item.category && (
            <Pill tone="gray" className="text-[10px] px-2 py-0.5">
              {item.category}
            </Pill>
          )}
          {eventTitle && (
            <Pill tone="violet" icon={Calendar} className="max-w-[140px] truncate text-[10px] px-2 py-0.5">
              {eventTitle}
            </Pill>
          )}
        </div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded border border-white/[0.04] bg-white/[0.02] px-1.5 py-0.5 text-[10px] text-gray-500"
              >
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[10px] text-gray-600 self-center">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: uploader + order + actions */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 mt-auto">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-gray-400">{uploaderName}</p>
            <p className="text-[10px] text-gray-500" suppressHydrationWarning>
              {formatRelativeDate(item.created_at)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {/* Display order badge */}
            <span className="px-1.5 text-[10px] font-medium text-gray-600">
              #{item.display_order}
            </span>

            {/* Edit */}
            <button
              onClick={() => onEdit(item)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              title="Edit"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="rounded bg-red-500/20 border border-red-500/30 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/30 transition-all"
                >
                  {deleting ? '…' : 'Yes'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="rounded bg-white/5 border border-white/10 px-2 py-1 text-[10px] font-semibold text-gray-300 hover:bg-white/10 transition-all"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeleteClick}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
