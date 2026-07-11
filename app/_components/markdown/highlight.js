/**
 * @file Markdown syntax-highlight helpers (shared)
 * @module markdown/highlight
 *
 * Single source of truth for lowlight + hastToString + createMarkdownRenderer.
 * Previously duplicated in:
 *   - app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer.js
 *   - app/account/_components/events/EventContentRenderer.js
 *   - app/account/member/bootcamps/[bootcampId]/_components/BootcampLearningClient.js
 */

import { marked } from 'marked';
import { createLowlight, common } from 'lowlight';

// Single lowlight instance shared by all renderers.
const lowlight = createLowlight(common);

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convert a hast (hypertext AST) tree produced by lowlight into an HTML string
 * with classes preserved. Used to inline the highlighted code into the
 * <code> element of the canonical .md-pre structure.
 */
export function hastToString(node) {
  if (!node) return '';
  if (node.type === 'text') return escapeHtml(node.value);
  if (node.type === 'element') {
    const cls = node.properties?.className;
    const ca = cls
      ? ` class="${Array.isArray(cls) ? cls.join(' ') : cls}"`
      : '';
    return `<${node.tagName}${ca}>${(node.children || [])
      .map(hastToString)
      .join('')}</${node.tagName}>`;
  }
  if (node.type === 'root')
    return (node.children || []).map(hastToString).join('');
  return '';
}

/**
 * Highlight source code in the given language. Falls back to escaped
 * plain text if lowlight cannot highlight (unknown language).
 */
export function highlightCode(code, lang) {
  try {
    const l = (lang || '').trim().toLowerCase();
    if (l && lowlight.registered(l))
      return hastToString(lowlight.highlight(l, code));
  } catch {
    /* fall through */
  }
  return escapeHtml(code);
}

/**
 * Build a marked.Renderer pre-configured with the canonical code-block
 * structure. The output is the `.md-code-block > .md-code-header > ...
 * > .md-pre code.hljs` chain consumed by the unified CSS in global.css.
 *
 * Callers should use:
 *     const { renderer, processMarkdown } = createMarkdownRenderer();
 *     processMarkdown('text');   // returns full HTML
 */
export function createMarkdownRenderer() {
  const renderer = new marked.Renderer();

  // --- Block-level ---

  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const sz = {
      1: '1.375rem',
      2: '1.125rem',
      3: '1rem',
      4: '0.9rem',
      5: '0.85rem',
      6: '0.8rem',
    };
    return `<h${depth} class="md-h md-h${depth}" style="font-size:${
      sz[depth] || '1rem'
    }">${text}</h${depth}>\n`;
  };

  renderer.paragraph = function ({ tokens }) {
    return `<p class="md-p">${this.parser.parseInline(tokens)}</p>\n`;
  };

  renderer.blockquote = function ({ tokens }) {
    return `<blockquote class="md-bq">${this.parser.parse(
      tokens
    )}</blockquote>\n`;
  };

  renderer.hr = () => `<hr class="md-hr">\n`;

  renderer.list = function (token) {
    const { ordered, start, items } = token;
    let body = '';
    for (const item of items) body += this.listitem(item);
    const tag = ordered ? 'ol' : 'ul';
    const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
    return `<${tag} class="md-${tag}"${startAttr}>${body}</${tag}>\n`;
  };

  renderer.listitem = function (item) {
    const body = this.parser.parse(item.tokens);
    if (item.task) {
      return `<li class="md-li md-task"><input type="checkbox" ${
        item.checked ? 'checked' : ''
      } disabled> ${body.replace(
        /^\s*<p[^>]*>(.*)<\/p>\s*$/s,
        '$1'
      )}</li>\n`;
    }
    const inner = item.loose
      ? body
      : body.replace(/^\s*<p[^>]*>(.*)<\/p>\s*$/s, '$1');
    return `<li class="md-li">${inner}</li>\n`;
  };

  renderer.table = function (token) {
    let headerHtml = '';
    for (const cell of token.header) {
      const text = this.parser.parseInline(cell.tokens);
      const al = cell.align ? ` style="text-align:${cell.align}"` : '';
      headerHtml += `<th class="md-th"${al}>${text}</th>`;
    }
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

  renderer.code = ({ text, lang }) => {
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

  renderer.strong = function ({ tokens }) {
    return `<strong class="md-strong">${this.parser.parseInline(
      tokens
    )}</strong>`;
  };

  renderer.em = function ({ tokens }) {
    return `<em class="md-em">${this.parser.parseInline(tokens)}</em>`;
  };

  renderer.codespan = ({ text }) =>
    `<code class="md-inline-code">${escapeHtml(text)}</code>`;

  renderer.link = function ({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<a href="${href}" class="md-a"${
      title ? ` title="${escapeHtml(title)}"` : ''
    } target="_blank" rel="noopener">${text}</a>`;
  };

  renderer.image = ({ href, text, title }) =>
    `<img src="${href}" alt="${escapeHtml(text || '')}"${
      title ? ` title="${escapeHtml(title)}"` : ''
    } class="md-img" loading="lazy">`;

  function processMarkdown(markdown) {
    if (!markdown) return '';
    try {
      return marked.parse(markdown, {
        gfm: true,
        breaks: true,
        renderer,
      });
    } catch {
      return '<p>Failed to parse markdown.</p>';
    }
  }

  return { renderer, processMarkdown, escapeHtml, highlightCode, lowlight };
}
