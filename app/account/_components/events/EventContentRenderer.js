/**
 * @file Event content renderer component
 * @module EventContentRenderer
 *
 * Renders event and resource content blocks. Markdown blocks are delegated
 * to the shared <MarkdownRenderer> in app/_components/markdown/ (CSS lives
 * in global.css under the .event-viewer / .resource-viewer scopes). Code
 * blocks, hljs token colors, and copy-button behaviour are unified across
 * the app — see the shared module for the canonical implementation.
 */

'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { BookOpen, Play, ListVideo, AlertCircle } from 'lucide-react';
import { driveImageUrl } from '@/app/_lib/utils/utils';
import MarkdownRenderer from '@/app/_components/markdown/MarkdownRenderer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseContentBlocks(content) {
  if (!content) return [];
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object' && parsed.html) {
      return [{ id: 'legacy', type: 'richText', content: parsed.html }];
    }
  } catch {}
  const stringContent =
    typeof content === 'object' ? content?.html || '' : content;
  return [{ id: 'legacy', type: 'richText', content: stringContent }];
}

// ─── Simple video embed (no progress tracking) ────────────────────────────────

function EventVideoEmbed({ vid }) {
  const src = vid.video_source;
  const id = vid.video_id;

  if (!id && !vid.video_url) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-gray-500">
        <AlertCircle className="h-4 w-4 shrink-0" /> No video source configured.
      </div>
    );
  }

  if (src === 'youtube') {
    const ytId =
      id?.includes('youtube.com') || id?.includes('youtu.be')
        ? id.split(/[/?=]/).find((p) => /^[a-zA-Z0-9_-]{11}$/.test(p))
        : id;
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  if (src === 'drive') {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
        <iframe
          src={`https://drive.google.com/file/d/${id}/preview`}
          allow="autoplay"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  if (src === 'upload' && vid.video_url) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
        <video src={vid.video_url} controls className="w-full" />
      </div>
    );
  }

  return null;
}

// ─── Multi-video playlist ─────────────────────────────────────────────────────

