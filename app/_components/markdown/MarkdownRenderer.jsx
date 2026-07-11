'use client';

/**
 * @file <MarkdownRenderer> shared component
 * @module markdown/MarkdownRenderer
 *
 * Renders a markdown source string into the unified .md-viewer structure.
 * The CSS lives in app/_styles/global.css (scoped under the viewer's scope
 * class). No <style> tag is injected at render time.
 *
 * Previously duplicated as:
 *   - LessonContentRenderer.js "processMarkdown" + inline <style>
 *   - EventContentRenderer.js "processMarkdown" + inline <style>
 *   - BootcampLearningClient.js "processMarkdown" + inline <style>
 */

import { useMemo, useRef, useEffect } from 'react';
import { createMarkdownRenderer } from './highlight';

/**
 * @param {object} props
 * @param {string} props.source - Markdown source string
 * @param {string} props.scope - Scope class added to outer wrapper, e.g. 'lesson-viewer', 'event-viewer', 'admin-preview'. Required to opt into the global CSS.
 * @param {string} [props.className] - Extra class names
 */
export default function MarkdownRenderer({
  source,
  scope,
  className = '',
  onCopyWired,
}) {
  const containerRef = useRef(null);
  const { processMarkdown } = useMemo(() => createMarkdownRenderer(), []);
  const html = useMemo(() => processMarkdown(source || ''), [source, processMarkdown]);

  // Wire copy buttons inside the rendered container. Mirrors the previous
  // useEffect logic in LessonContentRenderer / EventContentRenderer.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const btns = container.querySelectorAll('[data-copy-btn]');
    const wired = [];
    btns.forEach((btn) => {
      if (btn._wired) return;
      btn._wired = true;
      if (btn.hasAttribute('onclick')) btn.removeAttribute('onclick');
      const handler = () => {
        const code =
          btn.closest('[data-has-copy="true"]')?.querySelector('code') ||
          btn.closest('.md-code-block')?.querySelector('code') ||
          btn.closest('div')?.nextElementSibling?.querySelector('code');
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
      };
      btn.addEventListener('click', handler);
      wired.push([btn, handler]);
    });
    return () => {
      wired.forEach(([btn, handler]) => btn.removeEventListener('click', handler));
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`md-viewer ${scope || ''} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Server-safe variant: returns an HTML string. Useful for contexts where a
 * React component can't be used (e.g. legacy inline rendering paths).
 *
 * @param {string} source - Markdown source
 * @returns {string} HTML string
 */
export function renderMarkdownHtml(source) {
  const { processMarkdown } = createMarkdownRenderer();
  return processMarkdown(source);
}