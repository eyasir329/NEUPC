/**
 * @file Lesson content renderer component
 * @module LessonContentRenderer
 *
 * Renders lesson content blocks. Markdown blocks are delegated to the
 * shared <MarkdownRenderer> in app/_components/markdown/ (CSS lives in
 * global.css under the .lesson-viewer scope). Code blocks, hljs token
 * colors, and copy-button behaviour are unified across the app — see
 * the shared module for the canonical implementation.
 */

'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { BookOpen, Play, ListVideo } from 'lucide-react';
import { driveImageUrl } from '@/app/_lib/utils/utils';
import MarkdownRenderer from '@/app/_components/markdown/MarkdownRenderer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseContentBlocks(content) {
  if (!content) return [];
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [{ id: 'legacy', type: 'richText', content }];
}

/**
 * If `html` looks like a full standalone document (has <!DOCTYPE>, <html>, or
 * <head>/<body> wrapper tags), strip the outer wrappers so only the inner
 * content survives. This keeps rendering identical to a fragment while
 * preventing nested <html>/<head>/<body> elements from breaking the host
 * page's hydration and document structure.
 *
 * @param {string} html
 * @returns {string}
 */
function unwrapFullDocument(html) {
  if (!html) return '';
  const trimmed = String(html).trim();
  const looksLikeFullDoc =
    /<\!doctype\s+html/i.test(trimmed) ||
    /<html[\s>]/i.test(trimmed) ||
    /<body[\s>]/i.test(trimmed);
  if (!looksLikeFullDoc) return html;

  // Pull out everything inside the first <body>...</body>, if present.
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(trimmed);
  if (bodyMatch) return bodyMatch[1];

  // No <body> wrapper — strip doctype / html / head if they exist.
  return trimmed
    .replace(/<\!doctype[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
}

// ─── Multi-video playlist ─────────────────────────────────────────────────────

function MultiVideoPlaylist({
  videos,
  lessonId,
  onProgress,
  onComplete,
  initialPosition = 0,
}) {
  const storageKey = `neupc-vid-idx-${lessonId}`;
  const [activeIdx, setActiveIdx] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem(storageKey), 10);
      return Number.isFinite(saved) && saved >= 0 && saved < videos.length
        ? saved
        : 0;
    } catch {
      return 0;
    }
  });
  const activeVid = videos[activeIdx];

  const handleSetActive = (idx) => {
    setActiveIdx(idx);
    try {
      localStorage.setItem(storageKey, String(idx));
    } catch {}
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl lg:flex-row">
      {/* Featured player area */}
      <div className="relative flex min-w-0 flex-1 flex-col bg-black">
        <VideoPlayer
          key={activeIdx}
          lesson={{
            id: lessonId,
            video_source: activeVid.video_source || 'drive',
            video_id: activeVid.video_id,
            video_url: activeVid.video_url,
          }}
          initialPosition={initialPosition}
          onProgress={onProgress}
          onComplete={onComplete}
        />
        {/* Title bar for active video overlaying the top */}
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 flex items-start justify-between bg-linear-to-b from-black/80 to-transparent p-4 pb-12">
          <h3 className="text-lg font-bold tracking-wide text-white drop-shadow-lg">
            {activeVid.label || `Video ${activeIdx + 1}`}
          </h3>
        </div>
      </div>

      {/* Playlist sidebar */}
      <div className="flex max-h-[420px] shrink-0 flex-col border-t border-white/10 bg-zinc-950 lg:max-h-[500px] lg:w-80 lg:border-t-0 lg:border-l">
        {/* Sidebar Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-zinc-900 px-5 py-4">
          <div className="flex items-center gap-2">
            <ListVideo className="h-4 w-4 text-[#8083ff]" />
            <span className="text-sm font-bold tracking-wide text-[#d4e4fa]">
              Course Playlist
            </span>
          </div>
          <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-200 tabular-nums">
            {activeIdx + 1} / {videos.length}
          </span>
        </div>

        {/* Sidebar Items */}
        <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
          {videos.map((vid, idx) => {
            const isActive = idx === activeIdx;
            const hasVideo = vid.video_id || vid.video_url;
            return (
              <button
                key={vid.id ?? idx}
                onClick={() => hasVideo && handleSetActive(idx)}
                disabled={!hasVideo}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 text-left transition-all ${
                  isActive
                    ? 'border border-violet-500/30 bg-violet-500/15 shadow-md shadow-violet-500/5'
                    : 'border border-transparent hover:border-white/10 hover:bg-zinc-900'
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                )}

                {/* Number / play icon */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'scale-105 bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-zinc-700 text-zinc-400 group-hover:bg-zinc-600 group-hover:text-zinc-100'
                  }`}
                >
                  {isActive ? (
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="min-w-0 flex-1 pr-2">
                  <p
                    className={`truncate text-sm leading-snug font-semibold transition-colors ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-100'}`}
                  >
                    {vid.label || `Video ${idx + 1}`}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] font-medium tracking-wider uppercase transition-colors ${isActive ? 'text-violet-200' : 'text-[#464554] group-hover:text-zinc-400'}`}
                  >
                    {isActive ? 'Now Playing' : 'Up Next'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export default function LessonContentRenderer({
  content,
  lessonId,
  onProgress,
  onComplete,
  initialPosition = 0,
  viewerMode = false,
  practiceProblemsComponent = null,
  examComponent = null,
}) {
  const blocks = useMemo(() => parseContentBlocks(content), [content]);
  const containerRef = useRef(null);

  // Wire copy-button click handlers for all block types
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const btns = container.querySelectorAll('[data-copy-btn]');
    btns.forEach((btn) => {
      // Remove inline onclick handlers from old generated content to prevent crashes
      if (btn.hasAttribute('onclick')) {
        btn.removeAttribute('onclick');
      }

      if (btn._wired) return;
      btn._wired = true;
      btn.addEventListener('click', () => {
        // Find code tag in various structures: Markdown, HTML prompt, RichText prompt
        let code =
          btn.closest('[data-has-copy="true"]')?.querySelector('code') ||
          btn.closest('.md-code-block')?.querySelector('code') ||
          btn.closest('div')?.nextElementSibling?.querySelector('code');

        if (!code) return;
        navigator.clipboard.writeText(code.textContent).then(() => {
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent =
              originalText === '✓ Copied!' ? 'Copy' : originalText;
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
        // Skip blocks with no content AND no data (except for layout blocks like lessonPlan)
        const hasContent = block.content?.trim();
        const hasData = block.data && Object.keys(block.data).length > 0;

        if (!hasContent && !hasData && block.type !== 'lessonPlan') return null;

        if (block.type === 'richText') {
          return (
            <div
              key={block.id}
              className={`lesson-renderer-block-richtext ${viewerMode ? 'tiptap-viewer-content' : 'tiptap-editor-content'}`}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        }

        if (block.type === 'html') {
          return (
            <div
              key={block.id}
              className="lesson-renderer-block-richtext"
              dangerouslySetInnerHTML={{
                __html: unwrapFullDocument(block.content),
              }}
            />
          );
        }

        if (block.type === 'markdown') {
          return (
            <div key={block.id} className="lesson-viewer">
              <MarkdownRenderer source={block.content} scope="md-viewer lesson-viewer" />
            </div>
          );
        }

        if (block.type === 'image') {
          let images = block.data?.images;

          // Professional: Robust multi-tier fallback for image data
          if (!images || !Array.isArray(images) || images.length === 0) {
            if (block.content) {
              // Legacy/single URL mode
              images = [
                { id: 'legacy', url: block.content, alt: block.data?.alt },
              ];
            } else {
              // Truly empty block
              return null;
            }
          }

          const validImages = images.filter((img) => img.url);
          if (validImages.length === 0) return null;

          let gridClass = 'grid gap-4 sm:gap-6 ';
          if (validImages.length === 1) {
            gridClass += 'grid-cols-1 max-w-5xl mx-auto';
          } else if (validImages.length === 2) {
            gridClass += 'grid-cols-1 sm:grid-cols-2';
          } else if (validImages.length === 3) {
            gridClass += 'grid-cols-1 sm:grid-cols-2';
          } else if (validImages.length === 4) {
            gridClass += 'grid-cols-1 sm:grid-cols-2';
          } else {
            gridClass += 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
          }

          return (
            <div key={block.id} className={gridClass}>
              {validImages.map((img, idx) => {
                const isFeatured = validImages.length === 3 && idx === 0;
                return (
                  <div
                    key={img.id}
                    className={`group/img relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-xl ${
                      isFeatured ? 'sm:col-span-2' : ''
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={driveImageUrl(img.url)}
                      alt={img.alt || 'Lesson image'}
                      className="h-auto max-h-[600px] w-full object-contain transition-transform duration-700 ease-out group-hover/img:scale-[1.02]"
                      loading="lazy"
                    />

                    {img.alt && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-linear-to-t from-black/90 via-black/40 to-transparent px-6 pt-12 pb-4 opacity-0 transition-opacity duration-300 group-hover/img:opacity-100">
                        <p className="translate-y-2 text-sm font-medium text-white/90 drop-shadow-md transition-transform duration-300 group-hover/img:translate-y-0">
                          {img.alt}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        if (block.type === 'video') {
          const data = block.data || {};
          let videos = data.videos;

          if (!videos || !Array.isArray(videos)) {
            if (data.video_id) {
              videos = [
                {
                  id: 'legacy',
                  video_source: data.video_source || 'drive',
                  video_id: data.video_id,
                },
              ];
            } else {
              videos = [];
            }
          }

          if (videos.length === 0) return null;

          // Single video — simple layout
          if (videos.length === 1) {
            const vid = videos[0];
            if (!vid.video_id && !vid.video_url) return null;
            return (
              <div
                key={block.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
              >
                <VideoPlayer
                  lesson={{
                    id: lessonId,
                    video_source: vid.video_source || 'drive',
                    video_id: vid.video_id,
                    video_url: vid.video_url,
                  }}
                  initialPosition={initialPosition}
                  onProgress={onProgress}
                  onComplete={onComplete}
                />
                {vid.label && (
                  <div className="border-t border-white/10 bg-zinc-900 px-4 py-3">
                    <p className="truncate text-sm font-medium text-white/75">
                      {vid.label}
                    </p>
                  </div>
                )}
              </div>
            );
          }

          // Multiple videos — playlist layout
          return (
            <MultiVideoPlaylist
              key={block.id}
              videos={videos}
              lessonId={lessonId}
              onProgress={onProgress}
              onComplete={onComplete}
              initialPosition={initialPosition}
            />
          );
        }

        if (block.type === 'practice') {
          const problems = block.data?.practice_problems || [];
          if (practiceProblemsComponent) {
            return (
              <div key={block.id} className="w-full">
                {practiceProblemsComponent(problems)}
              </div>
            );
          }
          return (
            <div
              key={block.id}
              className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 p-6"
            >
              <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-violet-200">
                <BookOpen className="h-4 w-4" /> Practice Problems Preview (
                {problems.length})
              </h4>
              {problems.length === 0 ? (
                <p className="text-xs text-[#908fa0] italic">
                  No problems added to this block.
                </p>
              ) : (
                <div className="space-y-2">
                  {problems.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-white/90">
                          {p.name || 'Untitled Problem'}
                        </span>
                        {p.source && (
                          <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                            {p.source}
                          </span>
                        )}
                      </div>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-violet-400 transition-colors hover:text-violet-300"
                        >
                          View Problem
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (block.type === 'exam') {
          const questions = block.data?.exam_questions || [];
          if (examComponent) {
            return (
              <div key={block.id} className="w-full">
                {examComponent(questions)}
              </div>
            );
          }
          return (
            <div
              key={block.id}
              className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 p-6 lesson-viewer"
            >
              <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-violet-200">
                <BookOpen className="h-4 w-4" /> Exam Module ({questions.length}{' '}
                Questions)
              </h4>
              {questions.length === 0 ? (
                <p className="text-xs text-[#908fa0] italic">
                  No questions added to this block.
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="space-y-3 rounded-xl border border-white/5 bg-white/2 p-4"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-400">
                          Q {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 text-xs font-semibold text-white">
                          <MarkdownRenderer
                            source={q.question || 'Untitled Question'}
                            scope="md-viewer lesson-viewer"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 p-2"
                          >
                            <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-700 text-[8px] font-bold text-zinc-500">
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <span className="text-xs text-zinc-400">
                              {opt ||
                                `Option ${String.fromCharCode(65 + oIdx)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (block.type === 'lessonPlan') {
          return (
            <div
              key={block.id}
              className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6 sm:p-8"
            >
              <h4 className="mb-6 flex items-center gap-3 text-lg font-bold text-violet-200">
                <BookOpen className="h-5 w-5" /> Lesson Plan
              </h4>
              <LessonContentRenderer
                content={block.content}
                lessonId={lessonId}
                onProgress={onProgress}
                onComplete={onComplete}
                practiceProblemsComponent={practiceProblemsComponent}
                examComponent={examComponent}
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
