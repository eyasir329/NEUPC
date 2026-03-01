/**
 * @file ConversationItem – Professional conversation row.
 *
 * Features:
 * - Avatar with gradient fallback + online dot
 * - Smart timestamp (now / 5m / 2h / Yesterday / Mon / Jan 5)
 * - Unread badge with accent color
 * - Read receipt double-check SVG
 * - Hover highlight
 *
 * @module ConversationItem
 */

'use client';

import { memo } from 'react';
import { cn } from '@/app/_lib/utils';
import { getInitials } from '@/app/_lib/utils';
import { Users } from 'lucide-react';

/* ── Smart timestamp ───────────────────────────────────── */
function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);

  // Today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  // This week
  if (diffHours < 168) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // Older
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Double-check SVG ──────────────────────────────────── */
function ReadReceipt({ className }) {
  return (
    <svg
      className={cn('inline-block h-4 w-4', className)}
      viewBox="0 0 16 15"
      fill="currentColor"
    >
      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.434a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
    </svg>
  );
}

export default memo(function ConversationItem({
  conversation,
  currentUserId,
  onClick,
  isSupport = false,
}) {
  const isGroup = conversation.type === 'group';
  const other = isSupport ? conversation.guestUser : conversation.otherUser;
  const name = isGroup
    ? conversation.groupInfo?.name || 'Group'
    : other?.full_name || 'Unknown User';
  const avatar = isGroup ? null : other?.avatar_url;
  const lastMsg = conversation.lastMessage;
  const unread = conversation.unreadCount || 0;
  const isClosed = conversation.status === 'closed';
  const isUnassigned = isSupport && !conversation.assigned_to;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 px-3 py-2 text-left',
        'transition-colors duration-100',
        'hover:bg-[#2a3942]/70',
        'focus-visible:bg-[#2a3942]/70 focus-visible:outline-none',
        unread > 0 && 'bg-[#1c2a32]/60'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {isGroup ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#00a884] to-[#025144] ring-1 ring-white/5">
            <Users className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
        ) : avatar && !avatar.match(/^[A-Z?]{1,2}$/) ? (
          <img
            src={avatar}
            alt={name}
            className="h-12 w-12 rounded-full object-cover ring-1 ring-white/5"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#00a884] to-[#00876d] text-base font-semibold text-white ring-1 ring-white/5">
            {getInitials(name)}
          </div>
        )}
        {/* Unassigned support indicator */}
        {isUnassigned && (
          <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-[#111b21] bg-amber-400" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 border-b border-[#222d34]/80 py-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              'truncate text-[15px] leading-tight',
              unread > 0
                ? 'font-semibold text-[#e9edef]'
                : 'font-normal text-[#e9edef]'
            )}
          >
            {name}
            {isGroup && (
              <span className="ml-1.5 text-[11px] font-normal text-[#8696a0]">
                · {conversation.groupInfo?.memberCount || 0}
              </span>
            )}
          </span>
          {lastMsg && (
            <span
              className={cn(
                'shrink-0 text-[11px] tabular-nums',
                unread > 0 ? 'font-medium text-[#00a884]' : 'text-[#8696a0]'
              )}
            >
              {formatTimestamp(lastMsg.created_at)}
            </span>
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-3">
          <p className="truncate text-[13px] leading-snug text-[#8696a0]">
            {isClosed ? (
              <span className="text-[#6b7b8d] italic">Conversation closed</span>
            ) : lastMsg ? (
              <>
                {!isGroup && lastMsg.sender_id === currentUserId && (
                  <ReadReceipt className="mr-0.5 align-text-bottom text-[#53bdeb]" />
                )}
                {isGroup && lastMsg.sender_name && (
                  <span className="font-medium text-[#aebac1]">
                    {lastMsg.sender_id === currentUserId
                      ? 'You'
                      : lastMsg.sender_name.split(' ')[0]}
                    :{' '}
                  </span>
                )}
                <span>
                  {lastMsg.message_type === 'image'
                    ? '📷 Photo'
                    : lastMsg.message_type === 'file'
                      ? `📎 ${lastMsg.metadata?.filename || 'File'}`
                      : lastMsg.content}
                </span>
              </>
            ) : isSupport && conversation.subject ? (
              <span>{conversation.subject}</span>
            ) : (
              <span className="text-[#6b7b8d] italic">No messages yet</span>
            )}
          </p>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#00a884] px-1 text-[11px] font-bold text-[#111b21] tabular-nums">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});
