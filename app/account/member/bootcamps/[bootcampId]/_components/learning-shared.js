/**
 * @file Shared helpers, renderers, and small UI bits for the bootcamp learning experience.
 * @module learning-shared
 */

'use client';

import { lazy } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Sparkles } from 'lucide-react';
import { marked } from 'marked';

const MultiBlockEditor = dynamic(
  () => import('@/app/account/admin/bootcamps/_components/MultiBlockEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/5" />
    ),
  }
);
const parseExamQuestions = (questions, lesson = null) => {
  let list = [];
  if (lesson) {
    try {
      const parsed =
        typeof lesson.content === 'string'
          ? JSON.parse(lesson.content)
          : lesson.content;
      const examBlock = parsed?.find((b) => b.type === 'exam');
      list = examBlock?.questions || [];
    } catch {}
  }
  if (!list || list.length === 0) {
    if (!questions) return [];
    if (Array.isArray(questions)) return questions;
    if (typeof questions === 'string') {
      try {
        const parsed = JSON.parse(questions);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }
  return list;
};

const parsePracticeProblems = (problems) => {
  if (!problems) return [];
  if (Array.isArray(problems)) return problems;
  if (typeof problems === 'string') {
    try {
      const parsed = JSON.parse(problems);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

// Lightweight markdown renderer for task/session descriptions
const MD_DESC_STYLES = `
.md-desc{display:grid;grid-template-columns:1fr;gap:.5rem;line-height:1.6;color:#908fa0;font-size:.8125rem;}
.md-desc .md-h{font-weight:700;color:#d4e4fa;margin-top:.5rem;margin-bottom:-.25rem;}
.md-desc .md-p{line-height:1.65;word-break:break-word;}
.md-desc .md-strong{color:#d4e4fa;font-weight:600;}
.md-desc .md-em{font-style:italic;}
.md-desc .md-a{color:#8083ff;text-decoration:none;}.md-desc .md-a:hover{text-decoration:underline;}
.md-desc .md-ul,.md-desc .md-ol{padding-left:1.25rem;display:flex;flex-direction:column;gap:.15rem;}
.md-desc .md-ul .md-li{list-style-type:disc;}.md-desc .md-ol .md-li{list-style-type:decimal;}
.md-desc .md-li{padding-left:.2rem;}
.md-desc .md-inline-code{background:rgba(128,131,255,.1);color:#8083ff;padding:.1em .35em;border-radius:.3rem;font-size:.8em;font-family:monospace;}
.md-desc .md-code-block{background:#040d17;border:1px solid rgba(255,255,255,0.08);color:#d4e4fa;padding:.75rem 1rem;border-radius:.6rem;font-size:.8em;font-family:monospace;margin:.5rem 0;line-height:1.5;overflow-x:auto;white-space:pre-wrap;word-break:break-all;}
.md-desc .md-bq{border-left:3px solid rgba(255,255,255,.12);padding:.4rem .75rem;background:rgba(255,255,255,.02);border-radius:0 .4rem .4rem 0;}
`;

function buildDescRenderer() {
  const r = new marked.Renderer();
  r.heading = function ({ tokens, depth }) {
    return `<h${depth} class="md-h md-h${depth}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
  };
  r.paragraph = function ({ tokens }) {
    return `<p class="md-p">${this.parser.parseInline(tokens)}</p>\n`;
  };
  r.blockquote = function ({ tokens }) {
    return `<blockquote class="md-bq">${this.parser.parse(tokens)}</blockquote>\n`;
  };
  r.list = function (token) {
    const tag = token.ordered ? 'ol' : 'ul';
    let body = '';
    for (const item of token.items) {
      const inner = this.parser
        .parse(item.tokens)
        .replace(/^\s*<p[^>]*>(.*)<\/p>\s*$/s, '$1');
      body += `<li class="md-li">${inner}</li>\n`;
    }
    return `<${tag} class="md-${tag}">${body}</${tag}>\n`;
  };
  r.strong = function ({ tokens }) {
    return `<strong class="md-strong">${this.parser.parseInline(tokens)}</strong>`;
  };
  r.em = function ({ tokens }) {
    return `<em class="md-em">${this.parser.parseInline(tokens)}</em>`;
  };
  r.codespan = ({ text }) => `<code class="md-inline-code">${text}</code>`;
  r.link = function ({ href, title, tokens }) {
    return `<a href="${href}" class="md-a"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener">${this.parser.parseInline(tokens)}</a>`;
  };
  r.code = ({ text }) => `<pre class="md-code-block">${text}</pre>`;
  return r;
}

const DESC_RENDERER = buildDescRenderer();

function MarkdownDesc({ text, className = '' }) {
  if (!text) return null;
  let html = '';
  try {
    html = marked.parse(text, {
      gfm: true,
      breaks: true,
      renderer: DESC_RENDERER,
    });
  } catch {
    html = `<p>${text}</p>`;
  }
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MD_DESC_STYLES }} />
      <div
        className={`md-desc ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}

// Inline renderer for task/session descriptions stored as richText JSON blocks
function TaskDescriptionRenderer({ content }) {
  if (!content) return null;
  let html = '';
  try {
    const blocks = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(blocks)) {
      html = blocks
        .map((b) => {
          if (!b) return '';
          const type = b.type || 'richText';
          const text = b.content || '';
          if (type === 'markdown') {
            try {
              return marked(text);
            } catch {
              return `<pre>${text}</pre>`;
            }
          }
          // richText, html — already HTML; skip structural/media blocks
          if (type === 'richText' || type === 'html') return text;
          return '';
        })
        .join('');
    } else {
      html = content;
    }
  } catch {
    html = content;
  }
  if (!html || !html.trim()) return null;
  return (
    <div
      className="tiptap-viewer-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Heavy chunk: lazy-load only the markdown/code-highlight renderer
let nativePushState = null;
let nativeReplaceState = null;

function getNativeHistory() {
  if (typeof window === 'undefined')
    return { pushState: null, replaceState: null };
  if (nativePushState && nativeReplaceState) {
    return { pushState: nativePushState, replaceState: nativeReplaceState };
  }
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    nativePushState = iframe.contentWindow.history.pushState;
    nativeReplaceState = iframe.contentWindow.history.replaceState;
    document.body.removeChild(iframe);
  } catch (e) {
    nativePushState = window.history.pushState;
    nativeReplaceState = window.history.replaceState;
  }
  return { pushState: nativePushState, replaceState: nativeReplaceState };
}

function ChunkFallback({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-8 text-gray-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      <span className="text-[12px]">{label}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDurationSecs(seconds) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function formatDurationFull(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SCROLLBAR = `
  .spa-scroll::-webkit-scrollbar { width: 5px; }
  .spa-scroll::-webkit-scrollbar-track { background: transparent; }
  .spa-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius:10px; }
  .spa-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
  .spa-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }

  @keyframes spa-indeterminate {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(20%); }
    100% { transform: translateX(120%); }
  }
  .spa-progress-bar {
    position: absolute;
    inset: 0;
    width: 40%;
    background: linear-gradient(90deg, transparent, rgb(16 185 129), transparent);
    animation: spa-indeterminate 1.1s ease-in-out infinite;
  }

  @keyframes spa-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .spa-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
    background-size: 800px 100%;
    animation: spa-shimmer 1.4s linear infinite;
  }

  @keyframes spa-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .spa-fade-in { animation: spa-fade-in 0.22s ease-out both; }
`;

// ─── Curriculum Rail ──────────────────────────────────────────────────────────

function PanelLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-4 border-white/5" />
        <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-violet-400" />
      </div>
      <p className="mt-3 text-[12px] text-gray-500">Loading…</p>
    </div>
  );
}

function PanelEmpty({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 rounded-full bg-white/5 p-3 ring-1 ring-white/10">
        <Sparkles className="h-5 w-5 text-gray-500" />
      </div>
      <p className="text-[13px] text-gray-500">{message}</p>
    </div>
  );
}

function getLessonIdFromUrl() {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(/\/bootcamps\/[^/]+\/([^/]+)$/);
  return m ? m[1] : null;
}


export { MultiBlockEditor, parseExamQuestions, parsePracticeProblems, MarkdownDesc, TaskDescriptionRenderer, getNativeHistory, ChunkFallback, formatDurationSecs, formatDurationFull, SCROLLBAR, PanelLoader, PanelEmpty, getLessonIdFromUrl };
