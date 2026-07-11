'use client';

/**
 * @file Canonical <CodeBlock> component (shared)
 * @module markdown/CodeBlock
 *
 * Single source of truth for the code-block UI. Replaces 7 duplicated
 * implementations across bootcamp lessons, events, resources, roadmaps,
 * mentor tasks, and admin editors.
 *
 * The structure produced here is consumed by the unified .md-* and .hljs-*
 * CSS rules in app/_styles/global.css. No <style> tag is injected at render
 * time.
 */

import { useCallback, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { highlightCode } from './highlight';

/**
 * <CodeBlock lang="cpp">const int x = 1;</CodeBlock>
 *
 * Children is the source code as a string. `lang` is the language identifier
 * (e.g. 'js', 'python', 'cpp'). When omitted, the header label shows "code".
 */
export default function CodeBlock({ lang = '', children }) {
  const [copied, setCopied] = useState(false);
  const code = typeof children === 'string' ? children : String(children || '');
  const language = (lang || '').trim().toLowerCase();

  const highlighted = useMemo(
    () => highlightCode(code, language),
    [code, language]
  );

  const handleCopy = useCallback(() => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="md-code-block" data-has-copy="true">
      <div className="md-code-header">
        <span className="md-code-lang">{language || 'code'}</span>
        <button
          type="button"
          className={`md-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="mr-1 inline h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-1 inline h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="md-code-scroll">
        <pre className="md-pre">
          <code
            className={`language-${language} hljs`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    </div>
  );
}

/**
 * Server-safe HTML string emitter. Returns the same canonical structure as
 * <CodeBlock> but as an HTML string. Used by callers that need to embed the
 * code block inside a larger HTML blob (e.g. marked renderers, regex
 * transformers). The copy button does not get a JS handler — those callers
 * must wire `data-copy-btn` listeners separately if they need a working copy
 * button.
 */
export function renderCodeBlockHtml(lang = '', code = '') {
  const language = (lang || '').trim().toLowerCase();
  const highlighted = highlightCode(code, language);
  return [
    `<div class="md-code-block" data-has-copy="true">`,
    `  <div class="md-code-header">`,
    `    <span class="md-code-lang">${language || 'code'}</span>`,
    `    <button class="md-copy-btn" data-copy-btn="true">Copy</button>`,
    `  </div>`,
    `  <div class="md-code-scroll">`,
    `    <pre class="md-pre"><code class="language-${language} hljs">${highlighted}</code></pre>`,
    `  </div>`,
    `</div>`,
  ].join('\n');
}
