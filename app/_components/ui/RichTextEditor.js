/**
 * @file Professional WYSIWYG rich text editor for blog writing.
 * Built on TipTap with drag-and-drop image upload, text formatting,
 * syntax-highlighted code blocks, and a polished toolbar.
 *
 * @module RichTextEditor
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Unlink,
  ImagePlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Minus,
  Maximize2,
  Minimize2,
  Palette,
  Eye,
  EyeOff,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lowlight = createLowlight(common);

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/** Adds `id` attributes to h2/h3 elements for TOC compatibility. */
function ensureHeadingIds(html) {
  if (typeof window === 'undefined') return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '', 'text/html');
    const used = new Set();
    for (const el of doc.querySelectorAll('h2, h3')) {
      let id = el.getAttribute('id') || slugify(el.textContent || '');
      if (!id) id = `section-${used.size + 1}`;
      let base = id;
      let i = 2;
      while (used.has(id)) id = `${base}-${i++}`;
      used.add(id);
      el.setAttribute('id', id);
    }
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f4f4f5',
  '#a1a1aa',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  disabled,
  active,
  title,
  children,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-150 ${
        disabled
          ? 'cursor-not-allowed text-gray-600'
          : active
            ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/30'
            : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-0.5 h-6 w-px bg-white/10" />;
}

function ToolbarGroup({ children }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

/** Inline link editing popover for the BubbleMenu */
function LinkPopover({ editor, onClose }) {
  const [url, setUrl] = useState(editor.getAttributes('link').href || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSave = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: trimmed })
        .run();
    }
    onClose();
  };

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-gray-900/95 p-1.5 shadow-2xl backdrop-blur-xl">
      <input
        ref={inputRef}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
          }
          if (e.key === 'Escape') onClose();
        }}
        placeholder="https://…"
        className="w-56 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
      />
      <button
        type="button"
        onClick={handleSave}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500"
        title="Save"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      {editor.isActive('link') && (
        <a
          href={editor.getAttributes('link').href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-blue-400"
          title="Open link"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          onClose();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
        title="Remove link"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Color picker popover */
function ColorPicker({ editor, onClose }) {
  const current = editor.getAttributes('textStyle').color || '';

  return (
    <div className="rounded-xl border border-white/15 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="mb-2 text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
        Text Color
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              editor.chain().focus().setColor(color).run();
              onClose();
            }}
            className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${
              current === color
                ? 'border-transparent ring-2 ring-white/60 ring-offset-1 ring-offset-gray-900'
                : 'border-white/10'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().unsetColor().run();
          onClose();
        }}
        className="mt-2 w-full rounded-lg px-2 py-1 text-[10px] text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        Reset color
      </button>
    </div>
  );
}

