/**
 * @file ChatPanelHeader - WhatsApp-style header
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
  Search,
} from 'lucide-react';

export default function ChatPanelHeader({
  title,
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

  const canClose =
    activeConversation?.status === 'open' &&
    (session?.user?.role === 'executive' ||
      session?.user?.role === 'admin' ||
      activeConversation?.created_by === session?.user?.id);

  const handleClose = async () => {
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

  // Get other user info for thread view
  const other = activeConversation?.otherUser || activeConversation?.guestUser;
  const avatar = other?.avatar_url;
  const otherName = other?.full_name;
  const otherRole = other?.role;
  const isThread = !!activeConversation && showBack;

  return (
    <div className="flex items-center gap-3 bg-[#202c33] px-3 py-2">
      {/* Back button */}
      {showBack && (
        <button
          onClick={onBack}
          className="rounded-full p-1 text-[#aebac1] transition-colors hover:text-[#e9edef]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      {/* Avatar in thread view */}
      {isThread && (
        <div className="shrink-0">
          {avatar && !avatar.match(/^[A-Z?]{1,2}$/) ? (
            <img
              src={avatar}
              alt={otherName || 'User'}
              className="h-10 w-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6b7b8d] text-sm font-medium text-white">
              {getInitials(otherName || title)}
            </div>
          )}
        </div>
      )}

      {/* Title area */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-medium text-[#e9edef]">
          {title}
        </h3>
        {isThread && otherRole && (
          <p className="truncate text-xs text-[#8696a0] capitalize">
            {otherRole}
          </p>
        )}
      </div>

      {/* Thread menu */}
      {activeConversation && canClose && (
        <div className="relative">
          <button
            onClick={() => setShowMenu((p) => !p)}
            className="rounded-full p-2 text-[#aebac1] transition-colors hover:bg-[#374752] hover:text-[#e9edef]"
            aria-label="Options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute top-full right-0 z-20 mt-1 w-44 overflow-hidden rounded-md bg-[#233138] py-1 shadow-xl shadow-black/40">
                <button
                  onClick={handleClose}
                  disabled={closing}
                  className="w-full px-6 py-2.5 text-left text-sm text-[#e9edef] transition-colors hover:bg-[#374752] disabled:opacity-50"
                >
                  {closing ? 'Closing...' : 'Close conversation'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* New chat button */}
      {showNewChat && (
        <button
          onClick={onNewChat}
          className="rounded-full p-2 text-[#aebac1] transition-colors hover:bg-[#374752] hover:text-[#e9edef]"
          aria-label="New chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {/* Fullscreen toggle */}
      <button
        onClick={onToggleFullscreen}
        className="hidden rounded-full p-2 text-[#aebac1] transition-colors hover:bg-[#374752] hover:text-[#e9edef] sm:block"
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
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
