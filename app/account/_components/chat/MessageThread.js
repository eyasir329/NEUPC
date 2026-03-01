/**
 * @file MessageThread - WhatsApp-style message thread with wallpaper
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

const POLL_INTERVAL = 3000;
const PAGE_SIZE = 30;

export default function MessageThread({ conversation, session }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const isNearBottom = useRef(true);
  const latestIdRef = useRef(null);
  const pollRef = useRef(null);

  const userId = session?.user?.id;

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
              const existingIds = new Set(prev.map((m) => m.id));
              const newMsgs = fetched.filter((m) => !existingIds.has(m.id));
              if (newMsgs.length === 0) return prev;
              return [...prev, ...newMsgs];
            }
            return fetched;
          });
          if (fetched.length > 0) {
            latestIdRef.current = fetched[fetched.length - 1]?.id;
          }
        } else {
          setMessages((prev) => [...fetched, ...prev]);
        }
        setHasMore(result.hasMore ?? false);
        if (fetched.length > 0 && cursor) {
          setOldestCursor(fetched[0]?.created_at);
        } else if (!cursor && fetched.length > 0) {
          setOldestCursor(fetched[0]?.created_at);
        }
      } catch {
        /* ignore */
      }
    },
    [conversation.id]
  );

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setHasMore(false);
    setOldestCursor(null);
    fetchMessages().finally(() => setLoading(false));
  }, [fetchMessages]);

  useEffect(() => {
    if (conversation.status === 'closed') return;
    pollRef.current = setInterval(() => {
      fetchMessages(null, true);
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages, conversation.status]);

  useEffect(() => {
    if (conversation.id) {
      markConversationReadAction(conversation.id);
    }
  }, [conversation.id, messages.length]);

  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = distFromBottom < 80;
    setShowScrollDown(distFromBottom > 200);
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !oldestCursor) return;
    setLoadingMore(true);
    const el = containerRef.current;
    const prevHeight = el?.scrollHeight || 0;
    await fetchMessages(oldestCursor);
    setLoadingMore(false);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageSent = () => {
    fetchMessages(null, true);
    isNearBottom.current = true;
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const isClosed = conversation.status === 'closed';

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0b141a]">
        <Loader2 className="h-7 w-7 animate-spin text-[#00a884]" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* WhatsApp chat wallpaper */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="wa-wallpaper flex-1 overflow-y-auto px-3 py-2 sm:px-[5%]"
        style={{
          backgroundColor: '#0b141a',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23172028' fill-opacity='0.6'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3Ccircle cx='40' cy='10' r='0.8'/%3E%3Ccircle cx='70' cy='15' r='0.6'/%3E%3Ccircle cx='20' cy='40' r='0.8'/%3E%3Ccircle cx='55' cy='35' r='0.6'/%3E%3Ccircle cx='10' cy='65' r='0.7'/%3E%3Ccircle cx='45' cy='60' r='0.9'/%3E%3Ccircle cx='70' cy='70' r='0.5'/%3E%3Ccircle cx='30' cy='75' r='0.6'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-full bg-[#182229] px-4 py-1.5 text-xs text-[#00a884] shadow transition-colors hover:bg-[#1d2b33] disabled:text-[#8696a0]"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Load older messages'
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="rounded-lg bg-[#182229] px-4 py-2 text-center shadow">
              <p className="text-xs text-[#8696a0]">
                No messages yet. Say hello!
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
                      <span className="rounded-lg bg-[#182229] px-3 py-1 text-xs font-medium text-[#8696a0] shadow">
                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                          weekday: 'short',
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
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollDown && (
        <div className="absolute right-4 bottom-20 z-10">
          <button
            onClick={scrollToBottom}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#202c33] shadow-lg transition-colors hover:bg-[#2a3942]"
          >
            <ChevronDown className="h-5 w-5 text-[#8696a0]" />
          </button>
        </div>
      )}

      {/* Composer */}
      {isClosed ? (
        <div className="bg-[#1a272e] px-4 py-3 text-center text-xs text-[#8696a0]">
          This conversation has been closed.
        </div>
      ) : (
        <MessageComposer
          conversationId={conversation.id}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  );
}
