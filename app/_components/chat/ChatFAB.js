/**
 * @file ChatFAB – Professional floating action button for the chat system.
 *
 * Features:
 * - Animated icon transition (message ↔ close)
 * - Pulsing unread badge with ring
 * - Smooth panel open/close with exit animation
 * - Keyboard accessible
 *
 * @module ChatFAB
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { getUnreadCountAction } from '@/app/_lib/chat-actions';
import ChatPanel from './ChatPanel';

const POLL_MS = 10_000;

export default function ChatFAB({ session }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [closing, setClosing] = useState(false);

  /* ── Unread polling ──────────────────────────────────── */
  const pollUnread = useCallback(async () => {
    if (!session?.user || document.hidden) return;
    try {
      const count = await getUnreadCountAction();
      setUnread(typeof count === 'number' ? count : 0);
    } catch {
      /* silent */
    }
  }, [session]);

  useEffect(() => {
    if (isOpen) return; // Panel handles its own data
    pollUnread();
    const id = setInterval(pollUnread, POLL_MS);
    return () => clearInterval(id);
  }, [pollUnread, isOpen]);

  /* ── Handlers ────────────────────────────────────────── */
  const openChat = useCallback(() => {
    setClosing(false);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsFullscreen(false);
      setClosing(false);
    }, 200);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) closeChat();
    else openChat();
  }, [isOpen, openChat, closeChat]);

  /* ── ESC to close ────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeChat();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, closeChat]);

  if (!session?.user) return null;

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────── */}
      <button
        onClick={toggle}
        className={cn(
          'fixed z-60 flex items-center justify-center',
          'h-14 w-14 rounded-full',
          'transition-all duration-300 ease-out',
          'active:scale-90',
          'right-5 bottom-5 sm:right-7 sm:bottom-7',
          'focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none',
          isFullscreen && 'pointer-events-none scale-0! opacity-0!',
          isOpen
            ? 'bg-[#374752] text-[#aebac1] shadow-lg shadow-black/30'
            : 'bg-[#00a884] text-white shadow-[0_4px_16px_rgba(0,168,132,.5)] hover:shadow-[0_6px_20px_rgba(0,168,132,.6)]'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
        tabIndex={isFullscreen ? -1 : 0}
      >
        {/* Icon crossfade */}
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-all duration-300',
            isOpen
              ? 'scale-0 rotate-90 opacity-0'
              : 'scale-100 rotate-0 opacity-100'
          )}
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2} />
        </span>
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-all duration-300',
            isOpen
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 -rotate-90 opacity-0'
          )}
        >
          <X className="h-6 w-6" strokeWidth={2.2} />
        </span>

        {/* Unread badge */}
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25d366] opacity-50" />
            <span className="relative flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-[#25d366] px-1 text-[11px] font-bold text-white tabular-nums ring-[2.5px] ring-[#111b21]">
              {unread > 99 ? '99+' : unread}
            </span>
          </span>
        )}
      </button>

      {/* ── Panel ───────────────────────────────────────── */}
      {isOpen && (
        <ChatPanel
          session={session}
          onClose={closeChat}
          onUnreadUpdate={setUnread}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((f) => !f)}
          closing={closing}
        />
      )}
    </>
  );
}
