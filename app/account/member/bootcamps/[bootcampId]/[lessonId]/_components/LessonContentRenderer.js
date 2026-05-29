/**
 * @file Lesson content renderer component
 * @module LessonContentRenderer
 */

'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import { createLowlight, common } from 'lowlight';
import VideoPlayer from './VideoPlayer';
import { BookOpen, Play, ListVideo } from 'lucide-react';
import { driveImageUrl } from '@/app/_lib/utils/utils';

const lowlight = createLowlight(common);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseContentBlocks(content) {
  if (!content) return [];
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [{ id: 'legacy', type: 'richText', content }];
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hastToString(node) {
  if (!node) return '';
  if (node.type === 'text') return escapeHtml(node.value);
  if (node.type === 'element') {
    const cls = node.properties?.className;
    const ca = cls
      ? ` class="${Array.isArray(cls) ? cls.join(' ') : cls}"`
      : '';
    return `<${node.tagName}${ca}>${(node.children || []).map(hastToString).join('')}</${node.tagName}>`;
  }
  if (node.type === 'root')
    return (node.children || []).map(hastToString).join('');
  return '';
}

function highlightCode(code, lang) {
  try {
    const l = (lang || '').trim().toLowerCase();
    if (l && lowlight.registered(l))
      return hastToString(lowlight.highlight(l, code));
  } catch {}
  return escapeHtml(code);
}

// ─── Custom marked renderer (Claude-style output) — marked v18 compatible ─────
//
// In marked v18, renderer methods receive the full token object.
// Inline text (paragraph, heading, strong, em, link, blockquote) is NOT
// pre-rendered into a `text` string — instead use this.parser.parseInline(tokens)
// for inline content and this.parser.parse(tokens) for block content.
// List/table now receive full token objects with items/rows arrays.

function buildRenderer() {
  const r = new marked.Renderer();

  // --- Block-level ---

  r.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const sz = {
      1: '1.375rem',
      2: '1.125rem',
      3: '1rem',
      4: '0.9rem',
      5: '0.85rem',
      6: '0.8rem',
    };
    return `<h${depth} class="md-h md-h${depth}" style="font-size:${sz[depth] || '1rem'}">${text}</h${depth}>\n`;
  };

  r.paragraph = function ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p class="md-p">${text}</p>\n`;
  };

  r.blockquote = function ({ tokens }) {
    const body = this.parser.parse(tokens);
    return `<blockquote class="md-bq">${body}</blockquote>\n`;
  };

  r.hr = () => `<hr class="md-hr">\n`;

  r.list = function (token) {
    const { ordered, start, items } = token;
    let body = '';
    for (const item of items) body += this.listitem(item);
    const tag = ordered ? 'ol' : 'ul';
    const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
    return `<${tag} class="md-${tag}"${startAttr}>${body}</${tag}>\n`;
  };

  r.listitem = function (item) {
    const body = this.parser.parse(item.tokens);
    if (item.task) {
      return `<li class="md-li md-task"><input type="checkbox" ${item.checked ? 'checked' : ''} disabled> ${body.replace(/^\s*<p[^>]*>(.*)<\/p>\s*$/s, '$1')}</li>\n`;
    }
    // Strip wrapping <p> tags for tight lists (single-paragraph items)
    const inner = item.loose
      ? body
      : body.replace(/^\s*<p[^>]*>(.*)<\/p>\s*$/s, '$1');
    return `<li class="md-li">${inner}</li>\n`;
  };

  r.table = function (token) {
    // Render header cells
    let headerHtml = '';
    for (const cell of token.header) {
      const text = this.parser.parseInline(cell.tokens);
      const al = cell.align ? ` style="text-align:${cell.align}"` : '';
      headerHtml += `<th class="md-th"${al}>${text}</th>`;
    }
    // Render body rows
    let bodyHtml = '';
    for (const row of token.rows) {
      let rowHtml = '';
      for (const cell of row) {
        const text = this.parser.parseInline(cell.tokens);
        const al = cell.align ? ` style="text-align:${cell.align}"` : '';
        rowHtml += `<td class="md-td"${al}>${text}</td>`;
      }
      bodyHtml += `<tr class="md-tr">${rowHtml}</tr>`;
    }
    return `<div class="md-table-wrap"><table class="md-table"><thead><tr class="md-tr">${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>\n`;
  };

  r.code = ({ text, lang }) => {
    const language = (lang || '').trim().toLowerCase();
    const highlighted = highlightCode(text, language);
    return [
      `<div class="md-code-block" data-has-copy="true">`,
      `  <div class="md-code-header">`,
      `    <span class="md-code-lang">${language || 'code'}</span>`,
      `    <button class="md-copy-btn" data-copy-btn="true">Copy</button>`,
      `  </div>`,
      `  <div class="md-code-scroll">`,
      `    <pre class="md-pre"><code class="language-${language} hljs">${highlighted}</code></pre>`,
      `  </div>`,
      `</div>\n`,
    ].join('');
  };

  // --- Inline-level ---

  r.strong = function ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<strong class="md-strong">${text}</strong>`;
  };

  r.em = function ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<em class="md-em">${text}</em>`;
  };

  r.codespan = ({ text }) => `<code class="md-inline-code">${text}</code>`;

  r.link = function ({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<a href="${href}" class="md-a"${title ? ` title="${escapeHtml(title)}"` : ''} target="_blank" rel="noopener">${text}</a>`;
  };

  r.image = ({ href, text, title }) =>
    `<img src="${href}" alt="${escapeHtml(text || '')}"${title ? ` title="${escapeHtml(title)}"` : ''} class="md-img" loading="lazy">`;

  return r;
}

