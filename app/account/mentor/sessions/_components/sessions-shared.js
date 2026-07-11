/**
 * @file Shared helpers for the mentor sessions screens.
 * @module sessions-shared
 */

'use client';

import dynamic from 'next/dynamic';

const MultiBlockEditor = dynamic(
  () => import('@/app/account/admin/bootcamps/_components/MultiBlockEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/2" />
    ),
  }
);
function descriptionPreview(desc) {
  if (!desc) return '';
  try {
    const blocks = JSON.parse(desc);
    if (Array.isArray(blocks)) {
      return blocks
        .map((b) => b.content || '')
        .join(' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  } catch {}
  return desc
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function TaskDescriptionRenderer({ content }) {
  if (!content) return null;
  let html = '';
  try {
    const blocks = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(blocks)) {
      html = blocks.map((b) => b.content || '').join('');
    } else {
      html = content;
    }
  } catch {
    html = content;
  }
  if (!html) return null;
  return (
    <div
      className="tiptap-viewer-content text-[13px] whitespace-pre-wrap text-gray-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
const formatDatetime = (d) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });


export { MultiBlockEditor, descriptionPreview, TaskDescriptionRenderer, formatDate, formatDatetime };
