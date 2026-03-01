/**
 * @file EmptyState – Professional empty placeholder for conversation list.
 *
 * @module EmptyState
 */

'use client';

import { MessageCircle, Headphones, Users } from 'lucide-react';

const EMPTY_CONFIG = {
  chat: {
    Icon: MessageCircle,
    title: 'No conversations yet',
    text: 'Start a new conversation by tapping the + button above.',
  },
  groups: {
    Icon: Users,
    title: 'No groups yet',
    text: 'Group chats will appear here once your membership is synced.',
  },
  support: {
    Icon: Headphones,
    title: 'No support tickets',
    text: 'Support requests will appear here when users reach out for help.',
  },
};

export default function EmptyState({ type = 'chat' }) {
  const config = EMPTY_CONFIG[type] || EMPTY_CONFIG.chat;
  const { Icon, title, text } = config;

  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#111b21] px-6 py-16 text-center">
      {/* Icon */}
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#202c33] ring-1 ring-[#2a3942]">
        <Icon className="h-9 w-9 text-[#6b7b8d]" />
      </div>

      <h4 className="text-[15px] font-semibold text-[#e9edef]">{title}</h4>

      <p className="mt-2 max-w-65 text-[13px] leading-relaxed text-[#8696a0]">
        {text}
      </p>

      {/* Decorative line */}
      <div className="mt-6 h-px w-16 bg-linear-to-r from-transparent via-[#2a3942] to-transparent" />
    </div>
  );
}