function MultiVideoPlaylist({ videos }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeVid = videos[activeIdx];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#273647] bg-[#051424] shadow-2xl lg:flex-row">
      <div className="min-w-0 flex-1">
        <EventVideoEmbed vid={activeVid} />
        {activeVid.label && (
          <div className="border-t border-white/8 bg-[#0a0d14] px-4 py-3">
            <p className="truncate text-sm font-medium text-white/75">
              {activeVid.label}
            </p>
          </div>
        )}
      </div>
      <div className="flex max-h-[400px] shrink-0 flex-col border-t border-[#273647] bg-[#010f1f] lg:max-h-none lg:w-72 lg:border-t-0 lg:border-l">
        <div className="flex shrink-0 items-center justify-between border-b border-[#273647] bg-[#051424] px-4 py-3">
          <div className="flex items-center gap-2">
            <ListVideo className="h-4 w-4 text-[#8083ff]" />
            <span className="text-sm font-bold text-[#d4e4fa]">Playlist</span>
          </div>
          <span className="rounded-md border border-[#8083ff]/20 bg-[#8083ff]/10 px-2 py-0.5 text-[11px] font-bold text-[#c0c1ff] tabular-nums">
            {activeIdx + 1} / {videos.length}
          </span>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {videos.map((vid, idx) => {
            const isActive = idx === activeIdx;
            const hasVideo = vid.video_id || vid.video_url;
            return (
              <button
                key={vid.id ?? idx}
                onClick={() => hasVideo && setActiveIdx(idx)}
                disabled={!hasVideo}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 text-left transition-all ${
                  isActive
                    ? 'border border-[#464554] bg-[#122131]'
                    : 'border border-transparent hover:border-[#273647] hover:bg-[#051424]'
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {isActive && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#8083ff]" />
                )}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#8083ff] text-white'
                      : 'bg-[#273647] text-[#908fa0] group-hover:bg-[#34465c]'
                  }`}
                >
                  {isActive ? (
                    <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <p
                  className={`truncate text-sm font-semibold transition-colors ${isActive ? 'text-white' : 'text-[#908fa0] group-hover:text-[#d4e4fa]'}`}
                >
                  {vid.label || `Video ${idx + 1}`}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export default function EventContentRenderer({ content }) {
  const blocks = useMemo(() => parseContentBlocks(content), [content]);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll('[data-copy-btn]').forEach((btn) => {
      if (btn.hasAttribute('onclick')) btn.removeAttribute('onclick');
      if (btn._wired) return;
      btn._wired = true;
      btn.addEventListener('click', () => {
        const code =
          btn.closest('[data-has-copy="true"]')?.querySelector('code') ||
          btn.closest('.md-code-block')?.querySelector('code');
        if (!code) return;
        navigator.clipboard.writeText(code.textContent).then(() => {
          const orig = btn.textContent;
          btn.textContent = '✓ Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = orig === '✓ Copied!' ? 'Copy' : orig;
            btn.classList.remove('copied');
          }, 2000);
        });
      });
    });
  }, [blocks]);

  if (!blocks || blocks.length === 0) return null;

  return (
    <div ref={containerRef} className="space-y-8">
      {blocks.map((block) => {
        const hasContent = block.content?.trim();
        const hasData = block.data && Object.keys(block.data).length > 0;
        if (!hasContent && !hasData && block.type !== 'lessonPlan') return null;

        if (block.type === 'richText') {
          return (
            <div
              key={block.id}
              className="tiptap-viewer-content"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        }

        if (block.type === 'html') {
          return (
            <div
              key={block.id}
              className="event-viewer"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        }

        if (block.type === 'markdown') {
          return (
            <div key={block.id} className="event-viewer">
              <MarkdownRenderer source={block.content} scope="md-viewer event-viewer" />
            </div>
          );
        }

        if (block.type === 'image') {
          let images = block.data?.images;
          if (!images || !Array.isArray(images) || images.length === 0) {
            if (block.content)
              images = [
                { id: 'legacy', url: block.content, alt: block.data?.alt },
              ];
            else return null;
          }
          const valid = images.filter((img) => img.url);
          if (valid.length === 0) return null;
          const gridClass =
            valid.length === 1
              ? 'grid-cols-1 max-w-4xl mx-auto'
              : valid.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : valid.length === 3
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
          return (
            <div key={block.id} className={`grid gap-4 ${gridClass}`}>
              {valid.map((img, idx) => (
                <div
                  key={img.id ?? idx}
                  className={`group/img relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#020810] shadow-xl ${
                    valid.length === 3 && idx === 0 ? 'sm:col-span-2' : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={driveImageUrl(img.url)}
                    alt={img.alt || ''}
                    loading="lazy"
                    className="h-auto max-h-[600px] w-full object-contain transition-transform duration-700 group-hover/img:scale-[1.02]"
                  />
                  {img.alt && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-linear-to-t from-black/90 via-black/40 to-transparent px-6 pt-12 pb-4 opacity-0 transition-opacity duration-300 group-hover/img:opacity-100">
                      <p className="translate-y-2 text-sm font-medium text-white/90 transition-transform duration-300 group-hover/img:translate-y-0">
                        {img.alt}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }

        if (block.type === 'video') {
          const data = block.data || {};
          let videos = data.videos;
          if (!videos || !Array.isArray(videos)) {
            videos = data.video_id
              ? [
                  {
                    id: 'legacy',
                    video_source: data.video_source || 'drive',
                    video_id: data.video_id,
                  },
                ]
              : [];
          }
          if (videos.length === 0) return null;
          if (videos.length === 1) {
            const vid = videos[0];
            if (!vid.video_id && !vid.video_url) return null;
            return (
              <div key={block.id} className="flex flex-col gap-2">
                <EventVideoEmbed vid={vid} />
                {vid.label && (
                  <div className="px-1">
                    <p className="text-sm font-medium text-white/60">
                      {vid.label}
                    </p>
                  </div>
                )}
              </div>
            );
          }
          return <MultiVideoPlaylist key={block.id} videos={videos} />;
        }

        if (block.type === 'lessonPlan') {
          return (
            <div
              key={block.id}
              className="rounded-2xl border border-[#8083ff]/30 bg-[#8083ff]/5 p-6 sm:p-8"
            >
              <h4 className="mb-6 flex items-center gap-3 text-lg font-bold text-[#c0c1ff]">
                <BookOpen className="h-5 w-5" /> Content Section
              </h4>
              <EventContentRenderer content={block.content} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
