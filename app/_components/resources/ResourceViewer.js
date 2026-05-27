import ResourceEmbed from '@/app/_components/resources/ResourceEmbed';
import Image from 'next/image';
import {
  Calendar,
  Tag,
  FolderOpen,
  Pin,
  ImageIcon,
  PlayCircle,
  FileText,
  FileDown,
  Share2,
  ExternalLink as ExternalLinkIcon,
} from 'lucide-react';
import { RESOURCE_TYPE_LABELS } from '@/app/_lib/resources/constants';
import EventContentRenderer from '@/app/account/_components/events/EventContentRenderer';
import { safeExternalHref } from '@/app/_lib/resources/embed-utils';

// ─── Per-type visual config ──────────────────────────────────────────────────

const TYPE_CONFIG = {
  image: {
    icon: ImageIcon,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  video: {
    icon: PlayCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  rich_text: {
    icon: FileText,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  youtube: {
    icon: PlayCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  facebook_post: {
    icon: Share2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  linkedin_post: {
    icon: Share2,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  external_link: {
    icon: ExternalLinkIcon,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  file: {
    icon: FileDown,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
};

const FALLBACK_CONFIG = {
  icon: FileText,
  color: 'text-gray-400',
  bg: 'bg-gray-500/10',
  border: 'border-gray-500/20',
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ResourceViewer({ resource, hideHeader = false }) {
  if (!resource) return null;

  const type = resource.resource_type;
  const cfg = TYPE_CONFIG[type] || FALLBACK_CONFIG;
  const TypeIcon = cfg.icon;
  const typeLabel = RESOURCE_TYPE_LABELS[type] || 'Resource';
  const tags = resource.tags || [];
  const date = formatDate(resource.published_at || resource.created_at);

  // Don't show thumbnail separately for visual types — the embed IS the visual
  const showThumbnail =
    resource.thumbnail && !['image', 'video', 'youtube'].includes(type);

  return (
    <section className="space-y-4" aria-label="Resource details">

      {/* ── Meta row: type + category + date + tags ── */}
      {!hideHeader && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 rounded-lg border ${cfg.border} ${cfg.bg} px-2 py-1 text-[11px] font-semibold ${cfg.color}`}>
            <TypeIcon className="h-3 w-3" />
            {typeLabel}
          </span>

          {resource.category?.name && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-2 py-1 text-[11px] text-white/50">
              <FolderOpen className="h-3 w-3 text-white/25" />
              {resource.category.name}
            </span>
          )}

          {resource.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2 py-1 text-[11px] text-amber-300/80">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}

          {resource.status === 'draft' && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2 py-1 text-[11px] text-amber-300/80 font-bold uppercase tracking-wider">
              Pending Admin Review
            </span>
          )}

          {date && (
            <time dateTime={resource.published_at || resource.created_at} className="ml-auto flex items-center gap-1.5 text-[11px] text-white/25">
              <Calendar className="h-3 w-3" />
              {date}
            </time>
          )}
        </div>
      )}

      {/* ── Title ── */}
      {!hideHeader && (
        <h1 className="text-[18px] font-bold leading-snug tracking-tight text-white sm:text-[22px]">
          {resource.title}
        </h1>
      )}

      {/* ── Description ── */}
      {!hideHeader && resource.description && (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-widest text-white/20">
            Description
          </p>
          <p className="text-[13.5px] leading-relaxed text-white/55 whitespace-pre-line">
            {resource.description}
          </p>
        </div>
      )}

      {/* ── Thumbnail (for non-visual types that have one) ── */}
      {showThumbnail && (
        <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-white/8 sm:h-72">
          <Image
            src={resource.thumbnail}
            alt={resource.title}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
      )}

      {/* ── Main embed / content ── */}
      <div className="w-full">
        <ResourceEmbed resource={resource} />
      </div>

      {/* ── Rich Content Blocks ── */}
      {!hideHeader && type !== 'rich_text' && resource.content && (
        <div className="w-full mt-4">
          <EventContentRenderer content={resource.content} />
        </div>
      )}

      {/* ── Tags ── */}
      {!hideHeader && tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="h-3 w-3 text-white/20" />
          {tags.map((tag) => (
            <span
              key={tag.id || tag.slug || tag.name}
              className="rounded-md border border-white/8 bg-white/4 px-2 py-0.5 text-[11px] text-white/40"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Attachment ── */}
      {resource.file_url && !['file', 'image', 'video'].includes(type) && (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-widest text-white/20">
            Attachment
          </p>
          <a
            href={safeExternalHref(resource.file_url) || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-white/70 transition-all hover:border-white/15 hover:bg-white/10 hover:text-white"
          >
            <FileDown className="h-4 w-4 text-white/30" />
            Open attachment
          </a>
        </div>
      )}
    </section>
  );
}
