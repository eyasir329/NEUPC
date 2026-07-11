/**
 * @file Block migrations
 * @module block-migrations
 *
 * Helpers for converting between block types and shapes. The primary use is
 * migrating legacy `html` blocks containing admin-pasted inline-styled
 * `<pre><code>` (from the AI prompt templates in MultiBlockEditor.js) into
 * proper `markdown` blocks that the unified <MarkdownRenderer> / <CodeBlock>
 * can render through the canonical pipeline.
 *
 * Migration is strictly lossless-or-skip: a block is converted ONLY when it
 * consists of nothing but code-block markup (one or more code templates /
 * bare <pre> elements, with no other visible text). Blocks that mix code
 * with prose, callouts, headings, etc. are kept as `html` untouched.
 *
 * Used by:
 *   - The sanitizer on the WRITE path (preventive for new content)
 *   - The one-shot SQL migration 20260711000000_html_block_to_markdown.sql
 *     (PL/pgSQL implementation lives there)
 *
 * Both paths use the same `migrateHtmlBlockToMarkdown` contract.
 */

// AI-prompt template: <div data-has-copy="true">…<pre>…</pre></div>
// (the wrapper div nests a header div, so anchor the close on </pre>).
const AI_TEMPLATE_RE =
  /<div[^>]+data-has-copy\s*=\s*["']true["'][\s\S]*?<\/pre>\s*<\/div>/gi;
const BARE_PRE_RE = /<pre[^>]*>[\s\S]*?<\/pre>/gi;

/**
 * Detect whether an html-block content string contains the legacy
 * inline-style code-block template produced by the AI prompts in
 * MultiBlockEditor.js (e.g. <div data-has-copy="true" style="..."> ... ).
 *
 * @param {string} html
 * @returns {boolean}
 */
export function looksLikeLegacyCodeHtml(html) {
  if (!html || typeof html !== 'string') return false;
  return /<div[^>]+data-has-copy\s*=\s*["']true["']/i.test(html);
}

/**
 * Convert legacy admin-pasted inline-style code blocks into markdown fenced
 * code — but ONLY when the html block contains nothing except code blocks.
 *
 * Handles the canonical AI-prompt template (with a header `<span>` carrying
 * the language label) AND ad-hoc inline-styled <pre><code> (where lang is
 * extracted from the `<code>` class if present, otherwise empty). Multiple
 * code blocks in one html block are all converted, in order.
 *
 * @param {string} html - The full html-block content string
 * @returns {string | null} The migrated content (markdown with fenced code),
 *   or null if migration is not applicable (no code blocks, or the block
 *   also contains non-code content that would be lost).
 */
export function migrateHtmlBlockToMarkdown(html) {
  if (!html || typeof html !== 'string') return null;

  const fences = [];
  let remainder = html;

  // Pattern A: AI-prompt template blocks (extract lang from header span).
  remainder = remainder.replace(AI_TEMPLATE_RE, (segment) => {
    const spanMatch = segment.match(
      /<span[^>]*>\s*([A-Za-z0-9_+\-#]*)\s*<\/span>/i
    );
    const lang = (spanMatch?.[1] || '').trim().toLowerCase();
    const preMatch = segment.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    const fence = wrapAsMarkdownFence(
      extractCodeFromPre(preMatch?.[1] || ''),
      lang || extractLangFromClass(segment)
    );
    if (fence) fences.push(fence);
    return '';
  });

  // Pattern B: bare inline-styled <pre><code> without the wrapper div.
  remainder = remainder.replace(BARE_PRE_RE, (segment) => {
    const lang = extractLangFromClass(segment);
    const inner = segment.replace(/<\/?pre[^>]*>/gi, '');
    const fence = wrapAsMarkdownFence(extractCodeFromPre(inner), lang);
    if (fence) fences.push(fence);
    return '';
  });

  if (fences.length === 0) return null;

  // Lossless guard: skip migration if anything visible remains outside the
  // code blocks (Pattern C — rich text wrapping code stays as html).
  const leftover = decodeHtmlEntities(stripTags(remainder)).trim();
  if (leftover) return null;

  return fences.join('\n\n');
}

/**
 * Convert a single html block (object form) to either a markdown block (if
 * migration is applicable) or pass-through. Returns:
 *   - { migrated: true, block: { type: 'markdown', content, id } } when migrated
 *   - { migrated: false, block: originalBlock } otherwise
 *
 * Used by the sanitizer to mutate blocks before persisting.
 *
 * @param {object} block
 * @returns {{ migrated: boolean, block: object }}
 */
export function migrateHtmlBlockObject(block) {
  if (!block || block.type !== 'html' || typeof block.content !== 'string') {
    return { migrated: false, block };
  }
  const markdown = migrateHtmlBlockToMarkdown(block.content);
  if (!markdown) return { migrated: false, block };
  return {
    migrated: true,
    block: {
      ...block,
      type: 'markdown',
      content: markdown,
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractCodeFromPre(preHtml) {
  if (!preHtml) return '';
  const codeMatch = preHtml.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
  let inner = codeMatch ? codeMatch[1] : preHtml;
  // Only strip known inline wrapper tags (hljs spans, formatting, <br>).
  // A blanket tag-strip would eat literal code like `#include <vector>`.
  inner = inner
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(span|em|strong|b|i|u|font|code)[^>]*>/gi, '');
  return decodeHtmlEntities(inner).replace(/\r\n/g, '\n').trim();
}

function extractLangFromClass(segmentHtml) {
  const m = segmentHtml.match(/<code[^>]+class\s*=\s*["']([^"']*)["']/i);
  if (!m) return '';
  const cls = m[1];
  const langMatch = cls.match(/language-([A-Za-z0-9_+\-#]*)/i);
  if (langMatch) return langMatch[1].toLowerCase();
  // Some authors use bare class names like "hljs language-cpp" or "cpp"
  const simple = cls
    .split(/\s+/)
    .find((c) => /^[a-z]{2,8}$/i.test(c) && c.toLowerCase() !== 'hljs');
  return simple ? simple.toLowerCase() : '';
}

function decodeHtmlEntities(s) {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function stripTags(html) {
  return String(html).replace(/<[^>]*>/g, '');
}

function wrapAsMarkdownFence(code, lang) {
  const trimmed = (code || '').replace(/\n+$/, '');
  if (!trimmed) return null;
  const fence = lang ? `\`\`\`${lang}` : '```';
  return `${fence}\n${trimmed}\n\`\`\``;
}