/** Image insertion dialog */
function ImageDialog({ onInsert, onUpload, uploading, onClose }) {
  const [tab, setTab] = useState('upload');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const fileRef = useRef(null);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-white">Insert Image</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white/8 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8">
          {[
            { id: 'upload', label: 'Upload' },
            { id: 'url', label: 'From URL' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 p-5">
          {tab === 'upload' ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-white/3 py-10 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5"
            >
              <ImagePlus className="mb-2 h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400">
                {uploading ? 'Uploading…' : 'Click to select or drag & drop'}
              </p>
              <p className="mt-1 text-[10px] text-gray-600">
                JPG, PNG, WebP, GIF — max 5 MB
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) onUpload(f, alt);
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-400">
                  Image URL
                </label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
                />
              </div>
              {url && (
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <img
                    src={url}
                    alt="Preview"
                    className="max-h-40 w-full bg-black/30 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-400">
              Alt Text (accessibility)
            </label>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image…"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/8 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-gray-400 hover:bg-white/5"
          >
            Cancel
          </button>
          {tab === 'url' && (
            <button
              type="button"
              disabled={!url.trim()}
              onClick={() => {
                onInsert(url.trim(), alt.trim());
                onClose();
              }}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
            >
              Insert
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Async image uploader ─────────────────────────────────────────────────────

async function uploadImage(
  uploadImageAction,
  file,
  setUploadError,
  setIsUploading
) {
  setUploadError('');
  setIsUploading(true);
  try {
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadImageAction(fd);
    if (res?.error) {
      setUploadError(res.error);
      return null;
    }
    if (!res?.url) {
      setUploadError('Upload failed.');
      return null;
    }
    return res.url;
  } catch {
    setUploadError('Upload failed.');
    return null;
  } finally {
    setIsUploading(false);
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing your blog post…',
  uploadImageAction,
}) {
  const lastEmittedRef = useRef(value || '');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const colorBtnRef = useRef(null);
  const colorPickerRef = useRef(null);
  const linkBtnRef = useRef(null);
  const linkPopoverRef = useRef(null);

  // Close color picker on outside click
  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e) => {
      if (
        colorBtnRef.current &&
        !colorBtnRef.current.contains(e.target) &&
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target)
      ) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showColorPicker]);

  // Close link popover on outside click
  useEffect(() => {
    if (!showLinkPopover) return;
    const handler = (e) => {
      if (
        linkBtnRef.current &&
        !linkBtnRef.current.contains(e.target) &&
        linkPopoverRef.current &&
        !linkPopoverRef.current.contains(e.target)
      ) {
        setShowLinkPopover(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLinkPopover]);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: true,
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-blue-400 underline underline-offset-2 cursor-pointer',
          rel: 'noopener noreferrer',
        },
      }),
      ImageExtension.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto',
          loading: 'lazy',
        },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
      CharacterCount,
      Typography,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'tiptap-editor-content prose prose-invert max-w-none focus:outline-none',
      },
      handleDrop: (view, event) => {
        const dt = event.dataTransfer;
        if (!dt?.files?.length) return false;
        const file = Array.from(dt.files).find((f) =>
          (f.type || '').startsWith('image/')
        );
        if (!file) return false;

        event.preventDefault();
        const coords = { left: event.clientX, top: event.clientY };
        const pos = view.posAtCoords(coords)?.pos;

        void (async () => {
          if (!uploadImageAction) return;
          const url = await uploadImage(
            uploadImageAction,
            file,
            setUploadError,
            setIsUploading
          );
          if (!url) return;
          editor
            ?.chain()
            .focus()
            .insertContentAt(pos ?? editor.state.selection.from, {
              type: 'image',
              attrs: { src: url, alt: file.name || 'image' },
            })
            .run();
        })();
        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items?.length) return false;
        const imageItem = Array.from(items).find((i) =>
          i.type?.startsWith('image/')
        );
        if (!imageItem) return false;

        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();

        void (async () => {
          if (!uploadImageAction) return;
          const url = await uploadImage(
            uploadImageAction,
            file,
            setUploadError,
            setIsUploading
          );
          if (!url) return;
          editor
            ?.chain()
            .focus()
            .setImage({ src: url, alt: file.name || 'image' })
            .run();
        })();
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ensureHeadingIds(ed.getHTML());
      lastEmittedRef.current = html;
      onChange?.(html);
    },
  });

  // Sync when external value changes (e.g. opening edit modal)
  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    const current = lastEmittedRef.current || '';
    if (incoming !== current && incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, false);
      lastEmittedRef.current = incoming;
    }
  }, [editor, value]);

  // Handle image upload from dialog
  const handleDialogUpload = useCallback(
    async (file, altText) => {
      if (!editor || !uploadImageAction) return;
      const url = await uploadImage(
        uploadImageAction,
        file,
        setUploadError,
        setIsUploading
      );
      if (!url) return;
      editor
        .chain()
        .focus()
        .setImage({ src: url, alt: altText || file.name || 'image' })
        .run();
      setShowImageDialog(false);
    },
    [editor, uploadImageAction]
  );

  // Handle image insert from URL
  const handleInsertImageUrl = useCallback(
    (url, altText) => {
      if (!editor || !url) return;
      editor
        .chain()
        .focus()
        .setImage({ src: url, alt: altText || 'image' })
        .run();
    },
    [editor]
  );

  // Toggle link
  const handleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      setShowLinkPopover(true);
    } else {
      const { from, to } = editor.state.selection;
      if (from === to) {
        const url = window.prompt('Enter URL', 'https://');
        if (!url?.trim()) return;
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${url.trim()}">${url.trim()}</a>`)
          .run();
      } else {
        setShowLinkPopover(true);
      }
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex min-h-75 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
          Loading editor…
        </div>
      </div>
    );
  }

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();

  return (
    <>
      <div
        className={`rich-text-editor overflow-hidden rounded-xl border border-white/10 bg-gray-950 transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : ''
        }`}
      >
        {/* ── Toolbar ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-white/8 bg-gray-950/80 px-2 py-1.5 backdrop-blur-xl">
          {/* Text formatting */}
          <ToolbarGroup>
            <ToolbarButton
              title="Bold (Ctrl+B)"
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Italic (Ctrl+I)"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Underline (Ctrl+U)"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Strikethrough"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Highlight"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive('highlight')}
            >
              <Highlighter className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Text color */}
          <div className="relative">
            <button
              ref={colorBtnRef}
              type="button"
              title="Text color"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-150 ${
                showColorPicker
                  ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/30'
                  : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              <Palette className="h-4 w-4" />
            </button>
            {showColorPicker && (
              <div
                ref={colorPickerRef}
                className="absolute top-full left-0 z-50 mt-1"
              >
                <ColorPicker
                  editor={editor}
                  onClose={() => setShowColorPicker(false)}
                />
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarGroup>
            <ToolbarButton
              title="Heading 2"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              active={editor.isActive('heading', { level: 2 })}
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 3"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              active={editor.isActive('heading', { level: 3 })}
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarGroup>
            <ToolbarButton
              title="Align left"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Align center"
              onClick={() =>
                editor.chain().focus().setTextAlign('center').run()
              }
              active={editor.isActive({ textAlign: 'center' })}
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Align right"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Justify"
              onClick={() =>
                editor.chain().focus().setTextAlign('justify').run()
              }
              active={editor.isActive({ textAlign: 'justify' })}
            >
              <AlignJustify className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Lists & blocks */}
          <ToolbarGroup>
            <ToolbarButton
              title="Bullet list"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Ordered list"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Blockquote"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Code block"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive('codeBlock')}
            >
              <Code2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Horizontal rule"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              active={false}
            >
              <Minus className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Link & Image */}
          <ToolbarGroup>
            <div className="relative">
              <button
                ref={linkBtnRef}
                type="button"
                title="Insert link"
                onClick={handleLink}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-150 ${
                  editor.isActive('link')
                    ? 'bg-blue-500/20 text-blue-400 shadow-sm ring-1 ring-blue-500/30'
                    : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              {showLinkPopover && (
                <div
                  ref={linkPopoverRef}
                  className="absolute top-full left-0 z-50 mt-1"
                >
                  <LinkPopover
                    editor={editor}
                    onClose={() => setShowLinkPopover(false)}
                  />
                </div>
              )}
            </div>
            {editor.isActive('link') && (
              <ToolbarButton
                title="Remove link"
                onClick={() => editor.chain().focus().unsetLink().run()}
                active={false}
              >
                <Unlink className="h-4 w-4" />
              </ToolbarButton>
            )}
            <ToolbarButton
              title="Insert image"
              onClick={() => setShowImageDialog(true)}
              active={false}
              disabled={!uploadImageAction}
            >
              <ImagePlus className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Undo / Redo */}
          <ToolbarGroup>
            <ToolbarButton
              title="Undo (Ctrl+Z)"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              active={false}
            >
              <Undo2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Redo (Ctrl+Shift+Z)"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              active={false}
            >
              <Redo2 className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          {/* Right-aligned controls */}
          <div className="ml-auto flex items-center gap-1">
            <ToolbarButton
              title={showPreview ? 'Edit mode' : 'Preview'}
              onClick={() => setShowPreview(!showPreview)}
              active={showPreview}
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </ToolbarButton>
            <ToolbarButton
              title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
              onClick={() => setIsFullscreen(!isFullscreen)}
              active={isFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </ToolbarButton>
          </div>
        </div>

        {/* ── Editor / Preview Area ──────────────────────────────────────────── */}
        <div
          className={`relative ${
            isFullscreen ? 'h-[calc(100vh-88px)] overflow-y-auto' : 'min-h-87.5'
          }`}
        >
          {showPreview ? (
            <div className="prose prose-invert max-w-none p-6">
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
            </div>
          ) : (
            <EditorContent editor={editor} />
          )}

          {/* Upload overlay */}
          {isUploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-gray-900/90 px-5 py-3 shadow-2xl">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-sm font-medium text-gray-300">
                  Uploading image…
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Status Bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-white/8 bg-gray-950/60 px-3 py-1.5 text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              {words} {words === 1 ? 'word' : 'words'}
            </span>
            <span className="text-gray-700">·</span>
            <span>{chars} characters</span>
            <span className="text-gray-700">·</span>
            <span>~{Math.max(1, Math.round(words / 200))} min read</span>
          </div>
          <div className="flex items-center gap-2">
            {uploadError && <span className="text-red-400">{uploadError}</span>}
            {!showPreview && (
              <span className="hidden text-gray-600 sm:inline">
                Drag & drop images · Paste from clipboard
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Image Dialog ───────────────────────────────────────────────────── */}
      {showImageDialog && (
        <ImageDialog
          uploading={isUploading}
          onInsert={handleInsertImageUrl}
          onUpload={handleDialogUpload}
          onClose={() => setShowImageDialog(false)}
        />
      )}
    </>
  );
}
