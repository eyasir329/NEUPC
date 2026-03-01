/**
 * @file MessageThread – Professional message thread with wallpaper.
 *
 * Features:
 * - Chat wallpaper pattern
 * - Date separator pills
 * - Load-more pagination with scroll restoration
 * - Polling for new messages (3 s)
 * - Auto-scroll to bottom on new messages
 * - Scroll-to-bottom FAB with unread count
 * - Closed conversation bar
 *
 * @module MessageThread
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/app/_lib/utils';
import {
  getMessagesAction,
  markConversationReadAction,
} from '@/app/_lib/chat-actions';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import { Loader2, ChevronDown } from 'lucide-react';

const POLL_MS = 5_000;
const PAGE_SIZE = 30;

export default function MessageThread({ conversation, session }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const isNearBottom = useRef(true);
  const pollRef = useRef(null);
  const userId = session?.user?.id;

  /* ── Fetch messages ──────────────────────────────────── */
  const fetchMessages = useCallback(
    async (cursor = null, isPolling = false) => {
      try {
        const result = await getMessagesAction(
          conversation.id,
          cursor,
          PAGE_SIZE
        );
        if (result.error) return;

        const fetched = result.messages || [];
        if (!cursor) {
          setMessages((prev) => {
            if (isPolling && prev.length > 0 && fetched.length > 0) {
              const ids = new Set(prev.map((m) => m.id));
              const newOnes = fetched.filter((m) => !ids.has(m.id));
              if (!newOnes.length) return prev;
              return [...prev, ...newOnes];
            }
            return fetched;
          });
        } else {
          setMessages((prev) => [...fetched, ...prev]);
        }
        setHasMore(result.hasMore ?? false);
        if (fetched.length > 0) {
          setOldestCursor(fetched[0]?.created_at);
        }
      } catch {
        /* ignore */
      }
    },
    [conversation.id]
  );

  /* ── Initial load ────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setHasMore(false);
    setOldestCursor(null);
    fetchMessages().finally(() => setLoading(false));
  }, [fetchMessages]);

  /* ── Polling ─────────────────────────────────────────── */
  useEffect(() => {
    if (conversation.status === 'closed') return;
    pollRef.current = setInterval(() => fetchMessages(null, true), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages, conversation.status]);

  /* ── Mark as read ────────────────────────────────────── */
  useEffect(() => {
    if (conversation.id) markConversationReadAction(conversation.id);
  }, [conversation.id]);

  /* ── Auto-scroll ─────────────────────────────────────── */
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  /* ── Scroll handler ──────────────────────────────────── */
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = dist < 80;
    setShowScrollBtn(dist > 200);
  }, []);

  /* ── Load more ───────────────────────────────────────── */
  const loadMore = async () => {
    if (loadingMore || !hasMore || !oldestCursor) return;
    setLoadingMore(true);
    const el = containerRef.current;
    const prevH = el?.scrollHeight || 0;
    await fetchMessages(oldestCursor);
    setLoadingMore(false);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevH;
    });
  };

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSent = () => {
    fetchMessages(null, true);
    isNearBottom.current = true;
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
      120
    );
  };

  const isClosed = conversation.status === 'closed';

  /* ── Loading state ───────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0b141a]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#00a884]" />
          <p className="text-[11px] text-[#8696a0]">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ── Message area with wallpaper ─────────────────── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 sm:px-[5%]"
        style={{
          backgroundColor: '#0b141a',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23172028' fill-opacity='0.5'%3E%3Ccircle cx='8' cy='8' r='0.8'/%3E%3Ccircle cx='30' cy='5' r='0.5'/%3E%3Ccircle cx='52' cy='12' r='0.6'/%3E%3Ccircle cx='15' cy='32' r='0.7'/%3E%3Ccircle cx='42' cy='28' r='0.4'/%3E%3Ccircle cx='8' cy='52' r='0.6'/%3E%3Ccircle cx='35' cy='48' r='0.7'/%3E%3Ccircle cx='55' cy='55' r='0.5'/%3E%3Ccircle cx='22' cy='58' r='0.4'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Load more */}
        {hasMore && (
          <div className="mb-2 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className={cn(
                'rounded-full px-4 py-1.5 text-[11px] font-medium shadow transition-colors',
                'bg-[#182229] text-[#00a884] ring-1 ring-[#2a3942]',
                'hover:bg-[#1d2b33] disabled:text-[#8696a0]'
              )}
            >
              {loadingMore ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Load older messages'
              )}
            </button>
          </div>
        )}

        {/* Empty */}
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center py-16">
            <div className="rounded-xl bg-[#182229]/80 px-5 py-3 shadow ring-1 ring-[#2a3942]/40">
              <p className="text-center text-[12px] text-[#8696a0]">
                No messages yet — say hello! 👋
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showDate =
                !prev ||
                new Date(msg.created_at).toDateString() !==
                  new Date(prev.created_at).toDateString();
              const isFirstFromSender =
                !prev || prev.sender_id !== msg.sender_id;
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center py-3">
                      <span className="rounded-lg bg-[#182229] px-3 py-1.25 text-[11px] font-medium text-[#8696a0] shadow ring-1 ring-[#2a3942]/40">
                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={msg.sender_id === userId}
                    showTail={isFirstFromSender || showDate}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Scroll-to-bottom button ────────────────────── */}
      {showScrollBtn && (
        <div className="absolute right-4 bottom-18 z-10">
          <button
            onClick={scrollToBottom}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202c33] shadow-lg ring-1 ring-[#2a3942] transition-colors hover:bg-[#2a3942]"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5 text-[#8696a0]" />
          </button>
        </div>
      )}

      {/* ── Composer / Closed bar ──────────────────────── */}
      {isClosed ? (
        <div className="flex items-center justify-center gap-2 bg-[#1a272e] px-4 py-3 text-center">
          <svg
            className="h-4 w-4 text-[#6b7b8d]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v.01M12 12a2 2 0 10-2-2M12 3a9 9 0 110 18 9 9 0 010-18z"
            />
          </svg>
          <p className="text-[12px] text-[#6b7b8d]">
            This conversation has been closed
          </p>
        </div>
      ) : (
        <MessageComposer
          conversationId={conversation.id}
          onMessageSent={handleSent}
        />
      )}
    </div>
  );
}
