/**
 * @file MessageBubble - WhatsApp-style chat bubble with tail
 * @module MessageBubble
 */

'use client';

import { useState } from 'react';
import { cn } from '@/app/_lib/utils';
import { getInitials } from '@/app/_lib/utils';
import {
  editMessageAction,
  deleteMessageAction,
} from '@/app/_lib/chat-actions';
import { ChevronDown, Pencil, Trash2, X, Check } from 'lucide-react';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MessageBubble({ message, isOwn, showTail = false }) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const isDeleted = !!message.deleted_at;
  const isEdited = !!message.edited_at && !isDeleted;
  const sender = message.sender || {};
  const name = sender.full_name || 'User';

  const canModify =
    isOwn &&
    !isDeleted &&
    Date.now() - new Date(message.created_at).getTime() < 5 * 60 * 1000;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.trim() === message.content) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const result = await editMessageAction(message.id, editContent.trim());
    setSaving(false);
    if (!result.error) {
      message.content = editContent.trim();
      message.edited_at = new Date().toISOString();
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return;
    const result = await deleteMessageAction(message.id);
    if (!result.error) {
      message.deleted_at = new Date().toISOString();
      setShowMenu(false);
    }
  };

  const startEdit = () => {
    setEditContent(message.content);
    setEditing(true);
    setShowMenu(false);
  };

  if (isDeleted) {
    return (
      <div
        className={cn(
          'flex px-[8%] py-px',
          isOwn ? 'justify-end' : 'justify-start'
        )}
      >
        <div className="rounded-lg bg-[#182229] px-3 py-1.5">
          <p className="text-[13px] text-[#8696a0] italic">
            <span className="mr-1 inline-block">🚫</span>
            This message was deleted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex px-[4%] py-px',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[85%] rounded-lg px-2 pt-1.5 pb-1.25 shadow-sm',
          isOwn
            ? cn('bg-[#005c4b]', showTail && 'rounded-tr-none')
            : cn('bg-[#202c33]', showTail && 'rounded-tl-none')
        )}
      >
        {/* WhatsApp tail */}
        {showTail && (
          <div
            className={cn(
              'absolute top-0 h-0 w-0',
              isOwn
                ? '-right-2 border-t-12 border-l-8 border-t-[#005c4b] border-l-transparent'
                : '-left-2 border-t-12 border-r-8 border-t-[#202c33] border-r-transparent'
            )}
          />
        )}

        {/* Sender name (received messages, group-like) */}
        {!isOwn && showTail && (
          <p className="mb-0.5 text-[12.5px] font-medium text-[#00a884]">
            {name}
          </p>
        )}

        {/* Menu trigger */}
        {canModify && !editing && (
          <div
            className={cn(
              'absolute top-1 z-10 opacity-0 transition-opacity group-hover:opacity-100',
              isOwn ? 'right-1' : 'right-1'
            )}
          >
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded p-0.5 text-white/40 hover:text-white/70"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className={cn(
                    'absolute z-20 mt-1 overflow-hidden rounded-md bg-[#233138] py-1 shadow-xl shadow-black/40',
                    isOwn ? 'right-0' : 'left-0'
                  )}
                >
                  <button
                    onClick={startEdit}
                    className="flex w-full items-center gap-3 px-6 py-2.5 text-sm text-[#e9edef] hover:bg-[#374752]"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-3 px-6 py-2.5 text-sm text-[#ea4335] hover:bg-[#374752]"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        {editing ? (
          <div className="flex flex-col gap-1.5 pr-6">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full resize-none rounded bg-[#111b21]/60 px-2 py-1.5 text-[14.2px] text-[#e9edef] outline-none"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end gap-1">
              <button
                onClick={() => setEditing(false)}
                className="rounded-full bg-[#374752] p-1.5 text-[#8696a0] hover:text-[#e9edef]"
                disabled={saving}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleEdit}
                className="rounded-full bg-[#00a884] p-1.5 text-[#111b21] hover:bg-[#06cf9c]"
                disabled={saving}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <p className="min-w-0 text-[14.2px] leading-4.75 whitespace-pre-wrap text-[#e9edef]">
              {message.content}
            </p>
            {/* Inline timestamp (WhatsApp style) */}
            <span className="flex shrink-0 items-center gap-0.5 self-end pb-px">
              {isEdited && (
                <span className="text-[11px] text-white/40">edited</span>
              )}
              <span
                className={cn(
                  'text-[11px] leading-none',
                  isOwn ? 'text-white/50' : 'text-[#8696a0]'
                )}
              >
                {formatTime(message.created_at)}
              </span>
              {/* Double check for own messages */}
              {isOwn && (
                <svg
                  className="h-3.75 w-3.75 text-[#53bdeb]"
                  viewBox="0 0 16 15"
                  fill="currentColor"
                >
                  <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.434a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                </svg>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
