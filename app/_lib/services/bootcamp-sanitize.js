/**
 * @file Sanitization helpers specific to bootcamp content.
 * @module bootcamp-sanitize
 *
 * All user-authored rich text reaching DB writes for bootcamp resources MUST
 * pass through these helpers. The renderer uses dangerouslySetInnerHTML for
 * lesson blocks, so anything stored unsanitized is a stored-XSS payload.
 *
 * Sanitization happens on the WRITE path so:
 *   1. Older stored payloads (pre-sanitization) are unaffected and need a
 *      one-time backfill if you want them retroactively cleaned.
 *   2. Reads stay cheap (no per-render sanitize on hot paths).
 */

import { sanitizeRichText, sanitizeText } from '@/app/_lib/utils/validation';
import { migrateHtmlBlockObject } from '@/app/_lib/services/block-migrations';

/**
 * Sanitize a single string value as rich text.
 * Returns '' for non-string input (defensive — callers occasionally pass null).
 */
export function cleanRichText(value, maxLength = 50000) {
  if (value == null) return value; // preserve null/undefined for "not provided"
  if (typeof value !== 'string') return value;
  return sanitizeRichText(value, maxLength);
}

/**
 * Sanitize a plain-text string. Strips all HTML.
 */
export function cleanPlainText(value, maxLength = 5000) {
  if (value == null) return value;
  if (typeof value !== 'string') return value;
  return sanitizeText(value, maxLength);
}

/**
 * Sanitize markdown source code-safely. Fenced code blocks and inline code
 * spans are masked before running the HTML sanitizer (the renderer escapes
 * code at display time, so `<vector>` in a fence is safe and must survive),
 * then restored. Raw inline HTML in the prose IS sanitized because marked
 * passes it through to dangerouslySetInnerHTML unchanged.
 *
 * @param {string} md
 * @param {number} [maxLength]
 * @returns {string}
 */
