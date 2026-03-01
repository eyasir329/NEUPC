/**
 * @file MessageComposer – Professional input bar with emoji picker,
 *       file/photo upload, auto-growing textarea, and character counter.
 *
 * Features:
 * - Auto-growing textarea
 * - Emoji picker (emoji-picker-react)
 * - Photo upload button (images only)
 * - File attachment button (all allowed types)
 * - File preview bar with remove
 * - Upload progress indicator
 * - Enter to send, Shift+Enter for newline
 * - Character counter near limit
 * - Error display with auto-dismiss
 *
 * @module MessageComposer
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/app/_lib/utils';
import {
  sendMessageAction,
  sendFileMessageAction,
} from '@/app/_lib/chat-actions';
import {
  Send,
  Loader2,
  Smile,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
  File,
} from 'lucide-react';

// Lazy-load emoji picker to reduce initial bundle
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-87.5 w-75 items-center justify-center rounded-xl bg-[#202c33]">
      <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
    </div>
  ),
});

const MAX_LENGTH = 2000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageComposer({ conversationId, onMessageSent }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const emojiRef = useRef(null);

  /* ── Auto-resize ─────────────────────────────────────── */
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
  }, []);

  useEffect(() => autoResize(), [content, autoResize]);

  /* ── Close emoji picker on outside click ─────────────── */
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  /* ── File preview cleanup ────────────────────────────── */
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  /* ── Handle emoji select ─────────────────────────────── */
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      // Restore cursor position after emoji
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + emoji.length;
        el.focus();
      });
    } else {
      setContent((prev) => prev + emoji);
    }
  };

  /* ── Handle file selection ───────────────────────────── */
  const handleFileSelect = (e, imageOnly = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = imageOnly ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;
    if (!allowedTypes.includes(file.type)) {
      setError(
        imageOnly
          ? 'Please select an image (JPG, PNG, GIF, WebP).'
          : 'File type not supported.'
      );
      setTimeout(() => setError(''), 4000);
      e.target.value = '';
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10 MB.');
      setTimeout(() => setError(''), 4000);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }

    e.target.value = '';
  };

  /* ── Remove selected file ────────────────────────────── */
  const removeFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  /* ── Send handler ────────────────────────────────────── */
  const handleSend = async () => {
    const trimmed = content.trim();
    if ((!trimmed && !selectedFile) || sending) return;

    setSending(true);
    setError('');

    let result;

    if (selectedFile) {
      // File/image message
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (trimmed) formData.append('caption', trimmed);
      result = await sendFileMessageAction(conversationId, formData);
    } else {
      // Text message
      result = await sendMessageAction(conversationId, trimmed);
    }

    if (result.error) {
      setError(result.error);
      setSending(false);
      setTimeout(() => setError(''), 4000);
      return;
    }

    setContent('');
    removeFile();
    setSending(false);
    setShowEmoji(false);
    onMessageSent?.();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = content.length;
  const showCount = charCount > MAX_LENGTH * 0.8;
  const overLimit = charCount > MAX_LENGTH;
  const canSend = (content.trim() || selectedFile) && !sending && !overLimit;

  return (
    <div className="bg-[#202c33] px-3 py-2">
      {/* Error */}
      {error && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#ea4335]/10 px-3 py-2 ring-1 ring-[#ea4335]/20">
          <svg
            className="h-4 w-4 shrink-0 text-[#ea4335]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          <p className="text-[12px] text-[#ea4335]">{error}</p>
        </div>
      )}

      {/* ── File preview bar ───────────────────────────── */}
      {selectedFile && (
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-[#111b21]/60 px-3 py-2 ring-1 ring-[#2a3942]/40">
          {/* Preview thumbnail or file icon */}
          {filePreview ? (
            <img
              src={filePreview}
              alt="Preview"
              className="h-12 w-12 shrink-0 rounded-md object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#00a884]/15 ring-1 ring-white/5">
              {selectedFile.type.includes('pdf') ? (
                <FileText className="h-5 w-5 text-[#00a884]" />
              ) : (
                <File className="h-5 w-5 text-[#00a884]" />
              )}
            </div>
          )}

          {/* File info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[#e9edef]">
              {selectedFile.name}
            </p>
            <p className="text-[11px] text-[#8696a0]">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>

          {/* Remove button */}
          <button
            onClick={removeFile}
            className="shrink-0 rounded-full p-1 text-[#8696a0] transition-colors hover:bg-[#2a3942] hover:text-[#e9edef]"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Emoji picker ───────────────────────────────── */}
      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-15 left-2 z-30">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            width={300}
            height={350}
            searchPlaceholder="Search emoji..."
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis
          />
        </div>
      )}

      <div className="flex items-end gap-1.5">
        {/* ── Emoji button ─────────────────────────────── */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={cn(
            'mb-1.25 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
            showEmoji ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'
          )}
          aria-label="Emoji picker"
        >
          <Smile className="h-5.5 w-5.5" />
        </button>

        {/* ── Attachment button ─────────────────────────── */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mb-1.25 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#8696a0] transition-colors duration-200 hover:text-[#e9edef]"
          aria-label="Attach file"
          disabled={sending}
        >
          <Paperclip className="h-5.5 w-5.5" />
        </button>

        {/* ── Image button ─────────────────────────────── */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="mb-1.25 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#8696a0] transition-colors duration-200 hover:text-[#e9edef]"
          aria-label="Send photo"
          disabled={sending}
        >
          <ImageIcon className="h-5.5 w-5.5" />
        </button>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={(e) => handleFileSelect(e, false)}
        />
        <input
          ref={imageInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={(e) => handleFileSelect(e, true)}
        />

        {/* ── Textarea ─────────────────────────────────── */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? 'Add a caption...' : 'Type a message'}
            rows={1}
            maxLength={MAX_LENGTH}
            className={cn(
              'w-full resize-none rounded-lg bg-[#2a3942] px-3 py-2.5',
              'text-[15px] leading-5 text-[#d1d7db] placeholder-[#8696a0]',
              'border-none outline-none',
              'max-h-32 overflow-y-auto',
              'transition-colors focus:bg-[#323f4a]'
            )}
            style={{ minHeight: '42px' }}
            disabled={sending}
          />
          {/* Character counter */}
          {showCount && (
            <span
              className={cn(
                'absolute right-2 bottom-1 text-[10px] tabular-nums',
                overLimit ? 'text-[#ea4335]' : 'text-[#8696a0]'
              )}
            >
              {charCount}/{MAX_LENGTH}
            </span>
          )}
        </div>

        {/* ── Send ─────────────────────────────────────── */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            'mb-1.25 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200',
            canSend
              ? 'bg-[#00a884] text-[#111b21] shadow-[0_2px_8px_rgba(0,168,132,.3)] hover:bg-[#06cf9c]'
              : 'text-[#8696a0]'
          )}
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
