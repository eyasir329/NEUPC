/**
 * @file ChatPanelHeader – Professional chat panel header.
 *
 * Features:
 * - Thread view: avatar + name + role badge + online indicator
 * - Context menu for close conversation
 * - Fullscreen toggle
 * - Clean WhatsApp-inspired dark design
 *
 * @module ChatPanelHeader
 */

'use client';

import { useState } from 'react';
import { cn } from '@/app/_lib/utils';
import { getInitials } from '@/app/_lib/utils';
import { closeConversationAction } from '@/app/_lib/chat-actions';
import {
  ArrowLeft,
  Plus,
  X,
  MoreVertical,
  Maximize2,
  Minimize2,
  Users,
} from 'lucide-react';

const ROLE_BADGE = {
  member: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
  executive: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  admin: { bg: 'bg-red-500/15', text: 'text-red-400' },
  mentor: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  advisor: { bg: 'bg-teal-500/15', text: 'text-teal-400' },
};

export default function ChatPanelHeader({
  title,
  subtitle,
  showBack,
  showNewChat,
  onBack,
  onNewChat,
  onClose,
  activeConversation,
  session,
  isFullscreen,
  onToggleFullscreen,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [closing, setClosing] = useState(false);

  const isGroup = activeConversation?.type === 'group';

  const canClose =
    !isGroup &&
    activeConversation?.status === 'open' &&
    (session?.user?.role === 'executive' ||
      session?.user?.role === 'admin' ||
      activeConversation?.created_by === session?.user?.id);

  const handleCloseConv = async () => {
    if (!activeConversation?.id) return;
    setClosing(true);
    try {
      await closeConversationAction(activeConversation.id);
      onBack?.();
    } catch {
      /* silent */
    } finally {
      setClosing(false);
      setShowMenu(false);
    }
  };

  const other = activeConversation?.otherUser || activeConversation?.guestUser;
  const avatar = other?.avatar_url;
  const otherName = other?.full_name;
  const otherRole = other?.role;
  const isThread = !!activeConversation && showBack;
  const badge = ROLE_BADGE[otherRole] || null;

  return (
    <div className="flex items-center gap-2.5 bg-[#202c33] px-2.5 py-2 shadow-[0_1px_3px_rgba(0,0,0,.25)]">
      {/* Back */}
      {showBack && (
        <button
          onClick={onBack}
          className="rounded-full p-1.5 text-[#aebac1] transition-colors hover:bg-[#374752] hover:text-[#e9edef]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
      )}

      {/* Thread avatar */}
      {isThread && (
        <div className="relative shrink-0">
          {isGroup ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#00a884] to-[#025144] ring-2 ring-[#2a3942]">
              <Users className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
            </div>
          ) : avatar && !avatar.match(/^[A-Z?]{1,2}$/) ? (
            <img
              src={avatar}
              alt={otherName || 'User'}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-[#2a3942]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#00a884] to-[#00876d] text-sm font-semibold text-white ring-2 ring-[#2a3942]">
              {getInitials(otherName || title)}
            </div>
          )}
        </div>
      )}

      {/* Title area */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] leading-tight font-semibold text-[#e9edef]">
          {title}
        </h3>
        {isThread && !isGroup && badge && otherRole && (
          <span
            className={cn(
              'mt-0.5 inline-block rounded-full px-2 py-px text-[10px] font-semibold capitalize',
              badge.bg,
              badge.text
            )}
          >
            {otherRole}
          </span>
        )}
        {isThread && isGroup && (
          <p className="mt-0.5 text-[11px] text-[#8696a0]">
            {activeConversation?.groupInfo?.memberCount || 0} members
          </p>
        )}
        {!isThread && !showBack && (
          <p className="text-[11px] text-[#8696a0]">NEUPC messaging</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        {/* Context menu */}
        {activeConversation && canClose && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((p) => !p)}
              className="rounded-full p-2 text-[#aebac1] transition-colors hover:bg-[#374752] hover:text-[#e9edef]"
              aria-label="Options"
            >
              <MoreVertical className="h-4.5 w-4.5" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute top-full right-0 z-20 mt-1 min-w-40 overflow-hidden rounded-lg bg-[#233138] py-1 shadow-xl ring-1 shadow-black/40 ring-white/5">
                  <button
                    onClick={handleCloseConv}
                    disabled={closing}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-[#e9edef] transition-colors hover:bg-[#374752] disabled:opacity-50"
                  >
                    <X className="h-4 w-4 text-[#ea4335]" />
                    {closing ? 'Closing...' : 'Close conversation'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* New chat */}
        {showNewChat && (
          <button
            onClick={onNewChat}
            className="rounded-full p-2 text-[#aebac1] transition-colors hover:bg-[#374752] hover:text-[#e9edef]"
            aria-label="New chat"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </button>
        )}

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="hidden rounded-full p-2 text-[#aebac1] transition-colors hover:bg-[#374752] hover:text-[#e9edef] sm:flex"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>

        {/* Close panel */}
        <button
          onClick={onClose}
          className="rounded-full p-2 text-[#aebac1] transition-colors hover:bg-[#374752] hover:text-[#e9edef]"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