export function cleanMarkdown(md, maxLength = 50000) {
  if (md == null || typeof md !== 'string') return md;
  const masked = [];
  const withPlaceholders = md
    .slice(0, maxLength)
    .replace(
      /```[\s\S]*?(?:```|$)/g,
      (m) => `@@MD-CODE-${masked.push(m) - 1}@@`
    )
    .replace(/`[^`\n]+`/g, (m) => `@@MD-CODE-${masked.push(m) - 1}@@`);
  const cleaned = sanitizeRichText(withPlaceholders, maxLength);
  return cleaned.replace(/@@MD-CODE-(\d+)@@/g, (_, i) => masked[+i] ?? '');
}

/**
 * Sanitize a lesson `content` blob. Accepts either:
 *   - an array of blocks
 *   - { blocks: [...] }
 * Each block with a string `content` field is rich-text sanitized.
 * Block `data` is shape-validated lightly — unknown fields pass through to
 * preserve forward-compat (renderer ignores unknowns anyway).
 *
 * Unknown shapes (legacy strings, plain objects) are returned untouched on
 * the assumption the renderer never reads them via dangerouslySetInnerHTML.
 */
export function cleanLessonContent(content) {
  if (content == null) return content;

  let parsedContent = content;
  let isJson = false;

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (
        Array.isArray(parsed) ||
        (parsed && typeof parsed === 'object' && Array.isArray(parsed.blocks))
      ) {
        parsedContent = parsed;
        isJson = true;
      }
    } catch (e) {
      // Not a JSON block content string, treat as legacy rich-text string
    }
  }

  const sanitizeBlock = (block) => {
    if (!block || typeof block !== 'object') return block;
    let next = { ...block };
    if (next.type === 'html') {
      // Convert legacy admin-pasted inline-style code blocks to markdown
      // (the unified renderer no longer supports inline-styled html for code).
      // If migration succeeds, the block becomes a 'markdown' block and
      // skips the html-bypass path. If migration is not applicable (the
      // html block has legitimate non-code content), keep as html.
      const { migrated, block: migratedBlock } = migrateHtmlBlockObject(next);
      if (migrated) return migratedBlock;
      // Bypass rich-text sanitization for HTML block types to preserve custom admin-authored styling
    } else if (next.type === 'lessonPlan' && typeof next.content === 'string') {
      try {
        const parsed = JSON.parse(next.content);
        const cleaned = cleanLessonContent(parsed);
        next.content = JSON.stringify(cleaned);
      } catch (e) {
        // Keep as-is if parsing fails
      }
    } else if (next.type === 'markdown' && typeof next.content === 'string') {
      // Markdown carries literal `<...>` inside code fences/spans that the
      // HTML sanitizer would destroy — sanitize code-safely instead.
      next.content = cleanMarkdown(next.content);
    } else if (typeof next.content === 'string') {
      next.content = sanitizeRichText(next.content);
    }
    // Block `data` may carry nested text. Sanitize known fields conservatively.
    if (next.data && typeof next.data === 'object') {
      const data = { ...next.data };
      if (typeof data.caption === 'string')
        data.caption = sanitizeRichText(data.caption);
      if (typeof data.alt === 'string') data.alt = sanitizeText(data.alt, 500);
      if (typeof data.title === 'string')
        data.title = sanitizeText(data.title, 500);
      next.data = data;
    }
    return next;
  };

  let cleaned;
  if (Array.isArray(parsedContent)) {
    cleaned = parsedContent.map(sanitizeBlock);
  } else if (
    typeof parsedContent === 'object' &&
    Array.isArray(parsedContent.blocks)
  ) {
    cleaned = {
      ...parsedContent,
      blocks: parsedContent.blocks.map(sanitizeBlock),
    };
  } else if (typeof parsedContent === 'string') {
    // Legacy whole-document strings (pre-block-editor posts) run to ~130k
    // chars — the 50k default would silently truncate them on re-save.
    cleaned = sanitizeRichText(parsedContent, 500000);
  } else {
    cleaned = parsedContent;
  }

  if (isJson) {
    return JSON.stringify(cleaned);
  }
  return cleaned;
}

/**
 * Sanitize an array of exam questions in-place (returns a new array).
 * Each question can hold a rich-text `question` and an array of `options`.
 */
export function cleanExamQuestions(questions) {
  if (!Array.isArray(questions)) return questions;
  return questions.map((q) => {
    if (!q || typeof q !== 'object') return q;
    const next = { ...q };
    if (typeof next.question === 'string')
      next.question = sanitizeRichText(next.question);
    if (typeof next.explanation === 'string')
      next.explanation = sanitizeRichText(next.explanation);
    if (Array.isArray(next.options)) {
      next.options = next.options.map((opt) => {
        if (typeof opt === 'string') return sanitizeRichText(opt);
        if (opt && typeof opt === 'object' && typeof opt.text === 'string') {
          return { ...opt, text: sanitizeRichText(opt.text) };
        }
        return opt;
      });
    }
    return next;
  });
}

/**
 * Sanitize an array of practice problems.
 */
export function cleanPracticeProblems(problems) {
  if (!Array.isArray(problems)) return problems;
  return problems.map((p) => {
    if (!p || typeof p !== 'object') return p;
    const next = { ...p };
    if (typeof next.title === 'string')
      next.title = sanitizeText(next.title, 500);
    if (typeof next.statement === 'string')
      next.statement = sanitizeRichText(next.statement);
    if (typeof next.description === 'string')
      next.description = sanitizeRichText(next.description);
    if (typeof next.solution === 'string')
      next.solution = sanitizeRichText(next.solution);
    return next;
  });
}

/**
 * Sanitize an array of attachments — keeps URL + filename, strips any HTML
 * out of label/description.
 */
export function cleanAttachments(attachments) {
  if (!Array.isArray(attachments)) return attachments;
  return attachments.map((a) => {
    if (!a || typeof a !== 'object') return a;
    const next = { ...a };
    if (typeof next.name === 'string') next.name = sanitizeText(next.name, 500);
    if (typeof next.label === 'string')
      next.label = sanitizeText(next.label, 500);
    if (typeof next.description === 'string')
      next.description = sanitizeRichText(next.description, 2000);
    return next;
  });
}
