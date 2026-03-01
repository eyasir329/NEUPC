/**
 * @file EmptyState - WhatsApp-style empty placeholder
 * @module EmptyState
 */

'use client';

import { MessageSquare, Headphones } from 'lucide-react';

export default function EmptyState({ type = 'chat' }) {
  const isSupport = type === 'support';

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#111b21] px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#202c33]">
        {isSupport ? (
          <Headphones className="h-7 w-7 text-[#8696a0]" />
        ) : (
          <MessageSquare className="h-7 w-7 text-[#8696a0]" />
        )}
      </div>
      <h4 className="text-base font-normal text-[#e9edef]">
        {isSupport ? 'No support tickets' : 'No conversations yet'}
      </h4>
      <p className="mt-2 max-w-60 text-sm text-[#8696a0]">
        {isSupport
          ? 'Support requests from guests will appear here.'
          : 'Tap the + button to start a new chat.'}
      </p>
    </div>
  );
}
