'use client';

/**
 * @file <MarkdownPreview> shared component
 * @module markdown/MarkdownPreview
 *
 * Drop-in replacement for the two duplicate MarkdownPreview functions in
 * app/account/admin/bootcamps/_components/CurriculumBuilder.js and
 * app/account/admin/bootcamps/_components/LessonFullscreenEditorModal.js.
 *
 * Renders a small markdown preview under the .admin-preview scope class.
 * Used for inline editorial previews inside practice/exam editors.
 */

import MarkdownRenderer from './MarkdownRenderer';

export default function MarkdownPreview({ text, className = '' }) {
  if (!text) return null;
  return (
    <MarkdownRenderer
      source={text}
      scope="admin-preview"
      className={className}
    />
  );
}