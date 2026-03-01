/**
 * @file ConversationItem - WhatsApp-style conversation row
 * @module ConversationItem
 */

'use client';

import { cn } from '@/app/_lib/utils';
import { getInitials } from '@/app/_lib/utils';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function ConversationItem({
  conversation,
  currentUserId,
  onClick,
  isSupport = false,
}) {
  const other = isSupport ? conversation.guestUser : conversation.otherUser;
  const name = other?.full_name || 'Unknown User';
  const avatar = other?.avatar_url;
  const lastMsg = conversation.lastMessage;
  const unread = conversation.unreadCount || 0;
  const isUnassigned = isSupport && !conversation.assigned_to;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2.5 text-left',
        'transition-colors duration-100 hover:bg-[#2a3942]',
        unread > 0 && 'bg-[#1a272e]'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {avatar && !avatar.match(/^[A-Z?]{1,2}$/) ? (
          <img
            src={avatar}
            alt={name}
            className="h-12.25 w-12.25 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-12.25 w-12.25 items-center justify-center rounded-full bg-[#6b7b8d] text-lg font-medium text-white">
            {getInitials(name)}
          </div>
        )}
        {isUnassigned && (
          <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-[#111b21] bg-[#ffc107]" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 border-b border-[#222d34] py-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              'truncate text-[17px] leading-tight',
              unread > 0
                ? 'font-normal text-[#e9edef]'
                : 'font-normal text-[#e9edef]'
            )}
          >
            {name}
          </span>
          {lastMsg && (
            <span
              className={cn(
                'shrink-0 text-xs',
                unread > 0 ? 'text-[#00a884]' : 'text-[#8696a0]'
              )}
            >
              {timeAgo(lastMsg.created_at)}
            </span>
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-3">
          <p className="truncate text-sm text-[#8696a0]">
            {conversation.status === 'closed' ? (
              <span className="italic">Conversation closed</span>
            ) : lastMsg ? (
              <>
                {lastMsg.sender_id === currentUserId && (
                  <span className="mr-0.5 text-[#8696a0]">
                    {/* Double check SVG */}
                    <svg
                      className="mr-0.5 inline h-4 w-4 align-text-bottom"
                      viewBox="0 0 16 15"
                      fill="currentColor"
                    >
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.434a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                    </svg>
                  </span>
                )}
                {lastMsg.content}
              </>
            ) : isSupport && conversation.subject ? (
              conversation.subject
            ) : (
              <span className="italic">No messages yet</span>
            )}
          </p>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#00a884] px-1 text-[11px] font-bold text-[#111b21]">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
