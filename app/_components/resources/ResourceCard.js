/**
 * @file Resource card component
 * @module ResourceCard
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Pin,
  ExternalLink,
  Globe,
  ImageIcon,
  PlayCircle,
  FileText,
  FileDown,
  Share2,
  Edit3,
  Trash2,
  Star,
  Play,
} from 'lucide-react';
import { RESOURCE_TYPE_LABELS } from '@/app/_lib/resources/constants';
import { safeExternalHref } from '@/app/_lib/resources/embed-utils';
import { driveImageUrl, getInitials } from '@/app/_lib/utils/utils';

// ─── Type config ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  image: {
    icon: ImageIcon,
    gradient: 'from-violet-600/30 via-purple-600/20 to-transparent',
    accent: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
    dot: 'bg-violet-400',
  },
  video: {
    icon: PlayCircle,
    gradient: 'from-rose-600/30 via-red-600/20 to-transparent',
    accent: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
    dot: 'bg-rose-400',
  },
  rich_text: {
    icon: FileText,
    gradient: 'from-emerald-600/30 via-teal-600/20 to-transparent',
    accent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  youtube: {
    icon: PlayCircle,
    gradient: 'from-red-600/30 via-rose-600/20 to-transparent',
    accent: 'bg-red-500/15 text-red-300 border-red-500/20',
    dot: 'bg-red-400',
  },
  facebook_post: {
    icon: Share2,
    gradient: 'from-blue-600/30 via-indigo-600/20 to-transparent',
    accent: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
    dot: 'bg-blue-400',
  },
  linkedin_post: {
    icon: Share2,
    gradient: 'from-sky-600/30 via-blue-600/20 to-transparent',
    accent: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
    dot: 'bg-sky-400',
  },
  external_link: {
    icon: Globe,
    gradient: 'from-cyan-600/30 via-teal-600/20 to-transparent',
    accent: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
    dot: 'bg-cyan-400',
  },
  file: {
    icon: FileDown,
    gradient: 'from-amber-600/30 via-orange-600/20 to-transparent',
    accent: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    dot: 'bg-amber-400',
  },
};

const FALLBACK_CONFIG = {
  icon: FileText,
  gradient: 'from-slate-600/30 via-gray-600/20 to-transparent',
  accent: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
  dot: 'bg-slate-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
}

function getYouTubeThumbnail(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id = null;
    if (u.hostname.includes('youtu.be')) id = u.pathname.replace('/', '');
    else if (u.pathname === '/watch') id = u.searchParams.get('v');
    else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
    else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2];
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

function extractDriveFileId(url) {
  if (!url) return null;
  const m1 = url.match(/^\/api\/image\/([^/?#&]+)/);
  if (m1?.[1]) return m1[1];
  const m2 = url.match(/\/file\/d\/([^/?#&]+)/);
  if (m2?.[1]) return m2[1];
  return null;
}

function getExternalUrl(resource) {
  if (resource?.resource_type !== 'external_link') return null;
  return (
    safeExternalHref(resource?.embed_url) ||
    safeExternalHref(resource?.file_url) ||
    safeExternalHref(resource?.url) ||
    null
  );
}

function getCoverSrc(resource) {
  if (resource?.thumbnail) return resource.thumbnail;
  if (resource?.resource_type === 'youtube' && resource?.embed_url) {
    return getYouTubeThumbnail(resource.embed_url);
  }
  if (resource?.resource_type === 'video' && resource?.file_url) {
    const id = extractDriveFileId(resource.file_url);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
  }
  const extUrl = getExternalUrl(resource);
  if (extUrl)
    return `https://image.thum.io/get/width/800/crop/400/noanimate/${encodeURI(extUrl.split('#')[0])}`;
  return null;
}

const isUnoptimized = (src) =>
  src?.startsWith('https://image.thum.io') ||
  src?.startsWith('https://i.ytimg.com') ||
  src?.startsWith('https://drive.google.com/thumbnail') ||
  src?.startsWith('https://s.wordpress.com');

const isPlayable = (type) => type === 'youtube' || type === 'video';

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResourceCard({
  resource,
  onEdit,
  onDelete,
  showAdminActions = false,
  bookmarked = false,
  onToggleBookmark,
  detailBasePath = '',
  onOpen,
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const type = resource?.resource_type;
  const cfg = TYPE_CONFIG[type] || FALLBACK_CONFIG;
  const TypeIcon = cfg.icon;
  const typeLabel = RESOURCE_TYPE_LABELS[type] || 'Resource';
  const date = formatDate(resource?.published_at || resource?.created_at);
  const coverSrc = getCoverSrc(resource);
  const hasCover = coverSrc && !imgFailed;
  const playable = isPlayable(type);
  const canOpen = !showAdminActions && typeof onOpen === 'function';

  const handleOpen = () => canOpen && onOpen(resource);
  const handleKey = (e) => {
    if (canOpen && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <motion.article
      layout
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group relative flex flex-col rounded-[20px] border border-white/[0.05] bg-[#12141a]/80 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-[#161820] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${canOpen ? 'cursor-pointer' : ''}`}
      onClick={handleOpen}
      onKeyDown={handleKey}
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      aria-label={canOpen ? `Open ${resource.title}` : undefined}
    >
      {/* ── Cover area ── */}
      <div
        className={`relative w-full overflow-hidden rounded-t-[20px] ${hasCover ? 'h-[170px]' : 'h-[100px]'}`}
      >
        {hasCover ? (
          <>
            <Image
              src={coverSrc}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              onError={() => setImgFailed(true)}
              unoptimized={isUnoptimized(coverSrc)}
            />
            {/* scrim */}
            <div className="absolute inset-0 bg-linear-to-t from-[#12141a] via-[#12141a]/20 to-transparent" />
            {/* play overlay */}
            {playable && canOpen && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-2xl backdrop-blur-md transition-transform group-hover:scale-110">
                  <Play className="ml-1 h-5 w-5 fill-white text-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          /* icon gradient placeholder */
          <div
            className={`h-full w-full bg-linear-to-br ${cfg.gradient} bg-[#12141a]`}
          >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            <div className="relative z-10 flex h-full items-center justify-center">
              <TypeIcon className="h-8 w-8 text-white/20" />
            </div>
          </div>
        )}

        {/* badges top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {resource.is_pinned && (
            <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-black/40 px-2.5 py-1 text-[9.5px] font-bold tracking-wider text-amber-300 shadow-lg backdrop-blur-md">
              <Pin className="h-2.5 w-2.5" /> PINNED
            </span>
          )}
          <span
            className={`rounded-full border px-3 py-1 text-[9.5px] font-bold tracking-wider uppercase shadow-lg backdrop-blur-md ${hasCover ? 'bg-black/40 ' + cfg.accent.replace('bg-', 'border-').split(' ')[0] + ' text-white/90' : cfg.accent}`}
          >
            {typeLabel}
          </span>
        </div>

        {/* bookmark button */}
        {!showAdminActions && onToggleBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(resource.id);
            }}
            className={`absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 focus:outline-none ${
              bookmarked
                ? 'scale-100 border-amber-500/50 bg-amber-500/20 text-amber-300 opacity-100'
                : 'scale-95 border-white/20 bg-black/40 text-white/50 opacity-0 group-hover:scale-100 group-hover:opacity-100 hover:border-amber-500/40 hover:bg-amber-500/20 hover:text-amber-300'
            }`}
            aria-label={bookmarked ? `Remove bookmark` : `Bookmark`}
            aria-pressed={bookmarked}
          >
            <Star
              className="h-3.5 w-3.5"
              fill={bookmarked ? 'currentColor' : 'none'}
            />
          </button>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-1 flex-col gap-2.5 p-5 pt-4">
        {/* admin actions row */}
        {showAdminActions && (
          <div className="-mt-2 mb-1 flex items-center justify-end gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(resource);
              }}
              className="flex h-[28px] items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 text-[11px] font-medium text-white/50 transition-all hover:border-blue-500/30 hover:bg-blue-500/15 hover:text-blue-300"
              aria-label={`Edit ${resource.title}`}
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(resource);
              }}
              className="flex h-[28px] items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 text-[11px] font-medium text-red-400/80 transition-all hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-300"
              aria-label={`Delete ${resource.title}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* type dot + label (when no cover) */}
        {!hasCover && (
          <div className="-mt-1 flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${cfg.dot} shadow-[0_0_8px_currentColor]`}
            />
            <span className="text-[11px] font-semibold tracking-wide text-white/40 uppercase">
              {typeLabel}
            </span>
          </div>
        )}

        {/* title */}
        <h3 className="line-clamp-2 text-[15px] leading-snug font-bold tracking-tight text-white/90 transition-colors group-hover:text-white">
          {resource.title}
        </h3>

        {/* description */}
        {resource.description && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-white/40 transition-colors group-hover:text-white/50">
            {resource.description}
          </p>
        )}

        {/* Creator Info */}
        {resource.creator && (
          <div className="mt-1.5 mb-0.5 flex items-center gap-2">
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
              {resource.creator.avatar_url ? (
                <img
                  src={driveImageUrl(resource.creator.avatar_url)}
                  alt={resource.creator.full_name || 'Creator'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-violet-500/30 to-fuchsia-500/30 text-[8px] font-bold text-white/70"
                style={{
                  display: resource.creator.avatar_url ? 'none' : 'flex',
                }}
              >
                {getInitials(resource.creator.full_name || '?')}
              </div>
            </div>
            <span className="truncate text-[11px] font-medium text-white/50 transition-colors group-hover:text-white/70">
              {resource.creator.full_name || 'Unknown'}
            </span>
          </div>
        )}

        {/* footer */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <div className="flex min-w-0 items-center gap-2 text-[11.5px] font-medium text-white/30">
            {resource.category?.name && (
              <span className="max-w-[120px] truncate rounded border border-white/[0.04] bg-white/[0.03] px-2 py-0.5">
                {resource.category.name}
              </span>
            )}
            {resource.category?.name && date && (
              <span className="opacity-40">·</span>
            )}
            {date && (
              <time
                dateTime={resource?.published_at || resource?.created_at}
                className="truncate"
              >
                {date}
              </time>
            )}
          </div>

          {canOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-semibold text-white/40 transition-all group-hover:border-white/[0.15] group-hover:bg-white/[0.04] group-hover:text-white/80 hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-white"
            >
              Open <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
