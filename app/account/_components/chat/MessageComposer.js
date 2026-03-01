/**
 * @file MessageComposer - WhatsApp-style input bar
 * @module MessageComposer
 */

'use client';

import { useState, useRef } from 'react';
import { cn } from '@/app/_lib/utils';
import { sendMessageAction } from '@/app/_lib/chat-actions';
import { Send, Loader2, Smile } from 'lucide-react';

export default function MessageComposer({ conversationId, onMessageSent }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError('');

    const result = await sendMessageAction(conversationId, trimmed);

    if (result.error) {
      setError(result.error);
      setSending(false);
      return;
    }

    setContent('');
    setSending(false);
    onMessageSent?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[#202c33] px-3 py-2">
      {error && <p className="mb-1.5 text-[11px] text-[#ea4335]">{error}</p>}
      <div className="flex items-end gap-2">
        {/* Emoji placeholder */}
        <button
          className="shrink-0 rounded-full p-2 text-[#8696a0] transition-colors hover:text-[#e9edef]"
          aria-label="Emoji"
          type="button"
        >
          <Smile className="h-6 w-6" />
        </button>

        {/* Input */}
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg border-none bg-[#2a3942] px-3 py-2.5',
              'text-[15px] text-[#d1d7db] placeholder-[#8696a0]',
              'outline-none',
              'max-h-28 overflow-y-auto'
            )}
            style={{ minHeight: '42px' }}
            disabled={sending}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className={cn(
            'flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-full transition-all',
            content.trim() && !sending
              ? 'bg-[#00a884] text-[#111b21] hover:bg-[#06cf9c]'
              : 'text-[#8696a0]'
          )}
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