const MD_RENDERER = buildRenderer();

function processMarkdown(markdown) {
  if (!markdown) return '';
  try {
    return marked.parse(markdown, {
      gfm: true,
      breaks: true,
      renderer: MD_RENDERER,
    });
  } catch (e) {
    return `<p>Failed to parse markdown.</p>`;
  }
}

// ─── Scoped styles for markdown viewer ────────────────────────────────────────

const MD_STYLES = `
.md-viewer{display:grid;grid-template-columns:1fr;gap:.75rem;line-height:1.65rem;color:#908fa0;}
.md-h{font-weight:700;color:#d4e4fa;margin-top:.75rem;margin-bottom:-.25rem;min-width:0;}
.md-h1{font-size:1.375rem}.md-h2{font-size:1.125rem}.md-h3{font-size:1rem}.md-h4{font-size:.9rem}
.md-p{line-height:1.7;word-break:break-word;white-space:normal;min-width:0;}
.md-strong{color:#d4e4fa;font-weight:600;}
.md-em{font-style:italic;}
.md-a{color:#8083ff;text-decoration:none;}.md-a:hover{text-decoration:underline;}
.md-img{max-width:100%;height:auto;border-radius:.75rem;border:1px solid rgba(255,255,255,.08);display:block;margin:.5rem 0;}
.md-bq{margin-left:.5rem;border-left:4px solid rgba(255,255,255,.12);padding:.5rem 1rem;border-radius:0 .5rem .5rem 0;background:rgba(255,255,255,.02);}
.md-hr{border:none;border-top:.5px solid #273647;margin:.75rem .375rem;}
.md-ul,.md-ol{padding-left:1.5rem;line-height:1.7;display:flex;flex-direction:column;gap:.2rem;}
.md-ul .md-li{list-style-type:disc;}.md-ol .md-li{list-style-type:decimal;}
.md-li{padding-left:.25rem;min-width:0;}
.md-task input{margin-right:.4rem;accent-color:#8083ff;}
.md-inline-code{background:rgba(128,131,255,.1);color:#8083ff;padding:.1em .4em;border-radius:.35rem;font-size:.875em;font-family:monospace;}
.md-table-wrap{overflow-x:auto;width:100%;margin:.5rem 0;}
.md-table{min-width:100%;border-collapse:collapse;font-size:.875rem;line-height:1.7;text-align:left;}
.md-th{color:#d4e4fa;border-bottom:.5px solid rgba(68,69,84,.8);padding:.5rem 1rem .5rem 0;vertical-align:top;font-weight:700;}
.md-td{border-bottom:.5px solid rgba(39,54,71,.5);padding:.5rem 1rem .5rem 0;vertical-align:top;color:#908fa0;}
.md-code-block{border-radius:.625rem;overflow:hidden;border:.5px solid #273647;margin:.25rem 0;}
.md-code-header{display:flex;align-items:center;justify-content:space-between;background:#0d1117;padding:.625rem 1rem;border-bottom:.5px solid #273647;}
.md-code-lang{font-size:.75rem;color:#464554;font-weight:600;text-transform:uppercase;letter-spacing:.04em;}
.md-copy-btn{font-size:.6875rem;color:#8083ff;background:rgba(128,131,255,.08);border:1px solid rgba(128,131,255,.2);border-radius:.375rem;padding:.25rem .875rem;cursor:pointer;font-weight:600;transition:all .2s;}
.md-copy-btn:hover{background:rgba(128,131,255,.15);}
.md-copy-btn.copied{color:#34d399;border-color:rgba(52,211,153,.3);background:rgba(52,211,153,.08);}
.md-code-scroll{overflow-x:auto;}
.md-pre{margin:0;padding:1.125rem 1.25rem;background:#010f1f;overflow-x:auto;}
.md-pre code{font-family:'JetBrains Mono','Fira Code',monospace;font-size:.8125rem;line-height:1.7;white-space:pre;color:#d4e4fa;background:transparent;}
/* highlight.js token colors */
.hljs-comment,.hljs-quote{color:#818898;font-style:italic;}
.hljs-keyword,.hljs-selector-tag,.hljs-subst{color:#f47b85;font-weight:600;}
.hljs-number,.hljs-literal,.hljs-variable,.hljs-template-variable,.hljs-tag .hljs-attr{color:#5eedec;}
.hljs-string,.hljs-doctag{color:#9be963;}
.hljs-title,.hljs-section,.hljs-selector-id{color:#70b8ff;font-weight:600;}
.hljs-type,.hljs-class .hljs-title{color:#5eedec;}
.hljs-tag,.hljs-name,.hljs-attribute{color:#f47b85;}
.hljs-regexp,.hljs-link{color:#9be963;}
.hljs-symbol,.hljs-bullet{color:#cc7bf4;}
.hljs-built_in,.hljs-builtin-name{color:#70b8ff;}
.hljs-meta{color:#818898;}
.hljs-deletion{color:#f47b85;}
.hljs-addition{color:#9be963;}
.hljs-emphasis{font-style:italic;}
.hljs-strong{font-weight:700;}
.hljs-params{color:#d4e4fa;}
.hljs-variable,.hljs-template-variable{color:#fbad60;}
.hljs-operator,.hljs-punctuation{color:#d3d7de;}
`;

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
              className={
                viewerMode ? 'tiptap-viewer-content' : 'tiptap-editor-content'
              }
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        }

        if (block.type === 'html') {
          return (
            <div
              key={block.id}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        }

        if (block.type === 'markdown') {
          const htmlContent = processMarkdown(block.content);
          return (
            <div key={block.id}>
              <style dangerouslySetInnerHTML={{ __html: MD_STYLES }} />
              <div
                className="md-viewer"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
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
              className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 p-6"
            >
              <style dangerouslySetInnerHTML={{ __html: MD_STYLES }} />
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
                        <div className="md-viewer min-w-0 flex-1 text-xs font-semibold text-white">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: processMarkdown(
                                q.question || 'Untitled Question'
                              ),
                            }}
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
